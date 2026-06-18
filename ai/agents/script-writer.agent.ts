import { buildSeedVideoScriptPrompt } from '../prompts/script-prompts';
import { ContentStrategyOutput } from './content-strategy.agent';

export type ScriptWriterInput = {
  topic: string;
  category: string;
  region?: string | null;
  country?: string | null;
  language?: string;
  strategy: ContentStrategyOutput;
};

export type ScriptWriterOutput = {
  title: string;
  hook: string;
  body: string;
  cta: string;
  fullScript: string;
  language: string;
  durationHint: number;
  qualityScore: number;
};

export class ScriptWriterAgent {
  async write(input: ScriptWriterInput): Promise<ScriptWriterOutput> {
    const prompt = buildSeedVideoScriptPrompt({
      topic: input.topic,
      category: input.category,
      region: input.region,
      country: input.country,
      language: input.language || 'en',
      durationSeconds: input.strategy.durationSeconds,
    });
    void prompt;

    const title = this.buildTitle(input.topic);
    const hook = this.buildHook(input.topic, input.category, input.region);
    const body = this.buildBody(input.topic, input.category);
    const cta = 'Follow YohPal Live for more smart, entertaining videos.';

    return {
      title,
      hook,
      body,
      cta,
      fullScript: `${hook}\n\n${body}\n\n${cta}`,
      language: input.language || 'en',
      durationHint: input.strategy.durationSeconds,
      qualityScore: this.estimateQualityScore(input.category),
    };
  }

  private buildTitle(topic: string): string {
    return topic.length > 70 ? `${topic.slice(0, 67)}...` : topic;
  }

  private buildHook(topic: string, category: string, region?: string | null): string {
    if (category.toLowerCase() === 'comedy') {
      return `If you understand ${topic}, you already deserve a certificate.`;
    }
    if (category.toLowerCase() === 'career') {
      return `This one skill could change how you think about your future.`;
    }
    if (category.toLowerCase() === 'business') {
      return `Before you start your next hustle, listen to this.`;
    }
    if (region) {
      return `${region}, this is something worth knowing today.`;
    }
    return 'Here is something useful you need to know today.';
  }

  private buildBody(topic: string, category: string): string {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory === 'comedy') {
      return `Today we are looking at ${topic}. The funny thing is, everyone has experienced it, but nobody wants to admit how serious it is. Point one: it always starts small. Point two: everyone thinks they have the solution. Point three: somehow, it still wins.`;
    }
    if (lowerCategory === 'career') {
      return `${topic} matters because the future of work is changing fast. Start with one practical skill, practise it daily, build proof of work, and use YohPal to connect your skill to real opportunities.`;
    }
    if (lowerCategory === 'business') {
      return `${topic} starts with discipline. Know your customer, control your costs, keep records, test small, and grow only after the numbers make sense.`;
    }
    if (lowerCategory === 'campus') {
      return `${topic} is not just about school. It is about building habits, networks, skills, and confidence before you enter the real world.`;
    }
    return `${topic} is important because small ideas can create big changes when people understand them clearly and act at the right time.`;
  }

  private estimateQualityScore(category: string): number {
    const map: Record<string, number> = {
      comedy: 0.82,
      career: 0.86,
      business: 0.84,
      campus: 0.81,
      motivation: 0.80,
      technology: 0.83,
      news: 0.78,
    };
    return map[category.toLowerCase()] || 0.80;
  }
}
