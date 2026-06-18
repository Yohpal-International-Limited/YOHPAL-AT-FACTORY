import { ContentStrategyAgent, ContentStrategyOutput } from '../agents/content-strategy.agent';
import { ScriptWriterAgent, ScriptWriterOutput } from '../agents/script-writer.agent';
import { FactCheckAgent, FactCheckOutput } from '../agents/fact-check.agent';
import { ViralPredictionAgent, ViralPredictionOutput } from '../agents/viral-prediction.agent';
import { AvatarDirectorAgent, AvatarDirectionOutput } from '../agents/avatar-director.agent';

export type ContentGenerationInput = {
  topic: string;
  category: string;
  region?: string | null;
  country?: string | null;
  language?: string;
  audience?: string;
};

export type ContentGenerationOutput = {
  strategy: ContentStrategyOutput;
  script: ScriptWriterOutput;
  factCheck: FactCheckOutput;
  viralScore: ViralPredictionOutput;
  avatarDirection: AvatarDirectionOutput;
  publishEligible: boolean;
};

export class ContentGenerationWorkflow {
  private readonly strategyAgent = new ContentStrategyAgent();
  private readonly scriptWriterAgent = new ScriptWriterAgent();
  private readonly factCheckAgent = new FactCheckAgent();
  private readonly viralPredictionAgent = new ViralPredictionAgent();
  private readonly avatarDirectorAgent = new AvatarDirectorAgent();

  async run(input: ContentGenerationInput): Promise<ContentGenerationOutput> {
    const strategy = await this.strategyAgent.plan({
      topic: input.topic,
      category: input.category,
      region: input.region,
      country: input.country,
      audience: input.audience,
    });

    const script = await this.scriptWriterAgent.write({
      topic: input.topic,
      category: input.category,
      region: input.region,
      country: input.country,
      language: input.language || 'en',
      strategy,
    });

    const factCheck = await this.factCheckAgent.check({
      title: script.title,
      hook: script.hook,
      body: script.body,
      cta: script.cta,
      category: input.category,
    });

    const viralScore = await this.viralPredictionAgent.score({
      category: input.category,
      hook: script.hook,
      body: script.body,
      qualityScore: script.qualityScore,
      factScore: factCheck.factScore,
      safetyLevel: strategy.safetyLevel,
    });

    const avatarDirection = await this.avatarDirectorAgent.direct({
      category: input.category,
      language: input.language || 'en',
      region: input.region,
    });

    const publishEligible =
      factCheck.factScore >= 0.75 &&
      viralScore.viralProbability >= 0.40 &&
      !factCheck.requiresHumanReview &&
      factCheck.unsafeClaims.length === 0;

    return {
      strategy,
      script,
      factCheck,
      viralScore,
      avatarDirection,
      publishEligible,
    };
  }
}
