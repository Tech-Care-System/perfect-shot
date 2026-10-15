# Epic 1: Project Foundation & Camera Access

## Story 1.1: Initialize Next.js Project with Design System

As a **developer**,
I want **a properly initialized Next.js project with Shadcn/UI, Tailwind CSS, and all required dependencies**,
So that **I have a solid foundation following the architectural decisions**.

**Acceptance Criteria:**

**Given** the project directory is empty
**When** I run the initialization commands from the architecture document
**Then** a Next.js project is created with TypeScript, Tailwind CSS, ESLint, App Router, and `src` directory structure
**And** Shadcn/UI is initialized with dark mode enabled
**And** Button, Sheet, and Dialog components are installed
**And** Jotai and @mediapipe/tasks-vision are installed
**And** The project builds successfully with `npm run build`
**And** The dev server runs on `localhost:3000` with `npm run dev`

**Technical Notes:**

- Follow AR1 initialization commands exactly
- Configure dark mode in tailwind.config.ts (class strategy)
- Set up CSS variables in globals.css per UX1-UX3
- Add Inter font from Google Fonts (UX2)

---

## Story 1.2: Camera Permission Request Flow

As a **user**,
I want **to grant camera permission through a friendly explanation screen**,
So that **I understand why the app needs camera access before granting permission**.

**Acceptance Criteria:**

**Given** I am a first-time user opening the app
**When** the app loads
**Then** I see a welcome screen explaining that camera access is needed
**And** the explanation describes the value ("Real-time pose guidance")
**And** I see a "Grant Camera Access" button
**And** tapping the button triggers the browser's camera permission prompt
**And** the request happens on user gesture (not automatically on page load)

**Given** I denied camera permission previously
**When** I tap "Grant Camera Access" again
**Then** I see instructions on how to re-enable camera access in browser settings
**And** the app detects if permission is granted after returning from settings

---

## Story 1.3: Camera Preview Component (Back Camera Default)

As a **user**,
I want **to see a live camera preview filling the screen**,
So that **I can see myself or my subject in real-time**.

**Acceptance Criteria:**

**Given** camera permission is granted
**When** the camera screen loads
**Then** I see a full-screen video preview from the back camera (portrait mode default)
**And** the preview fills the viewport with no black bars
**And** the video is mirrored when using front camera (selfie), not mirrored for back camera
**And** the app uses `getUserMedia` with portrait-optimized constraints
**And** the video element is positioned at z-index 1 (per UX3)

---

## Story 1.4: Camera Switching (Front/Back Toggle)

As a **user**,
I want **to switch between front and back cameras**,
So that **I can take selfies or photos of others**.

**Acceptance Criteria:**

**Given** I am viewing the camera preview
**When** I tap the camera flip button
**Then** the camera switches from back to front (or vice versa)
**And** the transition happens smoothly without jarring flash
**And** the button uses the camera flip icon (📷 or ⟳)
**And** the button is 44x44px minimum touch target (UX8)
**And** the front camera view is mirrored, back camera is not

---
