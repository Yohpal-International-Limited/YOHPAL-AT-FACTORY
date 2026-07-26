import axios from 'axios';

export type VerifiedAsset = {
  url: string;
  contentType: string;
  contentLength: number;
  etag?: string;
};

export async function verifyRemoteAsset(
  url: string,
  expectedType: 'audio' | 'image' | 'video'
): Promise<VerifiedAsset> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('Generated assets must use HTTPS');
  if (parsed.pathname.includes('/mock/')) throw new Error('Mock assets cannot enter moderation');
  const response = await axios.head(url, {
    timeout: 10_000,
    maxRedirects: 2,
    validateStatus: (status) => status >= 200 && status < 300,
  });
  const contentType = String(response.headers['content-type'] || '').toLowerCase();
  const contentLength = Number(response.headers['content-length'] || 0);
  if (!contentType.startsWith(`${expectedType}/`)) {
    throw new Error(`Expected ${expectedType} asset, received ${contentType || 'unknown type'}`);
  }
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
    throw new Error('Generated asset must report a positive content length');
  }
  return { url, contentType, contentLength, etag: response.headers.etag };
}
