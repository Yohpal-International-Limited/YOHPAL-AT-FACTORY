import axios, { AxiosError } from 'axios';
import { createHash } from 'crypto';

type Sleep = (milliseconds: number) => Promise<void>;

export type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  sleep?: Sleep;
};

type AcceptedJob = { jobId: string; statusUrl: string };
type JobState<T> = {
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  result?: T;
  error?: string;
};

export type DurableProviderJob = {
  externalJobId: string;
  statusUrl: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  response?: unknown;
};
export type ProviderJobStore = {
  find: (requestKey: string) => Promise<DurableProviderJob | null>;
  accepted: (input: { requestKey: string; externalJobId: string; statusUrl: string; path: string; payload: unknown }) => Promise<void>;
  polled: (requestKey: string, attempts: number, nextPollAt: Date) => Promise<void>;
  completed: (requestKey: string, response: unknown) => Promise<void>;
  failed: (requestKey: string, error: string) => Promise<void>;
};

let providerJobStore: ProviderJobStore | undefined;
export function configureProviderJobStore(store: ProviderJobStore): void {
  providerJobStore = store;
}

const defaultSleep: Sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function positiveInteger(value: string | undefined, fallback: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

function retryable(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false;
  return !error.response || error.response.status === 408 || error.response.status === 429 || error.response.status >= 500;
}

export async function withBoundedRetries<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const sleep = options.sleep || defaultSleep;
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === options.maxAttempts || !retryable(error)) throw error;
      await sleep(options.baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

export async function callYohPalBrain<T>(path: string, payload: unknown): Promise<T> {
  const baseUrl = process.env.AI_GATEWAY_URL;
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error('AI_GATEWAY_URL and AI_PROVIDER_API_KEY are required for yohpal_brain');
  }

  const origin = new URL(baseUrl).origin;
  const headers = { authorization: `Bearer ${apiKey}` };
  const retryOptions = {
    maxAttempts: positiveInteger(process.env.AI_JOB_RETRY_ATTEMPTS, 3, 5),
    baseDelayMs: positiveInteger(process.env.AI_JOB_RETRY_DELAY_MS, 500, 10_000),
  };
  const requestKey = createHash('sha256').update(`${path}:${JSON.stringify(payload)}`).digest('hex');
  const existing = await providerJobStore?.find(requestKey);
  if (existing?.status === 'SUCCESS') return existing.response as T;
  if (existing?.status === 'FAILED') throw new Error(`Provider job ${existing.externalJobId} previously failed`);
  let acceptedJob: AcceptedJob | undefined = existing
    ? { jobId: existing.externalJobId, statusUrl: existing.statusUrl }
    : undefined;
  const response = acceptedJob ? undefined : await withBoundedRetries(
    () => axios.post<T | AcceptedJob>(new URL(path, baseUrl).toString(), payload, {
      headers,
      timeout: 60_000,
      maxBodyLength: 1_000_000,
      maxContentLength: 1_000_000,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 408 || status === 429 || status >= 500,
    }).then((result) => {
      if (result.status === 408 || result.status === 429 || result.status >= 500) {
        throw new AxiosError(`Provider returned ${result.status}`, undefined, undefined, undefined, result);
      }
      return result;
    }),
    retryOptions
  );

  if (response && response.status !== 202) return response.data as T;
  const accepted = acceptedJob || response!.data as AcceptedJob;
  if (!accepted.jobId || !accepted.statusUrl) throw new Error('Provider accepted a job without jobId and statusUrl');
  const statusUrl = new URL(accepted.statusUrl, baseUrl);
  if (statusUrl.origin !== origin) throw new Error('Provider job status URL must use the AI gateway origin');
  if (!acceptedJob) {
    await providerJobStore?.accepted({
      requestKey, externalJobId: accepted.jobId, statusUrl: statusUrl.toString(), path, payload,
    });
  }

  const maxPolls = positiveInteger(process.env.AI_JOB_MAX_POLLS, 20, 100);
  const pollDelayMs = positiveInteger(process.env.AI_JOB_POLL_INTERVAL_MS, 1_000, 10_000);
  for (let poll = 1; poll <= maxPolls; poll += 1) {
    if (poll > 1) await defaultSleep(pollDelayMs);
    const webhookResult = await providerJobStore?.find(requestKey);
    if (webhookResult?.status === 'SUCCESS') return webhookResult.response as T;
    if (webhookResult?.status === 'FAILED') {
      throw new Error(`Provider job ${accepted.jobId} failed through webhook completion`);
    }
    const state = await withBoundedRetries(
      () => axios.get<JobState<T>>(statusUrl.toString(), {
        headers,
        timeout: 30_000,
        maxContentLength: 1_000_000,
      }).then((result) => result.data),
      retryOptions
    );
    await providerJobStore?.polled(requestKey, poll, new Date(Date.now() + pollDelayMs));
    if (state.status === 'succeeded') {
      if (state.result === undefined) throw new Error(`Provider job ${accepted.jobId} succeeded without a result`);
      await providerJobStore?.completed(requestKey, state.result);
      return state.result;
    }
    if (state.status === 'failed') {
      const message = state.error || `Provider job ${accepted.jobId} failed`;
      await providerJobStore?.failed(requestKey, message);
      throw new Error(message);
    }
    if (state.status !== 'pending' && state.status !== 'running') {
      throw new Error(`Provider job ${accepted.jobId} returned an invalid status`);
    }
  }
  const message = `Provider job ${accepted.jobId} exceeded ${maxPolls} polls`;
  await providerJobStore?.failed(requestKey, message);
  throw new Error(message);
}
