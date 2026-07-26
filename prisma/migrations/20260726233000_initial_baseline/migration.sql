-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('DRAFT', 'SCRIPTED', 'RENDERING', 'MODERATION', 'APPROVED', 'PUBLISHED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('ALLOW', 'LIMIT', 'REVIEW', 'BLOCK');

-- CreateEnum
CREATE TYPE "AdCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProviderJobType" AS ENUM ('LLM_SCRIPT', 'TTS', 'AVATAR_VIDEO', 'VIDEO_COMPOSITE', 'MODERATION');

-- CreateEnum
CREATE TYPE "ProviderJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'FALLBACK_USED');

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isAiCreator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorTwin" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "styleProfile" JSONB NOT NULL,
    "audienceProfile" JSONB NOT NULL,
    "preferredTopics" JSONB NOT NULL,
    "knowledgeGraph" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorTwin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avatar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "modelUrl" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "region" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trend" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "growthRate" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "trendId" TEXT,
    "title" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "durationHint" INTEGER NOT NULL DEFAULT 45,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "factScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT,
    "avatarId" TEXT,
    "scriptId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "durationSeconds" INTEGER,
    "status" "VideoStatus" NOT NULL DEFAULT 'DRAFT',
    "region" TEXT,
    "country" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "isSeedContent" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoScore" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "viralProbability" DOUBLE PRECISION NOT NULL,
    "engagementScore" DOUBLE PRECISION NOT NULL,
    "watchTimeScore" DOUBLE PRECISION NOT NULL,
    "shareScore" DOUBLE PRECISION NOT NULL,
    "commentScore" DOUBLE PRECISION NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationLog" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "reason" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "watchMs" INTEGER,
    "region" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "advertiser" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targeting" JSONB NOT NULL,
    "status" "AdCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderJobLog" (
    "id" TEXT NOT NULL,
    "videoId" TEXT,
    "jobType" "ProviderJobType" NOT NULL,
    "providerName" TEXT NOT NULL,
    "status" "ProviderJobStatus" NOT NULL,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorMessage" TEXT,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProviderJobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScriptProviderLog" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT,
    "trendId" TEXT,
    "providerName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "requestPayload" JSONB,
    "responsePayload" JSONB,

    CONSTRAINT "ScriptProviderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Creator_username_key" ON "Creator"("username");

-- CreateIndex
CREATE INDEX "Creator_trustScore_idx" ON "Creator"("trustScore");

-- CreateIndex
CREATE INDEX "Creator_isAiCreator_idx" ON "Creator"("isAiCreator");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorTwin_creatorId_key" ON "CreatorTwin"("creatorId");

-- CreateIndex
CREATE INDEX "Avatar_category_idx" ON "Avatar"("category");

-- CreateIndex
CREATE INDEX "Avatar_language_idx" ON "Avatar"("language");

-- CreateIndex
CREATE INDEX "Avatar_region_idx" ON "Avatar"("region");

-- CreateIndex
CREATE INDEX "Trend_category_idx" ON "Trend"("category");

-- CreateIndex
CREATE INDEX "Trend_region_idx" ON "Trend"("region");

-- CreateIndex
CREATE INDEX "Trend_country_idx" ON "Trend"("country");

-- CreateIndex
CREATE INDEX "Trend_score_idx" ON "Trend"("score");

-- CreateIndex
CREATE INDEX "Script_language_idx" ON "Script"("language");

-- CreateIndex
CREATE INDEX "Script_qualityScore_idx" ON "Script"("qualityScore");

-- CreateIndex
CREATE INDEX "Script_factScore_idx" ON "Script"("factScore");

-- CreateIndex
CREATE INDEX "Video_status_idx" ON "Video"("status");

-- CreateIndex
CREATE INDEX "Video_category_idx" ON "Video"("category");

-- CreateIndex
CREATE INDEX "Video_region_idx" ON "Video"("region");

-- CreateIndex
CREATE INDEX "Video_country_idx" ON "Video"("country");

-- CreateIndex
CREATE INDEX "Video_language_idx" ON "Video"("language");

-- CreateIndex
CREATE INDEX "Video_isSeedContent_idx" ON "Video"("isSeedContent");

-- CreateIndex
CREATE INDEX "Video_publishedAt_idx" ON "Video"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VideoScore_videoId_key" ON "VideoScore"("videoId");

-- CreateIndex
CREATE INDEX "VideoScore_viralProbability_idx" ON "VideoScore"("viralProbability");

-- CreateIndex
CREATE INDEX "VideoScore_engagementScore_idx" ON "VideoScore"("engagementScore");

-- CreateIndex
CREATE INDEX "VideoScore_qualityScore_idx" ON "VideoScore"("qualityScore");

-- CreateIndex
CREATE INDEX "ModerationLog_action_idx" ON "ModerationLog"("action");

-- CreateIndex
CREATE INDEX "ModerationLog_score_idx" ON "ModerationLog"("score");

-- CreateIndex
CREATE INDEX "ModerationLog_createdAt_idx" ON "ModerationLog"("createdAt");

-- CreateIndex
CREATE INDEX "FeedEvent_userId_idx" ON "FeedEvent"("userId");

-- CreateIndex
CREATE INDEX "FeedEvent_videoId_idx" ON "FeedEvent"("videoId");

-- CreateIndex
CREATE INDEX "FeedEvent_action_idx" ON "FeedEvent"("action");

-- CreateIndex
CREATE INDEX "FeedEvent_createdAt_idx" ON "FeedEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AdCampaign_status_idx" ON "AdCampaign"("status");

-- CreateIndex
CREATE INDEX "AdCampaign_startsAt_idx" ON "AdCampaign"("startsAt");

-- CreateIndex
CREATE INDEX "AdCampaign_endsAt_idx" ON "AdCampaign"("endsAt");

-- CreateIndex
CREATE INDEX "ProviderJobLog_jobType_idx" ON "ProviderJobLog"("jobType");

-- CreateIndex
CREATE INDEX "ProviderJobLog_providerName_idx" ON "ProviderJobLog"("providerName");

-- CreateIndex
CREATE INDEX "ProviderJobLog_status_idx" ON "ProviderJobLog"("status");

-- CreateIndex
CREATE INDEX "ProviderJobLog_fallbackUsed_idx" ON "ProviderJobLog"("fallbackUsed");

-- CreateIndex
CREATE INDEX "ProviderJobLog_startedAt_idx" ON "ProviderJobLog"("startedAt");

-- CreateIndex
CREATE INDEX "ScriptProviderLog_providerName_idx" ON "ScriptProviderLog"("providerName");

-- CreateIndex
CREATE INDEX "ScriptProviderLog_status_idx" ON "ScriptProviderLog"("status");

-- CreateIndex
CREATE INDEX "ScriptProviderLog_fallbackUsed_idx" ON "ScriptProviderLog"("fallbackUsed");

-- CreateIndex
CREATE INDEX "ScriptProviderLog_startedAt_idx" ON "ScriptProviderLog"("startedAt");

-- CreateIndex
CREATE INDEX "ScriptProviderLog_scriptId_idx" ON "ScriptProviderLog"("scriptId");

-- AddForeignKey
ALTER TABLE "CreatorTwin" ADD CONSTRAINT "CreatorTwin_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "Trend"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Avatar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoScore" ADD CONSTRAINT "VideoScore_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedEvent" ADD CONSTRAINT "FeedEvent_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderJobLog" ADD CONSTRAINT "ProviderJobLog_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptProviderLog" ADD CONSTRAINT "ScriptProviderLog_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptProviderLog" ADD CONSTRAINT "ScriptProviderLog_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "Trend"("id") ON DELETE SET NULL ON UPDATE CASCADE;
