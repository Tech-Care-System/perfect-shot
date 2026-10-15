# Story 3.4: Pose Hint Card Component

Status: done

## Story

As a user,
I want to see the pose name and a helpful action hint,
so that I understand what pose to do and how to achieve it.

## Acceptance Criteria

1. **AC1: Card Display** — Given a pose is selected (`poseHintAtom` is not null), when the camera screen is active, then a floating card appears showing the pose name (e.g., "Confident Sit") and an action hint (e.g., "Lean back, arm on armrest").

2. **AC2: Card Styling** — The card uses semi-transparent dark background (`#1a1a1a` at 80% opacity), `rounded-2xl` corners. Pose name: Inter 600 weight, 20px, white. Action hint: Inter 400 weight, 14px, secondary color (`text-neutral-400`).

3. **AC3: Card Positioning** — The card is positioned at the bottom center of the screen, above the glow layer but below the control bar. Z-index: 50.

4. **AC4: Inactive State** — Given no pose hint is loaded (`poseHintAtom` is null), the PoseHintCard renders nothing.

5. **AC5: Accessibility** — The card has `aria-live="polite"` so screen readers announce pose changes without interrupting.

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #4)
  - [x] 1.1 Add `PoseHint` type to `src/lib/types/pose.types.ts`: `{ name: string; hint: string }`
  - [x] 1.2 Add `poseHintAtom` to `src/lib/stores/pose-store.ts`: `atom<PoseHint | null>(null)`
- [x] Task 2 (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Create `src/components/controls/pose-hint-card.tsx`
  - [x] 2.2 Subscribe to `poseHintAtom` via `useAtomValue` — return `null` when atom is `null`
  - [x] 2.3 Render card div with `pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 z-50`
  - [x] 2.4 Apply background `bg-[#1a1a1a]/80 backdrop-blur-sm rounded-2xl px-5 py-3`
  - [x] 2.5 Render pose name as `<p>` with `text-xl font-semibold text-white`
  - [x] 2.6 Render action hint as `<p>` with `text-sm text-neutral-400`
  - [x] 2.7 Add `aria-live="polite"` and `role="status"` to the card wrapper
- [x] Task 3 (AC: #3)
  - [x] 3.1 Add `<PoseHintCard />` to `src/components/screens/camera-screen.tsx` inside the camera container div, after `<FeedbackGlow />`
- [x] Task 4 (AC: ALL)
  - [x] 4.1 Create `src/components/controls/pose-hint-card.test.tsx`
  - [x] 4.2 Test: renders nothing when `poseHintAtom` is null
  - [x] 4.3 Test: renders pose name and action hint when `poseHintAtom` has data
  - [x] 4.4 Test: card has correct z-index (z-50) and pointer-events-none
  - [x] 4.5 Test: card has aria-live="polite" and role="status"

## Dev Notes

### Component Design

PoseHintCard is a pure Jotai consumer, same pattern as `FeedbackGlow`. It reads from `poseHintAtom` and renders a styled card overlay. No interaction, no animation, no canvas — pure DOM with Tailwind.

```
src/components/controls/pose-hint-card.tsx
```

Architecture doc places this in `controls/` (alongside `control-bar.tsx`), not `camera/`.

### Type & Store Changes

**`src/lib/types/pose.types.ts`** — ADD `PoseHint`:

```typescript
export interface PoseHint {
  name: string;
  hint: string;
}
```

**`src/lib/stores/pose-store.ts`** — ADD `poseHintAtom`:

```typescript
export const poseHintAtom = atom<PoseHint | null>(null);
```

This atom is set by Epic 4 (pose library) when a pose is selected. For this story, the component just reads it. It stays `null` until Epic 4 populates it.

### Mount Location

Add `<PoseHintCard />` inside the camera container in `camera-screen.tsx`, after `<FeedbackGlow />`:

```tsx
<div className="relative h-full w-full">
  <CameraPreview />
  <WireframeCanvas />
  <FeedbackGlow />
  <PoseHintCard />
</div>
```

### Z-Index Stack Reference

| Layer         | Z-Index  | Component           |
| ------------- | -------- | ------------------- |
| Video         | z-0      | `CameraPreview`     |
| Wireframe     | z-10     | `WireframeCanvas`   |
| Glow          | z-20     | `FeedbackGlow`      |
| Start overlay | z-30     | Start Camera button |
| **Hint Card** | **z-50** | **`PoseHintCard`**  |
| Controls      | z-100    | `ControlBar`        |

### Positioning

`bottom-24` keeps the card above the `ControlBar` gradient area (which uses `pb-12 pt-6` ≈ 100px). The card is horizontally centered via `left-1/2 -translate-x-1/2`. `pointer-events-none` prevents blocking touch targets.

### Existing Patterns to Follow

- **Guard pattern**: Return `null` when data atom is null — same as `FeedbackGlow` line 75.
- **Jotai import**: `useAtomValue` from `jotai` — same as `FeedbackGlow` line 11.
- **Client directive**: `'use client'` at top of file — same as all components.
- **cn utility**: `import { cn } from '@/lib/utils'` — available but not needed unless conditional classes added.
- **Test pattern**: Use `@testing-library/react` with Jotai `Provider` and `useHydrateAtoms` pattern matching `feedback-glow.test.tsx`.

### DO NOT

- Do NOT create a `PosePreset` type — that belongs to Epic 4.
- Do NOT add `targetPoseAtom` dependency — PoseHintCard reads only from `poseHintAtom`, not from landmark data.
- Do NOT add animations or transitions — the epics spec does not require them for this card.
- Do NOT add logic to derive hint text from pose data — that belongs to Story 3.5.

### Previous Story Learnings

- **Story 3.2**: `useSyncExternalStore` used for `prefers-reduced-motion` — not needed here (no animation).
- **Story 3.2**: Code review found stale timeout bug — not applicable here (no timers).
- **Story 3.3**: Modifying existing component (WireframeCanvas) — not applicable here (new component).
- **Story 3.2**: 10 tests in feedback-glow.test.tsx use Jotai provider wrapper — follow same pattern.

### References

- [Source: _bmad-output/planning-artifacts/ux-design/component-strategy.md] PoseHintCard specs, z-index, typography
- [Source: _bmad-output/planning-artifacts/ux-design/visual-design-foundation.md] Z-index layering map
- [Source: _bmad-output/planning-artifacts/ux-design/core-user-experience.md] Casual/fun tone for hints
- [Source: _bmad-output/planning-artifacts/epics/epic-3-pose-matching-visual-feedback.md] Story 3.4 ACs
- [Source: _bmad-output/planning-artifacts/archive/architecture.md] File location: `src/components/controls/pose-hint-card.tsx`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (via Ami)

### Debug Log References

None — clean implementation, no issues encountered.

### Completion Notes List

- Added `PoseHint` interface to `pose.types.ts` with `name` and `hint` string fields
- Added `poseHintAtom` to `pose-store.ts` as `atom<PoseHint | null>(null)`
- Created `PoseHintCard` component following the FeedbackGlow guard pattern (returns null when atom is null)
- Mounted `PoseHintCard` in `camera-screen.tsx` after `FeedbackGlow` per z-index stack
- 4 unit tests covering: null state, data rendering, z-index/pointer-events, aria attributes
- Full regression suite: 14 suites, 104 tests, all pass

### Senior Developer Review (AI)

**Reviewer:** Code Review Workflow (Claude Opus 4.6)
**Outcome:** Approved with fixes applied

**Issues Found:** 0 High, 3 Medium, 2 Low
**Issues Fixed:** 3 (all MEDIUM)

| #   | Severity | Issue                                                                                   | Fix Applied                                                                                                |
| --- | -------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| M1  | MEDIUM   | `poseHintAtom` lacks JSDoc comment — breaks pattern of all other atoms in pose-store.ts | Added JSDoc describing purpose and lifecycle                                                               |
| M2  | MEDIUM   | Tests don't verify AC2 styling classes (typography)                                     | Added class assertions for name (`text-xl font-semibold text-white`) and hint (`text-sm text-neutral-400`) |
| M3  | MEDIUM   | Tests don't verify AC3 positioning classes                                              | Added assertions for `bottom-24`, `left-1/2`, `-translate-x-1/2`                                           |
| L1  | LOW      | Test helper uses inline type instead of importing `PoseHint`                            | Fixed — now imports `PoseHint` from pose.types.ts                                                          |
| L2  | LOW      | Debug Log References empty                                                              | Not fixed — documentation only                                                                             |

### Change Log

- Implemented Story 3.4 — PoseHint type, poseHintAtom, PoseHintCard component with tests
- Code review: added JSDoc to poseHintAtom, improved test assertions for styling/positioning, used PoseHint type in tests; status set to `done`.

### File List

- src/lib/types/pose.types.ts (modified)
- src/lib/stores/pose-store.ts (modified)
- src/components/controls/pose-hint-card.tsx (new)
- src/components/controls/pose-hint-card.test.tsx (new)
- src/components/screens/camera-screen.tsx (modified)
