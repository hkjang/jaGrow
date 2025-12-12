import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AIModelSettingsService } from '../services/ai-model-settings.service';

@Controller('settings/ai-models')
export class AIModelSettingsController {
  constructor(private readonly service: AIModelSettingsService) {}

  // =====================
  // AIModelConfig
  // =====================
  @Post('configs')
  async createModelConfig(@Body() data: any) {
    return this.service.createModelConfig(data);
  }

  @Get('configs')
  async findAllModelConfigs(@Query('tenantId') tenantId?: string) {
    return this.service.findAllModelConfigs(tenantId);
  }

  @Get('configs/:id')
  async findModelConfigById(@Param('id') id: string) {
    return this.service.findModelConfigById(id);
  }

  @Put('configs/:id')
  async updateModelConfig(@Param('id') id: string, @Body() data: any) {
    return this.service.updateModelConfig(id, data);
  }

  @Delete('configs/:id')
  async deleteModelConfig(@Param('id') id: string) {
    return this.service.deleteModelConfig(id);
  }

  // =====================
  // AIModelParameter
  // =====================
  @Post('parameters')
  async createParameter(@Body() data: any) {
    return this.service.createParameter(data);
  }

  @Get('configs/:modelConfigId/parameters')
  async findParametersByModelId(@Param('modelConfigId') modelConfigId: string) {
    return this.service.findParametersByModelId(modelConfigId);
  }

  @Put('parameters/:id')
  async updateParameter(@Param('id') id: string, @Body() data: any) {
    return this.service.updateParameter(id, data);
  }

  @Delete('parameters/:id')
  async deleteParameter(@Param('id') id: string) {
    return this.service.deleteParameter(id);
  }

  @Put('configs/:modelConfigId/parameters/:paramName')
  async upsertParameter(
    @Param('modelConfigId') modelConfigId: string,
    @Param('paramName') paramName: string,
    @Body() data: { paramValue: string; paramType: string },
  ) {
    return this.service.upsertParameter(modelConfigId, paramName, data.paramValue, data.paramType);
  }

  // =====================
  // AIModelValidation
  // =====================
  @Post('validations')
  async createValidation(@Body() data: any) {
    return this.service.createValidation(data);
  }

  @Get('validations')
  async findAllValidations(@Query('tenantId') tenantId?: string) {
    return this.service.findAllValidations(tenantId);
  }

  @Get('configs/:modelConfigId/validations')
  async findValidationsByModelId(@Param('modelConfigId') modelConfigId: string) {
    return this.service.findValidationsByModelId(modelConfigId);
  }

  @Get('configs/:modelConfigId/validations/latest')
  async findLatestValidation(@Param('modelConfigId') modelConfigId: string) {
    return this.service.findLatestValidation(modelConfigId);
  }

  @Delete('validations/:id')
  async deleteValidation(@Param('id') id: string) {
    return this.service.deleteValidation(id);
  }

  // =====================
  // AIModelSafety
  // =====================
  @Post('safety')
  async createSafetyRule(@Body() data: any) {
    return this.service.createSafetyRule(data);
  }

  @Get('safety')
  async findAllSafetyRules(@Query('tenantId') tenantId?: string) {
    return this.service.findAllSafetyRules(tenantId);
  }

  @Get('safety/:id')
  async findSafetyRuleById(@Param('id') id: string) {
    return this.service.findSafetyRuleById(id);
  }

  @Put('safety/:id')
  async updateSafetyRule(@Param('id') id: string, @Body() data: any) {
    return this.service.updateSafetyRule(id, data);
  }

  @Delete('safety/:id')
  async deleteSafetyRule(@Param('id') id: string) {
    return this.service.deleteSafetyRule(id);
  }

  @Get('safety/type/:ruleType')
  async findSafetyRulesByType(
    @Param('ruleType') ruleType: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.findSafetyRulesByType(ruleType, tenantId);
  }
}
