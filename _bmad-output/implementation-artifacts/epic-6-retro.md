# Retrospective: Epic 6 - Smart Capture & Output

**Participants:** Z3tz3r0 (Project Lead), Bob (Scrum Master), Alice (Product Owner), Charlie (Senior Dev), Dana (QA Engineer), Elena (Junior Dev)

---

## Epic Summary

**Epic 6: Smart Capture & Output**

- **Status:** Completed (6/6 Stories)
- **Delivery:** 100% Completion
- **Agent:** Claude Opus 4.6 (all stories)

### Stories Delivered

| Story | Title                        | Review Fixes                                                                                               | Tests Added        |
| :---- | :--------------------------- | :--------------------------------------------------------------------------------------------------------- | :----------------- |
| 6-1   | Smart Shutter (Auto-Capture) | 5 (zero-dim guard, stale closure fix, empty-string guard, useSmartShutter assertion, WireframeCanvas mock) | +20 (baseline 293) |
| 6-2   | Manual Shutter Override      | 4 (empty-string guard, ref-based double-capture guard, mirrored capture test, shutter button tests)        | +5                 |
| 6-3   | Audio Feedback (Ding Sound)  | 0                                                                                                          | +14                |
| 6-4   | Haptic Feedback (Vibration)  | 0                                                                                                          | +6                 |
| 6-5   | Photo Preview Screen         | 0                                                                                                          | +6                 |
| 6-6   | Save to Camera Roll          | 0                                                                                                          | +13                |

### Metrics

| Metric                   | Value   | Notes                        |
| :----------------------- | :------ | :--------------------------- |
| **Completed Stories**    | 6 / 6   | All planned stories done     |
| **Tests at Epic Start**  | ~273    | From Epic 5 end              |
| **Tests at Epic End**    | 337     | +64 across 37 suites         |
| **Debug Issues**         | 0       | All stories clean first pass |
| **Code Review Fixes**    | 9 total | 6.1: 5, 6.2: 4, 6.3-6.6: 0   |
| **Production Incidents** | 0       | Clean epic                   |

---

## Previous Retrospective Follow-Through (Epic 5)

| ID   | Action Item                                                                                     | Status           | Evidence                                                                                                                                                            |
| :--- | :---------------------------------------------------------------------------------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AI-1 | **Test File Completeness Rule**: Every modified component must have associated test file        | ✅ Done          | Every story has Retro Enforcement table tracking AI-1. 0 missing test files across 6 stories. The 5-4 failure mode (CameraErrorBanner with no tests) did not recur. |
| AI-2 | **UI-Copy / Feature Parity Check**: Body text referencing UI actions must match actual UI       | ✅ Done          | Save button disabled with no misleading copy (6.1). "Saved!" matches actual download behavior (6.6). No "Tap Retry" class bugs.                                     |
| AI-3 | **Test Assertion Depth Rule** (carry from E4): Tests verify behavior values, not just existence | ✅ Done          | All stories assert specific mock calls, arguments, counts, and negative cases. 6.6: savePhoto mock args, text content transitions, timer-based state changes.       |
| TD-1 | Update epic-5 status to done in sprint-status.yaml                                              | ❌ Not Addressed | Low-priority housekeeping item. No downstream impact.                                                                                                               |
| TD-2 | Capture gating when detectionLostAtom is true                                                   | ✅ Done          | 6.1: auto-capture explicitly gated by `!detectionLost`. 6.2: manual capture intentionally bypasses — "Override is a feature, not a fallback."                       |
| PT-1 | Research canvas drawImage + toBlob for video frame capture                                      | ✅ Done          | `capturePhoto` utility uses canvas.drawImage + toDataURL with mirror handling. Confirmed working.                                                                   |
| PT-2 | Research navigator.vibrate and Web Audio API availability                                       | ✅ Done          | 6.3: chose HTMLAudioElement over Web Audio API; iOS Safari preload in user gesture. 6.4: full browser support table for Vibration API.                              |
| PT-3 | Design photo preview screen state management                                                    | ✅ Done          | `capturedPhotoAtom` (null = camera, non-null = preview) drives entire transition. Documented in 6.1 architecture notes.                                             |
| PT-4 | Create story files for 6-1 through 6-6                                                          | ✅ Done          | All 6 created and implemented.                                                                                                                                      |

**Follow-through rate: 89%** (8/9 items). Up from 86% in Epic 5, 75% in Epic 4, 44% in Epic 3. The single gap (TD-1) is low-priority housekeeping.

Notable improvement: Every Epic 6 story includes a structured "Retro Action Items Enforcement" table — a pattern not present in Epic 5 stories. The retro process has been internalized into the story development workflow.

---

## What Went Well (Successes)

1. **Foundation-First Architecture Paid Off:**
   - Story 6.1 was heavy (12 files, 5 review fixes) but established the entire capture pipeline: `poseScoreAtom → useSmartShutter (500ms hold) → capturePhoto → capturedPhotoAtom → PreviewScreen`.
   - Stories 6.2-6.6 were incrementally lighter. Story 6.4 was a single line of production code (`triggerHaptic('short')`).
   - Story ordering was deliberate: foundation → manual trigger → feedback layers → UX refinement → completion.

2. **Review Fixes Trended to Zero:**
   - 6.1: 5 fixes, 6.2: 4 fixes, 6.3-6.6: 0 fixes.
   - Patterns learned early (stale closures, null guards, double-trigger prevention) were absorbed and applied proactively in subsequent stories.
   - Evidence that the team learns within an epic, not just across epics.

3. **Forward-Compatible Design:**
   - Focus trap in 6.5 used `button:not([disabled])` selector — when 6.6 enabled Save, Tab cycle auto-expanded with zero code changes.
   - `hasDingedRef` from 6.3 naturally gated 6.4's haptic without a new ref.
   - `capturedPhotoAtom` as null/non-null state machine drove behavior for all 6 stories.

4. **Multimodal Feedback Delivered Together:**
   - Visual (white flash), audio (ding at t=0ms), haptic (vibration at t=0ms), then auto-capture at t=500ms.
   - All feedback modalities fire simultaneously with graceful degradation per platform.

5. **Scope Discipline via "What NOT to Do" Lists:**
   - Every story explicitly prevents scope creep. 6.1: "do NOT wire onShutter" (6.2), "do NOT add audio" (6.3).
   - Combined with "Previous Story Intelligence" sections, each story had clear inputs and boundaries.

6. **Browser Research Before Implementation:**
   - Vibration API browser support table (6.4), `<a download>` support table (6.6).
   - Research prevented mid-story surprises with platform-specific behavior.

---

## What Can Be Improved (Challenges)

1. **JSDOM Test Environment Limitations:**
   - Every browser API (Canvas in 6.1, Audio constructor in 6.3, anchor download in 6.6) required bespoke mock setups.
   - Significant boilerplate per story. Environment constraint, not design problem, but adds friction.

2. **Stale Closures in Timer Hooks (Story 6.1):**
   - `useSmartShutter` timer callback captured `videoElement` at creation time. If atoms changed before timer fired, stale values were used.
   - Caught in code review, fixed by clearing/restarting timer on dependency change.
   - This bug class is subtle and timer-specific — worth documenting as a rule.

3. **Rapid-Tap Race Condition (Story 6.2):**
   - React state updates are async, so checking `capturedPhoto` state in a click handler can return stale values.
   - Required ref-based guard (`capturedPhotoRef`) for synchronous checks.
   - Same class of bug as stale closures — async operations reading potentially-outdated state.

4. **Global Jotai Mock Fragility (camera-screen.test.tsx):**
   - `useSetAtom` mocked globally, returning a single mock function. When multiple atoms need distinct setters, the mock must be carefully configured per atom.
   - Provider-based testing (using real Jotai store) would be more resilient.

---

## Key Insights

1. **Foundation stories justify their weight.** Story 6.1's 12-file footprint was the right investment — it made everything after it lighter. The lesson: don't split foundation work into multiple stories to appear "smaller"; the dependency graph matters more than story size.

2. **Review fix trends reveal learning curves.** The 5 → 4 → 0 → 0 → 0 → 0 pattern shows that early stories surface patterns that subsequent stories internalize. This is healthy and expected.

3. **Retro enforcement tables are a process breakthrough.** Epic 6 is the first epic where every story explicitly tracks retro action items. This closed the loop between "we committed to X" and "we actually did X." Recommend continuing.

4. **Browser API stories need upfront research.** PT-1 and PT-2 from Epic 5 retro directly prevented surprises with canvas, audio, and vibration. This pattern should continue for Epic 7's benchmarking, service worker, and FPS throttling.

5. **The utility-first browser API pattern is reusable.** `capture-photo.ts`, `audio-feedback.ts`, `save-photo.ts` all follow the same structure: module-level state, exported functions, feature detection, silent failure. This is now a proven pattern for Epic 7's benchmark and lite mode utilities.

---

## Architecture Patterns Established

| Pattern                            | Description                                                                      | First Used    |
| :--------------------------------- | :------------------------------------------------------------------------------- | :------------ |
| Atom-driven UI state               | `capturedPhotoAtom` null = camera view, non-null = preview overlay               | 6.1           |
| Utility-first browser APIs         | Module-level singleton + exported functions + feature detection + silent failure | 6.1, 6.3, 6.6 |
| One-shot side effects via refs     | `hasDingedRef` gates ding + haptic per crossing session without re-renders       | 6.3           |
| Props for display, atoms for state | PreviewScreen receives `imageUrl` prop but writes `capturedPhotoAtom` internally | 6.1           |
| Forward-compatible selectors       | `button:not([disabled])` in focus trap auto-adapts as buttons enable/disable     | 6.5           |

---

## Action Items

### Process Improvements

| ID           | Action                                                                                                                                                                                                                         | Owner                | Priority |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------- | :------- |
| AI-1         | **Retro Enforcement Table** (continue): Every story must have the enforcement table tracking active retro items.                                                                                                               | Bob (SM)             | HIGH     |
| AI-2         | **Timer/Closure Safety Rule**: Any hook using `setTimeout`, `setInterval`, or `requestAnimationFrame` must verify dependency values are current at callback execution time. Use refs for values needed inside async callbacks. | Charlie (Senior Dev) | HIGH     |
| AI-3         | **Ref-based Guard Pattern**: When a click handler depends on atom state that can change between click and execution, use a ref mirror of the atom value for the guard check.                                                   | Charlie (Senior Dev) | MEDIUM   |
| AI-4 (carry) | **Test File Completeness** (AI-1 from E5): Continue enforcing — 0 missing test files across 6 stories validates the rule works.                                                                                                | Dana (QA)            | HIGH     |

### Technical Debt

| ID           | Item                                                                                                                                           | Priority | Notes                                      |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :----------------------------------------- |
| TD-1         | **Jotai test pattern**: `camera-screen.test.tsx` uses fragile global `useSetAtom` mock. Consider Provider-based testing for atom interactions. | LOW      | Not blocking; affects test maintainability |
| TD-2         | **JSDOM mock utilities**: Consider shared test helpers for Canvas, Audio, anchor download mocks to reduce boilerplate.                         | LOW      | DX improvement                             |
| TD-3 (carry) | **Update epic-5 status to done** (TD-1 from E5)                                                                                                | LOW      | Housekeeping                               |

### Epic 7 Preparation Tasks

| ID   | Task                                                                                                                                                                                                 | Owner                |
| :--- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------- |
| PT-1 | **Research Next.js service worker options**: Serwist, next-pwa, or custom. Chrome requires service worker with fetch handler for "Add to Home Screen" prompt. Critical for Story 7.4.                | Charlie (Senior Dev) |
| PT-2 | **Design benchmark runner**: How to run bounded 5-frame detection pass and measure FPS after model initialization. Reuse existing worker or standalone function. Story 7.1 depends on this.          | Charlie (Senior Dev) |
| PT-3 | **Design detection loop throttle**: Frame-skip mechanism for `use-pose-detection.ts` to support lite mode 15 FPS target. Consider `performance.now()` timestamp approach. Story 7.2 depends on this. | Charlie (Senior Dev) |
| PT-4 | **Create story files for 7-1 through 7-5**                                                                                                                                                           | Bob (SM)             |

---

## Epic 7 Preview: Dependencies and Readiness

### Dependencies on Epic 6

| Epic 7 Story            | Depends On                                                         | Status |
| :---------------------- | :----------------------------------------------------------------- | :----- |
| 7.2 Lite Mode           | Capture pipeline (6.1-6.2), feedback (6.3-6.4) must work at 15 FPS | Ready  |
| 7.3 Unsupported Warning | Manual shutter (6.2) as primary fallback capture                   | Ready  |

### Partially Complete Work Discovered

- **Story 7.4 (~80% done):** `manifest.ts` already has name, icons, standalone display. Missing: `orientation: 'portrait'`, service worker.
- **Story 7.5 (partially done):** CSP headers in `next.config.ts`. Missing: Vercel platform setup.
- **`LITE_MODE_FPS = 15` constant** already exists in `app.constants.ts` but unused.

### Risks

- **Service worker + Next.js standalone**: Non-trivial integration. Standalone output designed for Node.js server, not offline PWA.
- **Benchmark accuracy**: 5-frame sample may not be representative. Must run after model initialization.
- **FPS threshold boundaries**: Gap between lite mode (< 15 FPS) and unsupported (< 10 FPS) is narrow; borderline devices may flip-flop.

**Epic Update Required:** NO

---

## Readiness Assessment

| Area                  | Status    | Notes                                                              |
| :-------------------- | :-------- | :----------------------------------------------------------------- |
| Testing & Quality     | Strong    | 337 tests, 37 suites, 0 failures                                   |
| Foundation for Epic 7 | Ready     | Capture pipeline stable, detection loop working                    |
| Dependencies          | Complete  | All Epic 7 dependencies from Epics 1-6 delivered                   |
| Technical Health      | Excellent | 0 debug issues, 0 regressions                                      |
| New Territory Risk    | Moderate  | Service worker, benchmarking, FPS throttling are new APIs/patterns |
| Unresolved Blockers   | None      |                                                                    |

---

## Test Suite Progression

| Story      | Suites | Tests | Delta |
| :--------- | :----- | :---- | :---- |
| Pre-Epic 6 | ~33    | ~273  | —     |
| 6.1        | 35     | 293   | +20   |
| 6.2        | 35     | 298   | +5    |
| 6.3        | 36     | 312   | +14   |
| 6.4        | 36     | 318   | +6    |
| 6.5        | 36     | 324   | +6    |
| 6.6        | 37     | 337   | +13   |

---

## Conclusion

Epic 6 delivered all 6 Smart Capture & Output stories with 100% completion, 0 debug issues, and 64 new tests. This epic represents a significant milestone: the app now captures, previews, and saves photos — transforming it from a detection-only tool to a functional camera application.

The capture pipeline established in Story 6.1 proved to be a strong architectural foundation. Every subsequent story built on it with decreasing friction — code review fixes dropped from 5 (6.1) to 0 (6.3-6.6), demonstrating rapid pattern absorption within a single epic.

The most notable process improvement was the adoption of Retro Enforcement tables in every story, explicitly tracking previous retro action items. This closed the feedback loop between retrospectives and implementation, driving the follow-through rate from 44% (Epic 3) to 89% (Epic 6).

Epic 7 (Device Compatibility & Performance) has no blocking dependencies and can proceed as planned. Three preparation tasks (service worker research, benchmark design, detection throttle design) are recommended before implementation. Stories 7.4 and 7.5 are partially complete, which should accelerate the epic.

**Status:** Retrospective Complete. Ready for Epic 7 Planning.
