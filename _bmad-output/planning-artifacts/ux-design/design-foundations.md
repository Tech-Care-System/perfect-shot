# Design Foundations

## UX Principles

1. **Coaching, Not Judging** — Feedback ต้องรู้สึกเหมือนเพื่อนช่วยแนะนำ ไม่ใช่ระบบให้คะแนน
2. **No User Lockout** — Manual override ต้องเข้าถึงได้เสมอ ไม่เคย block user จากการถ่ายภาพ
3. **Progressive Disclosure** — แสดงข้อมูลเท่าที่จำเป็นในแต่ละ moment
4. **Celebrate Success** — ทุก pose match ต้องรู้สึก rewarding
5. **Privacy by Design** — ทุกอย่างเกิดขึ้นบน device ไม่มีข้อมูลหลุดออกไป
6. **Abstract Away Decisions** — AI ตัดสินใจแทน user ให้มากที่สุด เหลือแค่ที่จำเป็นจริงๆ

## Design Decisions (Confirmed)

| Decision               | Choice                           | Rationale                                                                                                          |
| ---------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Tone of Voice**      | Casual/Fun                       | "ดีมาก! เอียงหน้าอีกนิดนะ" — friendly coach persona                                                                |
| **Color Scheme**       | Dark Mode + Vibrant Accents      | Matches Gen Z "Flash Look" aesthetic trend; dark background ทำให้ wireframe เด่นชัด; pro-feel without being boring |
| **Wireframe Style**    | Skeleton (Clear/Visible)         | ชัดเจน ผู้ใช้เห็นง่ายว่าต้องทำอะไร                                                                                 |
| **Primary Use Case**   | Portrait Mode (Back Camera)      | Joe ถ่ายให้ Mint — optimize for photographer experience first                                                      |
| **Secondary Use Case** | Selfie Mode (Front Camera)       | Ping ถ่ายตัวเอง — support but not primary focus                                                                    |
| **Pose Selection**     | AI Recommends (not user gallery) | Zero decision fatigue — AI เลือกให้ user แค่ follow หรือ tap 'Next'                                                |
| **Pose Explanation**   | Show name + action hint          | เช่น "Confident Sit" + "Lean back, arm on armrest"                                                                 |

## Performance Constraints (Technical)

| Constraint          | Target                                 | Impact on UX              |
| ------------------- | -------------------------------------- | ------------------------- |
| Pose Detection FPS  | 30 FPS (flagship) / 15 FPS (mid-range) | Smooth feedback animation |
| Feedback Latency    | < 100ms                                | Real-time feel            |
| Time to Interactive | < 3 seconds                            | First impression          |
| Memory Usage        | < 300MB                                | No device sluggishness    |

---
