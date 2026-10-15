# Story 2.4: Wireframe Canvas Overlay

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see a skeleton wireframe overlay on the camera preview**,
so that **I can see how my body is being tracked**.

## Acceptance Criteria

### AC1: Wireframe Rendering

**Given** the Pose Landmarker is detecting a person
**When** the `poseResultAtom` updates
**Then** a **canvas** overlay draws the skeletal wireframe on top of the video feed
**And** the wireframe consists of lines connecting key landmarks (e.g., shoulders to elbows, elbows to wrists)
**And** the wireframe includes points/circles for detected landmarks
**And** the drawing color provides high contrast (e.g., Cyan `#00FFFF` or White with shadow)

### AC2: Positioning & Scaling

**Given** the camera preview is active
**When** the window resizes or device orientation changes
**Then** the canvas overlay matches the **exact dimensions and position** of the `<video>` element
**And** the normalized landmarks (0.0 - 1.0) are correctly scaled to the canvas pixel dimensions
**And** the overlay sits at `z-index: 10` (above video, per UX3)

### AC3: Performance & Responsiveness

**Given** pose data is arriving at 30 FPS
**When** the wireframe is drawn
**Then** the component uses efficient rendering (avoiding unnecessary React commits if possible, or using optimized canvas calls)
**And** the visual latency is < 100ms from movement to display
**And** no "ghosting" artifacts remain from previous frames (canvas is cleared before drawing)

### AC4: Visibility State

**Given** no human is detected
**When** `poseResultAtom` is null or empty
**Then** the canvas is cleared completely

## Tasks / Subtasks

- [x] **Task 1: Drawing Utilities**
  - [x] 1.1 Create `src/lib/utils/pose-connections.ts` (Define `POSE_CONNECTIONS` array for human skeleton).
  - [x] 1.2 Create `src/lib/utils/drawing.ts`.
  - [x] 1.3 Implement `drawLandmarks(ctx, landmarks, style)`.
  - [x] 1.4 Implement `drawConnectors(ctx, landmarks, connections, style)`.

- [x] **Task 2: WireframeCanvas Component**
  - [x] 2.1 Create `src/components/camera/wireframe-canvas.tsx`.
  - [x] 2.2 Setup `<canvas>` with `useRef`.
  - [x] 2.3 Implement responsive sizing (monitor parent dimensions to set `width/height` attributes).
  - [x] 2.4 Subscribe to `poseResultAtom`.
  - [x] 2.5 Implement drawing effect (clear -> draw connectors -> draw landmarks).

- [x] **Task 3: Integration**
  - [x] 3.1 Update `src/components/screens/camera-screen.tsx` (or where `CameraPreview` is used).
  - [x] 3.2 Add `WireframeCanvas` as a sibling to `CameraPreview` (or inside a common container).
  - [x] 3.3 Ensure Z-indexing is correct (`video` < `canvas` < in-app controls).
  - [x] 3.4 Verify mirroring behavior matches video (check `transform: scaleX(-1)`).

- [x] **Task 4: Testing**
  - [x] 4.1 Unit tests for `drawing.ts` (verify coordinate scaling and connection logic).
  - [x] 4.2 Component tests for `WireframeCanvas` (mock `poseResultAtom` and verify canvas context calls).

## Dev Notes

### 🏗️ Architecture & Component Design

- **Component:** `src/components/camera/wireframe-canvas.tsx`
- **Pattern:** Pure consumer of `poseResultAtom`.
- **Placement:** Rendered absolutely over the video element.

### 🔌 State Integration (Jotai)

- Subscribe to `poseResultAtom` using `useAtomValue`.
- **Mirroring:** If the camera preview is mirrored (standard for selfie cams), the canvas **MUST** also be mirrored. The easiest way is to apply the same CSS `transform: scaleX(-1)` to the canvas element.

### 🎨 Canvas Drawing Details

- **Connections:** You need to define the `POSE_CONNECTIONS`.
  - Reference: MediaPipe Pose landmark indices (0-32).
  - Example: `[11, 13]` (Left Shoulder -> Left Elbow), `[13, 15]` (Left Elbow -> Left Wrist).
- **Drawing Utility:**
  ```typescript
  // src/lib/utils/drawing.ts
  export function drawConnectors(
    ctx: CanvasRenderingContext2D,
    landmarks: PoseLandmark[],
    connections: [number, number][],
    style: DrawingStyle,
  ) {
    // ... implementation
  }
  ```

### 📐 Coordinate System

- MediaPipe returns `x, y` as [0.0, 1.0].
- `pixelX = landmark.x * canvas.width`
- `pixelY = landmark.y * canvas.height`
- Ensure `canvas.width` and `canvas.height` match the **rendered size** of the video for accurate overlay.

### ⚠️ Common Pitfalls

- **Mismatching Coordinates:** If the canvas resolution doesn't match the display size, drawings will be offset. Use `ResizeObserver` to keep them in sync.
- **Ghosting:** Forgeting to `ctx.clearRect()` at the start of every frame.
- **Z-Index:** Canvas appearing behind the video. Ensure explicit `z-index`.

### References

- [Source: _bmad-output/implementation-artifacts/2-3-real-time-pose-detection-loop.md#Dev Notes]
- [Source: src/lib/stores/pose-store.ts]
- [Source: _bmad-output/project-context.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm test -- src/lib/utils/drawing.test.ts` (initially fail: missing `drawing.ts`, then pass after implementation)
- `npm test -- src/components/camera/wireframe-canvas.test.tsx` (initially fail on missing wireframe behavior, then pass)
- `npm test` (full suite pass: 64/64)
- `npm run lint` (repo has pre-existing lint errors in untouched files)
- `npx eslint src/lib/utils/drawing.ts src/lib/utils/drawing.test.ts src/lib/utils/pose-connections.ts src/components/camera/wireframe-canvas.tsx src/components/camera/wireframe-canvas.test.tsx` (pass)

### Completion Notes List

- Added `POSE_CONNECTIONS` map for MediaPipe pose skeleton indices in `src/lib/utils/pose-connections.ts`.
- Implemented drawing utilities in `src/lib/utils/drawing.ts` for normalized-to-pixel scaling, connector drawing, landmark drawing, and style support.
- Implemented `WireframeCanvas` with:
  - `poseResultAtom` subscription via `useAtomValue`
  - parent-size tracking (`ResizeObserver` with `window.resize` fallback)
  - draw pipeline per frame (`clearRect` -> connectors -> landmarks)
  - mirrored rendering aligned with camera facing mode (`scale-x-[-1]` for front camera)
- Fixed overlay alignment for `object-cover` video rendering by applying source-to-canvas crop mapping (uses video intrinsic `videoWidth`/`videoHeight`).
- Verified integration layering: video (`z-0`) < canvas (`z-10`) < controls (`z-30`), and ensured preview container fills available viewport.
- Updated `src/components/screens/camera-screen.tsx` integration container to explicitly group `CameraPreview` + `WireframeCanvas` as the overlay stack for clear layering.
- Added/updated tests to validate coordinate scaling, connection logic, canvas sizing, draw calls, and no-pose clear behavior.

### File List

- src/components/camera/camera-preview.tsx
- src/components/screens/camera-screen.tsx
- src/components/camera/wireframe-canvas.tsx
- src/lib/utils/drawing.ts
- src/lib/utils/pose-connections.ts
- src/lib/utils/drawing.test.ts
- src/components/camera/wireframe-canvas.test.tsx

## Change Log

- Implemented Story 2.4 wireframe overlay (drawing utilities, responsive canvas overlay, mirrored rendering, and tests); status set to `review`.
