import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.strategy';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { Roles } from '../decorators/roles.decorator';
import { RuleSimulatorService } from '../services/rule-simulator.service';
import { RuleSimulateDto } from '../dto/rule-simulator.dto';

@Controller('admin/rules')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class RuleSimulatorController {
  constructor(private ruleSimulatorService: RuleSimulatorService) {}

  @Post('simulate')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AD_OPS', 'DATA_OPS')
  async simulate(@Body() dto: RuleSimulateDto) {
    return this.ruleSimulatorService.simulate(dto);
  }

  @Get(':id/impact')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AD_OPS', 'DATA_OPS')
  async getImpact(@Param('id') ruleId: string) {
    return this.ruleSimulatorService.getImpact(ruleId);
  }

  @Post('validate')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AD_OPS')
  async validate(@Body() body: { conditions: any[]; actions: any[] }) {
    return this.ruleSimulatorService.validateRule(body.conditions, body.actions);
  }
}
