# Epic 2: Real-time Pose Detection & Wireframe

## Story 2.1: Web Worker Setup for AI Processing

As a **developer**,
I want **AI processing isolated in a Web Worker**,
So that **the UI remains responsive at 60 FPS while AI runs at 30 FPS**.

**Acceptance Criteria:**

**Given** the project has the core camera functionality from Epic 1
**When** I create the AI worker infrastructure
**Then** a Web Worker file exists at `src/lib/ai/worker.ts`
**And** the worker uses discriminated unions for messages (per AR11)
**And** message types include: `INIT`, `DETECT`, `SET_TARGET`, `TERMINATE`
**And** response types include: `READY`, `POSE_RESULT`, `ERROR`, `FPS_UPDATE`
**And** TypeScript types are defined in `src/lib/ai/worker.types.ts`
**And** the main thread can communicate with the worker via postMessage

---

## Story 2.2: MediaPipe Pose Landmarker Integration

As a **developer**,
I want **MediaPipe Pose Landmarker loaded and initialized in the Web Worker**,
So that **the app can detect body pose landmarks from video frames**.

**Acceptance Criteria:**

**Given** the Web Worker is set up from Story 2.1
**When** the worker receives an `INIT` message
**Then** MediaPipe WASM runtime is loaded from jsDelivr CDN
**And** Pose Landmarker Lite model is loaded from Google Storage
**And** Model loading completes in < 2.5 seconds (per NFR-P4)
**And** The worker sends `READY` message when initialization completes
**And** If loading fails, the worker retries up to 3 times (per NFR-R3)
**And** Error messages are sent to main thread with clear descriptions

---

## Story 2.3: Real-time Pose Detection Loop

As a **user**,
I want **my body pose detected in real-time from the camera feed**,
So that **the app can track my movements**.

**Acceptance Criteria:**

**Given** MediaPipe is initialized and camera is running
**When** video frames are sent to the worker
**Then** pose landmarks are detected using `detectForVideo()`
**And** detection runs at 30 FPS on flagship devices (per NFR-P1)
**And** landmarks include x, y, z, and visibility for each joint
**And** landmark data exists only in memory, never stored to disk (per NFR-S4)
**And** results are sent back to main thread via postMessage
**And** FPS updates are sent periodically for monitoring

---

## Story 2.4: Wireframe Canvas Overlay

As a **user**,
I want **to see a skeleton wireframe overlay on the camera preview**,
So that **I can see how my body is being tracked**.

**Acceptance Criteria:**

**Given** pose landmarks are being detected
**When** landmarks are received on the main thread
**Then** a canvas overlay draws the skeleton wireframe
**And** the canvas is positioned at z-index 10 (above video, per UX3)
**And** the wireframe uses 2D Canvas API (per AR5)
**And** lines connect landmarks to form a human skeleton shape
**And** the wireframe scales to match the user's body proportions (FR10)
**And** feedback latency is < 100ms from pose change to visual update (per NFR-P2)
**And** the drawing uses a visible color (e.g., white or cyan) for contrast

---
