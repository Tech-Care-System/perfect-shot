# Non-Functional Requirements

## Performance (Critical)

| Metric                    | Target                                     | Priority |
| ------------------------- | ------------------------------------------ | -------- |
| **Pose Detection FPS**    | ≥ 30 FPS (Flagship) / ≥ 15 FPS (Mid-range) | P0       |
| **Feedback Latency**      | < 100ms from pose change to visual update  | P0       |
| **Time to Interactive**   | < 3 seconds on 4G network                  | P0       |
| **Model Load Time**       | < 2.5 seconds (MediaPipe WASM + task file) | P1       |
| **Photo Capture Latency** | < 200ms from trigger to save confirmation  | P1       |
| **Memory Usage**          | < 300MB peak on typical session            | P1       |

**Performance Degradation Rules:**

- NFR-P1: If FPS drops below 15, system must automatically enable Lite Mode
- NFR-P2: If device cannot sustain 15 FPS, system must display unsupported device warning
- NFR-P3: UI must remain responsive (input lag < 100ms) even during heavy AI processing

## Privacy & Security

| Requirement                          | Description                                                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **NFR-S1: Zero Data Egress**         | No photos, pose data, or biometric information shall be transmitted to any external server                                  |
| **NFR-S2: On-Device Processing**     | All AI inference must execute locally on the user's device                                                                  |
| **NFR-S3: Camera Permission Scope**  | App shall only access camera stream during active usage; no background recording                                            |
| **NFR-S4: No Persistent Biometrics** | Pose landmark data shall exist only in memory during session; no storage to disk                                            |
| **NFR-S5: HTTPS Only**               | PWA must be served over HTTPS; no mixed content allowed                                                                     |
| **NFR-S6: GDPR/COPPA by Design**     | Architecture inherently complies with data protection regulations as no personal data is collected or processed server-side |

## Browser Compatibility

| Requirement                        | Description                                                        |
| ---------------------------------- | ------------------------------------------------------------------ |
| **NFR-C1: iOS Safari Support**     | Full functionality on Safari 15.4+ (iOS 15.4+)                     |
| **NFR-C2: Android Chrome Support** | Full functionality on Chrome 90+                                   |
| **NFR-C3: Camera API Compliance**  | Must handle getUserMedia gracefully across supported browsers      |
| **NFR-C4: WebGL Fallback**         | If WebGL2 unavailable, must fallback to WebGL1 or show clear error |

## Reliability & Availability

| Requirement                        | Description                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| **NFR-R1: Offline Shell Caching**  | App shell must load from cache even when offline (Service Worker)             |
| **NFR-R2: Graceful Camera Errors** | System must recover gracefully if camera access is interrupted                |
| **NFR-R3: Model Load Retry**       | If AI model fails to load, system must retry up to 3 times with user feedback |

## Accessibility (Basic)

| Requirement                | Description                                                                |
| -------------------------- | -------------------------------------------------------------------------- |
| **NFR-A1: Audio Feedback** | Key actions (pose match) must have audio cue for users not watching screen |
| **NFR-A2: Color Contrast** | UI elements must meet WCAG AA contrast ratios                              |
| **NFR-A3: Touch Targets**  | Interactive elements must be ≥ 44x44 px for touch usability                |
