ALTER TABLE "ProviderJobLog"
  ADD COLUMN "externalJobId" TEXT,
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastPolledAt" TIMESTAMP(3);

CREATE TABLE "RenderMetadata" (
  "id" TEXT NOT NULL,
  "videoId" TEXT NOT NULL,
  "videoSha256" TEXT NOT NULL,
  "audioSha256" TEXT NOT NULL,
  "videoCodec" TEXT NOT NULL,
  "audioCodec" TEXT,
  "container" TEXT,
  "captionsPresent" BOOLEAN NOT NULL,
  "inspection" JSONB NOT NULL,
  "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RenderMetadata_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RenderMetadata_videoId_key" ON "RenderMetadata"("videoId");
CREATE INDEX "RenderMetadata_verifiedAt_idx" ON "RenderMetadata"("verifiedAt");
CREATE INDEX "RenderMetadata_captionsPresent_idx" ON "RenderMetadata"("captionsPresent");
ALTER TABLE "RenderMetadata" ADD CONSTRAINT "RenderMetadata_videoId_fkey"
  FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
