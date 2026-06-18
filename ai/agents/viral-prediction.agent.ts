export type ViralPredictionInput = {
  category: string;
  hook: string;
  body: string;
  qualityScore: number;
  factScore: number;
  safetyLevel: 'normal' | 'sensitive' | 'restricted';
};

export type ViralPredictionOutput = {
  viralProbability: number;
  engagementScore: number;
  watchTimeScore: number;
  shareScore: number;
  commentScore: number;
  qualityScore: number;
};

export class ViralPredictionAgent {
  async score(input: ViralPredictionInput): Promise<ViralPredictionOutput> {
    const hookScore = this.scoreHook(input.hook);
    const categoryBoost = this.categoryBoost(input.category);
    const safetyPenalty = input.safetyLevel === 'sensitive' ? 0.08 : 0;

    const viralProbability = this.clamp(
      input.qualityScore * 0.35 +
      input.factScore * 0.20 +
      hookScore * 0.25 +
      categoryBoost -
      safetyPenalty
    );

    return {
      viralProbability,
      engagementScore: this.clamp(viralProbability + 0.04),
      watchTimeScore: this.clamp(input.qualityScore * 0.5 + hookScore * 0.5),
      shareScore: this.clamp(viralProbability - 0.03),
      commentScore: this.clamp(viralProbability - 0.08),
      qualityScore: this.clamp(input.qualityScore),
    };
  }

  private scoreHook(hook: string): number {
    const strongHookPhrases = [
      'listen', 'need to know', 'before you', 'this one skill',
      'did you know', 'worth knowing'
    ];
    const lowerHook = hook.toLowerCase();
    const matched = strongHookPhrases.some((phrase) => lowerHook.includes(phrase));
    return matched ? 0.85 : 0.72;
  }

  private categoryBoost(category: string): number {
    const map: Record<string, number> = {
      comedy: 0.12,
      career: 0.10,
      business: 0.08,
      campus: 0.09,
      motivation: 0.07,
      technology: 0.08,
      trivia: 0.11,
      news: 0.04,
    };
    return map[category.toLowerCase()] || 0.06;
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
  }
}
