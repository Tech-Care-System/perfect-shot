# Story 6.5: Photo Preview Screen

Status: review

## Story

As a user,
I want to see my captured photo before saving,
so that I can decide to keep it or retake.

## Acceptance Criteria

1. **AC1: Full-Screen Preview** — When `capturedPhotoAtom` becomes non-null, `PreviewScreen` renders as a full-screen overlay (`absolute inset-0 z-50 bg-black`). The captured photo is displayed full-screen. Already implemented in Story 6.1 — verify it is still correct, do NOT recreate.

2. **AC2: Save and Retake Buttons** — The preview includes a "Retake" button (clears `capturedPhotoAtom` → returns to camera) and a "Save" button. Save remains `disabled` with `opacity-50` until Story 6.6 wires save logic. Both buttons are in a bottom action bar with dark background. Already scaffolded in Story 6.1.

3. **AC3: Focus Trap** — When `PreviewScreen` mounts, keyboard focus is trapped within the dialog. Tab/Shift+Tab cycles only between the Retake and Save buttons. Focus does not escape to the camera controls behind the preview. Implemented via `onKeyDown` handler on the dialog container.

4. **AC4: Auto-Focus on Mount** — When `PreviewScreen` mounts, focus automatically moves to the dialog container (via `ref` + `useEffect` calling `ref.current.focus()`). This ensures screen readers announce the dialog and keyboard users start inside it. The container must have `tabIndex={-1}` to be programmatically focusable.

5. **AC5: Aria Modal** — The dialog container has `aria-modal="true"` in addition to the existing `role="dialog"` and `aria-label="Photo Preview"`. This tells assistive technology to treat underlying content as inert.

6. **AC6: No Accidental Dismiss** — Tapping/clicking anywhere on the preview does NOT dismiss it. The only way to exit is the Retake button. Already handled by the full-screen `bg-black` overlay with no click handler on the backdrop. No changes needed — verify only.

7. **AC7: Touch Target Compliance** — Both Retake and Save buttons meet the 44x44px minimum touch target size (per WCAG 2.1 / UX accessibility rules). Current styling (`px-6 py-3` / `px-8 py-3`) produces ~48px height — compliant. Verify, do not change unless non-compliant.

## Tasks / Subtasks

- [x] Task 1: Add focus trap and auto-focus to PreviewScreen (AC: #3, #4, #5)
  - [x] 1.1 Add `useRef` + `useEffect` for auto-focus on mount
  - [x] 1.2 Add `tabIndex={-1}` and `aria-modal="true"` to the dialog container
  - [x] 1.3 Add `onKeyDown` handler for Tab/Shift+Tab focus trapping
- [x] Task 2: Update PreviewScreen tests (AC: #3, #4, #5, #6, #7)
  - [x] 2.1 Add test: dialog container receives focus on mount
  - [x] 2.2 Add test: `aria-modal="true"` is present
  - [x] 2.3 Add test: Tab key cycles focus between Retake and Save buttons
  - [x] 2.4 Add test: Shift+Tab cycles focus in reverse
  - [x] 2.5 Add test: clicking backdrop does not dismiss (Retake button required)

## Dev Notes

### PreviewScreen Already Exists — This Story Refines It

`src/components/screens/preview-screen.tsx` was created in Story 6.1 as a basic scaffold. Story 6.5 adds accessibility (focus trap, auto-focus, aria-modal). The visual layout, button placement, and atom wiring are unchanged.

Current state of `preview-screen.tsx`:

- Full-screen overlay: `absolute inset-0 z-50 bg-black flex flex-col` ✅
- Image display: `<img>` with `object-cover` ✅
- Retake button: clears `capturedPhotoAtom` via `useSetAtom` ✅
- Save button: `disabled` with `opacity-50 cursor-not-allowed` ✅
- `role="dialog"` and `aria-label="Photo Preview"` ✅
- `data-testid="preview-screen"` ✅

### Focus Trap Implementation

Add a `useRef` + `useEffect` for auto-focus and an `onKeyDown` handler for Tab trapping. The dialog has only 2 focusable elements (Retake and Save buttons), making the trap straightforward.

```typescript
import { useCallback, useEffect, useRef } from 'react';

export function PreviewScreen({ imageUrl }: PreviewScreenProps) {
  const setCapturedPhoto = useSetAtom(capturedPhotoAtom);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  // ... rest of component
  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      data-testid="preview-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Photo Preview"
      className="absolute inset-0 z-50 bg-black flex flex-col outline-none"
    >
      {/* ... existing content unchanged ... */}
    </div>
  );
}
```

**`tabIndex={-1}`:** Makes the div programmatically focusable (via `.focus()`) without adding it to the Tab order. Screen readers will announce the dialog when focused.

**`outline-none`:** Add to the container className to prevent a visible focus ring on the outer dialog div. The focus ring should only appear on the buttons.

**`aria-modal="true"`:** Tells assistive technology (VoiceOver, TalkBack) to treat content behind this dialog as inert. This is separate from the visual z-index layering.

**Focus trap query:** `button:not([disabled])` excludes the disabled Save button from Tab cycling (until Story 6.6 enables it). When Save is enabled, it will automatically be included in the Tab cycle.

**Why NOT use Radix Dialog?** The project has `@radix-ui/react-dialog` installed, and a Shadcn Dialog component at `src/components/ui/dialog.tsx`. However, Radix Dialog uses a portal, centers content, adds its own overlay, and expects `open`/`onOpenChange` state management. The PreviewScreen is a full-screen takeover with atom-based state — it doesn't map to Radix's centered modal pattern. A manual 10-line focus trap is simpler and avoids refactoring the working component.

### Testing Focus Trap in JSDOM

JSDOM supports `document.activeElement` and `element.focus()`. The key is to use `@testing-library/user-event` for Tab simulation since `fireEvent.keyDown` doesn't move focus — it only fires the event.

```typescript
import userEvent from '@testing-library/user-event';

it('traps focus within dialog on Tab', async () => {
  const user = userEvent.setup();
  render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
    wrapper: createWrapper(store),
  });

  const retakeButton = screen.getByTestId('retake-button');

  retakeButton.focus();
  expect(document.activeElement).toBe(retakeButton);

  await user.tab();
  // Save button is disabled — focus should wrap back to Retake
  expect(document.activeElement).toBe(retakeButton);
});
```

**Note on disabled Save button:** When Save is `disabled`, it's excluded from the focus trap query (`button:not([disabled])`). This means Tab from Retake wraps back to Retake (it's the only focusable button). When Story 6.6 enables Save, Tab will cycle Retake → Save → Retake.

Test cases:

- Dialog container receives focus on mount (`document.activeElement` is the dialog div)
- `aria-modal="true"` is present on the dialog
- Tab from Retake wraps (Retake is the only non-disabled button)
- Backdrop (the dialog container) click does NOT call `setCapturedPhoto(null)` — only Retake button does
- Retake button click still clears `capturedPhotoAtom` (regression test from Story 6.1)
- Save button is still disabled (regression test from Story 6.1)

### Touch Target Verification

Current button sizes:

- Retake: `px-6 py-3` → padding 24px horizontal, 12px vertical. With ~20px text line-height: ~44px height, ~80px width. Meets 44x44px minimum.
- Save: `px-8 py-3` → padding 32px horizontal, 12px vertical. With ~20px text line-height: ~44px height, ~74px width. Meets 44x44px minimum.

Both buttons use `rounded-full` which doesn't affect the touch target calculation (CSS border-radius doesn't reduce the clickable area).

No changes needed. If the dev agent measures the actual rendered height as < 44px, increase `py-3` to `py-3.5` (14px → 48px height).

### Existing Infrastructure (Do NOT Recreate)

| Component                | Location                                         | Status                                          |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------- |
| `PreviewScreen`          | `src/components/screens/preview-screen.tsx`      | Exists — modify for focus trap                  |
| `PreviewScreen` tests    | `src/components/screens/preview-screen.test.tsx` | Exists — add focus trap tests                   |
| `capturedPhotoAtom`      | `src/lib/stores/camera-store.ts`                 | Exists — no changes                             |
| CameraScreen integration | `src/components/screens/camera-screen.tsx:111`   | Exists — no changes                             |
| Shadcn Button            | `src/components/ui/button.tsx`                   | Exists — used by PreviewScreen                  |
| Radix Dialog             | `@radix-ui/react-dialog` (installed)             | Available but NOT used — manual trap is simpler |

### What NOT to Do

- Do NOT refactor PreviewScreen to use Radix Dialog — the full-screen takeover pattern doesn't fit Radix's centered modal
- Do NOT enable the Save button — that's Story 6.6
- Do NOT add save functionality or `onSave` prop — Story 6.6
- Do NOT modify CameraScreen — the integration is already correct
- Do NOT add ESC key handling to dismiss — only Retake button dismisses (per AC6, no accidental dismiss)
- Do NOT add swipe-to-dismiss gestures — not in scope
- Do NOT add animation/transition to the preview appearing — not in the AC, keep it simple
- Do NOT install a focus trap library — the manual trap is 10 lines

### Project Structure Notes

| File                                             | Action   | Change Description                                                                      |
| ------------------------------------------------ | -------- | --------------------------------------------------------------------------------------- |
| `src/components/screens/preview-screen.tsx`      | Modified | Add ref, useEffect auto-focus, onKeyDown focus trap, tabIndex, aria-modal, outline-none |
| `src/components/screens/preview-screen.test.tsx` | Modified | Add focus trap, auto-focus, aria-modal tests                                            |

No new files. No new directories.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-smart-capture-output.md#Story 6.5]
- [Source: _bmad-output/planning-artifacts/ux-design/component-strategy.md#PreviewScreen — focus trap]
- [Source: _bmad-output/planning-artifacts/ux-design/responsive-design-accessibility.md#Accessibility Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design/user-journey-flows.md#Post-Capture Flow]
- [Source: _bmad-output/implementation-artifacts/6-1-smart-shutter-auto-capture.md#AC6 Basic Preview Screen]
- [Source: _bmad-output/implementation-artifacts/6-2-manual-shutter-override.md#AC5 Preview Transition]

### Previous Story Intelligence (Story 6.4)

- Story 6.4 was a 1-line change (add `triggerHaptic('short')` in `useSmartShutter`). No relevant architectural patterns for 6.5.
- Story 6.3 established the `audio-feedback.ts` module pattern. Story 6.5 does not introduce new utility modules.
- Story 6.1 created the PreviewScreen scaffold and documented that "Story 6.5 will add full UX (focus trap, accessibility improvements)." This story fulfills that promise.
- Test suite at Story 6.4 completion: 318 tests across 36 suites, 0 failures.

### Git Intelligence

Recent commits focus on pose detection integration (Epic 3-4 work). Epic 6 stories (6.1-6.4) are not yet committed to main — they exist as working tree changes. The PreviewScreen code at `preview-screen.tsx` is an untracked new file in the working tree.

### Retro Action Items Enforcement

| Retro Item                              | Enforcement in This Story                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **AI-1 (E5)**: Test File Completeness   | Modified `preview-screen.tsx` has co-located `preview-screen.test.tsx` updated with 5 new test cases.                           |
| **AI-2 (E5)**: UI-Copy / Feature Parity | No new body copy. Existing "Retake" and "Save" labels verified — Save is disabled (no misleading "tap Save" instructions).      |
| **AI-3 (E4/E5)**: Test Assertion Depth  | Tests assert `document.activeElement`, specific `aria-modal` attribute value, and Tab key behavior — not just component render. |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (anthropic/claude-opus-4.6)

### Debug Log References

None — no issues encountered.

### Completion Notes List

- Added `useRef` + `useEffect` for auto-focus on mount — dialog container receives focus immediately (AC #4).
- Added `tabIndex={-1}` to make the dialog div programmatically focusable without adding it to Tab order.
- Added `aria-modal="true"` to signal assistive technology that underlying content is inert (AC #5).
- Added `outline-none` to prevent visible focus ring on the outer dialog container.
- Added `onKeyDown` handler implementing Tab/Shift+Tab focus trapping within the dialog (AC #3). With Save disabled, only Retake is focusable — Tab wraps to itself.
- Verified: no click handler on backdrop (AC #6), touch targets compliant at ~44px+ height (AC #7), full-screen overlay and buttons unchanged (AC #1, #2).
- Added 5 new test cases: auto-focus on mount, aria-modal presence, Tab trap, Shift+Tab trap, backdrop click no-dismiss.
- Full test suite: 324 tests across 36 suites, 0 failures, 0 regressions.

### Change Log

- Added focus trap, auto-focus, and aria-modal to PreviewScreen. Added 5 accessibility test cases.

### File List

- `src/components/screens/preview-screen.tsx` (modified)
- `src/components/screens/preview-screen.test.tsx` (modified)
