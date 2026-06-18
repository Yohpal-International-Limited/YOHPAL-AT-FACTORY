export type AvatarDirectorInput = {
  category: string;
  language?: string;
  region?: string | null;
};

export type AvatarDirectionOutput = {
  avatarCategory: string;
  desiredTone: string;
  voiceStyle: string;
  backgroundStyle: string;
  subtitleStyle: string;
};

export class AvatarDirectorAgent {
  async direct(input: AvatarDirectorInput): Promise<AvatarDirectionOutput> {
    const category = input.category.toLowerCase();

    if (category === 'news') {
      return {
        avatarCategory: 'news',
        desiredTone: 'calm, factual, credible',
        voiceStyle: 'clear newsroom voice',
        backgroundStyle: 'modern YohPal Live newsroom',
        subtitleStyle: 'clean bold captions',
      };
    }

    if (category === 'comedy') {
      return {
        avatarCategory: 'campus',
        desiredTone: 'funny, expressive, warm',
        voiceStyle: 'energetic conversational voice',
        backgroundStyle: 'urban Kenyan street or campus scene',
        subtitleStyle: 'large playful captions',
      };
    }

    if (category === 'business') {
      return {
        avatarCategory: 'business',
        desiredTone: 'smart, practical, confident',
        voiceStyle: 'calm business coach voice',
        backgroundStyle: 'small business or office background',
        subtitleStyle: 'bold professional captions',
      };
    }

    if (category === 'career') {
      return {
        avatarCategory: 'motivation',
        desiredTone: 'motivational, practical, optimistic',
        voiceStyle: 'encouraging mentor voice',
        backgroundStyle: 'modern learning or work environment',
        subtitleStyle: 'bold motivational captions',
      };
    }

    return {
      avatarCategory: 'general',
      desiredTone: 'friendly, clear, engaging',
      voiceStyle: 'natural youthful voice',
      backgroundStyle: 'bright YohPal Live branded background',
      subtitleStyle: 'bold readable captions',
    };
  }
}
