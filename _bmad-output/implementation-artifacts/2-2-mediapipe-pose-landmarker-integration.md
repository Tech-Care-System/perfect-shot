# Story 2.2: MediaPipe Pose Landmarker Integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **MediaPipe Pose Landmarker loaded and initialized in the Web Worker**,
So that **the app can detect body pose landmarks from video frames**.

## Acceptance Criteria

### AC1: WASM Runtime Loading

**Given** the Web Worker is set up from Story 2.1
**When** the worker receives an `INIT` message
**Then** MediaPipe WASM runtime is loaded from jsDelivr CDN (`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm`)
**And** `FilesetResolver.forVisionTasks()` is used to initialize the WASM fileset

### AC2: Pose Landmarker Model Loading

**Given** the WASM runtime is loaded
**When** the fileset is available
**Then** Pose Landmarker Lite model is loaded from Google Storage (`https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task`)
**And** `PoseLandmarker.createFromModelPath()` is used to create the landmarker instance
**And** the landmarker is configured for `VIDEO` running mode

### AC3: Initialization Performance

**Given** the worker receives an `INIT` message
**When** model loading completes successfully
**Then** total initialization (WASM + model) completes in < 2.5 seconds on standard connection (per NFR-P4)
**And** the worker sends a `READY` message to the main thread

### AC4: Retry Logic on Failure

**Given** MediaPipe model loading fails (network error, CDN unavailable, etc.)
**When** the initialization encounters an error
**Then** the worker retries up to 3 times (per NFR-R3, using `MAX_RETRY_COUNT` constant)
**And** each retry attempt is logged with the attempt number
**And** if all retries fail, the worker sends an `ERROR` message with a clear description

### AC5: Error Reporting

**Given** initialization fails after all retry attempts
**When** the error is reported to the main thread
**Then** the `ERROR` message includes the failure reason (e.g., "Failed to load WASM runtime", "Model download failed")
**And** the error message is actionable (helps debugging, not generic)

### AC6: DETECT Handler Integration

**Given** MediaPipe is initialized and ready
**When** the worker receives a `DETECT` message with an `ImageBitmap`
**Then** `poseLandmarker.detectForVideo(image, timestamp)` is called
**And** the `PoseLandmarkerResult` is sent back as a `POSE_RESULT` response
**And** if detection is called before initialization completes, an `ERROR` is returned

### AC7: Resource Cleanup

**Given** the worker receives a `TERMINATE` message
**When** the worker shuts down
**Then** the `PoseLandmarker` instance is properly closed/disposed
**And** WASM resources are released to prevent memory leaks

---

## Tasks / Subtasks

- [x] **Task 1: Create MediaPipe Initialization Module** (AC: #1, #2, #3)
  - [x] 1.1 Create `src/lib/ai/pose-detector.ts` with `initializePoseLandmarker()` function
  - [x] 1.2 Use `FilesetResolver.forVisionTasks(MEDIAPIPE_CDN_URL + '/wasm')` for WASM loading
  - [x] 1.3 Use `PoseLandmarker.createFromModelPath(fileset, POSE_MODEL_URL)` for model loading
  - [x] 1.4 Configure landmarker with `runningMode: 'VIDEO'`, `numPoses: 1`
  - [x] 1.5 Return the `PoseLandmarker` instance on success

- [x] **Task 2: Implement Retry Logic** (AC: #4, #5)
  - [x] 2.1 Create `initializeWithRetry()` wrapper function in `pose-detector.ts`
  - [x] 2.2 Use `MAX_RETRY_COUNT` from `@/constants/app.constants` (value: 3)
  - [x] 2.3 Log each retry attempt number with `console.error` (worker context, no logger util)
  - [x] 2.4 Throw descriptive error after all retries exhausted

- [x] **Task 3: Update Worker INIT Handler** (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Make `INIT` handler async in `src/lib/ai/worker.ts`
  - [x] 3.2 Replace immediate `READY` response with actual MediaPipe initialization
  - [x] 3.3 Store `PoseLandmarker` instance in module-level variable
  - [x] 3.4 Send `READY` only after successful initialization
  - [x] 3.5 Send `ERROR` with descriptive message if initialization fails

- [x] **Task 4: Update Worker DETECT Handler** (AC: #6)
  - [x] 4.1 Remove the busy-wait simulation placeholder (TODO(Story-2.2))
  - [x] 4.2 Guard against DETECT before initialization (poseLandmarker is null)
  - [x] 4.3 Call `poseLandmarker.detectForVideo(image, timestamp)` with proper timestamp
  - [x] 4.4 Return `POSE_RESULT` with `PoseLandmarkerResult` payload
  - [x] 4.5 Handle detection errors gracefully (return ERROR, don't crash worker)

- [x] **Task 5: Add DETECT Timestamp to Message Type** (AC: #6)
  - [x] 5.1 Update `DETECT` payload in `worker.types.ts` to include `timestamp: number`
  - [x] 5.2 Update all existing references to the DETECT message type (tests, hook, test page)

- [x] **Task 6: Implement Resource Cleanup** (AC: #7)
  - [x] 6.1 Call `poseLandmarker.close()` on `TERMINATE` message
  - [x] 6.2 Null out the poseLandmarker reference
  - [x] 6.3 Ensure cleanup doesn't throw if poseLandmarker was never initialized

- [x] **Task 7: Write Unit Tests** (AC: ALL)
  - [x] 7.1 Test `initializePoseLandmarker()` with mocked MediaPipe (happy path)
  - [x] 7.2 Test retry logic: first attempt fails, second succeeds
  - [x] 7.3 Test retry logic: all attempts fail, error thrown
  - [x] 7.4 Test updated INIT handler returns READY after real initialization
  - [x] 7.5 Test DETECT guard: error if called before INIT completes
  - [x] 7.6 Test DETECT handler: calls detectForVideo and returns POSE_RESULT
  - [x] 7.7 Test TERMINATE: calls poseLandmarker.close()
  - [x] 7.8 Update existing worker tests affected by async INIT change

- [x] **Task 8: Update Integration Test Page** (AC: #1, #2, #3)
  - [x] 8.1 Update `src/app/test-ai-worker/page.tsx` to show real initialization status
  - [x] 8.2 Add loading time measurement display
  - [x] 8.3 Show error details if initialization fails

---

## Dev Notes

### 🚨 CRITICAL: MediaPipe in Web Worker Context

The `@mediapipe/tasks-vision` SDK works in Web Workers but has specific requirements:

1. **No DOM access**: The worker cannot access `document`, `window`, or any DOM APIs. The MediaPipe WASM runtime loads purely through network fetches and ArrayBuffer processing — it does NOT need DOM.

2. **FilesetResolver is the entry point**: Always initialize via `FilesetResolver.forVisionTasks(wasmPath)` first, then create the task (PoseLandmarker) from the resolved fileset.

3. **Running mode matters**: For video frame processing, set `runningMode: 'VIDEO'`. This enables `detectForVideo()` which requires a timestamp. Do NOT use `runningMode: 'IMAGE'` — it uses `detect()` without timestamps and is not suitable for real-time processing.

4. **`detectForVideo()` requires monotonically increasing timestamps**: When calling `detectForVideo(image, timestamp)`, the timestamp must always be greater than the previous call. Use `performance.now()` or the timestamp from `requestAnimationFrame`.

### 🏗️ Existing Code to Modify (NOT Create from Scratch)

**`src/lib/ai/worker.ts`** — The worker already exists. Modify the `handleWorkerMessage` function:

- Current `INIT` case returns `{ type: 'READY' }` synchronously — change to async MediaPipe initialization
- Current `DETECT` case has a busy-wait placeholder — replace with real `detectForVideo()` call
- Current `TERMINATE` case returns null — add `poseLandmarker.close()` before returning

**`src/lib/ai/worker.types.ts`** — Add `timestamp` to DETECT payload:

```typescript
| { type: 'DETECT'; payload: { image: ImageBitmap | OffscreenCanvas; timestamp: number } }
```

### 📦 MediaPipe API Reference (Verified for the installed @mediapipe/tasks-vision package)

```typescript
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

// Step 1: Load WASM runtime
const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
);

// Step 2: Create PoseLandmarker from model
const poseLandmarker = await PoseLandmarker.createFromModelPath(
  vision,
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
);

// Step 3: Detect pose in video frame
const result: PoseLandmarkerResult = poseLandmarker.detectForVideo(
  imageBitmap,
  timestamp,
);

// Step 4: Cleanup
poseLandmarker.close();
```

### 🔧 Constants Already Available

From `src/constants/app.constants.ts`:

```typescript
MEDIAPIPE_CDN_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision";
POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";
MAX_RETRY_COUNT = 3;
```

**⚠️ WASM path note**: The `FilesetResolver.forVisionTasks()` needs the path to the WASM directory, which is `MEDIAPIPE_CDN_URL + '/wasm'` (i.e., `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm`). Do NOT pass just `MEDIAPIPE_CDN_URL` without the `/wasm` suffix.

### 🧪 Testing Strategy

**Mocking MediaPipe in Jest**: The real `@mediapipe/tasks-vision` requires WASM which can't load in jsdom. Mock the entire module:

```typescript
jest.mock("@mediapipe/tasks-vision", () => ({
  FilesetResolver: {
    forVisionTasks: jest.fn(),
  },
  PoseLandmarker: {
    createFromModelPath: jest.fn(),
  },
}));
```

**Test file locations** (co-located with source):

- `src/lib/ai/pose-detector.test.ts` (new)
- `src/lib/ai/worker.test.ts` (update existing)

### ⚡ Performance Considerations

- **Model load time target**: < 2.5 seconds (NFR-P4). The Pose Landmarker Lite model is ~4MB. Combined with WASM runtime (~2MB), total download is ~6MB.
- **Browser caching**: After first load, subsequent loads use browser cache (Cache-Control from CDN). Only first load hits the 2.5s target.
- **Memory**: PoseLandmarker Lite uses ~50-80MB in WASM memory. Well within the 300MB budget (NFR).

### ❌ Anti-Patterns to AVOID

- ❌ DO NOT use `PoseLandmarker.createFromOptions()` unless you need custom delegates — use `createFromModelPath()` for simplicity
- ❌ DO NOT import `@mediapipe/tasks-vision` on the main thread — it must only be imported inside the worker
- ❌ DO NOT use `detect()` instead of `detectForVideo()` — wrong running mode
- ❌ DO NOT catch and swallow errors silently — always report to main thread via ERROR message
- ❌ DO NOT create a new PoseLandmarker per DETECT call — initialize once on INIT, reuse for all DETECT calls
- ❌ DO NOT use `console.log` in worker (use `console.error` for errors only, per established pattern in worker.ts)

### Project Structure Notes

- Alignment with unified project structure: All new code goes in `src/lib/ai/` per architecture
- `pose-detector.ts` is the MediaPipe initialization wrapper (per architecture: `lib/ai/pose-detector.ts`)
- No new directories needed — all files go in existing `src/lib/ai/`
- Test files co-located next to source files

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-2-real-time-pose-detection-wireframe.md#Story 2.2]
- [Source: _bmad-output/planning-artifacts/archive/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/archive/architecture.md#Communication Patterns]
- [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Performance (NFR-P4)]
- [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Reliability (NFR-R3)]
- [Source: _bmad-output/project-context.md#Web Worker Messages]
- [Source: _bmad-output/implementation-artifacts/2-1-web-worker-setup-for-ai-processing.md]

---

## Previous Story Intelligence

### From Story 2.1 (Web Worker Setup) — Key Learnings

1. **Worker instantiation pattern**: Uses `new Worker(new URL('../ai/worker.ts', import.meta.url), { type: 'module' })` — this means the worker runs as an ES module and can use `import` statements.

2. **Async handler pattern**: The current `handleWorkerMessage` is synchronous. For Story 2.2, the INIT handler becomes async. The `setupAIWorker` function's `onmessage` handler must handle this — use `async` callback and `await` the handler result.

3. **INIT timeout**: The `useAIWorker` hook has a 5-second timeout (`INIT_TIMEOUT_MILLISECONDS = 5_000`). MediaPipe initialization (WASM + model download) may take longer on slow connections. **Decision point**: Either increase the timeout for the INIT handshake or keep it and let the retry logic in the worker handle timing.

4. **Type safety enforcement**: The satisfies operator (`satisfies AIWorkerMessage`) is used in the hook. Any changes to message types must update all satisfies usages.

5. **Error handling**: worker.onerror sends ERROR to main thread + logs to console.error. The hook transitions to `error` status. This pattern works — reuse it.

6. **Code review findings from 2.1**: The code review found and fixed: missing INIT timeout, production guard on test page, missing error path tests, onerror logging. These patterns are now established — follow them.

### Files Created/Modified in Story 2.1

| File                                       | Action  | Purpose                                       |
| ------------------------------------------ | ------- | --------------------------------------------- |
| `src/lib/ai/worker.types.ts`               | Created | Discriminated union types for worker messages |
| `src/lib/ai/worker.ts`                     | Created | Worker runtime with message handler           |
| `src/lib/hooks/use-ai-worker.ts`           | Created | React hook for worker lifecycle               |
| `src/app/test-ai-worker/page.tsx`          | Created | Integration test page                         |
| `src/lib/ai/worker.test.ts`                | Created | Worker unit tests                             |
| `src/lib/hooks/use-ai-worker.test.ts`      | Created | Hook unit tests                               |
| `tests/e2e/ai-worker-non-blocking.spec.ts` | Created | E2E non-blocking verification                 |

---

## Git Intelligence Summary

Recent commits show:

- `65c39fb` — chore: remove legacy configuration and command files
- `c2496b1` — docs(sprint): update status and implementation artifacts
- `a08587b` — feat(framework): upgrade to BMad v6.0.0-Beta.8
- `9c843da` — fix(camera): improve iOS/Safari compatibility and z-index layering

**Pattern observations**: Conventional commit format (`type(scope): message`). Sprint status updates are committed separately from feature work. Story 2.1 implementation was part of the `c2496b1` commit batch.

---

## Latest Technical Information

### @mediapipe/tasks-vision

- **Installed version**: See `package.json`.
- **API**: Uses `FilesetResolver.forVisionTasks()` → `PoseLandmarker.createFromModelPath()` pattern
- **WASM path**: Must point to `/wasm` subfolder of the CDN path
- **Running modes**: `IMAGE` (single frame) or `VIDEO` (sequential frames with timestamps)
- **Model**: Pose Landmarker Lite (float16) — smallest model variant, optimized for mobile/web
- **Output**: `PoseLandmarkerResult` containing `landmarks` (normalized 0-1), `worldLandmarks` (meters), `segmentationMasks` (optional)
- **Worker compatibility**: FilesetResolver and PoseLandmarker both work in Web Worker context (no DOM dependency)

### PoseLandmarker Configuration Options

```typescript
{
  baseOptions: {
    modelAssetPath: POSE_MODEL_URL,
    delegate: 'GPU'  // or 'CPU' — GPU uses WebGL, CPU uses WASM
  },
  runningMode: 'VIDEO',
  numPoses: 1,  // Single person detection for MVP
  minPoseDetectionConfidence: 0.5,
  minPosePresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
  outputSegmentationMasks: false  // Not needed for MVP, saves memory
}
```

**⚠️ GPU delegate in Worker**: The GPU delegate requires WebGL, which is available in Web Workers via `OffscreenCanvas`. However, not all browsers support WebGL in workers. **Recommendation**: Use CPU delegate for maximum compatibility in the worker, or try GPU with CPU fallback.

---

## Dev Agent Record

### Agent Model Used

GPT-5 (Codex CLI)

### Debug Log References

- `npm test -- src/lib/ai/pose-detector.test.ts --runInBand` ✅
- `npm test -- src/lib/ai/worker.test.ts --runInBand` ✅
- `npm test -- src/lib/ai/pose-detector.test.ts src/lib/ai/worker.test.ts src/lib/hooks/use-ai-worker.test.ts --runInBand` ✅
- `npm test -- --runInBand` ✅ (51 tests passed)
- `npm run lint` ✅
- `npx tsc --noEmit` ✅
- `npx playwright test tests/e2e/ai-worker-non-blocking.spec.ts` ✅

### Completion Notes List

- Implemented `src/lib/ai/pose-detector.ts` with `FilesetResolver.forVisionTasks(MEDIAPIPE_CDN_URL + '/wasm')`, `PoseLandmarker.createFromModelPath`, and `setOptions({ runningMode: 'VIDEO', numPoses: 1 })`.
- Added `initializeWithRetry()` using `MAX_RETRY_COUNT`, with per-attempt `console.error` logging and actionable terminal errors.
- Updated worker runtime to async `INIT` initialization flow, module-level landmarker lifecycle management, `DETECT` with `detectForVideo(image, timestamp)`, and `TERMINATE` cleanup via `close()`.
- Updated worker message contract to include `timestamp` in `DETECT` payload and propagated this to tests and integration page usage.
- Added comprehensive unit coverage for pose detector initialization/retry paths and async worker behaviors, plus updated existing worker tests for the new flow.
- Updated `test-ai-worker` integration page to show real initialization status, measured initialization duration, and detailed errors.
- Updated E2E non-blocking spec to accept real startup outcomes (`ready` or `error`) while preserving UI responsiveness assertions.

### File List

- `src/lib/ai/pose-detector.ts` (new)
- `src/lib/ai/pose-detector.test.ts` (new)
- `src/lib/ai/worker.ts` (updated)
- `src/lib/ai/worker.types.ts` (updated)
- `src/lib/ai/worker.test.ts` (updated)
- `src/lib/ai/worker.types.type-test.ts` (updated)
- `src/lib/hooks/use-ai-worker.ts` (updated)
- `src/lib/hooks/use-ai-worker.test.ts` (updated)
- `src/app/test-ai-worker/page.tsx` (updated)
- `tests/e2e/ai-worker-non-blocking.spec.ts` (updated)

### Change Log

- Implemented Story 2.2 MediaPipe pose landmarker integration in worker, added retry/error handling, extended message payload with timestamp, expanded tests, and updated integration diagnostics UI.
