# Spoken pose coaching

Voice coaching is an optional camera aid. It starts off, and the user must turn it on with the accessible control above the camera preview. When enabled, the browser waits for a cue to remain stable, speaks one short sentence, and applies a six-second cooldown. Changing the cue, turning voice off, capturing a photo, leaving the tab, losing camera readiness, or unmounting the camera stops active playback and aborts an outstanding audio request.

## Plan access

The server checks the active plan for every audio request. Starter can hear the fixed pose-correction cues. Pro includes those cues plus framing, distance, lighting, pose-introduction, and pose-match encouragement cues. The client never supplies a plan or a sentence to speak; it sends only one identifier from the fixed cue catalog. Free users see the Starter and Pro pricing link.

## Privacy and credentials

The camera frames, captured photos, pose landmarks, and arbitrary user text are not sent to ElevenLabs. The browser sends a fixed cue ID to this app's same-origin API. The server maps that ID to a short, authored instruction sentence and sends that text to ElevenLabs. Voice coaching uses no camera or photo payloads.

Set these server-only environment variables to enable speech:

```dotenv
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

The API key and voice ID must not use a `NEXT_PUBLIC_` prefix or be included in browser code. Without both values, the API reports voice coaching as unavailable and does not call the provider. This integration follows ElevenLabs' [Create speech API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert), using the `xi-api-key` header, `mp3_44100_128` output, and `eleven_multilingual_v2` model. Local provider verification generated one fixed 60-character cue with the calm, conversational River voice and returned 54,377 bytes of MPEG audio. No image was sent. The local key permits only speech generation and voice reads, with a 2,000-credit cap per refresh period; credentials remain in the ignored `.env.local`.

## Operational limits

The app's paid-access path was also verified after a completed Stripe sandbox Pro checkout: availability reported Pro access, and a fixed cue request returned HTTP 200 with MPEG audio. This did not grant camera permission or send camera frames.

The server limits each request to an allowlisted cue and a 10-second provider timeout, bounds returned audio to 2 MiB, deduplicates in-flight requests, caches successful clips in process memory, limits concurrent generations to two, and backs off failed cues for 30 seconds. Each cue is generated at most once per running process after a successful response.

That cache and backoff do not coordinate across server instances or survive a process restart. A public multi-instance deployment needs a durable shared audio cache and distributed request/rate controls before enabling the provider, so workers cannot independently regenerate the same paid cue or amplify failures. Configure those controls for the deployment's traffic and ElevenLabs account before launch.
