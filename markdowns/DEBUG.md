# 🔍 คู่มือการแก้ไขปัญหาและวิเคราะห์ข้อผิดพลาด (Debugging & Troubleshooting Guide)

**Clean Air Voice Assistant Project**
เอกสารนี้รวบรวมแนวทางการตรวจสอบปัญหา (Diagnostic Checklist), ข้อผิดพลาดที่พบบ่อย (Common Errors) และแนวทางแก้ไขสำหรับระบบสั่งงานด้วยเสียงแบบเรียลไทม์

---

## 📋 1. รายการตรวจสอบเบื้องต้น (Diagnostic Checklist)

ก่อนเริ่มวิเคราะห์ปัญหาเชิงลึก ให้ตรวจสอบรายการพื้นฐานดังต่อไปนี้:

- [ ] ไฟล์ `.env` อยู่ที่ root directory และมีค่า `GEMINI_API_KEY` ที่ถูกต้อง
- [ ] ทำการติดตั้ง dependencies ครบถ้วนด้วยคำสั่ง `npm install`
- [ ] เซิร์ฟเวอร์กำลังทำงานอยู่ที่พอร์ต 3000 (`http://localhost:3000`)
- [ ] ไฟล์วิดีโอ `clean-air-for-life.mp4` วางอยู่ในโฟลเดอร์ `public/` เรียบร้อยแล้ว
- [ ] เบราว์เซอร์ที่ใช้คือ Google Chrome หรือ Microsoft Edge เวอร์ชันล่าสุด
- [ ] อนุญาตสิทธิ์การเข้าถึงไมโครโฟนบนเบราว์เซอร์แล้ว

---

## ⚠️ 2. ปัญหาที่พบบ่อยและแนวทางแก้ไข (Common Issues & Solutions)

### 2.1 ปัญหาเกี่ยวกับ API Key และ Token (`/api/token`)

#### อาการ:
หน้าเว็บแสดงข้อความ `Missing GEMINI_API_KEY in .env` หรือ `Cannot create ephemeral token`

#### สาเหตุ:
1. ไม่พบคีย์ `GEMINI_API_KEY` ในไฟล์ `.env` หรือไฟล์สะกดชื่อผิด
2. เซิร์ฟเวอร์ไม่สามารถเชื่อมต่อกับ Google GenAI API ได้ (ปัญหาเครือข่าย หรือ API Key ไม่ถูกต้อง)
3. API Key ไม่มีสิทธิ์เข้าถึงโมเดล `gemini-3.1-flash-live-preview`

#### วิธีแก้ไข:
1. ตรวจสอบไฟล์ `.env` ให้แน่ใจว่ามีรูปแบบดังนี้:
   ```env
   GEMINI_API_KEY=AIzaSy...your_actual_key
   PORT=3000
   ```
2. รีสตาร์ท Node.js เซิร์ฟเวอร์ใหม่หลังแก้ไข `.env`:
   ```bash
   npm start
   ```
3. ทดสอบเรียก Endpoint ผ่านเบราว์เซอร์โดยตรงที่ `http://localhost:3000/api/token` เพื่อดูผลลัพธ์ JSON ที่ตอบกลับมา

---

### 2.2 ปัญหาไมโครโฟนและ Web Audio API

#### อาการ:
กดปุ่ม "เริ่มระบบ" แล้วเกิดข้อผิดพลาด `NotAllowedError` หรือ `NotFoundError`

#### สาเหตุ:
1. ผู้ใช้กดบล็อก (Block) สิทธิ์การเข้าถึงไมโครโฟนในเบราว์เซอร์
2. เครื่องคอมพิวเตอร์ไม่มีอุปกรณ์ไมโครโฟน หรือไมโครโฟนถูกใช้งานโดยโปรแกรมอื่นอยู่
3. หน้าเว็บไม่ได้รันบน `localhost` หรือโปรโตคอล `HTTPS` (เบราว์เซอร์จะบล็อก `getUserMedia` บน `HTTP` ที่ไม่ใช่ localhost)

#### วิธีแก้ไข:
1. คลิกที่ไอคอนแม่กุญแจ (หรือไอคอนการตั้งค่าความปลอดภัย) บนแถบ URL ของเบราว์เซอร์ แล้วเลือก **อนุญาตไมโครโฟน (Allow Microphone)**
2. ตรวจสอบใน **Windows Settings > Privacy & security > Microphone** ว่าเปิดสิทธิ์ให้แอปเข้าถึงไมโครโฟนแล้ว
3. ตรวจสอบใน DevTools Console (`F12`) เพื่อดูข้อความแจ้งเตือนของ `navigator.mediaDevices.getUserMedia`

---

### 2.3 ปัญหาการเชื่อมต่อ Gemini Live API (WebSocket Disconnect / Error)

#### อาการ:
ระบบแสดงสถานะ `เกิดข้อผิดพลาดในการเชื่อมต่อ` หรือ `การเชื่อมต่อสิ้นสุด กรุณาเริ่มใหม่`

#### สาเหตุ:
1. Ephemeral Token หมดอายุ (Token มีอายุจำกัด 30 นาที และ Session Timeout 60 วินาทีเมื่อไม่ได้เชื่อมต่อ)
2. มีปัญหาการเชื่อมต่ออินเทอร์เน็ตระหว่างเบราว์เซอร์และเซิร์ฟเวอร์ Gemini WebSocket
3. รูปแบบ System Instruction หรือ Tools Function Declaration มีโครงสร้างไม่ถูกต้องตาม Schema

#### วิธีแก้ไข:
1. กดปุ่ม **"⛔ หยุด"** แล้วกด **"🎤 เริ่มระบบ"** ใหม่อีกครั้งเพื่อขอ Ephemeral Token ชุดใหม่
2. ตรวจสอบสถานะการเชื่อมต่อใน **DevTools > Network Tab > WS (WebSockets)** เพื่อดู WebSocket Frames ที่รับส่ง
3. ตรวจสอบ Error Stack Trace ใน Console ของเบราว์เซอร์

---

### 2.4 ปัญหาวิดีโอไม่เล่นอัตโนมัติ (Autoplay Policy Restriction)

#### อาการ:
เมื่อสั่ง "Clean Air for Life" แล้วสถานะขึ้น `กรุณากดปุ่ม Play ที่วิดีโอ` แต่วิดีโอไม่เริ่มเล่นเอง

#### สาเหตุ:
นโยบาย Autoplay ของเบราว์เซอร์ (Chrome / Edge) กำหนดให้การเล่นสื่อที่มีเสียงต้องมาจากการมีปฏิสัมพันธ์โดยตรงของผู้ใช้ (User Gesture เช่น การคลิก) หากคำสั่งเล่นวิดีโอถูกเรียกจาก Callback ของ WebSocket แบบอะซิงโครนัส เบราว์เซอร์อาจบล็อกการ Autoplay ที่มีเสียง

#### วิธีแก้ไข:
1. ปล่อยให้ผู้ใช้กดปุ่ม Play บนตัวควบคุมวิดีโอ (Controls) ตามที่ระบบ fallback ไว้
2. หรือตั้งค่าเริ่มต้นของวิดีโอเป็น `video.muted = true` ชั่วคราวหากต้องการให้เล่นทันที แล้วจึงปลด mute เมื่อผู้ใช้มีปฏิสัมพันธ์

---

### 2.5 ปัญหาเสียงขาดหาย หรือเสียงสะท้อน (Audio Glitch / Latency)

#### อาการ:
เสียงพูดตอบกลับจาก AI ขาดๆ หายๆ หรือมีเสียงกะพริบ (Cracking sound)

#### สาเหตุ:
1. อัตราสุ่มสัญญาณเสียง (Sample Rate) ไม่ตรงกัน:
   - เสียงที่ส่งไป Gemini ต้องเป็น **16,000 Hz** (Linear PCM 16-bit)
   - เสียงที่รับมาจาก Gemini เป็น **24,000 Hz** (Linear PCM 16-bit)
2. ค่า `outputQueueTime` เกิดการเหลื่อมเวลา (Desync) กับ `AudioContext.currentTime`

#### วิธีแก้ไข:
1. ตรวจสอบฟังก์ชัน `playPcmBase64()` ว่ามีการอ่านค่า Sample Rate จาก MimeType (`audio/pcm;rate=24000`) อย่างถูกต้อง
2. ตรวจสอบการคำนวณ `outputQueueTime = Math.max(outputQueueTime, now)` เพื่อป้องกันไม่ให้เสียงทับซ้อนกัน

---

## 🛠 3. เครื่องมือและคำสั่งช่วย Debug (Helpful Tools & Commands)

### 3.1 การตรวจสอบพอร์ตและโปรเซสเซิร์ฟเวอร์ (PowerShell)
```powershell
# ตรวจสอบว่าพอร์ต 3000 ถูกใช้งานอยู่หรือไม่
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# ตรวจสอบการทำงานของ Node.js
Get-Process node -ErrorAction SilentlyContinue
```

### 3.2 การเปิด Console บนเบราว์เซอร์
- กด **`F12`** หรือ **`Ctrl + Shift + I`** บน Google Chrome / Microsoft Edge
- ไปที่แท็บ **Console** เพื่อดู Log เสียงและคำสั่ง
- ไปที่แท็บ **Network** และเลือกตัวกรอง **WS** เพื่อดูข้อมูลสตรีมมิ่งสด
