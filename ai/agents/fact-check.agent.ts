import { callYohPalBrain } from '../providers/yohpal-brain/client';

export type FactCheckInput = {
  title: string;
  hook: string;
  body: string;
  cta?: string;
  category: string;
  evidence?: EvidenceSource[];
};

export type EvidenceSource = { title: string; url: string; retrievedAt: string };
export type ClaimEntailment = {
  claim: string;
  supported: boolean;
  confidence: number;
  citationUrls: string[];
};
export type EntailmentChecker = (
  claims: string[], evidence: EvidenceSource[]
) => Promise<ClaimEntailment[]>;

export type FactCheckOutput = {
  factScore: number;
  unsafeClaims: string[];
  correctionNotes: string[];
  requiresHumanReview: boolean;
  citations: EvidenceSource[];
  claimEntailments: ClaimEntailment[];
};

const evidenceCategories = [
  'news', 'breaking_news', 'health', 'finance', 'politics',
  'legal', 'medical', 'education', 'technology',
];

export function extractClaims(input: FactCheckInput): string[] {
  return [input.title, input.hook, input.body]
    .flatMap((part) => part.split(/(?<=[.!?])\s+|\n+/))
    .map((claim) => claim.trim())
    .filter((claim) => claim.length >= 8);
}

async function providerEntailment(claims: string[], evidence: EvidenceSource[]): Promise<ClaimEntailment[]> {
  if (process.env.FACT_CHECK_PROVIDER !== 'yohpal_brain') return [];
  return callYohPalBrain<ClaimEntailment[]>('/v1/fact-check/entailment', { claims, evidence });
}

export class FactCheckAgent {
  constructor(private readonly entailmentChecker: EntailmentChecker = providerEntailment) {}

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

    const category = input.category.toLowerCase();
    const sensitive = [
      'politics', 'health', 'finance', 'religion', 'ethnicity',
      'crime', 'children', 'breaking_news', 'legal', 'medical'
    ].includes(category);
    const citations = (input.evidence || []).filter((source) => {
      try {
        return new URL(source.url).protocol === 'https:' && !Number.isNaN(Date.parse(source.retrievedAt));
      } catch {
        return false;
      }
    });
    const evidenceRequired = evidenceCategories.includes(category);
    const claims = evidenceRequired ? extractClaims(input) : [];
    const rawEntailments = citations.length && claims.length
      ? await this.entailmentChecker(claims, citations)
      : [];
    const allowedUrls = new Set(citations.map((citation) => citation.url));
    const threshold = Math.min(Math.max(Number(process.env.FACT_ENTAILMENT_THRESHOLD || 0.8), 0), 1);
    const claimEntailments = claims.map((claim) => {
      const result = rawEntailments.find((entry) => entry.claim === claim);
      const citationUrls = (result?.citationUrls || []).filter((url) => allowedUrls.has(url));
      const confidence = Number(result?.confidence || 0);
      return {
        claim,
        supported: Boolean(result?.supported) && confidence >= threshold && citationUrls.length > 0,
        confidence: Number.isFinite(confidence) ? confidence : 0,
        citationUrls,
      };
    });
    const unsupported = claimEntailments.filter((claim) => !claim.supported);
    if (evidenceRequired && citations.length === 0) {
      correctionNotes.push('Add at least one valid HTTPS evidence citation');
    }
    for (const claim of unsupported) correctionNotes.push(`Provide supporting evidence for claim: ${claim.claim}`);

    const requiresHumanReview = sensitive ||
      (evidenceRequired && (citations.length === 0 || claims.length === 0 || unsupported.length > 0));
    const supportedConfidence = claimEntailments.length
      ? Math.min(...claimEntailments.map((claim) => claim.confidence))
      : 0;
    const factScore = unsafeClaims.length > 0 ? 0.45
      : requiresHumanReview ? Math.min(0.78, supportedConfidence || 0.6)
      : evidenceRequired ? supportedConfidence : 0.92;

    return { factScore, unsafeClaims, correctionNotes, requiresHumanReview, citations, claimEntailments };
  }
}
