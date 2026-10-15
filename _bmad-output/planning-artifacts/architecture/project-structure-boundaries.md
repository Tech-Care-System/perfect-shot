# Project Structure & Boundaries

## Complete Project Directory Structure

```
ai-perfect-shot/
├── .github/
│   └── workflows/
│       └── ci.yml                      # Lint + type-check on PR
├── public/
│   └── sounds/
│       └── ding.mp3                    # Pose match audio cue
├── src/
│   ├── app/
│   │   ├── globals.css                 # Tailwind + CSS variables + dark mode
│   │   ├── layout.tsx                  # Root layout (dark mode class, fonts)
│   │   ├── page.tsx                    # Camera screen (app entry)
│   │   ├── loading.tsx                 # Suspense: AI model loading skeleton
│   │   ├── error.tsx                   # Error boundary (global)
│   │   ├── not-found.tsx               # Custom 404 page
│   │   ├── manifest.ts                 # PWA manifest (name, icons, theme)
│   │   ├── icon.tsx                    # Dynamic favicon generation
│   │   ├── apple-icon.tsx              # Dynamic Apple touch icon
│   │   ├── opengraph-image.tsx         # Dynamic OG image for social sharing
│   │   ├── robots.ts                   # SEO robots.txt
│   │   ├── sitemap.ts                  # SEO sitemap.xml
│   │   └── _components/                # Private page-specific components (if needed)
│   ├── components/                     # Shared/reusable components
│   │   ├── camera/
│   │   │   ├── camera-preview.tsx      # Video + getUserMedia
│   │   │   ├── camera-preview.test.ts
│   │   │   ├── wireframe-canvas.tsx    # 2D Canvas skeleton overlay
│   │   │   └── feedback-glow.tsx       # R/Y/G gradient overlay
│   │   ├── controls/
│   │   │   ├── control-bar.tsx         # Shutter, Next, Flip buttons
│   │   │   └── pose-hint-card.tsx      # Pose name + action hint
│   │   ├── screens/                    # Screen compositions
│   │   │   ├── camera-screen.tsx       # Main camera composition
│   │   │   └── preview-screen.tsx      # Photo preview overlay
│   │   └── ui/                         # Shadcn/UI components
│   │       ├── button.tsx
│   │       ├── sheet.tsx
│   │       └── dialog.tsx
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── pose-detector.ts        # MediaPipe initialization
│   │   │   ├── pose-matcher.ts         # Cosine similarity calculation
│   │   │   ├── worker.ts               # Web Worker for AI inference
│   │   │   └── worker.types.ts         # Worker message discriminated unions
│   │   ├── hooks/
│   │   │   ├── use-camera.ts           # Camera access hook
│   │   │   ├── use-pose-detection.ts   # AI detection loop hook
│   │   │   └── use-device-capability.ts # Device benchmark hook
│   │   ├── stores/
│   │   │   ├── pose-store.ts           # Pose score, feedback atoms
│   │   │   ├── camera-store.ts         # Camera status, facing mode
│   │   │   └── settings-store.ts       # Sound, haptic preferences
│   │   ├── types/
│   │   │   ├── pose.types.ts           # PoseLandmark, PosePreset, etc.
│   │   │   ├── camera.types.ts         # CameraConfig, CameraStatus
│   │   │   ├── error.types.ts          # AppError interface
│   │   │   └── status.types.ts         # AsyncStatus enum
│   │   └── utils/
│   │       ├── audio-feedback.ts       # Preload + play ding
│   │       ├── haptic-feedback.ts      # Vibration wrapper
│   │       ├── calculate-similarity.ts # Pose vector comparison
│   │       ├── logger.ts               # Structured logging
│   │       └── save-photo.ts           # Blob → Camera Roll
│   ├── data/
│   │   └── poses/
│   │       ├── index.ts                # Export all pose presets
│   │       ├── solo-chair.json         # 3-4 seated poses
│   │       ├── sofa.json               # 3-4 sofa poses
│   │       ├── standing.json           # 3-4 standing poses
│   │       └── stage.json              # 3-4 stage poses
│   └── constants/
│       └── app.constants.ts            # Thresholds, CDN URLs
├── .env.example
├── .eslintrc.json
├── .gitignore
├── components.json                     # Shadcn/UI config
├── next.config.js                      # CSP headers, standalone output
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts                  # Dark mode + custom colors
└── tsconfig.json                       # TypeScript strict mode
```

## Next.js App Router Features Utilized

| Feature              | File                  | Purpose                                 |
| -------------------- | --------------------- | --------------------------------------- |
| **Suspense Loading** | `loading.tsx`         | Automatic skeleton while AI models load |
| **Error Boundary**   | `error.tsx`           | Global error handling with retry        |
| **Not Found**        | `not-found.tsx`       | Custom 404 page                         |
| **Dynamic Favicon**  | `icon.tsx`            | Generated app icons                     |
| **Dynamic OG Image** | `opengraph-image.tsx` | Social sharing preview                  |
| **PWA Manifest**     | `manifest.ts`         | App name, icons, theme                  |
| **SEO Robots**       | `robots.ts`           | Dynamic robots.txt                      |
| **SEO Sitemap**      | `sitemap.ts`          | Dynamic sitemap.xml                     |
| **Private Folders**  | `_components/`        | Page-specific, non-routable             |

## Architectural Boundaries

**Component Communication Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                    app/page.tsx                             │
│                         ↓                                   │
│              app/_components/camera-screen.tsx              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │  CameraPreview  │  │ WireframeCanvas │  │ FeedbackGlow│  │
│  │   (video)       │  │   (canvas)      │  │   (div)     │  │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘  │
│           │ ImageBitmap        │ landmarks        │ score   │
│           ↓                    ↓                  ↓         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Jotai Atoms (stores/)                ││
│  │  cameraStatusAtom | poseScoreAtom | feedbackColorAtom   ││
│  └──────────────────────────┬──────────────────────────────┘│
│                             │ postMessage                   │
│                             ↓                               │
│              ┌──────────────────────────────┐               │
│              │    Web Worker (lib/ai/)      │               │
│              │  MediaPipe + Pose Matching   │               │
│              └──────────────────────────────┘               │
├─────────────────────────────────────────────────────────────┤
│  ControlBar  │  PoseHintCard                               │
└─────────────────────────────────────────────────────────────┘
```

**Boundary Rules:**

| Boundary                     | Rule                                        |
| ---------------------------- | ------------------------------------------- |
| `app/` → `components/`       | Page imports shared components              |
| `app/_components/`           | Page-specific, not shared                   |
| `components/` → `lib/hooks/` | Components use hooks                        |
| `lib/hooks/` → `lib/stores/` | Hooks read/write atoms                      |
| `lib/hooks/` → `lib/ai/`     | Hooks communicate with Worker               |
| `lib/ai/worker.ts`           | Isolated, communicates via postMessage only |
| `data/poses/`                | Read-only, imported by matcher              |

## Requirements to Structure Mapping

| FR Category              | Primary Location                   | Files                                              |
| ------------------------ | ---------------------------------- | -------------------------------------------------- |
| **Camera & Capture**     | `components/camera/`, `lib/hooks/` | camera-preview.tsx, use-camera.ts                  |
| **AI Pose Detection**    | `lib/ai/`, `lib/hooks/`            | pose-detector.ts, worker.ts, use-pose-detection.ts |
| **Visual Feedback**      | `components/camera/`               | wireframe-canvas.tsx, feedback-glow.tsx            |
| **Audio & Haptic**       | `lib/utils/`                       | audio-feedback.ts, haptic-feedback.ts              |
| **Pose Library**         | `data/poses/`                      | index.ts, solo-chair.json, etc.                    |
| **Device Compatibility** | `lib/hooks/`, `lib/utils/`         | use-device-capability.ts                           |

## External Integration Points

| Integration        | Source                   | Purpose                  |
| ------------------ | ------------------------ | ------------------------ |
| **MediaPipe WASM** | `cdn.jsdelivr.net`       | AI runtime               |
| **Pose Model**     | `storage.googleapis.com` | Pose landmarks task file |
| **Google Fonts**   | `fonts.googleapis.com`   | Inter font family        |

## Development Workflow

**Commands:**

```bash
npm run dev      # Turbopack dev server (localhost:3000)
npm run build    # Production build (.next/standalone)
npm run lint     # ESLint + TypeScript check
npm run start    # Start production server
```

**Deployment (Vercel):**

```
git push main → Vercel Build → Preview (PRs) / Production (main)
```

## File Organization Summary

| Directory          | Purpose                       | Share Scope |
| ------------------ | ----------------------------- | ----------- |
| `app/`             | Routing + Next.js conventions | N/A         |
| `app/_components/` | Page-specific compositions    | Page only   |
| `components/`      | Reusable UI components        | App-wide    |
| `lib/ai/`          | AI/ML processing code         | App-wide    |
| `lib/hooks/`       | Custom React hooks            | App-wide    |
| `lib/stores/`      | Jotai atoms (state)           | App-wide    |
| `lib/types/`       | TypeScript type definitions   | App-wide    |
| `lib/utils/`       | Utility functions             | App-wide    |
| `data/`            | Static data (poses)           | App-wide    |
| `constants/`       | App constants                 | App-wide    |

---
