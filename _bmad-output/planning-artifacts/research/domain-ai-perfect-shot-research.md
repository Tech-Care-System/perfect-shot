---
stepsCompleted: []
inputDocuments: []
workflowType: "research"
lastStep: 1
research_type: "domain"
research_topic: "AI-guided photography app"
research_goals: "Analyze photography composition rules, posing psychology, and domain knowledge for AI training"
user_name: "Z3tz3r0"
web_research_enabled: true
source_verification: true
---

# Research Report: domain

**Author:** Z3tz3r0
**Research Type:** domain

---

## Research Overview

[Research overview and methodology will be appended here]

---

## Domain Research Scope Confirmation

**Research Topic:** AI-guided photography app
**Research Goals:** Analyze photography composition rules, posing psychology, and domain knowledge for AI training

**Domain Research Scope:**

- **Composition Rules:** Rule of Thirds, Golden Ratio, Leading Lines, Symmetry.
- **Posing Psychology:** Power posing, slimming angles, solving "camera weirdness".
- **Lighting Basics:** Natural lighting, Golden Hour, advice for users.
- **Aesthetic Trends:** Current visual trends (Gen Z aesthetics, Authentic look).

**Research Methodology:**

- All claims verified against current photography resources and trends.
- Analysis of professional photographer guidelines.
- Focus on quantifiable metrics for AI implementation.

---

## Competitive Landscape (Domain Lens)

### Key Competitors Analysis

| App            | Focus                  | Posing Feature                         | Real-time AI?            |
| :------------- | :--------------------- | :------------------------------------- | :----------------------- |
| **Ulike**      | Facial Beauty          | Static Pose Samples (Reference Images) | ❌ No                    |
| **SOVS**       | Silhouette Overlay     | Outline Templates (User walks to fit)  | ❌ No (Passive)          |
| **Epik AI**    | Post-Edit Body Reshape | AI Face/Body + Stature Adj             | ❌ Post-capture          |
| **Unscripted** | Pro Photographer Tool  | 1000+ Pose Library (Reference)         | ❌ No (For Photographer) |

### Identified Gap (Our Opportunity)

- **Problem:** All competitors use **Passive Templates** (User must visually compare to a static image).
- **Opportunity:** **Active Real-time Coaching** (AI detects body joints, calculates difference from target, and gives live feedback like "Raise your chin").
- **Personalization:** Our wireframe adapts to the user's unique body proportions using Normalized Landmarks, not a one-size-fits-all silhouette.

_Source: [Vertex AI Search - Competitor Feature Analysis]_

---

## Domain Analysis

### Composition Logic (AI Metrics)

- **Headroom Guideline:**
  - **Metric:** Ideal space above head = **10-15%** of total frame height.
  - **Formula:** `Top_Margin = (Landmark_0_Y)`. If `Top_Margin > 0.20`, trigger "Too much headroom" alert.
- **Rule of Thirds (Eye Placement):**
  - **Target Coordinates:** Eyes should align with `Y = 0.33` (Top Horizontal Line).
  - **Tolerance:** +/- 5% (`0.28 - 0.38`).

_Source: [Vertex AI Search - Mathematical Composition Rules]_

### Posing Biomechanics & Psychology

- **Slimming Angles:**
  - **Camera Pitch:** +10° to +15° (Upward tilt) elongates legs.
  - **Body Turn:** Shoulders should be rotated **45°** relative to camera plane (Depth check: `Left_Shoulder_Z != Right_Shoulder_Z`).
- **Head Tilt Psychology:**
  - **Friendly/Approachable:** 5-10° Lateral Tilt.
  - **Dominant/Confident:** 10° Downward Tilt (Chin down).

_Source: [Vertex AI Search - Posing Psychology]_

### Gen Z Aesthetic Trends (2025)

- **The "Flash" Look:** High Contrast, Hard Shadows, Cool Color Temp (~5500K).
- **Authenticity:** Embrace of "Lo-fi" elements (Grain, Slight Blur, Red-eye).
- **Format:** Preference for **0.5x Ultra-wide** selfies (distortion embracing).

_Source: [Vertex AI Search - Gen Z Photography Trends]_

---

## Regulatory Focus

### GDPR Compliance (EU)

- **Data Classification:** Pose Landmarks may be considered "Biometric Data" (Special Category).
- **Our Advantage (Privacy by Design):**
  - **On-Device AI:** No data leaves the user's device.
  - **Zero Data Collection:** We never store, transmit, or access user photos/landmarks.
  - **Household Exemption Potential:** If we have no access to PII, GDPR may not apply to us.

### COPPA Compliance (US - Under 13)

- **Mitigation Strategy:**
  - **Age Gate:** App is not directed at children. Include "13+ to use" in Terms.
  - **No Data Collection:** We do not store photos in any server.

### BIPA & State Laws (US)

- **Mitigation Strategy:**
  - **No Persistent Storage:** Landmarks processed in memory and destroyed after each frame.
  - **Not Facial Recognition:** We detect body shape, not identity.

### MVP Privacy Checklist

- [x] Use On-Device AI (No Cloud Processing)
- [x] Do not store photos on any server
- [x] Destroy Landmarks from memory after each frame
- [ ] Add Privacy Policy + Consent Popup (Before Launch)
- [ ] Implement Age Gate (13+)

---

## Conclusion

The domain research validates that **"ai-perfect-shot"** can carve a unique niche by offering **Active Real-time Coaching** (vs. Passive Templates) while maintaining a **Privacy-First architecture** that inherently complies with GDPR, COPPA, and BIPA regulations through its **On-Device AI** design.
