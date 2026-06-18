export type ContentStrategyInput = {
  topic: string;
  category: string;
  region?: string | null;
  country?: string | null;
  audience?: string;
};

export type ContentStrategyOutput = {
  format: 'short_video';
  tone: string;
  targetAudience: string;
  durationSeconds: number;
  structure: string[];
  safetyLevel: 'normal' | 'sensitive' | 'restricted';
};

export class ContentStrategyAgent {
  async plan(input: ContentStrategyInput): Promise<ContentStrategyOutput> {
    const sensitiveCategories = [
      'politics', 'health', 'finance', 'religion', 'ethnicity',
      'crime', 'children', 'breaking_news', 'legal', 'medical'
    ];

    const isSensitive = sensitiveCategories.includes(
      input.category.toLowerCase()
    );

    return {
      format: 'short_video',
      tone: this.resolveTone(input.category),
      targetAudience: input.audience || 'African youth, students, creators, job seekers, and small business owners',
      durationSeconds: this.resolveDuration(input.category),
      structure: ['hook', 'main_point_1', 'main_point_2', 'main_point_3', 'cta'],
      safetyLevel: isSensitive ? 'sensitive' : 'normal',
    };
  }

  private resolveTone(category: string): string {
    const map: Record<string, string> = {
      comedy: 'funny, local, warm, non-offensive',
      career: 'motivational, practical, clear',
      business: 'smart, practical, opportunity-focused',
      campus: 'youthful, relatable, energetic',
      motivation: 'uplifting, bold, positive',
      technology: 'simple, futuristic, exciting',
      news: 'calm, factual, neutral',
    };
    return map[category.toLowerCase()] || 'friendly, clear, entertaining';
  }

  private resolveDuration(category: string): number {
    const map: Record<string, number> = {
      comedy: 30,
      trivia: 20,
      motivation: 30,
      career: 45,
      business: 45,
      campus: 35,
      technology: 45,
      news: 60,
    };
    return map[category.toLowerCase()] || 45;
  }
}
