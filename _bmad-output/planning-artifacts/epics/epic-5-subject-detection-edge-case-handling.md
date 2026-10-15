# Epic 5: Subject Detection & Edge Case Handling

## Story 5.1: Subject Distance Detection

As a **user**,
I want **to be told if I'm too far from the camera**,
So that **I can move closer for better pose detection**.

**Acceptance Criteria:**

**Given** the camera is active and detecting a person
**When** the detected body landmarks indicate the subject is too small in frame
**Then** a friendly prompt appears: "Step closer to the camera"
**And** the message is displayed in the pose hint area
**And** the prompt uses encouraging language, not error language
**And** the prompt disappears when subject is at appropriate distance

---

## Story 5.2: Subject Framing Detection

As a **user**,
I want **to be told if part of my body is cut off by the frame**,
So that **I can adjust my position for full body tracking**.

**Acceptance Criteria:**

**Given** the camera is detecting pose landmarks
**When** key landmarks (shoulders, hips) are at the edge or outside frame
**Then** a friendly prompt appears: "Move [left/right] to fit in frame"
**And** the direction is calculated based on which side is cut off
**And** the prompt updates dynamically as I move
**And** the prompt disappears when I'm fully in frame

---

## Story 5.3: Lighting Condition Warning

As a **user**,
I want **to be warned about poor lighting conditions**,
So that **I can adjust my position or the shot will still work**.

**Acceptance Criteria:**

**Given** the camera is active
**When** the lighting analysis detects backlighting or very low light
**Then** a subtle warning indicator appears (e.g., sun icon with warning)
**And** the warning is non-blocking (I can still take photos)
**And** the warning uses a gentle icon, not alarming red error
**And** this is a "nice to have" for MVP - basic implementation acceptable

---

## Story 5.4: Graceful Detection Failure

As a **user**,
I want **the app to handle detection failures gracefully**,
So that **I never feel stuck or frustrated**.

**Acceptance Criteria:**

**Given** the pose detection system encounters difficulty
**When** no pose can be detected for 3+ seconds
**Then** a helpful message appears: "Having trouble detecting you. Try better lighting."
**And** the manual shutter remains available at all times
**And** previous pose state is preserved if detection resumes
**And** the app never shows technical error messages to users

---
