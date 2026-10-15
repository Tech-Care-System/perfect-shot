import { Provider } from "jotai";
import { createStore } from "jotai/vanilla";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { capturedPhotoAtom } from "@/lib/stores/camera-store";
import {
  detectionLostAtom,
  lightingPoorAtom,
  poseCorrectionAtom,
  poseScoreAtom,
  subjectFramingAtom,
  subjectTooFarAtom,
  targetPoseAtom,
} from "@/lib/stores/pose-store";
import { VoiceCoach } from "./voice-coach";

type MockSource = {
  buffer: AudioBuffer | null;
  onended: (() => void) | null;
  connect: jest.Mock;
  disconnect: jest.Mock;
  start: jest.Mock;
  stop: jest.Mock;
};

let audioContexts: MockAudioContext[] = [];

function latestAudioContext() {
  return audioContexts[audioContexts.length - 1]!;
}

class MockAudioContext {
  state: AudioContextState = "suspended";
  destination = {} as AudioDestinationNode;
  source: MockSource | null = null;
  resume = jest.fn(async () => {
    this.state = "running";
  });
  suspend = jest.fn(async () => {
    this.state = "suspended";
  });
  close = jest.fn(async () => {
    this.state = "closed";
  });
  decodeAudioData = jest.fn(async () => ({}) as AudioBuffer);

  constructor() {
    audioContexts.push(this);
  }

  createBufferSource() {
    this.source = {
      buffer: null,
      onended: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
    return this.source as unknown as AudioBufferSourceNode;
  }
}

const mockedFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

function availabilityResponse(
  plan: "free" | "starter" | "pro" = "starter",
  configured = true,
) {
  return {
    ok: true,
    json: async () => ({
      plan,
      configured,
      available: configured && plan !== "free",
    }),
  } as unknown as Response;
}

function audioResponse() {
  const reader = {
    read: jest
      .fn()
      .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3]) })
      .mockResolvedValueOnce({ done: true, value: undefined }),
    releaseLock: jest.fn(),
  };
  return {
    ok: true,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? "audio/mpeg" : "3",
    },
    body: { getReader: () => reader },
  } as unknown as Response;
}

function renderCoach(
  options: {
    cameraReady?: boolean;
    captured?: boolean;
    expanded?: boolean;
  } = {},
) {
  const store = createStore();
  store.set(capturedPhotoAtom, options.captured ? "captured" : null);
  store.set(detectionLostAtom, false);
  store.set(subjectTooFarAtom, false);
  store.set(subjectFramingAtom, null);
  store.set(lightingPoorAtom, false);
  store.set(poseCorrectionAtom, "Relax your shoulders down");
  store.set(targetPoseAtom, null);
  store.set(poseScoreAtom, 0);

  const view = render(
    <Provider store={store}>
      <VoiceCoach
        key={`${(options.cameraReady ?? true) ? "ready" : "not-ready"}:${options.captured ? "captured" : "live"}`}
        cameraReady={options.cameraReady ?? true}
        captured={options.captured ?? false}
      />
    </Provider>,
  );
  if (options.expanded !== false)
    fireEvent.click(view.getByText("Voice coach"));
  return { ...view, store };
}

async function waitForToggle() {
  return screen.findByRole("button", { name: "Turn voice coaching on" });
}

describe("VoiceCoach", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    audioContexts = [];
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      writable: true,
      value: MockAudioContext,
    });
    global.fetch = mockedFetch;
    mockedFetch.mockImplementation(async (_input, init) => {
      if (init?.method === "POST") return audioResponse();
      return availabilityResponse();
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    Reflect.deleteProperty(document, "visibilityState");
  });

  it("keeps the camera view clear until the user opens the voice controls", async () => {
    const view = renderCoach({ expanded: false });
    expect(view.container.querySelector("details")).not.toHaveAttribute("open");
    expect(
      screen.queryByRole("button", { name: "Turn voice coaching on" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Voice coach"));
    await waitForToggle();
    expect(
      mockedFetch.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(0);
  });

  it("keeps voice off and makes no speech request until the user opts in", async () => {
    renderCoach();
    await waitForToggle();
    expect(
      screen.getByText(/only a fixed coaching sentence/i),
    ).toBeInTheDocument();

    jest.useFakeTimers();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(8_000);
    });

    expect(
      mockedFetch.mock.calls.some(([, init]) => init?.method === "POST"),
    ).toBe(false);
  });

  it("shows the Starter and Pro pricing CTA for Free without enabling speech", async () => {
    mockedFetch.mockImplementation(async () => availabilityResponse("free"));

    renderCoach();
    const upgradeLink = await screen.findByRole("link", {
      name: "Voice coaching is included in Starter and Pro",
    });

    expect(upgradeLink).toHaveAttribute("href", "/#pricing");
    expect(
      mockedFetch.mock.calls.some(([, init]) => init?.method === "POST"),
    ).toBe(false);
  });

  it("unlocks audio in the click gesture, speaks a stable cue once, and stops on opt-out", async () => {
    renderCoach();
    const toggle = await waitForToggle();
    const managePlanButton = screen.getByRole("button", {
      name: "Manage plan",
    });
    expect(managePlanButton.closest("form")).toHaveAttribute(
      "action",
      "/api/billing-portal",
    );
    expect(managePlanButton.closest("form")).toHaveAttribute("method", "post");
    jest.useFakeTimers();

    fireEvent.click(toggle);
    expect(latestAudioContext().resume).toHaveBeenCalledTimes(1);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1_500);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      mockedFetch.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(1);
    expect(latestAudioContext().source?.start).toHaveBeenCalledWith(0);
    expect(screen.getByText("Speaking…")).toBeInTheDocument();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(20_000);
    });
    expect(
      mockedFetch.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Turn voice coaching off" }),
    );
    expect(latestAudioContext().source?.stop).toHaveBeenCalled();
  });

  it("aborts an in-flight cue request when the user turns voice off", async () => {
    let requestSignal: AbortSignal | undefined;
    mockedFetch.mockImplementation((_input, init) => {
      if (init?.method === "POST") {
        requestSignal = init.signal as AbortSignal;
        return new Promise<Response>(() => {});
      }
      return Promise.resolve(availabilityResponse());
    });

    renderCoach();
    const toggle = await waitForToggle();
    jest.useFakeTimers();
    fireEvent.click(toggle);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1_500);
    });
    expect(requestSignal).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: "Turn voice coaching off" }),
    );

    expect(requestSignal?.aborted).toBe(true);
  });

  it("stops playback and closes the audio context when unmounted", async () => {
    const { unmount } = renderCoach();
    const toggle = await waitForToggle();
    jest.useFakeTimers();
    fireEvent.click(toggle);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1_500);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(latestAudioContext().source?.start).toHaveBeenCalled();

    unmount();

    expect(latestAudioContext().source?.stop).toHaveBeenCalled();
    expect(latestAudioContext().close).toHaveBeenCalled();
  });

  it("stops playback when the document becomes hidden", async () => {
    renderCoach();
    const toggle = await waitForToggle();
    jest.useFakeTimers();
    fireEvent.click(toggle);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1_500);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(latestAudioContext().source?.start).toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(latestAudioContext().source?.stop).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Turn voice coaching on" }),
    ).toBeInTheDocument();
  });

  it("stops playback when capture remounts the control", async () => {
    const rendered = renderCoach();
    const toggle = await waitForToggle();
    jest.useFakeTimers();
    fireEvent.click(toggle);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1_500);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(latestAudioContext().source?.start).toHaveBeenCalled();
    const priorAudioContext = latestAudioContext();

    await act(async () =>
      rendered.rerender(
        <Provider store={rendered.store}>
          <VoiceCoach key="captured" cameraReady={true} captured={true} />
        </Provider>,
      ),
    );

    expect(priorAudioContext.source?.stop).toHaveBeenCalled();
    expect(priorAudioContext.close).toHaveBeenCalled();
  });

  it("stops playback when the camera becomes not ready and remounts the control", async () => {
    const rendered = renderCoach();
    const toggle = await waitForToggle();
    jest.useFakeTimers();
    fireEvent.click(toggle);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1_500);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(latestAudioContext().source?.start).toHaveBeenCalled();
    const priorAudioContext = latestAudioContext();

    await act(async () =>
      rendered.rerender(
        <Provider store={rendered.store}>
          <VoiceCoach key="not-ready" cameraReady={false} captured={false} />
        </Provider>,
      ),
    );

    expect(priorAudioContext.source?.stop).toHaveBeenCalled();
    expect(priorAudioContext.close).toHaveBeenCalled();
  });
});
