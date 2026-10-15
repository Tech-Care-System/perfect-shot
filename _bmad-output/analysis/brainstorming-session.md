---
stepsCompleted: [1]
inputDocuments: []
session_topic: "AI-guided photography app with body-adaptive wireframe overlays (ai-perfect-shot)"
session_goals: "Define MVP requirements, establish competitive advantage over generic AI editors, and outline technical AI integration (Pose Estimation, Body Segmentation)."
selected_approach: "ai-recommended"
techniques_used:
  ["Reverse Brainstorming", "SCAMPER Method", "Morphological Analysis"]
ideas_generated: 15
context_file: ""
---

# Brainstorming Session Results

**Facilitator:** Z3tz3r0

## Session Overview

**Topic:** AI-guided photography app with body-adaptive wireframe overlays (ai-perfect-shot)
**Goals:** Define MVP requirements, establish competitive advantage over generic AI editors, and outline technical AI integration (Pose Estimation, Body Segmentation).

### Session Setup

The user (Z3tz3r0) wants to solve the problem of poor photography skills by providing an intelligent overlay guide that adapts to the subject's body size and personal preferences. The session aims to define a clear MVP for competition submission with strong AI integration.

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** AI-guided photography app with focus on MVP requirements, competitive advantage, and AI integration.

**Recommended Techniques:**

- **Reverse Brainstorming:** To identify potential pitfalls and create robust features that competitors miss (e.g., how to make the photo look bad?).
- **SCAMPER Method:** To refine the "Smart Overlay" concept by modifying, adapting, and combining existing ideas.
- **Morphological Analysis:** To systematically map body types, poses, and AI techniques for technical feasibility and MVP definition.

**AI Rationale:** This sequence moves from critical analysis (finding gaps) to creative refinement (innovating features) to structural planning (defining specs), ensuring a comprehensive roadmap for the MVP.

## Technique Execution Results

**Reverse Brainstorming:**

- **Interactive Focus:** Identifying "Worst Case" features to find hidden requirements.
- **Key Breakthroughs:**
  - **Smart Shutter / Auto-Capture:** Solve "bad timing" by triggering only when the pose matches the guide.
  - **Bio-Mechanic / Comfort Check:** Ensure poses are physically possible and comfortable, avoiding unnatural contortions.
  - **Identity Preservation:** Focus on pose/angle correction rather than facial retouching (Authentic Beauty).
  - **Adaptive Flow Guidance:** AI should adapt to the user's natural movement shifts rather than forcing a rigid pose.
- **User Creative Strengths:** Strong focus on user experience and natural interaction pitfalls.
- **Energy Level:** Analytical and user-empathic.

**SCAMPER Method:**

- **Interactive Focus:** Refining "Smart Wireframe" and MVP feature set using technical constraints.
- **Key Breakthroughs:**
  - **Modify -> Text-AR:** Add live text captions ("Raise camera 5°", "Move Left") and potentially voice guidance for clearer instruction.
  - **Adapt -> Body Scaling:** Auto-calibrate overlay size based on subject's detected bounding box to fit diverse body types (Plus/Petite).
  - **Combine -> Tech Stack:** Use Pre-trained MediaPipe for Pose (Lean) + Custom MobileNet for Composition/Angle (Unique Value).
- **User MVP Decision:**
  - **Features:** Real-time Guide + Composition Rule + Light Check.
  - **Pose Library:** Start with **Preset Pack Only** (Korean, Minimal, etc.) for streamlined MVP launch.

**Morphological Analysis (MVP Mapping):**

| Feature Component  | Technical Implementation                           | UX/UI Feedback                             |
| :----------------- | :------------------------------------------------- | :----------------------------------------- |
| **Pose Detection** | MediaPipe / MoveNet (Pre-trained)                  | Wireframe Overlay (Green=Good, Red=Adjust) |
| **Angle Guidance** | Custom MobileNetV3 (Classification: Low/High/Good) | AR Arrows ("Up", "Down") + Text Prompt     |
| **Lighting Check** | OpenCV Histogram (Rule-based)                      | Exposure Alert Icon + "Backlit" Warning    |
| **Pose Selection** | Hardcoded Preset Library (Categorized)             | Bottom Slider Menu (Style Selections)      |
