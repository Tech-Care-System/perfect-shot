---
stepsCompleted: []
inputDocuments: []
workflowType: "research"
lastStep: 1
research_type: "technical"
research_topic: "AI-guided photography app"
research_goals: "Analyze technical feasibility, AI stack, and architecture for real-time posing guide"
user_name: "Z3tz3r0"
web_research_enabled: true
source_verification: true
---

# Research Report: technical

**Author:** Z3tz3r0
**Research Type:** technical

---

## Research Overview

## Technical Research Scope Confirmation

**Research Topic:** AI-guided photography app
**Research Goals:** Analyze technical feasibility, AI stack, and architecture for real-time posing guide

**Technical Research Scope:**

- Architecture Analysis - design patterns, frameworks, system architecture
- Implementation Approaches - development methodologies, coding patterns
- Technology Stack - languages, frameworks, tools, platforms
- Integration Patterns - APIs, protocols, interoperability
- Performance Considerations - scalability, optimization, patterns

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

---

## Technology Stack Analysis (Web MVP Focus)

### Programming Languages & Frameworks

- **Core & Frontend:** **TypeScript + Next.js (React)**.
  - _Rationale:_ Rapid MVP development, instant deployment (Vercel), and massive ecosystem. Best for PWA/Mobile Web compatibility.
- **AI/ML Runtime:** **JavaScript/WASM (WebAssembly)** using **MediaPipe for Web**.
  - _Rationale:_ Runs client-side in the browser. No server GPU cost. MediaPipe's WASM backend is highly optimized for mobile browsers (Safari/Chrome).

_Source: [Vertex AI Search - Web MVP Stack]_

### Development Frameworks and Libraries

- **UI Library:** **Tailwind CSS + Shadcn/UI** (or HeroUI as mentioned in previous projects).
  - _Why:_ Aesthetic, accessible, and fast to build "Premium Look" for the contest demo.
- **Camera Handling:** Native HTML5 `getUserMedia` API + `react-webcam` (or custom hook for better control).
- **Computer Vision:** **MediaPipe Tasks Vision** (@mediapipe/tasks-vision).
  - _Capability:_ Real-time Pose Estimation ~30FPS on modern phones via WebGL delegate.

_Source: [Vertex AI Search - Best AI Camera Stack 2025]_

### Database and Storage Technologies

- **Primary DB:** **Supabase (PostgreSQL)** or **Firebase**.
  - _Usage:_ Storing user presets, saving "Best Shot" metadata, and simple analytics.
  - _MVP Strategy:_ Use the Free Tier. No need for complex backend.
- **Local Storage:** **IndexedDB / LocalStorage** for saving settings/presets offline on the device.

### Development Tools and Platforms

- **IDE:** VS Code.
- **Deployment:** **Vercel** (Seamless Next.js integration).
- **Testing:** Localhost on Mobile (using `ngrok` or local network to test Camera permissions which require HTTPS/Localhost).

### Cloud Infrastructure and Deployment

- **Hosting:** Vercel (Frontend & Serverless API).
- **Backend Logic:** **Next.js API Routes** (Serverless).
- **AI Processing:** **Zero Cloud Processing** (Client-side Edge AI).
  - _Benefit:_ Infinite scalability (users bring their own compute) and Privacy-first (GDPR compliant by default).

### Technology Adoption Trends

- **PWA (Progressive Web Apps):** Increasingly capable of native-like Camera access.
- **WebAssembly (WASM):** The standard for running heavy AI models in browsers with near-native performance.
- **Edge AI:** Moving inference from Server -> Browser to reduce cost and latency.

---

## Integration Patterns Analysis (Web MVP Focus)

### Camera Integration Strategy

- **Approach:** **Custom `<video>` Element + `getUserMedia` API**.
  - _Why:_ `react-webcam` abstracts too much. We need direct access to the `MediaStream` to feed MediaPipe's GPU Delegate efficiently.
  - _Constraint:_ **HTTPS is mandatory**. Development must use `mkcert` (localhost SSL) or `ngrok` to test on real mobile devices.
- **Pipeline:** `Camera Feed` -> `Hidden <video>` -> `MediaPipe Graph` -> `<canvas> Overlay`.

_Source: [Vertex AI Search - MediaPipe WebGL Performance]_

### Data Persistence (Client-Side)

- **Storage Engine:** **IndexedDB** (via `idb` or `Dexie.js` wrapper).
  - _Performance:_ Asynchronous (non-blocking) and capable of storing large JSON objects (Pose Presets) or Blob data.
  - _VS LocalStorage:_ LocalStorage is synchronous (blocks UI) and limited to ~5MB, which is insufficient for rich media apps.

_Source: [Vertex AI Search - IndexedDB vs LocalStorage for AI]_

### Real-time AI Loop Pattern

1.  **Capture:** `requestAnimationFrame` triggers the loop.
2.  **Inference:** Send `video` element reference to `poseLandmarker.detectForVideo()`.
3.  **Drawing:** Clear `<canvas>` -> Draw Wireframe -> Draw Feedback (Green/Red lines).
4.  **Feedback Logic:** Calculated locally in JS (Euclidean distance between User Joint & Preset Joint).

### Integration Security Patterns

- **Context:** **Secure Context (HTTPS)** is required for Camera access.
- **Privacy:** Since inference is client-side, no user video data leaves the device. This is a built-in privacy architecture pattern.

---

## Architectural Patterns for Web MVP

### Client-Side Architecture: "Double-Loop" Pattern

- **Main Thread (React UI):** Handles user interactions (buttons, preset selection) and lightweight rendering (HTML/CSS). Runs at 60fps.
- **Worker Thread (AI Core):** Dedicated Web Worker for MediaPipe inference.
  - _Rationale:_ Heavy tensor math `detectForVideo()` blocks the main thread. Offloading to a Worker ensures the UI never freezes, even if AI drops to 15fps on low-end devices.

_Source: [Vertex AI Search - Web Worker Pattern for AI]_

### UI Component Structure (Z-Index Layering)

| Layer (Z-Index) | Component             | Description                                                   |
| :-------------- | :-------------------- | :------------------------------------------------------------ |
| **0 (Bottom)**  | `<video>`             | Hidden/Transparent. Source of raw pixel data.                 |
| **1**           | `<canvas id="guide">` | Static Wireframe (The "Target" Pose).                         |
| **2**           | `<canvas id="user">`  | Real-time Body Landmarks (The "Actual" Pose).                 |
| **3 (Top)**     | `<UIOverlay>`         | Controls, Feedback Toast ("Good!", "Tilt Left"), Match Score. |

### State Management: Atomic updates (Jotai)

- **Choice:** **Jotai**.
- **Reason:** We need to update the "Similarity Score" 30-60 times per second. Zustand or Context API would trigger full re-renders of the App tree. Jotai allows atomic updates to just the `ScoreComponent` without re-rendering the Camera or Canvas.

_Source: [Vertex AI Search - Jotai vs Zustand for High Frequency]_

---

## Implementation Approaches and Technology Adoption

### Implementation Strategy (Web MVP)

- **Model Storage Strategy:**
  - **Host:** Use **CDNs (jsDelivr)** for MediaPipe Wasm/JS bundles.
  - **Models:** Fetch `.task` files from **Google Storage** or **CDN** dynamically on app load to avoid Vercel Bandwidth limits (100GB/month).
  - _Warning:_ Do NOT bundle 10MB+ models in the Next.js `public` folder; it kills build time and Vercel limits.

_Source: [Vertex AI Search - Next.js MediaPipe Best Practices]_

### Calibration & Alignment

- **Coordinate System:** Use **Normalized Landmarks** (0.0 - 1.0) for 2D Overlay.
  - _Why:_ Normalized values map automatically to any screen aspect ratio (Mobile Portrait / Desktop). No complex camera matrix calibration needed for MVP.
- **Alignment Logic:**
  - Calculate **Cosine Similarity** between User Vector and Preset Vector.
  - Threshold > 0.95 = Match (Green).

### Deployment and Operations

- **Hosting:** **Vercel** (Hobby Tier is sufficient if models are offloaded).
- **SSL/HTTPS:** **Mandatory**. Camera API will **fail** on HTTP.
  - _Local Dev:_ Use `https://localhost` via `mkcert` or `ngrok` for mobile testing.
- **PWA Capabilities:** Add `manifest.json` to allow "Add to Home Screen" for a full-screen app experience.

### Technical Research Recommendations

1.  **Phase 1 (MVP):** Build PWA with Next.js + MediaPipe Web. Focus on "Pose Matching" logic.
2.  **Phase 2 (Performance):** Optimize Web Worker and add "Auto-Shutter" (take photo when score > 0.98).
3.  **Phase 3 (Native):** Only migrate to Flutter/Swift if Web Performance proves insufficient (unlikely for current premium phones).

---

## Conclusion

The **Web-First (PWA)** approach using **Next.js + MediaPipe** is the fastest, most effective path to an MVP for the contest. It avoids App Store friction, leverages powerful GPU-accelerated Web AI, and scales safely by offloading heavy assets to CDNs.
