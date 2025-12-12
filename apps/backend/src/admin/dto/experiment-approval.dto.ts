import { IsString, IsOptional, IsObject } from 'class-validator';

export class ExperimentDiffDto {
  experimentId: string;
  versionA: number;
  versionB: number;
}

export class ExperimentDiffResponseDto {
  experimentId: string;
  versionA: number;
  versionB: number;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  impactPrediction?: {
    estimatedUsers: number;
    riskLevel: string;
  };
}

export class ApproveExperimentDto {
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectExperimentDto {
  @IsString()
  comment: string;
}

export class RestoreExperimentDto {
  @IsString()
  experimentId: string;

  version: number;
}
