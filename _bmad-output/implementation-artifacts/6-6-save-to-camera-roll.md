# Story 6.6: Save to Camera Roll

Status: review

## Story

As a user,
I want to save my photo to my device's camera roll,
so that I can share it on social media later.

## Acceptance Criteria

1. **AC1: Save Photo Utility** — A `savePhoto(dataUrl: string): void` function is exported from `src/lib/utils/save-photo.ts`. It converts the JPEG data URL to a Blob, creates a temporary `<a>` element with `download` attribute and a Blob URL `href`, appends it to the document, programmatically clicks it, removes it, and revokes the object URL. This triggers the browser's native download behavior. The downloaded file goes to the device's Downloads folder / photo library depending on browser behavior.

2. **AC2: Filename Format** — The downloaded file is named `ai-perfect-shot-YYYY-MM-DD-HHMMSS.jpg` using the capture timestamp. Example: `ai-perfect-shot-YYYY-MM-DD-HHMMSS.jpg`. The filename is generated inside `savePhoto()` — not passed as a parameter.

3. **AC3: Enable Save Button** — The Save button in `PreviewScreen` is no longer `disabled`. It has an `onClick` handler that calls `savePhoto(imageUrl)`. The button styling changes from `opacity-50 cursor-not-allowed` (Story 6.1 placeholder) to the active style: `bg-white text-black` with hover state.

4. **AC4: Success Confirmation** — After `savePhoto()` is called, the Save button text changes from "Save" to "Saved!" with a green background (`bg-green-500 text-white`) for 1.5 seconds. The button is disabled during this confirmation period to prevent double-save. After 1.5s, `capturedPhotoAtom` is cleared and the app returns to camera view.

5. **AC5: Return to Camera** — After the 1.5s confirmation, `capturedPhotoAtom` is set to `null`, which unmounts `PreviewScreen` and returns to the camera view. The user can immediately take another photo.

6. **AC6: Graceful Failure** — If the download fails (unlikely with anchor approach), `savePhoto()` does not throw. The try/catch in the utility catches any errors silently. The app continues functioning. Do NOT show error toasts or banners for save failure.

## Tasks / Subtasks

- [x] Task 1: Create save-photo utility (AC: #1, #2, #6)
  - [x] 1.1 Create `src/lib/utils/save-photo.ts` — `savePhoto(dataUrl)` with data URL → Blob conversion, timestamped filename, anchor download
  - [x] 1.2 Create `src/lib/utils/save-photo.test.ts` — tests for Blob conversion, filename format, anchor creation/click/cleanup
- [x] Task 2: Enable Save button and wire handler in PreviewScreen (AC: #3, #4, #5)
  - [x] 2.1 Remove `disabled` from Save button, add `onClick={handleSave}`
  - [x] 2.2 Add `saveState` (`'idle' | 'saved'`) state, call `savePhoto`, show "Saved!" confirmation
  - [x] 2.3 Add `setTimeout` to clear `capturedPhotoAtom` after 1.5s
- [x] Task 3: Update PreviewScreen tests (AC: #3, #4, #5)
  - [x] 3.1 Update existing test: Save button is now enabled (not disabled)
  - [x] 3.2 Add test: clicking Save calls `savePhoto` with imageUrl
  - [x] 3.3 Add test: after Save click, button shows "Saved!" text
  - [x] 3.4 Add test: after 1.5s, `capturedPhotoAtom` is cleared
  - [x] 3.5 Add test: Save button is disabled during "Saved!" state (no double-save)

## Dev Notes

### Save Photo Utility — `src/lib/utils/save-photo.ts`

Architecture prescribes: `Captured Photos → Blob → Download API → Camera Roll` ([Source: core-architectural-decisions.md#Data Flow]). The project-context.md project structure lists `save-photo.ts` under `lib/utils/`.

```typescript
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const match = parts[0].match(/:(.*?);/);
  const mime = match ? match[1] : "image/jpeg";
  const bytes = atob(parts[1]);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    array[i] = bytes.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

function generateFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `ai-perfect-shot-${date}-${time}.jpg`;
}

export function savePhoto(dataUrl: string): void {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generateFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch {
    // Silent failure — download failed but app continues
  }
}
```

**Why `<a download>` and NOT `navigator.share`?** The AC says "Save" not "Share." When the user taps Save, they expect the file to be saved immediately — not to see a share sheet requiring a second tap. `<a download>` is deterministic (one tap = saved), while `navigator.share` opens a picker requiring additional user selection. On iOS Safari, `<a download>` presents a download preview where the user can tap the share icon to save to Photos. On Android Chrome, the file goes to Downloads and appears in the Gallery. This matches the architecture: `Blob → Download API → Camera Roll`.

**Why convert data URL to Blob URL?** Some browsers don't support `<a download>` on `data:` URLs directly. Converting to a Blob URL via `URL.createObjectURL` is universally supported and more memory-efficient for large images.

**`setTimeout(() => URL.revokeObjectURL(url), 100)`:** The `click()` initiates the download asynchronously. Revoking the URL immediately after `click()` can cancel the download in some browsers. A 100ms delay ensures the browser has started the download before the URL is revoked.

**No `async`/`await`:** The function is synchronous. Blob creation, anchor manipulation, and `click()` are all synchronous operations. The `setTimeout` for URL revocation is fire-and-forget.

### Testing `save-photo.ts` in JSDOM

JSDOM supports `document.createElement('a')`, `document.body.appendChild/removeChild`, and `URL.createObjectURL`. Mock `URL.createObjectURL` and `URL.revokeObjectURL`:

```typescript
const mockCreateObjectURL = jest.fn().mockReturnValue("blob:mock-url");
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;
```

Mock `atob` if JSDOM doesn't support it for the data URL format — but JSDOM does support `atob`.

Test the anchor click via spy:

```typescript
const clickSpy = jest.fn();
const appendSpy = jest.spyOn(document.body, "appendChild");
const removeSpy = jest.spyOn(document.body, "removeChild");
jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
  if (tag === "a") {
    return {
      click: clickSpy,
      href: "",
      download: "",
    } as unknown as HTMLAnchorElement;
  }
  return originalCreateElement(tag);
});
```

Test cases:

- `savePhoto` creates a Blob from data URL with correct MIME type
- `savePhoto` creates an anchor with `download` attribute matching filename pattern
- `savePhoto` calls `click()` on the anchor
- `savePhoto` appends and removes the anchor from `document.body`
- `savePhoto` calls `URL.revokeObjectURL` after a timeout
- `savePhoto` does not throw when data URL is malformed (graceful failure)
- `generateFilename` produces format `ai-perfect-shot-YYYY-MM-DD-HHMMSS.jpg`

### PreviewScreen Changes — Enable Save Button

Modify `src/components/screens/preview-screen.tsx`:

```typescript
import { savePhoto } from "@/lib/utils/save-photo";
import { useState } from "react";

// Inside PreviewScreen:
const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

const handleSave = () => {
  savePhoto(imageUrl);
  setSaveState("saved");
  setTimeout(() => {
    setCapturedPhoto(null);
  }, 1500);
};
```

Update the Save button JSX:

```tsx
<Button
  onClick={handleSave}
  disabled={saveState === "saved"}
  data-testid="save-button"
  className={cn(
    "px-8 py-3 rounded-full font-semibold",
    saveState === "saved"
      ? "bg-green-500 text-white"
      : "bg-white text-black hover:bg-gray-100",
  )}
>
  {saveState === "saved" ? "Saved!" : "Save"}
</Button>
```

**New import needed:** `cn` from `@/lib/utils` (already used by ControlBar, follows project pattern). `savePhoto` from `@/lib/utils/save-photo`. `useState` is already imported via `useRef`/`useEffect`/`useCallback` from Story 6.5.

**Focus trap impact:** Story 6.5 implemented a focus trap that queries `button:not([disabled])`. With Save now enabled (in 'idle' state), Tab will cycle Retake → Save → Retake. During 'saved' state, Save becomes disabled again so Tab stays on Retake. No focus trap code changes needed.

### Testing PreviewScreen Save Flow

Mock `save-photo`:

```typescript
jest.mock("@/lib/utils/save-photo", () => ({
  savePhoto: jest.fn(),
}));
import { savePhoto } from "@/lib/utils/save-photo";
const mockSavePhoto = savePhoto as jest.MockedFunction<typeof savePhoto>;
```

Add `jest.useFakeTimers()` for the 1.5s confirmation timeout.

Test cases:

- Save button is enabled (not disabled) — **update existing test that asserts `toBeDisabled()`**
- Clicking Save calls `savePhoto` with the `imageUrl` prop value
- After Save click, button text changes to "Saved!"
- After Save click, button has green styling (assert `bg-green-500` class or check text content)
- After 1.5s (`jest.advanceTimersByTime(1500)`), `capturedPhotoAtom` is cleared to null
- Save button is disabled during "Saved!" state (prevent double-save)
- After Save click, `savePhoto` is called exactly once (not again during timeout)

### Download Attribute Browser Support

| Browser          | `<a download>`     | Notes                                            |
| ---------------- | ------------------ | ------------------------------------------------ |
| Chrome Android   | Supported (v14+)   | Downloads to device, appears in Gallery          |
| Safari iOS       | Supported (v13+)   | Shows download preview, user can share to Photos |
| Safari macOS     | Supported (v10.1+) | Downloads to ~/Downloads                         |
| Firefox          | Supported (v20+)   | Downloads to configured folder                   |
| Edge             | Supported (v13+)   |                                                  |
| Samsung Internet | Supported          |                                                  |

96%+ global browser support. No fallback needed. Data URL → Blob URL conversion ensures compatibility with browsers that restrict `<a download>` on `data:` URLs.

### Existing Infrastructure (Do NOT Recreate)

| Component              | Location                                         | Relevance                                                    |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| `PreviewScreen`        | `src/components/screens/preview-screen.tsx`      | Modify: enable Save button, add handler                      |
| `PreviewScreen` tests  | `src/components/screens/preview-screen.test.tsx` | Modify: update disabled test, add save flow tests            |
| `capturedPhotoAtom`    | `src/lib/stores/camera-store.ts`                 | Already used by PreviewScreen — no changes                   |
| `capturePhoto` utility | `src/lib/utils/capture-photo.ts`                 | Produces the data URL that `savePhoto` consumes — no changes |
| `cn` utility           | `src/lib/utils.ts`                               | Already available — used by ControlBar                       |
| Focus trap             | `preview-screen.tsx:20-42`                       | Already handles enabled/disabled buttons — no changes needed |

### What NOT to Do

- Do NOT use `navigator.share` — the Save button should save immediately, not open a share sheet
- Do NOT use File System Access API (`showSaveFilePicker`) — not supported on iOS Safari or Firefox
- Do NOT create a Toast component — the "Saved!" text on the button is the confirmation
- Do NOT add a separate confirmation modal — one tap = saved, brief visual confirmation, then back to camera
- Do NOT store photos in IndexedDB or localStorage — architecture says no app-side storage
- Do NOT add a photo gallery feature — out of scope
- Do NOT modify `capture-photo.ts` — it already produces the correct data URL
- Do NOT modify `camera-screen.tsx` — the PreviewScreen integration is already correct
- Do NOT use `async/await` in `savePhoto` — the operation is synchronous

### Project Structure Notes

| File                                             | Action   | Location Rationale                                                                                                  |
| ------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/lib/utils/save-photo.ts`                    | New      | `lib/utils/` — browser API wrapper, follows `audio-feedback.ts` / `haptic-feedback.ts` / `capture-photo.ts` pattern |
| `src/lib/utils/save-photo.test.ts`               | New      | Co-located with source                                                                                              |
| `src/components/screens/preview-screen.tsx`      | Modified | Enable Save button, add save handler with confirmation                                                              |
| `src/components/screens/preview-screen.test.tsx` | Modified | Update disabled test, add save flow tests                                                                           |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-smart-capture-output.md#Story 6.6]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#Data Flow — Blob → Download API → Camera Roll]
- [Source: _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md#save-photo.ts]
- [Source: _bmad-output/planning-artifacts/ux-design/core-user-experience.md#Post-Capture Flow]
- [Source: _bmad-output/planning-artifacts/ux-design/user-journey-flows.md#Binary post-capture Save/Retake]
- [Source: _bmad-output/planning-artifacts/prd/mobile-web-app-pwa-specific-requirements.md#Storage/Downloads — In-browser download]
- [Source: _bmad-output/project-context.md#Project Structure — save-photo.ts]

### Previous Story Intelligence (Story 6.5)

- Story 6.5 added focus trap to PreviewScreen. The focus trap query `button:not([disabled])` means enabling Save automatically adds it to the Tab cycle — no focus trap changes needed.
- Story 6.5 used `useCallback` and `useRef` in PreviewScreen. Story 6.6 adds `useState` for save state — follows the same React hooks pattern.
- PreviewScreen currently imports `useCallback, useEffect, useRef` from React. Add `useState` to the import.
- Test suite at Story 6.5 completion: 324 tests across 36 suites, 0 failures.
- Story 6.5 test file already uses `userEvent` and `createWrapper(store)` pattern. Story 6.6 tests should add `jest.useFakeTimers()` for the 1.5s timeout testing (same pattern as `use-smart-shutter.test.tsx`).

### Retro Action Items Enforcement

| Retro Item                              | Enforcement in This Story                                                                                                                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI-1 (E5)**: Test File Completeness   | New file `save-photo.ts` has co-located `save-photo.test.ts`. Modified `preview-screen.tsx` has existing `preview-screen.test.tsx` updated.                                                                                      |
| **AI-2 (E5)**: UI-Copy / Feature Parity | Save button text changes to "Saved!" — this matches the actual behavior (photo downloaded). No misleading copy. "Return to camera" happens automatically after confirmation — no button references an action that doesn't exist. |
| **AI-3 (E4/E5)**: Test Assertion Depth  | Tests assert specific `savePhoto` mock calls with image URL argument, button text content changes ("Save" → "Saved!"), atom state transitions, and timer-based behavior — not just component render.                             |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (anthropic/claude-opus-4.6)

### Debug Log References

None — no issues encountered.

### Completion Notes List

- Created `save-photo.ts` utility: `savePhoto(dataUrl)` converts data URL to Blob, creates temporary `<a>` with `download` attribute, triggers click, cleans up, revokes object URL after 100ms delay (AC #1, #6).
- Filename generated as `ai-perfect-shot-YYYY-MM-DD-HHMMSS.jpg` using capture timestamp (AC #2).
- Enabled Save button in PreviewScreen: removed `disabled`, added `onClick={handleSave}`, active styling with `bg-white text-black hover:bg-gray-100` (AC #3).
- Added `saveState` state: after save, button shows "Saved!" with `bg-green-500 text-white`, button disabled during confirmation to prevent double-save (AC #4).
- After 1.5s confirmation, `capturedPhotoAtom` cleared to return to camera view (AC #5).
- Updated focus trap tests: Save is now enabled so Tab cycles Retake -> Save -> Retake, Shift+Tab from dialog goes to Save (last focusable).
- 7 new save-photo utility tests + 4 new PreviewScreen save flow tests + 1 updated test (disabled -> enabled).
- Full test suite: 337 tests across 37 suites, 0 failures, 0 regressions.

### Change Log

- Created save-photo utility with data URL → Blob → anchor download. Enabled Save button with "Saved!" confirmation and auto-return to camera. Added 12 new tests.

### File List

- `src/lib/utils/save-photo.ts` (new)
- `src/lib/utils/save-photo.test.ts` (new)
- `src/components/screens/preview-screen.tsx` (modified)
- `src/components/screens/preview-screen.test.tsx` (modified)
