import { useBenchmark } from "@/lib/hooks/use-benchmark";
import { useCamera } from "@/lib/hooks/use-camera";
import { usePoseLibrary } from "@/lib/hooks/use-pose-library";
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
import { fireEvent, render, screen } from "@testing-library/react";
import { useSetAtom, useAtomValue } from "jotai";
import React from "react";
import { CameraScreen } from "./camera-screen";

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (
    loader: () => Promise<{
      default: React.ComponentType<Record<string, unknown>>;
    }>,
  ) => {
    const Lazy = React.lazy(loader);
    return function DynamicWrapper(props: Record<string, unknown>) {
      return (
        <React.Suspense fallback={null}>
          <Lazy {...props} />
        </React.Suspense>
      );
    };
  },
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

jest.mock("@/lib/hooks/use-benchmark", () => ({
  useBenchmark: jest.fn().mockReturnValue({ status: "idle", result: null }),
}));

jest.mock("@/lib/hooks/use-camera", () => ({
  useCamera: jest.fn(),
}));

jest.mock("jotai", () => {
  const actual = jest.requireActual("jotai");
  return {
    ...actual,
    useSetAtom: jest.fn(),
    useAtomValue: jest.fn(),
  };
});

jest.mock("@/components/camera/camera-preview", () => ({
  CameraPreview: () => <div data-testid="camera-preview" />,
}));

jest.mock("@/components/camera/voice-coach", () => ({
  VoiceCoach: () => <div data-testid="voice-coach" />,
}));

jest.mock("@/components/camera/wireframe-canvas", () => ({
  WireframeCanvas: () => <div data-testid="wireframe-canvas" />,
}));

jest.mock("@/lib/hooks/use-distance-detection", () => ({
  useDistanceDetection: jest.fn(),
}));

jest.mock("@/lib/hooks/use-framing-detection", () => ({
  useFramingDetection: jest.fn(),
}));

jest.mock("@/lib/hooks/use-lighting-detection", () => ({
  useLightingDetection: jest.fn(),
}));

jest.mock("@/lib/hooks/use-scene-detection", () => ({
  useSceneDetection: jest.fn(),
}));

jest.mock("@/lib/hooks/use-pose-library", () => ({
  usePoseLibrary: jest.fn().mockReturnValue({ nextPose: jest.fn() }),
}));

import { useSmartShutter } from "@/lib/hooks/use-smart-shutter";

jest.mock("@/lib/hooks/use-smart-shutter", () => ({
  useSmartShutter: jest.fn(),
}));

jest.mock("@/components/screens/preview-screen", () => ({
  PreviewScreen: ({ imageUrl }: { imageUrl: string }) => (
    <div data-testid="preview-screen" data-image={imageUrl} />
  ),
}));

jest.mock("@/lib/utils/audio-feedback", () => ({
  preloadAudio: jest.fn(),
}));

jest.mock("@/lib/utils/capture-photo", () => ({
  capturePhoto: jest.fn().mockReturnValue("data:image/jpeg;base64,manual"),
}));

jest.mock("@/components/camera/detection-failure-warning", () => ({
  DetectionFailureWarning: () => (
    <div data-testid="detection-failure-warning" />
  ),
}));

jest.mock("@/components/camera/subject-distance-warning", () => ({
  SubjectDistanceWarning: () => <div data-testid="subject-distance-warning" />,
}));

jest.mock("@/components/camera/subject-framing-warning", () => ({
  SubjectFramingWarning: () => <div data-testid="subject-framing-warning" />,
}));

jest.mock("@/components/camera/lighting-warning", () => ({
  LightingWarning: () => <div data-testid="lighting-warning" />,
}));

jest.mock("@/components/camera/feedback-glow", () => ({
  FeedbackGlow: () => <div data-testid="feedback-glow" />,
}));

jest.mock("@/components/camera/lite-mode-indicator", () => ({
  LiteModeIndicator: () => <div data-testid="lite-mode-indicator" />,
}));

jest.mock("@/components/camera/unsupported-device-warning", () => ({
  UnsupportedDeviceWarning: () => (
    <div data-testid="unsupported-device-warning" />
  ),
}));

describe("CameraScreen Component", () => {
  let mockStartCamera: jest.Mock;
  let mockStopCamera: jest.Mock;
  let mockSetFacingMode: jest.Mock;
  let mockSetCapturedPhoto: jest.Mock;
  let mockSetLiteMode: jest.Mock;
  let mockSetDeviceUnsupported: jest.Mock;
  let mockSetFitMode: jest.Mock;

  beforeEach(() => {
    mockStartCamera = jest.fn();
    mockStopCamera = jest.fn();
    mockSetFacingMode = jest.fn();
    mockSetCapturedPhoto = jest.fn();
    mockSetLiteMode = jest.fn();
    mockSetDeviceUnsupported = jest.fn();
    mockSetFitMode = jest.fn();

    (useSetAtom as jest.Mock).mockImplementation((atom: unknown) => {
      if (atom === capturedPhotoAtom) return mockSetCapturedPhoto;
      if (atom === liteModeAtom) return mockSetLiteMode;
      if (atom === deviceUnsupportedAtom) return mockSetDeviceUnsupported;
      if (atom === cameraFacingModeAtom) return mockSetFacingMode;
      if (atom === cameraFitModeAtom) return mockSetFitMode;
      return jest.fn();
    });
    (useAtomValue as jest.Mock).mockImplementation((atom: unknown) => {
      if (atom === capturedPhotoAtom) return null;
      if (atom === videoElementAtom) return null;
      if (atom === cameraFitModeAtom) return "cover";
      return undefined;
    });

    (useCamera as jest.Mock).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      status: "idle",
      facingMode: "environment",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should show Start Camera button when status is idle (user gesture required)", () => {
    render(<CameraScreen />);
    expect(screen.getByText("Start Camera")).toBeInTheDocument();
  });

  it("should call startCamera when button is clicked (AC2 compliance)", () => {
    render(<CameraScreen />);

    fireEvent.click(screen.getByText("Start Camera"));

    expect(mockStartCamera).toHaveBeenCalledWith("environment");
  });

  it("should NOT show Start Camera button when status is ready", () => {
    (useCamera as jest.Mock).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      status: "ready",
    });

    render(<CameraScreen />);
    expect(screen.queryByText("Start Camera")).not.toBeInTheDocument();
  });

  it("should stop camera on unmount", () => {
    const { unmount } = render(<CameraScreen />);
    unmount();
    expect(mockStopCamera).toHaveBeenCalled();
  });

  it("should wire Next Pose button to nextPose when status is ready", () => {
    const mockNextPose = jest.fn();
    (usePoseLibrary as jest.Mock).mockReturnValue({ nextPose: mockNextPose });
    (useCamera as jest.Mock).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      status: "ready",
      facingMode: "environment",
    });

    render(<CameraScreen />);

    const nextPoseButton = screen.getByLabelText(/next pose/i);
    fireEvent.click(nextPoseButton);

    expect(mockNextPose).toHaveBeenCalled();
  });

  it("should render SubjectDistanceWarning in the camera view", () => {
    render(<CameraScreen />);
    expect(screen.getByTestId("subject-distance-warning")).toBeInTheDocument();
  });

  it("should render VoiceCoach in the camera view", () => {
    render(<CameraScreen />);
    expect(screen.getByTestId("voice-coach")).toBeInTheDocument();
  });

  it("should render SubjectFramingWarning in the camera view", () => {
    render(<CameraScreen />);
    expect(screen.getByTestId("subject-framing-warning")).toBeInTheDocument();
  });

  it("should render LightingWarning in the camera view", () => {
    render(<CameraScreen />);
    expect(screen.getByTestId("lighting-warning")).toBeInTheDocument();
  });

  it("should render DetectionFailureWarning in the camera view", () => {
    render(<CameraScreen />);
    expect(screen.getByTestId("detection-failure-warning")).toBeInTheDocument();
  });

  it("should show ControlBar and handle flip when status is ready", () => {
    (useCamera as jest.Mock).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      status: "ready",
      facingMode: "environment",
    });

    render(<CameraScreen />);

    const flipButton = screen.getByLabelText(/flip camera/i);
    expect(flipButton).toBeInTheDocument();

    fireEvent.click(flipButton);
    expect(mockStartCamera).toHaveBeenCalledWith("user");
    expect(mockSetFacingMode).toHaveBeenCalledWith("user");
  });

  it("should render PreviewScreen when capturedPhotoAtom is non-null", async () => {
    (useAtomValue as jest.Mock).mockImplementation((atom: unknown) => {
      if (atom === capturedPhotoAtom) return "data:image/jpeg;base64,test";
      if (atom === cameraFitModeAtom) return "cover";
      return undefined;
    });

    render(<CameraScreen />);
    expect(await screen.findByTestId("preview-screen")).toBeInTheDocument();
  });

  it("should not render PreviewScreen when capturedPhotoAtom is null", () => {
    render(<CameraScreen />);
    expect(screen.queryByTestId("preview-screen")).not.toBeInTheDocument();
  });

  it("should call useSmartShutter hook", () => {
    render(<CameraScreen />);
    expect(useSmartShutter).toHaveBeenCalled();
  });

  it("should capture photo when shutter button is clicked", () => {
    const mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
    } as HTMLVideoElement;
    (useAtomValue as jest.Mock).mockImplementation((atom: unknown) => {
      if (atom === capturedPhotoAtom) return null;
      if (atom === videoElementAtom) return mockVideo;
      if (atom === cameraFitModeAtom) return "cover";
      return undefined;
    });
    (useCamera as jest.Mock).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      status: "ready",
      facingMode: "environment",
    });

    render(<CameraScreen />);
    fireEvent.click(screen.getByLabelText("Capture Photo"));

    expect(capturePhoto).toHaveBeenCalledWith(mockVideo, false);
    expect(mockSetCapturedPhoto).toHaveBeenCalledWith(
      "data:image/jpeg;base64,manual",
    );
  });

  it("should capture mirrored photo when facingMode is user", () => {
    const mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
    } as HTMLVideoElement;
    (useAtomValue as jest.Mock).mockImplementation((atom: unknown) => {
      if (atom === capturedPhotoAtom) return null;
      if (atom === videoElementAtom) return mockVideo;
      if (atom === cameraFitModeAtom) return "cover";
      return undefined;
    });
    (useCamera as jest.Mock).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      status: "ready",
      facingMode: "user",
    });

    render(<CameraScreen />);
    fireEvent.click(screen.getByLabelText("Capture Photo"));

    expect(capturePhoto).toHaveBeenCalledWith(mockVideo, true);
    expect(mockSetCapturedPhoto).toHaveBeenCalledWith(
      "data:image/jpeg;base64,manual",
    );
  });

  it("should not capture when videoElement is null", () => {
    (useAtomValue as jest.Mock).mockImplementation((atom: unknown) => {
      if (atom === capturedPhotoAtom) return null;
      if (atom === videoElementAtom) return null;
      if (atom === cameraFitModeAtom) return "cover";
      return undefined;
    });
    (useCamera as jest.Mock).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      status: "ready",
      facingMode: "environment",
    });

    render(<CameraScreen />);
    fireEvent.click(screen.getByLabelText("Capture Photo"));

    expect(capturePhoto).not.toHaveBeenCalled();
  });

  it("should call preloadAudio before startCamera on Start Camera click", () => {
    render(<CameraScreen />);
    fireEvent.click(screen.getByText("Start Camera"));

    expect(preloadAudio).toHaveBeenCalled();
    expect(mockStartCamera).toHaveBeenCalled();
    const preloadOrder = (preloadAudio as jest.Mock).mock
      .invocationCallOrder[0];
    const startOrder = mockStartCamera.mock.invocationCallOrder[0];
    expect(preloadOrder).toBeLessThan(startOrder);
  });

  it("keeps manual controls available without masking the camera during calibration", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "loading",
      result: null,
    });
    (useCamera as jest.Mock).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      status: "ready",
      facingMode: "environment",
    });
    render(<CameraScreen />);
    expect(screen.queryByTestId("benchmark-loading")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Capture Photo" })).toBeEnabled();
  });

  it("should not show benchmark loading overlay when status is idle", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "idle",
      result: null,
    });

    render(<CameraScreen />);
    expect(screen.queryByTestId("benchmark-loading")).not.toBeInTheDocument();
  });

  it("should not show benchmark loading overlay when status is ready", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "ready",
      result: { fps: 25, timestamp: 1000 },
    });

    render(<CameraScreen />);
    expect(screen.queryByTestId("benchmark-loading")).not.toBeInTheDocument();
  });

  it("should not show benchmark loading overlay when status is error", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "error",
      result: null,
    });

    render(<CameraScreen />);
    expect(screen.queryByTestId("benchmark-loading")).not.toBeInTheDocument();
  });

  it("should render LiteModeIndicator in the camera view", () => {
    render(<CameraScreen />);
    expect(screen.getByTestId("lite-mode-indicator")).toBeInTheDocument();
  });

  it("should auto-enable lite mode when benchmark FPS is below LITE_MODE_FPS", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "ready",
      result: { fps: 12, timestamp: 1000 },
    });

    render(<CameraScreen />);
    expect(mockSetLiteMode).toHaveBeenCalledWith(true);
  });

  it("should not auto-enable lite mode when benchmark FPS is above LITE_MODE_FPS", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "ready",
      result: { fps: 25, timestamp: 1000 },
    });

    render(<CameraScreen />);
    expect(mockSetLiteMode).not.toHaveBeenCalled();
  });

  it("should not auto-enable lite mode when benchmark FPS equals LITE_MODE_FPS", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "ready",
      result: { fps: 15, timestamp: 1000 },
    });

    render(<CameraScreen />);
    expect(mockSetLiteMode).not.toHaveBeenCalled();
  });

  it("should not auto-enable lite mode when benchmark result is null", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "idle",
      result: null,
    });

    render(<CameraScreen />);
    expect(mockSetLiteMode).not.toHaveBeenCalled();
  });

  it("should not capture when capturedPhoto is already set", () => {
    const mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
    } as HTMLVideoElement;
    (useAtomValue as jest.Mock).mockImplementation((atom: unknown) => {
      if (atom === capturedPhotoAtom) return "data:image/jpeg;base64,existing";
      if (atom === videoElementAtom) return mockVideo;
      if (atom === cameraFitModeAtom) return "cover";
      return undefined;
    });
    (useCamera as jest.Mock).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      status: "ready",
      facingMode: "environment",
    });

    render(<CameraScreen />);
    fireEvent.click(screen.getByLabelText("Capture Photo"));

    expect(capturePhoto).not.toHaveBeenCalled();
  });

  it("should render UnsupportedDeviceWarning in the camera view", () => {
    render(<CameraScreen />);
    expect(
      screen.getByTestId("unsupported-device-warning"),
    ).toBeInTheDocument();
  });

  it("should set deviceUnsupportedAtom when benchmark FPS is below UNSUPPORTED_FPS_THRESHOLD", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "ready",
      result: { fps: 8, timestamp: 1000 },
    });

    render(<CameraScreen />);
    expect(mockSetDeviceUnsupported).toHaveBeenCalledWith(true);
  });

  it("should set deviceUnsupportedAtom when benchmark FPS is one below UNSUPPORTED_FPS_THRESHOLD", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "ready",
      result: { fps: 9, timestamp: 1000 },
    });

    render(<CameraScreen />);
    expect(mockSetDeviceUnsupported).toHaveBeenCalledWith(true);
  });

  it("should not set deviceUnsupportedAtom when benchmark FPS equals UNSUPPORTED_FPS_THRESHOLD", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "ready",
      result: { fps: 10, timestamp: 1000 },
    });

    render(<CameraScreen />);
    expect(mockSetDeviceUnsupported).not.toHaveBeenCalled();
  });

  it("should not set deviceUnsupportedAtom when benchmark FPS is above UNSUPPORTED_FPS_THRESHOLD", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "ready",
      result: { fps: 25, timestamp: 1000 },
    });

    render(<CameraScreen />);
    expect(mockSetDeviceUnsupported).not.toHaveBeenCalled();
  });

  it("should not set deviceUnsupportedAtom when benchmark result is null", () => {
    (useBenchmark as jest.Mock).mockReturnValue({
      status: "idle",
      result: null,
    });

    render(<CameraScreen />);
    expect(mockSetDeviceUnsupported).not.toHaveBeenCalled();
  });
});
