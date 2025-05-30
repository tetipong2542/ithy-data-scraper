# 🚀 Deployment Guide - Ithy Data Scraper

## 📋 สิ่งที่ต้องเตรียมก่อน Deploy

### 1. Session Cookies
- เข้าไปที่ ithy.com และ login
- ใช้ Browser Extension (EditThisCookie) ดึง cookies ต่อไปนี้:
  - `session` - (Required)
  - `intercom-device-id-j3aqi0fi` - (Optional)

### 2. WordPress Configuration
- WordPress Site URL
- Username
- Application Password

## 🌐 Deploy บน Vercel (แนะนำ)

### 1. เตรียมโปรเจค
```bash
# Clone repository
git clone <your-repo-url>
cd ithy-scraper

# Install dependencies
npm install

# Test locally
npm run dev
```

### 2. Deploy ไปยัง Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 3. ตั้งค่า Environment Variables ใน Vercel Dashboard
```
ITHY_SESSION_COOKIE=gAAAAAB...
ITHY_INTERCOM_COOKIE=8f2c4809-cb64-403c-823f-37308dc98db7
```

## 🚢 Deploy บน Railway

### 1. เชื่อมต่อ GitHub Repository
1. ไปที่ [Railway.app](https://railway.app)
2. เชื่อมต่อ GitHub account
3. Deploy repository

### 2. ตั้งค่า Environment Variables
```
ITHY_SESSION_COOKIE=your_session_cookie
ITHY_INTERCOM_COOKIE=your_intercom_cookie
```

## 🌈 Deploy บน Netlify

### 1. Build สำหรับ Static Export
```bash
# เพิ่มใน next.config.js
module.exports = {
  trailingSlash: true,
  exportPathMap: function() {
    return {
      '/': { page: '/' }
    }
  }
}

# Build
npm run build
npm run export
```

### 2. Deploy จาก Netlify Dashboard
1. เลือก `out` folder
2. ตั้งค่า Environment Variables

## ⚙️ Environment Variables ที่ต้องการ

| Variable | Required | Description |
|----------|----------|-------------|
| `ITHY_SESSION_COOKIE` | ✅ | Session cookie จาก ithy.com |
| `ITHY_INTERCOM_COOKIE` | ❌ | Intercom cookie (optional) |
| `NODE_ENV` | ❌ | production (auto-set) |

## 🔧 การตั้งค่าหลัง Deploy

### 1. ทดสอบ API Endpoints
```bash
# Test articles endpoint
curl https://your-domain.vercel.app/api/articles

# Test settings endpoint
curl -X POST https://your-domain.vercel.app/api/settings \
  -H "Content-Type: application/json" \
  -d '{"action":"test-connection","config":{"siteUrl":"https://yoursite.com","username":"admin","appPassword":"xxxx"}}'
```

### 2. การใช้งาน
1. เปิดเว็บไซต์ที่ deploy แล้ว
2. ตั้งค่า WordPress Configuration
3. ทดสอบการเชื่อมต่อ
4. เริ่มใช้งาน scraping และ posting

## 🐛 Troubleshooting

### ปัญหาที่อาจพบ

1. **Cookie หมดอายุ**
   - Solution: อัพเดท session cookie ใหม่

2. **API Timeout**
   - Solution: ปรับ timeout ใน vercel.json

3. **CORS Issues**
   - Solution: เพิ่ม CORS headers ใน API

4. **WordPress Connection Failed**
   - Solution: ตรวจสอบ Application Password และ URL

## 📱 Mobile Responsive
- ระบบรองรับการใช้งานบนมือถือ
- UI ปรับตัวตามขนาดหน้าจอ

## 🔒 Security Features
- IndexedDB encryption
- Local storage เท่านั้น
- HTTPS only connections
- Password encryption

## 📊 Monitoring
- Vercel Analytics (ถ้าใช้ Vercel)
- API response monitoring
- Error logging 