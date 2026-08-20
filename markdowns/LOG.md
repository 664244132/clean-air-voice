# 📜 บันทึกประวัติการพัฒนาและการเปลี่ยนแปลง (Changelog & Development Log)

**Clean Air Voice Assistant Project**
เอกสารนี้ใช้สำหรับบันทึกประวัติการเปลี่ยนแปลง การปรับปรุงโครงสร้าง และสถานะการพัฒนาของโปรเจกต์ **clean-air-voice** ตามมาตรฐาน [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## 📌 สรุปสถานะการพัฒนาปัจจุบัน (Current Milestone)

- **เวอร์ชันปัจจุบัน**: `v1.1.0`
- **สถานะ**: ปรับปรุงการออกแบบ UI/UX หน้า Index สำเร็จ, แยกระบบเป็น Modular ES Modules และอัปเดตเอกสารคู่มือครบถ้วน
- **ระบบหลัก**: ทำงานได้สมบูรณ์ (Node.js Express Backend + Gemini Live API + Web Audio DSP + Frequency Visualizer Canvas + Video Modal)

---

## 🗓 บันทึกประวัติการเปลี่ยนแปลง (Changelog)

### [1.1.0] - 2026-08-20
#### ✨ Features & Redesign
- **Dark Futuristic UI**: ปรับปรุงการออกแบบหน้าเว็บหลัก (`public/index.html`) เป็นธีมโทนเข้ม Zinc 950 (`#09090b`) พร้อมแสงเรืองรอง (Cyan Glow & LED Status Indicators) จากต้นแบบโฟลเดอร์ `index/`
- **2D Canvas Frequency Visualizer**: เพิ่มตัวแสดงผลความถี่เสียงแบบเรียลไทม์ 72-bar บน Canvas 2D ขับเคลื่อนด้วย `AnalyserNode`
- **Pulsing Mic Action Button**: ออกแบบปุ่มกดไมโครโฟนทรงกลมขนาดใหญ่พร้อม Animation วงแหวน Pulse สลับสถานะ ไอคอน และเอฟเฟกต์ Glow
- **Responsive Video Modal Overlay**: เพิ่มส่วนแสดงผลวิดีโอแบบ Modal ปรากฏขึ้นอัตโนมัติเมื่อ AI เรียกใช้ Tool `open_clean_air_video` และปิดกลับอัตโนมัติเมื่อเล่นจบ

#### 🛠 Architecture & Refactoring
- **Modular Frontend Architecture**: แยกโค้ดฝั่ง Client ออกเป็นโมดูลเดี่ยวตามหลัก Single Responsibility ใน `public/`:
  - `public/css/style.css`: Design Tokens, Typography, CSS Variables และ Keyframe Animations
  - `public/js/audio-helper.js`: ตัวจัดการ PCM16, Base64, Audio Queue Player และ Canvas Visualizer
  - `public/js/gemini-client.js`: ตัวจัดการ Gemini Live API Connection, Ephemeral Token และ Tool Responses
  - `public/js/ui-controller.js`: ตัวควบคุม DOM Element, Status Badges, Transcript และ Video Modal
  - `public/js/app.js`: Main Entry Point เชื่อมโยงทุกโมดูลเข้าด้วยกัน
- **De Morgan's Laws & Early Return**: ปรับปรุงตรรกะในฟังก์ชันให้แบนราบ ไร้ nested if และแปลงนิพจน์เงื่อนไขตามกฎ De Morgan ทั้งหมด

#### 📚 Documentation & Specs
- **`docs/superpowers/specs/2026-08-20-index-design-refactor.md`**: จัดทำเอกสาร Design Spec สำหรับสถาปัตยกรรมและการออกแบบ UI
- **`docs/superpowers/plans/2026-08-20-index-redesign.md`**: จัดทำแผนงานพัฒนา (Implementation Plan)
- **`markdowns/aboutProject.md`**: อัปเดตข้อมูลสถาปัตยกรรม, UI Visualizer, โมดูลระบบ และแผนผังโครงสร้างไฟล์ในโปรเจกต์ให้ตรงตามปัจจุบัน

---

### [1.0.0] - 2026-08-20
#### ✨ Features & Core Capabilities
- **Express Backend Service**: ติดตั้ง `server.js` พร้อม Endpoint `/api/token` เพื่อสร้าง Ephemeral Token อย่างปลอดภัยโดยใช้ `@google/genai` SDK
- **Gemini Live API Integration**: เชื่อมต่อแบบ Bi-directional Realtime Audio Streaming กับโมเดล `gemini-3.1-flash-live-preview`
- **Wake-Word & Command System**:
  - รองรับคำปลุก (Wake Word) **"ไอที"** พร้อมตอบกลับ *"คุณต้องการให้ทำอะไร"*
  - รองรับคำสั่งเสียง **"Clean Air for Life"** เพื่อเรียก Function `open_clean_air_video`
- **HTML5 Video Player**: ติดตั้งส่วนแสดงผลวิดีโอ `clean-air-for-life.mp4` เมื่อได้รับคำสั่งเสียง
- **Web Audio DSP Pipeline**:
  - แปลงเสียงไมโครโฟนสดเป็น Linear PCM 16kHz ส่งผ่าน WebSocket
  - ถอดรหัสเสียงตอบกลับ Linear PCM 24kHz พร้อมระบบคิวเล่นเสียงแบบไร้รอยต่อ

#### 🛡 Security & Configuration
- **`.gitignore`**: สร้างกฎการละเว้นไฟล์เพื่อป้องกันการบันทึก `node_modules/`, `.env` และไฟล์มีเดียขนาดใหญ่ขึ้น Git
- **`.antigravityignore`**: กำหนดกฎการข้ามไฟล์สำหรับระบบ AI เพื่อเพิ่มประสิทธิภาพและรักษาความปลอดภัยของ Token

#### 📚 Documentation & Guidelines
- **`aboutProject.md`**: จัดทำเอกสารสรุปภาพรวมโปรเจกต์ วัตถุประสงค์ สถาปัตยกรรม และคู่มือการติดตั้ง
- **`REFACTORCODE.md`**: กำหนดแนวทางการแบ่งโมดูล มาตรฐานการเขียนโค้ด และกฎข้อบังคับของโปรเจกต์
- **`DEBUG.md`**: จัดทำคู่มือวิเคราะห์และแก้ไขปัญหาที่พบบ่อย (Troubleshooting Guide)
- **`LOG.md`**: วางโครงสร้างบันทึกประวัติการเปลี่ยนแปลง
- **Coding Guides**: รวบรวมมาตรฐานการเขียนโค้ด HTML, CSS, Tailwind CSS, PHP, SQL และกฎ De Morgan's Laws / Early Return

---

## 📝 แนวทางการบันทึก Log สำหรับการพัฒนาในอนาคต

เมื่อมีการเปลี่ยนแปลงหรือเพิ่มฟังก์ชันใหม่ในโปรเจกต์ ให้บันทึกตามหมวดหมู่ดังนี้:
- **`Added`**: สำหรับฟีเจอร์หรือความสามารถใหม่ที่เพิ่มเข้ามา
- **`Changed`**: สำหรับการแก้ไขหรือปรับปรุงฟังก์ชันการทำงานเดิม
- **`Deprecated`**: สำหรับฟังก์ชันที่กำลังจะถูกยกเลิกในอนาคต
- **`Removed`**: สำหรับฟังก์ชันหรือไฟล์ที่ถูกลบออก
- **`Fixed`**: สำหรับการแก้ไขบั๊กหรือข้อผิดพลาด
- **`Security`**: สำหรับการปรับปรุงเรื่องความปลอดภัยและช่องโหว่
