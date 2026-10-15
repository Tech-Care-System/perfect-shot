# Test Design: Epic 2 - Real-time Pose Detection & Wireframe

**Author:** Z3tz3r0
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Epic 2 (Web Worker, MediaPipe, Real-time Loop, Wireframe)

**Risk Summary:**

- Total risks identified: 5
- High-priority risks (≥6): 3
- Critical categories: TECH, PERF

**Coverage Summary:**

- P0 scenarios: 8 (16 hours)
- P1 scenarios: 12 (12 hours)
- P2/P3 scenarios: 10 (5 hours)
- **Total effort:** 33 hours (~4 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description                                                   | Probability  | Impact       | Score | Mitigation                                                                                                                 | Owner | Timeline |
| ------- | -------- | ------------------------------------------------------------- | ------------ | ------------ | ----- | -------------------------------------------------------------------------------------------------------------------------- | ----- | -------- |
| R-001   | TECH     | Web Worker communication failure (message loss/type mismatch) | 2 (Possible) | 3 (Critical) | 6     | Use strongly-typed discriminated unions (Zod validation); Implement heartbeat/ack mechanism                                | Dev   | Sprint 2 |
| R-002   | PERF     | Model loading exceeds 2.5s on slow networks                   | 2 (Possible) | 3 (Critical) | 6     | Implement preload strategy; Cache model in IndexedDB/CacheStorage; Show granular progress indicator                        | Dev   | Sprint 2 |
| R-003   | PERF     | FPS drops below 30 on low-end devices causing laggy UI        | 3 (Likely)   | 2 (Degraded) | 6     | Implement adaptive resolution scaling; Throttle detection loop based on device capability; Use `requestVideoFrameCallback` | Dev   | Sprint 2 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description                                    | Probability  | Impact       | Score | Mitigation                                                                            | Owner |
| ------- | -------- | ---------------------------------------------- | ------------ | ------------ | ----- | ------------------------------------------------------------------------------------- | ----- |
| R-004   | UX       | Wireframe overlay misalignment with video feed | 2 (Possible) | 2 (Degraded) | 4     | Ensure canvas aspect ratio strictly matches video stream; Handle window resize events | Dev   |
| R-005   | BUS      | AI detection drift or false positives          | 2 (Possible) | 2 (Degraded) | 4     | Add confidence threshold filtering; Smooth landmarks over time (EMA smoothing)        | Dev   |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description                                  | Probability  | Impact       | Score | Action                                 |
| ------- | -------- | -------------------------------------------- | ------------ | ------------ | ----- | -------------------------------------- |
| R-006   | DATA     | Memory leak from continuous array allocation | 1 (Unlikely) | 2 (Degraded) | 2     | Monitor heap usage; Reuse typed arrays | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture
- **SEC**: Security
- **PERF**: Performance
- **DATA**: Data Integrity
- **BUS**: Business Impact
- **OPS**: Operations

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement                      | Test Level  | Risk Link | Test Count | Owner | Notes                                         |
| -------------------------------- | ----------- | --------- | ---------- | ----- | --------------------------------------------- |
| Story 2.1: Worker Initialization | Unit        | R-001     | 2          | Dev   | Verify distinct INIT/READY message cycle      |
| Story 2.1: Message Typing        | Unit        | R-001     | 2          | Dev   | Validation of discriminated unions            |
| Story 2.2: Model Loading Success | Integration | R-002     | 1          | QA    | Mock CDN response; Verify success state       |
| Story 2.2: Model Loading Retry   | Integration | R-002     | 1          | QA    | Mock network failure; Verify retry logic (3x) |
| Story 2.3: Detection Loop Output | Integration | R-003     | 2          | QA    | Verify DETECT input yields POSE_RESULT output |

**Total P0**: 8 tests, 16 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement                        | Test Level  | Risk Link | Test Count | Owner | Notes                                                 |
| ---------------------------------- | ----------- | --------- | ---------- | ----- | ----------------------------------------------------- |
| Story 2.3: Zero Detection Handling | Unit        | R-005     | 2          | Dev   | Verify empty result when no person visible            |
| Story 2.4: Wireframe Rendering     | Component   | R-004     | 4          | Dev   | Verify canvas matches video dimensions; Z-index check |
| Story 2.4: Landmark Mapping        | Unit        | R-004     | 4          | Dev   | Verify coordinate transformation logic                |
| Story 2.2: Loading Timeout         | Integration | R-002     | 2          | QA    | Verify error handling on timeout                      |

**Total P1**: 12 tests, 12 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement                     | Test Level  | Risk Link | Test Count | Owner | Notes                                                 |
| ------------------------------- | ----------- | --------- | ---------- | ----- | ----------------------------------------------------- |
| Story 2.3: FPS Reporting        | Unit        | -         | 2          | Dev   | Verify FPS calculation logic                          |
| Story 2.4: Visibility Threshold | Unit        | -         | 4          | Dev   | Verify low confidence points are not drawn            |
| Story 2.1: Worker Termination   | Unit        | R-006     | 2          | Dev   | Verify cleanup on unmount                             |
| Story 2.3: Multiple People      | Integration | -         | 2          | QA    | Verify behavior with >1 person (should track primary) |

**Total P2**: 10 tests, 5 hours

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement                     | Test Level | Test Count | Owner | Notes               |
| ------------------------------- | ---------- | ---------- | ----- | ------------------- |
| Story 2.3: Low Light Conditions | Manual     | 1          | QA    | Exploratory testing |
| Story 2.3: Fast Movement Blur   | Manual     | 1          | QA    | Exploratory testing |

**Total P3**: 2 tests, 2 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] Worker initializes successfully (Unit)
- [ ] Mock detection returns result (Integration)

**Total**: 2 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] Worker message type validation (Unit)
- [ ] Model loading success path (Integration)
- [ ] Model loading retry logic (Integration)

**Total**: 8 scenarios

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] Wireframe canvas sizing (Component)
- [ ] Coordinate mapping correctness (Unit)

**Total**: 12 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] FPS calculation (Unit)
- [ ] Cleanup logic (Unit)

**Total**: 10 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority  | Count  | Hours/Test | Total Hours | Notes                                   |
| --------- | ------ | ---------- | ----------- | --------------------------------------- |
| P0        | 8      | 2.0        | 16          | Worker architecture setup, mocking WASM |
| P1        | 12     | 1.0        | 12          | Canvas interaction tests                |
| P2        | 10     | 0.5        | 5           | Logic unit tests                        |
| P3        | 2      | 1.0        | 2           | Manual exploration                      |
| **Total** | **32** | **-**      | **35**      | **~4.5 days**                           |

### Prerequisites

**Test Data:**

- **Mock Video Frames**: TypedArray fixtures representing video data.
- **Mock Landmark Data**: JSON fixtures of MediaPipe output.

**Tooling:**

- **Vitest**: For worker unit tests (jsdom environment).
- **Playwright**: For integration tests (mocking network/worker if possible, or browser-based).

**Environment:**

- **CI Runner**: Must support WASM and ample memory for model loading.

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95%
- **High-risk mitigations**: 100% complete
- **Performance**: Model load < 2.5s (simulated network)

### Mitigation Plans

### R-001: Web Worker communication failure (Score: 6)

**Mitigation Strategy:** Implement strict `zod` validation for all worker messages. Add a heartbeat ping/pong on init to confirm channel stability.
**Owner:** Dev
**Timeline:** Story 2.1 Implementation
**Status:** Planned
**Verification:** Unit tests for invalid message rejection.

### R-002: Model loading exceeds 2.5s (Score: 6)

**Mitigation Strategy:** Use `CacheStorage` API or `IndexedDB` to persist model files after first load.
**Owner:** Dev
**Timeline:** Story 2.2 Implementation
**Status:** Planned
**Verification:** Network-throttled browser test.

### R-003: FPS drops below 30 (Score: 6)

**Mitigation Strategy:** Measure `delta` between frames. If processing > 33ms, skip frames (process every 2nd or 3rd frame).
**Owner:** Dev
**Timeline:** Story 2.3 Implementation
**Status:** Planned
**Verification:** Performance profiling test.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: __________________ Date: __________
- [ ] Tech Lead: __________________ Date: __________
- [ ] QA Lead: __________________ Date: __________

---

## Appendix

### Related Documents

- Epic 2: `planning-artifacts/epics/epic-2-real-time-pose-detection-wireframe.md`
- Architecture: `planning-artifacts/architecture/core-architectural-decisions.md`

**Generated by:** BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
