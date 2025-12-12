import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AdPlatformSettingsService } from '../services/ad-platform-settings.service';

@Controller('settings/ad-platforms')
export class AdPlatformSettingsController {
  constructor(private readonly service: AdPlatformSettingsService) {}

  // =====================
  // PlatformConfig
  // =====================
  @Post('configs')
  async createPlatformConfig(@Body() data: any) {
    return this.service.createPlatformConfig(data);
  }

  @Get('configs')
  async findAllPlatformConfigs(@Query('tenantId') tenantId?: string) {
    return this.service.findAllPlatformConfigs(tenantId);
  }

  @Get('configs/:id')
  async findPlatformConfigById(@Param('id') id: string) {
    return this.service.findPlatformConfigById(id);
  }

  @Put('configs/:id')
  async updatePlatformConfig(@Param('id') id: string, @Body() data: any) {
    return this.service.updatePlatformConfig(id, data);
  }

  @Delete('configs/:id')
  async deletePlatformConfig(@Param('id') id: string) {
    return this.service.deletePlatformConfig(id);
  }

  // =====================
  // TrackingConfig
  // =====================
  @Post('tracking')
  async createTrackingConfig(@Body() data: any) {
    return this.service.createTrackingConfig(data);
  }

  @Get('configs/:platformConfigId/tracking')
  async findTrackingConfigsByPlatformId(@Param('platformConfigId') platformConfigId: string) {
    return this.service.findTrackingConfigsByPlatformId(platformConfigId);
  }

  @Get('tracking/:id')
  async findTrackingConfigById(@Param('id') id: string) {
    return this.service.findTrackingConfigById(id);
  }

  @Put('tracking/:id')
  async updateTrackingConfig(@Param('id') id: string, @Body() data: any) {
    return this.service.updateTrackingConfig(id, data);
  }

  @Delete('tracking/:id')
  async deleteTrackingConfig(@Param('id') id: string) {
    return this.service.deleteTrackingConfig(id);
  }

  // =====================
  // BudgetConfig
  // =====================
  @Post('budgets')
  async createBudgetConfig(@Body() data: any) {
    return this.service.createBudgetConfig(data);
  }

  @Get('budgets')
  async findAllBudgetConfigs(@Query('tenantId') tenantId?: string) {
    return this.service.findAllBudgetConfigs(tenantId);
  }

  @Get('budgets/:id')
  async findBudgetConfigById(@Param('id') id: string) {
    return this.service.findBudgetConfigById(id);
  }

  @Put('budgets/:id')
  async updateBudgetConfig(@Param('id') id: string, @Body() data: any) {
    return this.service.updateBudgetConfig(id, data);
  }

  @Delete('budgets/:id')
  async deleteBudgetConfig(@Param('id') id: string) {
    return this.service.deleteBudgetConfig(id);
  }

  @Get('budgets/type/:budgetType')
  async findBudgetConfigByType(
    @Param('budgetType') budgetType: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.findBudgetConfigByType(budgetType, tenantId);
  }
}
