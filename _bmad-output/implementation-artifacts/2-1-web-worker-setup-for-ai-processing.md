# Story 2.1: Web Worker Setup for AI Processing

Status: done

---

## Story

As a **developer**,
I want **to isolate AI processing in a dedicated Web Worker**,
So that **heavy computational tasks do not block the main UI thread, ensuring a smooth 60 FPS experience**.

---

## Acceptance Criteria

### AC1: Worker Initialization & Communication

**Given** the application initializes
**When** the `useAIWorker` hook is mounted
**Then** a dedicated Web Worker is spawned from `src/lib/ai/worker.ts`
**And** the worker responds to an `INIT` message with a `READY` status
**And** no errors are thrown during initialization

### AC2: Type-Safe Messaging

**Given** a message is sent to the worker
**When** the message payload does not match the `AIWorkerMessage` discriminated union
**Then** TypeScript compilation fails (ensuring strict type safety)
**And** valid messages (`INIT`, `DETECT`, `TERMINATE`) are processed correctly by the worker

### AC3: Non-Blocking UI

**Given** the worker is processing a simulated heavy task
**When** the user interacts with the UI (e.g., clicks buttons, scrolls)
**Then** the UI remains responsive and does not freeze
**And** the frame rate remains stable at ~60 FPS

### AC4: Error Handling

**Given** an unhandled error occurs within the worker
**When** the worker catches the error
**Then** it sends an `ERROR` message back to the main thread
**And** the main thread handles this gracefully (e.g., logging or showing a toast)

---

## Tasks / Subtasks

- [x] **Task 1: Define Type Definitions** (AC: #2)
  - [x] Create `src/lib/ai/worker.types.ts`
  - [x] Define `AIWorkerMessage` discriminated union (`INIT`, `DETECT`, `TERMINATE`)
  - [x] Define `AIWorkerResponse` discriminated union (`READY`, `POSE_RESULT`, `ERROR`)
  - [x] Export types for shared use

- [x] **Task 2: Implement Web Worker Logic** (AC: #1, #2, #4)
  - [x] Create `src/lib/ai/worker.ts`
  - [x] Implement message listener for `self.onmessage`
  - [x] specific handler for `INIT` returning `READY`
  - [x] Add global error handler (`self.onerror`) that posts `ERROR` message response
  - [x] **Note**: Do not implement MediaPipe loading logic yet (Scope of Story 2.2)

- [x] **Task 3: Create Main Thread Hook** (AC: #1, #3)
  - [x] Create `src/lib/hooks/use-ai-worker.ts`
  - [x] Implement worker instantiation (`new Worker(...)`)
  - [x] Manage worker lifecycle (terminate on unmount)
  - [x] Expose `postMessage` wrapper and `workerStatus` state

- [x] **Task 4: Integration Verification** (AC: #1, #3)
  - [x] Create a simple test component/page to verify worker communication
  - [x] Verify `INIT` -> `READY` roundtrip
  - [x] Validate non-blocking behavior (optional manual check)

---

## Architecture Compliance

### 🏗️ File Locations (STRICT)

| File          | Location                         |
| ------------- | -------------------------------- |
| Worker Source | `src/lib/ai/worker.ts`           |
| Worker Types  | `src/lib/ai/worker.types.ts`     |
| Worker Hook   | `src/lib/hooks/use-ai-worker.ts` |

### ✅ Naming Convention Requirements

| Type    | Convention    | Example           |
| ------- | ------------- | ----------------- |
| Files   | kebab-case.ts | `worker.types.ts` |
| Types   | PascalCase    | `AIWorkerMessage` |
| Actions | UPPER_CASE    | `INIT`, `DETECT`  |

### ❌ Anti-Patterns to AVOID

- ❌ using `comlink` or other abstraction libraries (Use raw `postMessage` for control)
- ❌ Importing main-thread specific code (DOM) into worker
- ❌ Using `any` for message payloads

---

## Technical Requirements

### Required Type Definitions (`worker.types.ts`)

```typescript
export type AIWorkerMessage =
  | { type: "INIT"; payload: { module: "pose_landmarker" } }
  | { type: "DETECT"; payload: { image: ImageBitmap | OffscreenCanvas } }
  | { type: "TERMINATE" };

export type AIWorkerResponse =
  | { type: "READY" }
  | { type: "POSE_RESULT"; payload: PoseLandmarkerResult } // Note: PoseLandmarkerResult type to be added later or stubbed
  | { type: "ERROR"; payload: { error: string } };
```

### Worker Implementation (`worker.ts`)

- Initialize a basic listener structure.
- `INIT` should just log and return `READY` for this story.
- Ensure strict TypeScript mode.

---

## Dev Notes

### Dev Agent Record

#### Implementation Notes

- Implemented typed worker contracts in `src/lib/ai/worker.types.ts` using `PoseLandmarkerResult` from `@mediapipe/tasks-vision`.
- Implemented `src/lib/ai/worker.ts` with typed message handling for `INIT`, `DETECT`, `TERMINATE`, plus `self.onerror` error propagation.
- Implemented `src/lib/hooks/use-ai-worker.ts` for worker lifecycle, initialization handshake, typed postMessage wrapper, status/error state, and cleanup.
- Added integration verification page at `src/app/test-ai-worker/page.tsx` to exercise `INIT -> READY`, `DETECT`, and UI responsiveness during worker activity.
- Added unit/type/E2E coverage for story scope: worker behavior, hook lifecycle, compile-time message type safety, and non-blocking UI scenario.
- Resolved pre-existing validation blockers to satisfy repo-wide quality gates (Jest path scoping, lint violations, hook ordering issue, and stale E2E assumptions/config).

### ATDD Integration

- `pnpm run lint` passes.
- `pnpm exec jest --runInBand` passes (8/8 suites, 43 tests).
- `npx tsc --noEmit` passes.
- `pnpm exec playwright test` passes (5/5 tests), including new Story 2.1 non-blocking verification.

## File List

- `_bmad-output/implementation-artifacts/2-1-web-worker-setup-for-ai-processing.md`
- `jest.config.ts`
- `next.config.ts`
- `playwright.config.ts`
- `src/app/test-ai-worker/page.tsx`
- `src/components/camera/camera-preview.tsx`
- `src/components/camera/wireframe-canvas.test.tsx`
- `src/components/controls/control-bar.test.tsx`
- `src/components/screens/permission-screen.test.tsx`
- `src/components/screens/permission-screen.tsx`
- `src/lib/ai/worker.test.ts`
- `src/lib/ai/worker.ts`
- `src/lib/ai/worker.types.ts`
- `src/lib/ai/worker.types.type-test.ts`
- `src/lib/hooks/use-ai-worker.test.ts`
- `src/lib/hooks/use-ai-worker.ts`
- `src/lib/hooks/use-camera.ts`
- `src/lib/utils/haptic-feedback.ts`
- `tests/e2e/ai-worker-non-blocking.spec.ts`
- `tests/e2e/camera-preview.spec.ts`
- `_bmad-output/project-context.md`

## Change Log

- Implemented Story 2.1 Web Worker foundation (typed worker protocol, worker runtime, main-thread hook, integration test page, unit/type/e2e tests).
- Fixed repository validation blockers required by Step 7/DoD (Jest config isolation, CSP worker allowance, Playwright fake-camera config, lint/type issues, and stale E2E flow assertions).
- **Code Review Fixes** — Added INIT handshake timeout (5s), production guard on test page, worker onerror dev logging, pnpm in Playwright config, 4 new hook error-path tests, 5 new setupAIWorker integration tests, fixed project-context.md type names.

### Senior Developer Review (AI)

**Reviewer:** Z3tz3r0
**Outcome:** ✅ Approved (all HIGH/MEDIUM issues fixed)

**Issues Found & Fixed (10 total):**

| #   | Severity | Description                                                               | Fix Applied                                                              |
| --- | -------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| H1  | HIGH     | No timeout on INIT handshake — hook stuck in `loading` forever            | Added 5s timeout → `error` state                                         |
| H2  | HIGH     | Test page accessible in production                                        | Added `notFound()` guard for `production` env                            |
| M1  | MEDIUM   | project-context.md: stale type names `WorkerInMessage`/`WorkerOutMessage` | Updated to `AIWorkerMessage`/`AIWorkerResponse`                          |
| M2  | MEDIUM   | `onerror` silently swallows errors                                        | Added `console.error` before posting ERROR                               |
| M3  | MEDIUM   | Hook error paths had zero test coverage                                   | Added 4 tests: onerror, ERROR response, null-worker post, timeout        |
| M4  | MEDIUM   | Playwright config uses `npm` instead of `pnpm`                            | Changed to `pnpm run dev`                                                |
| M5  | MEDIUM   | `setupAIWorker` integration logic untested                                | Added 5 tests: wiring, INIT→READY, TERMINATE→close, error catch, onerror |
| L1  | LOW      | Story dev notes reference `npm` commands                                  | Updated to `pnpm`                                                        |
| L2  | LOW      | E2E non-blocking test is a weak perf proxy                                | Accepted for story scope (AC says "optional manual check")               |
| L3  | LOW      | Missing TODO on busy-wait placeholder                                     | Added `TODO(Story-2.2)` comment                                          |

---

## References

- **Epic 2**: `_bmad-output/planning-artifacts/epics/epic-2-real-time-pose-detection-wireframe.md`
- **Architecture**: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md` (Section: Frontend Architecture)
