# User Journeys

## Journey 1: Ping - The Solo Selfie Queen

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

## Journey 2: Joe - The Reluctant Photographer

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

## Journey 3: Ping - The Override Moment (Edge Case)

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

## Journey 4: Mint - The "Where Am I?" Moment (Edge Case - Subject Detection Failure)

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

## Journey Requirements Summary

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
