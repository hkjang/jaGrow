import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.strategy';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { Roles } from '../decorators/roles.decorator';
import { SecurityService } from '../services/security.service';
import { PiiRedactDto, ResolveAlertDto } from '../dto/security.dto';

@Controller('admin/security')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class SecurityController {
  constructor(private securityService: SecurityService) {}

  // ============================================
  // PII Redaction
  // ============================================

  @Post('redact')
  @Roles('SUPER_ADMIN', 'DATA_OPS')
  async createRedactionJob(@Body() dto: PiiRedactDto) {
    const job = await this.securityService.createRedactionJob(dto);
    return {
      jobId: job.id,
      status: job.status,
      message: 'PII redaction job created',
    };
  }

  @Get('redact/:jobId')
  @Roles('SUPER_ADMIN', 'DATA_OPS')
  async getRedactionJob(@Param('jobId') jobId: string) {
    return this.securityService.getRedactionJob(jobId);
  }

  @Post('redact/:jobId/process')
  @Roles('SUPER_ADMIN')
  async processRedactionJob(@Param('jobId') jobId: string) {
    return this.securityService.processRedactionJob(jobId);
  }

  // ============================================
  // Security Alerts
  // ============================================

  @Get('alerts')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AUDITOR')
  async getAlerts(
    @Query('alertType') alertType?: string,
    @Query('severity') severity?: string,
    @Query('isResolved') isResolved?: string,
    @Query('limit') limit?: number,
  ) {
    return this.securityService.getAlerts({
      alertType,
      severity,
      isResolved: isResolved ? isResolved === 'true' : undefined,
      limit,
    });
  }

  @Get('alerts/summary')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AUDITOR')
  async getAlertsSummary() {
    const [unresolvedCount, bySeverity] = await Promise.all([
      this.securityService.getUnresolvedAlertCount(),
      this.securityService.getAlertsBySeverity(),
    ]);

    return {
      unresolvedCount,
      bySeverity,
    };
  }

  @Put('alerts/:id/resolve')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  async resolveAlert(
    @Param('id') alertId: string,
    @Body() dto: ResolveAlertDto,
    @Req() req: any,
  ) {
    return this.securityService.resolveAlert(
      alertId,
      req.user.id,
      dto.resolutionNote,
    );
  }

  // ============================================
  // Token & Integration Security
  // ============================================

  @Post('check-token-expirations')
  @Roles('SUPER_ADMIN')
  async checkTokenExpirations() {
    const alertCount = await this.securityService.checkTokenExpirations();
    return {
      message: `Checked token expirations, created ${alertCount} alerts`,
      alertCount,
    };
  }
}
