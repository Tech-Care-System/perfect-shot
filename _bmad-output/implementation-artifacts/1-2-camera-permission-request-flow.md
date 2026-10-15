# Story 1.2: Camera Permission Request Flow

Status: done

---

## Story

As a **user**,
I want **to grant camera permission through a friendly explanation screen**,
So that **I understand why the app needs camera access before granting permission**.

---

## Acceptance Criteria

### AC1: Welcome Screen Display

**Given** I am a first-time user opening the app
**When** the app loads
**Then** I see a welcome screen explaining that camera access is needed
**And** the explanation describes the value ("Real-time pose guidance")
**And** I see a "Grant Camera Access" button

### AC2: User Gesture Requirement (iOS Critical)

**Given** I am viewing the welcome screen
**When** I tap the "Grant Camera Access" button
**Then** the browser's camera permission prompt appears
**And** the request happens on user gesture (NOT automatically on page load)

### AC3: Permission Denied Handling

**Given** I denied camera permission previously
**When** I tap "Grant Camera Access" again
**Then** I see instructions on how to re-enable camera access in browser settings
**And** the instructions are browser-specific (Safari vs Chrome)
**And** the app shows a "Check Again" button to re-detect permission

### AC4: Permission State Detection

**Given** I return from browser settings after enabling camera
**When** I tap "Check Again" or the page regains focus
**Then** the app detects if permission is now granted
**And** transitions to camera preview if granted

---

## Tasks / Subtasks

- [x] **Task 1: Create Permission Screen Component** (AC: #1)
  - [x] Create `src/components/screens/permission-screen.tsx`
  - [x] Design welcome UI with app branding and camera icon
  - [x] Add value proposition text ("Real-time AI pose guidance")
  - [x] Style using Tailwind CSS tokens and dark mode
  - [x] Ensure 44x44px minimum touch target for button (UX8)

- [x] **Task 2: Implement useCamera Hook Foundation** (AC: #2, #4)
  - [x] Create `src/lib/hooks/use-camera.ts`
  - [x] Define `CameraPermissionStatus` type: 'prompt' | 'granted' | 'denied'
  - [x] Implement `requestCameraPermission()` function
  - [x] Implement `checkPermissionState()` using Permissions API
  - [x] Handle iOS Safari quirk: must use user gesture

- [x] **Task 3: Create Camera Store** (AC: #4)
  - [x] Create `src/lib/stores/camera-store.ts`
  - [x] Define `cameraPermissionAtom` using Jotai
  - [x] Define `cameraStatusAtom` with AsyncStatus type
  - [x] Export all atoms via barrel file

- [x] **Task 4: Create Camera Types** (AC: #1, #2, #3, #4)
  - [x] Create `src/lib/types/camera.types.ts`
  - [x] Define `CameraPermissionStatus` type
  - [x] Define `CameraFacingMode` type ('user' | 'environment')
  - [x] Define `CameraConfig` interface

- [x] **Task 5: Implement Permission Denied UI** (AC: #3)
  - [x] Create denied state view with helpful instructions
  - [x] Add browser-specific instructions (detect Safari vs Chrome)
  - [x] Add "Check Again" button to re-query permission
  - [x] Use friendly tone per UX guidelines ("No worries! Here's how...")

- [x] **Task 6: Integrate Permission Flow in Main Page** (AC: #1, #2, #3, #4)
  - [x] Update `src/app/page.tsx` to conditionally render screens
  - [x] Show PermissionScreen when permission not granted
  - [x] Show CameraScreen when permission granted (placeholder for Story 1.3)
  - [x] Handle page visibility change for permission re-check

- [x] **Task 7: Add Visual Polish** (AC: #1)
  - [x] Add camera icon or illustration
  - [x] Implement smooth fade-in animation
  - [x] Respect `prefers-reduced-motion` media query
  - [x] Ensure dark mode colors per design tokens

- [x] **Task 8: Testing & Verification** (AC: #1, #2, #3, #4)
  - [x] Test on iOS Safari 15.4+ (user gesture requirement)
  - [x] Test on Chrome Android
  - [x] Test permission denied → re-enable flow
  - [x] Verify no console errors
  - [x] Test page visibility change detection

### Review Follow-ups (AI)

- [x] [AI-Review][CRITICAL] Create barrel export for camera atoms in `src/lib/stores/index.ts` (Task 3 marked complete but missing). [src/lib/stores/index.ts:1]
- [x] [AI-Review][HIGH] Implement permission re-check that can detect newly granted access when Permissions API is unavailable (e.g., Safari) so "Check Again" / visibility change work (AC4). [src/lib/hooks/use-camera.ts:34]
- [x] [AI-Review][MEDIUM] Fix browser detection to recognize iOS Chrome ("CriOS") so Safari vs Chrome instructions are accurate. [src/components/screens/permission-screen.tsx:13]
- [x] [AI-Review][MEDIUM] Avoid duplicate `useCamera()` mounts (listener/check duplication) by centralizing hook usage or passing state/handlers. [src/app/page.tsx:39]
- [x] [AI-Review][MEDIUM] Update Dev Agent Record to list all actual changed files (git status) and align "comprehensive tests" claim with actual coverage. [_bmad-output/implementation-artifacts/1-2-camera-permission-request-flow.md:391]
- [x] [AI-Review][HIGH] Ensure AC4 re-check actually detects newly granted permission in Safari-like environments (enumerateDevices alone may not update without a getUserMedia probe). [src/lib/hooks/use-camera.ts:29]
- [x] [AI-Review][MEDIUM] Prevent duplicate `useCamera()` mounts by only invoking the hook when props are not provided. [src/components/screens/permission-screen.tsx:90]
- [x] [AI-Review][MEDIUM] Add tests for permission re-check fallback (enumerateDevices path) and visibility-change behavior. [src/components/screens/permission-screen.test.tsx:1]
- [x] [AI-Review][MEDIUM] Update Dev Agent Record/File List to include remaining changed files (README.md, _bmad-output/project-context.md, .gitignore, components.json, next.config.ts, public/**, tsconfig.json, etc.). [_bmad-output/implementation-artifacts/1-2-camera-permission-request-flow.md:430]
- [x] [AI-Review][HIGH] Remove getUserMedia probe from non-gesture permission checks (mount/visibilitychange) to comply with iOS user-gesture requirement. [src/lib/hooks/use-camera.ts:29]
- [x] [AI-Review][HIGH] Make AC4 focus-based re-check reliable without violating gesture rules (e.g., show explicit "Check Again" user action path and avoid automatic prompts). [src/lib/hooks/use-camera.ts:67]
- [x] [AI-Review][MEDIUM] Add real tests for Safari fallback/visibility-change logic (not placeholder expect(true)). [src/components/screens/permission-screen.test.tsx:1]
- [x] [AI-Review][MEDIUM] Expand File List to enumerate actual changed files (avoid directory-level placeholders like `public/` or `src/`). [_bmad-output/implementation-artifacts/1-2-camera-permission-request-flow.md:430]
- [x] [AI-Review][CRITICAL] Replace placeholder test (expect(true)) with real assertions for Safari fallback and visibility-change behavior. [src/components/screens/permission-screen.test.tsx:1]
- [x] [AI-Review][HIGH] Make AC4 focus-based re-check reliable when returning from Settings (silent check currently preserves denied on Safari). [src/lib/hooks/use-camera.ts:88]
- [x] [AI-Review][MEDIUM] Align Dev Agent Record test count/coverage with actual tests (currently overstated). [_bmad-output/implementation-artifacts/1-2-camera-permission-request-flow.md:390]
- [x] [AI-Review][MEDIUM] Add `src/app/favicon.ico` to File List explicitly. [_bmad-output/implementation-artifacts/1-2-camera-permission-request-flow.md:430]
- [x] [AI-Review][HIGH] Make AC4 focus-based re-check reliably transition from denied when Safari returns prompt (consider not preserving denied on focus change or adding explicit user-facing re-check guidance). [src/lib/hooks/use-camera.ts:85]
- [x] [AI-Review][MEDIUM] Remove placeholder `expect(true)` documentation test and add real assertions for fallback behavior. [src/components/screens/permission-screen.test.tsx:1]
- [x] [AI-Review][MEDIUM] Add `_bmad-output/implementation-artifacts/1-1-initialize-nextjs-project-with-design-system.md` to File List or explain it in Change Log. [_bmad-output/implementation-artifacts/1-2-camera-permission-request-flow.md:430]

---

## Dev Notes

### 🚨 CRITICAL: iOS Safari Camera Permission

**MUST use user gesture to request camera access!**

```typescript
// ✅ CORRECT: Camera request in click handler
<button onClick={async () => {
  await navigator.mediaDevices.getUserMedia({ video: true });
}}>
  Grant Camera Access
</button>

// ❌ WRONG: Auto-start on mount (WILL FAIL ON iOS)
useEffect(() => {
  navigator.mediaDevices.getUserMedia({ video: true }); // FAILS
}, []);
```

### Permission API Detection

```typescript
// Check permission state without triggering prompt
async function checkPermissionState(): Promise<CameraPermissionStatus> {
  try {
    const result = await navigator.permissions.query({
      name: "camera" as PermissionName,
    });
    return result.state as CameraPermissionStatus;
  } catch {
    // Fallback for browsers that don't support permissions.query for camera
    return "prompt";
  }
}
```

### Browser Detection for Instructions

```typescript
const isIOSSafari =
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !("MSStream" in window) &&
  /WebKit/.test(navigator.userAgent);

const isChrome =
  /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
```

### Page Visibility for Re-check

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      checkPermissionState();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () =>
    document.removeEventListener("visibilitychange", handleVisibilityChange);
}, []);
```

---

## Architecture Compliance

### 🏗️ File Locations (STRICT)

| File              | Location                                       |
| ----------------- | ---------------------------------------------- |
| Permission Screen | `src/components/screens/permission-screen.tsx` |
| Camera Hook       | `src/lib/hooks/use-camera.ts`                  |
| Camera Store      | `src/lib/stores/camera-store.ts`               |
| Camera Types      | `src/lib/types/camera.types.ts`                |

### ✅ Naming Convention Requirements

| Type       | Convention           | Example                  |
| ---------- | -------------------- | ------------------------ |
| Files      | kebab-case.tsx       | `permission-screen.tsx`  |
| Components | PascalCase           | `PermissionScreen`       |
| Hooks      | use[Feature]         | `useCamera`              |
| Atoms      | [feature][Field]Atom | `cameraPermissionAtom`   |
| Types      | PascalCase           | `CameraPermissionStatus` |

### ❌ Anti-Patterns to AVOID

- ❌ Auto-requesting camera on page load (iOS breaks)
- ❌ Using bare booleans for permission state (use type union)
- ❌ PascalCase file names
- ❌ I-prefix for interfaces (`ICameraConfig`)
- ❌ Raw console.log (use logger utility)

---

## Technical Requirements

### Required Jotai Patterns

```typescript
// src/lib/stores/camera-store.ts
import { atom } from "jotai";
import type { AsyncStatus } from "@/lib/types/status.types";
import type {
  CameraPermissionStatus,
  CameraFacingMode,
} from "@/lib/types/camera.types";

export const cameraPermissionAtom = atom<CameraPermissionStatus>("prompt");
export const cameraStatusAtom = atom<AsyncStatus>("idle");
export const cameraFacingModeAtom = atom<CameraFacingMode>("environment"); // Back camera default
```

### Required Type Definitions

```typescript
// src/lib/types/camera.types.ts
export type CameraPermissionStatus = "prompt" | "granted" | "denied";

export type CameraFacingMode = "user" | "environment";

export interface CameraConfig {
  facingMode: CameraFacingMode;
  width: number;
  height: number;
}

export interface CameraError {
  code: "PERMISSION_DENIED" | "NOT_FOUND" | "NOT_READABLE" | "UNKNOWN";
  message: string;
}
```

### useCamera Hook Interface

```typescript
// src/lib/hooks/use-camera.ts
export function useCamera() {
  return {
    permissionStatus: CameraPermissionStatus,
    requestPermission: () => Promise<boolean>,
    checkPermission: () => Promise<CameraPermissionStatus>,
    error: CameraError | null,
  };
}
```

---

## Library & Framework Requirements

### No Additional Dependencies Needed

Story 1.1 already installed:

- ✅ Jotai (state management)
- ✅ Shadcn/UI Button (for CTA button)

### Browser APIs Used

| API                                     | Purpose                | Fallback                 |
| --------------------------------------- | ---------------------- | ------------------------ |
| `navigator.mediaDevices.getUserMedia()` | Request camera         | Error: PERMISSION_DENIED |
| `navigator.permissions.query()`         | Check permission state | Assume 'prompt'          |
| `document.visibilityState`              | Re-check on page focus | N/A                      |

---

## UI/UX Specifications

### Permission Screen Layout

```
┌─────────────────────────────────────┐
│                                     │
│           📷 [Camera Icon]          │
│                                     │
│         ai-perfect-shot             │
│                                     │
│    Real-time AI pose guidance       │
│    helps you take better photos     │
│                                     │
│   We need camera access to show     │
│   you live pose feedback            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Grant Camera Access       │    │ 44px+ height
│  └─────────────────────────────┘    │
│                                     │
│   Your photos never leave           │
│   your device 🔒                    │
│                                     │
└─────────────────────────────────────┘
```

### Permission Denied Layout

```
┌─────────────────────────────────────┐
│                                     │
│        ⚠️ Camera Access Needed      │
│                                     │
│   No worries! Here's how to         │
│   enable camera access:             │
│                                     │
│   [Safari/Chrome specific steps]    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      Check Again            │    │
│  └─────────────────────────────┘    │
│                                     │
│   Still having trouble?             │
│   Refresh the page and try again    │
│                                     │
└─────────────────────────────────────┘
```

### Color Tokens from Design System

```css
/* From globals.css */
--color-background: oklch(10% 0 0); /* #0a0a0a */
--color-foreground: oklch(100% 0 0); /* #ffffff */
--color-surface: oklch(15% 0 0); /* #1a1a1a */
--color-text-secondary: oklch(65% 0.02 260);
```

### Animation (respect prefers-reduced-motion)

```css
@media (prefers-reduced-motion: no-preference) {
  .permission-screen {
    animation: fadeIn 300ms ease-out;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Previous Story Intelligence (1.1)

### Patterns Established That MUST Continue:

1. **Logger utility** - Use `import { logger } from '@/lib/utils/logger'`
2. **AsyncStatus type** - Use from `@/lib/types/status.types`
3. **AppError interface** - Use from `@/lib/types/error.types`
4. **Dark mode** - Already enforced via `<html class="dark">`
5. **Inter font** - Already loaded in layout.tsx
6. **Tailwind CSS** - Use `@theme` tokens, not config file

### Files Created in Story 1.1:

- ✅ `src/lib/types/status.types.ts` - AsyncStatus type
- ✅ `src/lib/types/error.types.ts` - AppError interface
- ✅ `src/lib/utils/logger.ts` - Logger utility
- ✅ `src/constants/app.constants.ts` - CDN URLs, thresholds
- ✅ `src/app/globals.css` - Tailwind + design tokens
- ✅ `src/app/layout.tsx` - Root layout with Inter font
- ✅ `src/components/ui/button.tsx` - Shadcn Button

---

## Project Context Reference

See `_bmad-output/project-context.md` for:

- iOS Safari quirks (camera requires user gesture)
- All naming conventions
- Import alias patterns (`@/components/...`)

---

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Camera Integration]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation]
- [Source: _bmad-output/project-context.md#iOS Safari Quirks]
- [Source: _bmad-output/implementation-artifacts/1-1-initialize-nextjs-project-with-design-system.md]

---

## Dev Agent Record

### Agent Model Used

Claude 4.5 Sonnet (Thinking)

### Debug Log References

N/A - Implementation completed without critical debugging needed

### Completion Notes List

- ✅ Implemented complete camera permission request flow with welcome and denied screens
- ✅ Created useCamera hook with iOS Safari user gesture handling, gesture-safe silent/probe split, and simplified state management for reliable AC4 re-detection
- ✅ Implemented Jotai store for camera state management with architectural barrel exports
- ✅ Added type definitions for all camera-related interfaces
- ✅ Integrated permission flow in main page with props-based API to prevent duplicate hook mounting
- ✅ Added fade-in animations with prefers-reduced-motion support
- ✅ Implemented browser-specific instructions for re-enabling camera (Safari, Chrome, iOS Chrome)
- ✅ Created focused unit test suite (11 tests passing) covering UI components, user interactions, permission state transitions, visibility change behavior, and silent vs probe mode verification
- ✅ Visual verification completed - both welcome and denied screens working
- ✅ Page visibility change detection for permission re-check with automatic state updates

### Change Log

- Initial implementation and five review cycles
  - Created camera types, stores (with barrel exports), and hooks
  - Implemented PermissionScreen with Welcome and Denied views
  - Added browser-specific instructions (Safari, Chrome, iOS Chrome detection)
  - Set up Jest + React Testing Library
  - **Review Cycle 1:** Added barrel exports, improved Safari re-check, fixed browser detection, optimized hook usage
  - **Review Cycle 2:** Enhanced Safari fallback with getUserMedia probe for AC4 compliance, refactored component to prevent duplicate hook calls, added comprehensive tests for fallback paths
  - **Review Cycle 3:** Split permission checks into silent (gesture-safe) vs probe modes, updated Check Again to use non-silent probe from user gesture, added tests for visibility change and silent/probe behavior, completed granular file documentation
  - **Review Cycle 4:** Replaced placeholder Safari test with real assertions about gesture requirement, fixed AC4 state transition to allow upgrade from denied to granted when user returns from Settings, aligned test count documentation (12 tests), added favicon to file list
  - **Review Cycle 5:** Simplified AC4 state management for reliable auto-detection when user returns from Settings (removed preserve-denied logic), removed documentation placeholder test (11 focused tests), added Story 1.1 file reference

### File List

**Created (Story 1.2 - Camera Permission Flow):**

- `src/lib/types/camera.types.ts` - Camera type definitions (CameraPermissionStatus, CameraFacingMode, CameraConfig, CameraError)
- `src/lib/stores/camera-store.ts` - Jotai atoms for camera state (permission, status, facing mode, error)
- `src/lib/stores/index.ts` - Barrel export for camera stores
- `src/lib/hooks/use-camera.ts` - Camera permission hook with silent/probe split and Safari fallback
- `src/components/screens/permission-screen.tsx` - Permission screen component (WelcomeView, DeniedView, PermissionScreenCore)
- `src/components/screens/permission-screen.test.tsx` - Test suite with 11 passing tests
- `src/app/test-permission/page.tsx` - Interactive test page for manual verification
- `src/app/test-visual/page.tsx` - Visual comparison page (static side-by-side)
- `jest.config.ts` - Jest configuration for Next.js with module mapping
- `jest.setup.ts` - Jest setup with testing-library matchers

**Modified (Story 1.2):**

- `src/app/page.tsx` - Root page with centralized useCamera hook and conditional rendering
- `src/app/globals.css` - Added fadeIn animation keyframes
- `src/components/ui/button.tsx` - Added cursor-pointer class for better UX
- `package.json` - Added Jest dependencies (@testing-library/react, jest, jest-environment-jsdom, @types/jest) and test scripts
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Story status tracking (in-progress → review cycles → done)
- `_bmad-output/implementation-artifacts/1-2-camera-permission-request-flow.md` - This story documentation
- `_bmad-output/implementation-artifacts/1-1-initialize-nextjs-project-with-design-system.md` - Story 1.1 documentation (created in that story)

**Created (From Story 1.1 - Project Infrastructure):**

- `.gitignore` - Git ignore rules for Node, Next.js, IDE files
- `components.json` - Shadcn UI configuration
- `eslint.config.mjs` - ESLint configuration for Next.js + TypeScript
- `next.config.ts` - Next.js configuration with Turbopack, CSP, standalone output
- `package.json` - Project dependencies and scripts
- `package-lock.json` - Dependency lock file
- `postcss.config.mjs` - PostCSS configuration for Tailwind CSS
- `tsconfig.json` - TypeScript configuration with Next.js paths
- `public/icon-192.png` - PWA icon 192x192
- `public/icon-512.png` - PWA icon 512x512
- `public/sounds/.gitkeep` - Placeholder for future sound assets
- `src/app/favicon.ico` - Application favicon
- `src/app/globals.css` - Tailwind CSS imports and design tokens
- `src/app/layout.tsx` - Root layout with Inter font and metadata
- `src/app/loading.tsx` - Loading UI component
- `src/app/manifest.ts` - PWA manifest configuration
- `src/components/ui/button.tsx` - Shadcn Button component
- `src/components/ui/dialog.tsx` - Shadcn Dialog component
- `src/components/ui/sheet.tsx` - Shadcn Sheet component
- `src/constants/app.constants.ts` - App-wide constants (CDN URLs, thresholds)
- `src/lib/types/error.types.ts` - AppError interface
- `src/lib/types/status.types.ts` - AsyncStatus type definition
- `src/lib/utils/cn.ts` - Tailwind class name utility
- `src/lib/utils/index.ts` - Barrel export for utilities
- `src/lib/utils/logger.ts` - Logger utility for structured logging

**Modified (From Story 1.1):**

- `README.md` - Project documentation
- `_bmad-output/project-context.md` - Project guidelines and conventions
