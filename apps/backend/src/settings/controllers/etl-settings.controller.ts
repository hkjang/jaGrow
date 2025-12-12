import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EtlSettingsService } from '../services/etl-settings.service';

@Controller('settings/etl')
export class EtlSettingsController {
  constructor(private readonly service: EtlSettingsService) {}

  // =====================
  // EtlSchedule
  // =====================
  @Post('schedules')
  async createSchedule(@Body() data: any) {
    return this.service.createSchedule(data);
  }

  @Get('schedules')
  async findAllSchedules(@Query('tenantId') tenantId?: string) {
    return this.service.findAllSchedules(tenantId);
  }

  @Get('schedules/active')
  async findActiveSchedules(@Query('tenantId') tenantId?: string) {
    return this.service.findActiveSchedules(tenantId);
  }

  @Get('schedules/type/:scheduleType')
  async findSchedulesByType(
    @Param('scheduleType') scheduleType: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.findSchedulesByType(scheduleType, tenantId);
  }

  @Get('schedules/:id')
  async findScheduleById(@Param('id') id: string) {
    return this.service.findScheduleById(id);
  }

  @Put('schedules/:id')
  async updateSchedule(@Param('id') id: string, @Body() data: any) {
    return this.service.updateSchedule(id, data);
  }

  @Delete('schedules/:id')
  async deleteSchedule(@Param('id') id: string) {
    return this.service.deleteSchedule(id);
  }

  // =====================
  // DataQualityRule
  // =====================
  @Post('quality-rules')
  async createDataQualityRule(@Body() data: any) {
    return this.service.createDataQualityRule(data);
  }

  @Get('quality-rules')
  async findAllDataQualityRules(@Query('tenantId') tenantId?: string) {
    return this.service.findAllDataQualityRules(tenantId);
  }

  @Get('quality-rules/active')
  async findActiveDataQualityRules(@Query('tenantId') tenantId?: string) {
    return this.service.findActiveDataQualityRules(tenantId);
  }

  @Get('quality-rules/:id')
  async findDataQualityRuleById(@Param('id') id: string) {
    return this.service.findDataQualityRuleById(id);
  }

  @Put('quality-rules/:id')
  async updateDataQualityRule(@Param('id') id: string, @Body() data: any) {
    return this.service.updateDataQualityRule(id, data);
  }

  @Delete('quality-rules/:id')
  async deleteDataQualityRule(@Param('id') id: string) {
    return this.service.deleteDataQualityRule(id);
  }

  // =====================
  // StoragePolicy
  // =====================
  @Post('storage-policies')
  async createStoragePolicy(@Body() data: any) {
    return this.service.createStoragePolicy(data);
  }

  @Get('storage-policies')
  async findAllStoragePolicies(@Query('tenantId') tenantId?: string) {
    return this.service.findAllStoragePolicies(tenantId);
  }

  @Get('storage-policies/table/:tableName')
  async findStoragePolicyByTable(
    @Param('tableName') tableName: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.findStoragePolicyByTable(tableName, tenantId);
  }

  @Get('storage-policies/:id')
  async findStoragePolicyById(@Param('id') id: string) {
    return this.service.findStoragePolicyById(id);
  }

  @Put('storage-policies/:id')
  async updateStoragePolicy(@Param('id') id: string, @Body() data: any) {
    return this.service.updateStoragePolicy(id, data);
  }

  @Delete('storage-policies/:id')
  async deleteStoragePolicy(@Param('id') id: string) {
    return this.service.deleteStoragePolicy(id);
  }
}
