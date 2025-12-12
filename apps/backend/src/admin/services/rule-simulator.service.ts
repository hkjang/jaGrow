import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RuleSimulateDto, RuleSimulateResponseDto, RuleImpactDto } from '../dto/rule-simulator.dto';

interface RuleCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
}

interface RuleAction {
  type: string;
  params: Record<string, any>;
}

@Injectable()
export class RuleSimulatorService {
  private readonly logger = new Logger(RuleSimulatorService.name);

  constructor(private prisma: PrismaService) {}

  async simulate(dto: RuleSimulateDto): Promise<RuleSimulateResponseDto> {
    const rule = await this.prisma.optimizationRule.findUnique({
      where: { id: dto.ruleId },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    const conditions = rule.conditions as unknown as RuleCondition[];
    const actions = rule.actions as unknown as RuleAction[];

    // Simulate rule against sample events
    let matchedEvents = 0;
    const suggestedActions: { action: string; targetId: string; params: any }[] = [];

    for (const event of dto.sampleEvents) {
      if (this.evaluateConditions(event, conditions)) {
        matchedEvents++;
        
        for (const action of actions) {
          suggestedActions.push({
            action: action.type,
            targetId: event.id || 'unknown',
            params: action.params,
          });
        }
      }
    }

    return {
      ruleId: dto.ruleId,
      matchedEvents,
      totalEvents: dto.sampleEvents.length,
      suggestedActions,
      estimatedImpact: {
        affectedCampaigns: suggestedActions.length,
        estimatedBudgetChange: this.calculateBudgetImpact(suggestedActions),
        riskLevel: this.calculateRiskLevel(matchedEvents, dto.sampleEvents.length),
      },
    };
  }

  private evaluateConditions(event: any, conditions: RuleCondition[]): boolean {
    return conditions.every((condition) => {
      const value = event[condition.metric];
      if (value === undefined) return false;

      switch (condition.operator) {
        case 'gt':
          return value > condition.value;
        case 'lt':
          return value < condition.value;
        case 'eq':
          return value === condition.value;
        case 'gte':
          return value >= condition.value;
        case 'lte':
          return value <= condition.value;
        default:
          return false;
      }
    });
  }

  private calculateBudgetImpact(actions: { action: string; params: any }[]): number {
    let totalChange = 0;
    for (const action of actions) {
      if (action.action === 'increase_budget') {
        totalChange += action.params.amount || 0;
      } else if (action.action === 'decrease_budget') {
        totalChange -= action.params.amount || 0;
      }
    }
    return totalChange;
  }

  private calculateRiskLevel(matched: number, total: number): string {
    const ratio = total > 0 ? matched / total : 0;
    if (ratio > 0.5) return 'high';
    if (ratio > 0.2) return 'medium';
    return 'low';
  }

  async getImpact(ruleId: string): Promise<RuleImpactDto> {
    const rule = await this.prisma.optimizationRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    // Get historical triggers
    const logs = await this.prisma.optimizationLog.findMany({
      where: { ruleId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Group by resource type
    const resourceGroups = new Map<string, Set<string>>();
    for (const log of logs) {
      const type = log.campaignId ? 'campaign' : log.adGroupId ? 'adGroup' : log.adId ? 'ad' : 'unknown';
      const id = log.campaignId || log.adGroupId || log.adId || 'unknown';
      
      if (!resourceGroups.has(type)) {
        resourceGroups.set(type, new Set());
      }
      resourceGroups.get(type)!.add(id);
    }

    const affectedResources = Array.from(resourceGroups.entries()).map(([type, ids]) => ({
      type,
      count: ids.size,
      ids: Array.from(ids),
    }));

    return {
      ruleId,
      affectedResources,
      historicalTriggers: rule.triggerCount,
      lastTriggeredAt: rule.lastTriggeredAt ?? undefined,
    };
  }

  async validateRule(conditions: RuleCondition[], actions: RuleAction[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate conditions
    for (const condition of conditions) {
      if (!condition.metric) {
        errors.push('Condition missing metric field');
      }
      if (!['gt', 'lt', 'eq', 'gte', 'lte'].includes(condition.operator)) {
        errors.push(`Invalid operator: ${condition.operator}`);
      }
      if (typeof condition.value !== 'number') {
        errors.push(`Invalid value type for metric ${condition.metric}`);
      }
    }

    // Validate actions
    const validActionTypes = ['pause_low_performer', 'increase_budget', 'decrease_budget', 'expand_creative'];
    for (const action of actions) {
      if (!validActionTypes.includes(action.type)) {
        errors.push(`Invalid action type: ${action.type}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
