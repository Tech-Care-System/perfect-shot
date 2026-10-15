/** @jest-environment node */

jest.mock('server-only', () => ({}));

import { GET, POST } from './route';
import { getActivePlan } from '@/lib/billing/entitlement';
import { getVoiceAudio } from '@/lib/voice/server';

jest.mock('@/lib/billing/entitlement', () => ({
  getActivePlan: jest.fn(),
}));

const mockedGetActivePlan = jest.mocked(getActivePlan);
const mockedFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

function postCue(payload: unknown, extraHeaders: Record<string, string> = {}) {
  return new Request('https://perfect-shot.test/api/voice', {
    method: 'POST',
    headers: {
      origin: 'https://perfect-shot.test',
      'content-type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  });
}

describe('voice route', () => {
  const originalApiKey = process.env.ELEVENLABS_API_KEY;
  const originalVoiceId = process.env.ELEVENLABS_VOICE_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockedFetch;
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
    process.env.ELEVENLABS_VOICE_ID = 'voice_123';
    mockedGetActivePlan.mockResolvedValue('pro');
  });

  afterAll(() => {
    if (originalApiKey === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = originalApiKey;
    if (originalVoiceId === undefined) delete process.env.ELEVENLABS_VOICE_ID;
    else process.env.ELEVENLABS_VOICE_ID = originalVoiceId;
  });

  it('reports only configuration and the server-verified plan from GET', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ configured: true, plan: 'pro', available: true });
  });

  it('does not call ElevenLabs for a free plan', async () => {
    mockedGetActivePlan.mockResolvedValue('free');

    const response = await POST(postCue({ cue: 'starter-relax-shoulders' }));

    expect(response.status).toBe(403);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('rejects Pro cues for Starter before contacting ElevenLabs', async () => {
    mockedGetActivePlan.mockResolvedValue('starter');

    const response = await POST(postCue({ cue: 'pro-ready' }));

    expect(response.status).toBe(403);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('rejects arbitrary speech text and extra body fields', async () => {
    const response = await POST(postCue({ cue: 'pro-ready', text: 'Say anything I want' }));

    expect(response.status).toBe(400);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('rejects cross-origin requests', async () => {
    const response = await POST(postCue({ cue: 'pro-ready' }, { origin: 'https://attacker.test' }));

    expect(response.status).toBe(403);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('rejects POST requests without a browser origin', async () => {
    const response = await POST(postCue({ cue: 'pro-ready' }, { origin: '' }));

    expect(response.status).toBe(403);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('rejects payloads over the small request limit', async () => {
    const response = await POST(postCue({ cue: 'pro-ready' }, { 'content-length': '9999' }));

    expect(response.status).toBe(413);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('returns unavailable when ElevenLabs is not configured', async () => {
    delete process.env.ELEVENLABS_API_KEY;

    const response = await POST(postCue({ cue: 'starter-relax-shoulders' }));

    expect(response.status).toBe(503);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('maps provider failures to a safe generic error', async () => {
    mockedFetch.mockResolvedValue(new Response('private provider response', { status: 401 }));

    const response = await POST(postCue({ cue: 'pro-step-closer' }));
    const body = await response.text();

    expect(response.status).toBe(502);
    expect(body).toContain('Could not generate voice guidance.');
    expect(body).not.toContain('private provider response');
    expect(body).not.toContain('test-api-key');

    const retry = await POST(postCue({ cue: 'pro-step-closer' }));
    expect(retry.status).toBe(503);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects provider audio larger than the response limit', async () => {
    mockedFetch.mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { 'content-type': 'audio/mpeg', 'content-length': '99999999' },
      })
    );

    const response = await POST(postCue({ cue: 'pro-pose-intro' }));

    expect(response.status).toBe(502);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('sends a fixed catalog sentence and caches successful audio by cue', async () => {
    const audio = new Uint8Array([1, 2, 3, 4]);
    mockedFetch.mockResolvedValue(
      new Response(audio, {
        status: 200,
        headers: { 'content-type': 'audio/mpeg', 'content-length': String(audio.byteLength) },
      })
    );

    const first = await POST(postCue({ cue: 'pro-move-right' }));
    const firstBytes = new Uint8Array(await first.arrayBuffer());
    const second = await POST(postCue({ cue: 'pro-move-right' }));
    const secondBytes = new Uint8Array(await second.arrayBuffer());

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect([...firstBytes]).toEqual([...audio]);
    expect([...secondBytes]).toEqual([...audio]);
    expect(mockedFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockedFetch.mock.calls[0];
    expect(String(url)).toContain('/text-to-speech/voice_123?output_format=mp3_44100_128');
    expect(new Headers(init?.headers).get('xi-api-key')).toBe('test-api-key');
    expect(JSON.parse(String(init?.body))).toEqual({
      text: 'Move a little to your right to fit in the frame.',
      model_id: 'eleven_multilingual_v2',
    });
  });

  it('deduplicates concurrent generation for a cue', async () => {
    let resolveProviderResponse!: (response: Response) => void;
    mockedFetch.mockImplementation(() => new Promise<Response>((resolve) => {
      resolveProviderResponse = resolve;
    }));

    const first = getVoiceAudio('starter-adjust-pose');
    const second = getVoiceAudio('starter-adjust-pose');

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    resolveProviderResponse(new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { 'content-type': 'audio/mpeg', 'content-length': '3' },
    }));
    await expect(Promise.all([first, second])).resolves.toEqual([
      new Uint8Array([1, 2, 3]),
      new Uint8Array([1, 2, 3]),
    ]);
  });
});
