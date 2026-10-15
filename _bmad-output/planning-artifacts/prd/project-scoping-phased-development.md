# Project Scoping & Phased Development

## MVP Strategy & Philosophy

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

## MVP Feature Set (Phase 1)

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

## Post-MVP Features

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

## Risk Mitigation Strategy

| Risk Category | Risk                                     | Mitigation                                           |
| ------------- | ---------------------------------------- | ---------------------------------------------------- |
| **Technical** | MediaPipe performance on low-end devices | Device capability detection + "Lite Mode" fallback   |
| **Technical** | iOS Safari camera quirks                 | Extensive testing on real devices during development |
| **Market**    | Users don't understand the value prop    | Clear onboarding animation showing before/after      |
| **Market**    | Competitors copy the approach            | Move fast, establish brand, build Content Moat       |
| **Resource**  | Solo developer bandwidth                 | Ruthlessly enforce MVP scope; defer nice-to-haves    |
