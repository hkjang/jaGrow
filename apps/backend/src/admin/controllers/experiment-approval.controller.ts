import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.strategy';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { Roles } from '../decorators/roles.decorator';
import { ExperimentApprovalService } from '../services/experiment-approval.service';
import { AuditService } from '../services/audit.service';
import {
  ApproveExperimentDto,
  RejectExperimentDto,
  RestoreExperimentDto,
} from '../dto/experiment-approval.dto';

@Controller('admin/experiments')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class ExperimentApprovalController {
  constructor(
    private experimentApprovalService: ExperimentApprovalService,
    private auditService: AuditService,
  ) {}

  @Get('pending')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'PRODUCT_OWNER')
  async getPendingApprovals() {
    return this.experimentApprovalService.getPendingApprovals();
  }

  @Get(':id/history')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'PRODUCT_OWNER')
  async getHistory(@Param('id') experimentId: string) {
    return this.experimentApprovalService.getApprovalHistory(experimentId);
  }

  @Get(':id/diff')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'PRODUCT_OWNER')
  async getDiff(
    @Param('id') experimentId: string,
    @Query('versionA') versionA: number,
    @Query('versionB') versionB: number,
  ) {
    return this.experimentApprovalService.getDiff(
      experimentId,
      Number(versionA),
      Number(versionB),
    );
  }

  @Post(':id/approve')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'PRODUCT_OWNER')
  async approve(
    @Param('id') experimentId: string,
    @Body() dto: ApproveExperimentDto,
    @Req() req: any,
  ) {
    const result = await this.experimentApprovalService.approve(
      experimentId,
      req.user.id,
      dto,
    );

    await this.auditService.log({
      userId: req.user.id,
      action: 'approve',
      resource: 'experiment',
      resourceId: experimentId,
      newValue: { status: 'approved', comment: dto.comment },
    });

    return result;
  }

  @Post(':id/reject')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'PRODUCT_OWNER')
  async reject(
    @Param('id') experimentId: string,
    @Body() dto: RejectExperimentDto,
    @Req() req: any,
  ) {
    const result = await this.experimentApprovalService.reject(
      experimentId,
      req.user.id,
      dto,
    );

    await this.auditService.log({
      userId: req.user.id,
      action: 'reject',
      resource: 'experiment',
      resourceId: experimentId,
      newValue: { status: 'rejected', comment: dto.comment },
    });

    return result;
  }

  @Post(':id/restore')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  async restore(
    @Param('id') experimentId: string,
    @Body() dto: RestoreExperimentDto,
    @Req() req: any,
  ) {
    const result = await this.experimentApprovalService.restoreVersion(
      experimentId,
      dto.version,
    );

    await this.auditService.log({
      userId: req.user.id,
      action: 'restore',
      resource: 'experiment',
      resourceId: experimentId,
      newValue: { restoredVersion: dto.version },
    });

    return result;
  }

  @Post(':id/request-approval')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'PRODUCT_OWNER', 'AD_OPS')
  async requestApproval(
    @Param('id') experimentId: string,
    @Body() specSnapshot: any,
    @Req() req: any,
  ) {
    const result = await this.experimentApprovalService.createApprovalRequest(
      experimentId,
      specSnapshot,
    );

    await this.auditService.log({
      userId: req.user.id,
      action: 'create',
      resource: 'experiment_approval',
      resourceId: result.id,
      newValue: { experimentId, version: result.version },
    });

    return result;
  }
}
