import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ExperimentDiffDto,
  ExperimentDiffResponseDto,
  ApproveExperimentDto,
  RejectExperimentDto,
} from '../dto/experiment-approval.dto';

@Injectable()
export class ExperimentApprovalService {
  constructor(private prisma: PrismaService) {}

  async createApprovalRequest(experimentId: string, specSnapshot: any) {
    // Get latest version
    const latestApproval = await this.prisma.experimentApproval.findFirst({
      where: { experimentId },
      orderBy: { version: 'desc' },
    });

    const newVersion = latestApproval ? latestApproval.version + 1 : 1;

    return this.prisma.experimentApproval.create({
      data: {
        experimentId,
        version: newVersion,
        specSnapshot,
        status: 'pending',
      },
    });
  }

  async getDiff(experimentId: string, versionA: number, versionB: number): Promise<ExperimentDiffResponseDto> {
    const [approvalA, approvalB] = await Promise.all([
      this.prisma.experimentApproval.findFirst({
        where: { experimentId, version: versionA },
      }),
      this.prisma.experimentApproval.findFirst({
        where: { experimentId, version: versionB },
      }),
    ]);

    if (!approvalA || !approvalB) {
      throw new NotFoundException('One or both versions not found');
    }

    const specA = approvalA.specSnapshot as Record<string, any>;
    const specB = approvalB.specSnapshot as Record<string, any>;

    // Calculate differences
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    const allKeys = new Set([...Object.keys(specA), ...Object.keys(specB)]);

    for (const key of allKeys) {
      if (JSON.stringify(specA[key]) !== JSON.stringify(specB[key])) {
        changes.push({
          field: key,
          oldValue: specA[key],
          newValue: specB[key],
        });
      }
    }

    return {
      experimentId,
      versionA,
      versionB,
      changes,
      impactPrediction: {
        estimatedUsers: 0, // TODO: Calculate based on experiment config
        riskLevel: changes.length > 3 ? 'high' : changes.length > 1 ? 'medium' : 'low',
      },
    };
  }

  async approve(experimentId: string, reviewerId: string, dto: ApproveExperimentDto) {
    const latestPending = await this.prisma.experimentApproval.findFirst({
      where: { experimentId, status: 'pending' },
      orderBy: { version: 'desc' },
    });

    if (!latestPending) {
      throw new NotFoundException('No pending approval found');
    }

    return this.prisma.experimentApproval.update({
      where: { id: latestPending.id },
      data: {
        status: 'approved',
        reviewerId,
        comment: dto.comment,
        reviewedAt: new Date(),
      },
    });
  }

  async reject(experimentId: string, reviewerId: string, dto: RejectExperimentDto) {
    const latestPending = await this.prisma.experimentApproval.findFirst({
      where: { experimentId, status: 'pending' },
      orderBy: { version: 'desc' },
    });

    if (!latestPending) {
      throw new NotFoundException('No pending approval found');
    }

    return this.prisma.experimentApproval.update({
      where: { id: latestPending.id },
      data: {
        status: 'rejected',
        reviewerId,
        comment: dto.comment,
        reviewedAt: new Date(),
      },
    });
  }

  async restoreVersion(experimentId: string, version: number) {
    const approval = await this.prisma.experimentApproval.findFirst({
      where: { experimentId, version },
    });

    if (!approval) {
      throw new NotFoundException('Version not found');
    }

    // Create a new approval request with the restored spec
    return this.createApprovalRequest(experimentId, approval.specSnapshot);
  }

  async getApprovalHistory(experimentId: string) {
    return this.prisma.experimentApproval.findMany({
      where: { experimentId },
      orderBy: { version: 'desc' },
    });
  }

  async getPendingApprovals() {
    return this.prisma.experimentApproval.findMany({
      where: { status: 'pending' },
      orderBy: { requestedAt: 'asc' },
    });
  }
}
