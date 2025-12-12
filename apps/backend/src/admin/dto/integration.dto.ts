import { IsString, IsOptional, IsEnum, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum IntegrationPlatformDto {
  GOOGLE = 'GOOGLE',
  META = 'META',
  TIKTOK = 'TIKTOK',
  NAVER = 'NAVER',
  KAKAO = 'KAKAO',
}

export class IntegrationConnectDto {
  @IsString()
  tenantId: string;

  @IsString()
  oauthCode: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class IntegrationStatusResponseDto {
  id: string;
  tenantId: string;
  platform: string;
  accountId: string;
  tokenStatus: string;
  tokenExpiresAt?: Date;
  lastSyncAt?: Date;
  lastSuccessAt?: Date;
  lastErrorAt?: Date;
  lastErrorMessage?: string;
  permissionScope: string[];
  rateLimitRemaining?: number;
  apiErrorRate: number;
  isActive: boolean;
}
