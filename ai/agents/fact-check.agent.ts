export type FactCheckInput = {
  title: string;
  hook: string;
  body: string;
  cta?: string;
  category: string;
  evidence?: EvidenceSource[];
};

export type EvidenceSource = { title: string; url: string; retrievedAt: string };

export type FactCheckOutput = {
  factScore: number;
  unsafeClaims: string[];
  correctionNotes: string[];
  requiresHumanReview: boolean;
  citations: EvidenceSource[];
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

    const citations = (input.evidence || []).filter((source) => {
      try {
        return new URL(source.url).protocol === 'https:' && !Number.isNaN(Date.parse(source.retrievedAt));
      } catch {
        return false;
      }
    });
    const evidenceRequired = [
      'news', 'breaking_news', 'health', 'finance', 'politics',
      'legal', 'medical', 'education', 'technology',
    ].includes(input.category.toLowerCase());

    const requiresHumanReview = sensitiveCategories.includes(
      input.category.toLowerCase()
    ) || (evidenceRequired && citations.length === 0);

    if (evidenceRequired && citations.length === 0) {
      correctionNotes.push('Add at least one valid HTTPS evidence citation');
    }

    const factScore =
      unsafeClaims.length === 0 && !requiresHumanReview ? 0.92 :
      unsafeClaims.length === 0 ? 0.78 : 0.45;

    return {
      factScore,
      unsafeClaims,
      correctionNotes,
      requiresHumanReview,
      citations,
    };
  }
}
