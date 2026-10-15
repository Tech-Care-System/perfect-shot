---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
epicCount: 8
storyCountEstimate: 30
---

# ai-perfect-shot - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for ai-perfect-shot, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Camera & Capture (6 FRs)**

- FR1: User can access device camera (front-facing) for selfie mode
- FR2: User can access device camera (rear-facing) for portrait mode
- FR3: User can switch between front and rear cameras during session
- FR4: User can capture a photo manually at any time using the override shutter button
- FR5: System can automatically capture a photo when pose match score exceeds threshold (Smart Shutter)
- FR6: User can save captured photos to device Camera Roll/Gallery

**AI Pose Detection (6 FRs)**

- FR7: System can detect human body pose landmarks in real-time from camera feed
- FR8: System can compare detected pose against reference pose template
- FR9: System can calculate pose similarity score between user pose and reference
- FR10: System can adapt wireframe scale to match user's body proportions
- FR11: System can detect when subject is too far from camera
- FR12: System can detect when subject is partially out of frame

**Visual Feedback (5 FRs)**

- FR13: User can see wireframe overlay on camera preview showing target pose
- FR14: User can see color-coded feedback indicating pose match quality (Red/Yellow/Green)
- FR15: User can see text prompts suggesting corrective actions (e.g., "Move right", "Tilt head")
- FR16: User can see lighting warning indicator when backlit or poor lighting detected
- FR17: User can see subject positioning guidance (e.g., "Step closer", "Move left to fit in frame")

**Audio & Haptic Feedback (3 FRs)**

- FR18: System can play audio cue (ding) when pose match is achieved
- FR19: System can trigger device vibration (haptic) when pose match is achieved
- FR20: Subject (person being photographed) can perceive feedback cue without seeing screen

**Pose Library (4 FRs)**

- FR21: User can browse available poses in a pose pack
- FR22: User can select a pose from the pose pack to use as reference
- FR23: User can view pose preview before activating it
- FR24: System can load pose data (keypoints) for pose matching

**Onboarding & Settings (4 FRs)**

- FR25: User can view onboarding tutorial explaining Red/Yellow/Green feedback
- FR26: User can skip onboarding tutorial
- FR27: User can grant camera permission through guided permission flow
- FR28: User can re-request camera permission if initially denied

**Device Compatibility (4 FRs)**

- FR29: System can detect device performance capability on first launch
- FR30: System can enable "Lite Mode" for lower-end devices automatically
- FR31: User can see warning if device is not fully supported
- FR32: System can gracefully degrade features on unsupported devices

**Total: 32 Functional Requirements**

### Non-Functional Requirements

**Performance (Critical)**

- NFR-P1: Pose Detection FPS ≥ 30 FPS (Flagship) / ≥ 15 FPS (Mid-range) [P0]
- NFR-P2: Feedback Latency < 100ms from pose change to visual update [P0]
- NFR-P3: Time to Interactive < 3 seconds on 4G network [P0]
- NFR-P4: Model Load Time < 2.5 seconds (MediaPipe WASM + task file) [P1]
- NFR-P5: Photo Capture Latency < 200ms from trigger to save confirmation [P1]
- NFR-P6: Memory Usage < 300MB peak on typical session [P1]
- NFR-P7: If FPS drops below 15, system must automatically enable Lite Mode
- NFR-P8: If device cannot sustain 15 FPS, system must display unsupported device warning
- NFR-P9: UI must remain responsive (input lag < 100ms) even during heavy AI processing

**Privacy & Security**

- NFR-S1: Zero Data Egress - No photos, pose data, or biometric information shall be transmitted to any external server
- NFR-S2: On-Device Processing - All AI inference must execute locally on the user's device
- NFR-S3: Camera Permission Scope - App shall only access camera stream during active usage; no background recording
- NFR-S4: No Persistent Biometrics - Pose landmark data shall exist only in memory during session; no storage to disk
- NFR-S5: HTTPS Only - PWA must be served over HTTPS; no mixed content allowed
- NFR-S6: GDPR/COPPA by Design - Architecture inherently complies with data protection regulations

**Browser Compatibility**

- NFR-C1: iOS Safari Support - Full functionality on Safari 15.4+ (iOS 15.4+)
- NFR-C2: Android Chrome Support - Full functionality on Chrome 90+
- NFR-C3: Camera API Compliance - Must handle getUserMedia gracefully across supported browsers
- NFR-C4: WebGL Fallback - If WebGL2 unavailable, must fallback to WebGL1 or show clear error

**Reliability & Availability**

- NFR-R1: Offline Shell Caching - App shell must load from cache even when offline (Service Worker)
- NFR-R2: Graceful Camera Errors - System must recover gracefully if camera access is interrupted
- NFR-R3: Model Load Retry - If AI model fails to load, system must retry up to 3 times with user feedback

**Accessibility (Basic)**

- NFR-A1: Audio Feedback - Key actions (pose match) must have audio cue for users not watching screen
- NFR-A2: Color Contrast - UI elements must meet WCAG AA contrast ratios
- NFR-A3: Touch Targets - Interactive elements must be ≥ 44x44 px for touch usability

**Total: 21 Non-Functional Requirements**

### Additional Requirements

**From Architecture Document:**

- AR1: Project must be initialized with Next.js + Shadcn/UI using specified initialization commands
- AR2: AI processing must be isolated in Web Worker for UI performance (30 FPS)
- AR3: State management must use Jotai for atomic updates (pose score at 30 FPS)
- AR4: AI models must be loaded from CDN (jsDelivr for MediaPipe WASM, Google Storage for models)
- AR5: Canvas rendering must use 2D Canvas API for wireframe overlay
- AR6: IndexedDB wrapper must be `idb` library for pose preset storage
- AR7: Security headers (CSP) must be configured in next.config.js
- AR8: Deployment must be via Vercel with auto-deploy from GitHub
- AR9: Project structure must follow feature-based organization
- AR10: TypeScript strict mode must be enabled
- AR11: Worker messages must use discriminated unions with `type` field
- AR12: File naming must use kebab-case, component naming must use PascalCase
- AR13: Tests must be co-located with source files (not separate **tests** directory)

**From UX Design Document:**

- UX1: Dark mode must be enforced globally (`<html class="dark">`)
- UX2: Inter font must be loaded from Google Fonts (weights: 400, 500, 600)
- UX3: Z-index layering must follow: Camera(1), Wireframe(10), Glow(20), Controls(100), Modal(1000)
- UX4: Color transitions must be 300ms ease-in-out
- UX5: Glow pulse animation must be continuous when feedback is Yellow
- UX6: Match flash must be 150ms white overlay on Green
- UX7: Animations must respect `prefers-reduced-motion` media query
- UX8: Minimum touch target size must be 44x44px, Shutter button 64x64px
- UX9: Shadcn/UI components required: Button, Sheet, Dialog (only these)
- UX10: Custom components required: CameraPreview, WireframeCanvas, FeedbackGlow, PoseHintCard, ControlBar, PreviewScreen
- UX11: Pose hint card must display pose name + action hint with casual/fun tone
- UX12: Audio feedback ("Ding") must preload on first user interaction
- UX13: Haptic feedback must check for navigator.vibrate support before use

**Total: 26 Additional Requirements**

---

### FR Coverage Map

| FR   | Epic   | Description                          |
| ---- | ------ | ------------------------------------ |
| FR1  | Epic 1 | Front camera access for selfie mode  |
| FR2  | Epic 1 | Back camera access for portrait mode |
| FR3  | Epic 1 | Camera switching (front/back)        |
| FR4  | Epic 6 | Manual shutter override              |
| FR5  | Epic 6 | Smart Shutter auto-capture           |
| FR6  | Epic 6 | Save to Camera Roll                  |
| FR7  | Epic 2 | Pose landmark detection              |
| FR8  | Epic 3 | Pose comparison against template     |
| FR9  | Epic 3 | Similarity score calculation         |
| FR10 | Epic 2 | Wireframe scale adaptation           |
| FR11 | Epic 5 | Subject distance detection           |
| FR12 | Epic 5 | Subject framing detection            |
| FR13 | Epic 3 | Wireframe overlay display            |
| FR14 | Epic 3 | Color-coded feedback (R/Y/G)         |
| FR15 | Epic 3 | Text prompts for corrections         |
| FR16 | Epic 5 | Lighting warning indicator           |
| FR17 | Epic 5 | Subject positioning guidance         |
| FR18 | Epic 6 | Audio cue (ding) on match            |
| FR19 | Epic 6 | Haptic feedback on match             |
| FR20 | Epic 6 | Subject feedback (dual-channel)      |
| FR21 | Epic 4 | Browse poses in pose pack            |
| FR22 | Epic 4 | Select pose from pack                |
| FR23 | Epic 4 | Pose preview before activation       |
| FR24 | Epic 4 | Load pose data for matching          |
| FR25 | Epic 8 | Onboarding tutorial                  |
| FR26 | Epic 8 | Skip onboarding option               |
| FR27 | Epic 1 | Camera permission flow               |
| FR28 | Epic 1 | Re-request camera permission         |
| FR29 | Epic 7 | Device capability detection          |
| FR30 | Epic 7 | Lite Mode auto-enable                |
| FR31 | Epic 7 | Unsupported device warning           |
| FR32 | Epic 7 | Graceful feature degradation         |

**Coverage Summary:** 32/32 FRs mapped ✅

---

## Epic List

### Epic 1: Project Foundation & Camera Access

**Goal:** ผู้ใช้สามารถเปิดแอปและเข้าถึงกล้องได้ทันที พร้อมสลับกล้องหน้า/หลังได้

**User Outcome:** เปิด app → เห็น camera preview ทันที พร้อม permission flow ที่เป็นมิตร

**FRs Covered:** FR1, FR2, FR3, FR27, FR28
**NFRs Addressed:** NFR-S3, NFR-S5, NFR-C1, NFR-C2, NFR-C3
**Additional Requirements:** AR1-AR13 (Project initialization), UX1-UX3 (Dark mode, Font, Z-index)

---

### Epic 2: Real-time Pose Detection & Wireframe

**Goal:** ผู้ใช้เห็น wireframe โพสบนหน้าจอที่เคลื่อนไหวตาม body ของตัวเองแบบ real-time

**User Outcome:** User เห็น skeleton wireframe ที่ track body ได้ที่ 30 FPS

**FRs Covered:** FR7, FR10, FR24
**NFRs Addressed:** NFR-P1, NFR-P2, NFR-P9, NFR-S2, NFR-S4
**Additional Requirements:** AR2 (Web Worker), AR4 (CDN for models), AR5 (2D Canvas)

---

### Epic 3: Pose Matching & Visual Feedback

**Goal:** ผู้ใช้เห็น feedback แบบ Red/Yellow/Green เมื่อ pose ใกล้เคียง target พร้อม text prompts ช่วยแก้ไข

**User Outcome:** User เห็น color-coded feedback และคำแนะนำว่าต้องปรับ pose อย่างไร

**FRs Covered:** FR8, FR9, FR13, FR14, FR15
**NFRs Addressed:** NFR-P2, NFR-A2
**Additional Requirements:** UX4, UX5, UX6, UX7 (Animations), UX11 (Pose hint card)

---

### Epic 4: Pose Library & AI Recommendation

**Goal:** AI วิเคราะห์ scene และแนะนำ pose ที่เหมาะสมอัตโนมัติ ผู้ใช้สามารถขอ pose ถัดไปได้

**User Outcome:** User ได้รับ pose recommendation ที่เหมาะกับ scene โดยไม่ต้องเลือกเอง

**FRs Covered:** FR21, FR22, FR23, FR24
**Additional Requirements:** UX10 (PoseHintCard, ControlBar), AR6 (idb for storage)

---

### Epic 5: Subject Detection & Edge Case Handling

**Goal:** ระบบตรวจจับเมื่อ subject ไกลเกินไป/หลุดเฟรม/แสงไม่ดี และแสดงคำแนะนำที่เป็นมิตร

**User Outcome:** User ได้รับ helpful guidance แทน error messages เมื่อมีปัญหา

**FRs Covered:** FR11, FR12, FR16, FR17
**NFRs Addressed:** NFR-R2

---

### Epic 6: Smart Capture & Output

**Goal:** เมื่อ pose match ระบบถ่ายรูปอัตโนมัติพร้อม feedback ครบทุก channel และบันทึกภาพได้

**User Outcome:** User ได้รูปที่ถ่ายอัตโนมัติเมื่อ pose match พร้อม Ding + Vibration + Save

**FRs Covered:** FR4, FR5, FR6, FR18, FR19, FR20
**NFRs Addressed:** NFR-P5, NFR-A1
**Additional Requirements:** UX6 (Match flash), UX12 (Audio preload), UX13 (Haptic)

---

### Epic 7: Device Compatibility & Performance

**Goal:** แอปทำงานได้ดีบนทุกอุปกรณ์ มี Lite Mode สำหรับเครื่อง low-end พร้อม deploy

**User Outcome:** User บนทุกเครื่องได้รับประสบการณ์ที่ดีที่สุดตามความสามารถของ device

**FRs Covered:** FR29, FR30, FR31, FR32
**NFRs Addressed:** NFR-P3, NFR-P4, NFR-P6, NFR-P7, NFR-P8, NFR-R1, NFR-R3, NFR-C4
**Additional Requirements:** AR8 (Vercel deployment)

---

### Epic 8: Onboarding & Polish

**Goal:** ผู้ใช้ใหม่เข้าใจวิธีใช้งานภายใน 30 วินาที

**User Outcome:** First-time user สามารถถ่ายรูปสำเร็จภายใน 30 วินาทีแรก

**FRs Covered:** FR25, FR26
**NFRs Addressed:** NFR-A3
**Additional Requirements:** UX8 (Touch targets)

---

## Epic 1: Project Foundation & Camera Access

### Story 1.1: Initialize Next.js Project with Design System

As a **developer**,
I want **a properly initialized Next.js project with Shadcn/UI, Tailwind CSS, and all required dependencies**,
So that **I have a solid foundation following the architectural decisions**.

**Acceptance Criteria:**

**Given** the project directory is empty
**When** I run the initialization commands from the architecture document
**Then** a Next.js project is created with TypeScript, Tailwind CSS, ESLint, App Router, and `src` directory structure
**And** Shadcn/UI is initialized with dark mode enabled
**And** Button, Sheet, and Dialog components are installed
**And** Jotai and @mediapipe/tasks-vision are installed
**And** The project builds successfully with `npm run build`
**And** The dev server runs on `localhost:3000` with `npm run dev`

**Technical Notes:**

- Follow AR1 initialization commands exactly
- Configure dark mode in tailwind.config.ts (class strategy)
- Set up CSS variables in globals.css per UX1-UX3
- Add Inter font from Google Fonts (UX2)

---

### Story 1.2: Camera Permission Request Flow

As a **user**,
I want **to grant camera permission through a friendly explanation screen**,
So that **I understand why the app needs camera access before granting permission**.

**Acceptance Criteria:**

**Given** I am a first-time user opening the app
**When** the app loads
**Then** I see a welcome screen explaining that camera access is needed
**And** the explanation describes the value ("Real-time pose guidance")
**And** I see a "Grant Camera Access" button
**And** tapping the button triggers the browser's camera permission prompt
**And** the request happens on user gesture (not automatically on page load)

**Given** I denied camera permission previously
**When** I tap "Grant Camera Access" again
**Then** I see instructions on how to re-enable camera access in browser settings
**And** the app detects if permission is granted after returning from settings

---

### Story 1.3: Camera Preview Component (Back Camera Default)

As a **user**,
I want **to see a live camera preview filling the screen**,
So that **I can see myself or my subject in real-time**.

**Acceptance Criteria:**

**Given** camera permission is granted
**When** the camera screen loads
**Then** I see a full-screen video preview from the back camera (portrait mode default)
**And** the preview fills the viewport with no black bars
**And** the video is mirrored when using front camera (selfie), not mirrored for back camera
**And** the app uses `getUserMedia` with portrait-optimized constraints
**And** the video element is positioned at z-index 1 (per UX3)

---

### Story 1.4: Camera Switching (Front/Back Toggle)

As a **user**,
I want **to switch between front and back cameras**,
So that **I can take selfies or photos of others**.

**Acceptance Criteria:**

**Given** I am viewing the camera preview
**When** I tap the camera flip button
**Then** the camera switches from back to front (or vice versa)
**And** the transition happens smoothly without jarring flash
**And** the button uses the camera flip icon (📷 or ⟳)
**And** the button is 44x44px minimum touch target (UX8)
**And** the front camera view is mirrored, back camera is not

---

## Epic 2: Real-time Pose Detection & Wireframe

### Story 2.1: Web Worker Setup for AI Processing

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

### Story 2.2: MediaPipe Pose Landmarker Integration

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

### Story 2.3: Real-time Pose Detection Loop

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

### Story 2.4: Wireframe Canvas Overlay

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

## Epic 3: Pose Matching & Visual Feedback

### Story 3.1: Pose Similarity Calculation

As a **developer**,
I want **to calculate a similarity score between the user's pose and the target pose**,
So that **the app can determine how well the user matches the reference pose**.

**Acceptance Criteria:**

**Given** the user's current pose landmarks are detected
**And** a target pose is loaded
**When** the similarity calculation runs
**Then** a cosine similarity score between 0.0 and 1.0 is computed
**And** the calculation considers key body joints (shoulders, elbows, hips, knees)
**And** the score updates at the same rate as pose detection (30 FPS)
**And** the score is stored in a Jotai atom (`poseScoreAtom`) for UI reactivity
**And** minor variations in depth (z-axis) have less weight than 2D alignment

---

### Story 3.2: FeedbackGlow Component (Color Overlay)

As a **user**,
I want **to see a color glow around the screen indicating how close my pose is to the target**,
So that **I instantly know if I need to adjust**.

**Acceptance Criteria:**

**Given** the pose similarity score is being calculated
**When** the score is < 0.70
**Then** the screen shows a subtle red glow effect

**Given** the pose similarity score is between 0.70 and 0.89
**When** the score updates
**Then** the screen shows a yellow glow effect
**And** the glow pulses continuously (per UX5)

**Given** the pose similarity score is >= 0.90
**When** the score updates
**Then** the screen shows a green glow effect
**And** a brief white flash overlay appears (150ms, per UX6)

**And** color transitions use 300ms ease-in-out (per UX4)
**And** the glow layer is at z-index 20 (per UX3)
**And** animations respect `prefers-reduced-motion` (per UX7)

---

### Story 3.3: Target Pose Wireframe Overlay

As a **user**,
I want **to see a target pose wireframe showing where I should position my body**,
So that **I have a clear guide to follow**.

**Acceptance Criteria:**

**Given** a target pose is loaded
**When** the camera screen is active
**Then** the target pose wireframe is drawn on the canvas
**And** the target wireframe is distinguishable from the user's tracking wireframe (different color/opacity)
**And** the target wireframe scales to fit the screen appropriately
**And** the user can see both their current pose and the target pose simultaneously

---

### Story 3.4: Pose Hint Card Component

As a **user**,
I want **to see the pose name and a helpful action hint**,
So that **I understand what pose to do and how to achieve it**.

**Acceptance Criteria:**

**Given** a pose is selected
**When** the camera screen is active
**Then** a floating card appears showing the pose name (e.g., "Confident Sit")
**And** the card shows an action hint (e.g., "Lean back, arm on armrest")
**And** the card uses semi-transparent dark background (#1a1a1a/80, rounded-2xl)
**And** the pose name uses Inter 600, 20px, white
**And** the action hint uses Inter 400, 14px, secondary color
**And** the card is positioned at the bottom center of the screen
**And** the card has z-index 50 (above glow, below controls)

---

### Story 3.5: Text Prompts for Corrections

As a **user**,
I want **to see one corrective suggestion at a time telling me how to adjust my pose**,
So that **I am not overwhelmed with too much feedback**.

**Acceptance Criteria:**

**Given** my pose does not match the target (score < 0.90)
**When** the system analyzes the pose difference
**Then** a single text prompt appears (e.g., "Tilt head left" or "Raise your chin")
**And** only one correction is shown at a time (sequential, not simultaneous)
**And** the prompt uses a friendly, casual tone
**And** the prompt updates as I adjust my pose
**And** the prompt disappears when pose matches (score >= 0.90)

---

## Epic 4: Pose Library & AI Recommendation

### Story 4.1: Pose Library Data Structure

As a **developer**,
I want **a structured pose library with scene-tagged poses**,
So that **poses can be organized and filtered by scene type**.

**Acceptance Criteria:**

**Given** the project needs pose presets
**When** I create the pose library
**Then** JSON files exist in `src/data/poses/` for each scene type
**And** scene types include: solo-chair, sofa, standing, stage
**And** each scene type has 3-4 poses (12-16 total)
**And** each pose has: id, name, actionHint, sceneType, targetLandmarks
**And** an index.ts file exports all poses with type safety
**And** poses use the `PosePreset` TypeScript interface

---

### Story 4.2: Pose Loading and State Management

As a **developer**,
I want **poses loaded into Jotai state for reactive updates**,
So that **the UI responds instantly to pose changes**.

**Acceptance Criteria:**

**Given** the pose library is created
**When** the app initializes
**Then** available poses are loaded into Jotai atoms
**And** `currentPoseAtom` tracks the currently selected pose
**And** `availablePosesAtom` tracks poses for current scene
**And** poses are filtered by detected scene type
**And** state updates trigger UI re-renders efficiently

---

### Story 4.3: Scene-Based Pose Recommendation

As a **user**,
I want **the AI to recommend a pose based on my environment**,
So that **I don't have to choose a pose myself**.

**Acceptance Criteria:**

**Given** the camera is active and showing a scene
**When** the app analyzes the environment
**Then** a pose appropriate for the scene is automatically selected
**And** for MVP, scene detection uses simple heuristics (e.g., detected person position)
**And** the recommended pose appears immediately without user selection
**And** the pose hint card shows the recommended pose name and action

---

### Story 4.4: Next Pose Button

As a **user**,
I want **to request a different pose if I don't like the current recommendation**,
So that **I have some control over the pose selection**.

**Acceptance Criteria:**

**Given** a pose is currently recommended
**When** I tap the "Next Pose" button
**Then** a different pose from the same scene category is selected
**And** the wireframe updates to show the new target pose
**And** the pose hint card updates with new pose name and action hint
**And** the button is 44x44px minimum touch target
**And** if all poses in category are exhausted, it cycles back to first

---

## Epic 5: Subject Detection & Edge Case Handling

### Story 5.1: Subject Distance Detection

As a **user**,
I want **to be told if I'm too far from the camera**,
So that **I can move closer for better pose detection**.

**Acceptance Criteria:**

**Given** the camera is active and detecting a person
**When** the detected body landmarks indicate the subject is too small in frame
**Then** a friendly prompt appears: "Step closer to the camera"
**And** the message is displayed in the pose hint area
**And** the prompt uses encouraging language, not error language
**And** the prompt disappears when subject is at appropriate distance

---

### Story 5.2: Subject Framing Detection

As a **user**,
I want **to be told if part of my body is cut off by the frame**,
So that **I can adjust my position for full body tracking**.

**Acceptance Criteria:**

**Given** the camera is detecting pose landmarks
**When** key landmarks (shoulders, hips) are at the edge or outside frame
**Then** a friendly prompt appears: "Move [left/right] to fit in frame"
**And** the direction is calculated based on which side is cut off
**And** the prompt updates dynamically as I move
**And** the prompt disappears when I'm fully in frame

---

### Story 5.3: Lighting Condition Warning

As a **user**,
I want **to be warned about poor lighting conditions**,
So that **I can adjust my position or the shot will still work**.

**Acceptance Criteria:**

**Given** the camera is active
**When** the lighting analysis detects backlighting or very low light
**Then** a subtle warning indicator appears (e.g., sun icon with warning)
**And** the warning is non-blocking (I can still take photos)
**And** the warning uses a gentle icon, not alarming red error
**And** this is a "nice to have" for MVP - basic implementation acceptable

---

### Story 5.4: Graceful Detection Failure

As a **user**,
I want **the app to handle detection failures gracefully**,
So that **I never feel stuck or frustrated**.

**Acceptance Criteria:**

**Given** the pose detection system encounters difficulty
**When** no pose can be detected for 3+ seconds
**Then** a helpful message appears: "Having trouble detecting you. Try better lighting."
**And** the manual shutter remains available at all times
**And** previous pose state is preserved if detection resumes
**And** the app never shows technical error messages to users

---

## Epic 6: Smart Capture & Output

### Story 6.1: Smart Shutter (Auto-Capture)

As a **user**,
I want **the photo to capture automatically when my pose matches the target**,
So that **I get the perfect shot without timing the button press**.

**Acceptance Criteria:**

**Given** I am following the wireframe guide
**When** my pose similarity score exceeds 0.90 for 500ms
**Then** the shutter fires automatically
**And** a brief white flash appears on screen (150ms)
**And** a photo is captured from the current video frame
**And** the app transitions to the preview screen
**And** the threshold is configurable but defaults to 0.90

---

### Story 6.2: Manual Shutter Override

As a **user**,
I want **to capture a photo manually at any time**,
So that **I am never locked out from taking a photo**.

**Acceptance Criteria:**

**Given** the camera screen is active
**When** I tap the shutter button
**Then** a photo is captured immediately regardless of pose score
**And** the shutter button is always visible and accessible
**And** the shutter button is 64x64px (per UX8)
**And** the button provides visual feedback (scale 0.95) on press
**And** the app transitions to preview screen after capture

---

### Story 6.3: Audio Feedback (Ding Sound)

As a **subject being photographed**,
I want **to hear a "ding" sound when my pose matches**,
So that **I know to hold still even if I can't see the screen**.

**Acceptance Criteria:**

**Given** pose detection is running
**When** the pose match score reaches 0.90+
**Then** a pleasant "ding" audio cue plays
**And** the sound is preloaded on first user interaction (per UX12)
**And** the audio file is located at `/public/sounds/ding.mp3`
**And** the sound plays before or simultaneously with auto-capture
**And** audio failure is handled gracefully (no errors if muted)

---

### Story 6.4: Haptic Feedback (Vibration)

As a **subject being photographed**,
I want **the phone to vibrate when my pose matches**,
So that **I feel the confirmation physically**.

**Acceptance Criteria:**

**Given** pose detection is running on a device with vibration support
**When** the pose match score reaches 0.90+
**Then** a short vibration occurs (50ms)
**And** the app checks for `navigator.vibrate` support first (per UX13)
**And** vibration failure is handled gracefully (no errors if unsupported)
**And** vibration occurs simultaneously with audio ding

---

### Story 6.5: Photo Preview Screen

As a **user**,
I want **to see my captured photo before saving**,
So that **I can decide to keep it or retake**.

**Acceptance Criteria:**

**Given** a photo has been captured
**When** the capture completes
**Then** a full-screen preview of the photo appears
**And** the preview includes "Save" and "Retake" buttons
**And** the buttons are clearly visible and accessible
**And** the preview has z-index above the camera (modal level)
**And** tapping outside the preview doesn't accidentally dismiss it

---

### Story 6.6: Save to Camera Roll

As a **user**,
I want **to save my photo to my device's camera roll**,
So that **I can share it on social media later**.

**Acceptance Criteria:**

**Given** I am viewing the photo preview
**When** I tap the "Save" button
**Then** the photo is saved to the device's camera roll/photos
**And** a success confirmation appears briefly
**And** the app returns to the camera screen for another shot
**And** on browsers without direct save, a download is triggered
**And** the file is named with timestamp (e.g., `ai-perfect-shot-YYYY-MM-DD.jpg`)

---

## Epic 7: Device Compatibility & Performance

### Story 7.1: Device Capability Benchmark

As a **developer**,
I want **to detect device performance on first launch**,
So that **I can adjust app settings for optimal experience**.

**Acceptance Criteria:**

**Given** the app launches for the first time
**When** initial setup runs
**Then** a quick benchmark runs (5 frames of pose detection)
**And** FPS is measured during the benchmark
**And** results are stored in localStorage for future sessions
**And** benchmark completes in < 2 seconds
**And** user sees a loading indicator during benchmark

---

### Story 7.2: Lite Mode Implementation

As a **user on a lower-end device**,
I want **the app to automatically adjust for my device's capabilities**,
So that **I still get a smooth experience**.

**Acceptance Criteria:**

**Given** device benchmark shows FPS < 15
**When** the app enters Lite Mode
**Then** pose detection runs at reduced rate (15 FPS target)
**And** animations are simplified or reduced
**And** the user is notified that Lite Mode is active
**And** core functionality (wireframe, feedback, capture) still works
**And** Lite Mode can be toggled in settings if desired

---

### Story 7.3: Unsupported Device Warning

As a **user on a very old device**,
I want **to be informed if my device cannot run the app properly**,
So that **I understand why the experience may be degraded**.

**Acceptance Criteria:**

**Given** device benchmark shows FPS cannot sustain even 10 FPS
**When** the unsupported threshold is reached
**Then** a friendly warning message appears
**And** the message explains limitations ("Your device may have slower feedback")
**And** the app still allows usage (not blocked)
**And** manual shutter is highlighted as the primary capture method

---

### Story 7.4: PWA Manifest and Icons

As a **user**,
I want **to install the app on my home screen**,
So that **I can access it like a native app**.

**Acceptance Criteria:**

**Given** the app is accessed via browser
**When** I visit the app URL
**Then** a valid PWA manifest is present at `/manifest.webmanifest`
**And** the manifest includes: name, short_name, theme_color, icons
**And** icons are provided in required sizes (192x192, 512x512)
**And** display mode is set to "standalone"
**And** orientation is locked to "portrait"
**And** the app is installable via browser's "Add to Home Screen"

---

### Story 7.5: Production Deployment to Vercel

As a **developer**,
I want **the app deployed to Vercel with automatic deploys**,
So that **updates are published automatically on push**.

**Acceptance Criteria:**

**Given** the project is connected to GitHub
**When** code is pushed to the main branch
**Then** Vercel automatically builds and deploys
**And** preview deployments are created for pull requests
**And** the app is served over HTTPS
**And** CSP headers are configured correctly
**And** the production URL is accessible on mobile browsers

---

## Epic 8: Onboarding & Polish

### Story 8.1: Onboarding Tutorial Animation

As a **first-time user**,
I want **a quick visual tutorial showing how the app works**,
So that **I understand the Red/Yellow/Green feedback system**.

**Acceptance Criteria:**

**Given** I am opening the app for the first time
**When** I pass the camera permission screen
**Then** a brief animated tutorial appears (< 10 seconds)
**And** the tutorial shows: wireframe concept, color feedback, auto-capture
**And** the animation uses simple, clear visuals
**And** a "Got it!" button dismisses the tutorial
**And** the tutorial never appears again after dismissal

---

### Story 8.2: Skip Onboarding Option

As a **returning user or power user**,
I want **to skip the onboarding tutorial**,
So that **I can get to the camera immediately**.

**Acceptance Criteria:**

**Given** the onboarding tutorial is displayed
**When** I tap "Skip" or swipe to dismiss
**Then** the tutorial closes immediately
**And** I am taken directly to the camera screen
**And** the skip preference is remembered
**And** there's a way to replay tutorial from settings (optional)

---

### Story 8.3: Final UI Polish and Accessibility Audit

As a **user**,
I want **all UI elements to be polished and accessible**,
So that **the app feels professional and is usable by everyone**.

**Acceptance Criteria:**

**Given** the app is feature-complete
**When** the final polish is applied
**Then** all touch targets are at least 44x44px (per NFR-A3)
**And** color contrast meets WCAG AA standards (per NFR-A2)
**And** all interactive elements have appropriate ARIA labels
**And** the app works correctly on iOS Safari 15.4+ and Chrome 90+
**And** no console errors appear during normal usage
**And** the app is tested on real mobile devices
