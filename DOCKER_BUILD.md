# 🐳 Docker Build Instructions

## 🔧 แก้ไขปัญหา npm ci ใน Docker

### ปัญหาที่เกิดขึ้น:
```bash
RUN npm ci - process did not complete successfully: exit code: 1
```

### ✅ การแก้ไข:

#### 1. อัพเดท Dependencies
- อัพเดท `axios` จาก `1.6.2` → `1.9.0` (แก้ไข security vulnerabilities)
- อัพเดท `next` จาก `14.2.29` → `15.3.3` (แก้ไข security vulnerabilities)
- ใช้ exact versions แทน semantic versioning

#### 2. แก้ไข next.config.js
- ลบ `experimental.appDir` (deprecated ใน Next.js 15)
- เพิ่ม `output: 'standalone'` สำหรับ Docker optimization

#### 3. สร้าง .dockerignore
- Exclude ไฟล์ที่ไม่จำเป็นเพื่อ optimize build

#### 4. Optimized Dockerfile
- ใช้ multi-stage build
- Install production dependencies only
- Use non-root user สำหรับ security

## 🚫 แก้ไขปัญหา "public directory not found"

### ปัญหาที่เกิดขึ้น:
```bash
COPY --from=builder /app/public ./public
failed to calculate checksum: "/app/public": not found
```

### ✅ การแก้ไข:
1. **สร้าง public directory**:
   ```bash
   mkdir -p public
   ```

2. **เพิ่มไฟล์พื้นฐาน**:
   - `public/.gitkeep` - ให้ Git track directory
   - `public/robots.txt` - SEO support
   - `public/favicon.ico` - Browser icon

3. **แก้ไข Dockerfile**:
   ```dockerfile
   # ใน builder stage
   RUN mkdir -p public
   
   # ใน runner stage  
   COPY --from=builder --chown=nextjs:nodejs /app/public ./public
   ```

## 🚀 การใช้งาน

### Build Docker Image:
```bash
docker build -t ithy-scraper .
```

### Run Container:
```bash
docker run -p 3000:3000 ithy-scraper
```

### Using Docker Compose:
```bash
# Production
docker-compose up -d

# Development
docker-compose --profile dev up
```

## 🔍 การทดสอบ

### Local Build Test:
```bash
npm install
npm run build
npm start
```

### Docker Build Test:
```bash
docker build -t test-build .
docker run -p 3000:3000 test-build
```

## 📊 ผลลัพธ์หลังแก้ไข:

✅ **npm ci**: ทำงานได้ปกติ  
✅ **Security**: ไม่มี vulnerabilities  
✅ **Build**: ผ่านการทดสอบ  
✅ **Docker**: Build สำเร็จ  
✅ **Public Directory**: มีการสร้างและ copy ถูกต้อง  
✅ **Railway.com**: Deploy ได้สำเร็จ  

## 🔧 Troubleshooting

### หาก npm ci ยังล้มเหลว:
```bash
# ลบ cache และ lock file
rm -rf node_modules package-lock.json
npm install

# หรือใช้ npm script
npm run fresh-install
```

### หาก Docker build ล้มเหลว:
```bash
# Clear Docker cache
docker system prune -a

# Build without cache
docker build --no-cache -t ithy-scraper .
```

### หาก public directory ไม่พบ:
```bash
# สร้าง public directory
mkdir -p public
echo "# Placeholder" > public/.gitkeep

# หรือใช้ npm script
npm run build  # จะสร้าง public directory อัตโนมัติ
```

---

📅 **อัพเดท**: แก้ไขปัญหา Docker build และ public directory แล้ว  
✅ **สถานะ**: พร้อมใช้งานบน Railway.com 