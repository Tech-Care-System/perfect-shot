# Epic 6: Smart Capture & Output

## Story 6.1: Smart Shutter (Auto-Capture)

As a **user**,
I want **the photo to capture automatically when my pose matches the target**,
So that **I get the perfect shot without timing the button press**.

**Acceptance Criteria:**

**Given** I am following the wireframe guide
**When** my pose similarity score exceeds 0.90 for 500ms
**Then** the shutter fires automatically
**And** a brief white flash appears on screen (150ms)
**And** a photo is captured from the current video frame
**And** the app transitions to the preview screen
**And** the threshold is configurable but defaults to 0.90

---

## Story 6.2: Manual Shutter Override

As a **user**,
I want **to capture a photo manually at any time**,
So that **I am never locked out from taking a photo**.

**Acceptance Criteria:**

**Given** the camera screen is active
**When** I tap the shutter button
**Then** a photo is captured immediately regardless of pose score
**And** the shutter button is always visible and accessible
**And** the shutter button is 64x64px (per UX8)
**And** the button provides visual feedback (scale 0.95) on press
**And** the app transitions to preview screen after capture

---

## Story 6.3: Audio Feedback (Ding Sound)

As a **subject being photographed**,
I want **to hear a "ding" sound when my pose matches**,
So that **I know to hold still even if I can't see the screen**.

**Acceptance Criteria:**

**Given** pose detection is running
**When** the pose match score reaches 0.90+
**Then** a pleasant "ding" audio cue plays
**And** the sound is preloaded on first user interaction (per UX12)
**And** the audio file is located at `/public/sounds/ding.mp3`
**And** the sound plays before or simultaneously with auto-capture
**And** audio failure is handled gracefully (no errors if muted)

---

## Story 6.4: Haptic Feedback (Vibration)

As a **subject being photographed**,
I want **the phone to vibrate when my pose matches**,
So that **I feel the confirmation physically**.

**Acceptance Criteria:**

**Given** pose detection is running on a device with vibration support
**When** the pose match score reaches 0.90+
**Then** a short vibration occurs (50ms)
**And** the app checks for `navigator.vibrate` support first (per UX13)
**And** vibration failure is handled gracefully (no errors if unsupported)
**And** vibration occurs simultaneously with audio ding

---

## Story 6.5: Photo Preview Screen

As a **user**,
I want **to see my captured photo before saving**,
So that **I can decide to keep it or retake**.

**Acceptance Criteria:**

**Given** a photo has been captured
**When** the capture completes
**Then** a full-screen preview of the photo appears
**And** the preview includes "Save" and "Retake" buttons
**And** the buttons are clearly visible and accessible
**And** the preview has z-index above the camera (modal level)
**And** tapping outside the preview doesn't accidentally dismiss it

---

## Story 6.6: Save to Camera Roll

As a **user**,
I want **to save my photo to my device's camera roll**,
So that **I can share it on social media later**.

**Acceptance Criteria:**

**Given** I am viewing the photo preview
**When** I tap the "Save" button
**Then** the photo is saved to the device's camera roll/photos
**And** a success confirmation appears briefly
**And** the app returns to the camera screen for another shot
**And** on browsers without direct save, a download is triggered
**And** the file is named with timestamp (e.g., `ai-perfect-shot-YYYY-MM-DD.jpg`)

---
