import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ReportSettingsService } from '../services/report-settings.service';

@Controller('settings/reports')
export class ReportSettingsController {
  constructor(private readonly service: ReportSettingsService) {}

  // =====================
  // KpiDefinition
  // =====================
  @Post('kpis')
  async createKpiDefinition(@Body() data: any) {
    return this.service.createKpiDefinition(data);
  }

  @Get('kpis')
  async findAllKpiDefinitions(@Query('tenantId') tenantId?: string) {
    return this.service.findAllKpiDefinitions(tenantId);
  }

  @Get('kpis/type/:kpiType')
  async findKpiDefinitionByType(
    @Param('kpiType') kpiType: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.findKpiDefinitionByType(kpiType, tenantId);
  }

  @Get('kpis/:id')
  async findKpiDefinitionById(@Param('id') id: string) {
    return this.service.findKpiDefinitionById(id);
  }

  @Put('kpis/:id')
  async updateKpiDefinition(@Param('id') id: string, @Body() data: any) {
    return this.service.updateKpiDefinition(id, data);
  }

  @Delete('kpis/:id')
  async deleteKpiDefinition(@Param('id') id: string) {
    return this.service.deleteKpiDefinition(id);
  }

  // =====================
  // DashboardTemplate
  // =====================
  @Post('dashboard-templates')
  async createDashboardTemplate(@Body() data: any) {
    return this.service.createDashboardTemplate(data);
  }

  @Get('dashboard-templates')
  async findAllDashboardTemplates(@Query('tenantId') tenantId?: string) {
    return this.service.findAllDashboardTemplates(tenantId);
  }

  @Get('dashboard-templates/default')
  async findDefaultDashboardTemplate(@Query('tenantId') tenantId?: string) {
    return this.service.findDefaultDashboardTemplate(tenantId);
  }

  @Get('dashboard-templates/:id')
  async findDashboardTemplateById(@Param('id') id: string) {
    return this.service.findDashboardTemplateById(id);
  }

  @Put('dashboard-templates/:id')
  async updateDashboardTemplate(@Param('id') id: string, @Body() data: any) {
    return this.service.updateDashboardTemplate(id, data);
  }

  @Delete('dashboard-templates/:id')
  async deleteDashboardTemplate(@Param('id') id: string) {
    return this.service.deleteDashboardTemplate(id);
  }

  @Put('dashboard-templates/:id/default')
  async setDefaultDashboardTemplate(
    @Param('id') id: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.setDefaultDashboardTemplate(id, tenantId);
  }

  // =====================
  // ReportSchedule
  // =====================
  @Post('schedules')
  async createReportSchedule(@Body() data: any) {
    return this.service.createReportSchedule(data);
  }

  @Get('schedules')
  async findAllReportSchedules(@Query('tenantId') tenantId?: string) {
    return this.service.findAllReportSchedules(tenantId);
  }

  @Get('schedules/active')
  async findActiveReportSchedules(@Query('tenantId') tenantId?: string) {
    return this.service.findActiveReportSchedules(tenantId);
  }

  @Get('schedules/:id')
  async findReportScheduleById(@Param('id') id: string) {
    return this.service.findReportScheduleById(id);
  }

  @Put('schedules/:id')
  async updateReportSchedule(@Param('id') id: string, @Body() data: any) {
    return this.service.updateReportSchedule(id, data);
  }

  @Delete('schedules/:id')
  async deleteReportSchedule(@Param('id') id: string) {
    return this.service.deleteReportSchedule(id);
  }

  @Post('schedules/:id/send')
  async triggerSend(@Param('id') id: string) {
    return this.service.updateLastSentTime(id);
  }
}
