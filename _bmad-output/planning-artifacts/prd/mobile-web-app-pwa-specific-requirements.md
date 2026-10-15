# Mobile Web App (PWA) Specific Requirements

## Project-Type Overview

**ai-perfect-shot** is a Progressive Web App (PWA) focused on mobile browsers, leveraging client-side AI for real-time camera processing. This architecture choice prioritizes:

- **Instant access** (no App Store friction)
- **Cross-platform compatibility** (single codebase for iOS and Android)
- **Privacy-first design** (all processing happens on-device)

## Platform Requirements

| Platform    | Priority | Browser      | Notes                                         |
| ----------- | -------- | ------------ | --------------------------------------------- |
| **iOS**     | Primary  | Safari 15.4+ | Camera API fully supported; requires HTTPS    |
| **Android** | Primary  | Chrome 90+   | Excellent MediaPipe WebGL performance         |
| **Desktop** | Low      | Chrome/Edge  | Functional but not optimized (webcam support) |

**Browser-Specific Considerations:**

- **iOS Safari:** Requires user gesture to start camera; no background audio; limited haptic API
- **Android Chrome:** Full feature support; Service Worker caching works reliably

## Device Permissions

| Permission            | Purpose                                  | Required        | Fallback                   |
| --------------------- | ---------------------------------------- | --------------- | -------------------------- |
| **Camera**            | Real-time pose detection & photo capture | ✅ Mandatory    | No fallback (core feature) |
| **Storage/Downloads** | Save photos to Camera Roll               | ✅ Mandatory    | In-browser download        |
| **Vibration**         | Haptic feedback on pose match            | ⚠️ Nice-to-have | Audio-only feedback        |
| **Audio Playback**    | "Ding" sound for subject feedback        | ⚠️ Nice-to-have | Visual-only feedback       |

**Permission Flow:**

1. Show permission explanation screen before requesting
2. Request camera on user action (not on page load)
3. Handle denial gracefully with re-request option

## Offline & Caching Strategy

| Asset Type              | Caching Strategy             | Cache Duration |
| ----------------------- | ---------------------------- | -------------- |
| App Shell (HTML/CSS/JS) | Service Worker (Cache-First) | Until update   |
| MediaPipe WASM/JS       | CDN + Cache API              | Long-term      |
| Pose Models (.task)     | Lazy Load + Cache            | Long-term      |
| Pose Presets (JSON)     | IndexedDB                    | Persistent     |

**Note:** Camera functionality requires active network context (HTTPS origin), but cached assets allow near-instant app reload.

## Performance Requirements

| Metric                  | Target (Flagship) | Target (Mid-range) | Measurement     |
| ----------------------- | ----------------- | ------------------ | --------------- |
| **Pose FPS**            | 30 FPS            | 15 FPS (Lite Mode) | Chrome DevTools |
| **Feedback Latency**    | < 50ms            | < 100ms            | Performance API |
| **Time to Interactive** | < 2s              | < 3s               | Lighthouse      |
| **Model Load Time**     | < 1.5s            | < 2.5s             | Network + parse |
| **Memory Usage**        | < 200MB           | < 300MB            | DevTools Memory |

**Device Capability Detection:**

- On first launch, run a quick benchmark (5 frames)
- If FPS < 15, automatically enable "Lite Mode"
- Show warning if device is unsupported

## PWA Installation & Distribution

**Manifest Configuration:**

- name: "ai-perfect-shot"
- short_name: "PerfectShot"
- display: "standalone"
- orientation: "portrait"
- theme_color: "#000000"

**Distribution Strategy:**

- Primary: Direct URL sharing (link in bio, QR code)
- Secondary: "Add to Home Screen" prompt after first successful photo
- Future: App Store wrapper (Capacitor/PWABuilder) if needed for discoverability

## Technical Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (PWA)                        │
├─────────────────────────────────────────────────────────┤
│  UI Layer (React/Next.js)                               │
│  ├── Camera Component (getUserMedia)                   │
│  ├── Wireframe Canvas (WebGL overlay)                  │
│  └── Controls (Shutter, Next Pose)                     │
├─────────────────────────────────────────────────────────┤
│  AI Layer (Web Worker)                                  │
│  ├── MediaPipe Pose Landmarker (WASM)                  │
│  ├── MediaPipe Object Detection (~5MB)                 │  ← NEW
│  ├── Scene Classification (MobileNet ~15MB)            │  ← NEW
│  ├── Pose Recommendation Engine                        │  ← NEW
│  ├── Pose Matching Logic (Cosine Similarity)           │
│  └── Feedback Calculation (Red/Yellow/Green)           │
├─────────────────────────────────────────────────────────┤
│  Storage Layer (IndexedDB)                              │
│  └── Pose Library (tagged by scene/props), User Settings│
└─────────────────────────────────────────────────────────┘
```

**AI Model Budget:** ~20-25MB total (Pose + Objects + Scene)
**FPS Impact:** 30 FPS → ~22-25 FPS (still smooth)
