export type RankingInput = {
  engagementScore: number;
  interestScore: number;
  localityScore: number;
  freshnessScore: number;
  qualityScore: number;
};

export type RankingWeights = {
  engagement: number;
  interest: number;
  locality: number;
  freshness: number;
  quality: number;
};

export const defaultRankingWeights: RankingWeights = {
  engagement: 0.3,
  interest: 0.25,
  locality: 0.15,
  freshness: 0.15,
  quality: 0.15,
};

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function calculateRankScore(
  input: RankingInput,
  weights: RankingWeights = defaultRankingWeights
): number {
  return (
    clamp(input.engagementScore) * weights.engagement +
    clamp(input.interestScore) * weights.interest +
    clamp(input.localityScore) * weights.locality +
    clamp(input.freshnessScore) * weights.freshness +
    clamp(input.qualityScore) * weights.quality
  );
}

export function freshnessScoreFromDate(date?: Date | null): number {
  if (!date) {
    return 0.5;
  }
  const ageMs = Date.now() - date.getTime();
  const ageHours = ageMs / 1000 / 60 / 60;
  if (ageHours <= 1) return 1;
  if (ageHours <= 6) return 0.9;
  if (ageHours <= 24) return 0.8;
  if (ageHours <= 72) return 0.65;
  if (ageHours <= 168) return 0.5;
  return 0.3;
}
