import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum TenantPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsString()
  orgId: string;

  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @IsOptional()
  isActive?: boolean;
}

export class TenantUsageDto {
  tenantId: string;
  eventsCount: bigint;
  storageBytes: bigint;
  costEstimate: number;
  p95ResponseMs?: number;
  period: {
    from: Date;
    to: Date;
  };
}
