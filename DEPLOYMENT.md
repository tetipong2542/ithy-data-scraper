# 🚀 การ Deploy Ithy Data Scraper & WordPress Publisher

คู่มือการ deploy ระบบ web scraping และ WordPress publisher อย่างสมบูรณ์

## 📋 สิ่งที่ต้องเตรียม

### 1. Environment Variables
สร้างไฟล์ `.env.local` (สำหรับ development) และ `.env.production` (สำหรับ production):

```env
# Session cookies จาก ithy.com
ITHY_SESSION_COOKIE=gAAAAAB...
ITHY_INTERCOM_COOKIE=8f2c4809-cb64-403c-823f-37308dc98db7

# WordPress Configuration (Optional - สามารถตั้งใน UI ได้)
DEFAULT_WP_SITE_URL=https://your-wordpress-site.com
DEFAULT_WP_USERNAME=your-username
DEFAULT_WP_APP_PASSWORD=your-app-password

# Next.js Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
```

### 2. WordPress Application Password
1. เข้า WordPress Dashboard
2. ไปที่ **Users** > **Profile**
3. ส่วน **Application Passwords**
4. สร้าง password ใหม่สำหรับ API
5. คัดลอก password ที่ได้

### 3. Session Cookies จาก ithy.com
1. เปิด ithy.com ใน browser
2. Login เข้าระบบ
3. เปิด Developer Tools (F12)
4. ไปที่ tab **Application** > **Cookies**
5. คัดลอก cookies: `session` และ `intercom-device-id-j3aqi0fi`

## 🌐 Vercel Deployment (แนะนำ)

### 1. ติดตั้ง Vercel CLI
```bash
npm install -g vercel
```

### 2. Login Vercel
```bash
vercel login
```

### 3. Deploy ครั้งแรก
```bash
# ใน project directory
vercel

# ตอบคำถาม:
# ? Set up and deploy "~/your-project"? Yes
# ? Which scope? Your Account
# ? Link to existing project? No
# ? What's your project's name? ithy-scraper
# ? In which directory is your code located? ./
```

### 4. ตั้งค่า Environment Variables
```bash
# ตั้งค่าผ่าน CLI
vercel env add ITHY_SESSION_COOKIE
vercel env add ITHY_INTERCOM_COOKIE

# หรือตั้งค่าผ่าน Dashboard
# https://vercel.com/dashboard > Project > Settings > Environment Variables
```

### 5. Deploy Production
```bash
vercel --prod
```

## 🖥️ VPS/Server Deployment

### 1. ติดตั้ง Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 2. Clone และติดตั้ง
```bash
git clone <your-repository>
cd ithy-scraper
npm install
```

### 3. สร้าง Production Build
```bash
npm run build
```

### 4. ตั้งค่า PM2 (Process Manager)
```bash
# ติดตั้ง PM2
npm install -g pm2

# สร้างไฟล์ ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ithy-scraper',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/project',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# เริ่มแอพ
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 5. ตั้งค่า Nginx (Reverse Proxy)
```bash
# ติดตั้ง Nginx
sudo apt install nginx

# สร้าง config
sudo nano /etc/nginx/sites-available/ithy-scraper

# เนื้อหาไฟล์:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# เปิดใช้งาน site
sudo ln -s /etc/nginx/sites-available/ithy-scraper /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. ตั้งค่า SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🐳 Docker Deployment

### 1. สร้าง Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### 2. สร้าง docker-compose.yml
```yaml
version: '3.8'

services:
  ithy-scraper:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ITHY_SESSION_COOKIE=${ITHY_SESSION_COOKIE}
      - ITHY_INTERCOM_COOKIE=${ITHY_INTERCOM_COOKIE}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - ithy-scraper
    restart: unless-stopped
```

### 3. รัน Docker
```bash
# Build และรัน
docker-compose up -d

# ดู logs
docker-compose logs -f ithy-scraper

# Stop
docker-compose down
```

## 📱 การตั้งค่าหลังการ Deploy

### 1. ทดสอบระบบ
```bash
# ทดสอบ API
curl https://your-domain.com/api/articles

# ตรวจสอบ health check
curl https://your-domain.com/api/health
```

### 2. ตั้งค่า WordPress ใน UI
1. เปิด https://your-domain.com
2. คลิก **⚙️ การตั้งค่า WordPress**
3. กรอกข้อมูล WordPress
4. ทดสอบการเชื่อมต่อ
5. บันทึกการตั้งค่า

### 3. ตั้งค่า Auto-backup
```bash
# สร้าง script backup
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
PROJECT_DIR="/path/to/ithy-scraper"

# Backup project files
tar -czf "$BACKUP_DIR/ithy-scraper_$DATE.tar.gz" \
    --exclude="node_modules" \
    --exclude=".next" \
    --exclude="logs" \
    "$PROJECT_DIR"

# Keep only last 7 days
find "$BACKUP_DIR" -name "ithy-scraper_*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# เพิ่มใน crontab (backup ทุกวันเวลา 02:00)
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## 🔒 Security Checklist

### 1. Environment Variables
- [ ] ไม่มี sensitive data ใน code
- [ ] ใช้ `.env.production` สำหรับ production
- [ ] ตั้งค่า environment variables ใน hosting platform

### 2. HTTPS/SSL
- [ ] ตั้งค่า SSL certificate
- [ ] Force HTTPS redirect
- [ ] ตรวจสอบ SSL rating ที่ ssllabs.com

### 3. Access Control
- [ ] ปิด unnecessary ports
- [ ] ตั้งค่า firewall
- [ ] อัพเดท dependencies เป็นประจำ

### 4. Monitoring
- [ ] ตั้งค่า log monitoring
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring

## 📊 Performance Optimization

### 1. Next.js Optimization
```javascript
// next.config.js
module.exports = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  images: {
    domains: ['ithy.com'],
    minimumCacheTTL: 86400,
  },
}
```

### 2. Caching Strategy
```javascript
// pages/api/articles.js
export default async function handler(req, res) {
  // Set cache headers
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  
  // Your API logic here
}
```

### 3. Database Connection Pooling
```javascript
// lib/db.js (if using database)
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
```

## 🚨 Troubleshooting

### 1. Build Errors
```bash
# ล้าง cache
rm -rf .next node_modules
npm install
npm run build
```

### 2. Permission Issues
```bash
# ตั้งค่า permissions
sudo chown -R $USER:$USER /path/to/project
chmod -R 755 /path/to/project
```

### 3. Memory Issues
```bash
# เพิ่ม memory สำหรับ Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### 4. Log Monitoring
```bash
# ดู logs แบบ real-time
pm2 logs ithy-scraper --lines 100

# หรือสำหรับ Docker
docker-compose logs -f --tail 100 ithy-scraper
```

## 📈 Monitoring & Maintenance

### 1. Health Check Endpoint
สร้าง `/api/health.js`:
```javascript
export default function handler(req, res) {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
}
```

### 2. Log Rotation
```bash
# ตั้งค่า logrotate
sudo nano /etc/logrotate.d/ithy-scraper

# เนื้อหา:
/path/to/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
```

### 3. Automated Updates
```bash
# สร้าง update script
cat > update.sh << 'EOF'
#!/bin/bash
cd /path/to/ithy-scraper
git pull origin main
npm install
npm run build
pm2 reload ecosystem.config.js
EOF

chmod +x update.sh
```

---

**🎯 หมายเหตุ**: หลังจาก deploy แล้ว ระบบจะพร้อมใช้งานทันที พร้อมฟีเจอร์ครบถ้วน:
- ✅ Web Scraping จาก ithy.com
- ✅ WordPress Auto Publishing  
- ✅ IndexedDB Data Storage
- ✅ Auto-save Configuration
- ✅ Real-time Status Monitoring 