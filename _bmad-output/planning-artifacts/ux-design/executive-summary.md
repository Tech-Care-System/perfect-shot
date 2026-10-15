# Executive Summary

## Project Vision

**ai-perfect-shot** เป็น Progressive Web App (PWA) ที่ทำหน้าที่เป็น **Real-time AI Photography Director** — แอปที่ให้คำแนะนำแบบ active ระหว่างการถ่ายภาพ โดย AI เข้าใจ scene และแนะนำ pose ที่เหมาะสมให้อัตโนมัติ

**Core Promise:** "ช่วยให้ทุกคนถ่ายรูปสวยได้ โดยไม่ต้องมีความรู้เรื่องการโพส"

**Differentiator:**

- **AI-Powered Pose Recommendation** — AI วิเคราะห์ scene + objects แล้วแนะนำ pose ที่เหมาะสม
- **Active Real-time Coaching** ผ่าน Forgiving Gradient Feedback (Red → Yellow → Green)
- **Smart Shutter** ที่ถ่ายอัตโนมัติเมื่อ pose match
- **Zero Data Egress** — ทั้งหมดประมวลผลบนเครื่องผู้ใช้ 100%

## Target Users

### Primary Persona: "The Reluctant Photographer" (Joe)

- **Profile:** ชาย 21 ปี, นักศึกษา, มักถูกแฟน/เพื่อนขอให้ถ่ายรูปให้
- **Pain Point:** กลัวการถ่ายรูปเพราะมักถูกตำหนิ ("หัวโดนตัด!", "ทำไมขาดูสั้น?")
- **Need:** Tool ที่ช่วย guide ว่าต้องจัดกล้องยังไง โดยไม่ต้องมีความรู้เรื่อง composition
- **Context:** ใช้ back camera ถ่ายให้คนอื่น (Portrait mode)

### Secondary Persona: "The Solo Selfie Queen" (Ping)

- **Profile:** หญิง 25 ปี, พนักงานออฟฟิศ, ชอบโพสต์ IG Story
- **Pain Point:** "ดูดีในกระจก แต่รูปออกมาแย่ทุกที"
- **Need:** Guidance ที่ช่วยให้ถ่าย selfie ได้สวยในครั้งเดียว
- **Context:** ใช้ front camera ถ่ายตัวเอง (Selfie mode)

### User Mindset (Gen Z)

- ชอบ **Authenticity** มากกว่า over-edited perfection
- ต้องการ "Candid, Lo-Fi" aesthetic
- **30-Second Rule:** ถ้าไม่เห็น "Magic" ใน 30 วินาทีแรก = Uninstall

## Key Design Challenges

| #   | Challenge                      | Description                                                    | Impact                                      |
| --- | ------------------------------ | -------------------------------------------------------------- | ------------------------------------------- |
| 1   | **Judgment-Free Feedback**     | Red/Yellow/Green ต้องไม่ทำให้ user รู้สึกว่า "สอบตก"           | ต้อง design ให้เป็น coaching ไม่ใช่ grading |
| 2   | **Subject-Photographer Split** | Subject (คนถูกถ่าย) มองจอไม่เห็น แต่ต้องรู้ว่า pose match แล้ว | Audio/Haptic feedback ที่ clear และ timely  |
| 3   | **Info Density Management**    | Wireframe + Color + Text + Score อาจ overwhelming              | Progressive disclosure ที่ไม่รกจอ           |
| 4   | **First 30 Seconds**           | User ต้องเข้าใจและถ่ายรูปสำเร็จภายใน 30 วินาที                 | Minimal but effective onboarding            |
| 5   | **Graceful Degradation**       | เมื่อ AI ตรวจจับไม่ได้ (แสงไม่ดี, ไกลเกินไป)                   | Guide ไม่ใช่ error message                  |

## Design Opportunities

| #   | Opportunity                    | Description                                             | Expected Impact                   |
| --- | ------------------------------ | ------------------------------------------------------- | --------------------------------- |
| 1   | **"Forgiving Gradient" UX**    | ใช้ gradient feedback ให้ทุก pose รู้สึก "almost there" | ลด anxiety, เพิ่ม engagement      |
| 2   | **"Ding Moment" Celebration**  | Pose match = rewarding sound + visual                   | สร้าง positive reinforcement loop |
| 3   | **"Coach Voice" Persona**      | Text prompts ที่ friendly และ encouraging               | สร้าง emotional connection        |
| 4   | **"Invisible UI" Camera Mode** | UI หายไปเมื่อ user อยู่ใน flow                          | Immersive experience              |
| 5   | **"AI Director" Experience**   | AI แนะนำ pose ให้ ไม่ต้องเลือกเอง                       | Zero decision fatigue             |

---
