import axios, { AxiosError } from 'axios';

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
  const response = await withBoundedRetries(
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

  if (response.status !== 202) return response.data as T;
  const accepted = response.data as AcceptedJob;
  if (!accepted.jobId || !accepted.statusUrl) throw new Error('Provider accepted a job without jobId and statusUrl');
  const statusUrl = new URL(accepted.statusUrl, baseUrl);
  if (statusUrl.origin !== origin) throw new Error('Provider job status URL must use the AI gateway origin');

  const maxPolls = positiveInteger(process.env.AI_JOB_MAX_POLLS, 20, 100);
  const pollDelayMs = positiveInteger(process.env.AI_JOB_POLL_INTERVAL_MS, 1_000, 10_000);
  for (let poll = 1; poll <= maxPolls; poll += 1) {
    if (poll > 1) await defaultSleep(pollDelayMs);
    const state = await withBoundedRetries(
      () => axios.get<JobState<T>>(statusUrl.toString(), {
        headers,
        timeout: 30_000,
        maxContentLength: 1_000_000,
      }).then((result) => result.data),
      retryOptions
    );
    if (state.status === 'succeeded') {
      if (state.result === undefined) throw new Error(`Provider job ${accepted.jobId} succeeded without a result`);
      return state.result;
    }
    if (state.status === 'failed') throw new Error(state.error || `Provider job ${accepted.jobId} failed`);
    if (state.status !== 'pending' && state.status !== 'running') {
      throw new Error(`Provider job ${accepted.jobId} returned an invalid status`);
    }
  }
  throw new Error(`Provider job ${accepted.jobId} exceeded ${maxPolls} polls`);
}
