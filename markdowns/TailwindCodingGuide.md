# 🎨 Tailwind CSS Coding Guide

เอกสารข้อกำหนดและแนวทางปฏิบัติที่ดีสำหรับการใช้งาน **Tailwind CSS** เพื่อให้การเขียนสไตล์ในโปรเจกต์มีความเป็นระเบียบ อ่านง่าย ดูแลรักษาง่าย และรองรับการทำงานร่วมกันในทีม

---

## 📌 1. การจัดกลุ่มคลาสเพื่อความอ่านง่าย (Readability & Ordering)

จัดกลุ่มคลาสตามลำดับความสำคัญจากโครงสร้างสู่รายละเอียด: **Layout ➔ Spacing ➔ Typography / Colors ➔ Visuals ➔ Interaction States**

```html
<!-- ❌ ไม่แนะนำ: คลาสสลับไปมา อ่านยาก -->
<div class="text-white hover:bg-blue-600 p-4 absolute flex bg-blue-500 top-0">

<!-- ✅ แนะนำ: จัดกลุ่มชัดเจน -->
<div class="absolute top-0 flex p-4 bg-blue-500 text-white hover:bg-blue-600">
```

---

## 📱 2. การออกแบบแบบ Mobile-First (Responsive Design)

กำหนดสไตล์เริ่มต้นสำหรับหน้าจอขนาดเล็กที่สุดเป็นค่าพื้นฐาน แล้วใช้ Breakpoints (`sm:`, `md:`, `lg:`, `xl:`) เมื่อขยายขนาดหน้าจอขึ้น

```html
<!-- ❌ ไม่แนะนำ: กำหนดจอใหญ่ก่อนแล้วแก้จอมือถือ -->
<div class="w-full lg:w-1/2 md:w-3/4"> 

<!-- ✅ แนะนำ: เริ่มจากมือถือ แล้วขยายออก -->
<div class="w-full md:w-3/4 lg:w-1/2">
```

---

## 🎯 3. การครอบคลุมสถานะการโต้ตอบครบถ้วน (Interaction States)

กำหนดสถานะ `hover:`, `focus-visible:` และ `disabled:` ร่วมกันเสมอ เพื่อรองรับการสั่งงานทั้งผ่านเมาส์และการกดแท็บด้วยคีย์บอร์ด

```html
<!-- ✅ แนะนำ: ครอบคลุมทุกสถานะและ Accessibility -->
<button class="bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none disabled:opacity-50 transition-colors">
  เริ่มระบบ
</button>
```

---

## 📏 4. ความคงเส้นคงวาของระยะห่าง (Spacing & Layout)

ยึดใช้งาน Spacing Scale มาตรฐานของ Tailwind (เช่น `p-4`, `m-2`, `gap-3`) แทนการใช้ Arbitrary Values เฉพาะจุด

```html
<!-- ❌ ไม่แนะนำ: ใช้ค่าอิสระที่ทำลายความสม่ำเสมอ -->
<div class="p-[19px] mt-[13px]">

<!-- ✅ แนะนำ: ใช้สเกลมาตรฐาน -->
<div class="p-5 mt-3">
```

---

## 🎨 5. การทำงานร่วมกับ Theme Tokens

หลีกเลี่ยงการฝังค่าสี Hex แบบ Hard-coded ในคลาส ให้กำหนดชื่อสีและโทเค็นไว้ในธีมส่วนกลาง

```html
<!-- ❌ ไม่แนะนำ -->
<div class="bg-[#059669] text-[#ffffff]">

<!-- ✅ แนะนำ -->
<div class="bg-primary text-white">
```

---

## 🌙 6. การรองรับโหมดมืดอย่างสมบูรณ์ (Dark Mode Variants)

สลับชุดสีคู่กันทั้งสีกรอบ (`border-`), พื้นหลัง (`bg-`), และสีข้อความ (`text-`) ในโหมดมืด (`dark:`) เพื่อรักษาระดับ Contrast ที่ชัดเจน

```html
<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
```

---

## 🧩 7. การลดความซ้ำซ้อนของคลาส (Class Reuse & Component Boundaries)

เมื่อมีองค์ประกอบที่ใช้ชุดคลาสเดิมซ้ำๆ ให้แยกเป็น Component หรือสร้าง Helper Function แทนการคัดลอกคลาสยาวๆ ซ้ำไปมา

---

## 🚫 8. การจำกัดการใช้ Arbitrary Values

ใช้ Arbitrary Values (เช่น `grid-cols-[1fr_200px]`) เฉพาะในกรณีสัดส่วนเลย์เอาต์ที่มีความพิเศษและไม่สามารถใช้สเกลมาตรฐานได้เท่านั้น

```html
<!-- ❌ ไม่แนะนำ -->
<div class="w-[100%] h-[100vh]">

<!-- ✅ แนะนำ -->
<div class="w-full h-screen">
```

---

## 👁️ 9. การเข้าถึงที่ครอบคลุม (Accessibility - a11y)

สำหรับปุ่มที่มีเฉพาะไอคอน ต้องแนบป้ายข้อความสำหรับ Screen Reader ด้วยคลาส `sr-only` เสมอ

```html
<button class="p-2 rounded-lg focus-visible:ring-2 focus-visible:outline-none">
  <span class="sr-only">ปิดวิดีโอ</span>
  <svg class="w-5 h-5" aria-hidden="true"><!-- Icon --></svg>
</button>
```

---

## ⚔️ 10. การป้องกันสไตล์ขัดแย้งกัน (Conditional Conflicts)

เมื่อต้องสลับคลาสตามเงื่อนไข (Dynamic Props) ให้ใช้เครื่องมืออย่าง `tailwind-merge` ร่วมกับ `clsx` เพื่อป้องกันการชนกันของคลาส

```javascript
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```