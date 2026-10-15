# Code Review Findings

**Reviewer:** Z3tz3r0 (AI Senior Developer)  
**Story:** `_bmad-output/implementation-artifacts/2-3-real-time-pose-detection-loop.md`

## Summary

- Git vs Story discrepancies: 8
- Issues found: 5 High, 3 Medium, 1 Low
- Review outcome: Changes Requested
- Chosen action: Create action items in story (no code auto-fix in this pass)

## Findings

1. [HIGH] AC5 recovery flow is missing: loop is not paused on worker failure, no one-time restart, and no toast fallback notification.  
   Evidence: `src/lib/hooks/use-pose-detection.ts:95`
2. [HIGH] AC3 "detection lost for >3 seconds" notification is missing.  
   Evidence: `src/lib/hooks/use-pose-detection.ts:37`
3. [HIGH] AC4 UI integration is incomplete: no UI subscriber/health indicator for FPS updates.  
   Evidence: `src/lib/stores/pose-store.ts:14`
4. [HIGH] Task 5.4 is marked done, but tests do not verify recovery logic behavior.  
   Evidence: `src/lib/hooks/use-pose-detection.test.ts:139`
5. [HIGH] Task 5.3 is marked done, but tests do not verify "no re-render" behavior; only atom update is asserted.  
   Evidence: `src/lib/hooks/use-pose-detection.test.ts:109`
6. [MEDIUM] Task 3.3 claim mismatch: `startDetection` does not gate activation on `video.readyState >= 2`.  
   Evidence: `src/lib/hooks/use-pose-detection.ts:84`
7. [MEDIUM] FPS bootstrap logic can emit an inaccurate initial sample because `lastFpsUpdateAt` starts at `0`.  
   Evidence: `src/lib/ai/worker.ts:10`
8. [MEDIUM] Story Dev Agent Record `File List` is empty despite multiple changed source files in git.  
   Evidence: `_bmad-output/implementation-artifacts/2-3-real-time-pose-detection-loop.md:190`
9. [LOW] Direct `console.error` usage breaks project logging consistency and creates noisy test output.  
   Evidence: `src/lib/ai/pose-detector.ts:54`, `src/lib/ai/worker.ts:131`

## Workflow Actions Applied

- Added `Review Follow-ups (AI)` with 9 action items in story Tasks/Subtasks.
- Updated story status to `in-progress`.
- Synced sprint status: `2-3-real-time-pose-detection-loop -> in-progress`.
