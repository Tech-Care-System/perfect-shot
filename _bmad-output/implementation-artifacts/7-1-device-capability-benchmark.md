# Story 7.1: Device Capability Benchmark

Status: done

## Story

As a developer,
I want to detect device performance on first launch,
so that I can adjust app settings for optimal experience.

## Acceptance Criteria

1. **AC1: Benchmark Hook** — A `useBenchmark()` hook is exported from `src/lib/hooks/use-benchmark.ts`. It creates a standalone Worker instance (`new Worker(new URL('../ai/worker.ts', import.meta.url), { type: 'module' })`), sends `INIT`, waits for `READY`, then processes 1 warmup frame + 5 measured frames. The warmup frame result is discarded. The hook returns `{ status: AsyncStatus; result: BenchmarkResult | null }`.

2. **AC2: FPS Measurement** — For each measured frame, `createImageBitmap(video)` captures the current video frame. The frame is sent to the worker via `postMessage({ type: 'DETECT', payload: { image, timestamp } }, [imageBitmap])` with transfer. The round-trip time is measured using `performance.now()` (start before postMessage, end on `POSE_RESULT` response). FPS is calculated as `Math.round(1000 / avgFrameTimeMs)` from the 5 measured frame times.

3. **AC3: localStorage Persistence** — On benchmark completion, the result `{ fps: number; timestamp: number }` is serialized to `localStorage` under key `BENCHMARK_STORAGE_KEY`. On subsequent launches, `useBenchmark` reads localStorage first — if a result exists, it returns immediately with `status: 'ready'` and does not create a worker or run frames.

4. **AC4: Benchmark Completion Time** — The 5 measured frames complete in < 2 seconds on target devices. This is a performance target for the frame processing portion; model initialization time is additive and device-dependent. The total user-visible time (loading indicator) includes model init + frame processing.

5. **AC5: Loading Indicator** — While `useBenchmark` status is `'loading'`, `CameraScreen` renders a loading overlay (`data-testid="benchmark-loading"`) with the text "Calibrating..." centered on screen over the camera preview. The overlay is removed when status transitions to `'ready'` or `'error'`.

6. **AC6: Worker Cleanup** — After the 5 measured frames are processed, the benchmark worker receives `{ type: 'TERMINATE' }` and `worker.terminate()` is called. If the component unmounts during the benchmark, the worker is terminated in the cleanup function. The benchmark worker is fully independent from the detection loop worker.

7. **AC7: Error Handling** — If worker initialization fails (ERROR response to INIT), or frame processing fails, the benchmark sets `status: 'error'` and `result` remains `null`. The app continues functioning without benchmark data. No errors are surfaced to the user. Stories 7.2 and 7.3 handle `null` benchmark results gracefully.

## Tasks / Subtasks

- [x] Task 1: Add benchmark constants to app.constants.ts (AC: #1, #2, #3)
  - [x] 1.1 Add `BENCHMARK_FRAMES = 5`, `BENCHMARK_WARMUP_FRAMES = 1`, `BENCHMARK_STORAGE_KEY`, `UNSUPPORTED_FPS_THRESHOLD = 10`, `BENCHMARK_TIMEOUT_MS = 15_000`
- [x] Task 2: Create useBenchmark hook (AC: #1, #2, #3, #4, #6, #7)
  - [x] 2.1 Create `src/lib/hooks/use-benchmark.ts` — standalone hook with worker creation, frame processing, FPS calculation, localStorage read/write
  - [x] 2.2 Create `src/lib/hooks/use-benchmark.test.ts` — tests for localStorage skip, benchmark flow, FPS calculation, worker cleanup, error handling
- [x] Task 3: Integrate benchmark into CameraScreen (AC: #5)
  - [x] 3.1 Modify `src/components/screens/camera-screen.tsx` — call `useBenchmark()`, render loading overlay when status is `'loading'`
  - [x] 3.2 Modify `src/components/screens/camera-screen.test.tsx` — test loading indicator visibility and benchmark mock integration

## Dev Notes

### Benchmark Hook Architecture — `src/lib/hooks/use-benchmark.ts`

The benchmark is a standalone, one-shot operation that runs before the normal detection loop. It creates its own Worker instance, measures per-frame processing time, and terminates the worker when done. This is intentionally separate from the detection loop's `useAIWorker` — no shared worker instances, no shared state.

**Flow:**

1. On mount, check localStorage for existing `BenchmarkResult`
2. If found → set `status: 'ready'`, return stored result, no worker created
3. If not found → wait for `videoElementAtom` to become non-null
4. Create Worker → send `INIT` → wait for `READY`
5. Process 1 warmup frame (discard timing)
6. Process 5 measured frames (record round-trip times via `performance.now()`)
7. Calculate `fps = Math.round(1000 / avgFrameTimeMs)`
8. Store `{ fps, timestamp: Date.now() }` in localStorage
9. Terminate worker
10. Set `status: 'ready'`

```typescript
"use client";

import {
  BENCHMARK_FRAMES,
  BENCHMARK_STORAGE_KEY,
  BENCHMARK_WARMUP_FRAMES,
} from "@/constants/app.constants";
import type { AIWorkerMessage, AIWorkerResponse } from "@/lib/ai/worker.types";
import { videoElementAtom } from "@/lib/stores/camera-store";
import type { AsyncStatus } from "@/lib/types/status.types";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";

export interface BenchmarkResult {
  fps: number;
  timestamp: number;
}

function getStoredResult(): BenchmarkResult | null {
  try {
    const raw = localStorage.getItem(BENCHMARK_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BenchmarkResult;
  } catch {
    return null;
  }
}

function storeResult(result: BenchmarkResult): void {
  try {
    localStorage.setItem(BENCHMARK_STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Silent failure — localStorage may be full or unavailable
  }
}

export function useBenchmark() {
  const videoElement = useAtomValue(videoElementAtom);
  const [status, setStatus] = useState<AsyncStatus>(() => {
    return getStoredResult() ? "ready" : "idle";
  });
  const [result, setResult] = useState<BenchmarkResult | null>(() =>
    getStoredResult(),
  );
  const hasRunRef = useRef(!!getStoredResult());
  const workerRef = useRef<Worker | null>(null);

  const runBenchmark = useCallback(async (video: HTMLVideoElement) => {
    setStatus("loading");

    try {
      const worker = new Worker(new URL("../ai/worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      await new Promise<void>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent<AIWorkerResponse>) => {
          if (e.data.type === "READY") resolve();
          else if (e.data.type === "ERROR")
            reject(new Error(e.data.payload.error));
        };
        worker.postMessage({
          type: "INIT",
          payload: { module: "pose_landmarker" },
        } satisfies AIWorkerMessage);
      });

      const totalFrames = BENCHMARK_WARMUP_FRAMES + BENCHMARK_FRAMES;
      const frameTimes: number[] = [];

      for (let i = 0; i < totalFrames; i++) {
        const imageBitmap = await createImageBitmap(video);
        const start = performance.now();

        await new Promise<void>((resolve, reject) => {
          worker.onmessage = (e: MessageEvent<AIWorkerResponse>) => {
            if (e.data.type === "POSE_RESULT") resolve();
            else if (e.data.type === "ERROR")
              reject(new Error(e.data.payload.error));
          };
          worker.postMessage(
            {
              type: "DETECT",
              payload: { image: imageBitmap, timestamp: performance.now() },
            } satisfies AIWorkerMessage,
            [imageBitmap],
          );
        });

        const elapsed = performance.now() - start;
        if (i >= BENCHMARK_WARMUP_FRAMES) {
          frameTimes.push(elapsed);
        }
      }

      worker.postMessage({ type: "TERMINATE" } satisfies AIWorkerMessage);
      worker.terminate();
      workerRef.current = null;

      const avgFrameTime =
        frameTimes.reduce((sum, t) => sum + t, 0) / frameTimes.length;
      const fps = Math.round(1000 / avgFrameTime);

      const benchmarkResult: BenchmarkResult = {
        fps,
        timestamp: Date.now(),
      };
      storeResult(benchmarkResult);
      setResult(benchmarkResult);
      setStatus("ready");
    } catch {
      setStatus("error");
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (videoElement && !hasRunRef.current) {
      hasRunRef.current = true;
      runBenchmark(videoElement);
    }
  }, [videoElement, runBenchmark]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return { status, result };
}
```

**Why a standalone worker and NOT `useAIWorker`?** The benchmark is a bounded, sequential operation (send frame → wait for result → next frame). `useAIWorker` is designed for the continuous detection loop with fire-and-forget messages and streaming responses. Using it for a request-response benchmark would require fighting its architecture. A raw Worker with promise-based onmessage handlers is simpler and more correct for sequential frame timing.

**Why `hasRunRef` instead of checking `status !== 'idle'`?** React state updates are async. If `videoElement` changes rapidly (e.g., camera restart during benchmark), the effect could re-fire before `setStatus('loading')` takes effect. The ref provides a synchronous guard against double-runs.

**Why call `worker.terminate()` after `postMessage({ type: 'TERMINATE' })`?** The `TERMINATE` message tells the worker to clean up the PoseLandmarker instance (`poseLandmarker.close()`). `worker.terminate()` force-kills the thread. Both are needed: graceful cleanup + hard termination.

**Why lazy initializers for `useState`?** `getStoredResult()` reads localStorage synchronously. Using the initializer form `useState(() => getStoredResult())` ensures it's only called once on mount, not on every render.

### Constants — `src/constants/app.constants.ts`

Add to the existing constants file, grouped under a `// Benchmark` section:

```typescript
// Benchmark
export const BENCHMARK_FRAMES = 5;
export const BENCHMARK_WARMUP_FRAMES = 1;
export const BENCHMARK_STORAGE_KEY = "ai-perfect-shot-benchmark";
export const UNSUPPORTED_FPS_THRESHOLD = 10;
```

**`LITE_MODE_FPS = 15` already exists** and serves as the lite mode FPS cap. Stories 7.2 and 7.3 compare the benchmark FPS against `LITE_MODE_FPS` and `UNSUPPORTED_FPS_THRESHOLD` respectively. No `LITE_MODE_FPS_THRESHOLD` constant needed — the existing `LITE_MODE_FPS` value is the threshold.

**`UNSUPPORTED_FPS_THRESHOLD = 10`** is defined here (alongside the benchmark constants) even though it's consumed by Story 7.3. Grouping performance thresholds with the benchmark that produces the FPS value is more cohesive than scattering them across stories.

### CameraScreen Integration — Loading Indicator

Modify `src/components/screens/camera-screen.tsx`:

```typescript
import { useBenchmark } from '@/lib/hooks/use-benchmark';

export function CameraScreen() {
  const { status: benchmarkStatus } = useBenchmark();
  // ... existing hooks ...

  return (
    <div className="relative flex-1 h-full w-full bg-black overflow-hidden">
      {/* ... existing camera preview, wireframe, warnings ... */}

      {benchmarkStatus === 'loading' && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/60"
          data-testid="benchmark-loading"
        >
          <p className="text-white text-lg font-semibold">Calibrating...</p>
        </div>
      )}

      {/* ... existing ControlBar, PreviewScreen, Start Camera overlay ... */}
    </div>
  );
}
```

**z-index layering:** The benchmark overlay uses `z-20`, below the Start Camera overlay (`z-30`) and PreviewScreen (`z-50`). The benchmark only runs after the camera starts (needs video element), so the Start Camera overlay is already gone when the benchmark overlay appears.

**Why "Calibrating..." and NOT "Loading..."?** "Calibrating" communicates that the app is doing something device-specific and useful. "Loading" is generic and could be confused with the camera starting. The text is intentionally brief — no progress bar or percentage.

### Testing `useBenchmark` — `src/lib/hooks/use-benchmark.test.ts`

Mock the Worker constructor, `createImageBitmap`, `performance.now`, and `localStorage`:

```typescript
let mockWorkerInstance: {
  postMessage: jest.Mock;
  terminate: jest.Mock;
  onmessage: ((e: MessageEvent) => void) | null;
};

beforeEach(() => {
  mockWorkerInstance = {
    postMessage: jest.fn(),
    terminate: jest.fn(),
    onmessage: null,
  };

  jest
    .spyOn(globalThis, "Worker" as never)
    .mockImplementation(() => mockWorkerInstance as unknown as Worker);

  global.createImageBitmap = jest.fn().mockResolvedValue({} as ImageBitmap);

  let time = 0;
  jest.spyOn(performance, "now").mockImplementation(() => {
    time += 50; // 50ms per frame = 20 FPS
    return time;
  });

  localStorage.clear();
});
```

Simulate worker responses by calling `mockWorkerInstance.onmessage` after `postMessage`:

```typescript
mockWorkerInstance.postMessage.mockImplementation((msg: { type: string }) => {
  setTimeout(() => {
    if (msg.type === "INIT") {
      mockWorkerInstance.onmessage?.({
        data: { type: "READY" },
      } as MessageEvent);
    } else if (msg.type === "DETECT") {
      mockWorkerInstance.onmessage?.({
        data: { type: "POSE_RESULT", payload: { landmarks: [] } },
      } as MessageEvent);
    }
  }, 0);
});
```

Use `jest.useFakeTimers()` to control `setTimeout` in worker response simulation. Use `act()` and `waitFor()` from `@testing-library/react` with `renderHook`.

**Test cases:**

- Returns stored result from localStorage immediately (status: 'ready', no Worker created)
- Runs benchmark when video element is available and no stored result
- Creates Worker with correct URL and type: 'module'
- Sends INIT message and waits for READY
- Processes `BENCHMARK_WARMUP_FRAMES + BENCHMARK_FRAMES` total frames
- Discards warmup frame timing, records only measured frame times
- Calculates FPS as `Math.round(1000 / avgFrameTimeMs)` — assert specific FPS value based on mocked `performance.now()` increments
- Stores result in localStorage with correct key and shape (`{ fps, timestamp }`)
- Sets status to 'loading' during benchmark, 'ready' after completion
- Sends TERMINATE message and calls `worker.terminate()` after completion
- Sets status to 'error' if INIT returns ERROR response
- Sets status to 'error' if DETECT returns ERROR response
- Terminates worker on error
- Does not run benchmark if `hasRunRef` is already true (prevents double-run)
- Cleans up worker on unmount during active benchmark

**`performance.now()` mock strategy:** Each call returns a value incrementing by a fixed amount (e.g., 50ms). The benchmark records `start = performance.now()` before postMessage and `elapsed = performance.now() - start` after POSE_RESULT. With mock returning `t, t+50, t+100, ...`, each frame takes 50ms → 20 FPS. Assert `result.fps === 20`.

### Testing CameraScreen Benchmark Integration

Add to `src/components/screens/camera-screen.test.tsx`:

```typescript
jest.mock("@/lib/hooks/use-benchmark", () => ({
  useBenchmark: jest.fn().mockReturnValue({ status: "idle", result: null }),
}));
import { useBenchmark } from "@/lib/hooks/use-benchmark";
```

Test cases:

- Shows benchmark loading overlay when `useBenchmark` returns `status: 'loading'`
- Does not show benchmark loading overlay when status is `'idle'` or `'ready'`
- Loading overlay displays "Calibrating..." text
- Loading overlay has `data-testid="benchmark-loading"`

### What NOT to Do

- Do NOT reuse the existing detection worker via `useAIWorker` — create a standalone Worker instance for the benchmark
- Do NOT run the benchmark on every app load — check localStorage first and skip if a result exists
- Do NOT add lite mode logic (FPS throttling, reduced features) — that's Story 7.2
- Do NOT add an unsupported device warning UI — that's Story 7.3
- Do NOT add a settings UI for benchmark or performance tiers — that's Story 7.2
- Do NOT use `console.log` — silent operation, errors caught silently
- Do NOT add GPU/CPU fallback logic — out of scope
- Do NOT add a "re-run benchmark" button — not in the AC
- Do NOT gate the detection loop on benchmark completion — they use separate workers and can coexist
- Do NOT store benchmark results in Jotai atoms — localStorage is the persistence layer for cross-session data (Jotai atoms reset on page reload)
- Do NOT add a progress bar or frame counter to the loading indicator — "Calibrating..." text is sufficient

### Existing Infrastructure (Do NOT Recreate)

| Component               | Location                                        | Relevance                                                          |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| `AIWorkerMessage` type  | `src/lib/ai/worker.types.ts`                    | Used for typed `postMessage` calls in benchmark                    |
| `AIWorkerResponse` type | `src/lib/ai/worker.types.ts`                    | Used for typed `onmessage` handlers in benchmark                   |
| Worker file             | `src/lib/ai/worker.ts`                          | The Worker script loaded by the benchmark                          |
| `AsyncStatus` type      | `src/lib/types/status.types.ts`                 | `'idle' \| 'loading' \| 'ready' \| 'error'` — used for hook status |
| `videoElementAtom`      | `src/lib/stores/camera-store.ts`                | Read by `useBenchmark` to get the video element                    |
| `LITE_MODE_FPS = 15`    | `src/constants/app.constants.ts`                | Already exists — serves as lite mode threshold for Story 7.2       |
| `TARGET_FPS = 30`       | `src/constants/app.constants.ts`                | Already exists — full performance target                           |
| `CameraScreen`          | `src/components/screens/camera-screen.tsx`      | Modified to call `useBenchmark()` and render loading overlay       |
| `CameraScreen` tests    | `src/components/screens/camera-screen.test.tsx` | Modified to mock `useBenchmark` and test loading overlay           |

### Project Structure Notes

| File                                            | Action   | Location Rationale                                                                                          |
| ----------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `src/lib/hooks/use-benchmark.ts`                | New      | `lib/hooks/` — follows `use-pose-detection.ts`, `use-smart-shutter.ts` pattern for worker-interacting hooks |
| `src/lib/hooks/use-benchmark.test.ts`           | New      | Co-located with source                                                                                      |
| `src/constants/app.constants.ts`                | Modified | Add `BENCHMARK_FRAMES`, `BENCHMARK_WARMUP_FRAMES`, `BENCHMARK_STORAGE_KEY`, `UNSUPPORTED_FPS_THRESHOLD`     |
| `src/components/screens/camera-screen.tsx`      | Modified | Call `useBenchmark()`, render loading overlay                                                               |
| `src/components/screens/camera-screen.test.tsx` | Modified | Mock `useBenchmark`, test loading overlay visibility                                                        |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-7-device-compatibility-performance.md#Story 7.1]
- [Source: _bmad-output/implementation-artifacts/epic-6-retro.md#PT-2 — Design benchmark runner]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#Performance Budget]
- [Source: _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md#use-benchmark.ts]
- [Source: src/lib/ai/worker.types.ts — AIWorkerMessage, AIWorkerResponse types]
- [Source: src/lib/ai/worker.ts — Worker implementation with INIT/DETECT/TERMINATE handling]
- [Source: src/constants/app.constants.ts — LITE_MODE_FPS, TARGET_FPS existing constants]

### Previous Story Intelligence (Story 6.6)

- Story 6.6 established the utility-first browser API pattern (`save-photo.ts`). Story 7.1 follows a similar pattern for localStorage access (module-level functions, try/catch, silent failure).
- Story 6.6 used `jest.useFakeTimers()` for timeout testing. Story 7.1 tests need fake timers for the `setTimeout` in worker response simulation.
- Test suite at Story 6.6 completion: 337 tests across 37 suites, 0 failures.
- The Jotai mock pattern in `camera-screen.test.tsx` (global `useSetAtom`/`useAtomValue` mock) is fragile but established. Story 7.1 adds a new `useBenchmark` mock — a simple module mock, no Jotai mock changes needed.
- CameraScreen already has 19 tests. Story 7.1 adds ~4 tests for benchmark loading overlay integration.

### Retro Action Items Enforcement

| Retro Item                                  | Enforcement in This Story                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI-1 (E5->E6)**: Test File Completeness   | New file `use-benchmark.ts` has co-located `use-benchmark.test.ts`. Modified `camera-screen.tsx` has existing `camera-screen.test.tsx` updated. Modified `app.constants.ts` is a constants-only file — no behavioral test file needed.                                                |
| **AI-2 (E5->E6)**: UI-Copy / Feature Parity | Loading overlay text "Calibrating..." is static informational text — no reference to UI actions. No "Tap X" or "Click Y" copy that could mismatch rendered affordances.                                                                                                               |
| **AI-3 (E4->E6)**: Test Assertion Depth     | Benchmark tests assert specific FPS values calculated from mocked `performance.now()` increments — not just that `result` is truthy. localStorage tests assert the stored JSON shape and key. Worker tests assert `postMessage` call arguments and `terminate()` invocation count.    |
| **AI-4 (E6)**: Timer/Closure Safety         | `hasRunRef` provides synchronous double-run guard (async state update could allow re-entry). `workerRef` holds the Worker instance for cleanup in the unmount effect — not captured in a closure. `videoElement` is read from the atom via the effect dependency, not stale-captured. |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Worker mock: `jest.spyOn(globalThis, 'Worker')` doesn't work in jsdom — used direct assignment `globalThis.Worker = mockWorkerConstructor` instead.
- FPS calculation: `performance.now()` mock increments by 50ms per call. The hook makes 3 calls per frame (start, payload timestamp, end), so elapsed = 100ms per frame → 10 FPS with the mock, not 20 FPS as the story notes suggested.

### Completion Notes List

- Task 1: Added 5 benchmark constants (`BENCHMARK_FRAMES`, `BENCHMARK_WARMUP_FRAMES`, `BENCHMARK_STORAGE_KEY`, `UNSUPPORTED_FPS_THRESHOLD`, `BENCHMARK_TIMEOUT_MS`) to `app.constants.ts`.
- Task 2: Created `useBenchmark` hook with standalone Worker lifecycle, localStorage persistence, FPS measurement via `performance.now()`, and cleanup on unmount/error. 15 tests covering localStorage skip, benchmark flow, FPS calculation, worker cleanup, error handling, and double-run prevention.
- Task 3: Integrated `useBenchmark()` into `CameraScreen` with "Calibrating..." loading overlay (`z-20`, `data-testid="benchmark-loading"`). Added 3 tests for overlay visibility based on benchmark status.
- Full test suite: 38 suites, 355 tests, 0 failures. No regressions (previous: 337 tests across 37 suites).

### Change Log

- Added device capability benchmark hook with localStorage persistence and Worker-based FPS measurement
- Integrated benchmark loading overlay into CameraScreen
- Senior Developer Review (AI): Fixed undocumented BENCHMARK_TIMEOUT_MS constant in task list. Fixed act() warnings in use-benchmark.test.ts by replacing jest.runAllTimers() with incremental timer flush helper. All ACs verified, all tests pass. Status → done.

### File List

- `src/lib/hooks/use-benchmark.ts` (new)
- `src/lib/hooks/use-benchmark.test.ts` (new)
- `src/constants/app.constants.ts` (modified)
- `src/components/screens/camera-screen.tsx` (modified)
- `src/components/screens/camera-screen.test.tsx` (modified)
