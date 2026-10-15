# Project Context Analysis

## Requirements Overview

**Functional Requirements:**

The PRD defines 32 functional requirements across 6 categories:

| Category                 | FR Count | Key Capabilities                                                           |
| ------------------------ | -------- | -------------------------------------------------------------------------- |
| **Camera & Capture**     | 6        | Front/Back switching, Smart Shutter, Manual Override, Save to Gallery      |
| **AI Pose Detection**    | 6        | Real-time landmarks, Pose matching, Similarity scoring, Body adaptation    |
| **Visual Feedback**      | 5        | Wireframe overlay, Color feedback (R/Y/G), Text prompts, Lighting warnings |
| **Audio & Haptic**       | 3        | Subject feedback (Ding + Vibration), Dual-channel output                   |
| **Pose Library**         | 4        | Scene-tagged presets, Pose selection, Preview                              |
| **Device Compatibility** | 4        | Capability detection, Lite Mode, Graceful degradation                      |

**Architectural Implications:**

- Real-time processing loop required (requestAnimationFrame + Web Worker)
- Multi-channel output system (Visual + Audio + Haptic)
- Device capability detection on first launch
- State management for pose matching feedback

**Non-Functional Requirements:**

| Category          | Requirement                                    | Architectural Driver                    |
| ----------------- | ---------------------------------------------- | --------------------------------------- |
| **Performance**   | 30 FPS pose detection, <100ms feedback latency | Web Worker AI isolation, GPU delegate   |
| **Privacy**       | Zero data egress, On-device AI only            | No backend, WASM client-side processing |
| **Browser**       | iOS Safari 15.4+, Chrome 90+, WebGL            | MediaPipe WASM, polyfills               |
| **Reliability**   | Offline caching, Camera error recovery         | Service Worker, Error boundaries        |
| **Accessibility** | WCAG AA, Multimodal feedback                   | ARIA patterns, Touch target sizing      |

## Scale & Complexity

- **Primary domain:** Mobile Web PWA (Camera-centric real-time application)
- **Complexity level:** Medium-High
- **Estimated architectural components:** 8-10 major components
- **Backend requirements:** Zero (Pure client-side MVP)
- **AI model budget:** ~20-25MB total

**Complexity Justification:**

- Real-time AI inference in browser (30 FPS target)
- Multi-channel feedback synchronization (Visual + Audio + Haptic)
- Browser compatibility layer (iOS Safari quirks)
- Performance degradation detection and Lite Mode

## Technical Constraints & Dependencies

**Platform Constraints:**

- PWA must be served over HTTPS (Camera API requirement)
- iOS Safari: Requires user gesture to start camera, limited haptic API
- Portrait orientation locked

**AI Dependencies:**

- MediaPipe Pose Landmarker (WASM runtime)
- MediaPipe Object Detection (~5MB)
- Scene Classification (MobileNet ~15MB)
- Total model fetch: ~20-25MB on first load

**Performance Constraints:**

- Memory budget: <300MB peak
- Model load time: <2.5 seconds
- Time to interactive: <3 seconds on 4G

## Cross-Cutting Concerns Identified

| Concern            | Affected Components      | Mitigation Strategy                                   |
| ------------------ | ------------------------ | ----------------------------------------------------- |
| **Performance**    | All real-time components | Web Worker isolation, GPU delegate, Lite Mode         |
| **Error Handling** | Camera, AI, Storage      | Error boundaries, Retry logic, Graceful fallbacks     |
| **Accessibility**  | All UI components        | ARIA patterns, Touch targets, Multimodal feedback     |
| **Privacy**        | AI pipeline, Storage     | No network calls for user data, Memory-only landmarks |
| **Browser Compat** | Camera, Audio, Haptic    | Feature detection, Platform-specific adapters         |

## UX-Driven Architectural Requirements

From the UX Design Specification:

**Component Architecture:**

- 6 custom components: CameraPreview, WireframeCanvas, FeedbackGlow, PoseHintCard, ControlBar, PreviewScreen
- Design system: Shadcn/UI (Button, Sheet, Dialog) + Tailwind CSS
- Z-index layering: Camera(1) → Wireframe(10) → Glow(20) → Controls(100) → Modal(1000)

**State Management Needs:**

- High-frequency updates (pose score at 30 FPS)
- Atomic state updates to avoid full re-renders
- Recommendation: Jotai for granular reactivity

**Animation Requirements:**

- Color transitions: 300ms ease-in-out
- Glow pulse: Continuous when Yellow
- Match flash: 150ms white overlay
- Must respect `prefers-reduced-motion`

---
