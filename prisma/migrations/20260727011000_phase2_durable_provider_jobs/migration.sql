ALTER TABLE "ProviderJobLog"
  ADD COLUMN "requestKey" TEXT,
  ADD COLUMN "statusUrl" TEXT,
  ADD COLUMN "nextPollAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "ProviderJobLog_requestKey_key" ON "ProviderJobLog"("requestKey");
CREATE INDEX "ProviderJobLog_externalJobId_idx" ON "ProviderJobLog"("externalJobId");
CREATE INDEX "ProviderJobLog_nextPollAt_idx" ON "ProviderJobLog"("nextPollAt");
