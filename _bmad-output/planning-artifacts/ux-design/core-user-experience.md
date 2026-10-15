# Core User Experience

## Core Experience Philosophy

> **"AI abstracts away decisions — user never thinks 'which pose?' They only follow guidance or tap 'Next' for alternatives."**

The app acts as an **AI Photography Director**, not just a pose matcher. It understands the scene, detects usable props, and recommends contextually appropriate poses.

## Defining Experience

**Core Loop:**

```
[Open App] → [AI analyzes scene + objects] → [AI recommends pose] → [User follows wireframe] → [Red→Yellow→Green] → [Ding! + Auto-capture] → [Preview] → [Save/Retake]
```

**Critical Actions:**

1. **Scene Understanding** — AI วิเคราะห์ว่าอยู่ที่ไหน มี props อะไรใช้ได้
2. **Pose Recommendation** — AI เลือก pose ที่เหมาะกับ scene + props
3. **Pose Matching Feedback** — แสดงว่า pose ปัจจุบันห่างจาก target เท่าไหร่
4. **Sequential Corrections** — บอกทีละอย่าง ไม่ overwhelming

**User Override:**

- **'Next Pose' Button** — ถ้าไม่ชอบ pose ที่ AI แนะนำ
- **Manual Shutter** — ถ่ายได้ทันทีไม่ต้องรอ match

## Platform Strategy

| Aspect           | Decision                                             |
| ---------------- | ---------------------------------------------------- |
| Type             | PWA (Progressive Web App)                            |
| Primary Devices  | Mobile (iOS Safari 15.4+, Android Chrome 90+)        |
| Orientation      | Portrait only (locked)                               |
| Input            | Touch-based                                          |
| Offline          | App shell cached; camera requires HTTPS              |
| Core Permissions | Camera (mandatory), Vibration & Audio (nice-to-have) |

## AI Architecture (MVP)

**On-Device AI Stack:**

| Component                      | Purpose                          | Model                              |
| ------------------------------ | -------------------------------- | ---------------------------------- |
| **Pose Detection**             | Detect body landmarks            | MediaPipe Pose Landmarker          |
| **Object Detection**           | Detect props (chair, sofa, etc.) | MediaPipe Object Detection (~5MB)  |
| **Scene Classification**       | Classify scene type              | MobileNet-based classifier (~15MB) |
| **Pose Recommendation Engine** | Match scene + props → best pose  | Rule-based + pose library          |

**Total Model Size:** ~20-25MB (acceptable for web)
**FPS Impact:** 30 FPS → ~22-25 FPS (still smooth)

## MVP Context: Professional/Event Setting

**Target Scenarios:**

- ออกบูธ (Booth events)
- ขึ้นเวที pitch (Stage presentations)
- ถ่ายรูปงาน event (Corporate/professional events)

**Scene Types (MVP):**

| Scene                        | Props Detected | Example Poses                            |
| ---------------------------- | -------------- | ---------------------------------------- |
| **Solo Chair**               | Chair/Stool    | Seated confident, Lean back, Cross-leg   |
| **Sofa/Couch**               | Sofa           | Casual seated, Arm on backrest           |
| **Standing (No Props)**      | None           | Power stance, Hand in pocket, Stage pose |
| **Standing (with backdrop)** | Booth/Banner   | Presenter pose, Product point            |

**Pose Count:** ~12-16 poses (3-4 per scene type)

## Pose Explanation UX

**Format:**

```
[Pose Name]
[Action Hint]
```

**Examples:**

- _'Confident Sit'_ + _'Lean back slightly, arm on armrest'_
- _'Stage Power'_ + _'Shoulders back, chin up'_
- _'Casual Chair'_ + _'Cross your legs, relax shoulders'_

**Display:** Text overlay on camera screen — casual/fun tone

## Effortless Interactions

| Interaction            | Design Goal                                    |
| ---------------------- | ---------------------------------------------- |
| Camera Permission      | Friendly explanation → one tap                 |
| Pose Selection         | **None** — AI recommends automatically         |
| Pose Override          | 'Next Pose' button → AI suggests another       |
| Feedback Understanding | Color-coded (Red/Yellow/Green) = universal     |
| Photo Capture          | Auto-capture on match OR visible manual button |
| Photo Save             | Preview → Save/Retake → Back to camera         |

## Critical Success Moments

| Moment                | Why Critical                       | UX Requirement                          |
| --------------------- | ---------------------------------- | --------------------------------------- |
| **First Match**       | Proves the concept works           | Must feel rewarding (Ding + Green glow) |
| **First Saved Photo** | Validates the result               | Photo must look noticeably better       |
| **Subject Feedback**  | Bridges photographer-subject split | Haptic + audio clear enough to freeze   |
| **Override Trust**    | Builds user confidence             | Never feel like a fallback              |
| **Edge Recovery**     | Prevents frustration               | Helpful guidance, not error messages    |
| **Scene Recognition** | Shows AI "gets it"                 | Pose matches the environment naturally  |

## Experience Principles

1. **Feedback First** — ทุก action มี immediate visual feedback
2. **Progressive Confidence** — Guide จาก Red ไป Green ไม่ใช่แค่บอกว่า "ผิด"
3. **Dual-Channel Output** — ข้อมูลสำคัญมี 2 ช่องทาง (Visual + Audio/Haptic)
4. **Always an Exit** — Manual override เข้าถึงได้เสมอ
5. **Celebrate, Don't Grade** — Ding + glow ไม่ใช่ score display
6. **One Thing at a Time** — ไม่ให้ 3 corrective actions พร้อมกัน (Sequential corrections)
7. **AI Decides, User Follows** — ลด decision fatigue ให้น้อยที่สุด

## Post-Capture Flow

**Standard Camera UX:**

```
[Capture] → [Preview Screen] → [Save / Retake] → [Back to Camera]
```

**MVP Scope:**

- ✅ Preview screen with captured photo
- ✅ Save to Camera Roll button
- ✅ Retake button
- ❌ Post-capture badge/validation (deferred to v2)

---
