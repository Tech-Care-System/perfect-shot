import 'server-only';

import { PRO_CUE_SET, VOICE_CUE_TEXT, type VoiceCueId } from './cues';

export const MAX_VOICE_AUDIO_BYTES = 2 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 10_000;
const FAILED_CUE_BACKOFF_MS = 30_000;
const MAX_CONCURRENT_GENERATIONS = 2;

type VoiceServiceErrorCode = 'unavailable' | 'busy' | 'upstream';

export class VoiceServiceError extends Error {
  constructor(readonly code: VoiceServiceErrorCode) {
    super(code);
    this.name = 'VoiceServiceError';
  }
}

// shortcut: this cache is process-local; use shared storage before scaling to multiple instances.
const audioCache = new Map<VoiceCueId, Promise<Uint8Array>>();
const failedCueUntil = new Map<VoiceCueId, number>();
let activeGenerations = 0;

export function isProVoiceCue(cue: VoiceCueId): boolean {
  return PRO_CUE_SET.has(cue);
}

function getElevenLabsConfig(): { apiKey: string; voiceId: string } | null {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();

  if (!apiKey || !voiceId || /[\r\n]/.test(apiKey) || !/^[\w-]{1,128}$/.test(voiceId)) {
    return null;
  }

  return { apiKey, voiceId };
}

export function isVoiceConfigured(): boolean {
  return getElevenLabsConfig() !== null;
}

async function readBoundedAudio(response: Response): Promise<Uint8Array> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_VOICE_AUDIO_BYTES) {
    throw new VoiceServiceError('upstream');
  }

  if (!response.headers.get('content-type')?.toLowerCase().startsWith('audio/')) {
    throw new VoiceServiceError('upstream');
  }

  if (!response.body) throw new VoiceServiceError('upstream');

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_VOICE_AUDIO_BYTES) {
        await reader.cancel();
        throw new VoiceServiceError('upstream');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (byteLength === 0) throw new VoiceServiceError('upstream');

  const audio = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    audio.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return audio;
}

async function generateVoiceCue(cue: VoiceCueId): Promise<Uint8Array> {
  const config = getElevenLabsConfig();
  if (!config) throw new VoiceServiceError('unavailable');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(config.voiceId)}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': config.apiKey,
        },
        body: JSON.stringify({
          text: VOICE_CUE_TEXT[cue],
          model_id: 'eleven_multilingual_v2',
        }),
        signal: controller.signal,
        cache: 'no-store',
      }
    );

    if (!response.ok) throw new VoiceServiceError('upstream');
    return await readBoundedAudio(response);
  } catch (error) {
    if (error instanceof VoiceServiceError) throw error;
    throw new VoiceServiceError('upstream');
  } finally {
    clearTimeout(timeout);
  }
}

export async function getVoiceAudio(cue: VoiceCueId): Promise<Uint8Array> {
  const cached = audioCache.get(cue);
  if (cached) return cached;

  const failedUntil = failedCueUntil.get(cue) ?? 0;
  if (Date.now() < failedUntil) throw new VoiceServiceError('unavailable');
  if (activeGenerations >= MAX_CONCURRENT_GENERATIONS) throw new VoiceServiceError('busy');

  activeGenerations += 1;
  const pending = generateVoiceCue(cue)
    .then((audio) => {
      audioCache.set(cue, Promise.resolve(audio));
      failedCueUntil.delete(cue);
      return audio;
    })
    .catch((error: unknown) => {
      if (!(error instanceof VoiceServiceError && error.code === 'busy')) {
        failedCueUntil.set(cue, Date.now() + FAILED_CUE_BACKOFF_MS);
      }
      audioCache.delete(cue);
      throw error;
    })
    .finally(() => {
      activeGenerations -= 1;
    });

  audioCache.set(cue, pending);
  return pending;
}
