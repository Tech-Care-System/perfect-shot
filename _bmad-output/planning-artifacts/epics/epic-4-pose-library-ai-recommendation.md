# Epic 4: Pose Library & AI Recommendation

## Story 4.1: Pose Library Data Structure

As a **developer**,
I want **a structured pose library with scene-tagged poses**,
So that **poses can be organized and filtered by scene type**.

**Acceptance Criteria:**

**Given** the project needs pose presets
**When** I create the pose library
**Then** JSON files exist in `src/data/poses/` for each scene type
**And** scene types include: solo-chair, sofa, standing, stage
**And** each scene type has 3-4 poses (12-16 total)
**And** each pose has: id, name, actionHint, sceneType, targetLandmarks
**And** an index.ts file exports all poses with type safety
**And** poses use the `PosePreset` TypeScript interface

---

## Story 4.2: Pose Loading and State Management

As a **developer**,
I want **poses loaded into Jotai state for reactive updates**,
So that **the UI responds instantly to pose changes**.

**Acceptance Criteria:**

**Given** the pose library is created
**When** the app initializes
**Then** available poses are loaded into Jotai atoms
**And** `currentPoseAtom` tracks the currently selected pose
**And** `availablePosesAtom` tracks poses for current scene
**And** poses are filtered by detected scene type
**And** state updates trigger UI re-renders efficiently

---

## Story 4.3: Scene-Based Pose Recommendation

As a **user**,
I want **the AI to recommend a pose based on my environment**,
So that **I don't have to choose a pose myself**.

**Acceptance Criteria:**

**Given** the camera is active and showing a scene
**When** the app analyzes the environment
**Then** a pose appropriate for the scene is automatically selected
**And** for MVP, scene detection uses simple heuristics (e.g., detected person position)
**And** the recommended pose appears immediately without user selection
**And** the pose hint card shows the recommended pose name and action

---

## Story 4.4: Next Pose Button

As a **user**,
I want **to request a different pose if I don't like the current recommendation**,
So that **I have some control over the pose selection**.

**Acceptance Criteria:**

**Given** a pose is currently recommended
**When** I tap the "Next Pose" button
**Then** a different pose from the same scene category is selected
**And** the wireframe updates to show the new target pose
**And** the pose hint card updates with new pose name and action hint
**And** the button is 44x44px minimum touch target
**And** if all poses in category are exhausted, it cycles back to first

---
