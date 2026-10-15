# Story 2.3: Real-time Pose Detection Loop

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **my body pose detected in real-time from the camera feed**,
so that **the app can track my movements**.

## Acceptance Criteria

### AC1: Real-time Detection Loop

**Given** the camera is active and MediaPipe is initialized in the worker
**When** the detection loop is running
**Then** video frames are sent to the worker via `postMessage`
**And** the loop targets 30 FPS on flagship devices (per NFR-P1)
**And** the loop uses `requestAnimationFrame` (or `requestVideoFrameCallback` if available) to synchronize with the camera feed
**And** duplicate frames are NOT sent to the worker (timestamps are checked)

### AC2: Component-Level State Isolation (Performance)

**Given** pose data is arriving at 30 FPS
**When** the worker returns a `POSE_RESULT`
**Then** the `CameraPreview` component does NOT re-render (monitored via React DevTools/WhyDidYouRender)
**And** pose data is updated directly into a Jotai atom (`poseResultAtom`)
**And** only specific subscriber components (e.g., Overlay) update their visuals

### AC3: Data Handling & Security

**Given** landmarks are detected
**When** the data is processed
**Then** the result contains normalized `landmarks` (x, y, z, visibility)
**And** `worldLandmarks` (in meters) are included if available
**And** the data exists only in memory and is NOT persisted (per NFR-S4)
**And** user is notified if detection is lost for > 3 seconds

### AC4: FPS Monitoring

**Given** the detection loop is active
**When** the worker processes frames
**Then** the worker calculates the actual FPS based on processing time
**And** sends `FPS_UPDATE` messages periodically (e.g., every 500ms or 1s)
**And** the UI subscribes to these updates via `fpsAtom` to display connection health

### AC5: Graceful Error Handling & Recovery

**Given** the detection fails (e.g., worker crash or hung state)
**When** an error occurs in the loop or worker
**Then** the loop is paused
**And** the system attempts to restart the worker logic up to 1 time
**And** if recovery fails, a non-intrusive toast notification informs the user

## Tasks / Subtasks

- [x] **Task 1: Create Jotai Performance Atoms** (AC: #2, #3, #4)
  - [x] 1.1 Create `src/lib/stores/pose-store.ts`
  - [x] 1.2 Define `poseResultAtom` (primitive atom) to hold `PoseLandmarkerResult | null`
  - [x] 1.3 Define `fpsAtom` (primitive atom) to hold `number`
  - [x] 1.4 Export atom setters/getters if needed, but keep atoms primitive for direct access

- [x] **Task 2: Refactor useAIWorker for High-Frequency Data** (AC: #2)
  - [x] 2.1 Modify `useAIWorker` hook signature to accept `options?: { onMessage?: (msg: AIWorkerResponse) => void }`
  - [x] 2.2 In `worker.onmessage`, check if `options.onMessage` is provided
  - [x] 2.3 If provided, call it with the message
  - [x] 2.4 **CRITICAL**: If `onMessage` returns `true` (or handled), SKIP `setLastResponse` state update to prevent re-renders
  - [x] 2.5 Update existing tests to verify this bypass mechanism

- [x] **Task 3: Create usePoseDetection Hook** (AC: #1, #5)
  - [x] 3.1 Create `src/lib/hooks/use-pose-detection.ts`
  - [x] 3.2 Initialize `useAIWorker` with an `onMessage` handler that:
    - [x] Updates `poseResultAtom` via `store.set` or `useSetAtom` callback
    - [x] Updates `fpsAtom` for `FPS_UPDATE` messages
    - [x] Returns `true` for these messages to bypass React state
  - [x] 3.3 Implement `startDetection(videoElement: HTMLVideoElement)`
    - [x] Checks `video.readyState >= 2`
    - [x] Starts `loop()` function
  - [x] 3.4 Implement `loop()` function
    - [x] Uses `performance.now()` for timestamps
    - [x] Checks `video.currentTime` vs `lastVideoTime` to skip duplicate frames
    - [x] Calls `worker.postMessage({ type: 'DETECT', payload: { image, timestamp } })`
    - [x] schedules next frame via `requestAnimationFrame`
  - [x] 3.5 Implement `stopDetection()` to cancel animation frame

- [x] **Task 4: Integrate with Camera Preview** (AC: #1)
  - [x] 4.1 Update `src/components/camera/camera-preview.tsx`
  - [x] 4.2 Import `usePoseDetection`
  - [x] 4.3 Add `ref` to the `<video>` element (if not already accessible)
  - [x] 4.4 `useEffect` to call `startDetection(videoRef.current)` when `status === 'ready'`
  - [x] 4.5 Clean up with `stopDetection()` on unmount

- [x] **Task 5: Unit Tests** (AC: ALL)
  - [x] 5.1 Test `usePoseDetection` start/stop cycles (mocking `requestAnimationFrame`)
  - [x] 5.2 Test that duplicate frames (same timestamp) are NOT sent to worker
  - [x] 5.3 Verify `poseResultAtom` updates do NOT trigger hook re-renders (using `renderHook`)
  - [x] 5.4 Test error recovery logic (simulate worker error)

#### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Implement detection-loss watchdog (>3 seconds without valid landmarks) and show non-intrusive user notification [src/lib/hooks/use-pose-detection.ts:37]
- [x] [AI-Review][HIGH] Implement AC5 recovery flow: pause loop on worker error, attempt one worker restart, then show toast if restart fails [src/lib/hooks/use-pose-detection.ts:95]
- [x] [AI-Review][HIGH] Add UI subscriber for FPS health indicator using `fpsAtom`/`poseFpsAtom` (currently no UI consumer exists) [src/lib/stores/pose-store.ts:14]
- [x] [AI-Review][HIGH] Add test coverage for recovery logic (worker error -> one restart attempt -> failure notification); current Task 5.4 is marked complete without this behavior verified [src/lib/hooks/use-pose-detection.test.ts:139]
- [x] [AI-Review][HIGH] Add test that proves pose-result updates do not trigger hook/component re-renders; current Task 5.3 only checks atom value updates [src/lib/hooks/use-pose-detection.test.ts:109]
- [x] [AI-Review][MEDIUM] Enforce `video.readyState >= 2` check before activating loop in `startDetection` to match Task 3.3 claim [src/lib/hooks/use-pose-detection.ts:84]
- [x] [AI-Review][MEDIUM] Correct FPS bootstrap logic by initializing `lastFpsUpdateAt` on first detect event to avoid first bogus sample [src/lib/ai/worker.ts:10]
- [x] [AI-Review][MEDIUM] Populate Dev Agent Record `File List` with actual modified source files for traceability [./_bmad-output/implementation-artifacts/2-3-real-time-pose-detection-loop.md:190]
- [x] [AI-Review][LOW] Replace direct `console.error` usage with project logging pattern or controlled worker-safe logger wrapper [src/lib/ai/pose-detector.ts:54]

## Dev Notes

### 🚀 High-Performance Loop Pattern

The detection loop must run outside of React's render cycle. Do NOT use `useEffect` dependencies for the frame data.

```typescript
// Proposed Implementation Pattern for loop()
const loop = () => {
  if (!activeRef.current || !videoRef.current) return;

  const video = videoRef.current;

  // Optimization: Only process if video has advanced
  if (video.currentTime !== lastProcessedTimeRef.current) {
    lastProcessedTimeRef.current = video.currentTime;

    // Send to worker - structure should match AIWorkerMessage type
    postMessage({
      type: "DETECT",
      payload: {
        image: video, // Browser automatically makes ImageBitmap or clones safely
        timestamp: performance.now(),
      },
    });
  }

  animationFrameId.current = requestAnimationFrame(loop);
};
```

### ⚡ Jotai Optimization (Avoiding Re-renders)

We use Jotai as a high-frequency message bus. The `CameraPreview` component should **NEVER** subscribe to `poseResultAtom`. Only the eventual `WireframeOverlay` (Story 2.4) will subscribe to it.

```typescript
// In usePoseDetection hook:
const setPoseResult = useSetAtom(poseResultAtom);
const setFps = useSetAtom(fpsAtom);

const { postMessage } = useAIWorker({
  onMessage: (response) => {
    if (response.type === "POSE_RESULT") {
      setPoseResult(response.payload);
      return true; // Signal to useAIWorker to SKIP local state update
    }
    if (response.type === "FPS_UPDATE") {
      setFps(response.payload.fps);
      return true;
    }
    return false; // Let other messages (ERROR, READY) trigger state updates
  },
});
```

### 📦 Worker Message Types

Ensure you use the types defined in `src/lib/ai/worker.types.ts`.
You may need to update `AIWorkerResponse` to include `FPS_UPDATE` if it wasn't added in Story 2.1/2.2.

```typescript
// Check src/lib/ai/worker.types.ts
export type AIWorkerResponse =
  | { type: "READY" }
  | { type: "POSE_RESULT"; payload: PoseLandmarkerResult }
  | { type: "FPS_UPDATE"; payload: { fps: number } } // Verify/Add this
  | { type: "ERROR"; payload: { error: string } };
```

### 🧪 Testing Strategy

1.  **Mocking the Worker**: `useAIWorker` essentially wraps a worker. For `usePoseDetection` tests, mock `useAIWorker` so you can intercept `postMessage` calls and manually resolve `onMessage` callbacks.
2.  **Mocking requestAnimationFrame**: Use `jest.spyOn(window, 'requestAnimationFrame')` or `jest.useFakeTimers()` to control the loop execution in tests.

### 🏗️ Directory Constraints

- **Stores**: `src/lib/stores/pose-store.ts`
- **Hooks**: `src/lib/hooks/use-pose-detection.ts`
- **Tests**: Co-locate with source (e.g., `src/lib/hooks/use-pose-detection.test.ts`)

### References

- [Source: _bmad-output/implementation-artifacts/2-2-mediapipe-pose-landmarker-integration.md#Dev Notes]
- [Source: src/lib/hooks/use-ai-worker.ts]
- [Source: _bmad-output/project-context.md#Performance Requirements]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

- src/lib/stores/pose-store.ts
- src/lib/hooks/use-pose-detection.ts
- src/lib/hooks/use-pose-detection.test.ts
- src/lib/hooks/use-ai-worker.ts
- src/lib/hooks/use-ai-worker.test.ts
- src/lib/ai/worker.ts
- src/lib/ai/worker.types.ts
- src/lib/ai/worker-logger.ts
- src/lib/ai/pose-detector.ts
- src/lib/ai/pose-detector.test.ts
- src/components/camera/camera-preview.tsx
- src/components/camera/camera-preview.test.tsx
- src/components/camera/pose-status-overlay.tsx

### Senior Developer Review (AI)

**Reviewer:** Z3tz3r0 (AI Senior Developer)  
**Outcome:** Changes Requested

**AC Validation**

- AC1: PARTIAL (loop + duplicate-frame guard implemented; startup gating and readiness contract are incomplete)
- AC2: IMPLEMENTED (high-frequency `onMessage` bypass path is present)
- AC3: PARTIAL (memory-only path looks correct, but "detection lost > 3 seconds" user notification is missing)
- AC4: PARTIAL (`FPS_UPDATE` is emitted, but no UI subscriber/health indicator exists)
- AC5: MISSING (no pause/restart-once/toast fallback recovery flow)

**Git vs Story Discrepancies**

- `File List` is empty while multiple source files are changed in git working tree.
- Story tasks are marked `[x]` for assertions that are not validated by current tests (Task 5.3 and 5.4).

**Findings Summary**

- High: 5
- Medium: 3
- Low: 1

### Change Log

- Senior Developer Review (AI) completed; added 9 follow-up action items; status changed to `in-progress`.
