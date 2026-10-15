# Epic 3: Pose Matching & Visual Feedback

## Story 3.1: Pose Similarity Calculation

As a **developer**,
I want **to calculate a similarity score between the user's pose and the target pose**,
So that **the app can determine how well the user matches the reference pose**.

**Acceptance Criteria:**

**Given** the user's current pose landmarks are detected
**And** a target pose is loaded
**When** the similarity calculation runs
**Then** a cosine similarity score between 0.0 and 1.0 is computed
**And** the calculation considers key body joints (shoulders, elbows, hips, knees)
**And** the score updates at the same rate as pose detection (30 FPS)
**And** the score is stored in a Jotai atom (`poseScoreAtom`) for UI reactivity
**And** minor variations in depth (z-axis) have less weight than 2D alignment

---

## Story 3.2: FeedbackGlow Component (Color Overlay)

As a **user**,
I want **to see a color glow around the screen indicating how close my pose is to the target**,
So that **I instantly know if I need to adjust**.

**Acceptance Criteria:**

**Given** the pose similarity score is being calculated
**When** the score is < 0.70
**Then** the screen shows a subtle red glow effect

**Given** the pose similarity score is between 0.70 and 0.89
**When** the score updates
**Then** the screen shows a yellow glow effect
**And** the glow pulses continuously (per UX5)

**Given** the pose similarity score is >= 0.90
**When** the score updates
**Then** the screen shows a green glow effect
**And** a brief white flash overlay appears (150ms, per UX6)

**And** color transitions use 300ms ease-in-out (per UX4)
**And** the glow layer is at z-index 20 (per UX3)
**And** animations respect `prefers-reduced-motion` (per UX7)

---

## Story 3.3: Target Pose Wireframe Overlay

As a **user**,
I want **to see a target pose wireframe showing where I should position my body**,
So that **I have a clear guide to follow**.

**Acceptance Criteria:**

**Given** a target pose is loaded
**When** the camera screen is active
**Then** the target pose wireframe is drawn on the canvas
**And** the target wireframe is distinguishable from the user's tracking wireframe (different color/opacity)
**And** the target wireframe scales to fit the screen appropriately
**And** the user can see both their current pose and the target pose simultaneously

---

## Story 3.4: Pose Hint Card Component

As a **user**,
I want **to see the pose name and a helpful action hint**,
So that **I understand what pose to do and how to achieve it**.

**Acceptance Criteria:**

**Given** a pose is selected
**When** the camera screen is active
**Then** a floating card appears showing the pose name (e.g., "Confident Sit")
**And** the card shows an action hint (e.g., "Lean back, arm on armrest")
**And** the card uses semi-transparent dark background (#1a1a1a/80, rounded-2xl)
**And** the pose name uses Inter 600, 20px, white
**And** the action hint uses Inter 400, 14px, secondary color
**And** the card is positioned at the bottom center of the screen
**And** the card has z-index 50 (above glow, below controls)

---

## Story 3.5: Text Prompts for Corrections

As a **user**,
I want **to see one corrective suggestion at a time telling me how to adjust my pose**,
So that **I am not overwhelmed with too much feedback**.

**Acceptance Criteria:**

**Given** my pose does not match the target (score < 0.90)
**When** the system analyzes the pose difference
**Then** a single text prompt appears (e.g., "Tilt head left" or "Raise your chin")
**And** only one correction is shown at a time (sequential, not simultaneous)
**And** the prompt uses a friendly, casual tone
**And** the prompt updates as I adjust my pose
**And** the prompt disappears when pose matches (score >= 0.90)

---
