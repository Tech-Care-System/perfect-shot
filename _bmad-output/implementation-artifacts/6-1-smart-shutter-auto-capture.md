# Story 6.1: Smart Shutter (Auto-Capture)

Status: done

## Story

As a user,
I want the photo to capture automatically when my pose matches the target,
so that I get the perfect shot without timing the button press.

## Acceptance Criteria

1. **AC1: Smart Shutter Hold Mechanism** — A `useSmartShutter(videoElementAtom)` hook reads `poseScoreAtom`. When score >= `POSE_THRESHOLD` (0.90) for a continuous `SMART_SHUTTER_HOLD_MS` (500ms), it triggers photo capture. The timer resets if score drops below threshold before 500ms elapses. Capture only fires when `capturedPhotoAtom` is null (prevents re-trigger while preview is showing).

2. **AC2: Photo Capture Utility** — A pure utility `capturePhoto(video: HTMLVideoElement, isMirrored: boolean): string` captures the current video frame to a JPEG data URL. Uses `document.createElement('canvas')` with dimensions matching `video.videoWidth × video.videoHeight`. When `isMirrored = true` (front camera, `facingMode === 'user'`), applies horizontal flip via `ctx.translate(width, 0); ctx.scale(-1, 1)` before `drawImage` so the saved photo matches the CSS-mirrored display. Returns `canvas.toDataURL('image/jpeg', 0.92)`.

3. **AC3: Video Element Atom** — A `videoElementAtom: atom<HTMLVideoElement | null>(null)` in `camera-store.ts` makes the video element accessible to `useSmartShutter`. `CameraPreview` sets this atom after the video element is playing (`video.onloadedmetadata` resolves). Cleared to `null` when the stream is removed (prevents stale references after camera stop).

4. **AC4: Captured Photo Atom** — A `capturedPhotoAtom: atom<string | null>(null)` in `camera-store.ts` stores the captured JPEG data URL. Null = camera view active. Non-null = preview overlay active. Reading this atom in `CameraScreen` drives the preview overlay visibility.

5. **AC5: White Flash** — `FeedbackGlow` already fires a white flash overlay (`data-testid="match-flash"`) when score crosses `POSE_THRESHOLD`. No new flash logic is needed for 6.1 — the crossing flash at t=0ms serves as the "you're there!" cue and the capture happens 500ms later. Do NOT add a second flash in `useSmartShutter`.

6. **AC6: Basic Preview Screen** — A `PreviewScreen` component renders as a full-screen overlay (`absolute inset-0 z-50`) inside `CameraScreen` when `capturedPhotoAtom` is non-null. Displays the captured photo as full-screen (`object-cover`). Provides: (a) "Retake" button that clears `capturedPhotoAtom` → returns to camera view; (b) "Save" button placeholder that is visually present but `disabled` with `opacity-50` — not hidden, not removed, just disabled until Story 6.6 wires the save logic. `role="dialog"`, `aria-label="Photo Preview"`.

7. **AC7: Detection Lost Guard** — Auto-capture does NOT fire when `detectionLostAtom` is true. Score >= 0.9 requires valid landmarks, which means `detectionLostAtom` is false — this is naturally self-enforcing. The hook still explicitly checks `!detectionLost` to be explicit. (Note: Manual capture in Story 6.2 will intentionally bypass this check.)

8. **AC8: CameraScreen Integration** — `useSmartShutter()` called in `CameraScreen`. `PreviewScreen` rendered inside the camera view area when `capturedPhotoAtom` is non-null. `ControlBar` passes `onShutter` prop (deferred to Story 6.2 for manual capture wiring — Story 6.1 only wires auto-capture).

9. **AC9: Constant** — `SMART_SHUTTER_HOLD_MS = 500` added to `src/constants/app.constants.ts` in a new `// Smart shutter` section.

## Tasks / Subtasks

- [x] Task 1: Photo capture utility (AC: #2)
  - [x] 1.1 Create `src/lib/utils/capture-photo.ts` — `capturePhoto(video, isMirrored): string`
  - [x] 1.2 Create `src/lib/utils/capture-photo.test.ts` — tests for normal capture, mirrored capture, zero-dimension video
- [x] Task 2: Store atoms (AC: #3, #4, #9)
  - [x] 2.1 Add `capturedPhotoAtom` and `videoElementAtom` to `src/lib/stores/camera-store.ts`
  - [x] 2.2 Add `SMART_SHUTTER_HOLD_MS = 500` to `src/constants/app.constants.ts`
- [x] Task 3: Update CameraPreview to set videoElementAtom (AC: #3)
  - [x] 3.1 Modify `src/components/camera/camera-preview.tsx` — `useSetAtom(videoElementAtom)`, set on `onloadedmetadata`, clear when stream removed
  - [x] 3.2 Update `src/components/camera/camera-preview.test.tsx` — add test for `videoElementAtom` being set/cleared
- [x] Task 4: Smart shutter hook (AC: #1, #7)
  - [x] 4.1 Create `src/lib/hooks/use-smart-shutter.ts`
  - [x] 4.2 Create `src/lib/hooks/use-smart-shutter.test.tsx` — tests for: hold triggers capture, timer resets on score drop, no capture when `capturedPhoto` set, no capture when `detectionLost`, capture with mirror flag
- [x] Task 5: Preview screen (AC: #6)
  - [x] 5.1 Create `src/components/screens/preview-screen.tsx`
  - [x] 5.2 Create `src/components/screens/preview-screen.test.tsx` — tests for: renders photo, Retake clears atom, Save button exists and is disabled, role/aria-label
- [x] Task 6: CameraScreen integration (AC: #8)
  - [x] 6.1 Wire `useSmartShutter()` and `<PreviewScreen />` in `src/components/screens/camera-screen.tsx`
  - [x] 6.2 Update `src/components/screens/camera-screen.test.tsx` — add mock and test for `PreviewScreen`

## Dev Notes

### Architecture: This Story Establishes the Capture Pipeline

Epic 6 introduces photo capture — a significant departure from the detection-focused Epics 2–5. This story establishes the foundational pipeline that Stories 6.2, 6.5, and 6.6 will build on:

```
poseScoreAtom (30fps) → useSmartShutter (hold 500ms) → capturePhoto(video) → capturedPhotoAtom → PreviewScreen overlay
```

Stories 6.2 (manual shutter), 6.5 (full preview UX), 6.6 (save to camera roll) all depend on `capturedPhotoAtom` and `PreviewScreen` established here.

### `capturePhoto` Utility — `src/lib/utils/capture-photo.ts`

No existing utility in `lib/utils/`. This is the first file in the capture domain.

The front camera (`facingMode === 'user'`) is CSS-mirrored via `scale-x-[-1]` in `camera-preview.tsx:72`. The actual video stream is NOT mirrored — only the display is. `capturePhoto` must re-apply the mirror transform so the saved photo matches what the user saw.

```typescript
export function capturePhoto(
  video: HTMLVideoElement,
  isMirrored: boolean,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  if (isMirrored) {
    ctx.translate(video.videoWidth, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}
```

JPEG quality 0.92 chosen for good quality / reasonable size balance. Do NOT use PNG (`toDataURL('image/png')`) — too large for mobile storage/sharing.

**Testing `capturePhoto` in JSDOM:** JSDOM does not support canvas rendering. Mock `document.createElement`:

```typescript
const mockCtx = {
  drawImage: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
};
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn().mockReturnValue(mockCtx),
  toDataURL: jest.fn().mockReturnValue("data:image/jpeg;base64,mock"),
};
jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
  if (tag === "canvas") return mockCanvas as unknown as HTMLCanvasElement;
  return document.createElement(tag);
});
```

Test cases:

- Normal (non-mirrored): `ctx.translate`/`ctx.scale` NOT called, `ctx.drawImage` called with video, returns data URL
- Mirrored: `ctx.translate(videoWidth, 0)` and `ctx.scale(-1, 1)` called BEFORE `ctx.drawImage`
- Canvas dimensions match `video.videoWidth × video.videoHeight`
- Null ctx (getContext returns null): returns `''` without throwing

### New Atoms in `camera-store.ts`

Add after `cameraFitModeAtom`:

```typescript
/**
 * The live HTMLVideoElement from CameraPreview, set when the video is playing.
 * Used by useSmartShutter and manual capture to call capturePhoto().
 * Null when camera is stopped or not yet started.
 */
export const videoElementAtom = atom<HTMLVideoElement | null>(null);

/**
 * The captured photo as a JPEG data URL, or null when no photo is captured.
 * Non-null value renders PreviewScreen overlay in CameraScreen.
 * Cleared by "Retake" action to return to camera view.
 */
export const capturedPhotoAtom = atom<string | null>(null);
```

Follow existing JSDoc pattern in `camera-store.ts`. Both atoms must have JSDoc (retro AI-3 from Epic 4: JSDoc for all public atoms).

### CameraPreview Modification — `src/components/camera/camera-preview.tsx`

Add `videoElementAtom` wiring. The atom must be set when the video is actually playing (not just when the element mounts):

```typescript
import { cameraFitModeAtom, videoElementAtom } from '@/lib/stores/camera-store';
import { useSetAtom } from 'jotai';

// Inside CameraPreview:
const setVideoElement = useSetAtom(videoElementAtom);

// In the stream useEffect (around line 27), after stream is set:
video.onloadedmetadata = async () => {
  setVideoElement(video);       // ← register video element when ready
  try { await video.play(); } catch { /* silent */ }
};
if (video.readyState >= 2) {
  setVideoElement(video);       // ← already loaded, register immediately
  video.play().catch(() => {});
}

// In the stream cleanup / else branch when stream is removed:
} else {
  video.srcObject = null;
  setVideoElement(null);        // ← clear reference when stream stops
}
```

Do NOT set `videoElementAtom` on every render. Only set it once when the video becomes playable and clear it when the stream is removed.

### `useSmartShutter` Hook — `src/lib/hooks/use-smart-shutter.ts`

```typescript
"use client";

import {
  POSE_THRESHOLD,
  SMART_SHUTTER_HOLD_MS,
} from "@/constants/app.constants";
import {
  capturedPhotoAtom,
  cameraFacingModeAtom,
  videoElementAtom,
} from "@/lib/stores/camera-store";
import { detectionLostAtom, poseScoreAtom } from "@/lib/stores/pose-store";
import { capturePhoto } from "@/lib/utils/capture-photo";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";

export function useSmartShutter(): void {
  const score = useAtomValue(poseScoreAtom);
  const detectionLost = useAtomValue(detectionLostAtom);
  const capturedPhoto = useAtomValue(capturedPhotoAtom);
  const facingMode = useAtomValue(cameraFacingModeAtom);
  const videoElement = useAtomValue(videoElementAtom);
  const setCapturedPhoto = useSetAtom(capturedPhotoAtom);

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const shouldCapture =
      score >= POSE_THRESHOLD && !detectionLost && !capturedPhoto;

    if (shouldCapture) {
      if (!holdTimerRef.current) {
        holdTimerRef.current = setTimeout(() => {
          holdTimerRef.current = null;
          if (videoElement) {
            const isMirrored = facingMode === "user";
            const dataUrl = capturePhoto(videoElement, isMirrored);
            setCapturedPhoto(dataUrl);
          }
        }, SMART_SHUTTER_HOLD_MS);
      }
    } else {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    }
  }, [
    score,
    detectionLost,
    capturedPhoto,
    facingMode,
    videoElement,
    setCapturedPhoto,
  ]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);
}
```

**Timer semantics:** The timer starts on the FIRST frame where `shouldCapture` becomes true. Subsequent frames where `shouldCapture` is still true do NOT reset the timer (the `!holdTimerRef.current` guard prevents this). If `shouldCapture` goes false at any point, the timer is cleared. This correctly implements "score >= 0.90 for 500ms continuously".

**Why `capturedPhoto` in the dependency array?** When `capturedPhoto` transitions from null → data URL, `shouldCapture` becomes false (due to `!capturedPhoto` guard), which clears any pending timer. This prevents the timer from firing a second time while preview is showing.

**Why `videoElement` in the timer callback?** The timer's closure captures `videoElement` at the time of `useEffect`. Since `videoElement` is in the dependencies, if it changes between timer start and fire, a new `useEffect` run will cancel the old timer and start fresh.

**Testing with `jest.useFakeTimers()`:**

```typescript
// Setup: mock atoms and capturePhoto
jest.mock("@/lib/utils/capture-photo", () => ({
  capturePhoto: jest.fn().mockReturnValue("data:image/jpeg;base64,mock"),
}));
```

Key test cases:

- Score >= 0.90 for 500ms → `capturePhoto` called, `capturedPhotoAtom` set
- Score crosses 0.90 but drops at 400ms → timer cleared, no capture
- Score >= 0.90 but `detectionLost = true` → no timer started
- Score >= 0.90 but `capturedPhoto` is non-null → no timer started (no re-capture during preview)
- Capture uses `isMirrored = true` when `facingMode === 'user'`
- Capture uses `isMirrored = false` when `facingMode === 'environment'`
- Cleanup: timer cleared on unmount

**Hook Composition Rule (Epic 4 AI-2):** `useSmartShutter` reads all atoms directly via `useAtomValue`/`useSetAtom`. Does NOT call `usePoseDetection`, `useCamera`, or any other custom hook.

### `PreviewScreen` Component — `src/components/screens/preview-screen.tsx`

This is a basic preview establishing the pattern. Story 6.5 will add full UX (focus trap, accessibility improvements). Story 6.6 will enable the Save button.

```typescript
'use client';

import { capturedPhotoAtom } from '@/lib/stores/camera-store';
import { Button } from '@/components/ui/button';
import { useSetAtom } from 'jotai';

interface PreviewScreenProps {
  imageUrl: string;
}

export function PreviewScreen({ imageUrl }: PreviewScreenProps) {
  const setCapturedPhoto = useSetAtom(capturedPhotoAtom);

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  return (
    <div
      data-testid="preview-screen"
      role="dialog"
      aria-label="Photo Preview"
      className="absolute inset-0 z-50 bg-black flex flex-col"
    >
      {/* Photo */}
      <div className="flex-1 relative overflow-hidden">
        <img
          src={imageUrl}
          alt="Captured photo"
          data-testid="preview-image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-8 pb-12 pt-4 bg-black">
        <Button
          variant="ghost"
          onClick={handleRetake}
          data-testid="retake-button"
          className="text-white/80 hover:text-white hover:bg-white/10 px-6 py-3 rounded-full"
        >
          Retake
        </Button>
        <Button
          disabled
          data-testid="save-button"
          className="bg-white text-black px-8 py-3 rounded-full font-semibold opacity-50 cursor-not-allowed"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
```

**Save button disabled:** The Save button exists visually (not hidden) but is `disabled`. Story 6.6 will add the save logic. Do NOT add a `TODO` comment. Do NOT add a `onClick={undefined}` — just leave `disabled` prop. The disabled state ensures AC from Epic 5 retro AI-2 (no body copy references actions that don't exist — in this case, no body copy at all).

**`<img>` tag:** Use standard `<img>` not Next.js `<Image>` — the data URL is already generated client-side, no optimization needed from Next.js.

**PreviewScreen receives `imageUrl` as a prop** (not reads `capturedPhotoAtom` directly). This makes it testable without Jotai provider and follows the pattern of props for display-only data.

### CameraScreen Integration

In `src/components/screens/camera-screen.tsx`:

```typescript
import { PreviewScreen } from '@/components/screens/preview-screen';
import { useSmartShutter } from '@/lib/hooks/use-smart-shutter';
import { capturedPhotoAtom } from '@/lib/stores/camera-store';
import { useAtomValue, useSetAtom } from 'jotai';

// In CameraScreen function body:
useSmartShutter();
const capturedPhoto = useAtomValue(capturedPhotoAtom);

// In JSX, inside the root div (after existing overlays, before closing):
{capturedPhoto && (
  <PreviewScreen imageUrl={capturedPhoto} />
)}
```

`useSmartShutter()` joins the existing hook calls (`useSceneDetection()`, `useDistanceDetection()`, etc.). `PreviewScreen` is rendered at the end of the overlay stack so it's above everything (it also has `z-50` which is above `z-30` ControlBar).

**Note on ControlBar and onShutter:** `ControlBar` currently receives `onShutter={undefined}` from `CameraScreen` (the prop exists in the interface but CameraScreen doesn't pass it — verified by checking camera-screen.tsx:82-87). Story 6.2 will add the manual shutter handler. Story 6.1 does NOT need to wire `onShutter`. Do NOT add a placeholder `onShutter` callback.

### `camera-screen.test.tsx` Updates (Retro AI-1: Test File Completeness)

Add mock and test:

```typescript
jest.mock('@/components/screens/preview-screen', () => ({
  PreviewScreen: ({ imageUrl }: { imageUrl: string }) => (
    <div data-testid="preview-screen" data-image={imageUrl} />
  ),
}));

jest.mock('@/lib/hooks/use-smart-shutter', () => ({
  useSmartShutter: jest.fn(),
}));

// Test:
it('should render PreviewScreen when capturedPhotoAtom is non-null', () => {
  // Set atom directly via store
  mockStore.set(capturedPhotoAtom, 'data:image/jpeg;base64,test');
  render(<CameraScreen />);
  expect(screen.getByTestId('preview-screen')).toBeInTheDocument();
});

it('should not render PreviewScreen when capturedPhotoAtom is null', () => {
  render(<CameraScreen />);
  expect(screen.queryByTestId('preview-screen')).not.toBeInTheDocument();
});
```

Wait — the current `camera-screen.test.tsx` mocks `useSetAtom` globally which intercepts all `useSetAtom` calls. For `capturedPhotoAtom` test, we need Jotai's real provider. This may require a different pattern — check the existing test structure. The existing tests mock `jotai`'s `useSetAtom` to return `mockSetFacingMode`. This will need careful handling. The existing pattern may need a `Provider` wrapper for the atom-reading test. Reference existing test at `camera-screen.test.tsx:27-33` for the mock pattern.

Alternative: mock `capturedPhotoAtom` import in the test to return a controlled value, or use `getDefaultStore()` from Jotai like `use-pose-detection.test.ts` does.

### Priority: No Conflicts with FeedbackGlow

`FeedbackGlow` fires the white flash when score CROSSES `POSE_THRESHOLD` (from `< 0.90` to `>= 0.90`). `useSmartShutter` starts a 500ms timer when score stays `>= 0.90`. These are independent mechanisms — no coordination needed. Do NOT modify `FeedbackGlow`.

### TD-2 from Epic 5 Retro — Resolved by Auto-Capture

Epic 5 retro TD-2: "If capture happens when `detectionLostAtom = true`, the captured frame quality may be low."

For auto-capture (Story 6.1): Score >= 0.90 requires valid landmarks, which by design requires `detectionLostAtom = false`. The `!detectionLost` guard in `useSmartShutter` is belt-and-suspenders. This closes TD-2 for the auto-capture path.

For manual capture (Story 6.2): Manual capture intentionally allows capture when `detectionLostAtom = true` — "Override is a feature, not a fallback." This is documented behavior.

### Project Structure Notes

| File                        | Action   | Location Rationale                                    |
| --------------------------- | -------- | ----------------------------------------------------- |
| `capture-photo.ts`          | New      | `lib/utils/` — pure utility, browser API wrapper      |
| `capture-photo.test.ts`     | New      | Co-located with source                                |
| `camera-store.ts`           | Modified | Add 2 atoms (`videoElementAtom`, `capturedPhotoAtom`) |
| `app.constants.ts`          | Modified | Add `SMART_SHUTTER_HOLD_MS`                           |
| `camera-preview.tsx`        | Modified | Set/clear `videoElementAtom`                          |
| `camera-preview.test.tsx`   | Modified | Test atom set/clear                                   |
| `use-smart-shutter.ts`      | New      | `lib/hooks/` — follows existing hook pattern          |
| `use-smart-shutter.test.ts` | New      | Co-located with source                                |
| `preview-screen.tsx`        | New      | `components/screens/` — screen-level component        |
| `preview-screen.test.tsx`   | New      | Co-located with source                                |
| `camera-screen.tsx`         | Modified | Wire hook + render preview overlay                    |
| `camera-screen.test.tsx`    | Modified | Add mocks + tests for preview screen                  |

### Retro Action Items Enforcement (Epic 5 AI-1, AI-2, AI-3)

| Retro Item                                    | Enforcement in This Story                                                                                                                                                                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI-1 (E5)**: Test File Completeness         | Every modified file has a corresponding test file in the File List: `camera-preview.tsx` → `camera-preview.test.tsx` updated. `camera-store.ts` atoms are trivial (no logic) but `camera-screen.test.tsx` tests the rendered outcome.          |
| **AI-2 (E5)**: UI-Copy / Feature Parity Check | Save button is `disabled` (not hidden, not removed). No copy says "Tap Save to save" — the button exists but the disabled state communicates "not yet available". No text references unavailable actions.                                      |
| **AI-3 (E5)**: Test Assertion Depth           | `use-smart-shutter.test.ts` must verify: exact timer duration (500ms with `jest.useFakeTimers()`), exact atom value after capture (data URL string), timer cancellation (mock `clearTimeout`), mirror flag passed correctly to `capturePhoto`. |
| **AI-3 (E4)**: API Consistency                | `useSmartShutter` reads all atoms directly. `capturedPhotoAtom` is the single source of truth for "preview showing". Only `setCapturedPhoto(null)` (via Retake) resets the state.                                                              |

### DO NOT

- Do NOT use Next.js `<Image>` for the preview photo — it's a local data URL, Next.js optimization doesn't apply
- Do NOT store the video element in `pose-store.ts` — it belongs in `camera-store.ts` (camera domain)
- Do NOT add a second flash in `useSmartShutter` — `FeedbackGlow` handles the capture flash
- Do NOT wire `onShutter` in `CameraScreen` for Story 6.1 — that is Story 6.2's scope
- Do NOT add audio or haptic to `useSmartShutter` — that is Stories 6.3 and 6.4
- Do NOT add full UX to `PreviewScreen` (focus trap, no-dismiss, animations) — that is Story 6.5
- Do NOT enable the Save button — that is Story 6.6
- Do NOT modify `usePoseDetection` — the smart shutter reads `poseScoreAtom` which is already being updated by `usePoseDetection`
- Do NOT use PNG for the captured photo — use JPEG quality 0.92
- Do NOT call `useSmartShutter` inside `CameraPreview` — it belongs in `CameraScreen` at the orchestration level

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-smart-capture-output.md] Story 6.1 ACs
- [Source: _bmad-output/implementation-artifacts/epic-5-retro.md] AI-1, AI-2, AI-3 action items; TD-2 capture quality concern; PT-1 canvas capture research task
- [Source: src/components/camera/feedback-glow.tsx:52-63] Existing white flash logic — cross the threshold → flash. Do NOT modify.
- [Source: src/components/camera/feedback-glow.tsx:94-99] `data-testid="match-flash"` — the flash div that already fires on score crossing
- [Source: src/constants/app.constants.ts:7] `POSE_THRESHOLD = 0.9` — reused by smart shutter
- [Source: src/constants/app.constants.ts:36] `MATCH_FLASH_DURATION_MS = 150` — context for why no new flash needed
- [Source: src/lib/stores/camera-store.ts] Existing atoms, JSDoc pattern to follow
- [Source: src/lib/stores/pose-store.ts:24] `detectionLostAtom` — guard for auto-capture
- [Source: src/lib/stores/pose-store.ts:66] `poseScoreAtom` — input to smart shutter
- [Source: src/components/camera/camera-preview.tsx:12-77] Video element management pattern
- [Source: src/components/camera/camera-preview.tsx:69-72] CSS mirror via `scale-x-[-1]` for front camera — confirm in `capturePhoto` mirror flag
- [Source: src/components/screens/camera-screen.tsx:30-34] Hook wiring pattern — add `useSmartShutter()` alongside existing hooks
- [Source: src/components/screens/camera-screen.test.tsx:27-33] Jotai mock pattern for tests
- [Source: src/lib/hooks/use-smart-shutter.ts:?] Non-existent yet — follow `use-distance-detection.ts` hook structure as closest analog
- [Source: src/components/controls/control-bar.tsx:8-15] `onShutter?: () => void` prop — currently undefined (Story 6.2 wires this)
- [Source: _bmad-output/planning-artifacts/ux-design/user-journey-flows.md] Post-capture flow: Capture → Preview → Save/Retake → Camera
- [Source: _bmad-output/planning-artifacts/ux-design/component-strategy.md] `PreviewScreen` spec: `role="dialog"`, focus trap (Story 6.5), `imageUrl` + `onSave` + `onRetake` props
- [Source: _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md] `lib/utils/save-photo.ts` planned (Story 6.6), `lib/utils/audio-feedback.ts` planned (Story 6.3)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- Task 1: Implemented `capturePhoto` utility with JPEG 0.92 quality, horizontal flip for mirrored cameras, null ctx guard. 4 tests passing.
- Task 2: Added `videoElementAtom` and `capturedPhotoAtom` to camera-store.ts with JSDoc. Added `SMART_SHUTTER_HOLD_MS = 500` constant.
- Task 3: Modified CameraPreview to set `videoElementAtom` on `onloadedmetadata` and clear on stream removal. 2 new tests added (5 total passing).
- Task 4: Implemented `useSmartShutter` hook with 500ms hold timer, threshold check, detectionLost guard, capturedPhoto re-trigger prevention, mirror flag from facingMode. 8 tests passing.
- Task 5: Created `PreviewScreen` with `role="dialog"`, retake button clearing `capturedPhotoAtom`, disabled Save button. 4 tests passing.
- Task 6: Wired `useSmartShutter()` and conditional `<PreviewScreen>` in CameraScreen. 2 new tests added (12 total passing).
- Full regression suite: 35 suites, 293 tests, 0 failures.

### Change Log

- Story 6.1 implementation — smart shutter auto-capture pipeline with photo capture utility, camera store atoms, smart shutter hook, preview screen, and CameraScreen integration.
- Code review fixes — (1) Added zero-dimension video guard + test in capturePhoto, (2) Fixed stale closure in useSmartShutter by always clearing/restarting timer on dep change, (3) Added empty-string guard for capturePhoto return in useSmartShutter, (4) Added useSmartShutter call assertion in camera-screen.test.tsx, (5) Added WireframeCanvas mock in camera-preview.test.tsx.

### File List

- src/lib/utils/capture-photo.ts (new)
- src/lib/utils/capture-photo.test.ts (new)
- src/lib/stores/camera-store.ts (modified)
- src/constants/app.constants.ts (modified)
- src/components/camera/camera-preview.tsx (modified)
- src/components/camera/camera-preview.test.tsx (modified)
- src/lib/hooks/use-smart-shutter.ts (new)
- src/lib/hooks/use-smart-shutter.test.tsx (new)
- src/components/screens/preview-screen.tsx (new)
- src/components/screens/preview-screen.test.tsx (new)
- src/components/screens/camera-screen.tsx (modified)
- src/components/screens/camera-screen.test.tsx (modified)
