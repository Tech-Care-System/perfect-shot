# Retrospective: Epic 3 - Pose Matching & Visual Feedback

**Participants:** Z3tz3r0 (Project Lead), Bob (Scrum Master), Alice (Product Owner), Charlie (Senior Dev), Dana (QA Engineer), Elena (Junior Dev)

---

## Epic Summary

**Epic 3: Pose Matching & Visual Feedback**

- **Status:** Completed (5/5 Stories)
- **Delivery:** 100% Completion
- **Agent:** Claude Opus 4.6 (all stories)

### Stories Delivered

| Story | Title                         | HIGH | MED | LOW | Tests | Review Outcome             |
| :---- | :---------------------------- | :--- | :-- | :-- | :---- | :------------------------- |
| 3-1   | Pose Similarity Calculation   | 3    | 3   | 2   | 20    | Changes Requested -> Fixed |
| 3-2   | FeedbackGlow Component        | 1    | 2   | 2   | 10    | Approved with fixes        |
| 3-3   | Target Pose Wireframe Overlay | 0    | 3   | 1   | 7     | Approved with fixes        |
| 3-4   | Pose Hint Card Component      | 0    | 3   | 2   | 4     | Approved with fixes        |
| 3-5   | Text Prompts for Corrections  | 1    | 2   | 2   | 10    | Approved with fixes        |

### Metrics

| Metric                             | Value                  | Notes                                                      |
| :--------------------------------- | :--------------------- | :--------------------------------------------------------- |
| **Completed Stories**              | 5 / 5                  | All planned stories done                                   |
| **Test Coverage Growth**           | 64 -> 114 tests (+78%) | Consistent growth across all stories                       |
| **Code Review Issues Found**       | 27 total               | 5 HIGH, 14 MEDIUM, 8 LOW                                   |
| **HIGH Issues per Story**          | 1.0 avg                | Down from 3.5 avg in Epic 2 (7 HIGH in 2 reviewed stories) |
| **Reviews Requiring Major Rework** | 0                      | All approved in single review cycle                        |
| **Production Incidents**           | 0                      | Clean epic                                                 |
| **Agent Consistency**              | 100%                   | Claude Opus 4.6 for all stories                            |

---

## Previous Retrospective Follow-Through (Epic 2)

| ID   | Action Item                                | Status           | Evidence                                                                                      |
| :--- | :----------------------------------------- | :--------------- | :-------------------------------------------------------------------------------------------- |
| AI-1 | Mandatory AC Verification Checklist        | ⏳ Partial       | No story had entire ACs missing (improvement over Story 2.3), but review still caught AC gaps |
| AI-2 | Dev Agent Record Completeness Gate         | ✅ Done          | All 5 stories have complete dev records: agent model, file list, completion notes             |
| AI-3 | Skill-First Development (carry from E1)    | ❌ Not Addressed | No "Skills Referenced" section in any story dev notes                                         |
| TD-1 | Verify Story 2.3 Rework Stability          | ⏳ Unknown       | No documentation of verification                                                              |
| TD-2 | CSP Configuration Audit                    | ❌ Not Addressed | No audit created                                                                              |
| TD-3 | Linux Camera Stabilization (carry from E1) | ❌ Not Addressed | No protocol created                                                                           |
| PT-1 | Complete Story 3-3 review                  | ✅ Done          | Story 3-3 reviewed and approved                                                               |
| PT-2 | Create story files for 3-4, 3-5            | ✅ Done          | Both story files created and completed                                                        |
| PT-3 | Research prefers-reduced-motion            | ✅ Done          | Implemented in Story 3.2 with usePrefersReducedMotion hook                                    |

**Assessment:** Improved follow-through vs Epic 1->2. 4 of 9 items completed, 2 partial, 3 not addressed. Items that were enforced (AI-2, preparation tasks) succeeded. Items that were aspirational (AI-3, TD-2, TD-3) were ignored. Pattern is clear: only commitments with concrete enforcement mechanisms get done.

---

## What Went Well (Successes)

1. **Agent Consistency:**
   - All 5 stories implemented by Claude Opus 4.6 via Ami.
   - Dev record quality uniformly high: agent model, completion notes, file lists all populated.
   - Contrast with Epic 2 where mixed agents (GPT-5, GPT-5 Codex CLI, unknown) produced wildly varying quality.
   - Direct result of enforcing Epic 2 AI-2 (dev record completeness gate).

2. **100% AC Coverage:**
   - No story had entirely missing acceptance criteria (improvement over Epic 2 Story 2.3).
   - Review findings were refinements (JSDoc, test depth, edge cases), not missing core functionality.
   - All reviews approved in single cycle — no Changes Requested requiring major rework.

3. **Test Coverage Growth (+78%):**
   - Test suite grew from 64 to 114 tests across the epic.
   - Coverage includes: cosine similarity math, translation/scale invariance, z-axis weighting, glow state transitions, flash lifecycle, wireframe draw order, accessibility attributes, hold timer behavior, body segment corrections.
   - Full regression suite: 16 suites, 114 tests, all pass (1 pre-existing failure in pose-detector.test.ts).

4. **Architecture Payoff — Code Reuse:**
   - Story 3.1 created `calculatePoseSimilarity`, `centerOnHips`, `normalizeByTorsoLength`, `extractMatchingLandmarks`.
   - Story 3.5 reused all four functions directly for correction generation — zero duplication.
   - Jotai atom pattern (`poseScoreAtom`, `targetPoseAtom`, `poseHintAtom`, `poseCorrectionAtom`) scaled cleanly across stories.
   - `DrawingStyle` interface from Epic 2 extended naturally to support target wireframe styling in Story 3.3.

5. **Accessibility Implementation:**
   - `prefers-reduced-motion` implemented in Story 3.2 (FeedbackGlow pulse animation disabled, transitions removed).
   - `aria-live="polite"` added to Stories 3.4 and 3.5 for screen reader support.
   - Accessibility was a first-class concern, not an afterthought.

6. **Review Efficiency:**
   - All 5 stories approved in single review cycle (vs Epic 2 where Story 2.3 required Changes Requested + full rework).
   - Average review findings: 1 HIGH, 2.8 MEDIUM, 1.6 LOW per story — manageable and constructive.

---

## What Can Be Improved (Challenges)

1. **Timer/Lifecycle Bugs (Recurring Pattern):**
   - Story 3.2: Stale `setTimeout` on rapid score oscillation — multiple timeouts without `clearTimeout` (HIGH).
   - Story 3.5: Hold timer bug — corrections permanently dropped when value changes within 1-second window (HIGH).
   - Both are async state management issues specific to `setTimeout` + `useRef` patterns.
   - Impact: 2 of 5 HIGH issues in the entire epic were timer-related.

2. **Shallow Test Assertions:**
   - Story 3.1: Test fixture scored 0.82 instead of < 0.5 (HIGH) — test passed but didn't verify the claimed behavior.
   - Story 3.3: Tests didn't verify wireframe style properties or drawing order (MEDIUM).
   - Story 3.4: Tests didn't verify AC2 styling classes or AC3 positioning (MEDIUM).
   - Story 3.5: No tests for 1-second hold timer behavior (MEDIUM).
   - Pattern: Tests are written to pass, not to verify behavior. "Does it render" is not the same as "does it render correctly."

3. **Undocumented Scope Changes:**
   - Story 3.1: `workerStatusRef`, loop refactor, and `readyState` gate removal in `use-pose-detection.ts` were not documented in completion notes or file list (HIGH).
   - Code changes were correct but invisible to reviewers without git diff.
   - Traceability gap between what changed and what was documented.

4. **JSDoc Inconsistency:**
   - Stories 3.1, 3.4, 3.5 all received MEDIUM findings for missing JSDoc on new atoms.
   - Existing atoms in `pose-store.ts` had JSDoc — new atoms should follow the same pattern.
   - Dev agents don't consistently follow existing file patterns for documentation.

5. **Carry-Forward Item Fatigue:**
   - AI-3 (Skill-First Development): carried from Epic 1 -> Epic 2 -> Epic 3. Never addressed. 3 epics of carry-forward.
   - TD-2 (CSP Audit), TD-3 (Linux Camera): carried from Epic 2. Never addressed.
   - Carry-forward without enforcement is ineffective. Items that aren't important enough to do should be dropped.

---

## Key Insights

1. **Agent consistency correlates strongly with quality consistency.** Single agent (Claude Opus 4.6) across all stories produced uniformly high quality. Mixed agents in Epic 2 produced volatile quality. Standardizing on a proven agent is a process improvement with measurable impact.

2. **Timer/lifecycle logic is a predictable weakness of AI dev agents.** Both HIGH issues in timer-heavy stories (3.2, 3.5) were the same class of bug: not clearing/handling previous async state before setting new state. This can be prevented with a targeted pre-review checklist.

3. **Enforced commitments produce results; aspirational ones don't.** AI-2 (dev record completeness) was enforced -> 100% compliance. AI-3 (skill-first) was aspirational -> 0% compliance. The lesson: make commitments concrete with enforcement mechanisms or don't make them.

4. **Architecture investment pays off.** The normalization pipeline, Jotai atoms, and drawing utilities created in earlier stories were reused extensively, reducing implementation effort and improving consistency.

---

## Action Items

### Process Improvements

| ID   | Action                                                                                                                                                                                                                             | Owner                | Success Criteria                              | Priority |
| :--- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------- | :-------------------------------------------- | :------- |
| AI-1 | **Timer/Lifecycle Pre-Review Checklist**: For any story using setTimeout/setInterval/useRef lifecycle, verify: (a) cleanup on unmount/re-render, (b) clear previous timers before setting new ones, (c) handle rapid state changes | Charlie (Senior Dev) | 0 timer-related HIGH issues in Epic 4         | HIGH     |
| AI-2 | **Test Assertion Depth Rule**: Every test must verify actual behavior values (colors, styles, call order, arguments), not just existence. "Does it render" is insufficient.                                                        | Dana (QA Engineer)   | Review finds 0 "test doesn't verify X" issues | HIGH     |
| AI-3 | **JSDoc for All Public Atoms/Types**: Every exported atom and type must have JSDoc before review submission                                                                                                                        | Dev Team             | 0 "missing JSDoc" review findings             | MEDIUM   |

### Carry-Forward Decisions

| ID                    | Original Item                     | Decision          | Reason                                                                                                                             |
| :-------------------- | :-------------------------------- | :---------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| AI-3 (E2) / AI-1 (E1) | Skill-First Development           | **DROPPED**       | Carried 3 epics, never addressed. Priority insufficient. AI agents use story context effectively without explicit skill reference. |
| TD-2 (E2)             | CSP Configuration Audit           | **DROPPED**       | Epic 3 added no external resources. Problem didn't recur. Will revisit if CSP issues resurface.                                    |
| TD-3 (E2) / AI-2 (E1) | Linux Camera Stabilization        | **DROPPED**       | Carried 3 epics, never addressed. Epic 4 doesn't touch camera hardware. No longer relevant.                                        |
| TD-1 (E2)             | Verify Story 2.3 Rework Stability | **CARRY FORWARD** | Still no evidence of verification. Must verify before any epic that modifies detection loop.                                       |

### Technical Debt

| ID   | Item                                                                                                                               | Owner                | Priority |
| :--- | :--------------------------------------------------------------------------------------------------------------------------------- | :------------------- | :------- |
| TD-1 | **Fix pre-existing pose-detector.test.ts failure**: 1 test expects old WASM path format. Mentioned since Story 3.1, still unfixed. | Charlie (Senior Dev) | MEDIUM   |

### Epic 4 Preparation Tasks

| ID   | Task                                                                                                     | Owner                |
| :--- | :------------------------------------------------------------------------------------------------------- | :------------------- |
| PT-1 | Create story files for 4-1 through 4-4                                                                   | Bob (SM)             |
| PT-2 | Research approach for generating target pose landmark data (capture from reference images vs hand-craft) | Charlie (Senior Dev) |

---

## Readiness Assessment

| Area                  | Status   | Notes                                                                                         |
| :-------------------- | :------- | :-------------------------------------------------------------------------------------------- |
| Testing & Quality     | Strong   | 114 tests pass; 1 pre-existing failure (pose-detector.test.ts)                                |
| Foundation for Epic 4 | Ready    | TargetPose type, targetPoseAtom, poseHintAtom, poseScoreAtom, poseCorrectionAtom all in place |
| Dependencies          | Complete | All Epic 4 dependencies from Epic 3 are implemented and stable                                |
| Technical Health      | Good     | No new tech debt from Epic 3; clean architecture reuse                                        |
| Unresolved Blockers   | None     |                                                                                               |

**Epic Update Required:** NO — No significant discoveries that change Epic 4 direction. All types, atoms, and utilities that Epic 4 needs are in place and tested.

---

## Next Steps

1. **Create story files** for Epic 4 stories 4-1 through 4-4
2. **Research target pose data generation** approach before Story 4-1
3. **Fix pose-detector.test.ts** pre-existing failure (TD-1)
4. **Apply new process improvements** (timer checklist, test depth rule, JSDoc standard) starting with first Epic 4 story
5. **Track action items** in standup — enforce, don't aspire

---

## Conclusion

Epic 3 represents a significant quality improvement over Epic 2. Using a single consistent AI agent (Claude Opus 4.6) eliminated the quality variance that plagued Epic 2, reducing HIGH issues from 7 to 5 while delivering 5 stories instead of 4. Test coverage grew 78% (64 -> 114 tests). All stories were approved in a single review cycle — no major rework required. The architecture investment from earlier epics paid off through extensive code reuse across stories.

The main areas for improvement are timer/lifecycle bugs (a predictable AI agent weakness) and shallow test assertions. Both are addressable with targeted checklists. The team made a deliberate decision to drop 3 carry-forward items that had been ignored for 3 epics, replacing them with focused, enforceable commitments.

Epic 4 (Pose Library & AI Recommendation) is a shift from infrastructure-heavy to data-centric work. All dependencies are in place. The team is well-positioned for continued delivery.

**Status:** Retrospective Complete. Ready for Epic 4 Planning.
