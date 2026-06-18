export type FactCheckInput = {
  title: string;
  hook: string;
  body: string;
  cta?: string;
  category: string;
};

export type FactCheckOutput = {
  factScore: number;
  unsafeClaims: string[];
  correctionNotes: string[];
  requiresHumanReview: boolean;
};

export class FactCheckAgent {
  async check(input: FactCheckInput): Promise<FactCheckOutput> {
    const text = `${input.title} ${input.hook} ${input.body} ${input.cta || ''}`;
    const unsafeClaims: string[] = [];
    const correctionNotes: string[] = [];

    const restrictedPatterns = [
      'guaranteed profit', 'cure disease', 'vote for', 'hate',
      'tribe is better', 'free money guaranteed', 'medical advice', 'legal advice'
    ];

    for (const pattern of restrictedPatterns) {
      if (text.toLowerCase().includes(pattern)) {
        unsafeClaims.push(pattern);
        correctionNotes.push(`Remove or rewrite restricted phrase: ${pattern}`);
      }
    }

    const sensitiveCategories = [
      'politics', 'health', 'finance', 'religion', 'ethnicity',
      'crime', 'children', 'breaking_news', 'legal', 'medical'
    ];

    const requiresHumanReview = sensitiveCategories.includes(
      input.category.toLowerCase()
    );

    const factScore =
      unsafeClaims.length === 0 && !requiresHumanReview ? 0.92 :
      unsafeClaims.length === 0 ? 0.78 : 0.45;

    return {
      factScore,
      unsafeClaims,
      correctionNotes,
      requiresHumanReview,
    };
  }
}
