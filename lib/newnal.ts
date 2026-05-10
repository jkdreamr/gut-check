// lib/newnal.ts — thin client for the Newnal Service Agent API.
// Endpoints discovered from https://agentplace.newnal.ai/api/service-agent/openapi.json
// (different shape than the original spec doc — base path is /api/service-agent
// and discovery is a NL search rather than a list.)

import type {
  CircleSendResult,
  DriveUploadResponse,
  RealNewnalDetail,
  RealNewnalPersonalAi,
  RealNewnalSearchResponse,
  SentCirclesResponse,
  SimpleCircleRequest,
  TemplateCircleRequest,
} from './types';

const DEFAULT_BASE = 'https://agentplace.newnal.ai/api/service-agent';

function getBase() {
  return process.env.NEWNAL_API_BASE || DEFAULT_BASE;
}

function getKey() {
  const key = process.env.NEWNAL_API_KEY;
  if (!key) {
    throw new Error(
      'NEWNAL_API_KEY is not set. Add it to .env.local or your deployment environment.',
    );
  }
  return key;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getKey()}`,
  };
}

export async function searchPersonalAis(
  query: string,
): Promise<RealNewnalSearchResponse> {
  const res = await fetch(`${getBase()}/personal-ai/search`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ query }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`searchPersonalAis failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as RealNewnalSearchResponse;
}

export async function getPersonalAi(did: string): Promise<RealNewnalDetail> {
  const url = `${getBase()}/personal-ai/${encodeURIComponent(did)}`;
  const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`getPersonalAi failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as RealNewnalDetail;
}

export async function sendSimpleCircle(
  payload: SimpleCircleRequest,
): Promise<CircleSendResult> {
  const res = await fetch(`${getBase()}/circle/simple`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`sendSimpleCircle failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as CircleSendResult;
}

// Wraps the search and pulls out just the matched users.
export async function discoverUsers(
  query = 'all users with rich profile data',
): Promise<RealNewnalPersonalAi[]> {
  const resp = await searchPersonalAis(query);
  return resp.personal_ai;
}

// Optional richer, layout-driven Newnal-Circle support. Discovered preset key
// from the Newnal Agent Place dashboard (UI Templates page): the official
// notice template is "official.admin.update.notice" with placeholders
// `Simple Text0-headline` and `Simple Text0-body`. Gut Check keeps
// /circle/simple as the default send path because it has been more reliable in
// live testing, but this template route is still available for richer cards.
export const DEFAULT_TEMPLATE_PRESET_KEY = 'official.admin.update.notice';

export async function sendTemplateCircle(
  payload: TemplateCircleRequest,
): Promise<CircleSendResult> {
  const res = await fetch(`${getBase()}/circle/template`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`sendTemplateCircle failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as CircleSendResult;
}

export async function getSentCircles(opts: {
  page?: number;
  pageSize?: number;
  recipientDid?: string;
} = {}): Promise<SentCirclesResponse> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.pageSize) params.set('page_size', String(opts.pageSize));
  if (opts.recipientDid) params.set('recipient_did', opts.recipientDid);
  const url = `${getBase()}/circle/sent${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`getSentCircles failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as SentCirclesResponse;
}

export async function uploadDriveFile(
  file: Blob | ArrayBuffer,
  contentType: string,
  filename?: string,
): Promise<DriveUploadResponse> {
  const form = new FormData();
  const blob = file instanceof Blob
    ? file
    : new Blob([new Uint8Array(file)], { type: contentType });
  form.append('file', blob, filename ?? 'upload.bin');
  const res = await fetch(`${getBase()}/drive/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getKey()}` },
    body: form,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`uploadDriveFile failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as DriveUploadResponse;
}
