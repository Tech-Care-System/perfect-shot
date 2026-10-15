"use client";

import {
  currentPoseAtom,
  detectionLostAtom,
  lightingPoorAtom,
  poseCorrectionAtom,
  poseScoreAtom,
  subjectFramingAtom,
  subjectTooFarAtom,
  targetPoseAtom,
} from "@/lib/stores/pose-store";
import { selectVoiceCue } from "@/lib/voice/select-cue";
import type { VoiceCueId, VoicePlan } from "@/lib/voice/cues";
import { useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const STABLE_CUE_MS = 1_500;
const SPEECH_COOLDOWN_MS = 6_000;
const MAX_CACHED_CLIPS = 16;
const MAX_AUDIO_BYTES = 2 * 1024 * 1024;

const poseMatchedAtom = selectAtom(poseScoreAtom, (score) => score >= 0.9);

type Availability = {
  configured: boolean;
  plan: VoicePlan;
};

type AudioState = "idle" | "loading" | "playing" | "error";

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function isVoicePlan(value: unknown): value is VoicePlan {
  return value === "free" || value === "starter" || value === "pro";
}

async function readBoundedAudio(response: Response): Promise<ArrayBuffer> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_AUDIO_BYTES) {
    throw new Error("Voice audio is too large.");
  }

  if (!response.body) throw new Error("Voice audio is unavailable.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_AUDIO_BYTES) {
        await reader.cancel();
        throw new Error("Voice audio is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const audio = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    audio.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const buffer = new ArrayBuffer(totalBytes);
  new Uint8Array(buffer).set(audio);
  return buffer;
}

export interface VoiceCoachProps {
  cameraReady: boolean;
  captured: boolean;
}

export function VoiceCoach({ cameraReady, captured }: VoiceCoachProps) {
  const detectionLost = useAtomValue(detectionLostAtom);
  const subjectTooFar = useAtomValue(subjectTooFarAtom);
  const subjectFraming = useAtomValue(subjectFramingAtom);
  const lightingPoor = useAtomValue(lightingPoorAtom);
  const poseCorrection = useAtomValue(poseCorrectionAtom);
  const targetPose = useAtomValue(targetPoseAtom);
  const currentPose = useAtomValue(currentPoseAtom);
  const poseMatched = useAtomValue(poseMatchedAtom);

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [availabilityFailed, setAvailabilityFailed] = useState(false);
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const [audioCue, setAudioCue] = useState<VoiceCueId | null>(null);
  const [retryCue, setRetryCue] = useState<VoiceCueId | null>(null);
  const [introducedPoseId, setIntroducedPoseId] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const enabledRef = useRef(false);
  const cameraReadyRef = useRef(cameraReady);
  const capturedRef = useRef(captured);
  const visibleRef = useRef(
    typeof document === "undefined" || document.visibilityState === "visible",
  );
  const availabilityRef = useRef<Availability | null>(availability);
  const currentCueRef = useRef<VoiceCueId | null>(null);
  const currentCueKeyRef = useRef<string | null>(null);
  const lastHandledCueRef = useRef<string | null>(null);
  const cooldownUntilRef = useRef(0);
  const decodedClipsRef = useRef(new Map<VoiceCueId, AudioBuffer>());

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    void fetch("/api/voice", {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Voice availability could not be checked.");
        const value: unknown = await response.json();
        if (!value || typeof value !== "object")
          throw new Error("Invalid voice availability response.");
        const result = value as Record<string, unknown>;
        if (
          typeof result.configured !== "boolean" ||
          !isVoicePlan(result.plan)
        ) {
          throw new Error("Invalid voice availability response.");
        }
        if (mounted) {
          const nextAvailability = {
            configured: result.configured,
            plan: result.plan,
          };
          availabilityRef.current = nextAvailability;
          setAvailability(nextAvailability);
        }
      })
      .catch(() => {
        if (mounted && !controller.signal.aborted) {
          availabilityRef.current = null;
          setAvailability(null);
          setAvailabilityFailed(true);
        }
      })
      .finally(() => {
        if (mounted) setCheckingAvailability(false);
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [availabilityRetry]);

  const stopCurrentAudio = useCallback((suspendContext = false) => {
    generationRef.current += 1;
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;

    const source = activeSourceRef.current;
    activeSourceRef.current = null;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // It may have ended between the state update and stop call.
      }
      try {
        source.disconnect();
      } catch {
        // Disconnect is best-effort after stop.
      }
    }

    if (suspendContext && audioContextRef.current?.state === "running") {
      void audioContextRef.current.suspend().catch(() => {});
    }
  }, []);

  const turnOff = useCallback(() => {
    enabledRef.current = false;
    lastHandledCueRef.current = null;
    cooldownUntilRef.current = 0;
    setEnabled(false);
    setRetryCue(null);
    setAudioState("idle");
    stopCurrentAudio(true);
  }, [stopCurrentAudio]);

  const retryAvailabilityCheck = () => {
    availabilityRef.current = null;
    setAvailability(null);
    setAvailabilityFailed(false);
    setCheckingAvailability(true);
    setAvailabilityRetry((retry) => retry + 1);
  };

  useEffect(() => {
    const onVisibilityChange = () => {
      visibleRef.current = document.visibilityState === "visible";
      if (!visibleRef.current) turnOff();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [turnOff]);

  const stopOnUnmount = stopCurrentAudio;
  useEffect(
    () => () => {
      enabledRef.current = false;
      stopOnUnmount();
      const context = audioContextRef.current;
      if (context && context.state !== "closed")
        void context.close().catch(() => {});
    },
    [stopOnUnmount],
  );

  const plan = availability?.plan ?? null;
  const available =
    availability?.configured === true && (plan === "starter" || plan === "pro");
  const currentPoseId = currentPose?.id ?? null;
  const cue = plan
    ? selectVoiceCue({
        cameraReady,
        captured,
        plan,
        detectionLost,
        subjectTooFar,
        subjectFraming,
        lightingPoor,
        poseCorrection,
        hasTargetPose: targetPose !== null,
        poseMatched,
        poseIntroPending:
          targetPose !== null &&
          (currentPoseId === null || introducedPoseId !== currentPoseId),
      })
    : null;
  const cueKey =
    cue === "pro-pose-intro"
      ? `${cue}:${currentPoseId ?? "selected-pose"}`
      : cue;

  useLayoutEffect(() => {
    cameraReadyRef.current = cameraReady;
    capturedRef.current = captured;
    currentCueRef.current = cue;
    currentCueKeyRef.current = cueKey;
  }, [cameraReady, captured, cue, cueKey]);

  const playCue = useCallback(
    async (
      cueId: VoiceCueId,
      generation: number,
      poseId: string | null,
      expectedCueKey: string,
    ) => {
      const isCurrent = () =>
        generationRef.current === generation &&
        currentCueRef.current === cueId &&
        currentCueKeyRef.current === expectedCueKey &&
        enabledRef.current &&
        cameraReadyRef.current &&
        !capturedRef.current &&
        visibleRef.current &&
        availabilityRef.current?.configured === true &&
        (availabilityRef.current.plan === "starter" ||
          availabilityRef.current.plan === "pro");

      if (!isCurrent()) return;
      requestAbortRef.current?.abort();
      const controller = new AbortController();
      requestAbortRef.current = controller;

      try {
        const context = audioContextRef.current;
        if (!context) throw new Error("Audio is unavailable.");

        let buffer = decodedClipsRef.current.get(cueId);
        if (!buffer) {
          setAudioCue(cueId);
          setAudioState("loading");
          const response = await fetch("/api/voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cue: cueId }),
            signal: controller.signal,
          });
          if (!response.ok)
            throw new Error("Voice guidance could not be loaded.");
          if (
            !response.headers
              .get("content-type")
              ?.toLowerCase()
              .startsWith("audio/")
          ) {
            throw new Error("Voice guidance could not be loaded.");
          }
          const audio = await readBoundedAudio(response);
          if (!isCurrent()) return;
          buffer = await context.decodeAudioData(audio);
          if (!isCurrent()) return;

          decodedClipsRef.current.delete(cueId);
          decodedClipsRef.current.set(cueId, buffer);
          while (decodedClipsRef.current.size > MAX_CACHED_CLIPS) {
            const oldestCue = decodedClipsRef.current.keys().next().value;
            if (oldestCue === undefined) break;
            decodedClipsRef.current.delete(oldestCue);
          }
        } else {
          decodedClipsRef.current.delete(cueId);
          decodedClipsRef.current.set(cueId, buffer);
        }

        if (!isCurrent()) return;
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.onended = () => {
          if (activeSourceRef.current === source) {
            activeSourceRef.current = null;
            if (cueId === "pro-pose-intro" && poseId)
              setIntroducedPoseId(poseId);
            setAudioState("idle");
          }
        };
        activeSourceRef.current = source;
        cooldownUntilRef.current = Date.now() + SPEECH_COOLDOWN_MS;
        setRetryCue(null);
        setAudioCue(cueId);
        setAudioState("playing");
        source.start(0);
      } catch {
        if (controller.signal.aborted || !isCurrent()) return;
        setAudioCue(cueId);
        setRetryCue(cueId);
        setAudioState("error");
      } finally {
        if (requestAbortRef.current === controller)
          requestAbortRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    stopCurrentAudio(false);

    if (
      !enabled ||
      !available ||
      !cameraReady ||
      captured ||
      !visibleRef.current ||
      !cue
    ) {
      if (!cue) lastHandledCueRef.current = null;
      return;
    }

    const scheduledCue = cue;
    const scheduledCueKey = cueKey ?? cue;
    if (lastHandledCueRef.current === scheduledCueKey) return;
    const generation = generationRef.current;
    let cooldownTimer: ReturnType<typeof setTimeout> | undefined;

    function playAfterCooldown() {
      if (
        generationRef.current !== generation ||
        !enabledRef.current ||
        currentCueKeyRef.current !== scheduledCueKey
      )
        return;
      const remaining = Math.max(0, cooldownUntilRef.current - Date.now());
      if (remaining > 0) {
        cooldownTimer = setTimeout(playAfterCooldown, remaining);
        return;
      }
      lastHandledCueRef.current = scheduledCueKey;
      void playCue(scheduledCue, generation, currentPoseId, scheduledCueKey);
    }

    const stabilityTimer = setTimeout(playAfterCooldown, STABLE_CUE_MS);

    return () => {
      clearTimeout(stabilityTimer);
      if (cooldownTimer) clearTimeout(cooldownTimer);
      stopCurrentAudio(false);
    };
  }, [
    enabled,
    available,
    cameraReady,
    captured,
    cue,
    cueKey,
    currentPoseId,
    playCue,
    stopCurrentAudio,
  ]);

  const handleToggle = () => {
    if (enabledRef.current) {
      turnOff();
      return;
    }
    if (!available || !cameraReady || captured) return;

    try {
      const browserWindow = window as WebkitWindow;
      const AudioContextConstructor =
        window.AudioContext ?? browserWindow.webkitAudioContext;
      if (!AudioContextConstructor) throw new Error("Audio is unavailable.");
      const context = audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = context;

      // Call resume inside the click gesture so iOS Safari can unlock Web Audio.
      const resumed = context.resume();
      enabledRef.current = true;
      setEnabled(true);
      setAudioState("idle");
      setRetryCue(null);
      void resumed.catch(() => {
        if (enabledRef.current) setAudioState("error");
      });
    } catch {
      setAudioState("error");
    }
  };

  const handleRetry = () => {
    const cueToRetry = retryCue;
    const expectedCueKey = currentCueKeyRef.current;
    if (
      !cueToRetry ||
      !expectedCueKey ||
      currentCueRef.current !== cueToRetry ||
      !enabledRef.current
    )
      return;
    const generation = ++generationRef.current;
    requestAbortRef.current?.abort();
    const context = audioContextRef.current;
    if (context) void context.resume().catch(() => {});
    const source = activeSourceRef.current;
    activeSourceRef.current = null;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // It may already have ended.
      }
    }
    void playCue(cueToRetry, generation, currentPoseId, expectedCueKey);
  };

  const displayedAudioState = audioCue === cue ? audioState : "idle";

  return (
    <details
      className="absolute right-4 top-4 z-40 max-w-[calc(100%-2rem)] rounded-2xl border border-white/20 bg-black/75 p-3 text-white shadow-lg backdrop-blur-md open:w-[min(24rem,calc(100%-2rem))]"
      aria-label="Voice coaching controls"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        Voice coach{" "}
        <span className="ml-auto text-white/80">{enabled ? "On" : "Off"}</span>
      </summary>
      <div className="pt-3">
        {checkingAvailability ? (
          <p className="text-base" role="status">
            Checking voice coaching…
          </p>
        ) : availabilityFailed ? (
          <div className="space-y-2">
            <p className="text-base" role="status">
              Couldn’t check voice coaching availability.
            </p>
            <button
              type="button"
              onClick={retryAvailabilityCheck}
              className="rounded-full border border-white/50 px-3 py-2 text-base font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Try again
            </button>
          </div>
        ) : plan === "free" ? (
          <div className="space-y-2">
            <Link
              href="/#pricing"
              className="inline-flex rounded-full bg-lime-300 px-3 py-2 text-base font-semibold text-black hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Voice coaching is included in Starter and Pro
            </Link>
          </div>
        ) : !available ? (
          <div className="space-y-2">
            <p className="text-base" role="status">
              Voice coaching is currently unavailable.
            </p>
            <button
              type="button"
              onClick={retryAvailabilityCheck}
              className="rounded-full border border-white/50 px-3 py-2 text-base font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Try again
            </button>
            <form action="/api/billing-portal" method="post">
              <button
                type="submit"
                className="rounded-full border border-white/50 px-3 py-2 text-base font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Manage plan
              </button>
            </form>
          </div>
        ) : (
          <>
            <button
              type="button"
              aria-pressed={enabled}
              aria-label={
                enabled ? "Turn voice coaching off" : "Turn voice coaching on"
              }
              aria-describedby="voice-coach-privacy"
              disabled={!cameraReady || captured}
              onClick={handleToggle}
              className="rounded-full bg-lime-300 px-3 py-2 text-base font-semibold text-black hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enabled ? "Voice coaching on" : "Voice coaching off"}
            </button>
            <p
              className="mt-2 text-base leading-relaxed text-white/85"
              id="voice-coach-privacy"
            >
              When you switch it on, only a fixed coaching sentence is sent to
              ElevenLabs. Camera frames and photos stay on your device.
            </p>
            <form action="/api/billing-portal" method="post" className="mt-2">
              <button
                type="submit"
                className="rounded-full border border-white/50 px-3 py-2 text-base font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Manage plan
              </button>
            </form>
            {!cameraReady && (
              <p className="mt-2 text-base text-white/85" role="status">
                Start the camera to enable voice coaching.
              </p>
            )}
            {displayedAudioState === "loading" && (
              <p className="mt-2 text-base" role="status">
                Loading voice guidance…
              </p>
            )}
            {displayedAudioState === "playing" && (
              <p className="mt-2 text-base" role="status">
                Speaking…
              </p>
            )}
            {displayedAudioState === "error" && (
              <div className="mt-2 flex items-center gap-2" role="status">
                <span className="text-base">
                  Voice guidance is unavailable.
                </span>
                {enabled && retryCue && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="rounded-full border border-white/50 px-3 py-2 text-base font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </details>
  );
}
