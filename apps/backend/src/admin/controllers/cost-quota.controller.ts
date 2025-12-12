import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.strategy';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { Roles } from '../decorators/roles.decorator';
import { CostQuotaService } from '../services/cost-quota.service';
import { UpdateCostQuotaDto } from '../dto/cost-quota.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class CostQuotaController {
  constructor(private costQuotaService: CostQuotaService) {}

  @Get('costs/:tenantId')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'DATA_OPS')
  async getCostSummary(@Param('tenantId') tenantId: string) {
    return this.costQuotaService.getCostSummary(tenantId);
  }

  @Get('quotas/:tenantId')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'DATA_OPS')
  async getQuotas(@Param('tenantId') tenantId: string) {
    return this.costQuotaService.getQuotas(tenantId);
  }

  @Put('quotas/:tenantId')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  async setQuota(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateCostQuotaDto,
  ) {
    return this.costQuotaService.setQuota(tenantId, dto);
  }

  @Get('quotas/:tenantId/alerts')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'DATA_OPS')
  async checkAlerts(@Param('tenantId') tenantId: string) {
    return this.costQuotaService.checkAlerts(tenantId);
  }
}
