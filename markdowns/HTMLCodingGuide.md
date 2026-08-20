# 🌐 สรุปหลักการเขียนโค้ด HTML ที่ดีและแนวทางปฏิบัติ (HTML Best Practices)

เอกสารนี้รวบรวมมาตรฐานและแนวทางการเขียนโครงสร้าง HTML ที่ดี มีความหมายเชิงโครงสร้าง (Semantic HTML) และรองรับการเข้าถึงของผู้ใช้งานทุกคน (Accessibility - a11y)

---

## 1. การกำหนดข้อมูลเบื้องต้นและภาษาของเอกสาร (Document language and metadata)

- **หลักปฏิบัติ:** ประกาศข้อมูลพื้นฐานของเอกสารเสมอ เพื่อให้เบราว์เซอร์, ระบบค้นหา (Search Engine) และเทคโนโลยีช่วยเหลือ (Assistive Technology / Screen Reader) เริ่มต้นการทำงานด้วยบริบทที่ถูกต้อง โดยระบุภาษาของหน้าเว็บ (`lang`), การเข้ารหัสตัวอักษร (Character Encoding `UTF-8`), พฤติกรรมของ `viewport` และกำหนดชื่อเอกสาร (`<title>`) ที่เฉพาะเจาะจงและมีประโยชน์

```html
<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Clean Air Voice Assistant - ผู้ช่วยสั่งการด้วยเสียง</title>
  </head>
  <body>
    <!-- เนื้อหาเว็บไซต์ -->
  </body>
</html>
```

---

## 2. โครงสร้างหน้าเว็บเชิงความหมาย (Semantic document structure)

- **หลักปฏิบัติ:** ใช้แท็ก Landmark (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) เพื่อเปิดเผยโครงสร้างของหน้าเว็บอย่างชัดเจน ช่วยให้ผู้พัฒนาและเทคโนโลยีช่วยเหลือเข้าใจเค้าโครงหน้าเว็บได้โดยตรง หลีกเลี่ยงการใช้ Generic `<div>` ครอบทุกองค์ประกอบโดยไม่จำเป็น

```html
<header>
  <h1>Clean Air Voice</h1>
</header>
<main>
  <section aria-labelledby="voice-control-heading">
    <h2 id="voice-control-heading">ระบบสั่งการด้วยเสียง</h2>
    <p>กดปุ่มเริ่มต้นเพื่อเริ่มการสั่งงาน...</p>
  </section>
</main>
<footer>
  <p>© 2026 Clean Air for Life. All rights reserved.</p>
</footer>
```

---

## 3. การจัดลำดับชั้นของหัวข้อ (Heading hierarchy)

- **หลักปฏิบัติ:** ใช้หัวข้อ (`<h1>` ถึง `<h6>`) เพื่ออธิบายโครงสร้างและลำดับชั้นของเอกสาร โดยเรียงลำดับจากหัวข้อหลักของหน้า (`<h1>`) ลงไปหาส่วนย่อย (`<h2>`, `<h3>`) ตามลำดับ ไม่ควรข้ามระดับหัวข้อหรือเลือกใช้ระดับหัวข้อเพียงเพราะต้องการปรับขนาดตัวอักษร

```html
<h1>ระบบจัดการคำสั่งเสียง</h1>
<section>
  <h2>การตั้งค่าอุปกรณ์</h2>
  <h3>การเชื่อมต่อไมโครโฟน</h3>
</section>
```

---

## 4. ลิงก์และการนำทาง (Links and navigation)

- **หลักปฏิบัติ:** หากเป็นการนำทางผู้ใช้ไปยังจุดอื่นหรือหน้าอื่น ให้ใช้แท็ก Anchor (`<a>`) ที่มี URL ปลายทางชัดเจน (`href`) และครอบกลุ่มลิงก์นำทางด้วยแท็ก `<nav>` พร้อมระบุ `aria-label`

```html
<nav aria-label="เมนูหลัก">
  <ul>
    <li><a href="/">หน้าแรก</a></li>
    <li><a href="/about">เกี่ยวกับโครงการ</a></li>
    <li><a href="/guide">คู่มือการใช้งาน</a></li>
  </ul>
</nav>
```

---

## 5. รูปภาพและข้อความอธิบาย (Images and alternative text)

- **หลักปฏิบัติ:** ระบุข้อความ `alt` (Alternative Text) เพื่ออธิบายจุดประสงค์และบริบทของรูปภาพที่มีความหมายเสมอ แต่หากรูปภาพนั้นมีไว้เพื่อการตกแต่งเพียงอย่างเดียว ให้กำหนด `alt=""` เพื่อซ่อนจากโปรแกรมอ่านหน้าจอ

```html
<!-- รูปภาพที่มีความหมาย -->
<img src="clean-air-banner.png" alt="โปสเตอร์รณรงค์อากาศสะอาดเพื่อชีวิตที่ดีกว่า" />

<!-- รูปภาพสำหรับตกแต่ง -->
<img src="decorative-wave.svg" alt="" aria-hidden="true" />
```

---

## 6. ป้ายกำกับฟอร์มที่เข้าถึงได้ (Accessible form labels)

- **หลักปฏิบัติ:** เชื่อมโยงช่องกรอกข้อมูล (`<input>`, `<select>`, `<textarea>`) เข้ากับป้ายกำกับ (`<label>`) เสมอโดยการจับคู่ `for` ของ label กับ `id` ของ input ห้ามพึ่งพา `placeholder` เพียงอย่างเดียว

```html
<label for="device-name">ชื่ออุปกรณ์ไมโครโฟน:</label>
<input type="text" id="device-name" name="deviceName" placeholder="เช่น Default Microphone" />
```

---

## 7. ข้อความช่วยเหลือและข้อผิดพลาดในฟอร์ม (Form help text and errors)

- **หลักปฏิบัติ:** เชื่อมโยงคำแนะนำหรือข้อความแจ้งเตือนข้อผิดพลาดเข้ากับช่องกรอกข้อมูล โดยใช้ `aria-describedby` และ `aria-invalid` เพื่อให้เทคโนโลยีช่วยเหลืออ่านข้อความแจ้งเตือนไปพร้อมกับ Input

```html
<label for="api-key-input">Gemini API Key:</label>
<input
  type="password"
  id="api-key-input"
  name="apiKey"
  aria-describedby="api-key-error"
  aria-invalid="true"
/>
<span id="api-key-error" role="alert">กรุณาระบุ API Key ที่ถูกต้อง</span>
```

---

## 8. องค์ประกอบที่โต้ตอบได้ (Interactive elements)

- **หลักปฏิบัติ:** สำหรับการคลิกเพื่อสั่งการทำงานใดๆ ให้ใช้แท็ก `<button>` เป็นหลัก เพราะรองรับการกดด้วยคีย์บอร์ด (Enter, Space), ลำดับการโฟกัส (Tab Order) และ Accessibility API มาแต่กำเนิด ห้ามนำ `<div>` หรือ `<span>` มาทำเป็นปุ่มโดยไม่จำเป็น

```html
<button type="button" id="start-btn">🎤 เริ่มระบบสั่งการ</button>
```

---

## 9. ตารางสำหรับข้อมูลรูปแบบตาราง (Tables for tabular data)

- **หลักปฏิบัติ:** เมื่อแสดงข้อมูลรูปแบบแถวและคอลัมน์ ให้ใช้แท็กตารางที่สมบูรณ์ (`<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th>` พร้อม `scope`) เพื่อรักษาสายสัมพันธ์ระหว่างส่วนหัวและข้อมูล

```html
<table>
  <caption>ตารางสรุปสถิติการสั่งการด้วยเสียง</caption>
  <thead>
    <tr>
      <th scope="col">คำสั่งเสียง</th>
      <th scope="col">จำนวนครั้ง</th>
      <th scope="col">สถานะ</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Clean Air for Life</td>
      <td>142</td>
      <td>สำเร็จ</td>
    </tr>
  </tbody>
</table>
```

---

## 10. ข้อจำกัดในการใช้ ARIA (ARIA restraint)

- **หลักปฏิบัติ:** ยึดหลัก *"No ARIA is better than bad ARIA"* ควรเริ่มต้นด้วยการใช้ Native HTML Elements เสมอ และเสริมด้วย ARIA เฉพาะเมื่อ HTML ดั้งเดิมไม่สามารถสื่อความหมายได้เพียงพอ

```html
<!-- ใช้ Native Button ร่วมกับ ARIA สำหรับไอคอน -->
<button type="button" aria-label="ปิดหน้าต่างวิดีโอ">
  <svg class="icon-close" aria-hidden="true" width="24" height="24">
    <!-- SVG paths -->
  </svg>
</button>
```