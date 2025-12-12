import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum QuotaType {
  EVENTS = 'events',
  STORAGE = 'storage',
  QUERY = 'query',
  API_CALLS = 'api_calls',
}

export enum QuotaPeriod {
  DAILY = 'daily',
  MONTHLY = 'monthly',
}

export class UpdateCostQuotaDto {
  @IsOptional()
  @IsEnum(QuotaType)
  quotaType?: QuotaType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limitValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  alertThreshold?: number;

  @IsOptional()
  @IsEnum(QuotaPeriod)
  period?: QuotaPeriod;

  @IsOptional()
  @IsBoolean()
  isAutoBlock?: boolean;
}

export class CostQuotaResponseDto {
  id: string;
  tenantId: string;
  quotaType: string;
  limitValue: bigint;
  currentValue: bigint;
  usagePercent: number;
  alertThreshold: number;
  period: string;
  periodStartAt: Date;
  isAutoBlock: boolean;
}

export class CostSummaryDto {
  tenantId: string;
  totalCostEstimate: number;
  breakdown: {
    type: string;
    cost: number;
    usage: bigint;
  }[];
  alerts: {
    type: string;
    message: string;
    severity: string;
  }[];
}
