# Executive Summary

**Product Vision:**
"ai-perfect-shot" is an AI-guided photography PWA that solves the universal problem of awkward posing and poor composition. Unlike traditional editors that fix photos _after_ they are taken, ai-perfect-shot acts as a **Real-time AI Coach**, providing active guidance to capture the perfect shot _in the moment_.

**Core Problem:**
Users desire high-quality, aesthetic photos but struggle with "camera freeze," lack of posing knowledge, and the disconnect between how they see themselves and how the camera captures them.

## What Makes This Special (Competitive Advantage)

1.  **Active Real-time Coaching (vs. Passive Templates):**
    Instead of a static sticker that users struggle to align with, our AI tracks body joints in real-time (30fps), offering live feedback. To avoid frustration, the system uses **Forgiving Gradient Feedback** (Red → Yellow → Green) and encourages users, ensuring they never feel like they are failing a test.

2.  **Smart Shutter via Adaptive Matching:**
    The core "magic" feature. The shutter fires _automatically_ when the user's pose matches the guide and composition rules are met, eliminating "bad timing." _Includes a manual override to ensure users are never locked out of taking a photo._

3.  **Zero-Latency Privacy Architecture:**
    Leveraging a client-side architecture (Next.js + MediaPipe WASM), all AI processing happens on the user's device. This enables **instant coaching feedback** (essential for the red/green loop) that cloud AI cannot match due to latency, while inherently ensuring GDPR/COPPA compliance as no data leaves the device.

4.  **Natural Pose Flow (Authenticity):**
    The AI adapts wireframes to the user's scale and proportion, promoting poses that feel physically comfortable and look natural ("Authentic Flow"), rather than enforcing rigid, one-size-fits-all beauty standards.
