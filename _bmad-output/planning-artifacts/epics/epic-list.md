# Epic List

## Epic 1: Project Foundation & Camera Access

**Goal:** ผู้ใช้สามารถเปิดแอปและเข้าถึงกล้องได้ทันที พร้อมสลับกล้องหน้า/หลังได้

**User Outcome:** เปิด app → เห็น camera preview ทันที พร้อม permission flow ที่เป็นมิตร

**FRs Covered:** FR1, FR2, FR3, FR27, FR28
**NFRs Addressed:** NFR-S3, NFR-S5, NFR-C1, NFR-C2, NFR-C3
**Additional Requirements:** AR1-AR13 (Project initialization), UX1-UX3 (Dark mode, Font, Z-index)

---

## Epic 2: Real-time Pose Detection & Wireframe

**Goal:** ผู้ใช้เห็น wireframe โพสบนหน้าจอที่เคลื่อนไหวตาม body ของตัวเองแบบ real-time

**User Outcome:** User เห็น skeleton wireframe ที่ track body ได้ที่ 30 FPS

**FRs Covered:** FR7, FR10, FR24
**NFRs Addressed:** NFR-P1, NFR-P2, NFR-P9, NFR-S2, NFR-S4
**Additional Requirements:** AR2 (Web Worker), AR4 (CDN for models), AR5 (2D Canvas)

---

## Epic 3: Pose Matching & Visual Feedback

**Goal:** ผู้ใช้เห็น feedback แบบ Red/Yellow/Green เมื่อ pose ใกล้เคียง target พร้อม text prompts ช่วยแก้ไข

**User Outcome:** User เห็น color-coded feedback และคำแนะนำว่าต้องปรับ pose อย่างไร

**FRs Covered:** FR8, FR9, FR13, FR14, FR15
**NFRs Addressed:** NFR-P2, NFR-A2
**Additional Requirements:** UX4, UX5, UX6, UX7 (Animations), UX11 (Pose hint card)

---

## Epic 4: Pose Library & AI Recommendation

**Goal:** AI วิเคราะห์ scene และแนะนำ pose ที่เหมาะสมอัตโนมัติ ผู้ใช้สามารถขอ pose ถัดไปได้

**User Outcome:** User ได้รับ pose recommendation ที่เหมาะกับ scene โดยไม่ต้องเลือกเอง

**FRs Covered:** FR21, FR22, FR23, FR24
**Additional Requirements:** UX10 (PoseHintCard, ControlBar), AR6 (idb for storage)

---

## Epic 5: Subject Detection & Edge Case Handling

**Goal:** ระบบตรวจจับเมื่อ subject ไกลเกินไป/หลุดเฟรม/แสงไม่ดี และแสดงคำแนะนำที่เป็นมิตร

**User Outcome:** User ได้รับ helpful guidance แทน error messages เมื่อมีปัญหา

**FRs Covered:** FR11, FR12, FR16, FR17
**NFRs Addressed:** NFR-R2

---

## Epic 6: Smart Capture & Output

**Goal:** เมื่อ pose match ระบบถ่ายรูปอัตโนมัติพร้อม feedback ครบทุก channel และบันทึกภาพได้

**User Outcome:** User ได้รูปที่ถ่ายอัตโนมัติเมื่อ pose match พร้อม Ding + Vibration + Save

**FRs Covered:** FR4, FR5, FR6, FR18, FR19, FR20
**NFRs Addressed:** NFR-P5, NFR-A1
**Additional Requirements:** UX6 (Match flash), UX12 (Audio preload), UX13 (Haptic)

---

## Epic 7: Device Compatibility & Performance

**Goal:** แอปทำงานได้ดีบนทุกอุปกรณ์ มี Lite Mode สำหรับเครื่อง low-end พร้อม deploy

**User Outcome:** User บนทุกเครื่องได้รับประสบการณ์ที่ดีที่สุดตามความสามารถของ device

**FRs Covered:** FR29, FR30, FR31, FR32
**NFRs Addressed:** NFR-P3, NFR-P4, NFR-P6, NFR-P7, NFR-P8, NFR-R1, NFR-R3, NFR-C4
**Additional Requirements:** AR8 (Vercel deployment)

---

## Epic 8: Onboarding & Polish

**Goal:** ผู้ใช้ใหม่เข้าใจวิธีใช้งานภายใน 30 วินาที

**User Outcome:** First-time user สามารถถ่ายรูปสำเร็จภายใน 30 วินาทีแรก

**FRs Covered:** FR25, FR26
**NFRs Addressed:** NFR-A3
**Additional Requirements:** UX8 (Touch targets)

---
