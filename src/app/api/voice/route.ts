import { getActivePlan } from '@/lib/billing/entitlement';
import { VOICE_CUE_TEXT, type VoiceCueId, type VoicePlan } from '@/lib/voice/cues';
import { getVoiceAudio, isProVoiceCue, isVoiceConfigured, VoiceServiceError } from '@/lib/voice/server';

export const runtime = 'nodejs';

const MAX_REQUEST_BYTES = 256;
const AUDIO_HEADERS = {
  'Content-Type': 'audio/mpeg',
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
};

function jsonResponse(body: object, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
  responseHeaders.set('Cache-Control', 'private, no-store');
  return Response.json(body, { status, headers: responseHeaders });
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    const parsedOrigin = new URL(origin);
    if (origin !== parsedOrigin.origin || parsedOrigin.origin !== new URL(request.url).origin) return false;
  } catch {
    return false;
  }

  const fetchSite = request.headers.get('sec-fetch-site');
  return !fetchSite || fetchSite === 'same-origin';
}

type ParsedCueResult =
  | { ok: true; cue: VoiceCueId }
  | { ok: false; status: 400 | 413 };

async function readCue(request: Request): Promise<ParsedCueResult> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) return { ok: false, status: 400 };

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return { ok: false, status: 413 };
  }

  if (!request.body) return { ok: false, status: 400 };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, status: 400 };

    const record = parsed as Record<string, unknown>;
    if (Object.keys(record).length !== 1 || typeof record.cue !== 'string') {
      return { ok: false, status: 400 };
    }
    if (!Object.hasOwn(VOICE_CUE_TEXT, record.cue)) return { ok: false, status: 400 };
    return { ok: true, cue: record.cue as VoiceCueId };
  } catch {
    return { ok: false, status: 400 };
  }
}

export async function GET(): Promise<Response> {
  try {
    const plan: VoicePlan = await getActivePlan();
    const configured = isVoiceConfigured();
    return jsonResponse({ configured, plan, available: configured && plan !== 'free' });
  } catch {
    return jsonResponse({ error: 'Voice coaching is unavailable.' }, 503);
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return jsonResponse({ error: 'Request not allowed.' }, 403);
  }

  const parsed = await readCue(request);
  if (!parsed.ok) {
    return jsonResponse(
      { error: parsed.status === 413 ? 'Request is too large.' : 'Invalid voice cue.' },
      parsed.status
    );
  }

  let plan: VoicePlan;
  try {
    plan = await getActivePlan();
  } catch {
    return jsonResponse({ error: 'Voice coaching is unavailable.' }, 503);
  }

  if (plan === 'free' || (plan === 'starter' && isProVoiceCue(parsed.cue))) {
    return jsonResponse({ error: 'Voice coaching is not available on this plan.' }, 403);
  }

  if (!isVoiceConfigured()) {
    return jsonResponse({ error: 'Voice coaching is currently unavailable.' }, 503);
  }

  try {
    const audio = await getVoiceAudio(parsed.cue);
    const responseBody = new ArrayBuffer(audio.byteLength);
    new Uint8Array(responseBody).set(audio);
    return new Response(responseBody, { status: 200, headers: AUDIO_HEADERS });
  } catch (error) {
    if (error instanceof VoiceServiceError) {
      if (error.code === 'upstream') {
        return jsonResponse({ error: 'Could not generate voice guidance.' }, 502);
      }
      const headers = error.code === 'busy' ? { 'Retry-After': '2' } : undefined;
      return jsonResponse({ error: 'Voice coaching is currently unavailable.' }, 503, headers);
    }
    return jsonResponse({ error: 'Voice coaching is currently unavailable.' }, 503);
  }
}
