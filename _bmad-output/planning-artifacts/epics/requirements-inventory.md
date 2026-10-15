# Requirements Inventory

## Functional Requirements

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

## Non-Functional Requirements

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

## Additional Requirements

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

## FR Coverage Map

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
