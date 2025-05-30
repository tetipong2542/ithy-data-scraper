const axios = require('axios');
const cheerio = require('cheerio');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // ดึงคุกกี้จาก query parameter หรือ environment variables (fallback)
    const sessionCookie = req.query.sessionCookie || process.env.ITHY_SESSION_COOKIE;
    const intercomCookie = process.env.ITHY_INTERCOM_COOKIE;

    // เพิ่มการแจ้งเตือนเมื่อไม่มี session cookie
    if (!sessionCookie) {
      console.log('⚠️ ไม่พบ Session Cookie - จะทดลองเข้าถึงแบบไม่มี authentication');
    } else if (req.query.sessionCookie) {
      console.log('🔑 ใช้ Session Cookie จาก UI');
    } else {
      console.log('🔑 ใช้ Session Cookie จาก Environment Variable');
    }

    // สร้างคุกกี้ header แบบครบถ้วน
    const cookieParts = [
      'intercom-device-id-j3aqi0fi=8f2c4809-cb64-403c-823f-37308dc98db7',
      'g_state={"i_l":0}',
      'is_pro=false'
    ];

    // เพิ่ม session cookie ถ้ามี
    if (sessionCookie) {
      cookieParts.push(`session=${sessionCookie}`);
    }

    // เพิ่ม intercom session ถ้ามี
    if (intercomCookie) {
      cookieParts.push(`intercom-session-j3aqi0fi=${intercomCookie}`);
    }

    const fullCookieHeader = cookieParts.join('; ');

    console.log('🔑 Cookie Header:', sessionCookie ? 'พร้อม session' : 'ไม่มี session');

    // ดึงข้อมูลจาก ithy.com/account
    const response = await axios.get('https://ithy.com/account', {
      headers: {
        'Cookie': fullCookieHeader,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    console.log('📊 สถานะการตอบกลับ:', response.status);
    console.log('📄 ขนาดเนื้อหา:', response.data.length, 'characters');

    // แยกข้อมูลด้วย cheerio
    const $ = cheerio.load(response.data);
    
    // ตรวจสอบว่าเป็นหน้า login หรือไม่
    const hasLoginForm = $('form[action*="login"], input[type="email"], input[type="password"]').length > 0;
    const pageTitle = $('title').text();
    
    if (hasLoginForm) {
      console.log('⚠️ ถูก redirect ไปหน้า login - session อาจหมดอายุ');
      return res.status(401).json({ 
        error: 'Session หมดอายุ กรุณาเข้าสู่ระบบ ithy.com ใหม่และอัพเดท ITHY Session Cookie',
        debug: {
          pageTitle,
          hasLoginForm: true,
          needsAuthentication: true
        }
      });
    }
    
    // ค้นหา articleHistory ใน JavaScript
    const scriptContent = response.data;
    const articleHistoryMatch = scriptContent.match(/const articleHistory = (\[.*?\]);/);
    
    if (!articleHistoryMatch) {
      console.log('❌ ไม่พบ articleHistory ในหน้า');
      return res.status(404).json({ 
        error: 'ไม่พบข้อมูล articleHistory ในหน้า /account',
        debug: {
          pageTitle: pageTitle,
          hasLoginForm: hasLoginForm,
          sessionStatus: sessionCookie ? 'มี session' : 'ไม่มี session'
        }
      });
    }

    let articles = [];
    
    try {
      // แปลง JSON string เป็น array
      const articleHistoryData = JSON.parse(articleHistoryMatch[1]);
      
      console.log(`✅ พบและ parse articleHistory สำเร็จ: ${articleHistoryData.length} รายการ`);
      
      articles = articleHistoryData.map((article, index) => {
        // แปลง epoch timestamp เป็นวันที่
        const date = new Date(article.epoch * 1000).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // ตัดคำถามให้สั้นลงถ้ายาวเกินไป
        const title = article.question && article.question.length > 100 
          ? article.question.substring(0, 100) + '...'
          : article.question || 'ไม่มีชื่อ';

        // สร้าง slug จาก title และ articleId
        const createSlug = (text, articleId) => {
          let slug = '';
          
          // สร้าง slug ตามเนื้อหาของบทความ
          if (text.includes('เปรียบเทียบภาษี') || text.includes('ภาษีบุคคลธรรมดา')) {
            slug = 'tax-comparison-business-entity';
          } else if (text.includes('อัตราภาษีเงินได้นิติบุคคล')) {
            slug = 'corporate-income-tax-thailand';
          } else if (text.includes('AI') && text.includes('กฎหมาย')) {
            slug = 'ai-law-accounting-ethics';
          } else if (text.includes('นักบัญชี') && text.includes('AI')) {
            slug = 'accountant-preparation-ai-era';
          } else if (text.includes('Machine Learning') || text.includes('เทคโนโลยี AI')) {
            slug = 'ai-machine-learning-accounting-2025';
          } else if (text.includes('Digital Transformation')) {
            slug = 'digital-transformation-accounting-thailand';
          } else if (text.includes('e-Tax Invoice') && text.includes('เชื่อมต่อ')) {
            slug = 'online-accounting-e-tax-invoice-connection';
          } else if (text.includes('e-Tax Invoice') && text.includes('ลงทะเบียน')) {
            slug = 'e-tax-invoice-registration-thailand';
          } else if (text.includes('e-Tax Invoice') && text.includes('ธุรกิจ')) {
            slug = 'e-tax-invoice-business-guide';
          } else if (text.includes('VAT') || text.includes('ภาษีมูลค่าเพิ่ม')) {
            slug = 'thai-vat-registration-guide';
          } else if (text.includes('แยกบัญชี')) {
            slug = 'advantages-disadvantages-separate-accounts';
          } else if (text.includes('ภาษีสำหรับธุรกิจออนไลน์')) {
            slug = 'thai-online-business-tax';
          } else if (text.includes('PDPA')) {
            slug = 'pdpa-ecommerce-thailand-compliance';
          } else if (text.includes('จดทะเบียนพาณิชย์')) {
            slug = 'online-business-registration-guide';
          } else if (text.includes('KPI') && text.includes('OKR')) {
            slug = 'kpi-okr-differences-employee-impact';
          } else {
            // Default pattern
            slug = 'business-article';
          }
          
          return `${slug}-${articleId}`;
        };

        const slug = createSlug(article.question, article.articleId);

        return {
          id: index + 1,
          articleId: article.articleId,
          title: title,
          date: date,
          epoch: article.epoch,
          url: `https://ithy.com/article/${slug}`,
          question: article.question
        };
      });

      // เรียงตามวันที่ล่าสุด
      articles.sort((a, b) => b.epoch - a.epoch);
      
    } catch (parseError) {
      console.error('❌ ไม่สามารถแปลง articleHistory JSON:', parseError.message);
      return res.status(500).json({
        error: 'ไม่สามารถแปลงข้อมูลบทความได้',
        details: parseError.message
      });
    }

    console.log(`✅ ดึงข้อมูลสำเร็จ! พบ ${articles.length} บทความ`);

    return res.status(200).json({
      success: true,
      data: articles,
      total: articles.length,
      timestamp: new Date().toISOString(),
      debug: {
        sourceType: 'articleHistory',
        pageTitle: pageTitle,
        sessionUsed: sessionCookie ? 'มี' : 'ไม่มี',
        sessionSource: req.query.sessionCookie ? 'UI' : (process.env.ITHY_SESSION_COOKIE ? 'Environment' : 'ไม่มี')
      }
    });

  } catch (error) {
    console.error('❌ ดึงข้อมูลล้มเหลว:', error.message);
    
    return res.status(500).json({
      error: 'ไม่สามารถดึงข้อมูลได้',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 