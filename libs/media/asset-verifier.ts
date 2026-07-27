import axios from 'axios';
import { createHash } from 'crypto';
import { execFile } from 'child_process';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { QuarantinedAsset, quarantineScanAndPromote } from './quarantine';

const execFileAsync = promisify(execFile);
const MAX_ASSET_BYTES = 200 * 1024 * 1024;

export type MediaInspection = {
  container?: string;
  videoCodec?: string;
  audioCodec?: string;
  captionsPresent: boolean;
  durationSeconds?: number;
};

export type VerifiedAsset = {
  url: string;
  contentType: string;
  contentLength: number;
  etag?: string;
  sha256: string;
  inspection?: MediaInspection;
  storage?: QuarantinedAsset;
};

type FfprobeOutput = {
  streams?: Array<{ codec_type?: string; codec_name?: string }>;
  format?: { format_name?: string; duration?: string };
};

export function inspectFfprobeOutput(output: FfprobeOutput, expectedType: 'audio' | 'video'): MediaInspection {
  const streams = output.streams || [];
  const videoCodec = streams.find((stream) => stream.codec_type === 'video')?.codec_name;
  const audioCodec = streams.find((stream) => stream.codec_type === 'audio')?.codec_name;
  const captionsPresent = streams.some((stream) => stream.codec_type === 'subtitle');
  if (expectedType === 'video' && !videoCodec) throw new Error('Video asset has no video stream');
  if (expectedType === 'audio' && !audioCodec) throw new Error('Audio asset has no audio stream');
  if (expectedType === 'video' && !captionsPresent) throw new Error('Video asset has no caption stream');
  const duration = Number(output.format?.duration);
  return {
    container: output.format?.format_name,
    videoCodec,
    audioCodec,
    captionsPresent,
    durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : undefined,
  };
}

async function inspectMedia(buffer: Buffer, expectedType: 'audio' | 'video'): Promise<MediaInspection> {
  const directory = await mkdtemp(join(tmpdir(), 'yohpal-media-'));
  const file = join(directory, 'asset');
  try {
    await writeFile(file, buffer);
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error', '-show_streams', '-show_format', '-of', 'json', file,
    ], { maxBuffer: 1_000_000 });
    return inspectFfprobeOutput(JSON.parse(stdout) as FfprobeOutput, expectedType);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function verifyRemoteAsset(
  url: string,
  expectedType: 'audio' | 'image' | 'video'
): Promise<VerifiedAsset> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('Generated assets must use HTTPS');
  if (parsed.pathname.includes('/mock/')) throw new Error('Mock assets cannot enter moderation');
  const head = await axios.head(url, {
    timeout: 10_000,
    maxRedirects: 2,
    validateStatus: (status) => status >= 200 && status < 300,
  });
  const contentType = String(head.headers['content-type'] || '').toLowerCase();
  const contentLength = Number(head.headers['content-length'] || 0);
  if (!contentType.startsWith(`${expectedType}/`)) {
    throw new Error(`Expected ${expectedType} asset, received ${contentType || 'unknown type'}`);
  }
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0 || contentLength > MAX_ASSET_BYTES) {
    throw new Error('Generated asset must report a valid bounded content length');
  }
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer', timeout: 60_000, maxRedirects: 2,
    maxContentLength: MAX_ASSET_BYTES, maxBodyLength: MAX_ASSET_BYTES,
  });
  const buffer = Buffer.from(response.data);
  if (buffer.byteLength !== contentLength) throw new Error('Downloaded asset length does not match its declared length');
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  const inspection = expectedType === 'image' ? undefined : await inspectMedia(buffer, expectedType);
  const storage = process.env.NODE_ENV === 'production'
    ? await quarantineScanAndPromote(buffer, `${expectedType}/${sha256}`, contentType, sha256)
    : undefined;
  return {
    url, contentType, contentLength, etag: head.headers.etag,
    sha256, inspection, storage,
  };
}
