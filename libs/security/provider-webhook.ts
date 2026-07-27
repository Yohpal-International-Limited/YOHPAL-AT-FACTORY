import { createHmac, timingSafeEqual } from 'crypto';

export function webhookSignature(secret: string, timestamp: string, body: unknown): string {
  return createHmac('sha256', secret).update(`${timestamp}.${JSON.stringify(body)}`).digest('hex');
}

export function verifyProviderWebhook(input: {
  secret: string;
  timestamp?: string;
  signature?: string;
  body: unknown;
  now?: number;
  toleranceMs?: number;
}): boolean {
  if (!input.secret || !input.timestamp || !input.signature) return false;
  const timestampMs = Number(input.timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs((input.now || Date.now()) - timestampMs) > (input.toleranceMs || 300_000)) {
    return false;
  }
  const expected = Buffer.from(webhookSignature(input.secret, input.timestamp, input.body), 'hex');
  const actual = Buffer.from(input.signature.replace(/^sha256=/, ''), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
