# 🛠 คู่มือแนวทางการพัฒนาและรีแฟคเตอร์โค้ด (Refactoring & Development Guide)

**Clean Air Voice Assistant Project**
เอกสารนี้กำหนดมาตรฐาน โครงสร้างสถาปัตยกรรม และแนวทางการเขียนโค้ดสำหรับโปรเจกต์ **clean-air-voice** เพื่อให้โค้ดมีคุณภาพสูง ดูแลรักษาง่าย (Maintainable) มีความปลอดภัย (Secure) และเข้าใจได้ง่ายสำหรับผู้เริ่มต้น (Beginner-friendly)

---

## 1. สถาปัตยกรรมและ Technology Stack ของโปรเจกต์

- **Backend Platform**: Node.js (ES Module / Node 18+)
- **Server Framework**: Express.js (Static Hosting + Ephemeral Auth Token Service)
- **AI Speech & Multimodal Engine**: `@google/genai` (Google Gen AI SDK)
  - Model: `gemini-3.1-flash-live-preview`
  - Mode: Bi-directional WebSocket Audio Streaming & Function Calling
- **Audio DSP & Streaming**: Web Audio API (`AudioContext`, `ScriptProcessorNode` / `AudioWorkletNode`)
  - Input: 16,000 Hz Linear PCM 16-bit mono
  - Output: 24,000 Hz PCM Audio Buffer Playback Queue
- **Frontend Core**: Semantic HTML5, Modern Vanilla CSS, Vanilla JavaScript (ES6+)
- **Media Engine**: HTML5 Native Video Player (`clean-air-for-life.mp4`)

---

## 2. โครงสร้างโมดูลและแนวทางการแยกโค้ด (Modular Architecture)

เพื่อความเป็นระเบียบและง่ายต่อการพัฒนา ให้แบ่งหน้าที่ของแต่ละไฟล์ออกเป็น 1 โมดูลต่อ 1 หน้าที่หลัก (Single Responsibility Principle):

```text
clean-air-voice/
├── server.js               # [Backend] Server Setup & Ephemeral Token Generator
├── public/                 # [Frontend] Client Assets
│   ├── index.html          # Semantic HTML โครงสร้างหน้าเว็บที่รองรับ Accessibility
│   ├── css/
│   │   └── style.css       # Clean Minimalist Design Tokens & Responsive UI
│   ├── js/
│   │   ├── audio-helper.js # ตัวแปลงสัญญาณ PCM16, Base64 และคิวเล่นเสียง AudioContext
│   │   ├── gemini-client.js# ตัวจัดการการเชื่อมต่อ Gemini Live API & Event Callbacks
│   │   └── ui-controller.js# ตัวควบคุมสถานะปุ่มกด การแสดงผลหน้าจอ และวิดีโอ
│   └── app.js              # Entry point ฝั่ง Client เชื่อมโยงทุกโมดูลเข้าด้วยกัน
└── markdowns/              # เอกสารคู่มือและระเบียบการเขียนโค้ด
```

---

## 3. กฎระเบียบและมาตรฐานการเขียนโค้ด (Coding Standards)

### 3.1 การบังคับใช้ De Morgan's Laws และ Early Return Pattern
- **De Morgan's Laws**: หลีกเลี่ยงการใช้ `!(A && B)` หรือ `!(A || B)` ให้กระจาย `!` เข้าไปเป็น `!A || !B` หรือ `!A && !B` พร้อมกลับเครื่องหมายเปรียบเทียบเสมอ
- **Early Return / Guard Clauses**: ตรวจสอบเงื่อนไขข้อผิดพลาดหรือกรณีที่ไม่เข้าเกณฑ์ แล้วสั่ง `return` ออกจากฟังก์ชันทันที เพื่อลดความลึกของปีกกา (Nested if) ทำให้อ่าน Happy Path ได้ง่าย
- ศึกษาเพิ่มเติมได้ที่: [`markdowns/DeMorgansLaws.md`](file:///c:/Users/k2pwm/OneDrive/Desktop/clean-air-voice/markdowns/DeMorgansLaws.md)

### 3.2 มาตรฐานความปลอดภัย (Security & Secrets)
- **ห้ามใส่ API Key ฝั่ง Client เด็ดขาด**: `GEMINI_API_KEY` ต้องถูกอ่านจาก `process.env` ใน `server.js` เท่านั้น
- **การส่งต่อ Token**: ฝั่ง Client ต้องเรียก `GET /api/token` เพื่อขอรับ Ephemeral Token ชั่วคราวที่มีอายุจำกัด
- **ไฟล์ความลับ**: ตรวจสอบว่า `.env` อยู่ใน [`.gitignore`](file:///c:/Users/k2pwm/OneDrive/Desktop/clean-air-voice/.gitignore) และ [`.antigravityignore`](file:///c:/Users/k2pwm/OneDrive/Desktop/clean-air-voice/.antigravityignore) เสมอ

### 3.3 การจัดการเสียงและหน่วยความจำ (Web Audio & Memory Management)
- เมื่อกดหยุดระบบ (`stopSystem`) ต้องทำการ `disconnect()` Audio Nodes ทั้งหมด และสั่ง `getTracks().forEach(t => t.stop())` เพื่อคืนทรัพยากรไมโครโฟนให้เบราว์เซอร์
- ป้องกันปัญหา Audio Buffer Underrun / Desync โดยใช้ระบบ Audio Queue (`outputQueueTime`) ในการเล่นเสียงตอบกลับ

### 3.4 โค้ดที่เข้าใจง่ายและเป็นมิตรกับผู้เริ่มต้น (Beginner-Friendly)
- มีคอมเมนต์ภาษาไทยอธิบายขั้นตอนการทำงานสำคัญๆ อย่างกระชับและชัดเจน
- ใช้ชื่อตัวแปรและฟังก์ชันภาษาอังกฤษที่สื่อความหมายชัดเจน (Descriptive Naming) เช่น `startMicrophone()`, `float32ToPCM16()`, `openCleanAirVideo()`

---

## 4. กฎเหล็กในการทำงาน (Strict Operational Rules)

1. **ห้ามนำข้อมูลเข้า หรือสร้าง Table Database เอง (STRICT RULE 10)**:
   - หากในอนาคตมีการเชื่อมต่อฐานข้อมูล ต้องส่งมอบโค้ดคำสั่ง SQL ให้ผู้ใช้เป็นคนนำไปรันเองเท่านั้น
2. **ห้าม Push หรือ Commit ขึ้น GitHub เอง (STRICT RULE 11)**:
   - ให้ผู้ใช้เป็นผู้ดำเนินการ `git commit` และ `git push` ด้วยตนเองเสมอ
3. **การพัฒนาแบบ Step-by-Step**:
   - แบ่งงานออกเป็นสเต็ปย่อย รายงานสิ่งที่แก้ไข และขอความเห็นชอบก่อนเริ่มสเต็ปถัดไปเสมอ

---

## 5. การอ้างอิงเอกสารคู่มือที่เกี่ยวข้อง

- [`markdowns/aboutProject.md`](file:///c:/Users/k2pwm/OneDrive/Desktop/clean-air-voice/markdowns/aboutProject.md) : ภาพรวมและสถาปัตยกรรมของโปรเจกต์
- [`markdowns/DEBUG.md`](file:///c:/Users/k2pwm/OneDrive/Desktop/clean-air-voice/markdowns/DEBUG.md) : คู่มือการแก้ไขปัญหาและวิเคราะห์ข้อผิดพลาด
- [`markdowns/LOG.md`](file:///c:/Users/k2pwm/OneDrive/Desktop/clean-air-voice/markdowns/LOG.md) : บันทึกประวัติและขั้นตอนการพัฒนา
- [`markdowns/HTMLCodingGuide.md`](file:///c:/Users/k2pwm/OneDrive/Desktop/clean-air-voice/markdowns/HTMLCodingGuide.md) : มาตรฐาน Semantic HTML และ Accessibility
- [`markdowns/CSSCodingGuide.md`](file:///c:/Users/k2pwm/OneDrive/Desktop/clean-air-voice/markdowns/CSSCodingGuide.md) : มาตรฐาน CSS และ Responsive Design
- [`markdowns/DeMorgansLaws.md`](file:///c:/Users/k2pwm/OneDrive/Desktop/clean-air-voice/markdowns/DeMorgansLaws.md) : กฎ De Morgan และ Early Return