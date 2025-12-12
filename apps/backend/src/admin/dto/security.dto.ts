import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator';

export class PiiRedactDto {
  @IsString()
  tenantId: string;

  @IsArray()
  @IsString({ each: true })
  fields: string[];

  @IsOptional()
  @IsNumber()
  retentionDays?: number;
}

export class PiiRedactResponseDto {
  jobId: string;
  status: string;
  tenantId: string;
  fields: string[];
  retentionDays: number;
  createdAt: Date;
}

export class SecurityAlertResponseDto {
  id: string;
  alertType: string;
  severity: string;
  source: string;
  description: string;
  metadata?: any;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}

export class ResolveAlertDto {
  @IsOptional()
  @IsString()
  resolutionNote?: string;
}
