import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.strategy';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { Roles } from '../decorators/roles.decorator';
import { AuditService } from '../services/audit.service';
import { AuditQueryDto } from '../dto/audit.dto';

@Controller('admin/audit')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AUDITOR')
  async getLogs(@Query() query: AuditQueryDto) {
    return this.auditService.query(query);
  }

  @Get('logs/resource/:resource/:resourceId')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AUDITOR')
  async getByResource(
    @Query('resource') resource: string,
    @Query('resourceId') resourceId: string,
  ) {
    return this.auditService.getByResource(resource, resourceId);
  }

  @Get('logs/user/:userId')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AUDITOR')
  async getByUser(
    @Query('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getByUser(userId, limit);
  }

  @Get('logs/recent/:tenantId')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AUDITOR')
  async getRecentActivity(
    @Query('tenantId') tenantId: string,
    @Query('hours') hours?: number,
  ) {
    return this.auditService.getRecentActivity(tenantId, hours);
  }
}
