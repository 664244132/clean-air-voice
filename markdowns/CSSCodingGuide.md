# 🎨 สรุปหลักการเขียนโค้ด CSS ที่ดี (CSS Best Practices & Code Review Lessons)

เอกสารนี้รวบรวมมาตรฐานและแนวทางการเขียน CSS ที่มีประสิทธิภาพ ยืดหยุ่น รองรับ Responsive Design และง่ายต่อการบำรุงรักษาในระยะยาว

---

## 1. การกำหนดขนาดของ Box Model (Box model sizing)

- **แนวทางปฏิบัติ:** กำหนด `box-sizing: border-box` ให้กับทุก Element เพื่อให้ขนาด `width` และ `height` ครอบคลุมทั้ง `padding` และ `border`
- **เหตุผล:** ช่วยให้คอมโพเนนต์มีขนาดที่คาดเดาได้ ไม่เกิดปัญหาเลย์เอาต์ล้น (Overflow) เมื่อมีการเพิ่ม Padding หรือ Border

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

---

## 2. ลำดับความสำคัญและความเฉพาะเจาะจง (Cascade and specificity)

- **แนวทางปฏิบัติ:** ใช้ Class Selector ที่มีระดับความเฉพาะเจาะจงต่ำ (Low Specificity) และหลีกเลี่ยงการใช้ ID Selector, Selector ซ้อนกันลึกๆ หรือการใช้ `!important`
- **เหตุผล:** ช่วยให้การ Override สไตล์ในอนาคตทำได้ง่าย โค้ดไม่ผูกติดกับโครงสร้าง DOM ที่แข็งตัวจนเกินไป

```css
/* ❌ ไม่แนะนำ */
#main-container div.content ul li a { color: blue !important; }

/* ✅ แนะนำ */
.nav-link { color: var(--color-primary); }
.nav-link--active { color: var(--color-active); }
```

---

## 3. ขอบเขตของการจัดเลย์เอาต์แบบ Flex (Flex layout boundaries)

- **แนวทางปฏิบัติ:** จัดการระยะห่างระหว่าง Element ภายใน Flex Container ด้วยคุณสมบัติ `gap` แทนการผลัก `margin` ไปยังลูกแต่ละตัว
- **เหตุผล:** ป้องกันปัญหา Margin ส่วนเกินเมื่อ Element มีการปัดบรรทัด (Wrap) หรือเมื่อสลับลำดับการแสดงผล

```css
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
```

---

## 4. การสร้าง Grid Layout ที่ยืดหยุ่น (Grid layout tracks)

- **แนวทางปฏิบัติ:** ใช้ CSS Grid ร่วมกับฟังก์ชัน `minmax()` และ `repeat(auto-fit, ...)` ในการสร้าง Responsive Columns โดยไม่ต้องพึ่งพา Media Queries ทุกจุด
- **เหตุผล:** ลดความซับซ้อนของโค้ด ให้เบราว์เซอร์จัดสรรจำนวนคอลัมน์ตามขนาดพื้นที่จริงโดยอัตโนมัติ

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
```

---

## 5. การใช้หน่วยที่รองรับ Responsive (Responsive units)

- **แนวทางปฏิบัติ:** ใช้ฟังก์ชัน `clamp()` หรือหน่วยสัมพัทธ์ (`rem`, `em`, `ch`, `%`) สำหรับขนาดตัวอักษรและระยะห่าง
- **เหตุผล:** ป้องกันไม่ให้ข้อความเล็กเกินไปบนจอมือถือ หรือใหญ่เทอะทะบนหน้าจอความละเอียดสูง

```css
.hero-title {
  font-size: clamp(1.75rem, 4vw + 1rem, 3.5rem);
}
```

---

## 6. ความเปรียบต่างของสีในสถานะต่างๆ (Color contrast states)

- **แนวทางปฏิบัติ:** ตรวจสอบค่าความเปรียบต่างของสี (Contrast Ratio) ให้ได้มาตรฐาน WCAG AA (อย่างน้อย 4.5:1 สำหรับข้อความปกติ) ทั้งในสถานะปกติ, Hover และ Active
- **เหตุผล:** เพื่อให้ผู้ใช้งานทุกคน รวมถึงผู้มีความบกพร่องทางการมองเห็น สามารถอ่านข้อความและรับรู้การเปลี่ยนแปลงสถานะได้อย่างชัดเจน

---

## 7. การจัดการสถานะ Focus-visible (State selectors and focus-visible)

- **แนวทางปฏิบัติ:** ใช้ `:focus-visible` เพื่อแสดง Outline เมื่อผู้ใช้ควบคุมด้วยคีย์บอร์ด **ห้ามตั้งค่า `outline: none` เด็ดขาด** หากไม่มีสไตล์ Focus อื่นทดแทน
- **เหตุผล:** การกด Tab ด้วยคีย์บอร์ดจำเป็นต้องเห็นตำแหน่งโฟกัสชัดเจนเพื่อการเข้าถึงที่สมบูรณ์

```css
.btn:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

---

## 8. การใช้ Logical Properties (CSS Logical Properties)

- **แนวทางปฏิบัติ:** ใช้ Logical Properties (เช่น `margin-inline`, `padding-block`, `inset-inline-start`) แทนการระบุทิศทางตายตัว (`left`, `right`, `top`, `bottom`)
- **เหตุผล:** ช่วยให้เลย์เอาต์ปรับตัวตามทิศทางการเขียนของภาษา (Writing Direction เช่น LTR / RTL) ได้อย่างเป็นธรรมชาติ

```css
.card {
  padding-block: 1.5rem;
  padding-inline: 1.25rem;
}
```

---

## 9. การใช้ตัวแปร CSS (Custom properties as design tokens)

- **แนวทางปฏิบัติ:** ประกาศตัวแปร CSS (`--variables`) สำหรับค่าสี, ระยะห่าง (Spacing), รัศมีความโค้ง (Border Radius) และเงา (Box Shadow) ไว้ที่ `:root`
- **เหตุผล:** ลดการใช้ค่า Magic Values ซ้ำซ้อน สะดวกต่อการเปลี่ยนธีม (Light / Dark Mode) และควบคุมระบบดีไซน์จากศูนย์กลาง

```css
:root {
  --color-primary: #059669;
  --color-secondary: #0284c7;
  --color-bg: #0f172a;
  --color-text: #ffffff;
  --radius-md: 12px;
}
```

---

## 10. การเคลื่อนไหวและการลดการเคลื่อนไหว (Motion and reduced motion)

- **แนวทางปฏิบัติ:** เพิ่ม Media Query `@media (prefers-reduced-motion: reduce)` เพื่อลดหรือปิด Animation สำหรับผู้ใช้ที่ตั้งค่าลดการเคลื่อนไหวในระบบปฏิบัติการ
- **เหตุผล:** ป้องกันอาการวิงเวียนศีรษะ (Vestibular Disorders) และเคารพความต้องการของผู้ใช้งาน

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
