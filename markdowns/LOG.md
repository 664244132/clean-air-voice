# 📜 บันทึกประวัติการพัฒนาและการเปลี่ยนแปลง (Changelog & Development Log)

**Clean Air Voice Assistant Project**
เอกสารนี้ใช้สำหรับบันทึกประวัติการเปลี่ยนแปลง การปรับปรุงโครงสร้าง และสถานะการพัฒนาของโปรเจกต์ **clean-air-voice** ตามมาตรฐาน [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## 📌 สรุปสถานะการพัฒนาปัจจุบัน (Current Milestone)

- **เวอร์ชันปัจจุบัน**: `v1.0.0`
- **สถานะ**: อยู่ในขั้นตอนการจัดระเบียบโครงสร้างเอกสารและมาตรฐานการพัฒนา (Documentation & Configuration Setup)
- **ระบบหลัก**: ทำงานได้สมบูรณ์ (Node.js Express Backend + Gemini Live API + Web Audio + Video Playback)

---

## 🗓 บันทึกประวัติการเปลี่ยนแปลง (Changelog)

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
