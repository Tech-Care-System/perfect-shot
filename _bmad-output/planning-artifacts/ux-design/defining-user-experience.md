# Defining User Experience

## The Defining Experience

**"AI tells you how to pose, then captures the perfect shot automatically"**

ภาษาไทย: "AI บอกท่าโพส แล้วถ่ายให้อัตโนมัติเมื่อพร้อม"

User อธิบายให้เพื่อนฟัง:

> "มันคือแอปที่ AI ดู scene แล้วบอกว่าต้องโพสยังไง พอโพสถูกปุ๊บมันก็ถ่ายให้เลย ไม่ต้องคิดอะไรเลย!"

## User Mental Model

**Current Pain Points:**

- Static samples → ต้องเทียบเอง ไม่รู้ว่าถูกหรือยัง
- Vague instructions → "ยืนตรงๆ" ไม่ชัดเจน
- Trial and error → ถ่าย 50 รูป ได้ 1 รูป
- No guidance → Camera freeze

**User Expectations → Our Response:**

| Expectation           | Response                          |
| --------------------- | --------------------------------- |
| "บอกฉันว่าต้องทำอะไร" | AI แนะนำ pose + action hint       |
| "รู้ว่าใกล้จะถูกแล้ว" | Color feedback (Red→Yellow→Green) |
| "ไม่ต้องคิดมาก"       | AI ตัดสินใจ pose ให้              |
| "ถ่ายให้เมื่อพร้อม"   | Smart Shutter auto-capture        |

## Success Criteria

| Criteria             | Target                          |
| -------------------- | ------------------------------- |
| Time to First Match  | < 30 seconds                    |
| Match Understanding  | 100% clear from color + prompts |
| Capture Satisfaction | "Better than usual" composition |
| Override Available   | Always (Manual + Next Pose)     |
| Subject Awareness    | Clear Ding + Haptic signal      |

**"This Just Works" Moments:**

1. เปิด app → เห็น camera ทันที (no login, no tutorial)
2. AI recommend pose → wireframe ปรากฏทันที
3. ขยับตามแล้ว → สีเปลี่ยนเป็น Green → Ding! → Auto-capture
4. ดู preview → "โอ้ ดีกว่าปกติ!" → Save!

## Novel UX Patterns

**Our Innovations:**

| Innovation                        | What's New                                      |
| --------------------------------- | ----------------------------------------------- |
| **AI Pose Recommendation**        | Scene analysis → automatic pose suggestion      |
| **Real-time Wireframe Overlay**   | Skeleton moves with user in real-time           |
| **Smart Shutter**                 | Auto-capture when pose matches                  |
| **Dual-Channel Subject Feedback** | Audio + Haptic for subject who can't see screen |

**Familiar Metaphor:**

> "Like a friend who's good at photography, telling you exactly what to do"

## Experience Mechanics

**1. Initiation:**

- Open app → Camera view opens immediately
- AI analyzes scene + objects (1-2 sec)
- Wireframe + Pose Name + Action Hint appear

**2. Interaction:**

- User sees wireframe: "Stage Power" + "Shoulders back, chin up"
- User adjusts body → Color: Red → Yellow
- User matches pose → Color: Yellow → Green
- User taps 'Next Pose' → New pose recommended

**3. Feedback:**

| State           | Visual             | Audio      | Haptic       |
| --------------- | ------------------ | ---------- | ------------ |
| Far from target | Red glow           | -          | -            |
| Getting close   | Yellow glow        | -          | -            |
| Match!          | Green glow + flash | "Ding!" 🔔 | Vibration 📳 |

**4. Completion:**

- Auto-capture → Preview screen
- Save/Retake buttons
- Return to camera for next shot

---
