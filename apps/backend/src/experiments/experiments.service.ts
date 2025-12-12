import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { UpdateExperimentDto } from './dto/update-experiment.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { Experiment, Variation } from '@prisma/client';

@Injectable()
export class ExperimentsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService
  ) {}

  async create(createExperimentDto: CreateExperimentDto) {
    const { variations, ...data } = createExperimentDto;
    return this.prisma.experiment.create({
      data: {
        ...data,
        variations: {
          create: variations,
        },
      },
      include: { variations: true },
    });
  }

  async findAll() {
    return this.prisma.experiment.findMany({
      include: { variations: true },
    });
  }

  async findOne(id: string) {
    const cacheKey = `experiment:${id}`;
    const cached = await this.cacheManager.get<Experiment & { variations: Variation[] }>(cacheKey);
    if (cached) return cached;

    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
      include: { variations: true },
    });
    if (!experiment) throw new NotFoundException(`Experiment not found`);
    
    await this.cacheManager.set(cacheKey, experiment, 3600); // 1 hour TTL
    return experiment;
  }

  async update(id: string, updateExperimentDto: UpdateExperimentDto) {
    const { variations, ...data } = updateExperimentDto;
    const updated = await this.prisma.experiment.update({
      where: { id },
      data: data,
    });
    await this.cacheManager.del(`experiment:${id}`);
    return updated;
  }

  async remove(id: string) {
    await this.cacheManager.del(`experiment:${id}`);
    return this.prisma.experiment.delete({ where: { id } });
  }

  // Core Logic: Deterministic Assignment
  async assign(experimentId: string, userId: string) {
    const cacheKey = `assignment:${experimentId}:${userId}`;
    const cachedAssignment = await this.cacheManager.get<Variation>(cacheKey);
    if (cachedAssignment) return cachedAssignment;

    // 1. Check existing assignment (DB)
    const existing = await this.prisma.assignment.findUnique({
      where: {
        userId_experimentId: { userId, experimentId },
      },
      include: { variation: true },
    });
    if (existing) {
        await this.cacheManager.set(cacheKey, existing.variation, 3600);
        return existing.variation;
    }

    // 2. Fetch experiment and variations
    const experiment = await this.findOne(experimentId);
    if (experiment.status !== 'RUNNING') {
        // Return control or null if not running. For now returning first variation (usually control)
        return experiment.variations[0]; 
    }

    // 3. Traffic Allocation Check
    // Hash(userId + experimentId + "traffic") % 100 < trafficAllocation
    if (!this.isUserInTraffic(userId, experiment.id, experiment.trafficAllocation)) {
        return null; // Not tracked
    }

    // 4. Variant Selection
    const selectedVariation = this.selectVariation(userId, experiment);

    // 5. Store Assignment (Async or sync depending on requirement, usually async for performance but here sync for correctness)
    await this.prisma.assignment.create({
      data: {
        userId,
        experimentId,
        variationId: selectedVariation.id,
      },
    });

    return selectedVariation;
  }

  private isUserInTraffic(userId: string, experimentId: string, allocation: number): boolean {
    const hash = crypto.createHash('md5').update(`${userId}:${experimentId}:traffic`).digest('hex');
    const val = parseInt(hash.substring(0, 8), 16) % 100;
    return val < allocation;
  }

  private selectVariation(userId: string, experiment: any): any {
    const hash = crypto.createHash('md5').update(`${userId}:${experiment.salt}`).digest('hex');
    const val = parseInt(hash.substring(0, 8), 16) % 100; // 0-99

    let cumulativeWeight = 0;
    for (const variation of experiment.variations) {
      cumulativeWeight += variation.weight;
      if (val < cumulativeWeight) {
        return variation;
      }
    }
    return experiment.variations[0]; // Fallback
  }
}
