import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class RuleSimulateDto {
  @IsString()
  ruleId: string;

  @IsArray()
  sampleEvents: any[];
}

export class RuleSimulateResponseDto {
  ruleId: string;
  matchedEvents: number;
  totalEvents: number;
  suggestedActions: {
    action: string;
    targetId: string;
    params: any;
  }[];
  estimatedImpact: {
    affectedCampaigns: number;
    estimatedBudgetChange: number;
    riskLevel: string;
  };
}

export class RuleImpactDto {
  ruleId: string;
  affectedResources: {
    type: string;
    count: number;
    ids: string[];
  }[];
  historicalTriggers: number;
  lastTriggeredAt?: Date;
}
