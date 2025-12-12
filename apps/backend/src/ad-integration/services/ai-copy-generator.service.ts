import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

export interface GeneratedCopy {
  headline: string;
  description: string;
  callToAction: string;
  variations: string[];
  targetAudience: string;
  tone: string;
}

@Injectable()
export class AICopyGeneratorService {
  private readonly logger = new Logger(AICopyGeneratorService.name);
  private readonly openaiApiKey = process.env.OPENAI_API_KEY;
  private readonly openaiEndpoint = 'https://api.openai.com/v1/chat/completions';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate ad copy using AI
   */
  async generateAdCopy(params: {
    product: string;
    targetAudience: string;
    platform: 'google' | 'meta' | 'tiktok' | 'naver' | 'kakao';
    tone: 'professional' | 'casual' | 'urgent' | 'friendly' | 'luxury';
    keywords?: string[];
    promotionDetails?: string;
  }): Promise<GeneratedCopy | null> {
    try {
      const prompt = this.buildCopyPrompt(params);

      const response = await axios.post(
        this.openaiEndpoint,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert advertising copywriter specializing in ${params.platform} ads. Generate compelling ad copy in Korean that drives conversions.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0]?.message?.content;
      return this.parseCopyResponse(content, params);
    } catch (error: any) {
      this.logger.error(`AI copy generation failed: ${error.message}`);
      return this.generateFallbackCopy(params);
    }
  }

  private buildCopyPrompt(params: any): string {
    const platformGuidelines: Record<string, string> = {
      google: '헤드라인 30자 이내, 설명 90자 이내',
      meta: '메인 텍스트 125자 이내, 헤드라인 40자 이내',
      tiktok: '훅 강조, 짧고 임팩트 있게, 10초 내 집중',
      naver: '검색 키워드 포함, 신뢰성 강조',
      kakao: '친근한 톤, 이모지 사용 가능',
    };

    return `
제품/서비스: ${params.product}
타겟 고객: ${params.targetAudience}
플랫폼: ${params.platform}
가이드라인: ${platformGuidelines[params.platform]}
톤앤매너: ${params.tone}
${params.keywords ? `키워드: ${params.keywords.join(', ')}` : ''}
${params.promotionDetails ? `프로모션: ${params.promotionDetails}` : ''}

위 조건에 맞는 광고 문구를 생성해주세요. 다음 형식으로 응답해주세요:
HEADLINE: [헤드라인]
DESCRIPTION: [설명 텍스트]
CTA: [Call to Action 버튼 텍스트]
VARIATION1: [대체 헤드라인 1]
VARIATION2: [대체 헤드라인 2]
VARIATION3: [대체 헤드라인 3]
`;
  }

  private parseCopyResponse(content: string, params: any): GeneratedCopy {
    const lines = content.split('\n');
    const parsed: any = {};

    for (const line of lines) {
      if (line.startsWith('HEADLINE:')) parsed.headline = line.replace('HEADLINE:', '').trim();
      if (line.startsWith('DESCRIPTION:')) parsed.description = line.replace('DESCRIPTION:', '').trim();
      if (line.startsWith('CTA:')) parsed.callToAction = line.replace('CTA:', '').trim();
      if (line.startsWith('VARIATION')) {
        parsed.variations = parsed.variations || [];
        parsed.variations.push(line.split(':')[1]?.trim());
      }
    }

    return {
      headline: parsed.headline || '지금 바로 시작하세요',
      description: parsed.description || '최고의 제품을 만나보세요',
      callToAction: parsed.callToAction || '자세히 보기',
      variations: parsed.variations || [],
      targetAudience: params.targetAudience,
      tone: params.tone,
    };
  }

  private generateFallbackCopy(params: any): GeneratedCopy {
    const templates: Record<string, any> = {
      professional: {
        headline: `${params.product} - 전문가의 선택`,
        description: `최고의 품질과 서비스로 ${params.targetAudience}를 위한 솔루션을 제공합니다.`,
        cta: '견적 받기',
      },
      casual: {
        headline: `${params.product} 써봤어? 👀`,
        description: `${params.targetAudience}가 좋아하는 그것! 지금 확인해보세요.`,
        cta: '구경하기',
      },
      urgent: {
        headline: `⚡ ${params.product} 마감 임박!`,
        description: `${params.promotionDetails || '한정 특가'} - 놓치지 마세요!`,
        cta: '지금 구매',
      },
      friendly: {
        headline: `${params.product}로 시작하는 새로운 일상`,
        description: `${params.targetAudience}를 위한 맞춤 추천을 받아보세요.`,
        cta: '시작하기',
      },
      luxury: {
        headline: `${params.product} - 프리미엄 컬렉션`,
        description: `특별한 가치를 추구하는 ${params.targetAudience}를 위한 선택.`,
        cta: '컬렉션 보기',
      },
    };

    const template = templates[params.tone] || templates.professional;

    return {
      headline: template.headline,
      description: template.description,
      callToAction: template.cta,
      variations: [
        template.headline.replace(params.product, `NEW ${params.product}`),
        template.headline.replace(params.product, `BEST ${params.product}`),
      ],
      targetAudience: params.targetAudience,
      tone: params.tone,
    };
  }

  /**
   * Generate multiple copy variations for A/B testing
   */
  async generateABTestVariations(
    baseCopy: GeneratedCopy,
    numVariations: number = 3,
  ): Promise<GeneratedCopy[]> {
    const variations: GeneratedCopy[] = [baseCopy];

    // Generate variations by modifying tone and emphasis
    const toneVariations = ['urgent', 'friendly', 'professional'];

    for (let i = 0; i < Math.min(numVariations, toneVariations.length); i++) {
      if (toneVariations[i] !== baseCopy.tone) {
        const variation = await this.generateAdCopy({
          product: baseCopy.headline.split('-')[0]?.trim() || 'Product',
          targetAudience: baseCopy.targetAudience,
          platform: 'meta',
          tone: toneVariations[i] as any,
        });
        if (variation) variations.push(variation);
      }
    }

    return variations;
  }

  /**
   * Analyze copy performance and suggest improvements
   */
  async analyzeCopyPerformance(
    copyText: string,
    metrics: { ctr: number; conversionRate: number },
  ): Promise<{ score: number; suggestions: string[] }> {
    const suggestions: string[] = [];
    let score = 70; // Base score

    // Length analysis
    if (copyText.length > 100) {
      suggestions.push('문구가 너무 깁니다. 50자 이내로 줄여보세요.');
      score -= 10;
    }

    // Performance-based suggestions
    if (metrics.ctr < 1) {
      suggestions.push('CTR이 낮습니다. 더 강력한 훅이나 수치를 추가해보세요.');
      score -= 10;
    }

    if (metrics.conversionRate < 2) {
      suggestions.push('전환율이 낮습니다. CTA를 더 명확하게 바꿔보세요.');
      score -= 10;
    }

    // Keyword analysis
    const powerWords = ['무료', '한정', '지금', '특가', 'NEW', '베스트'];
    const hasPowerWord = powerWords.some(word => copyText.includes(word));
    if (!hasPowerWord) {
      suggestions.push('파워 워드(무료, 한정, 특가 등)를 추가해보세요.');
    } else {
      score += 10;
    }

    return { score: Math.max(0, Math.min(100, score)), suggestions };
  }
}
