# Story 6.2: Manual Shutter Override

Status: done

## Story

As a user,
I want to capture a photo manually at any time,
so that I am never locked out from taking a photo.

## Acceptance Criteria

1. **AC1: Manual Capture Handler** — `CameraScreen` creates a `handleManualShutter` callback that calls `capturePhoto(videoElement, isMirrored)` and writes the resulting data URL to `capturedPhotoAtom`. The handler fires **immediately** (no 500ms hold like `useSmartShutter`). The handler does NOT check `detectionLostAtom` — manual capture works regardless of detection state. The handler is a no-op when `videoElement` is null (camera not started).

2. **AC2: ControlBar Wiring** — `CameraScreen` passes `onShutter={handleManualShutter}` to `ControlBar`. The shutter button in ControlBar is already implemented (`control-bar.tsx:89-102`) and already calls `triggerHaptic('medium')` before invoking the callback. The button currently disables (opacity-50) when `onShutter` is not provided — with the handler wired, the button becomes active.

3. **AC3: Shutter Button Size** — The inner white circle of the shutter button matches **64x64px** per UX8. Current implementation is `h-14 w-14` (56px) at `control-bar.tsx:101`. Update to `h-16 w-16` (64px). The outer touch target ring (`h-20 w-20` = 80px) stays unchanged — it exceeds the 44px minimum touch target.

4. **AC4: Press Feedback** — The shutter button provides `scale-95` visual feedback on press per UX spec. Current implementation is `active:scale-90` at `control-bar.tsx:95`. Update to `active:scale-95`.

5. **AC5: Preview Transition** — After manual capture, `capturedPhotoAtom` becomes non-null, which triggers `PreviewScreen` overlay (already wired in `camera-screen.tsx:96`). No additional preview logic needed — Story 6.1 established this flow.

6. **AC6: No Re-capture Guard** — The handler checks `capturedPhoto` is null before capturing (same guard as `useSmartShutter`). This prevents double-capture if user taps shutter while preview is already showing.

## Tasks / Subtasks

- [x] Task 1: Manual capture handler in CameraScreen (AC: #1, #2, #6)
  - [x] 1.1 Add `videoElementAtom` and `cameraFacingModeAtom` reads (via `useAtomValue`) and `capturedPhotoAtom` write (via `useSetAtom`) in `CameraScreen`
  - [x] 1.2 Create `handleManualShutter` callback using `useCallback` — calls `capturePhoto(videoElement, isMirrored)`, sets `capturedPhotoAtom`
  - [x] 1.3 Pass `onShutter={handleManualShutter}` to `ControlBar`
- [x] Task 2: Shutter button visual adjustments (AC: #3, #4)
  - [x] 2.1 Update inner circle in `control-bar.tsx:101` from `h-14 w-14` to `h-16 w-16`
  - [x] 2.2 Update press feedback in `control-bar.tsx:95` from `active:scale-90` to `active:scale-95`
- [x] Task 3: Tests (AC: #1, #2, #6)
  - [x] 3.1 Add test in `camera-screen.test.tsx`: clicking shutter button calls `capturePhoto` and sets `capturedPhotoAtom`
  - [x] 3.2 Add test in `camera-screen.test.tsx`: shutter button does not capture when `videoElement` is null
  - [x] 3.3 Add test in `camera-screen.test.tsx`: shutter button does not capture when `capturedPhoto` is already set
  - [x] 3.4 Update `control-bar.test.tsx` if needed for new button dimensions — no update needed, existing tests don't assert CSS classes

## Dev Notes

### This Is a Small, Surgical Story

Story 6.1 established the entire capture pipeline. Story 6.2 only needs to wire one callback and make two CSS adjustments. Do NOT create new hooks, utilities, or components.

### Manual Capture Handler — `CameraScreen`

Add to `src/components/screens/camera-screen.tsx`. The handler reads atoms directly — no new hook needed.

```typescript
import { videoElementAtom } from "@/lib/stores/camera-store";
import { capturePhoto } from "@/lib/utils/capture-photo";

// In CameraScreen function body:
const videoElement = useAtomValue(videoElementAtom);
const setCapturedPhoto = useSetAtom(capturedPhotoAtom);

const handleManualShutter = useCallback(() => {
  if (!videoElement || capturedPhoto) return;
  const isMirrored = facingMode === "user";
  const dataUrl = capturePhoto(videoElement, isMirrored);
  setCapturedPhoto(dataUrl);
}, [videoElement, capturedPhoto, facingMode, setCapturedPhoto]);
```

**Why no `detectionLost` check?** Manual override is intentional — "Override is a feature, not a fallback" (UX design direction). The user explicitly chose to capture, regardless of pose quality. Story 6.1 AC7 documents this: "Manual capture in Story 6.2 will intentionally bypass this check."

**Why `useCallback`?** Follows the existing pattern for `handleFlipCamera` and `handleToggleFit` at `camera-screen.tsx:42-63`. Prevents unnecessary ControlBar re-renders.

**Note on `capturedPhoto` guard:** `CameraScreen` already reads `capturedPhotoAtom` via `useAtomValue` at line 38. Reuse that value — do NOT add a duplicate read.

**Note on `facingMode`:** `CameraScreen` already destructures `facingMode` from `useCamera()` at line 31. Reuse that — do NOT read `cameraFacingModeAtom` separately (it would work but is redundant with the hook's return value).

### ControlBar Wiring

Update the `<ControlBar>` call at `camera-screen.tsx:86-92`:

```typescript
<ControlBar
  onFlipCamera={handleFlipCamera}
  onShutter={handleManualShutter}  // ← add this
  onNextPose={nextPose}
  onToggleFitMode={handleToggleFit}
  fitMode={fitMode}
  isSwitching={isSwitching}
/>
```

### Shutter Button CSS Adjustments — `control-bar.tsx`

Two changes in the Shutter Button section (lines 89-102):

1. **Line 95**: Change `active:scale-90` to `active:scale-95` (per AC from epic, scale 0.95 on press)
2. **Line 101**: Change `h-14 w-14` to `h-16 w-16` (inner white circle from 56px to 64px per UX8)

No other ControlBar changes. The `handleShutter` function (lines 39-44) and `onShutter` prop (line 10) are already correct.

### Existing Infrastructure (Do NOT Recreate)

| Component                   | Location                                         | Already Done In |
| --------------------------- | ------------------------------------------------ | --------------- |
| `capturePhoto()` utility    | `src/lib/utils/capture-photo.ts`                 | Story 6.1       |
| `videoElementAtom`          | `src/lib/stores/camera-store.ts`                 | Story 6.1       |
| `capturedPhotoAtom`         | `src/lib/stores/camera-store.ts`                 | Story 6.1       |
| `PreviewScreen` overlay     | `src/components/screens/preview-screen.tsx`      | Story 6.1       |
| `ControlBar.onShutter` prop | `src/components/controls/control-bar.tsx`        | Story 3.x       |
| Haptic feedback on shutter  | `control-bar.tsx:41` (`triggerHaptic('medium')`) | Story 3.x       |

### Testing Strategy

The existing `camera-screen.test.tsx` mocks `jotai` hooks globally (lines 27-34). To test manual shutter:

1. Mock `capturePhoto` utility:

```typescript
jest.mock("@/lib/utils/capture-photo", () => ({
  capturePhoto: jest.fn().mockReturnValue("data:image/jpeg;base64,manual"),
}));
```

2. Configure `useAtomValue` mock to return controlled values for `videoElementAtom` and `capturedPhotoAtom`:

```typescript
(useAtomValue as jest.Mock).mockImplementation((atom: unknown) => {
  if (atom === capturedPhotoAtom) return null;
  if (atom === videoElementAtom) return mockVideoElement;
  return "cover";
});
```

3. Set camera status to `'ready'` so ControlBar renders, then click the shutter button via `screen.getByLabelText('Capture Photo')`.

4. Assert `capturePhoto` was called with the mock video element and correct `isMirrored` flag.

5. Assert `setCapturedPhoto` was called with the data URL.

**Mock video element:** Use a minimal object `{ videoWidth: 1920, videoHeight: 1080 } as HTMLVideoElement`.

**Re-capture guard test:** Set `capturedPhotoAtom` to a non-null value, click shutter, assert `capturePhoto` was NOT called.

**Null video test:** Set `videoElementAtom` to null, click shutter, assert `capturePhoto` was NOT called.

### New Import Needed in `CameraScreen`

```typescript
import {
  cameraFacingModeAtom,
  cameraFitModeAtom,
  capturedPhotoAtom,
  videoElementAtom,
} from "@/lib/stores/camera-store";
import { capturePhoto } from "@/lib/utils/capture-photo";
```

`videoElementAtom` is added to the existing import from `camera-store`. `capturePhoto` is a new import.

### Project Structure Notes

| File                                            | Action   | Change Description                                                       |
| ----------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| `src/components/screens/camera-screen.tsx`      | Modified | Add manual shutter handler, wire `onShutter` to ControlBar               |
| `src/components/screens/camera-screen.test.tsx` | Modified | Add tests for manual shutter behavior                                    |
| `src/components/controls/control-bar.tsx`       | Modified | Update inner circle size (56px→64px), press feedback (scale-90→scale-95) |
| `src/components/controls/control-bar.test.tsx`  | Modified | Update if tests assert specific CSS classes                              |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-smart-capture-output.md#Story 6.2]
- [Source: _bmad-output/planning-artifacts/ux-design/design-direction.md#Shutter Button]
- [Source: _bmad-output/planning-artifacts/ux-design/responsive-design-accessibility.md#UX8 Touch Targets]
- [Source: _bmad-output/planning-artifacts/ux-design/user-journey-flows.md#Journey 3: Override Moment]
- [Source: _bmad-output/implementation-artifacts/6-1-smart-shutter-auto-capture.md#AC7 Detection Lost Guard]
- [Source: _bmad-output/implementation-artifacts/epic-5-retro.md#AI-1 Test File Completeness]

### Retro Action Items Enforcement

| Retro Item                              | Enforcement in This Story                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **AI-1 (E5)**: Test File Completeness   | Both modified files (`camera-screen.tsx`, `control-bar.tsx`) have co-located test files in the File List. |
| **AI-2 (E5)**: UI-Copy / Feature Parity | No body copy changes. Shutter button has no text labels to verify.                                        |
| **AI-3 (E4/E5)**: Test Assertion Depth  | Tests assert specific calls (`capturePhoto` args, `setCapturedPhoto` value), not just existence.          |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- Task 1: Added `handleManualShutter` callback to CameraScreen reading `videoElementAtom`, using `capturePhoto()`, writing `capturedPhotoAtom`. Wired `onShutter={handleManualShutter}` to ControlBar. Handler bypasses detectionLost check per design. Guards against null videoElement and re-capture.
- Task 2: Updated shutter button inner circle from h-14/w-14 (56px) to h-16/w-16 (64px). Updated press feedback from active:scale-90 to active:scale-95.
- Task 3: Added 3 new tests — shutter capture with correct args, null video guard, re-capture guard. Updated useSetAtom mock to return distinct setters for each atom. No control-bar test updates needed.
- Full regression suite: 35 suites, 298 tests, 0 failures.

### Change Log

- Story 6.2 implementation — manual shutter override with immediate capture, ControlBar wiring, and shutter button visual adjustments.
- Code review fixes — (1) Added empty-string guard for capturePhoto return in handleManualShutter, (2) Added ref-based capturedPhoto guard to prevent double-capture on rapid taps, (3) Added mirrored manual capture test for front camera facingMode, (4) Added shutter button tests to control-bar.test.tsx with beforeEach mock cleanup.

### File List

- src/components/screens/camera-screen.tsx (modified)
- src/components/screens/camera-screen.test.tsx (modified)
- src/components/controls/control-bar.tsx (modified)
- src/components/controls/control-bar.test.tsx (modified)
