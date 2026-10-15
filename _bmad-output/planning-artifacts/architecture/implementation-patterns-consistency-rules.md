# Implementation Patterns & Consistency Rules

## Pattern Categories Defined

**Critical Conflict Points Identified:** 15+ areas where AI agents could make different choices

These patterns ensure all AI agents implement code that is compatible, consistent, and maintainable.

## Naming Patterns

**File Naming Conventions:**

| Type             | Pattern                | Example                   |
| ---------------- | ---------------------- | ------------------------- |
| React Components | kebab-case.tsx         | `camera-preview.tsx`      |
| Hooks            | use-[feature].ts       | `use-camera.ts`           |
| Jotai Stores     | [feature]-store.ts     | `pose-store.ts`           |
| Types            | [feature].types.ts     | `pose.types.ts`           |
| Utils            | [function-name].ts     | `calculate-similarity.ts` |
| Tests            | [filename].test.ts     | `camera-preview.test.ts`  |
| Constants        | [feature].constants.ts | `pose.constants.ts`       |

**Code Naming Conventions:**

| Type             | Pattern                  | Example                                  |
| ---------------- | ------------------------ | ---------------------------------------- |
| React Components | PascalCase               | `CameraPreview`, `PoseHintCard`          |
| Functions        | camelCase                | `calculatePoseSimilarity`, `startCamera` |
| Custom Hooks     | use[Feature]             | `useCamera`, `usePoseDetection`          |
| Jotai Atoms      | [feature][Field]Atom     | `poseScoreAtom`, `cameraStatusAtom`      |
| Types/Interfaces | PascalCase (no I prefix) | `PoseData`, `CameraConfig`               |
| Constants        | SCREAMING_SNAKE_CASE     | `MAX_RETRY_COUNT`, `POSE_THRESHOLD`      |
| Enums            | PascalCase               | `CameraStatus`, `FeedbackColor`          |

**Anti-patterns to avoid:**

- ❌ `IPoseData` (no Hungarian notation)
- ❌ `useCameraHook` (no suffix on hooks)
- ❌ `CameraPreviewComponent` (no Component suffix)
- ❌ `pose_score_atom` (no snake_case in JS/TS)

## Structure Patterns

**Project Organization (By Feature):**

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── manifest.ts
│   └── globals.css
├── components/
│   ├── camera/                   # Camera feature
│   │   ├── camera-preview.tsx
│   │   ├── camera-preview.test.ts
│   │   ├── wireframe-canvas.tsx
│   │   └── feedback-glow.tsx
│   ├── controls/                 # Control feature
│   │   ├── control-bar.tsx
│   │   └── pose-hint-card.tsx
│   ├── screens/                  # Screen compositions
│   │   ├── camera-screen.tsx
│   │   └── preview-screen.tsx
│   └── ui/                       # Shadcn components
│       ├── button.tsx
│       ├── sheet.tsx
│       └── dialog.tsx
├── lib/
│   ├── ai/                       # AI/ML code
│   │   ├── pose-detector.ts
│   │   ├── pose-matcher.ts
│   │   └── worker.ts
│   ├── hooks/                    # Shared hooks
│   │   ├── use-camera.ts
│   │   └── use-pose-detection.ts
│   ├── stores/                   # Jotai atoms
│   │   ├── pose-store.ts
│   │   ├── camera-store.ts
│   │   └── settings-store.ts
│   ├── types/                    # Shared types
│   │   ├── pose.types.ts
│   │   └── camera.types.ts
│   └── utils/                    # Utility functions
│       ├── calculate-similarity.ts
│       └── audio-feedback.ts
├── data/                         # Static data
│   └── poses/
│       ├── index.ts
│       └── solo-chair.json
└── public/
    ├── sounds/
    │   └── ding.mp3
    └── icons/
```

**Test Location Pattern:**

- Tests are **co-located** with source files
- Test files use `.test.ts` or `.test.tsx` suffix
- No separate `__tests__` directory

## Format Patterns

**TypeScript Types (Pose Data):**

```typescript
// lib/types/pose.types.ts
export interface PoseLandmark {
  x: number; // 0.0 - 1.0 normalized
  y: number; // 0.0 - 1.0 normalized
  z: number; // depth (optional use)
  visibility: number;
}

export interface PoseData {
  landmarks: PoseLandmark[];
  timestamp: number;
}

export interface PosePreset {
  id: string;
  name: string;
  actionHint: string;
  sceneType: "solo-chair" | "sofa" | "standing" | "stage";
  targetLandmarks: PoseLandmark[];
}

export interface PoseMatchResult {
  score: number; // 0.0 - 1.0
  feedback: FeedbackColor;
  corrections: string[]; // e.g., ["Tilt head left", "Raise chin"]
}

export type FeedbackColor = "red" | "yellow" | "green";
```

**Error Format:**

```typescript
// lib/types/error.types.ts
export interface AppError {
  code: string; // e.g., 'CAMERA_ACCESS_DENIED'
  message: string; // User-friendly message
  details?: unknown; // Technical details for debugging
}
```

## Communication Patterns

**Web Worker Message Protocol:**

```typescript
// lib/types/worker.types.ts

// Messages TO worker
export type WorkerInMessage =
  | { type: "INIT"; payload: { modelPath: string } }
  | { type: "DETECT"; payload: { imageData: ImageBitmap; timestamp: number } }
  | { type: "SET_TARGET"; payload: { targetPose: PoseLandmark[] } }
  | { type: "TERMINATE" };

// Messages FROM worker
export type WorkerOutMessage =
  | { type: "READY" }
  | { type: "POSE_RESULT"; payload: PoseMatchResult }
  | { type: "ERROR"; payload: AppError }
  | { type: "FPS_UPDATE"; payload: { fps: number } };
```

**Jotai Atom Patterns:**

```typescript
// lib/stores/pose-store.ts
import { atom } from "jotai";

// Primitive atoms
export const poseScoreAtom = atom<number>(0);
export const feedbackColorAtom = atom<FeedbackColor>("red");
export const correctionsAtom = atom<string[]>([]);

// Derived atom (read-only)
export const isMatchedAtom = atom((get) => get(poseScoreAtom) >= 0.9);
```

**Logging Pattern:**

```typescript
// lib/utils/logger.ts
const isDev = process.env.NODE_ENV === "development";

export const logger = {
  log: (component: string, message: string, data?: unknown) => {
    if (isDev) console.log(`[${component}] ${message}`, data ?? "");
  },
  warn: (component: string, message: string, data?: unknown) => {
    console.warn(`[${component}] ${message}`, data ?? "");
  },
  error: (component: string, message: string, error?: unknown) => {
    console.error(`[${component}] ${message}`, error ?? "");
  },
};
```

## Process Patterns

**Status State Pattern:**

```typescript
// lib/types/status.types.ts
export type AsyncStatus = "idle" | "loading" | "ready" | "error";

// Usage in atoms
export const cameraStatusAtom = atom<AsyncStatus>("idle");
export const aiStatusAtom = atom<AsyncStatus>("idle");
```

**Error Boundary Pattern (Per-Screen):**

```typescript
// components/screens/camera-screen.tsx
import { ErrorBoundary } from 'react-error-boundary';

function CameraErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-screen">
      <p>Something went wrong with the camera</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export function CameraScreen() {
  return (
    <ErrorBoundary FallbackComponent={CameraErrorFallback}>
      <CameraPreview />
      <WireframeCanvas />
      <ControlBar />
    </ErrorBoundary>
  );
}
```

**Feedback Utilities Pattern:**

```typescript
// lib/utils/audio-feedback.ts
class AudioFeedback {
  private dingSound: HTMLAudioElement | null = null;

  preload() {
    if (typeof window !== "undefined") {
      this.dingSound = new Audio("/sounds/ding.mp3");
      this.dingSound.preload = "auto";
    }
  }

  playDing() {
    if (this.dingSound) {
      this.dingSound.currentTime = 0;
      this.dingSound.play().catch(() => {});
    }
  }
}

export const audioFeedback = new AudioFeedback();

// lib/utils/haptic-feedback.ts
export function triggerHaptic(pattern: "short" | "long" = "short") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern === "short" ? 50 : 100);
  }
}
```

## Enforcement Guidelines

**All AI Agents MUST:**

1. Follow file naming conventions (kebab-case for files, PascalCase for components)
2. Use discriminated unions for worker messages with `type` field
3. Use AsyncStatus enum for loading states (never bare booleans)
4. Co-locate tests with source files
5. Use logger utility instead of raw console.log
6. Wrap haptic/audio in utility functions that check browser support
7. Use TypeScript strict mode with explicit types
8. Place shared code in `lib/`, feature code in `components/[feature]/`

**Pattern Verification:**

- ESLint rules enforce naming conventions
- TypeScript strict mode catches type violations
- PR review checks for pattern compliance

---
