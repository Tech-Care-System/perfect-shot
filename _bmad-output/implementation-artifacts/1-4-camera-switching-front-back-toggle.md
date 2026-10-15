# Story 1.4: Camera Switching (Front/Back Toggle)

Status: done

---

## Story

As a **user**,
I want **to switch between front and back cameras**,
So that **I can take selfies or photos of others**.

---

## Acceptance Criteria

### AC1: Camera Switching Logic

**Given** I am viewing the camera preview
**When** I tap the camera flip button
**Then** the camera switches from back (environment) to front (user) or vice versa
**And** the switch happens without a full page reload or layout shift

### AC2: User Interface (Control Bar)

**Given** the camera screen is active
**Then** I see a control bar at the bottom of the screen (z-index: 30)
**And** it contains a "Flip Camera" button
**And** the button uses a clear icon (e.g., `SwitchCamera` from lucide-react)
**And** the button has a minimum touch target of 44x44px (UX8 Accessibility)

### AC3: Mirroring Behavior

**Given** the camera is set to **front (user)**
**Then** the preview video is mirrored horizontally (`scale-x-[-1]`)
**And** the movement feels natural (like a mirror)

**Given** the camera is set to **back (environment)**
**Then** the preview video is **NOT** mirrored (standard viewfinder)

### AC4: State Persistence & Gestures

**Given** I am on an iOS device
**When** I tap the switch button
**Then** the new camera stream starts successfully (Button tap represents valid User Gesture)
**And** the global `cameraFacingModeAtom` is updated to the new state

---

## Tasks / Subtasks

- [x] **Task 1: Create ControlBar Component** (AC: #2)
  - [x] Create `src/components/controls/control-bar.tsx`
  - [x] Implement layout: `Fixed` bottom, full width
  - [x] Add Flip button (Shadcn `Button` variant="ghost" or custom circular)
  - [x] Add placeholder props for `onShutter` and `onNextPose` (future stories)
  - [x] Ensure `z-index: 30` compatibility

- [x] **Task 2: Integrate Switching Logic in CameraScreen** (AC: #1, #4)
  - [x] Update `src/components/screens/camera-screen.tsx`
  - [x] Import and use `cameraFacingModeAtom` from `camera-store`
  - [x] Create `handleFlipCamera` handler:
    - [x] Calculate new mode (`user` <-> `environment`)
    - [x] Update atom state
    - [x] Call `startCamera(newMode)`
  - [x] Pass handler to `ControlBar`

- [x] **Task 3: Verify Mirroring Logic** (AC: #3)
  - [x] Verify `CameraPreview` component reacts to `facingMode` changes
  - [x] Ensure `isMirrored` prop correctly derives from `facingMode === 'user'`
  - [x] Check `scale-x-[-1]` class application

- [x] **Task 4: ATDD & Unit Tests**
  - [x] Create `src/components/controls/control-bar.test.tsx`
  - [x] Test: Renders toggle button with correct icon
  - [x] Test: Click calls `onFlipCamera` prop
  - [x] Update `src/components/screens/camera-screen.test.tsx` integration test

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Fix camera cleanup: ensure `stopCamera` runs with current stream on unmount (avoid stale cleanup). [src/components/screens/camera-screen.tsx:16]
- [x] [AI-Review][MEDIUM] Preserve facing mode on restart: Start button should respect current `facingMode`/atom instead of forcing `environment`. [src/components/screens/camera-screen.tsx:50]
- [x] [AI-Review][MEDIUM] Update Story File List to include actual changed files. [_bmad-output/implementation-artifacts/1-4-camera-switching-front-back-toggle.md:208]
- [x] [AI-Review][LOW] Replace/remove raw `console.log` with logger per project rules. [src/components/screens/camera-screen.tsx:30]
- [x] [AI-Review][LOW] Make ControlBar placeholders real buttons or wire `onShutter`/`onNextPose` usage for accessibility. [src/components/controls/control-bar.tsx:45]

---

## Architecture Compliance

### 🏗️ File Locations (STRICT)

| File          | Location                                   |
| ------------- | ------------------------------------------ |
| Control Bar   | `src/components/controls/control-bar.tsx`  |
| Camera Screen | `src/components/screens/camera-screen.tsx` |
| Camera Store  | `src/lib/stores/camera-store.ts`           |
| Icons         | `lucide-react` (SwitchCamera, RefreshCw)   |

### ✅ Naming Convention Requirements

| Type       | Convention     | Example            |
| ---------- | -------------- | ------------------ |
| Files      | kebab-case.tsx | `control-bar.tsx`  |
| Components | PascalCase     | `ControlBar`       |
| Handlers   | camelCase      | `handleFlipCamera` |
| Props      | camelCase      | `onFlipCamera`     |

### ❌ Anti-Patterns to AVOID

- ❌ **Direct State Mutation**: Don't change `facingMode` variable directly; use `setFacingMode` atom setter.
- ❌ **Blocking Switch**: Don't block the UI while switching; show loading state if needed (optional for this story if fast).
- ❌ **Hardcoded Icons**: Don't use svg strings; use `lucide-react` components.
- ❌ **Prop Drilling**: Don't drill deep if `useAtom` can be used, but for `ControlBar` (dump component) passing props is correct.

---

## Technical Requirements

### Required Jotai Patterns

```typescript
// src/lib/stores/camera-store.ts
// Ensure these atoms are exported
export const cameraFacingModeAtom = atom<CameraFacingMode>("environment");
```

### Component Interfaces

```typescript
// src/components/controls/control-bar.tsx
interface ControlBarProps {
  onFlipCamera: () => void;
  onShutter?: () => void; // Optional for now
  onNextPose?: () => void; // Optional for now
  isSwitching?: boolean; // Optional: disable button during switch
}
```

---

## UI/UX Specifications

### Layout Structure (Z-Index Layering)

```
┌─────────────────────────────────────┐
│                                     │
│  Wireframe Canvas (z-20)            │
│  Camera Preview (z-10)              │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  Control Bar (z-30)                 │
│  ┌──────┐    ┌───────┐    ┌──────┐  │
│  │ Flip │    │Shutter│    │ Next │  │
│  └──────┘    └───────┘    └──────┘  │
└─────────────────────────────────────┘
```

### Button Specification

- **Icon**: `SwitchCamera` (Lucide)
- **Size**: 24px icon inside 48px or larger button
- **Color**: White text/icon on dark background or semi-transparent button
- **Haptic**: Trigger `triggerHaptic('short')` on press (if available)

---

## Dev Notes

### Learned from Story 1.3

- **iOS Safari**: Requires user gesture for camera start. The flip button IS a user gesture, so `startCamera()` called from `onClick` is safe and valid.
- **Z-Index**: `CameraPreview` is z-10. `ControlBar` MUST be higher (z-30) to be clickable.

### Implementation Tips

- **Haptics**: Add `triggerHaptic` to the flip handler for better feel.
- **Smoothness**: Ensure `CameraPreview` doesn't unmount entirely during switch if possible, or handles re-mount gracefully.

### Reference Links

- [Source: _bmad-output/planning-artifacts/ux-design/component-strategy.md#ControlBar]
- [Source: _bmad-output/implementation-artifacts/1-3-camera-preview-component-back-camera-default.md]

## Dev Agent Record

### Agent Model Used

Antigravity (Gemini 2.0 Flash)

### Debug Log References

### Implementation Plan

1.  **Task 1: Create ControlBar Component**
    - Implement `ControlBar` in `src/components/controls/control-bar.tsx`.
    - Use Lucide `SwitchCamera` icon.
    - Ensure 44x44px touch target.
    - Style with fixed bottom and high z-index (z-30).
2.  **Task 2: Integrate Switching Logic in CameraScreen**
    - Import `cameraFacingModeAtom` and `startCamera` (from `useCamera`).
    - Implement `handleFlipCamera` to toggle between 'user' and 'environment'.
    - Pass handler to `ControlBar`.
3.  **Task 3: Verify Mirroring Logic**
    - Check `CameraPreview` for `facingMode` dependency.
    - Ensure `scale-x-[-1]` is applied when `facingMode === 'user'`.
4.  **Task 4: ATDD & Unit Tests**
    - Add tests for `ControlBar`.
    - Update `CameraScreen` tests if necessary.

### Completion Notes List

- ✅ Implemented `ControlBar` component with Flip Camera functionality.
- ✅ Integrated `ControlBar` into `CameraScreen`.
- ✅ Implemented camera switching logic using `useCamera` hook.
- ✅ Verified and tested mirroring behavior for front/back cameras.
- ✅ Added unit tests for `ControlBar` and updated integration tests for `CameraScreen`.
- ✅ Resolved Tailwind lint warnings in `ControlBar`.
- ✅ Resolved Review Follow-ups: fixed camera cleanup with refs, respected facingMode on restart, and replaced console logs with logger.
- ✅ Upgraded ControlBar placeholders to functional Button components.

### File List

- `src/components/controls/control-bar.tsx`
- `src/components/controls/control-bar.test.tsx`
- `src/components/screens/camera-screen.tsx`
- `src/components/screens/camera-screen.test.tsx`
- `src/lib/utils/haptic-feedback.ts`
- `src/lib/hooks/use-camera.ts`
- `src/components/camera/camera-preview.tsx`
- `src/app/page.tsx`
- `next.config.ts`
- `.gitignore`
