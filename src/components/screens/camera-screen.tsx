"use client";

import { CameraErrorBanner } from "@/components/camera/camera-error-banner";
import styles from "@/components/camera/camera-ui.module.css";
import { CameraPreview } from "@/components/camera/camera-preview";
import { DetectionFailureWarning } from "@/components/camera/detection-failure-warning";
import { FeedbackGlow } from "@/components/camera/feedback-glow";
import { LightingWarning } from "@/components/camera/lighting-warning";
import { LiteModeIndicator } from "@/components/camera/lite-mode-indicator";
import { PoseCorrectionPrompt } from "@/components/camera/pose-correction-prompt";
import { SubjectDistanceWarning } from "@/components/camera/subject-distance-warning";
import { SubjectFramingWarning } from "@/components/camera/subject-framing-warning";
import { UnsupportedDeviceWarning } from "@/components/camera/unsupported-device-warning";
import { VoiceCoach } from "@/components/camera/voice-coach";
import { ControlBar } from "@/components/controls/control-bar";
import { PoseHintCard } from "@/components/controls/pose-hint-card";
import {
  LITE_MODE_FPS,
  UNSUPPORTED_FPS_THRESHOLD,
} from "@/constants/app.constants";
import { useBenchmark } from "@/lib/hooks/use-benchmark";
import { useCamera } from "@/lib/hooks/use-camera";
import { useDistanceDetection } from "@/lib/hooks/use-distance-detection";
import { useFramingDetection } from "@/lib/hooks/use-framing-detection";
import { useLightingDetection } from "@/lib/hooks/use-lighting-detection";
import { usePoseLibrary } from "@/lib/hooks/use-pose-library";
import { useSceneDetection } from "@/lib/hooks/use-scene-detection";
import { useSmartShutter } from "@/lib/hooks/use-smart-shutter";
import { PreviewScreen } from "@/components/screens/preview-screen";
import {
  cameraFacingModeAtom,
  cameraFitModeAtom,
  capturedPhotoAtom,
  videoElementAtom,
} from "@/lib/stores/camera-store";
import {
  deviceUnsupportedAtom,
  liteModeAtom,
} from "@/lib/stores/settings-store";
import { preloadAudio } from "@/lib/utils/audio-feedback";
import { capturePhoto } from "@/lib/utils/capture-photo";
import { logger } from "@/lib/utils/logger";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

const COMPONENT_NAME = "CameraScreen";

export function CameraScreen() {
  const { result: benchmarkResult } = useBenchmark();
  const setLiteMode = useSetAtom(liteModeAtom);
  const setDeviceUnsupported = useSetAtom(deviceUnsupportedAtom);
  const { startCamera, stopCamera, status, facingMode, error } = useCamera();
  const { nextPose } = usePoseLibrary();
  useSceneDetection();
  useDistanceDetection();
  useFramingDetection();
  useLightingDetection();
  useSmartShutter();
  const capturedPhoto = useAtomValue(capturedPhotoAtom);
  const videoElement = useAtomValue(videoElementAtom);
  const setFacingMode = useSetAtom(cameraFacingModeAtom);
  const setCapturedPhoto = useSetAtom(capturedPhotoAtom);
  const [fitMode, setFitMode] = useAtom(cameraFitModeAtom);

  const handleToggleFit = useCallback(() => {
    setFitMode((prev) => (prev === "cover" ? "contain" : "cover"));
  }, [setFitMode]);

  // Use a ref to ensure we stop the *current* stream even if the cleanup function is stale
  const stopCameraRef = useRef(stopCamera);

  useEffect(() => {
    stopCameraRef.current = stopCamera;
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      stopCameraRef.current();
    };
  }, []);

  useEffect(() => {
    if (benchmarkResult && benchmarkResult.fps < LITE_MODE_FPS) {
      setLiteMode(true);
    }
  }, [benchmarkResult, setLiteMode]);

  useEffect(() => {
    if (benchmarkResult && benchmarkResult.fps < UNSUPPORTED_FPS_THRESHOLD) {
      setDeviceUnsupported(true);
    }
  }, [benchmarkResult, setDeviceUnsupported]);

  const capturedPhotoRef = useRef(capturedPhoto);

  useEffect(() => {
    capturedPhotoRef.current = capturedPhoto;
  }, [capturedPhoto]);

  const handleManualShutter = useCallback(() => {
    if (!videoElement || capturedPhotoRef.current) return;
    const isMirrored = facingMode === "user";
    const dataUrl = capturePhoto(videoElement, isMirrored);
    if (dataUrl) setCapturedPhoto(dataUrl);
  }, [videoElement, facingMode, setCapturedPhoto]);

  const handleFlipCamera = useCallback(() => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  }, [facingMode, setFacingMode, startCamera]);

  logger.log(COMPONENT_NAME, "Render", { status });

  const isSwitching = status === "loading";

  return (
    <div className={styles.live} data-testid="camera-screen">
      <header className={styles.liveHeader} data-testid="camera-header">
        <Link href="/" className={styles.brand} aria-label="Perfect Shot home">
          <Image
            src="/icon-192.png"
            width={24}
            height={24}
            alt=""
            unoptimized
            className={styles.brandIcon}
          />
          <span>
            perfect<span className={styles.brandLight}>shot</span>
          </span>
        </Link>
        <Link href="/" className={styles.homeLink}>
          <ArrowLeft size={18} aria-hidden="true" /> Home
        </Link>
      </header>
      <CameraErrorBanner />
      <div className="relative h-full w-full">
        <CameraPreview />
        <VoiceCoach
          key={`${status === "ready" ? "ready" : "not-ready"}:${capturedPhoto ? "captured" : "live"}`}
          cameraReady={status === "ready"}
          captured={capturedPhoto !== null}
        />
        <FeedbackGlow />
        <div className={styles.coachingMessages}>
          <DetectionFailureWarning />
          <PoseCorrectionPrompt />
          <SubjectDistanceWarning />
          <SubjectFramingWarning />
          <LightingWarning />
          <PoseHintCard />
          <LiteModeIndicator />
          <UnsupportedDeviceWarning />
        </div>
      </div>

      {/* Control Bar - only visible when camera is ready or loading */}
      {status === "ready" || status === "loading" ? (
        <ControlBar
          onFlipCamera={handleFlipCamera}
          onShutter={handleManualShutter}
          onNextPose={nextPose}
          onToggleFitMode={handleToggleFit}
          fitMode={fitMode}
          isSwitching={isSwitching}
        />
      ) : null}

      {capturedPhoto && <PreviewScreen imageUrl={capturedPhoto} />}

      {/* Start Camera overlay - user gesture required for iOS Safari (AC2 from Story 1.2) */}
      {status === "idle" || status === "error" ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 px-6">
          <div className="max-w-md bg-[#f8f5f0] p-8 text-[#11120d]">
            <Camera size={28} aria-hidden="true" />
            <h1 className="mt-4 text-3xl font-medium tracking-tight">
              Ready when you are.
            </h1>
            <p
              className="mt-3 text-base leading-relaxed"
              role={error ? "alert" : undefined}
            >
              {error
                ? error.code === "NOT_FOUND"
                  ? "No camera was found. Connect a camera and try again."
                  : "We couldn’t start your camera. Close other camera apps and try again."
                : "Start the live view, find a pose, and make it yours."}
            </p>
            <button
              onClick={() => {
                preloadAudio();
                startCamera(facingMode);
              }}
              className={styles.primaryButton}
            >
              Start Camera
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
