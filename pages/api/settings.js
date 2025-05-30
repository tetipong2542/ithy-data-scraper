// ค่าเริ่มต้นสำหรับการตั้งค่า
const defaultSettings = {
  wordpress: {
    siteUrl: '',
    username: '',
    appPassword: '',
    postStatus: 'draft'
  },
  scraping: {
    targetClasses: 'div.outer.theme-transitions,div.content-area,article,main',
    cssSelectors: '.content,.article-content,.post-content,.entry-content',
    timeout: 30000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  contentProcessing: {
    convertGutenberg: true,
    removeDuplicateH1: true,
    removeLogo: true,
    removeFooterContent: true,
    removeAds: true,
    cleanupEmptyTags: true
  },
  security: {
    useHttpsOnly: true,
    encryptPasswords: true
  }
};

// ฟังก์ชันเข้ารหัสรหัสผ่าน
function encryptPassword(password) {
  if (!password) return '';
  return Buffer.from(password).toString('base64');
}

function decryptPassword(encryptedPassword) {
  if (!encryptedPassword) return '';
  try {
    return Buffer.from(encryptedPassword, 'base64').toString();
  } catch (error) {
    return '';
  }
}

// ฟังก์ชันตรวจสอบการตั้งค่า WordPress
async function validateWordPressConfig(config) {
  const { siteUrl, username, appPassword } = config;
  
  if (!siteUrl || !username || !appPassword) {
    return {
      valid: false,
      error: 'ต้องระบุข้อมูลให้ครบทุกฟิลด์'
    };
  }
  
  // ตรวจสอบรูปแบบ URL
  try {
    const url = new URL(siteUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        valid: false,
        error: 'URL ต้องเริ่มต้นด้วย http:// หรือ https://'
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: 'รูปแบบ URL ไม่ถูกต้อง'
    };
  }
  
  return { valid: true };
}

// ฟังก์ชันทดสอบการเชื่อมต่อ WordPress
async function testWordPressConnection(config) {
  try {
    const axios = require('axios');
    const { siteUrl, username, appPassword } = config;
    
    const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
    
    const response = await axios.get(
      `${siteUrl}/wp-json/wp/v2/users/me`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        },
        timeout: 10000
      }
    );
    
    return {
      success: true,
      message: 'เชื่อมต่อ WordPress สำเร็จ!',
      userInfo: {
        id: response.data.id,
        name: response.data.name,
        roles: response.data.roles
      }
    };
    
  } catch (error) {
    let errorMessage = 'ไม่สามารถเชื่อมต่อได้';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
          break;
        case 403:
          errorMessage = 'ไม่มีสิทธิ์เข้าถึง';
          break;
        case 404:
          errorMessage = 'ไม่พบ WordPress REST API';
          break;
        default:
          errorMessage = `ข้อผิดพลาด: ${error.response.data?.message || error.message}`;
      }
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'ไม่พบเว็บไซต์ที่ระบุ';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'เชื่อมต่อถูกปฏิเสธ';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // ส่งค่าเริ่มต้นของการตั้งค่า
      if (req.query.action === 'defaults') {
        return res.status(200).json({
          success: true,
          data: defaultSettings
        });
      }
      
      // ส่งข้อมูลการตั้งค่าปัจจุบัน (ไม่มีการเก็บใน server จะใช้ client-side storage)
      return res.status(200).json({
        success: true,
        message: 'ใช้ localStorage หรือ IndexedDB ในการเก็บการตั้งค่า'
      });
    }
    
    if (req.method === 'POST') {
      const { action, config } = req.body;
      
      switch (action) {
        case 'validate':
          const validation = await validateWordPressConfig(config);
          return res.status(200).json({
            success: true,
            data: validation
          });
          
        case 'test-connection':
          const testResult = await testWordPressConnection(config);
          return res.status(200).json(testResult);
          
        case 'encrypt-password':
          const encrypted = encryptPassword(config.password);
          return res.status(200).json({
            success: true,
            data: { encryptedPassword: encrypted }
          });
          
        case 'decrypt-password':
          const decrypted = decryptPassword(config.encryptedPassword);
          return res.status(200).json({
            success: true,
            data: { password: decrypted }
          });
          
        default:
          return res.status(400).json({
            success: false,
            error: 'Action ที่ระบุไม่ถูกต้อง'
          });
      }
    }
    
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดใน settings API:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 