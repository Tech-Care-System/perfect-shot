# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in **ai-perfect-shot**. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack

| Technology       | Version source | Notes                   |
| ---------------- | -------------- | ----------------------- |
| **Next.js**      | `package.json` | App Router              |
| **React**        | `package.json` | UI library              |
| **TypeScript**   | `package.json` | Strict mode enabled     |
| **Tailwind CSS** | `package.json` | CSS-first configuration |
| **Shadcn/UI**    | —              | Component library       |
| **Jotai**        | `package.json` | Atomic state management |
| **MediaPipe**    | `package.json` | Client-side AI          |

---

## Critical Implementation Rules

### 1. File Naming (STRICT)

```
✅ CORRECT: kebab-case.tsx
   camera-preview.tsx
   use-camera.ts
   pose-store.ts

❌ WRONG: PascalCase or snake_case files
   CameraPreview.tsx
   camera_preview.tsx
```

### 2. Component Naming (STRICT)

```typescript
// ✅ CORRECT: PascalCase, no suffix
export function CameraPreview() {}
export function PoseHintCard() {}

// ❌ WRONG: Component suffix, Interface prefix
export function CameraPreviewComponent() {}
interface IPoseData {}
```

### 3. Hook Naming (STRICT)

```typescript
// ✅ CORRECT: use[Feature], no suffix
export function useCamera() {}
export function usePoseDetection() {}

// ❌ WRONG: Hook suffix
export function useCameraHook() {}
```

### 4. Jotai Atom Naming (STRICT)

```typescript
// ✅ CORRECT: [feature][Field]Atom
export const poseScoreAtom = atom<number>(0);
export const cameraStatusAtom = atom<AsyncStatus>("idle");

// ❌ WRONG: snake_case or no suffix
export const pose_score_atom = atom<number>(0);
export const poseScore = atom<number>(0);
```

### 5. Loading States (STRICT)

```typescript
// ✅ CORRECT: AsyncStatus enum
type AsyncStatus = "idle" | "loading" | "ready" | "error";
const [status, setStatus] = useState<AsyncStatus>("idle");

// ❌ WRONG: Bare boolean
const [isLoading, setIsLoading] = useState(false);
```

### 6. Web Worker Messages (STRICT)

```typescript
// ✅ CORRECT: Discriminated unions with `type` field
type WorkerMessage =
  | { type: "INIT"; payload: { modelPath: string } }
  | { type: "DETECT"; payload: { imageData: ImageBitmap } }
  | { type: "RESULT"; payload: PoseMatchResult };

worker.postMessage({ type: "DETECT", payload: { imageData } });

// ❌ WRONG: Untyped or different field name
worker.postMessage({ action: "detect", data: imageData });
```

### 7. Logging (STRICT)

```typescript
// ✅ CORRECT: Use logger utility
import { logger } from "@/lib/utils/logger";
logger.log("CameraPreview", "Camera initialized", { facing: "user" });

// ❌ WRONG: Raw console.log
console.log("Camera initialized");
```

### 8. Browser API Wrappers (STRICT)

```typescript
// ✅ CORRECT: Wrapped with feature detection
import { triggerHaptic } from "@/lib/utils/haptic-feedback";
triggerHaptic("short");

// ❌ WRONG: Direct API call
navigator.vibrate(50);
```

### 9. Constants Naming (STRICT)

```typescript
// ✅ CORRECT: SCREAMING_SNAKE_CASE
export const MAX_RETRY_COUNT = 3;
export const POSE_THRESHOLD = 0.9;
export const MEDIAPIPE_CDN_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision";

// ❌ WRONG: camelCase or kebab-case
export const maxRetryCount = 3;
export const poseThreshold = 0.9;
```

### 10. Functions & Enums Naming (STRICT)

```typescript
// ✅ CORRECT: camelCase for functions
export function calculatePoseSimilarity() {}
export function startCamera() {}

// ✅ CORRECT: PascalCase for enums
enum CameraStatus {
  Idle,
  Active,
  Error,
}
enum FeedbackColor {
  Red,
  Yellow,
  Green,
}

// ❌ WRONG: snake_case
export function calculate_pose_similarity() {}
enum camera_status {
  idle,
  active,
  error,
}
```

---

## Project Structure Rules

### Directory Hierarchy

```
src/
├── app/                    # Next.js App Router ONLY
│   └── [Next.js files]     # layout, page, loading, error, manifest, etc.
├── components/             # Shared/reusable
│   ├── camera/             # Camera feature components
│   │   ├── camera-preview.tsx
│   │   ├── wireframe-canvas.tsx
│   │   └── feedback-glow.tsx
│   ├── controls/           # Control components
│   │   ├── control-bar.tsx
│   │   └── pose-hint-card.tsx
│   ├── screens/            # Screen compositions
│   │   ├── camera-screen.tsx
│   │   └── preview-screen.tsx
│   └── ui/                 # Shadcn components
│       ├── button.tsx
│       ├── sheet.tsx
│       └── dialog.tsx
├── lib/
│   ├── ai/                 # AI/ML code + Worker
│   │   ├── pose-detector.ts
│   │   ├── pose-matcher.ts
│   │   ├── worker.ts
│   │   └── worker.types.ts
│   ├── hooks/              # Shared hooks
│   │   ├── use-camera.ts
│   │   ├── use-pose-detection.ts
│   │   └── use-device-capability.ts
│   ├── stores/             # Jotai atoms
│   │   ├── pose-store.ts
│   │   ├── camera-store.ts
│   │   └── settings-store.ts
│   ├── types/              # Shared TypeScript types
│   │   ├── pose.types.ts
│   │   ├── camera.types.ts
│   │   ├── error.types.ts
│   │   └── status.types.ts
│   └── utils/              # Utility functions
│       ├── audio-feedback.ts
│       ├── haptic-feedback.ts
│       ├── calculate-similarity.ts
│       ├── logger.ts
│       └── save-photo.ts
├── data/                   # Static data (poses)
│   └── poses/
│       ├── index.ts
│       ├── solo-chair.json
│       ├── sofa.json
│       ├── standing.json
│       └── stage.json
└── constants/
    └── app.constants.ts    # Thresholds, CDN URLs
```

### Placement Rules

| Code Type             | Location                |
| --------------------- | ----------------------- |
| Screen compositions   | `components/screens/`   |
| Reusable components   | `components/[feature]/` |
| Custom hooks (shared) | `lib/hooks/`            |
| Jotai atoms           | `lib/stores/`           |
| TypeScript types      | `lib/types/`            |
| Utility functions     | `lib/utils/`            |
| AI/Worker code        | `lib/ai/`               |
| Static data           | `data/poses/`           |
| App constants         | `constants/`            |

### Test Placement

```
✅ CORRECT: Co-located with source
   components/camera/camera-preview.tsx
   components/camera/camera-preview.test.ts

❌ WRONG: Separate __tests__ folder
   __tests__/camera-preview.test.ts
```

---

## iOS Safari Quirks (CRITICAL)

### 1. Camera Access Requires User Gesture

```typescript
// ✅ CORRECT: Start camera in click handler
<button onClick={async () => {
  await navigator.mediaDevices.getUserMedia({ video: true });
}}>
  Start Camera
</button>

// ❌ WRONG: Auto-start on mount
useEffect(() => {
  navigator.mediaDevices.getUserMedia({ video: true });
}, []);
```

### 2. Audio Pre-loading Requires User Gesture

```typescript
// ✅ CORRECT: Pre-load on first interaction
const handleFirstInteraction = () => {
  audioFeedback.preload();
};

// ❌ WRONG: Auto-preload
useEffect(() => {
  new Audio("/sounds/ding.mp3").load();
}, []);
```

### 3. Limited Haptic API

```typescript
// ✅ CORRECT: Check support before using
export function triggerHaptic() {
  if ("vibrate" in navigator) {
    navigator.vibrate(50);
  }
}
```

---

## Performance Requirements

| Metric              | Target            | How to Achieve                  |
| ------------------- | ----------------- | ------------------------------- |
| Pose Detection FPS  | 30 FPS (flagship) | Web Worker isolation            |
| Feedback Latency    | <100ms            | Jotai atomic updates            |
| Time to Interactive | <3 seconds        | Turbopack, lazy loading         |
| Memory Peak         | <300MB            | Dispose MediaPipe when inactive |

---

## Anti-Patterns to AVOID

### ❌ Never Do This

1. **Don't use PascalCase for file names** (use kebab-case)
2. **Don't use bare booleans for loading states** (use AsyncStatus)
3. **Don't call browser APIs directly without wrappers** (wrap with feature detection)
4. **Don't use raw console.log in components** (use logger utility)
5. **Don't create separate **tests** folders** (co-locate tests)
6. **Don't use I-prefix for interfaces** (no Hungarian notation)
7. **Don't mutate state directly in Jotai** (use atom setters)
8. **Don't start camera/audio without user gesture on iOS** (require click handler)
9. **Don't use snake_case in JavaScript/TypeScript** (use camelCase or PascalCase)
10. **Don't put screen components in app/\_components/** (use components/screens/)

---

## Quick Reference

### Import Aliases

```typescript
// Components
import { CameraPreview } from "@/components/camera/camera-preview";
import { CameraScreen } from "@/components/screens/camera-screen";
import { ControlBar } from "@/components/controls/control-bar";

// Hooks
import { useCamera } from "@/lib/hooks/use-camera";
import { usePoseDetection } from "@/lib/hooks/use-pose-detection";

// State
import { poseScoreAtom } from "@/lib/stores/pose-store";
import { cameraStatusAtom } from "@/lib/stores/camera-store";

// Utils
import { logger } from "@/lib/utils/logger";
import { triggerHaptic } from "@/lib/utils/haptic-feedback";

// Constants
import { POSE_THRESHOLD, MEDIAPIPE_CDN_URL } from "@/constants/app.constants";
```

### Common Type Imports

```typescript
import type { AsyncStatus } from "@/lib/types/status.types";
import type {
  PoseLandmark,
  PosePreset,
  PoseMatchResult,
  FeedbackColor,
} from "@/lib/types/pose.types";
import type { CameraConfig, CameraFacingMode } from "@/lib/types/camera.types";
import type { AppError } from "@/lib/types/error.types";
import type { AIWorkerMessage, AIWorkerResponse } from "@/lib/ai/worker.types";
```

---

**Architecture Doc:** `_bmad-output/planning-artifacts/architecture.md`
