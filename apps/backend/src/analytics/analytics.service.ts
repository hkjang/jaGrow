import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getExperimentStats(experimentId: string) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { variations: true },
    });
    if (!experiment) throw new NotFoundException('Experiment not found');

    const results = [];

    for (const variation of experiment.variations) {
      // 1. Count Assignments (Unique Visitors)
      const assignmentCount = await this.prisma.assignment.count({
        where: { variationId: variation.id },
      });

      // 2. Count Conversions (Unique users who triggered ANY event)
      // Note: In real world, we'd filter by specific "Goal" event names.
      // Here we count users who did ANY event after assignment.
      // Simplified: Find assignments -> check if those users have events.
      
      const assignments = await this.prisma.assignment.findMany({
        where: { variationId: variation.id },
        select: { userId: true, timestamp: true },
      });

      let conversionCount = 0;
      for (const assignment of assignments) {
        const hasEvent = await this.prisma.event.findFirst({
          where: {
            userId: assignment.userId,
            timestamp: { gte: assignment.timestamp }, // Event after assignment
          },
        });
        if (hasEvent) conversionCount++;
      }

      results.push({
        variationId: variation.id,
        variationName: variation.name,
        key: variation.key,
        assignments: assignmentCount,
        conversions: conversionCount,
        conversionRate: assignmentCount > 0 ? (conversionCount / assignmentCount) * 100 : 0,
      });
    }

    return {
      experimentId: experiment.id,
      experimentName: experiment.name,
      stats: results,
    };
  }
}
