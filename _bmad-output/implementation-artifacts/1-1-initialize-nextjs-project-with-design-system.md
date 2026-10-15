# Story 1.1: Initialize Next.js Project with Design System

Status: done

---

## Story

As a **developer**,
I want **a properly initialized Next.js project with Shadcn/UI, Tailwind CSS, and all required dependencies**,
So that **I have a solid foundation using the current project stack**.

---

## Acceptance Criteria

### AC1: Next.js Project Initialized

**Given** the project directory is empty
**When** I run the initialization commands
**Then** a Next.js project is created with:

- TypeScript enabled
- Tailwind CSS configured (CSS-first approach)
- ESLint enabled
- App Router (not Pages Router)
- `src` directory structure
- Turbopack as default bundler
- Import alias `@/*` configured
- React Compiler support (stable)

### AC2: Shadcn/UI Initialized with Tailwind CSS

**Given** the Next.js project is created
**When** I initialize Shadcn/UI
**Then** Shadcn/UI is configured with:

- Tailwind CSS v4 (CSS-first configuration)
- Dark mode enabled
- Required components installed: Button, Sheet, Dialog
- CSS variables in globals.css using `@import "tailwindcss"` syntax

### AC3: Dependencies Installed

**Given** the project has Shadcn/UI initialized
**When** I install additional dependencies
**Then** the following packages are installed:

- `jotai` - Atomic state management
- `@mediapipe/tasks-vision` - Client-side AI
- `idb` - IndexedDB wrapper

### AC4: Build Success

**Given** all dependencies are installed
**When** I run `npm run build`
**Then** the project builds successfully without errors

### AC5: Dev Server Works

**Given** the project builds successfully
**When** I run `npm run dev`
**Then** the dev server starts on `localhost:3000` (or next available port)
**And** the welcome page renders correctly

---

## Tasks / Subtasks

- [x] **Task 1: Create Next.js Project** (AC: #1)
  - [x] Run create-next-app with all required flags
  - [x] Verify TypeScript, Tailwind CSS, ESLint are configured
  - [x] Verify App Router and src directory structure
  - [x] Verify Turbopack is default bundler (Next.js stable)

- [x] **Task 2: Configure Project Settings** (AC: #1)
  - [x] Update `next.config.ts` with required settings
  - [x] Add CSP headers configuration
  - [x] Configure standalone output mode
  - [x] Add image unoptimization for PWA

- [x] **Task 3: Initialize Shadcn/UI** (AC: #2)
  - [x] Run `npx shadcn@latest init`
  - [x] Select TypeScript, RSC, src directory
  - [x] Enable dark mode with class strategy
  - [x] Verify components.json is created

- [x] **Task 4: Install Required Shadcn Components** (AC: #2)
  - [x] Install Button component
  - [x] Install Sheet component
  - [x] Install Dialog component

- [x] **Task 5: Install Additional Dependencies** (AC: #3)
  - [x] Install jotai for state management
  - [x] Install @mediapipe/tasks-vision for AI
  - [x] Install idb for IndexedDB wrapper

- [x] **Task 6: Configure Dark Mode & Design Tokens** (AC: #2)
  - [x] Tailwind CSS uses CSS-first config (no tailwind.config.ts needed)
  - [x] Configure CSS variables in globals.css with `@theme` directive
  - [x] Add Inter font from Google Fonts
  - [x] Force dark mode globally (`<html class="dark">`)

- [x] **Task 7: Create Project Structure Foundation** (AC: #1)
  - [x] Create directory structure per architecture.md
  - [x] Add placeholder type files
  - [x] Create constants folder structure
  - [x] Add .gitkeep files for empty directories

- [x] **Task 8: Verify Build & Dev Server** (AC: #4, #5)
  - [x] Run `npm run build` and verify success
  - [x] Run `npm run dev` and verify server starts
  - [x] Verify page renders at localhost:3000

- [x] **Task 9: Review Follow-ups (AI)** (AC: #1, #2, #5)
  - [x] [AI-Review][Medium] Broken PWA Icon References: Create/add `/icon-192.png` and `/icon-512.png` to `public/` [src/app/manifest.ts]
  - [x] [AI-Review][Medium] Architecture Violation: Consolidate `src/lib/utils.ts` (file) and `src/lib/utils/` (directory) into `src/lib/utils/cn.ts` and `src/lib/utils/logger.ts` (export via barrel file)
  - [x] [AI-Review][Medium] Shadcn Config Violation: Fix `components.json` alias for hooks to point to `src/lib/hooks` instead of `src/hooks`
  - [x] [AI-Review][Low] Constant Value Mismatch: Verify `POSE_THRESHOLD` (0.9 in code vs 0.85 in context) [src/constants/app.constants.ts]

---

## Dev Notes

### 🚨 CRITICAL INITIALIZATION COMMANDS

```bash
# 1. Create Next.js project (LATEST - Turbopack is now default)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
# Note: --turbopack flag removed as Turbopack is now default in Next.js

# 2. Initialize Shadcn/UI (will detect Next.js + Tailwind CSS)
npx shadcn@latest init
# Select: React, Tailwind CSS v4, dark mode

# 3. Add required Shadcn components
npx shadcn@latest add button sheet dialog

# 4. Install additional dependencies
npm install jotai @mediapipe/tasks-vision idb
```

### ⚠️ IMPORTANT: Tailwind CSS Changes

Tailwind CSS uses **CSS-first configuration**:

- No `tailwind.config.ts` file needed for basic setup
- Uses `@import "tailwindcss"` instead of `@tailwind base/components/utilities`
- Uses `@theme` directive for custom design tokens
- Modern CSS features: cascade layers, `color-mix()`, registered custom properties

### 📁 Project Structure to Create

```
src/
├── app/
│   ├── globals.css           # Tailwind + CSS variables + dark mode
│   ├── layout.tsx            # Root layout (dark mode class, fonts)
│   ├── page.tsx              # Entry page (will become camera screen)
│   ├── manifest.ts           # PWA manifest (name, icons, theme)
│   └── loading.tsx           # Suspense loading skeleton
├── components/
│   ├── camera/               # (empty for now)
│   ├── controls/             # (empty for now)
│   ├── screens/              # (empty for now)
│   └── ui/                   # Shadcn components (auto-created)
├── lib/
│   ├── ai/                   # (empty for now)
│   ├── hooks/                # (empty for now)
│   ├── stores/               # (empty for now)
│   ├── types/
│   │   ├── status.types.ts   # AsyncStatus enum
│   │   └── error.types.ts    # AppError interface
│   └── utils/
│       └── logger.ts         # Logging utility
├── data/
│   └── poses/                # (empty for now)
├── constants/
│   └── app.constants.ts      # CDN URLs, thresholds
└── public/
    └── sounds/               # (empty for now)
```

### ⚙️ next.config.ts MUST Include (Next.js)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: { unoptimized: true }, // PWA compatibility

  // CSP Headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Note:** Next.js supports TypeScript config files natively (`next.config.ts`).

### 🎨 Tailwind CSS Configuration (CSS-First)

**Tailwind CSS does NOT use `tailwind.config.ts` for basic setup!**

Configuration is done directly in `globals.css` using the `@theme` directive:

```css
/* globals.css - Tailwind CSS way */
@import "tailwindcss";

@theme {
  --font-sans: var(--font-inter), system-ui, sans-serif;

  /* Custom colors */
  --color-background: oklch(10% 0 0); /* #0a0a0a */
  --color-foreground: oklch(100% 0 0); /* #ffffff */
  --color-surface: oklch(15% 0 0); /* #1a1a1a */
  --color-border: oklch(20% 0 0); /* #2a2a2a */

  /* Feedback colors */
  --color-feedback-success: oklch(65% 0.2 160); /* #10b981 */
  --color-feedback-warning: oklch(75% 0.2 85); /* #f59e0b */
  --color-feedback-error: oklch(60% 0.25 25); /* #ef4444 */
}
```

**Note:** Tailwind CSS uses `oklch()` color space for better perceptual uniformity.

### 📝 globals.css MUST Include (Tailwind CSS Syntax)

```css
/* Tailwind CSS - New import syntax */
@import "tailwindcss";

/* Design tokens via @theme */
@theme {
  --font-sans: var(--font-inter), system-ui, sans-serif;

  --color-background: oklch(10% 0 0);
  --color-foreground: oklch(100% 0 0);
  --color-surface: oklch(15% 0 0);
  --color-border: oklch(20% 0 0);
  --color-text-secondary: oklch(65% 0.02 260);

  --color-feedback-success: oklch(65% 0.2 160);
  --color-feedback-warning: oklch(75% 0.2 85);
  --color-feedback-error: oklch(60% 0.25 25);
}

/* Shadcn CSS variables (auto-generated by shadcn init) */
@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 0 0% 100%;
    /* ... other Shadcn variables */
  }
}

html {
  color-scheme: dark;
}

body {
  background: var(--color-background);
  color: var(--color-foreground);
}
```

### 🔤 Font Loading (layout.tsx)

```typescript
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body>{children}</body>
    </html>
  );
}
```

### 📦 Required Type Definitions

**lib/types/status.types.ts:**

```typescript
export type AsyncStatus = "idle" | "loading" | "ready" | "error";
```

**lib/types/error.types.ts:**

```typescript
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}
```

**constants/app.constants.ts:**

```typescript
// MediaPipe CDN URLs
export const MEDIAPIPE_CDN_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision";
export const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

// Performance thresholds
export const POSE_THRESHOLD = 0.9;
export const MAX_RETRY_COUNT = 3;
export const TARGET_FPS = 30;
export const LITE_MODE_FPS = 15;

// Feedback settings
export const FEEDBACK_LATENCY_TARGET_MS = 100;
```

**lib/utils/logger.ts:**

```typescript
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

---

## Architecture Compliance

### 🏗️ Project Structure Rules (STRICT)

| Directory               | Purpose                        |
| ----------------------- | ------------------------------ |
| `app/`                  | Next.js App Router ONLY        |
| `components/[feature]/` | Reusable components by feature |
| `lib/hooks/`            | Shared hooks                   |
| `lib/stores/`           | Jotai atoms                    |
| `lib/types/`            | TypeScript types               |
| `lib/utils/`            | Utility functions              |
| `lib/ai/`               | AI/Worker code                 |
| `data/poses/`           | Static pose data               |
| `constants/`            | App constants                  |

### ✅ Naming Convention Requirements

| Type       | Convention           | Example              |
| ---------- | -------------------- | -------------------- |
| Files      | kebab-case.tsx       | `camera-preview.tsx` |
| Components | PascalCase           | `CameraPreview`      |
| Hooks      | use[Feature]         | `useCamera`          |
| Atoms      | [feature][Field]Atom | `poseScoreAtom`      |
| Constants  | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`    |
| Types      | PascalCase           | `AsyncStatus`        |

### ❌ Anti-Patterns to AVOID

- ❌ PascalCase for file names (use kebab-case)
- ❌ I-prefix for interfaces (no Hungarian notation)
- ❌ Component suffix (`CameraPreviewComponent`)
- ❌ Hook suffix (`useCameraHook`)
- ❌ Separate `__tests__` folders (co-locate tests)
- ❌ snake_case in JavaScript/TypeScript

---

## Technical Requirements

### Technology Stack

Use the dependency versions declared in `package.json`. This project uses Next.js App Router, React, TypeScript, Tailwind CSS, Shadcn/UI, Jotai, MediaPipe tasks-vision, and idb.

### ⚠️ Browser Requirements (Tailwind CSS)

| Browser | Minimum Version |
| ------- | --------------- |
| Safari  | 16.4+           |
| Chrome  | 111+            |
| Firefox | 128+            |

### Performance Requirements

| Metric            | Target       |
| ----------------- | ------------ |
| Build time        | < 60 seconds |
| Dev server start  | < 5 seconds  |
| Initial page load | < 3 seconds  |

---

## Library & Framework Requirements

### Required Shadcn Components ONLY

```bash
npx shadcn@latest add button sheet dialog
```

**DO NOT** install any other Shadcn components unless explicitly required by future stories.

### Package Dependencies

Use `package.json` as the source of truth for dependency versions. The application uses `jotai`, `@mediapipe/tasks-vision`, `idb`, `next`, `react`, `react-dom`, and `tailwindcss`.

---

## File Structure Requirements

### Directories to Create (Empty)

```
src/components/camera/
src/components/controls/
src/components/screens/
src/lib/ai/
src/lib/hooks/
src/lib/stores/
src/data/poses/
public/sounds/
```

Add `.gitkeep` files to preserve empty directories in version control.

### Files to Create

| File                             | Purpose              |
| -------------------------------- | -------------------- |
| `src/lib/types/status.types.ts`  | AsyncStatus enum     |
| `src/lib/types/error.types.ts`   | AppError interface   |
| `src/lib/utils/logger.ts`        | Logging utility      |
| `src/constants/app.constants.ts` | CDN URLs, thresholds |

---

## Testing Requirements

For this initialization story, manual verification is sufficient:

1. ✅ `npm run build` completes without errors
2. ✅ `npm run dev` starts Turbopack server
3. ✅ Browser shows page at localhost:3000
4. ✅ Page has dark background (#0a0a0a)
5. ✅ Inter font is loaded

---

## Project Context Reference

See `_bmad-output/project-context.md` for complete implementation rules including:

- iOS Safari quirks (camera requires user gesture)
- Audio preloading requirements
- Limited haptic API on iOS
- All naming conventions

---

## References

- [Source: _bmad-output/planning-artifacts/architecture.md#Initialization Commands]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation]
- [Source: _bmad-output/project-context.md#Technology Stack]

---

## Dev Agent Record

### Agent Model Used

Gemini 2.9 Flash (Antigravity)

### Debug Log References

N/A - Clean execution with no errors

### Completion Notes List

- **Task 1:** Created Next.js project using `npx create-next-app@latest` in temp directory, then moved files to root (workaround for existing dotfiles). Verified TypeScript, Tailwind CSS, ESLint, App Router, and src directory.
- **Task 2:** Configured `next.config.ts` with standalone output, CSP headers, and unoptimized images for PWA.
- **Task 3:** Initialized Shadcn/UI with `npx shadcn@latest init --yes --defaults --src-dir --base-color zinc`. Uses Tailwind CSS v4 CSS-first config.
- **Task 4:** Installed Button, Sheet, and Dialog components via `npx shadcn@latest add button sheet dialog --yes`.
- **Task 5:** Added Jotai, MediaPipe tasks-vision, and idb dependencies.
- **Task 6:** Configured globals.css with custom design tokens (feedback colors using oklch), Inter font, and forced dark mode via `<html class="dark">`.
- **Task 7:** Created full project structure per architecture.md with .gitkeep files, type definitions (AsyncStatus, AppError), logger utility, and app.constants.ts.
- **Task 8:** Build successful with Turbopack. Dev server runs at localhost:3000. Page renders with dark background (#0a0a0a), Inter font, and welcome message.
- **Task 9 (Review Follow-ups):** Fixed 4 code review findings:
  - Created PWA icons (icon-192.png, icon-512.png) using generated AI photography theme image
  - Consolidated utils by moving cn.ts to src/lib/utils/ and creating barrel file (index.ts)
  - Fixed components.json hooks alias: @/hooks → @/lib/hooks
  - Synchronized POSE_THRESHOLD to 0.9 in project-context.md (matched implementation)

### Change Log

- ** Story 1.1 implemented - Next.js project initialized with complete design system foundation.
- ** Addressed code review findings - 4 items resolved (3 Medium, 1 Low).
- ** Final cleanup - Updated project-context.md versions and removed unused default Next.js SVGs. Story Complete.

### File List

**Created Files:**

- `package.json` - Project manifest with all dependencies
- `next.config.ts` - Next.js config with CSP, standalone, PWA settings
- `tsconfig.json` - TypeScript config with strict mode
- `components.json` - Shadcn/UI configuration
- `postcss.config.mjs` - PostCSS config for Tailwind
- `eslint.config.mjs` - ESLint configuration
- `src/app/globals.css` - Tailwind CSS with design tokens
- `src/app/layout.tsx` - Root layout with Inter font and dark mode
- `src/app/page.tsx` - Welcome page with status indicators
- `src/app/manifest.ts` - PWA manifest
- `src/app/loading.tsx` - Loading skeleton
- `src/lib/utils/cn.ts` - className utility (merged from utils.ts)
- `src/lib/utils/index.ts` - Barrel file for utils exports
- `src/lib/types/status.types.ts` - AsyncStatus type
- `src/lib/types/error.types.ts` - AppError interface
- `src/lib/utils/logger.ts` - Logger utility
- `src/constants/app.constants.ts` - CDN URLs and thresholds
- `src/components/ui/button.tsx` - Shadcn Button
- `src/components/ui/sheet.tsx` - Shadcn Sheet
- `src/components/ui/dialog.tsx` - Shadcn Dialog
- `src/components/camera/.gitkeep`
- `src/components/controls/.gitkeep`
- `src/components/screens/.gitkeep`
- `src/lib/ai/.gitkeep`
- `src/lib/hooks/.gitkeep`
- `src/lib/stores/.gitkeep`
- `src/data/poses/.gitkeep`
- `public/sounds/.gitkeep`
- `public/icon-192.png` - PWA icon 192x192
- `public/icon-512.png` - PWA icon 512x512

**Modified Files:**

- `_bmad-output/project-context.md` - Synchronized POSE_THRESHOLD to 0.9

**Deleted Files:**

- `README.md.bak` (temporary file removed)
- `src/lib/utils.ts` (consolidated into src/lib/utils/cn.ts)
