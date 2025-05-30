# วิธีตั้งค่าคุกกี้

## 1. Login เข้า ithy.com ในเบราว์เซอร์

## 2. เปิด Developer Tools (F12)

## 3. ไปที่แท็บ Application/Storage → Cookies → https://ithy.com

## 4. คัดลอกค่าของคุกกี้ทั้งหมด:
- `session` 
- `intercom-session-j3aqi0fi`

## 5. สร้างไฟล์ .env.local ในโฟลเดอร์หลัก:

```bash
ITHY_SESSION_COOKIE=ค่า_session_ของคุณ
ITHY_INTERCOM_COOKIE=ค่า_intercom_ของคุณ
```

## 6. หรือแก้ไขในไฟล์ test-scraper.js:

```javascript
const SESSION_COOKIE = 'ค่า_session_ของคุณ';
const INTERCOM_COOKIE = 'ค่า_intercom_ของคุณ';
```

## 7. ทดสอบ:

```bash
# ทดสอบด้วยไฟล์แยก
node test-scraper.js

# หรือรันเว็บไซต์
npm run dev
```

## หมายเหตุ:
- คุกกี้จะหมดอายุเมื่อคุณ logout หรือหลังจากผ่านไประยะหนึ่ง
- ถ้าได้ผลลัพธ์ "ไม่พบตาราง" อาจจะต้องตรวจสอบว่า:
  1. คุกกี้ยังใช้งานได้อยู่หรือไม่
  2. Element ID มีการเปลี่ยนแปลงหรือไม่ 