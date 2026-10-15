# Core Architectural Decisions

## Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- AI Processing Architecture (Web Worker isolation)
- Camera Integration Pattern (Custom hook with direct MediaStream)
- State Management (Jotai for 30 FPS updates)

**Important Decisions (Shape Architecture):**

- Canvas Rendering (2D Canvas for wireframe)
- Storage Strategy (idb + LocalStorage)
- CDN Strategy (jsDelivr for AI models)

**Deferred Decisions (Post-MVP):**

- User Authentication
- Cloud Sync
- Analytics/Error Reporting (Sentry)
- Voice Guidance

## Data Architecture

| Decision                 | Choice                     | Rationale                                                                        |
| ------------------------ | -------------------------- | -------------------------------------------------------------------------------- |
| **IndexedDB Wrapper**    | `idb` (v8.x)               | Lightweight, Promise-based, sufficient for simple key-value and blob storage     |
| **Pose Library Storage** | Bundled JSON               | MVP has ~16 poses, no need for dynamic fetching; reduces network dependency      |
| **User Settings**        | LocalStorage               | Simple preferences (camera mode, sound on/off); synchronous access is acceptable |
| **Photo Storage**        | None (Save to Camera Roll) | Photos saved directly to device; no app-side storage needed                      |

**Data Flow:**

```
Pose Presets (JSON) → Memory → Pose Matching Engine
User Settings → LocalStorage → App State (Jotai atoms)
Captured Photos → Blob → Download API → Camera Roll
```

## Authentication & Security

| Decision                    | Choice     | Rationale                                                 |
| --------------------------- | ---------- | --------------------------------------------------------- |
| **Authentication**          | None (MVP) | Zero-backend architecture; no user accounts required      |
| **Authorization**           | N/A        | Single-user local app                                     |
| **Content Security Policy** | Strict     | Allow: `self`, jsDelivr CDN, Google Storage for AI models |
| **CORS**                    | N/A        | No backend API calls                                      |
| **Privacy**                 | By Design  | All processing on-device; no data egress                  |

**Security Headers (via next.config.js):**

```javascript
headers: [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline';",
  },
];
```

## API & Communication Patterns

| Decision             | Choice             | Rationale                                         |
| -------------------- | ------------------ | ------------------------------------------------- |
| **External APIs**    | None               | Fully client-side application                     |
| **AI Model Loading** | CDN (jsDelivr)     | Avoids Vercel bandwidth limits; cached by browser |
| **Error Reporting**  | Console only (MVP) | Defer Sentry integration to post-MVP              |
| **Service Worker**   | Optional (Serwist) | For offline shell caching; not critical for MVP   |

**AI Model Sources:**

- MediaPipe WASM: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm`
- Pose Landmarker: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task`

## Frontend Architecture

| Decision                   | Choice                    | Rationale                                                                         |
| -------------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| **Camera Integration**     | Custom Hook (`useCamera`) | Direct MediaStream access required for MediaPipe; react-webcam abstracts too much |
| **AI Processing**          | Web Worker                | Critical for 30 FPS; isolates heavy AI inference from UI thread                   |
| **Canvas Rendering**       | 2D Canvas API             | Sufficient for wireframe drawing; WebGL/PixiJS overkill for MVP                   |
| **State Management**       | Jotai                     | Atomic updates for pose score (30 FPS); no full re-renders                        |
| **Component Architecture** | Feature-based folders     | Group by feature (camera/, pose/, feedback/)                                      |

**AI Loop Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Thread                            │
├─────────────────────────────────────────────────────────────┤
│  React UI → requestAnimationFrame → Canvas Drawing          │
│      ↑                                    ↓                 │
│  Jotai Atoms ← postMessage ← ┌──────────────────────────┐   │
│  (pose score)                │      Web Worker          │   │
│                              ├──────────────────────────┤   │
│                              │  MediaPipe WASM          │   │
│                              │  detectForVideo()        │   │
│                              │  Pose Matching Logic     │   │
│                              └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Component Structure:**

```
src/components/
├── camera/
│   ├── CameraPreview.tsx      # Video element + getUserMedia
│   ├── WireframeCanvas.tsx    # Pose skeleton overlay
│   └── FeedbackGlow.tsx       # Color gradient overlay
├── controls/
│   ├── ControlBar.tsx         # Shutter, Next, Flip buttons
│   └── PoseHintCard.tsx       # Pose name + action hint
├── screens/
│   ├── CameraScreen.tsx       # Main composition
│   └── PreviewScreen.tsx      # Captured photo review
└── ui/                        # Shadcn components
```

## Infrastructure & Deployment

| Decision                | Choice                 | Rationale                                                 |
| ----------------------- | ---------------------- | --------------------------------------------------------- |
| **Hosting**             | Vercel                 | PRD requirement; seamless Next.js integration             |
| **CI/CD**               | Vercel Auto-deploy     | GitHub integration; automatic preview deployments         |
| **Preview Deployments** | Enabled                | Essential for testing on real mobile devices before merge |
| **Domain**              | Vercel subdomain (MVP) | Custom domain deferred to post-MVP                        |
| **SSL**                 | Automatic (Vercel)     | Required for Camera API                                   |

**Deployment Flow:**

```
GitHub Push → Vercel Build → Preview Deploy (PRs) → Production (main)
```

**Build Configuration:**

```javascript
// next.config.js
module.exports = {
  output: "standalone",
  images: { unoptimized: true }, // PWA compatibility
  experimental: { turbo: {} },
};
```

## Decision Impact Analysis

**Implementation Sequence:**

1. Project initialization (Next.js + Shadcn/UI)
2. Camera integration (custom hook + getUserMedia)
3. Web Worker setup for AI processing
4. MediaPipe integration (CDN loading)
5. Canvas wireframe rendering
6. Pose matching logic
7. Feedback system (color + audio + haptic)
8. PWA manifest and icons

**Cross-Component Dependencies:**

- Web Worker must initialize before camera starts processing
- Jotai atoms must be set up before AI loop begins
- Canvas z-index must be above video element
- Audio/Haptic require user gesture to initialize (iOS Safari)

---
