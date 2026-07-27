import axios from 'axios';

export type ScanResult = { clean: boolean; engine: string; signature?: string };
export type QuarantinedAsset = {
  objectKey: string;
  url: string;
  scan: ScanResult;
};
export type QuarantineAdapters = {
  quarantine: (buffer: Buffer, key: string, contentType: string) => Promise<{ objectKey: string }>;
  scan: (objectKey: string, sha256: string) => Promise<ScanResult>;
  promote: (objectKey: string) => Promise<{ url: string }>;
};

function configuredAdapters(): QuarantineAdapters {
  const storageUrl = process.env.OBJECT_STORAGE_GATEWAY_URL;
  const scannerUrl = process.env.MALWARE_SCANNER_URL;
  const token = process.env.OBJECT_STORAGE_GATEWAY_TOKEN;
  if (!storageUrl || !scannerUrl || !token) {
    throw new Error('Object-storage quarantine and malware scanner configuration is required');
  }
  const headers = { authorization: `Bearer ${token}` };
  return {
    async quarantine(buffer, key, contentType) {
      const form = new FormData();
      form.append('key', key);
      form.append('file', new Blob([buffer]), key);
      const response = await axios.post<{ objectKey: string }>(new URL('/v1/quarantine', storageUrl).toString(), form, {
        headers, timeout: 60_000, maxBodyLength: buffer.byteLength + 1_000_000,
      });
      return response.data;
    },
    async scan(objectKey, sha256) {
      const response = await axios.post<ScanResult>(new URL('/v1/scan', scannerUrl).toString(), { objectKey, sha256 }, {
        headers, timeout: 60_000,
      });
      return response.data;
    },
    async promote(objectKey) {
      const response = await axios.post<{ url: string }>(new URL('/v1/promote', storageUrl).toString(), { objectKey }, {
        headers, timeout: 30_000,
      });
      return response.data;
    },
  };
}

export async function quarantineScanAndPromote(
  buffer: Buffer,
  key: string,
  contentType: string,
  sha256: string,
  adapters: QuarantineAdapters = configuredAdapters()
): Promise<QuarantinedAsset> {
  const quarantined = await adapters.quarantine(buffer, key, contentType);
  const scan = await adapters.scan(quarantined.objectKey, sha256);
  if (!scan.clean) throw new Error(`Malware scanner rejected ${quarantined.objectKey}`);
  const promoted = await adapters.promote(quarantined.objectKey);
  if (!promoted.url.startsWith('https://')) throw new Error('Promoted asset URL must use HTTPS');
  return { objectKey: quarantined.objectKey, url: promoted.url, scan };
}
