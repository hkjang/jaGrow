import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.strategy';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { Roles } from '../decorators/roles.decorator';
import { TenantService } from '../services/tenant.service';
import { AuditService } from '../services/audit.service';
import { CreateTenantDto, UpdateTenantDto } from '../dto/tenant.dto';

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class TenantController {
  constructor(
    private tenantService: TenantService,
    private auditService: AuditService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  async create(@Body() dto: CreateTenantDto) {
    const tenant = await this.tenantService.create(dto);
    return {
      tenantId: tenant.id,
      apiKey: tenant.apiKey,
      message: 'Tenant created successfully',
    };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  async findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'DATA_OPS')
  async findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Get(':id/usage')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'DATA_OPS')
  async getUsage(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.tenantService.getUsage(id, fromDate, toDate);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  async delete(@Param('id') id: string) {
    return this.tenantService.delete(id);
  }

  @Post(':id/regenerate-api-key')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  async regenerateApiKey(@Param('id') id: string) {
    const tenant = await this.tenantService.regenerateApiKey(id);
    return {
      tenantId: tenant.id,
      apiKey: tenant.apiKey,
      message: 'API key regenerated successfully',
    };
  }
}
