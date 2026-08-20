# 🗄️ แนวทางการเขียนและรีวิวโค้ด SQL ที่ดี (SQL Best Practices & Code Review Lessons)

เอกสารนี้รวบรวมหลักการและมาตรฐานการเขียนคำสั่ง SQL เพื่อประสิทธิภาพสูงสุด ความถูกต้องของข้อมูล และความปลอดภัยจากช่องโหว่

---

## 1. เลือกดึงเฉพาะคอลัมน์ที่จำเป็น (Explicit SELECT columns)

- **หลักปฏิบัติ:** ระบุชื่อคอลัมน์ที่ต้องการใช้งานจริงเสมอ หลีกเลี่ยงการใช้ `SELECT *`
- **เหตุผล:** ช่วยลดภาระการส่งข้อมูลบนเครือข่าย ป้องกันปัญหาชื่อคอลัมน์ชนกันจากการ Join และป้องกันการรั่วไหลของข้อมูลสำคัญ (Sensitive Data) เมื่อมีการเพิ่มคอลัมน์ใหม่ใน Schema

```sql
-- ❌ ไม่แนะนำ
SELECT * FROM voice_commands;

-- ✅ แนะนำ
SELECT id, command_keyword, target_value, is_active FROM voice_commands;
```

---

## 2. การจัดการตัวกรองและค่า NULL (Filtering and NULL handling)

- **หลักปฏิบัติ:** ใช้ตัวดำเนินการ `IS NULL` หรือ `IS NOT NULL` เสมอ และจัดกลุ่มตรรกะ Boolean ด้วยวงเล็บอย่างชัดเจน
- **เหตุผล:** ค่า `NULL` ไม่สามารถเปรียบเทียบด้วยเครื่องหมายเท่ากับ (`=`) ได้ และการใส่วงเล็บช่วยแก้ปัญหาความกำกวมของลำดับความสำคัญระหว่าง `AND` และ `OR`

```sql
-- ❌ ไม่แนะนำ (เปรียบเทียบ = กับ NULL และไม่มีวงเล็บจัดกลุ่ม)
SELECT * FROM reviews WHERE status = 'approved' OR status = 'pending' AND deleted_at = NULL;

-- ✅ แนะนำ
SELECT id, status, comment 
FROM reviews 
WHERE (status = 'approved' OR status = 'pending') 
  AND deleted_at IS NULL;
```

---

## 3. ระวังจำนวนแถวข้อมูลที่เปลี่ยนไปจากการ Join (Join cardinality)

- **หลักปฏิบัติ:** ตรวจสอบความสัมพันธ์ระหว่างตาราง (One-to-One vs One-to-Many) ก่อน Join หากต้องการผลรวมข้อมูล ให้พิจารณาทำ Pre-aggregation ใน Subquery หรือ CTE ก่อนทำการ Join
- **เหตุผล:** การ Join เข้ากับตารางฝั่ง Many อาจทำให้จำนวนแถวข้อมูลเพิ่มขึ้นอย่างไม่คาดคิด ส่งผลให้การนับจำนวน (Count) หรือการแบ่งหน้า (Pagination) ผิดพลาด

---

## 4. จัดกลุ่มข้อมูลให้ตรงกับสิ่งที่ต้องการรายงาน (Aggregation and grouping)

- **หลักปฏิบัติ:** ระบุคอลัมน์ใน `GROUP BY` ให้สอดคล้องกับคอลัมน์ Non-aggregated ทั้งหมดที่ปรากฏในคำสั่ง `SELECT`
- **เหตุผล:** ป้องกันข้อผิดพลาดจากโหมด `ONLY_FULL_GROUP_BY` และป้องกันไม่ให้ได้ผลลัพธ์ที่สร้างความเข้าใจผิด

---

## 5. เขียนเงื่อนไขให้เป็นมิตรกับ Index (Index-friendly predicates)

- **หลักปฏิบัติ:** หลีกเลี่ยงการนำฟังก์ชันไปครอบคอลัมน์ที่ฝั่งซ้ายของเงื่อนไข `WHERE` ให้ใช้รูปแบบช่วงเวลาแบบ Half-Open Range (`>=` และ `<`) แทน
- **เหตุผล:** การครอบฟังก์ชันบนคอลัมน์จะบล็อกไม่ให้ฐานข้อมูลใช้งาน Index ได้ (Index Seek กลายเป็น Full Table Scan)

```sql
-- ❌ ไม่แนะนำ (ใช้ฟังก์ชันครอบคอลัมน์ ทำให้ใช้ Index ไม่ได้)
SELECT id, log_time, message 
FROM system_logs 
WHERE DATE_FORMAT(log_time, '%Y-%m') = '2026-08';

-- ✅ แนะนำ (ปล่อยคอลัมน์ไว้เดี่ยวๆ เพื่อให้ค้นหาผ่าน Index ได้ทันที)
SELECT id, log_time, message 
FROM system_logs 
WHERE log_time >= '2026-08-01' AND log_time < '2026-09-01';
```

---

## 6. ใช้ Transaction มัดรวมการทำงานที่เกี่ยวข้องกัน (Transactions for atomic workflows)

- **หลักปฏิบัติ:** ครอบขั้นตอนการเขียน/แก้ไขข้อมูลหลายตารางที่เกี่ยวข้องกันไว้ใน Transaction เดียวกัน (`START TRANSACTION` ... `COMMIT`)
- **เหตุผล:** รับประกันคุณสมบัติ Atomicity หากเกิดข้อผิดพลาดที่ขั้นตอนใดขั้นตอนหนึ่ง สามารถ Rollback กลับได้ ป้องกันข้อมูลค้างอยู่ในสถานะไม่สมบูรณ์ (Inconsistent State)

---

## 7. แบ่งขั้นตอนการทำ Migration ให้ปลอดภัย (Safe database migrations)

- **หลักปฏิบัติ:** แบ่งการเปลี่ยนแปลงโครงสร้าง Schema ออกเป็นขั้นตอน: เพิ่มคอลัมน์ใหม่ -> ย้อนหลังเติมข้อมูลเดิม (Backfill) -> เพิ่ม Constraints ที่จำเป็น
- **เหตุผล:** ป้องกันข้อผิดพลาดจากการบังคับ `NOT NULL` กับคอลัมน์ใหม่ในขณะที่ยังมีแถวข้อมูลเดิมอยู่

---

## 8. ใช้ Parameterized Queries ป้องกันการโจมตี (Parameterized queries)

- **หลักปฏิบัติ:** ส่งผ่านค่าจากผู้ใช้ในรูปของ Bound Parameters เสมอ ห้ามนำข้อความมาต่อสตริง (String Concatenation) เข้าไปในคำสั่ง SQL ตรงๆ
- **เหตุผล:** ป้องกันช่องโหว่ SQL Injection อย่างสมบูรณ์

---

## 9. ทำระบบแบ่งหน้าให้เสถียร (Cursor-based pagination)

- **หลักปฏิบัติ:** สำหรับตารางขนาดใหญ่ ควรใช้ Cursor-based Pagination (อ้างอิงผ่าน `WHERE id > :last_id ORDER BY id ASC LIMIT 20`) แทนการใช้ `OFFSET`
- **เหตุผล:** การใช้ `OFFSET` สูงๆ จะทำให้ฐานข้อมูลต้องสแกนแถวข้อมูลที่ข้ามไปทั้งหมด และเสี่ยงต่อปัญหาข้อมูลเลื่อน (Page Drift) เมื่อมีข้อมูลใหม่เพิ่มเข้ามา

---

## 10. กำหนดสิทธิ์และความสัมพันธ์ตารางให้ชัดเจน (Schema keys and constraints)

- **หลักปฏิบัติ:** กำหนด Primary Key, Foreign Keys, Unique Constraints และ Check Constraints ให้ครบถ้วนในระดับ Database Schema
- **เหตุผล:** เพื่อรักษาความสมบูรณ์และถูกต้องของข้อมูล (Data Integrity) ในระดับโครงสร้างฐานข้อมูล