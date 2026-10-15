# Test Design: Epic 1 - Project Foundation & Camera Access

**Author:** Z3tz3r0
**Status:** Approved

---

## Executive Summary

**Scope:** Full test design for Epic 1 (Project Foundation & Camera Access)

**Risk Summary:**

- Total risks identified: 6
- High-priority risks (≥6): 2
- Critical categories: TECH, SEC, PERF

**Coverage Summary:**

- P0 scenarios: 5 (10 hours)
- P1 scenarios: 8 (8 hours)
- P2/P3 scenarios: 12 (6.5 hours)
- **Total effort**: 24.5 hours (~3 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description                                                     | Probability | Impact | Score | Mitigation                                                                     | Owner  | Timeline |
| ------- | -------- | --------------------------------------------------------------- | ----------- | ------ | ----- | ------------------------------------------------------------------------------ | ------ | -------- |
| R-101   | TECH     | `getUserMedia` fails on specific device tiers or configurations | 2           | 3      | 6     | Implement abstract camera utility with fallback constraints and error mapping. | DEV    |          |
| R-102   | BUS      | Browser camera permission denial leads to dead-end UI           | 2           | 3      | 6     | Detailed explanation screen (Story 1.2) with settings deep-link instructions.  | UX/DEV |          |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description                                                   | Probability | Impact | Score | Mitigation                                                          | Owner |
| ------- | -------- | ------------------------------------------------------------- | ----------- | ------ | ----- | ------------------------------------------------------------------- | ----- |
| R-103   | PERF     | Model initialization (Story 1.1) takes >5s on low-end devices | 3           | 1      | 3     | Implement "Loading" states and Jotai-based initialization tracking. | DEV   |
| R-104   | DATA     | Inconsistent camera enumeration (multiple cameras)            | 2           | 2      | 4     | Robust camera selection logic within the Camera component.          | DEV   |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description                                     | Probability | Impact | Score | Action                                                       |
| ------- | -------- | ----------------------------------------------- | ----------- | ------ | ----- | ------------------------------------------------------------ |
| R-105   | OPS      | PWA manifest/icons missing for Camera API trust | 1           | 2      | 2     | Ensure Story 1.1 includes standard PWA boilerplate.          | DEV |
| R-106   | UX       | Jarring mirror/non-mirror transitions           | 1           | 1      | 1     | CSS scale(-1, 1) applied consistently to front camera atoms. | DEV |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement                  | Test Level  | Risk Link | Test Count | Owner | Notes                              |
| ---------------------------- | ----------- | --------- | ---------- | ----- | ---------------------------------- |
| Camera Permission Grant      | E2E         | R-102     | 2          | QA    | Test success and persistence       |
| Camera Stream Initialization | Integration | R-101     | 3          | QA    | Mock `getUserMedia` success        |
| UI explanations for denial   | Component   | R-102     | 1          | DEV   | Verify instruction text visibility |

**Total P0**: 6 tests, 12 hours (including setup)

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement          | Test Level  | Risk Link | Test Count | Owner | Notes                              |
| -------------------- | ----------- | --------- | ---------- | ----- | ---------------------------------- |
| Front/Back Toggle    | E2E         | R-104     | 2          | QA    | Verify deviceId switching          |
| Mirroring Logic      | Component   | R-106     | 2          | DEV   | Verify CSS class application       |
| Build & Initial Load | Integration | R-103     | 1          | DEV   | Check Jotai state 'ready' timeline |

**Total P1**: 5 tests, 5 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement              | Test Level | Risk Link | Test Count | Owner | Notes                                   |
| ------------------------ | ---------- | --------- | ---------- | ----- | --------------------------------------- |
| Multi-browser detection  | Unit       | R-104     | 4          | DEV   | Test `navigator.mediaDevices` mock      |
| Permission re-check loop | Component  | R-102     | 1          | DEV   | Verify event listener for return-to-tab |

**Total P2**: 5 tests, 2.5 hours

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement                 | Test Level | Test Count | Owner | Notes                            |
| --------------------------- | ---------- | ---------- | ----- | -------------------------------- |
| Resource cleanup on unmount | Unit       | 2          | DEV   | Verify `stop()` called on tracks |

**Total P3**: 2 tests, 0.5 hours

---

## Execution Order

### Smoke Tests (<2 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] App loads and root div exists (30s)
- [ ] Jotai store initialized (30s)
- [ ] Welcome screen visible (30s)

**Total**: 3 scenarios

### P0 Tests (<5 min)

**Purpose**: Critical path validation

- [ ] User grants camera access (E2E)
- [ ] Camera preview displays valid stream dimensions (Integration)
- [ ] Denial screen shows "Settings" instructions (Component)

**Total**: 3 scenarios

### P1 Tests (<15 min)

**Purpose**: Important feature coverage

- [ ] Switch to front camera mirrors video (E2E)
- [ ] Next.js production build succeeds (Integration)

**Total**: 2 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority  | Count  | Hours/Test | Total Hours | Notes                           |
| --------- | ------ | ---------- | ----------- | ------------------------------- |
| P0        | 6      | 2.0        | 12.0        | Mocking mediaDevices is complex |
| P1        | 5      | 1.0        | 5.0         | Standard UI testing             |
| P2        | 5      | 0.5        | 2.5         | Granular unit logic             |
| P3        | 2      | 0.25       | 0.5         | Cleanup checks                  |
| **Total** | **18** | **-**      | **20.0**    | **~2.5 days**                   |

### Prerequisites

**Test Data:**

- Reference MediaStream mock (fake data)
- Permission state variants (granted, denied, prompt)

**Tooling:**

- Vitest for Unit/Logic logic
- Playwright for E2E and Component tests
- `--use-fake-ui-for-media-stream` browser flag

**Environment:**

- CI runner with WebGL support for MediaPipe components even in foundation phase.

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95%
- **High-risk mitigations**: 100% complete

### Coverage Targets

- **Critical paths (Camera)**: ≥90%
- **Security (Permissions)**: 100%
- **Business logic**: ≥80%

---

## Assumptions and Dependencies

### Assumptions

1. Browser environment supports `navigator.mediaDevices` (addressed by PWA target).
2. Users are on modern mobile browsers (iOS 15+, Android Chrome 80+).

### Dependencies

1. Story 1.1 completion (Project Init) is a hard dependency for any automated tests.

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests for Camera Access.
- Run `*automate` once Epic 1 implementation is "ready-for-dev".

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
