# Retrospective: Epic 5 - Subject Detection & Edge Case Handling

**Participants:** Z3tz3r0 (Project Lead), Bob (Scrum Master), Alice (Product Owner), Charlie (Senior Dev), Dana (QA Engineer), Elena (Junior Dev)

---

## Epic Summary

**Epic 5: Subject Detection & Edge Case Handling**

- **Status:** Completed (4/4 Stories)
- **Delivery:** 100% Completion
- **Agent:** Claude Sonnet 4.6 (Stories 5.1–5.3), Claude Opus 4.6 (Story 5.4)

### Stories Delivered

| Story | Title                      | Debug Issues | Review Fixes                                                                                                                             | Tests Added                          |
| :---- | :------------------------- | :----------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------- |
| 5-1   | Subject Distance Detection | 0            | —                                                                                                                                        | —                                    |
| 5-2   | Subject Framing Detection  | 0            | —                                                                                                                                        | —                                    |
| 5-3   | Lighting Condition Warning | 0            | Dead code in detect-lighting.ts, missing landmark-lost test, numeric separator, non-null assertion, misplaced import                     | +1 (landmark-lost-after-true)        |
| 5-4   | Graceful Detection Failure | 0            | Runtime error body text (Tap Retry with no Retry button), missing camera-error-banner.test.tsx, misleading test comment, non-type import | +17 (camera-error-banner test suite) |

### Metrics

| Metric                   | Value  | Notes                                       |
| :----------------------- | :----- | :------------------------------------------ |
| **Completed Stories**    | 4 / 4  | All planned stories done                    |
| **Tests at Epic Start**  | ~244   | From Story 5-3 dev notes                    |
| **Tests at Epic End**    | ~273   | +29 across 5-3 and 5-4 code reviews         |
| **Debug Issues**         | 0      | All stories implemented clean first pass    |
| **Code Review Cycles**   | 1 each | All stories approved in single review cycle |
| **Production Incidents** | 0      | Clean epic                                  |

---

## Previous Retrospective Follow-Through (Epic 4)

| ID           | Action Item                                                                                     | Status     | Evidence                                                                                                                                                                                                   |
| :----------- | :---------------------------------------------------------------------------------------------- | :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI-1         | **Realistic Test Fixtures**: Geometric heuristic tests must use plausible landmark positions    | ✅ Done    | Story 5-3 fixtures: poor = 0.3–0.4 visibility, good = 0.8–0.9. Boundary tests at 0.49/0.50. Review confirmed no fixture realism issues.                                                                    |
| AI-2         | **Hook Composition Rule**: Hooks must not nest other hooks that share atom subscriptions        | ✅ Done    | All 5 detection hooks (distance, framing, scene, lighting, pose) read atoms directly — no nesting detected in any review.                                                                                  |
| AI-3         | **API Consistency Check**: Write functions on the same domain must have consistent side effects | ✅ Done    | detectionLostAtom guard applied uniformly to all 3 top-1/3 warning components simultaneously in Story 5-4.                                                                                                 |
| AI-4 (carry) | **Test Assertion Depth Rule**: Tests must verify behavior values, not just existence            | ⚠️ Partial | New feature tests strong (boundary values, debounce counts). But Story 5-4 dev agent did not create camera-error-banner.test.tsx for a modified component — zero coverage for AC6 user-facing copy change. |
| PT-1         | Research lighting detection approach for Story 5.3                                              | ✅ Done    | Landmark visibility proxy chosen: no new infrastructure, reuses poseResultAtom, correlates with MediaPipe detection confidence.                                                                            |
| PT-2         | Review detectionLostAtom for Story 5.4 readiness                                                | ✅ Done    | Found and fixed watchdog bug: timer now resets only on valid 33-landmark results, not on every POSE_RESULT.                                                                                                |
| PT-3         | Create story files for 5-1 through 5-4                                                          | ✅ Done    | All 4 story files created and implemented.                                                                                                                                                                 |

**Assessment:** 6 of 7 items completed, 1 partial. Action item follow-through rate: 86% (up from 75% in Epic 4). Enforced rules (AI-1, AI-2, AI-3) continue to hold. The remaining gap (AI-4) reveals a new specific failure mode: a modified component had no associated test file at all — distinct from the original "shallow assertions" problem.

---

## What Went Well (Successes)

1. **Detect → Hook → Component Pattern Proved Bulletproof:**
   - Stories 5-1, 5-2, and 5-3 implemented cleanly with zero debug issues.
   - The same structure (`detectX` utility → `useXDetection` hook → `XWarning` component) worked identically for three distinct detection types (distance, framing, lighting).
   - Each story's dev notes explicitly referenced prior stories as structural guides, maintaining coherence without central coordination.

2. **Priority Chain Design Closed an Open Question from Story 5-3 Review:**
   - The 5-3 code review surfaced a cross-cutting concern: all detection hooks retain their `true` state when landmarks disappear, creating potential stuck-warning UX.
   - Story 5-4 resolved this architecturally: `detectionLostAtom` became the authoritative "no person in frame" signal, suppressing all `top-1/3` warnings through a consistent priority chain.
   - This is a rare example of a review finding from one story shaping the design of the next.

3. **Epic 4 Action Items Fully Enforced:**
   - AI-1 (fixture realism), AI-2 (hook composition), AI-3 (API consistency) were all applied in story implementations — not just in reviews. The rules were internalized, not just retroactively caught.
   - PT-1 (lighting research) and PT-2 (detectionLostAtom review) surfaced critical information: the visibility proxy approach for lighting, and the watchdog bug that was the core fix of Story 5-4.

4. **LightingWarning Design Intentionality:**
   - The decision to keep `LightingWarning` at `top-4` as a non-blocking ambient indicator (rather than integrating it into the `top-1/3` priority chain) was explicitly documented and enforced across all three stories that touched the priority chain.
   - This kind of documented intentional exception prevents future developers from "helpfully" adding a `detectionLostAtom` guard to `LightingWarning`.

5. **Code Reviews Caught Real Issues in Every Story:**
   - Story 5-3: 3 Medium + 3 Low issues, all fixed.
   - Story 5-4: 2 Medium + 2 Low issues, all fixed.
   - Zero false positives — every flagged issue was a genuine improvement.

---

## What Can Be Improved (Challenges)

1. **Missing Test File for Modified Component (Story 5-4, AC6):**
   - `camera-error-banner.tsx` was modified to replace raw error strings with user-friendly copy — a user-visible behavior change — but no `camera-error-banner.test.tsx` existed or was created.
   - The story's File List included the source file but not a test file.
   - Root cause: The dev agent treated the change as "copy substitution" rather than "new testable behavior." The fact that the original file had no tests made the gap invisible.
   - Impact: A body text bug (runtime error: "Tap 'Retry' to restart" with no Retry button rendered) went undetected until adversarial review.

2. **Body Text / UI Feature Parity Bug (Story 5-4, M1):**
   - Runtime error body text said "Tap 'Retry' to restart." but the Retry button only renders for load errors (`isLoadError`).
   - The story's Dev Notes provided the body text verbatim as implementation guidance — the bug was in the guidance itself, not the implementation.
   - This reveals a gap: dev notes are trusted prescriptively without cross-checking against the rendered UI's actual affordances.

3. **Dead Code Not Self-Detected (Story 5-3, M1):**
   - `Number.isFinite(lm.visibility) && lm.visibility !== undefined` — the second condition is unreachable since `Number.isFinite(undefined) === false`.
   - The guard pattern came directly from the story's Dev Notes code snippet.
   - Small issue, but indicates dev agents don't always audit code guards they write — they trust that copy-from-notes patterns are correct.

4. **Style Inconsistency Not Caught Pre-Review (Story 5-3, M3):**
   - `LIGHTING_SAMPLE_INTERVAL_MS = 2000` while `SCENE_SAMPLE_INTERVAL_MS = 2_000` directly above it.
   - The underscore numeric separator convention was established in the same file. A simple before/after look at the constant block would have caught this.
   - Suggests the dev agent may add constants without scanning the immediate surrounding context for style patterns.

---

## Key Insights

1. **The detect → hook → component pattern is Epic 5's biggest success — and now its ceiling.** Epic 6 does not follow this pattern. Stories 6.1–6.4 (smart capture, audio, haptic) and 6.5–6.6 (photo preview, save to camera roll) require photo capture, canvas APIs, file system access, screen transitions, and audio playback. The architecture patterns from Epics 4–5 won't transfer directly. Story files for Epic 6 must be more explicit about the new patterns being established.

2. **A missing test file is worse than a shallow test.** AI-4 was about "shallow assertions" — tests that exist but verify too little. Story 5-4 surfaced a prior failure mode: a modified component with a user-visible change had no test file at all. The test coverage rule should check both test depth AND test file existence for modified components.

3. **Story Dev Notes can carry bugs.** When a story's Dev Notes provide implementation guidance (code snippets), that guidance is treated as ground truth. Story 5-4's Dev Notes specified the body text copy, including the "Tap Retry" instruction that contradicted the actual button visibility. Pre-implementation AC cross-checking against the guidance snippets would catch this before coding begins.

4. **The watchdog fix (Story 5-4 AC2) was the most impactful change of the epic.** The original bug meant `detectionLostAtom` only fired when the worker hung entirely — not when a person left the frame. This was a fundamental behavioral gap that PT-2 (from Epic 4 retro) identified as needing investigation. Having a preparation task that specifically asked someone to review existing infrastructure prevented this from being a surprise mid-development.

---

## Action Items

### Process Improvements

| ID           | Action                                                                                                                                                                                                                                                                           | Owner                | Success Criteria                              | Priority |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------- | :-------------------------------------------- | :------- |
| AI-1         | **Test File Completeness Rule**: Every modified component in a story's File List must have an associated test file also in the File List (or an explicit justification for why no test is needed). Dev agent must not treat "copy substitution" as non-testable behavior change. | Dana (QA)            | 0 code review findings for missing test files | HIGH     |
| AI-2         | **UI-Copy / Feature Parity Check**: Any body text that references a UI action ("Tap X", "Click Y") must be verified against the actual rendered component to confirm that action exists in the same code path. Add to story review checklist.                                    | Charlie (Senior Dev) | 0 copy-UI mismatch findings in review         | MEDIUM   |
| AI-3 (carry) | **Test Assertion Depth Rule** (AI-4 from Epic 4): Continue enforcing depth on new tests. Combined with AI-1 above.                                                                                                                                                               | Dana (QA)            | 0 shallow assertion findings                  | HIGH     |

### Technical Debt

| ID   | Item                                                                                                                                                                                                                                                              | Priority | Notes                                 |
| :--- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :------------------------------------ |
| TD-1 | Update `epic-5` status from `in-progress` to `done` in sprint-status.yaml                                                                                                                                                                                         | LOW      | Housekeeping                          |
| TD-2 | All detection hooks retain state when landmarks disappear (documented intentional design). Epic 6 introduces photo capture — if capture happens when `detectionLostAtom = true`, the captured frame quality may be low. Consider whether capture should be gated. | MEDIUM   | Epic 6 Story 6.1 / 6.2 should address |

### Epic 6 Preparation Tasks

| ID   | Task                                                                                                                                                                                                    | Owner                           |
| :--- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------ |
| PT-1 | Research canvas `drawImage` + `toBlob` approach for video frame capture (Story 6.1 / 6.2). Confirm `HTMLVideoElement` → `HTMLCanvasElement` → `Blob` pipeline works in mobile Safari (PWA context).     | Charlie (Senior Dev)            |
| PT-2 | Research `navigator.vibrate` and Web Audio API availability in PWA context. Test on target devices before Story 6.3 / 6.4 implementation.                                                               | Charlie (Senior Dev)            |
| PT-3 | Design photo preview screen state management — how does the app transition from camera view to preview and back? What atom/router pattern manages this? Confirm with architecture doc before Story 6.5. | Bob (SM) + Charlie (Senior Dev) |
| PT-4 | Create story files for 6-1 through 6-6                                                                                                                                                                  | Bob (SM)                        |

---

## Readiness Assessment

| Area                  | Status          | Notes                                                                                                              |
| :-------------------- | :-------------- | :----------------------------------------------------------------------------------------------------------------- |
| Testing & Quality     | Strong          | ~273 tests, all suites passing, 0 failures                                                                         |
| Foundation for Epic 6 | Partially Ready | Detection and pose matching stable; photo capture infrastructure does not yet exist                                |
| Dependencies          | Complete        | All Epic 6 stories depend on camera/detection work fully delivered in Epics 1–5                                    |
| Technical Health      | Good            | No pre-existing test failures, no open tech debt blocking Epic 6                                                   |
| New Territory Risk    | Moderate        | Epic 6 introduces browser APIs (canvas, file save, audio, vibration) not used before — requires PT-1/PT-2 research |
| Unresolved Blockers   | None            |                                                                                                                    |

**Epic Update Required:** NO — Epic 6 stories are well-defined and can proceed as planned. However, PT-1 through PT-3 preparation tasks are higher-stakes than usual given the new API territory. Stories 6.1 (auto-capture) and 6.5 (photo preview) have the most architectural unknowns and should be implemented first.

---

## Conclusion

Epic 5 delivered all 4 Subject Detection & Edge Case Handling stories with 100% completion and zero debug issues. The detect → hook → component pattern — first established in Epic 2 and refined through Epics 3 and 4 — scaled cleanly to three new detection types (distance, framing, lighting), confirming that architectural investment has continued to pay dividends.

The epic's standout moment was Story 5-4 closing the loop on a systemic design question raised by the 5-3 code review: by making `detectionLostAtom` the authoritative "no person in frame" signal with a unified priority chain, the team eliminated a class of stuck-warning UX bugs without touching the individual detection hooks. This design pattern — one authoritative failure signal suppressing all lower-priority warnings — is well-documented and should be consulted when Epic 7/8 add new edge case handling.

The main improvement area is test coverage completeness for modified components. Story 5-4's `CameraErrorBanner` had zero test coverage despite a user-visible behavior change, leading to a body text / UI parity bug that only surfaced in adversarial review. The new AI-1 action item makes test file existence an explicit requirement for modified components in the story's File List.

Test suite health: ~273 tests, all suites passing. Previous retro action item follow-through: 86% (up from 75% in Epic 4, 44% in Epic 3). The team continues to improve on process consistency.

Epic 6 (Smart Capture & Output) is a significant departure from the detection-focused work of Epics 2–5. Three preparation research tasks (canvas API, Web Audio/vibration, photo preview routing) are recommended before implementation begins to reduce mid-story surprises.

**Status:** Retrospective Complete. Ready for Epic 6 Planning.
