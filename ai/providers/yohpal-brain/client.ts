import axios from 'axios';

export async function callYohPalBrain<T>(path: string, payload: unknown): Promise<T> {
  const baseUrl = process.env.AI_GATEWAY_URL;
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error('AI_GATEWAY_URL and AI_PROVIDER_API_KEY are required for yohpal_brain');
  }
  const response = await axios.post<T>(new URL(path, baseUrl).toString(), payload, {
    headers: { authorization: `Bearer ${apiKey}` },
    timeout: 60_000,
    maxBodyLength: 1_000_000,
    maxContentLength: 1_000_000,
    validateStatus: (status) => status >= 200 && status < 300,
  });
  return response.data;
}
