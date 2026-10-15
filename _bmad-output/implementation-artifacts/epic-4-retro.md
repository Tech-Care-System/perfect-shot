# Retrospective: Epic 4 - Pose Library & AI Recommendation

**Participants:** Z3tz3r0 (Project Lead), Bob (Scrum Master), Alice (Product Owner), Charlie (Senior Dev), Dana (QA Engineer), Elena (Junior Dev)

---

## Epic Summary

**Epic 4: Pose Library & AI Recommendation**

- **Status:** Completed (4/4 Stories)
- **Delivery:** 100% Completion
- **Agent:** Claude Opus 4.6 (all stories)

### Stories Delivered

| Story | Title                             | Debug Issues                       | Review Fixes                                                                              | Tests Added |
| :---- | :-------------------------------- | :--------------------------------- | :---------------------------------------------------------------------------------------- | :---------- |
| 4-1   | Pose Library Data Structure       | 0                                  | Regenerate pose data for similarity < 0.7, derive SceneType, add tests                    | 8           |
| 4-2   | Pose Loading and State Management | 1 (file extension .ts→.tsx)        | Wire usePoseLibrary in CameraScreen, JSDoc, cross-scene test                              | 18          |
| 4-3   | Scene-Based Pose Recommendation   | 2 (fixture realism, effect timing) | Refactor hook to use atoms directly, fix test fixtures, lower threshold, add missing test | 16          |
| 4-4   | Next Pose Button                  | 0                                  | API consistency (selectPose reset), CameraScreen test, nextPoseAtom for stable callback   | 3+          |

### Metrics

| Metric                         | Value                        | Notes                                                                       |
| :----------------------------- | :--------------------------- | :-------------------------------------------------------------------------- |
| **Completed Stories**          | 4 / 4                        | All planned stories done                                                    |
| **Test Coverage Growth**       | 114 → 163 tests (+43%)       | Consistent growth across all stories                                        |
| **Test Suites**                | 21, all passing              | Pre-existing pose-detector.test.ts failure resolved                         |
| **Code Review Issues**         | All resolved in single cycle | No Changes Requested requiring major rework                                 |
| **Production Incidents**       | 0                            | Clean epic                                                                  |
| **Existing Component Changes** | 0                            | FeedbackGlow, WireframeCanvas, PoseHintCard, PoseCorrectionPrompt unchanged |
| **Agent Consistency**          | 100%                         | Claude Opus 4.6 for all stories                                             |

---

## Previous Retrospective Follow-Through (Epic 3)

| ID   | Action Item                                    | Status     | Evidence                                                                                                                                                    |
| :--- | :--------------------------------------------- | :--------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI-1 | Timer/Lifecycle Pre-Review Checklist           | ✅ Done    | 0 timer-related issues in Epic 4 (no stories used setTimeout/setInterval)                                                                                   |
| AI-2 | Test Assertion Depth Rule                      | ⏳ Partial | Reviews still caught test fixture realism (4.3 sofa) and missing tests (4.3 low-visibility, 4.4 score reset), but no HIGH-severity shallow assertion issues |
| AI-3 | JSDoc for All Public Atoms/Types               | ✅ Done    | Story 4.2 review added JSDoc to all new atoms; subsequent stories maintained                                                                                |
| TD-1 | Fix pre-existing pose-detector.test.ts failure | ✅ Done    | 21/21 suites pass, 163/163 tests — 0 pre-existing failures                                                                                                  |

**Assessment:** 3 of 4 items completed, 1 partial. Improvement rate continues upward: Epic 1→2 was poor, Epic 2→3 was 4/9 (44%), Epic 3→4 is 3/4 (75%). Enforced items succeed; aspirational items were already dropped in Epic 3 retro. The remaining partial item (AI-2 test depth) needs continued enforcement.

---

## What Went Well (Successes)

1. **Architecture Payoff — Zero Existing Component Changes:**
   - Stories 4.2-4.4 required no modifications to FeedbackGlow, WireframeCanvas, PoseHintCard, or PoseCorrectionPrompt.
   - The Jotai atom pattern (selectPoseAtom syncing 3 atoms atomically) and existing null guards meant new features "just worked" through the existing UI pipeline.
   - Story 4.4 (Next Pose Button) was essentially pure wiring — 2 lines in CameraScreen, 2 lines in use-pose-library.ts.

2. **Clean Data Pipeline:**
   - PosePreset → selectPoseAtom → targetPoseAtom/poseHintAtom → UI components.
   - The data flow established in Story 4.2 was consumed unchanged by Stories 4.3 and 4.4.
   - POSES_BY_SCENE direct lookup eliminated filtering overhead.

3. **Test Suite Health:**
   - Test count grew from 114 to 163 (+43%).
   - Pre-existing pose-detector.test.ts failure (carried from Epic 3) is resolved.
   - Full suite: 21 suites, 163 tests, 0 failures.

4. **Previous Retro Follow-Through:**
   - 75% completion rate on action items (up from 44% in Epic 2→3).
   - JSDoc standard now consistently applied.
   - Timer checklist ready for future use.

5. **Story 4.1 Clean Implementation:**
   - No debug issues — data structure + types + tests all passed first time.
   - 13 pose presets with anatomically distinct landmark positions, all within-scene pairs with cosine similarity < 0.7.

6. **Code Review Effectiveness:**
   - All stories approved in single review cycle.
   - Review caught API consistency, hook composition, and test quality issues consistently.

---

## What Can Be Improved (Challenges)

1. **Test Fixture Realism (Story 4.3):**
   - Sofa test fixture had reclined shoulders too close to hips in Y, creating a tiny torso height.
   - This caused the knee ratio to hit the threshold boundary and fall through to stage classification instead of sofa.
   - Root cause: Fixture values were chosen for "approximate correctness" rather than validated against threshold boundaries.
   - Impact: Required fixture regeneration and threshold adjustment (RECLINED_TORSO_ANGLE_THRESHOLD 70° → 30°).

2. **Hook Composition Complexity (Story 4.3):**
   - Initial implementation called `usePoseLibrary()` inside `useSceneDetection()`.
   - This created duplicate hook invocation in CameraScreen (both CameraScreen and useSceneDetection calling usePoseLibrary).
   - Refactored to use atoms directly (`useAtomValue(selectedSceneAtom)`, `useSetAtom(selectPoseAtom)`).
   - Pattern lesson: Hooks that subscribe to shared atoms should not nest other hooks that also subscribe to those atoms.

3. **Effect Timing Race Condition (Story 4.3):**
   - First-detection bypass (AC7) checked `currentPose === null` to detect initial state.
   - But `usePoseLibrary` auto-init effect sets `currentPoseAtom` before `useSceneDetection` effects run.
   - The null check never triggered because the auto-init always ran first.
   - Fixed by simplifying to a `hasFirstDetectionRef` flag that tracks first valid frame regardless of currentPose state.

4. **API Consistency Gaps (Story 4.4):**
   - `selectPose` didn't reset `poseScoreAtom` and `poseCorrectionAtom` like `nextPose` and `selectScene` did.
   - All three functions change the active pose but had different side effects.
   - Code review caught this and enforced consistency — all pose-changing functions now reset score/correction.

5. **Re-render Optimization (Story 4.4):**
   - `nextPose` as a `useCallback` in `usePoseLibrary` had `availablePoses` and `currentPose` in its dependency array.
   - This meant the callback identity changed on every pose change, causing ControlBar to re-render unnecessarily.
   - Moved to `nextPoseAtom` write-only atom for a stable callback reference.

---

## Key Insights

1. **Architecture investment compounds over time.** Epic 4 required zero existing component changes despite adding 3 new features (pose loading, scene detection, next pose cycling). The Jotai atom pattern and null guards established in Epics 2-3 made new features plug-and-play. Story 4.4 was nearly zero-code because everything was pre-wired.

2. **Geometric heuristic tests are uniquely fragile.** Unlike boolean or string assertions, geometric thresholds create boundary conditions that test fixtures can accidentally straddle. Test fixtures for landmark-based classification need validation against actual threshold values, not just "looks about right" coordinates.

3. **Hook nesting creates hidden coupling.** Calling one custom hook inside another that shares atom subscriptions creates duplicate subscriptions, redundant effects, and re-render chains. The fix — reading atoms directly — is simpler and more explicit. This pattern will recur in Epic 5.

4. **API surface consistency requires deliberate effort.** When multiple functions have similar purposes (selectPose, nextPose, selectScene all change the active pose), their side effects must be identical. AI dev agents don't naturally enforce this — it requires review checklist items.

---

## Action Items

### Process Improvements

| ID           | Action                                                                                                                                                                                             | Owner                | Success Criteria                               | Priority |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------- | :--------------------------------------------- | :------- |
| AI-1         | **Realistic Test Fixture Rule**: Geometric heuristic tests must use anatomically plausible landmark positions. Fixtures should be validated against threshold boundaries before committing.        | Dana (QA)            | 0 test fixture realism issues caught in review | HIGH     |
| AI-2         | **Hook Composition Rule**: Hooks subscribing to shared atoms must not call other hooks that also subscribe to those atoms. Use atoms directly to avoid duplicate invocations and re-render chains. | Charlie (Senior Dev) | 0 duplicate hook invocation issues             | HIGH     |
| AI-3         | **API Consistency Check**: All write functions operating on the same domain must have consistent side effects. Add explicit check to review checklist.                                             | Charlie (Senior Dev) | 0 API inconsistency issues found in review     | MEDIUM   |
| AI-4 (carry) | **Test Assertion Depth Rule** (from Epic 3 AI-2): Continue enforcing. Tests must verify behavior values, not just existence.                                                                       | Dana (QA)            | 0 shallow assertion findings                   | HIGH     |

### Technical Debt

| ID   | Item                                                                      | Priority | Notes                               |
| :--- | :------------------------------------------------------------------------ | :------- | :---------------------------------- |
| TD-1 | Update `epic-4` status from `in-progress` to `done` in sprint-status.yaml | LOW      | Housekeeping — all stories complete |

### Epic 5 Preparation Tasks

| ID   | Task                                                                                                                                 | Owner                |
| :--- | :----------------------------------------------------------------------------------------------------------------------------------- | :------------------- |
| PT-1 | Research lighting detection approach for Story 5.3 — landmark confidence/visibility as proxy vs pixel-level analysis vs skip for MVP | Charlie (Senior Dev) |
| PT-2 | Review `detectionLostAtom` implementation from Epic 2 for Story 5.4 readiness                                                        | Charlie (Senior Dev) |
| PT-3 | Create story files for 5-1 through 5-4                                                                                               | Bob (SM)             |

---

## Readiness Assessment

| Area                  | Status   | Notes                                                               |
| :-------------------- | :------- | :------------------------------------------------------------------ |
| Testing & Quality     | Strong   | 163 tests, 21 suites, 0 failures                                    |
| Foundation for Epic 5 | Ready    | poseResultAtom, detectScene pattern, detectionLostAtom all in place |
| Dependencies          | Complete | All Epic 5 dependencies from Epic 4 are stable                      |
| Technical Health      | Good     | Clean test suite, architecture scales well, no new tech debt        |
| Unresolved Blockers   | None     |                                                                     |

**Epic Update Required:** NO — No significant discoveries that change Epic 5 direction. Stories 5.1-5.2 follow the established geometric heuristic pattern from detectScene. Story 5.3 needs research (PT-1) but the AC explicitly allows basic implementation. Story 5.4 has existing infrastructure (detectionLostAtom).

---

## Next Steps

1. **Update sprint-status.yaml** — mark epic-4 as done, epic-4-retrospective as done
2. **Research lighting detection** approach before Story 5.3 (PT-1)
3. **Review detectionLostAtom** for Story 5.4 readiness (PT-2)
4. **Create story files** for Epic 5 stories 5-1 through 5-4 (PT-3)
5. **Apply new process improvements** (fixture realism, hook composition, API consistency) starting with first Epic 5 story

---

## Conclusion

Epic 4 delivered the complete Pose Library & AI Recommendation feature in 4 stories with 100% completion. The most notable outcome is architecture payoff: zero existing UI components were modified despite adding pose loading, scene-based detection, and manual pose cycling. Story 4.4 was essentially zero-code wiring, demonstrating that the Jotai atom pattern and component composition established in earlier epics scale effectively.

The main challenges concentrated in Story 4.3 (scene detection), which combined geometric heuristics, hook composition, and effect timing — producing the epic's only debug issues. Test fixture realism and hook nesting emerged as patterns requiring deliberate attention in future epics with similar landmark-based classification work.

Test suite health is strong: 163 tests across 21 suites with 0 failures (resolving the pre-existing pose-detector.test.ts failure from Epic 3). Previous retro action item follow-through improved to 75% (from 44% in the prior cycle).

Epic 5 (Subject Detection & Edge Case Handling) follows established patterns for 3 of 4 stories. Only Story 5.3 (lighting) introduces a potentially new capability. All dependencies are in place. The team is ready.

**Status:** Retrospective Complete. Ready for Epic 5 Planning.
