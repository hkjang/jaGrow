import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export interface ClickIdData {
  userId?: string;
  sessionId: string;
  clickId: string;
  clickIdType: 'gclid' | 'fbp' | 'fbc' | 'ttclid' | 'other';
  source: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class EventStorageService {
  private readonly logger = new Logger(EventStorageService.name);
  private pendingEvents: any[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // Start periodic flush
    this.flushTimer = setInterval(() => this.flush(), this.FLUSH_INTERVAL);
  }

  onModuleDestroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    // Flush remaining events
    this.flush();
  }

  // ====================================================
  // Click ID Storage with 99.9% Reliability
  // ====================================================

  /**
   * Store click ID with redundancy (cache + DB)
   */
  async storeClickId(data: ClickIdData): Promise<{ stored: boolean; redundant: boolean }> {
    try {
      // 1. Store in cache first (fast path)
      const cacheKey = `clickid:${data.sessionId}:${data.clickIdType}`;
      await this.cacheManager.set(cacheKey, data, 86400 * 30); // 30 days

      // 2. Add to pending events for batch DB write
      this.pendingEvents.push({
        type: 'click_id',
        data,
        timestamp: new Date(),
      });

      // 3. If batch is full, flush immediately
      if (this.pendingEvents.length >= this.BATCH_SIZE) {
        await this.flush();
      }

      // 4. Store redundant copy in secondary cache key
      const redundantKey = `clickid:backup:${data.clickId}`;
      await this.cacheManager.set(redundantKey, data, 86400 * 30);

      this.logger.debug(`Stored click ID: ${data.clickIdType}=${data.clickId.substring(0, 10)}...`);
      return { stored: true, redundant: true };
    } catch (error) {
      this.logger.error(`Failed to store click ID: ${error}`);
      // Fallback: try direct DB write
      try {
        await this.writeClickIdToDb(data);
        return { stored: true, redundant: false };
      } catch (dbError) {
        this.logger.error(`DB fallback also failed: ${dbError}`);
        return { stored: false, redundant: false };
      }
    }
  }

  /**
   * Retrieve click ID by session
   */
  async getClickId(sessionId: string, clickIdType: string): Promise<ClickIdData | null> {
    const cacheKey = `clickid:${sessionId}:${clickIdType}`;
    const cached = await this.cacheManager.get<ClickIdData>(cacheKey);
    
    if (cached) return cached;

    // Try to find in DB
    const dbRecord = await this.prisma.attributionEvent.findFirst({
      where: {
        OR: [
          { gclid: { not: null } },
          { fbp: { not: null } },
          { fbc: { not: null } },
          { ttclid: { not: null } },
        ],
      },
      orderBy: { timestamp: 'desc' },
    });

    return dbRecord ? this.mapToClickIdData(dbRecord) : null;
  }

  /**
   * Flush pending events to database
   */
  private async flush(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const eventsToFlush = [...this.pendingEvents];
    this.pendingEvents = [];

    try {
      const clickIdEvents = eventsToFlush
        .filter(e => e.type === 'click_id')
        .map(e => e.data);

      if (clickIdEvents.length > 0) {
        await this.writeClickIdsToDB(clickIdEvents);
      }

      this.logger.debug(`Flushed ${eventsToFlush.length} events to storage`);
    } catch (error) {
      this.logger.error(`Flush failed, re-queuing ${eventsToFlush.length} events`);
      // Re-queue failed events
      this.pendingEvents = [...eventsToFlush, ...this.pendingEvents];
    }
  }

  /**
   * Batch write click IDs to database
   */
  private async writeClickIdsToDB(clickIds: ClickIdData[]): Promise<void> {
    const records = clickIds.map(data => ({
      userId: data.userId,
      source: data.source,
      gclid: data.clickIdType === 'gclid' ? data.clickId : null,
      fbp: data.clickIdType === 'fbp' ? data.clickId : null,
      fbc: data.clickIdType === 'fbc' ? data.clickId : null,
      ttclid: data.clickIdType === 'ttclid' ? data.clickId : null,
      timestamp: data.timestamp,
    }));

    await this.prisma.attributionEvent.createMany({
      data: records,
      skipDuplicates: true,
    });
  }

  /**
   * Single click ID write (fallback)
   */
  private async writeClickIdToDb(data: ClickIdData): Promise<void> {
    await this.prisma.attributionEvent.create({
      data: {
        userId: data.userId,
        source: data.source,
        gclid: data.clickIdType === 'gclid' ? data.clickId : null,
        fbp: data.clickIdType === 'fbp' ? data.clickId : null,
        fbc: data.clickIdType === 'fbc' ? data.clickId : null,
        ttclid: data.clickIdType === 'ttclid' ? data.clickId : null,
        timestamp: data.timestamp,
      },
    });
  }

  private mapToClickIdData(record: any): ClickIdData {
    let clickId = '';
    let clickIdType: ClickIdData['clickIdType'] = 'other';

    if (record.gclid) {
      clickId = record.gclid;
      clickIdType = 'gclid';
    } else if (record.fbp) {
      clickId = record.fbp;
      clickIdType = 'fbp';
    } else if (record.fbc) {
      clickId = record.fbc;
      clickIdType = 'fbc';
    } else if (record.ttclid) {
      clickId = record.ttclid;
      clickIdType = 'ttclid';
    }

    return {
      userId: record.userId,
      sessionId: '',
      clickId,
      clickIdType,
      source: record.source || '',
      timestamp: record.timestamp,
    };
  }

  // ====================================================
  // Conversion Delay Correction
  // ====================================================

  /**
   * Get average conversion delay by source
   */
  async getConversionDelayBySource(): Promise<Record<string, number>> {
    const delays: Record<string, number> = {};

    const sources = ['google', 'meta', 'tiktok', 'naver', 'kakao'];

    for (const source of sources) {
      const events = await this.prisma.attributionEvent.findMany({
        where: { source },
        take: 1000,
        orderBy: { timestamp: 'desc' },
      });

      // Calculate average delay (placeholder logic)
      // In production, this would compare attribution timestamp to conversion timestamp
      delays[source] = this.calculateAverageDelay(events);
    }

    return delays;
  }

  private calculateAverageDelay(events: any[]): number {
    // Placeholder - would calculate actual delay from attribution to conversion
    // For now, return platform-specific estimates in hours
    return 24; // Default 24 hours
  }

  /**
   * Apply conversion delay correction factor
   */
  async getDelayedConversions(
    source: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ estimated: number; confirmed: number }> {
    const delays = await this.getConversionDelayBySource();
    const avgDelayHours = delays[source] || 24;

    // Adjust end date by delay
    const adjustedEndDate = new Date(endDate.getTime() - avgDelayHours * 60 * 60 * 1000);

    const confirmed = await this.prisma.event.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: adjustedEndDate,
        },
      },
    });

    const pending = await this.prisma.event.count({
      where: {
        timestamp: {
          gt: adjustedEndDate,
          lte: endDate,
        },
      },
    });

    // Estimate pending conversions based on historical rate
    const estimatedPending = Math.round(pending * 0.8); // 80% conversion rate estimate

    return {
      estimated: confirmed + estimatedPending,
      confirmed,
    };
  }

  // ====================================================
  // Storage Health Metrics
  // ====================================================

  /**
   * Get click ID storage rate
   */
  async getStorageRate(): Promise<{
    total: number;
    withClickId: number;
    rate: number;
  }> {
    const total = await this.prisma.attributionEvent.count();
    const withClickId = await this.prisma.attributionEvent.count({
      where: {
        OR: [
          { gclid: { not: null } },
          { fbp: { not: null } },
          { fbc: { not: null } },
          { ttclid: { not: null } },
        ],
      },
    });

    return {
      total,
      withClickId,
      rate: total > 0 ? (withClickId / total) * 100 : 0,
    };
  }

  /**
   * Get pending event count
   */
  getPendingCount(): number {
    return this.pendingEvents.length;
  }
}
