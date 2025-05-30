# 🕷️ Ithy Data Scraper & WordPress Publisher

[![GitHub Repository](https://img.shields.io/badge/GitHub-tetipong2542%2Fithy--data--scraper-blue?logo=github)](https://github.com/tetipong2542/ithy-data-scraper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.29-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)

ระบบดึงข้อมูลบทความจาก ithy.com และโพสต์ไปยัง WordPress อัตโนมัติ พร้อมระบบจัดการการตั้งค่าที่ครบถ้วน

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/tetipong2542/ithy-data-scraper.git
cd ithy-data-scraper

# Install dependencies
npm install

# Run development server
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

## ✨ ฟีเจอร์หลัก

### 📊 **Data Scraping**
- ดึงข้อมูลบทความจาก ithy.com อัตโนมัติ
- รองรับการค้นหาและกรองบทความ
- แสดงข้อมูล 19+ บทความพร้อมลิงก์

### 🔗 **WordPress Integration**
- โพสต์บทความไปยัง WordPress อัตโนมัติ
- เผยแพร่ (Publish) ทันทีหลังการโพสต์
- รองรับการสร้าง Excerpt อัตโนมัติ
- เก็บ iframe YouTube และ video content

### 🎬 **Content Processing**
- ประมวลผลเนื้อหาด้วย Cheerio
- แปลง Gutenberg Blocks
- ลบเนื้อหาที่ไม่ต้องการ (Logo, Footer, Ads)
- เก็บ iframe video เช่น YouTube

### 💾 **Advanced Data Storage**
- **IndexedDB**: เก็บการตั้งค่าในเครื่อง
- **ไม่หายเมื่อ Refresh**: ข้อมูลคงอยู่ถาวร
- **Encryption**: รหัสผ่าน WordPress ถูกเข้ารหัส Base64
- **Auto-save**: บันทึกอัตโนมัติเมื่อมีการเปลี่ยนแปลง

### 🔧 **Configuration Management**
- **Set as Default**: บันทึกการตั้งค่าปัจจุบันเป็นค่าเริ่มต้น
- **Reset to Default**: กลับไปใช้ค่าเริ่มต้นที่บันทึกไว้
- **Factory Reset**: รีเซ็ตเป็นค่าเริ่มต้นจากโรงงาน
- **Debug Mode**: ปุ่มทดสอบการโหลดข้อมูล

## 🛠️ การติดตั้ง

### 1. Clone Repository
```bash
git clone <repository-url>
cd ithy-scraper
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local`:
```env
ITHY_SESSION_COOKIE=gAAAAAB...
ITHY_INTERCOM_COOKIE=8f2c4809-cb64-403c-823f-37308dc98db7
```

### 4. รันระบบ
```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

## ⚙️ การตั้งค่า

### 1. WordPress Configuration
- **Site URL**: https://yoursite.com
- **Username**: ชื่อผู้ใช้ WordPress
- **Application Password**: สร้างใน WordPress Dashboard > Users > Application Passwords

### 2. Web Scraping Configuration
- **Target Classes**: `div.outer.theme-transitions,div.content-area,article,main`
- **CSS Selectors**: `.content,.article-content,.post-content,.entry-content`

### 3. Content Processing Options
- ✅ แปลง Gutenberg Blocks
- ✅ ลบ H1 ซ้ำ
- ✅ ลบ Logo
- ✅ ลบเนื้อหาท้าย

## 🔒 ความปลอดภัย

### เข้ารหัสข้อมูล
- รหัสผ่าน WordPress ถูกเข้ารหัส Base64 + Key
- ข้อมูลเก็บใน IndexedDB ของเบราว์เซอร์
- รองรับทั้ง HTTP และ HTTPS

### การจัดเก็บข้อมูล
- **Local Storage Only**: ไม่ส่งข้อมูลไปเซิร์ฟเวอร์
- **Session-based**: ใช้ session cookies เท่านั้น
- **Persistent**: ข้อมูลคงอยู่หลัง refresh

## 🚀 การใช้งาน

### 1. ดึงข้อมูลบทความ
1. คลิก **🔄 รีเฟรชข้อมูล**
2. รอระบบดึงข้อมูลจาก ithy.com
3. ใช้ **🔍 ค้นหา** เพื่อกรองบทความ

### 2. ตั้งค่า WordPress
1. คลิก **⚙️ การตั้งค่า WordPress**
2. กรอกข้อมูล WordPress
3. คลิก **🔗 ทดสอบการเชื่อมต่อ**
4. คลิก **💾 บันทึกการตั้งค่า**

### 3. โพสต์บทความ
1. เลือกบทความที่ต้องการ
2. คลิก **📤 โพสต์เนื้อหา**
3. รอระบบประมวลผลและโพสต์
4. บทความจะถูกเผยแพร่อัตโนมัติ

### 4. จัดการการตั้งค่า
- **⭐ Set as Default**: บันทึกค่าเริ่มต้น
- **🔄 Reset to Default**: กลับไปใช้ค่าที่บันทึกไว้
- **🏭 Factory Reset**: รีเซ็ตทั้งหมด
- **🧪 ทดสอบการโหลด**: Debug ข้อมูล

## 🐛 การแก้ไขปัญหา

### 1. ข้อมูลการตั้งค่าหาย
1. เปิด Developer Console (F12)
2. คลิก **🧪 ทดสอบการโหลด**
3. ดู log ในคอนโซลเพื่อหาสาเหตุ

### 2. การเชื่อมต่อ WordPress ล้มเหลว
1. ตรวจสอบ URL และข้อมูลการเข้าสู่ระบบ
2. ใช้ **🔗 ทดสอบการเชื่อมต่อ**
3. ตรวจสอบ Application Password

### 3. iframe YouTube หาย
- ระบบจะเก็บ iframe video โดยอัตโนมัติ
- ตรวจสอบ log ในคอนโซลเพื่อดูสถานะ

## 📋 Log System

เปิด Developer Console เพื่อดู logs:

```
🔄 เริ่มโหลดการตั้งค่าจาก IndexedDB...
✅ โหลด WordPress settings สำเร็จ
🔄 Auto-save: การตั้งค่ามีการเปลี่ยนแปลง
✅ Auto-save สำเร็จ
🎥 พบ YouTube iframe: https://youtube.com/embed/...
✅ โพสต์และเผยแพร่สำเร็จ! ID: 3625
```

## 🔧 Technical Stack

- **Frontend**: Next.js, React, CSS-in-JS
- **Backend**: Next.js API Routes
- **Scraping**: Axios, Cheerio
- **Storage**: IndexedDB with Encryption
- **WordPress**: REST API Integration
- **Security**: Base64 Encryption, HTTPS Support

## 📝 Notes

- บทความจะถูกเผยแพร่ (Publish) อัตโนมัติทันที
- ระบบรองรับ 19+ บทความจาก ithy.com
- การตั้งค่าจะถูกบันทึกอัตโนมัติ
- รองรับการใช้งานทั้ง HTTP และ HTTPS

## 🆘 Support

หากพบปัญหา:
1. ตรวจสอบ Developer Console
2. ใช้ปุ่ม **🧪 ทดสอบการโหลด**
3. ตรวจสอบการเชื่อมต่อ WordPress
4. รีเซ็ตการตั้งค่าหากจำเป็น

---

**🎯 พัฒนาโดย**: AI Assistant  
**📅 เวอร์ชัน**: 2.0  
**🔄 อัพเดทล่าสุด**: 2024 