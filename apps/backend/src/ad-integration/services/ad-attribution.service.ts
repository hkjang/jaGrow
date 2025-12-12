import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdAttributionService {
  private readonly logger = new Logger(AdAttributionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processEvent(data: any) {
    const { userId, eventName, properties, ip, userAgent, url } = data;
    const { utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbp, fbc, ttclid } = properties || {};

    // 1. Save standard event
    await this.prisma.event.create({
      data: {
        userId: userId || 'anonymous', // Handle anonymous
        eventName,
        properties: properties || {},
      }
    });

    // 2. If it contains attribution data, save/update attribution record
    if (gclid || fbp || fbc || ttclid || utm_source) {
      this.logger.log(`Attribution data detected for user ${userId}`);
      
      // Save attribution event (The "Click" or "Touch")
      await this.prisma.attributionEvent.create({
        data: {
          userId: userId || null,
          source: utm_source,
          medium: utm_medium,
          campaign: utm_campaign,
          content: utm_content,
          term: utm_term,
          gclid,
          fbp,
          fbc,
          ttclid,
        }
      });
    } else if (userId && eventName) {
      // 3. If NO new attribution data, but we have a User + Event, try to ATTRIBUTE it (Last Touch)
      // This logic runs for "Conversion" type events usually.
      
      const lastTouch = await this.prisma.attributionEvent.findFirst({
        where: { userId: userId },
        orderBy: { timestamp: 'desc' }
      });

      if (lastTouch) {
        this.logger.log(`Attribution Match: User ${userId} event '${eventName}' attributed to ${lastTouch.source}/${lastTouch.medium} (Link ID: ${lastTouch.id})`);
        
        // HERE: We would fire CAPI to the respective platform
        if (lastTouch.source === 'facebook' || lastTouch.fbp) {
           // this.sendToMetaCAPI(eventName, data, lastTouch);
        } else if (lastTouch.source === 'google' || lastTouch.gclid) {
           // this.sendToGoogleOfflineConversions(eventName, data, lastTouch);
        }
      }
    }
    
    // 3. Forward to Platforms (CAPI) - Placeholder
    // if (eventName === 'Purchase') { ... send to Meta CAPI ... }

    return { success: true };
  }
}
