# Epic 7: Device Compatibility & Performance

## Story 7.1: Device Capability Benchmark

As a **developer**,
I want **to detect device performance on first launch**,
So that **I can adjust app settings for optimal experience**.

**Acceptance Criteria:**

**Given** the app launches for the first time
**When** initial setup runs
**Then** a quick benchmark runs (5 frames of pose detection)
**And** FPS is measured during the benchmark
**And** results are stored in localStorage for future sessions
**And** benchmark completes in < 2 seconds
**And** user sees a loading indicator during benchmark

---

## Story 7.2: Lite Mode Implementation

As a **user on a lower-end device**,
I want **the app to automatically adjust for my device's capabilities**,
So that **I still get a smooth experience**.

**Acceptance Criteria:**

**Given** device benchmark shows FPS < 15
**When** the app enters Lite Mode
**Then** pose detection runs at reduced rate (15 FPS target)
**And** animations are simplified or reduced
**And** the user is notified that Lite Mode is active
**And** core functionality (wireframe, feedback, capture) still works
**And** Lite Mode can be toggled in settings if desired

---

## Story 7.3: Unsupported Device Warning

As a **user on a very old device**,
I want **to be informed if my device cannot run the app properly**,
So that **I understand why the experience may be degraded**.

**Acceptance Criteria:**

**Given** device benchmark shows FPS cannot sustain even 10 FPS
**When** the unsupported threshold is reached
**Then** a friendly warning message appears
**And** the message explains limitations ("Your device may have slower feedback")
**And** the app still allows usage (not blocked)
**And** manual shutter is highlighted as the primary capture method

---

## Story 7.4: PWA Manifest and Icons

As a **user**,
I want **to install the app on my home screen**,
So that **I can access it like a native app**.

**Acceptance Criteria:**

**Given** the app is accessed via browser
**When** I visit the app URL
**Then** a valid PWA manifest is present at `/manifest.webmanifest`
**And** the manifest includes: name, short_name, theme_color, icons
**And** icons are provided in required sizes (192x192, 512x512)
**And** display mode is set to "standalone"
**And** orientation is locked to "portrait"
**And** the app is installable via browser's "Add to Home Screen"

---

## Story 7.5: Production Deployment to Vercel

As a **developer**,
I want **the app deployed to Vercel with automatic deploys**,
So that **updates are published automatically on push**.

**Acceptance Criteria:**

**Given** the project is connected to GitHub
**When** code is pushed to the main branch
**Then** Vercel automatically builds and deploys
**And** preview deployments are created for pull requests
**And** the app is served over HTTPS
**And** CSP headers are configured correctly
**And** the production URL is accessible on mobile browsers

---
