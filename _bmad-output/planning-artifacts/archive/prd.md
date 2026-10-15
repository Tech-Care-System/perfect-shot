---
stepsCompleted: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - _bmad-output/planning-artifacts/research/market-ai-perfect-shot-research.md
  - _bmad-output/planning-artifacts/research/technical-ai-perfect-shot-research.md
  - _bmad-output/planning-artifacts/research/domain-ai-perfect-shot-research.md
  - _bmad-output/analysis/brainstorming-session.md
documentCounts:
  briefCount: 0
  researchCount: 3
  brainstormingCount: 1
  projectDocsCount: 0
workflowType: "prd"
lastStep: 8
---

# Product Requirements Document - ai-perfect-shot

**Author:** Z3tz3r0

## Executive Summary

**Product Vision:**
"ai-perfect-shot" is an AI-guided photography PWA that solves the universal problem of awkward posing and poor composition. Unlike traditional editors that fix photos _after_ they are taken, ai-perfect-shot acts as a **Real-time AI Coach**, providing active guidance to capture the perfect shot _in the moment_.

**Core Problem:**
Users desire high-quality, aesthetic photos but struggle with "camera freeze," lack of posing knowledge, and the disconnect between how they see themselves and how the camera captures them.

### What Makes This Special (Competitive Advantage)

1.  **Active Real-time Coaching (vs. Passive Templates):**
    Instead of a static sticker that users struggle to align with, our AI tracks body joints in real-time (30fps), offering live feedback. To avoid frustration, the system uses **Forgiving Gradient Feedback** (Red → Yellow → Green) and encourages users, ensuring they never feel like they are failing a test.

2.  **Smart Shutter via Adaptive Matching:**
    The core "magic" feature. The shutter fires _automatically_ when the user's pose matches the guide and composition rules are met, eliminating "bad timing." _Includes a manual override to ensure users are never locked out of taking a photo._

3.  **Zero-Latency Privacy Architecture:**
    Leveraging a client-side architecture (Next.js + MediaPipe WASM), all AI processing happens on the user's device. This enables **instant coaching feedback** (essential for the red/green loop) that cloud AI cannot match due to latency, while inherently ensuring GDPR/COPPA compliance as no data leaves the device.

4.  **Natural Pose Flow (Authenticity):**
    The AI adapts wireframes to the user's scale and proportion, promoting poses that feel physically comfortable and look natural ("Authentic Flow"), rather than enforcing rigid, one-size-fits-all beauty standards.

## Project Classification

**Technical Type:** mobile_web_app (PWA)
**Domain:** consumer_software, computer_vision
**Complexity:** medium
**Project Context:** Greenfield - New Project

**Key Technical Pillars:**

- **Frontend:** Next.js + Tailwind CSS (Vercel Deployed)
- **AI Core:** MediaPipe for Web (WASM) for client-side Pose Estimation
- **Data:** IndexedDB for local preset storage (Zero-Backend MVP)

## Success Criteria

### User Success

- **Immediate Value:** Users successfully capture a guided photo within **30 seconds** of first launch.
- **Guidance Clarity:** Users can intuitively follow the "Red/Yellow/Green" feedback loop to correct their pose without external tutorials.
- **Privacy Trust:** Users feel confident granting camera permissions knowing no data leaves their device.

### Business Success

- **Real Usage:** Primary metric is "Photos Saved per Session" > 1 (indicates the tool provided value, not just novelty).
- **Adoption:** Achieve a baseline of active users who use the app repeatedly for their photography needs.

### Technical Success

- **Performance:** AI Inference maintains **30 FPS** on standard mobile devices to ensure smooth feedback.
- **Latency:** Visual feedback (wireframe overlay) synchronization delay < 100ms.
- **Compatibility:** Works flawlessly on mobile Safari (iOS) and Chrome (Android) as a PWA.

### Measurable Outcomes

- **"Smart Shutter" Accuracy:** Shutter fires only when Pose Similarity Score > 0.90.
- **Load Time:** App becomes interactive (ready to capture) in < 3 seconds on 4G networks.

## Product Scope

### MVP - Minimum Viable Product

- **Platform:** Web-based PWA (Next.js) accessible via URL.
- **Core Loop:** Real-time Pose Estimation (Front/Back Camera).
- **Features:**
  - Live Wireframe Overlay (Red/Green feedback).
  - Basic Pose Pack (e.g., "Casual", "Portrait").
  - Smart Shutter (Auto-capture on match).
  - Save to Camera Roll.
  - Manual Shutter Override.
- **Data:** Local Storage only (No Backend/DB).

### Growth Features (Post-MVP)

- **Content:** Additional Pose Packs (Couple, Group, Formal).
- **Social:** Native Share Sheet integration.
- **Gamification:** "Pose Streak" or "Daily Challenge".

### Vision (Future)

- **Custom Poses:** Users can upload a reference photo, and AI generates a wireframe guide instantly.
- **Voice Guidance:** "Tilt head left" audio cues for hands-free usage.

## User Journeys

### Journey 1: Ping - The Solo Selfie Queen

**Persona:** Ping is a 25-year-old office worker in Bangkok. She loves posting aesthetic photos on Instagram Stories but hates asking strangers for help. Her biggest frustration? "I look amazing in the mirror, but my selfies never turn out right. My arm looks weird, my face looks asymmetrical, and I can never get the angle."

**The Story:**
It's Saturday afternoon, and Ping has found the perfect café with beautiful natural lighting. She wants a cute selfie for her "weekend vibes" Story. Normally, she would spend 10 minutes taking 50 photos, hate all of them, and give up.

Today, she opens **ai-perfect-shot** for the first time. Within seconds, a translucent wireframe appears on screen, showing her the ideal head position and shoulder angle. The wireframe is slightly red—she's too centered. "Move right," a small text prompt suggests. She shifts, and the wireframe turns yellow, then green.

_Click._ The Smart Shutter fires automatically. She looks at the saved photo—her face is perfectly aligned to the Rule of Thirds, and her head tilt looks natural and flattering.

For the first time, she got the shot in one take. She posts it immediately. "Finally," she thinks, "an app that actually helps instead of just adding filters."

**Emotional Arc:** Frustration → Curiosity → Surprise → Delight → Trust

**Journey Requirements Revealed:**

- Front camera support (Selfie mode)
- Real-time wireframe overlay on camera preview
- Color-coded feedback (Red/Yellow/Green)
- Text guidance prompts (e.g., "Move right")
- Smart Shutter (auto-capture on match)
- Save to Camera Roll

---

### Journey 2: Joe - The Reluctant Photographer

**Persona:** Joe is a 21-year-old university student. His girlfriend, Mint, constantly asks him to take photos of her when they go out. The problem? He's terrible at it. "You cut off my head again!" "Why is the background crooked?" "I look so short in this!" He dreads the request because he knows he'll disappoint her.

**The Story:**
Joe and Mint are at a rooftop bar with a stunning sunset view. Mint hands him her phone with ai-perfect-shot already open. "Just follow the guide," she says.

Joe sees a wireframe on the screen, but Mint isn't aligned with it. He tilts the phone up slightly—the guide suggests "Camera angle good." Mint is still fidgeting, unsure if she looks okay because she can't see the screen.

Then, something magical happens: **the phone vibrates briefly and plays a soft "ding" sound.** Mint freezes—she knows from the audio cue that she's in the perfect position. The wireframe on Joe's screen glows green, and the Smart Shutter fires.

Mint looks at the photo. For once, there's no complaint. Her legs look long (the app guided a slight upward angle), her head has perfect headroom, and the golden sunset is beautifully composed behind her.

"Wow, Joe, you're getting better!" she says. Joe just smiles. He knows it wasn't him—it was the app. But he'll take the credit.

**Emotional Arc:** Dread → Confusion (at first) → Collaborative Moment (audio cue bridges the gap) → Relief → Pride

**Journey Requirements Revealed:**

- Back camera support (Portrait mode)
- Angle guidance (camera tilt up/down)
- Subject detection (tracking a person in frame)
- Composition guides (headroom, rule of thirds)
- **Audio/Haptic feedback for subject** (ding + vibration when pose matches)
- Smart Shutter confirmation (subject and composition aligned)

---

### Journey 3: Ping - The Override Moment (Edge Case)

**Persona:** Same Ping from Journey 1, one week later. She's now a regular user, but today something is different.

**The Story:**
Ping is at a crowded street market, trying to get a quick selfie with a famous food stall behind her. The lighting is harsh (backlit), and there are people constantly walking through the frame. The AI is struggling—the wireframe flickers between yellow and red. The Smart Shutter won't fire.

After 15 seconds of waiting, Ping starts to feel frustrated. "Just let me take the photo!" She notices the **Manual Override button** at the bottom of the screen—a simple camera icon that's always visible. She taps it.

_Click._ The photo is taken immediately, even though her pose wasn't "perfect." The composition is slightly off, and the lighting warning (backlit icon) was still active, but she got the moment. She can crop it later.

The app didn't trap her. It guided her when it could, but ultimately gave her control.

**Emotional Arc:** Confidence (from past success) → Frustration (AI not cooperating) → Relief (manual control available) → Acceptance ("Good enough" is still good)

**Journey Requirements Revealed:**

- Manual shutter override (always visible, always works)
- Lighting warning indicator (backlit/exposure issue)
- Graceful degradation (app still functions in non-ideal conditions)
- No "user lockout" scenario (critical for trust)

---

### Journey 4: Mint - The "Where Am I?" Moment (Edge Case - Subject Detection Failure)

**Persona:** Same Mint from Journey 2. This time, she's trying to set up a shot by herself using a phone tripod and the back camera timer.

**The Story:**
Mint sets up her phone on a small tripod at a scenic overlook. She walks into frame, but she's standing too far away. The AI can detect _a_ person, but her body is too small in the frame for accurate pose estimation.

The wireframe flickers uncertainly, and a new message appears: **"Step closer to the camera."** She takes a few steps forward. Now the wireframe stabilizes, but her shoulders are cut off at the edge of the frame. The message changes: **"Move left to fit in frame."**

She adjusts. Finally, the full wireframe appears, her body is tracked, and the familiar "ding" plays. She strikes the pose, and the Smart Shutter fires.

Later, she shows the photo to Joe. "This app even works without you," she teases.

**Emotional Arc:** Independence → Minor Confusion (feedback unclear at first) → Guidance → Success → Pride

**Journey Requirements Revealed:**

- **Subject distance detection** ("Step closer" / "Step back")
- **Subject framing guidance** ("Move left to fit in frame")
- Support for tripod/timer use case (delayed shutter option?)
- Clear error states when AI cannot fully detect subject

---

### Journey Requirements Summary

Based on the four user journeys, the following core capabilities are required for MVP:

| Capability Area      | Requirements                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| **Camera System**    | Front camera (selfie), Back camera (portrait), Camera switching                                      |
| **AI Overlay**       | Real-time wireframe, Color-coded feedback (Red/Yellow/Green), Subject tracking                       |
| **Guidance System**  | Text prompts ("Move right", "Tilt up"), Angle guidance, Composition rules (Rule of Thirds, Headroom) |
| **Subject Feedback** | Audio cue (ding) when pose matches, Haptic feedback (vibration), Visual flash on screen              |
| **Error Handling**   | "Step closer/back" prompt, "Move to fit in frame" prompt, Lighting warning (backlit)                 |
| **Shutter System**   | Smart Shutter (auto-capture on match), Manual Override (always available)                            |
| **Output**           | Save to Camera Roll (native share sheet)                                                             |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Active Real-time Coaching UX**

The photography guidance industry relies on **passive templates**—static silhouettes or stickers that users must manually align themselves to. This approach is fundamentally flawed: the template doesn't move, but humans do. Users struggle to match a rigid outline, leading to frustration and "good enough" results.

**ai-perfect-shot** inverts this paradigm. Instead of asking the user to match the template, the AI continuously analyzes the user's body position (30 FPS) and provides **active, dynamic feedback**. The wireframe adapts to the user's proportions, and the color-coded system (Red → Yellow → Green) guides them in real-time. This creates a "coaching" experience rather than a "matching" experience.

**2. Zero-Latency Edge AI for Consumer UX**

Most AI-powered photo applications rely on cloud processing, which introduces latency (often 1-5 seconds per frame) and raises significant privacy concerns. **ai-perfect-shot** leverages WebAssembly (WASM) and MediaPipe to run pose estimation entirely on the user's device, enabling:

- **< 100ms feedback latency** (essential for the "live coaching" loop)
- **Infinite scalability** (users provide their own compute)
- **Inherent privacy compliance** (GDPR/COPPA by design)

### Market Context & Competitive Landscape

| Competitor          | Approach             | Real-time? | Privacy      |
| ------------------- | -------------------- | ---------- | ------------ |
| Ulike               | Static Pose Samples  | ❌ No      | ⚠️ Cloud     |
| SOVS                | Silhouette Overlay   | ❌ Passive | ✅ On-Device |
| Epik AI             | Post-capture Reshape | ❌ Post    | ⚠️ Cloud     |
| **ai-perfect-shot** | **Active Coaching**  | ✅ 30 FPS  | ✅ On-Device |

### Validation Approach

- **Technical:** Confirm 30 FPS on target devices (iPhone 12+, mid-range Android)
- **UX:** A/B test "Passive Template" vs. "Active Coaching"
- **Market:** Soft launch, measure "Photos Saved per Session"

### Risk Mitigation

| Risk                       | Mitigation             |
| -------------------------- | ---------------------- |
| Low-end device performance | "Lite Mode" fallback   |
| User confusion             | Onboarding animation   |
| Competitors copy           | Move fast, build brand |

### Strategic Resilience (What-If Planning)

- **Platform Risk:** Compete on curated content if Apple/Google integrate natively
- **Performance Risk:** Device capability detection at first launch
- **UX Risk:** "Zen Mode" removes color-coded feedback for users who want guidance without pressure
- **Market Positioning:** "No Filter, Just Better Composition" aligns with authenticity trend
- **Competitive Moat:** Content Moat (pose library) + Brand Association

### Business & Growth Considerations

**Monetization (Post-MVP):**

- Premium Pose Packs ($1.99-$4.99)
- Affiliate partnerships (tripods, accessories)
- White-label SDK for camera brands

**Go-to-Market:**

- TikTok organic (before/after format is inherently viral)
- Micro-influencer seeding (10K-100K lifestyle creators)
- ASO: "AI photo coach," "posing guide" keywords

**Retention:**

- Regular new Pose Packs (seasonal, trend-based)
- Future: "Improvement Tracker"

**Platform Dependency:**

- MediaPipe is open-source (Apache 2.0); maintain abstraction layer for future model swapping

## Mobile Web App (PWA) Specific Requirements

### Project-Type Overview

**ai-perfect-shot** is a Progressive Web App (PWA) focused on mobile browsers, leveraging client-side AI for real-time camera processing. This architecture choice prioritizes:

- **Instant access** (no App Store friction)
- **Cross-platform compatibility** (single codebase for iOS and Android)
- **Privacy-first design** (all processing happens on-device)

### Platform Requirements

| Platform    | Priority | Browser      | Notes                                         |
| ----------- | -------- | ------------ | --------------------------------------------- |
| **iOS**     | Primary  | Safari 15.4+ | Camera API fully supported; requires HTTPS    |
| **Android** | Primary  | Chrome 90+   | Excellent MediaPipe WebGL performance         |
| **Desktop** | Low      | Chrome/Edge  | Functional but not optimized (webcam support) |

**Browser-Specific Considerations:**

- **iOS Safari:** Requires user gesture to start camera; no background audio; limited haptic API
- **Android Chrome:** Full feature support; Service Worker caching works reliably

### Device Permissions

| Permission            | Purpose                                  | Required        | Fallback                   |
| --------------------- | ---------------------------------------- | --------------- | -------------------------- |
| **Camera**            | Real-time pose detection & photo capture | ✅ Mandatory    | No fallback (core feature) |
| **Storage/Downloads** | Save photos to Camera Roll               | ✅ Mandatory    | In-browser download        |
| **Vibration**         | Haptic feedback on pose match            | ⚠️ Nice-to-have | Audio-only feedback        |
| **Audio Playback**    | "Ding" sound for subject feedback        | ⚠️ Nice-to-have | Visual-only feedback       |

**Permission Flow:**

1. Show permission explanation screen before requesting
2. Request camera on user action (not on page load)
3. Handle denial gracefully with re-request option

### Offline & Caching Strategy

| Asset Type              | Caching Strategy             | Cache Duration |
| ----------------------- | ---------------------------- | -------------- |
| App Shell (HTML/CSS/JS) | Service Worker (Cache-First) | Until update   |
| MediaPipe WASM/JS       | CDN + Cache API              | Long-term      |
| Pose Models (.task)     | Lazy Load + Cache            | Long-term      |
| Pose Presets (JSON)     | IndexedDB                    | Persistent     |

**Note:** Camera functionality requires active network context (HTTPS origin), but cached assets allow near-instant app reload.

### Performance Requirements

| Metric                  | Target (Flagship) | Target (Mid-range) | Measurement     |
| ----------------------- | ----------------- | ------------------ | --------------- |
| **Pose FPS**            | 30 FPS            | 15 FPS (Lite Mode) | Chrome DevTools |
| **Feedback Latency**    | < 50ms            | < 100ms            | Performance API |
| **Time to Interactive** | < 2s              | < 3s               | Lighthouse      |
| **Model Load Time**     | < 1.5s            | < 2.5s             | Network + parse |
| **Memory Usage**        | < 200MB           | < 300MB            | DevTools Memory |

**Device Capability Detection:**

- On first launch, run a quick benchmark (5 frames)
- If FPS < 15, automatically enable "Lite Mode"
- Show warning if device is unsupported

### PWA Installation & Distribution

**Manifest Configuration:**

- name: "ai-perfect-shot"
- short_name: "PerfectShot"
- display: "standalone"
- orientation: "portrait"
- theme_color: "#000000"

**Distribution Strategy:**

- Primary: Direct URL sharing (link in bio, QR code)
- Secondary: "Add to Home Screen" prompt after first successful photo
- Future: App Store wrapper (Capacitor/PWABuilder) if needed for discoverability

### Technical Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (PWA)                        │
├─────────────────────────────────────────────────────────┤
│  UI Layer (React/Next.js)                               │
│  ├── Camera Component (getUserMedia)                   │
│  ├── Wireframe Canvas (WebGL overlay)                  │
│  └── Controls (Shutter, Next Pose)                     │
├─────────────────────────────────────────────────────────┤
│  AI Layer (Web Worker)                                  │
│  ├── MediaPipe Pose Landmarker (WASM)                  │
│  ├── MediaPipe Object Detection (~5MB)                 │  ← NEW
│  ├── Scene Classification (MobileNet ~15MB)            │  ← NEW
│  ├── Pose Recommendation Engine                        │  ← NEW
│  ├── Pose Matching Logic (Cosine Similarity)           │
│  └── Feedback Calculation (Red/Yellow/Green)           │
├─────────────────────────────────────────────────────────┤
│  Storage Layer (IndexedDB)                              │
│  └── Pose Library (tagged by scene/props), User Settings│
└─────────────────────────────────────────────────────────┘
```

**AI Model Budget:** ~20-25MB total (Pose + Objects + Scene)
**FPS Impact:** 30 FPS → ~22-25 FPS (still smooth)

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP (AI Photography Director)
**Goal:** Deliver the core "AI Director" experience where AI understands the scene, recommends poses, and guides users to capture great photos in under 30 seconds.

**MVP Context:** Professional/Event Setting

- ออกบูธ (Booth events)
- ขึ้นเวที pitch (Stage presentations)
- ถ่ายรูปงาน event (Corporate/professional events)

**Resource Requirements:**

- **Team Size:** 1-2 developers
- **Timeline:** 3-5 weeks to functional MVP (increased due to Scene Understanding)
- **Skills:** Next.js, MediaPipe, Object Detection, Basic ML/UI/UX

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**

- Journey 1: Ping (Solo Selfie) - Full support
- Journey 2: Joe (Reluctant Photographer) - Full support
- Journey 3: Override Moment - Full support
- Journey 4: Subject Detection Failure - Basic support (warnings)

**Must-Have Capabilities:**

1. **Camera System:** Front/Back camera switching
2. **Scene Understanding:** Object Detection (chair, sofa, booth) + Scene Classification
3. **AI Pose Recommendation:** AI recommends pose based on scene + props (no user gallery)
4. **Pose Explanation:** Show pose name + action hint (e.g., "Confident Sit" + "Lean back, arm on armrest")
5. **AI Overlay:** Real-time wireframe (~25 FPS target)
6. **Feedback Loop:** Red/Yellow/Green color coding + Sequential text prompts (one at a time)
7. **Smart Shutter:** Auto-capture when pose matches (Score > 0.90)
8. **Manual Override:** Always-visible shutter button
9. **Next Pose Button:** Allow user to request alternative pose
10. **Subject Feedback:** Audio ding + Haptic vibration on match
11. **Output:** Preview screen → Save to Camera Roll / Retake
12. **Content:** Scene-tagged Pose Library (~12-16 poses for 4 scene types: Solo Chair, Sofa, Standing, Stage)

**Explicitly Out of Scope for MVP:**

- ❌ User accounts / Login
- ❌ Cloud storage / Sync
- ❌ In-app sharing (use native Share Sheet)
- ❌ Multiple Pose Packs (launch with 1)
- ❌ Voice Guidance
- ❌ Desktop optimization

### Post-MVP Features

**Phase 2 (Growth - 1-2 months post-launch):**

- Additional Pose Packs (Couple, Group, Formal, K-style)
- "Zen Mode" (neutral wireframe, no color judgment)
- "Add to Home Screen" prompt
- Analytics integration (anonymous usage data)

**Phase 3 (Expansion - 3-6 months post-launch):**

- Voice Guidance ("Tilt head left")
- Custom Pose Upload (AI generates wireframe from reference photo)
- Improvement Tracker (gamification)
- Premium Pose Packs (monetization)
- App Store wrapper (Capacitor) for discoverability

### Risk Mitigation Strategy

| Risk Category | Risk                                     | Mitigation                                           |
| ------------- | ---------------------------------------- | ---------------------------------------------------- |
| **Technical** | MediaPipe performance on low-end devices | Device capability detection + "Lite Mode" fallback   |
| **Technical** | iOS Safari camera quirks                 | Extensive testing on real devices during development |
| **Market**    | Users don't understand the value prop    | Clear onboarding animation showing before/after      |
| **Market**    | Competitors copy the approach            | Move fast, establish brand, build Content Moat       |
| **Resource**  | Solo developer bandwidth                 | Ruthlessly enforce MVP scope; defer nice-to-haves    |

## Functional Requirements

### Camera & Capture

- FR1: User can access device camera (front-facing) for selfie mode
- FR2: User can access device camera (rear-facing) for portrait mode
- FR3: User can switch between front and rear cameras during session
- FR4: User can capture a photo manually at any time using the override shutter button
- FR5: System can automatically capture a photo when pose match score exceeds threshold (Smart Shutter)
- FR6: User can save captured photos to device Camera Roll/Gallery

### AI Pose Detection

- FR7: System can detect human body pose landmarks in real-time from camera feed
- FR8: System can compare detected pose against reference pose template
- FR9: System can calculate pose similarity score between user pose and reference
- FR10: System can adapt wireframe scale to match user's body proportions
- FR11: System can detect when subject is too far from camera
- FR12: System can detect when subject is partially out of frame

### Visual Feedback

- FR13: User can see wireframe overlay on camera preview showing target pose
- FR14: User can see color-coded feedback indicating pose match quality (Red/Yellow/Green)
- FR15: User can see text prompts suggesting corrective actions (e.g., "Move right", "Tilt head")
- FR16: User can see lighting warning indicator when backlit or poor lighting detected
- FR17: User can see subject positioning guidance (e.g., "Step closer", "Move left to fit in frame")

### Audio & Haptic Feedback

- FR18: System can play audio cue (ding) when pose match is achieved
- FR19: System can trigger device vibration (haptic) when pose match is achieved
- FR20: Subject (person being photographed) can perceive feedback cue without seeing screen

### Pose Library

- FR21: User can browse available poses in a pose pack
- FR22: User can select a pose from the pose pack to use as reference
- FR23: User can view pose preview before activating it
- FR24: System can load pose data (keypoints) for pose matching

### Onboarding & Settings

- FR25: User can view onboarding tutorial explaining Red/Yellow/Green feedback
- FR26: User can skip onboarding tutorial
- FR27: User can grant camera permission through guided permission flow
- FR28: User can re-request camera permission if initially denied

### Device Compatibility

- FR29: System can detect device performance capability on first launch
- FR30: System can enable "Lite Mode" for lower-end devices automatically
- FR31: User can see warning if device is not fully supported
- FR32: System can gracefully degrade features on unsupported devices

## Non-Functional Requirements

### Performance (Critical)

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

### Privacy & Security

| Requirement                          | Description                                                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **NFR-S1: Zero Data Egress**         | No photos, pose data, or biometric information shall be transmitted to any external server                                  |
| **NFR-S2: On-Device Processing**     | All AI inference must execute locally on the user's device                                                                  |
| **NFR-S3: Camera Permission Scope**  | App shall only access camera stream during active usage; no background recording                                            |
| **NFR-S4: No Persistent Biometrics** | Pose landmark data shall exist only in memory during session; no storage to disk                                            |
| **NFR-S5: HTTPS Only**               | PWA must be served over HTTPS; no mixed content allowed                                                                     |
| **NFR-S6: GDPR/COPPA by Design**     | Architecture inherently complies with data protection regulations as no personal data is collected or processed server-side |

### Browser Compatibility

| Requirement                        | Description                                                        |
| ---------------------------------- | ------------------------------------------------------------------ |
| **NFR-C1: iOS Safari Support**     | Full functionality on Safari 15.4+ (iOS 15.4+)                     |
| **NFR-C2: Android Chrome Support** | Full functionality on Chrome 90+                                   |
| **NFR-C3: Camera API Compliance**  | Must handle getUserMedia gracefully across supported browsers      |
| **NFR-C4: WebGL Fallback**         | If WebGL2 unavailable, must fallback to WebGL1 or show clear error |

### Reliability & Availability

| Requirement                        | Description                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| **NFR-R1: Offline Shell Caching**  | App shell must load from cache even when offline (Service Worker)             |
| **NFR-R2: Graceful Camera Errors** | System must recover gracefully if camera access is interrupted                |
| **NFR-R3: Model Load Retry**       | If AI model fails to load, system must retry up to 3 times with user feedback |

### Accessibility (Basic)

| Requirement                | Description                                                                |
| -------------------------- | -------------------------------------------------------------------------- |
| **NFR-A1: Audio Feedback** | Key actions (pose match) must have audio cue for users not watching screen |
| **NFR-A2: Color Contrast** | UI elements must meet WCAG AA contrast ratios                              |
| **NFR-A3: Touch Targets**  | Interactive elements must be ≥ 44x44 px for touch usability                |
