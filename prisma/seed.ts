import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCreators() {
  const creator = await prisma.creator.upsert({
    where: { username: 'yohpal_ai_studio' },
    update: {},
    create: {
      username: 'yohpal_ai_studio',
      displayName: 'YohPal AI Studio',
      bio: 'Official AI seed content studio for YohPal Live.',
      trustScore: 95,
      followers: 0,
      engagementRate: 0,
      isAiCreator: true
    }
  });

  await prisma.creatorTwin.upsert({
    where: { creatorId: creator.id },
    update: {
      tone: 'smart, energetic, African, youth-friendly, safe, optimistic'
    },
    create: {
      creatorId: creator.id,
      tone: 'smart, energetic, African, youth-friendly, safe, optimistic',
      styleProfile: {
        pacing: 'fast',
        format: 'short_video',
        visualStyle: 'bright',
        subtitleStyle: 'bold',
        defaultDurationSeconds: 45
      },
      audienceProfile: {
        primary: 'African youth',
        secondary: ['students', 'job seekers', 'creators', 'small business owners'],
        regions: ['Kenya', 'East Africa', 'Africa']
      },
      preferredTopics: [
        'career',
        'comedy',
        'motivation',
        'technology',
        'business',
        'campus',
        'skills'
      ],
      knowledgeGraph: {
        linkedYohPalModules: [
          'YohPal Jobs',
          'YohPal Hustle',
          'YohPal Market',
          'ICS Technical College',
          'Smart Lecturer',
          'AI E-Library'
        ]
      }
    }
  });

  return creator;
}

async function seedAvatars() {
  await prisma.avatar.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'YohPal News Anchor',
        category: 'news',
        gender: 'female',
        ageGroup: 'adult',
        voiceId: 'voice_news_001',
        modelUrl: 'models/news_anchor.glb',
        language: 'en',
        region: 'global',
        isActive: true
      },
      {
        name: 'Motivation Mentor',
        category: 'motivation',
        gender: 'male',
        ageGroup: 'adult',
        voiceId: 'voice_motivation_001',
        modelUrl: 'models/motivation_mentor.glb',
        language: 'en',
        region: 'global',
        isActive: true
      },
      {
        name: 'Business Coach',
        category: 'business',
        gender: 'female',
        ageGroup: 'adult',
        voiceId: 'voice_business_001',
        modelUrl: 'models/business_coach.glb',
        language: 'en',
        region: 'global',
        isActive: true
      },
      {
        name: 'Campus Vibe',
        category: 'campus',
        gender: 'male',
        ageGroup: 'young_adult',
        voiceId: 'voice_campus_001',
        modelUrl: 'models/campus_vibe.glb',
        language: 'en',
        region: 'global',
        isActive: true
      },
      {
        name: 'General YohPal',
        category: 'general',
        gender: 'neutral',
        ageGroup: 'adult',
        voiceId: 'voice_general_001',
        modelUrl: 'models/general_yohpal.glb',
        language: 'en',
        region: 'global',
        isActive: true
      }
    ]
  });
}

async function seedTrends() {
  await prisma.trend.createMany({
    data: [
      {
        topic: 'AI Jobs in Africa',
        region: 'Africa',
        country: 'Kenya',
        category: 'career',
        score: 92,
        growthRate: 15,
        source: 'internal_seed',
        metadata: { audience: 'job_seekers', format: 'career_tip' }
      },
      {
        topic: 'Why Side Hustles Fail',
        region: 'Africa',
        country: 'Kenya',
        category: 'business',
        score: 88,
        growthRate: 12,
        source: 'internal_seed',
        metadata: { audience: 'entrepreneurs', format: 'business_advice' }
      },
      {
        topic: 'Study Hacks for Exams',
        region: 'Africa',
        country: 'Kenya',
        category: 'campus',
        score: 85,
        growthRate: 18,
        source: 'internal_seed',
        metadata: { audience: 'students', format: 'student_tip' }
      },
      {
        topic: 'Daily Motivation for Success',
        region: 'Africa',
        country: 'Kenya',
        category: 'motivation',
        score: 90,
        growthRate: 10,
        source: 'internal_seed',
        metadata: { audience: 'general', format: 'motivation' }
      },
      {
        topic: 'Tech Trends in 2025',
        region: 'Africa',
        country: 'Kenya',
        category: 'technology',
        score: 87,
        growthRate: 14,
        source: 'internal_seed',
        metadata: { audience: 'tech_enthusiasts', format: 'tech_news' }
      }
    ]
  });
}

async function seedAdCampaigns() {
  await prisma.adCampaign.createMany({
    data: [
      {
        advertiser: 'YohPal Jobs',
        title: 'Promote AI-ready career opportunities',
        budget: 50000,
        targeting: {
          country: 'Kenya',
          interests: ['jobs', 'career', 'skills'],
          ageRange: [18, 35]
        },
        status: 'ACTIVE'
      },
      {
        advertiser: 'ICS Technical College',
        title: 'Promote AI and digital skills courses',
        budget: 75000,
        targeting: {
          country: 'Kenya',
          interests: ['education', 'career', 'technology'],
          ageRange: [16, 40]
        },
        status: 'ACTIVE'
      }
    ]
  });
}

async function main() {
  console.log('🌱 Starting YohPal Live AI Content Factory seed...');
  const creator = await seedCreators();
  await seedAvatars();
  await seedTrends();
  await seedAdCampaigns();
  console.log('✅ Seed complete.');
  console.log(`Default AI creator: ${creator.username}`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
