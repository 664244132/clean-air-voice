# 🐘 คู่มือแนวทางการเขียนโค้ด PHP ที่ดีและปลอดภัย (PHP Best Practices)

เอกสารนี้รวบรวมมาตรฐานและแนวทางการพัฒนาภาษา PHP สำหรับระบบ Backend และ RESTful API โดยมุ่งเน้นความปลอดภัย (Security), ประสิทธิภาพ (Performance) และความสามารถในการบำรุงรักษา (Maintainability)

---

## 1. การระบุประเภทข้อมูลที่ชัดเจน (Strict types and return types)

- **สิ่งที่ควรทำ:** ประกาศ `declare(strict_types=1);` ที่ส่วนบนสุดของไฟล์ และระบุประเภทของ Parameter รวมถึง Return Types ที่ขอบเขตของทุกฟังก์ชัน
- **เหตุผล:** ช่วยป้องกันข้อผิดพลาดจากการแปลงชนิดข้อมูลอัตโนมัติ (Type Coercion) และทำให้ข้อตกลงของฟังก์ชัน (Contract) ชัดเจน

```php
<?php
declare(strict_types=1);

function calculateTokenExpiry(int $durationSeconds): string {
    return (new DateTimeImmutable())
        ->modify("+{$durationSeconds} seconds")
        ->format(DateTimeInterface::ATOM);
}
```

---

## 2. การตรวจสอบและคัดกรองข้อมูลนำเข้า (Input validation and filtering)

- **สิ่งที่ควรทำ:** ตรวจสอบความถูกต้องของข้อมูลจาก Request ตั้งแต่จุดเริ่มต้น (Entry Point) และตอบกลับข้อผิดพลาดทันทีหากข้อมูลไม่ถูกต้อง (Fail-Fast)
- **เหตุผล:** ป้องกันไม่ให้ข้อมูลที่ไม่พึงประสงค์ส่งผ่านไปยังชั้นลึกของระบบ (Business Logic / Database)

```php
$command = filter_input(INPUT_POST, 'command', FILTER_SANITIZE_SPECIAL_CHARS);
if (empty($command)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameter: command']);
    exit;
}
```

---

## 3. การหลีกหนีข้อมูลเพื่อป้องกัน XSS (Output escaping for XSS)

- **สิ่งที่ควรทำ:** ทำ Output Escaping ด้วยฟังก์ชันอย่าง `htmlspecialchars($data, ENT_QUOTES, 'UTF-8')` เสมอเมื่อนำข้อมูลจากผู้ใช้ไปแสดงผลใน HTML
- **เหตุผล:** ป้องกันการโจมตีแบบ Cross-Site Scripting (XSS)

---

## 4. การใช้ Prepared Statements สำหรับฐานข้อมูล (PDO prepared statements)

- **สิ่งที่ควรทำ:** ใช้ Prepared Statements และผูกค่าตัวแปร (Bound Parameters) กับคำสั่ง SQL แทนการต่อสตริงตรงๆ เสมอ
- **เหตุผล:** ป้องกันช่องโหว่ SQL Injection ได้อย่างเด็ดขาด

```php
$stmt = $pdo->prepare('SELECT id, command_keyword, target_value FROM voice_commands WHERE is_active = :active');
$stmt->execute(['active' => 1]);
$commands = $stmt->fetchAll(PDO::FETCH_ASSOC);
```

---

## 5. การแฮชและการตรวจสอบรหัสผ่าน (Password hashing and verification)

- **สิ่งที่ควรทำ:** ใช้ฟังก์ชันมาตรฐาน `password_hash()` (แนะนำอัลกอริทึม `PASSWORD_DEFAULT` หรือ `PASSWORD_BCRYPT`) และ `password_verify()`
- **เหตุผล:** ไม่ควรสร้างตรรกะการแฮชหรือทำ MD5/SHA-256 สำหรับรหัสผ่านด้วยตนเอง เพราะไม่มีระบบ Salt และ Cost Factor ที่ปลอดภัยเพียงพอ

---

## 6. การจัดการเซสชันและคุกกี้อย่างปลอดภัย (Session handling and cookies)

- **สิ่งที่ควรทำ:** กำหนดค่า Session Cookie Flags (`HttpOnly`, `Secure`, `SameSite=Lax/Strict`) และเรียก `session_regenerate_id(true)` เมื่อสถานะการยืนยันตัวตนเปลี่ยน
- **เหตุผล:** ป้องกันการโจมตีแบบ Session Hijacking และ Session Fixation

---

## 7. การจัดการข้อผิดพลาดและข้อยกเว้น (Error handling and exceptions)

- **สิ่งที่ควรทำ:** ดักจับ Exceptions ด้วย `try-catch`, บันทึกรายละเอียดข้อผิดพลาดลง Log ไฟล์ของเซิร์ฟเวอร์ และส่งเฉพาะข้อความทั่วไปที่ปลอดภัยกลับไปยัง Client
- **เหตุผล:** ป้องกันการเปิดเผยข้อมูลโครงสร้างระบบ (Database Schema / Internal File Paths) หลุดออกไปสู่สาธารณะ

---

## 8. การจัดการโครงสร้างไฟล์ด้วย Namespaces และ Autoloading

- **สิ่งที่ควรทำ:** ใช้ Namespaces และปฏิบัติตามมาตรฐาน PSR-4 สำหรับการโหลดคลาสอัตโนมัติผ่าน Composer
- **เหตุผล:** ทำให้โค้ดเป็นระเบียบ ลดการใช้คำสั่ง `require_once` ซ้ำซ้อน และจัดการความสัมพันธ์ของโมดูลได้ง่าย

---

## 9. การจัดการการตั้งค่าและความลับของระบบ (Configuration and secrets)

- **สิ่งที่ควรทำ:** โหลดค่าคอนฟิกและความลับ (เช่น API Keys, Database Password) ผ่าน Environment Variables (`.env`) และตั้งให้ระบบหยุดทำงานทันทีหากไม่พบคีย์จำเป็น
- **เหตุผล:** ป้องกันการ Hardcode คีย์ความลับไว้ใน Source Code ซึ่งเสี่ยงต่อการรั่วไหลเมื่อแชร์โค้ด

---

## 10. การแยกตรรกะออกจากส่วนแสดงผล (Separation of concerns)

- **สิ่งที่ควรทำ:** แยกตรรกะการประมวลผล (Business Logic / Database Queries) ออกจากไฟล์เทมเพลตสำหรับแสดงผล (View / Presentation)
- **เหตุผล:** ทำให้โค้ดทดสอบได้ง่าย (Testable) และดูแลรักษาได้สะดวกในระยะยาว