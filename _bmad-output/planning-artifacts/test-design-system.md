# System-Level Test Design - ai-perfect-shot

## Testability Assessment

- **Controllability:** **PASS**. The zero-backend architecture simplifies state management. Camera inputs can be controlled using browser flags (e.g., `--use-fake-ui-for-media-stream`), and AI inference can be mocked by injecting keypoint data into Jotai atoms or mocking the Web Worker messages.
- **Observability:** **PASS**. All critical application states (pose similarity, camera status, performance metrics) are managed through Jotai atoms, providing clear inspection points for automated tests. Performance can be monitored via `performance.now()` and standard browser benchmarking tools.
- **Reliability:** **PASS**. Isolation of AI processing in a Web Worker ensures UI responsiveness. Zero data egress simplifies security validation as it is essentially a network "deny-all" check.

## Architecturally Significant Requirements (ASRs)

| ASR ID | Requirement                      | Probability | Impact | Score | Risk Link | Mitigation                                                                          |
| ------ | -------------------------------- | ----------- | ------ | ----- | --------- | ----------------------------------------------------------------------------------- |
| ASR-1  | Real-time Pose Matching Accuracy | 3           | 3      | 9     | TECH/BUS  | Automated validation of similarity logic against reference keypoint datasets.       |
| ASR-2  | Sub-100ms Feedback Latency       | 2           | 3      | 6     | PERF      | Benchmarking on various device tiers (High/Mid/Low) using k6/Lighthouse.            |
| ASR-3  | Zero Data Egress (Privacy)       | 1           | 3      | 3     | SEC       | Network interception tests to verify no external requests are made during sessions. |
| ASR-4  | Offline Shell Functional (PWA)   | 2           | 2      | 4     | OPS       | Service Worker validation using Playwright's offline mode.                          |

## Test Levels Strategy

- **Unit: 60%** - Focus on pure logic for pose scoring formulas, wireframe scaling math, and subject distance calculations. Use Vitest/Jest for fast feedback.
- **Integration: 30%** - Focus on component-to-state interactions (Jotai), Web Worker messaging, and Camera hook reliability. Use Playwright Component Testing.
- **E2E: 10%** - Focus on core user journeys: Initial onboarding, Selfie capture flow, and Portrait mode switching. Use Playwright E2E with fake media stream.

## NFR Testing Approach

- **Security:** Use Playwright Network Interception to assert that zero external network calls are made. Validate that no pose data is written to persistent storage (IndexedDB only used for non-biometric settings/photos).
- **Performance:** Use k6 for system benchmarking and Lighthouse for Core Web Vitals. Specifically measure WASM model load time and inference FPS.
- **Reliability:** Chaos testing for camera permission denial and recovery. Mocking various AI payloads (too many people, no people) to ensure graceful UI handling.
- **Maintainability:** Enforce 80% coverage on core logic via CI gates. Use structured logging for error state tracking (even if local-only).

## Test Environment Requirements

- **Local Development:** Support for `fake-ui-for-media-stream` to simulate camera.
- **CI/CD:** Playwright environment with WebGL/WASM support enabled.
- **Physical Devices:** Manual/Cloud testing on iOS (Safari) and Android (Chrome) to validate hardware-dependent AI performance.

## Resource Estimates

Based on the proposed strategy and the current scope of 8 Epics and approximately 30-40 stories:

| Priority  | Scenario Count (Est) | Effort per Test | Total Effort             |
| --------- | -------------------- | --------------- | ------------------------ |
| P0        | 10                   | 2 hours         | 20 hours                 |
| P1        | 20                   | 1 hour          | 20 hours                 |
| P2        | 30                   | 0.5 hours       | 15 hours                 |
| P3        | 10                   | 0.25 hours      | 2.5 hours                |
| **Total** | **70**               | -               | **57.5 hours (~7 days)** |

## Quality Gate Criteria

- **P0 Pass Rate:** 100% (Required for all releases)
- **P1 Pass Rate:** ≥95%
- **High-Risk Mitigations:** 100% of risks with score ≥6 must have a documented and verified mitigation.
- **Critical Path Coverage:** ≥80% logic coverage for pose matching and camera hooks.

## Testability Concerns

- **WASM Performance:** Lower-end devices may experience high latency during model initialization. Strategy: Implement "Lite Mode" toggle validation.
- **Camera Access Brittle:** Cross-browser camera enumeration can be inconsistent. Strategy: Abstract camera selection into a testable utility.

## Recommendations for Phase 4

- **Framework Setup:** Initialize Playwright with a custom fixture for "Mock Camera Stream".
- **CI Pipeline:** Integrate a performance benchmarking step that fails if FPS drops below 15 on standard runners.
- **Data Fixtures:** Prepare a JSON library of reference pose keypoints (MediaPipe format) for logic validation.
