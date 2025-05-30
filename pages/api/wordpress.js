const axios = require('axios');
const cheerio = require('cheerio');

// ฟังก์ชันเข้ารหัส/ถอดรหัสรหัสผ่าน
function encryptPassword(password) {
  return Buffer.from(password).toString('base64');
}

function decryptPassword(encryptedPassword) {
  return Buffer.from(encryptedPassword, 'base64').toString();
}

// ฟังก์ชัน scrape เนื้อหาจาก URL
async function scrapeContent(url, targetClasses = '', cssSelectors = '', sessionCookie = '') {
  try {
    console.log(`🔍 เริ่มดึงเนื้อหาจาก: ${url}`);
    
    // สร้าง headers พื้นฐาน
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
    
    // เพิ่ม Cookie header ถ้ามี session cookie (สำหรับ ithy.com)
    if (sessionCookie && url.includes('ithy.com')) {
      const cookieParts = [
        'intercom-device-id-j3aqi0fi=8f2c4809-cb64-403c-823f-37308dc98db7',
        'g_state={"i_l":0}',
        `session=${sessionCookie}`,
        'is_pro=false'
      ];
      headers.Cookie = cookieParts.join('; ');
      console.log('🔑 ใช้ Session Cookie สำหรับ ithy.com');
    }
    
    const response = await axios.get(url, {
      headers,
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    
    // ตรวจสอบ iframe YouTube ก่อนลบเนื้อหาอื่น
    const allIframes = $('iframe');
    console.log(`🔍 พบ iframe ทั้งหมด: ${allIframes.length} รายการ`);
    
    allIframes.each((i, elem) => {
      const src = $(elem).attr('src') || '';
      if (src.includes('youtube.com') || src.includes('youtu.be')) {
        console.log(`🎥 พบ YouTube iframe: ${src}`);
      }
    });
    
    // ลบเนื้อหาที่ไม่ต้องการ (แต่ไม่ลบ iframe)
    $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove();
    
    // ค้นหาเนื้อหาหลัก
    let content = '';
    let title = '';
    
    // ดึง title
    title = $('h1').first().text().trim() || $('title').text().trim();
    
    // ค้นหาเนื้อหาตาม target classes
    const defaultSelectors = [
      'div.outer.theme-transitions',
      'div.content-area', 
      'article',
      'main',
      '.content',
      '.article-content',
      '.post-content',
      '.entry-content'
    ];
    
    const customSelectors = targetClasses ? targetClasses.split(',').map(s => s.trim()) : [];
    const allSelectors = [...customSelectors, ...defaultSelectors];
    
    for (const selector of allSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.html();
        console.log(`✅ พบเนื้อหาด้วย selector: ${selector}`);
        break;
      }
    }
    
    if (!content) {
      // fallback ไปที่ body
      content = $('body').html();
      console.log('⚠️ ใช้ body เป็น fallback');
    }
    
    return {
      title,
      content,
      url,
      extractedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการดึงเนื้อหา:', error.message);
    throw new Error(`ไม่สามารถดึงเนื้อหาได้: ${error.message}`);
  }
}

// ฟังก์ชันประมวลผลเนื้อหา
function processContent(content, options = {}) {
  const {
    convertGutenberg = true,
    removeDuplicateH1 = true,
    removeLogo = true,
    removeFooterContent = true
  } = options;
  
  const $ = cheerio.load(content);
  
  // ตรวจสอบ iframe ก่อนการประมวลผล
  const iframesBeforeProcessing = $('iframe');
  console.log(`🔍 ก่อนประมวลผล พบ iframe: ${iframesBeforeProcessing.length} รายการ`);
  
  iframesBeforeProcessing.each((i, elem) => {
    const src = $(elem).attr('src') || '';
    if (src.includes('youtube.com') || src.includes('youtu.be')) {
      console.log(`🎥 YouTube iframe ก่อนประมวลผล: ${src}`);
    }
  });
  
  // ลบ H1 ซ้ำ (เก็บแค่อันแรก)
  if (removeDuplicateH1) {
    const h1Elements = $('h1');
    if (h1Elements.length > 1) {
      h1Elements.slice(1).remove();
      console.log(`🗑️ ลบ H1 ซ้ำ ${h1Elements.length - 1} รายการ`);
    }
  }
  
  // ลบ Logo และรูปภาพที่เกี่ยวข้อง
  if (removeLogo) {
    $('img[src*="logo"], .logo, [class*="logo"], [id*="logo"]').remove();
    console.log('🗑️ ลบ Logo');
  }
  
  // ลบเนื้อหาท้าย
  if (removeFooterContent) {
    $('footer, .footer, [class*="footer"], .copyright, [class*="copyright"]').remove();
    console.log('🗑️ ลบเนื้อหาท้าย');
  }
  
  // แปลง Gutenberg Blocks (ถ้าต้องการ)
  if (convertGutenberg) {
    // แปลง div เป็น paragraph blocks
    $('div').each((i, elem) => {
      const $elem = $(elem);
      if ($elem.children().length === 0 && $elem.text().trim()) {
        $elem.replaceWith(`<p>${$elem.text().trim()}</p>`);
      }
    });
    console.log('🔄 แปลง Gutenberg Blocks');
  }
  
  // ทำความสะอาดเนื้อหา
  $('script, style, noscript').remove();
  
  // ลบ iframe ที่ไม่เกี่ยวข้อง แต่เก็บ YouTube, Vimeo และ video embed ไว้
  let videoIframesKept = 0;
  let totalIframesRemoved = 0;
  
  $('iframe').each((i, elem) => {
    const $elem = $(elem);
    const src = $elem.attr('src') || '';
    const title = $elem.attr('title') || '';
    
    const isVideo = src.includes('youtube.com') || 
                   src.includes('youtu.be') || 
                   src.includes('vimeo.com') || 
                   src.includes('dailymotion.com') ||
                   src.includes('facebook.com/plugins/video') ||
                   src.includes('player.') ||
                   title.toLowerCase().includes('video') ||
                   title.toLowerCase().includes('youtube') ||
                   $elem.parent().hasClass('video') ||
                   $elem.parent().hasClass('youtube');
    
    if (!isVideo) {
      $elem.remove();
      totalIframesRemoved++;
    } else {
      console.log(`🎥 เก็บ video iframe: ${src}`);
      videoIframesKept++;
    }
  });
  
  console.log(`📊 iframe สรุป: เก็บ ${videoIframesKept} รายการ, ลบ ${totalIframesRemoved} รายการ`);
  
  $('[style*="display:none"], [style*="display: none"]').remove();
  
  return $.html();
}

// ฟังก์ชันสร้าง excerpt จากเนื้อหา
function createExcerpt(content, sentenceCount = 6) {
  try {
    const $ = cheerio.load(content);
    
    // ดึงข้อความจากแท็ก <p> เท่านั้น
    let allText = '';
    $('p').each((index, element) => {
      const text = $(element).text().trim();
      if (text) {
        allText += text + ' ';
      }
    });
    
    if (!allText.trim()) {
      return '';
    }
    
    // แยกประโยคโดยใช้ . ! ? และ ๆ สำหรับภาษาไทย
    const sentences = allText
      .split(/[.!?๊๋์]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10); // กรองประโยคที่สั้นเกินไป
    
    // เอาแค่ 5-8 ประโยคแรก (ใช้ sentenceCount)
    const selectedSentences = sentences.slice(0, sentenceCount);
    
    let excerpt = selectedSentences.join('. ').trim();
    
    // เพิ่ม ... ถ้าเนื้อหายังมีต่อ
    if (sentences.length > sentenceCount) {
      excerpt += '...';
    }
    
    // จำกัดความยาวไม่เกิน 300 ตัวอักษร
    if (excerpt.length > 300) {
      excerpt = excerpt.substring(0, 297) + '...';
    }
    
    console.log(`📝 สร้าง excerpt: ${excerpt.substring(0, 100)}...`);
    return excerpt;
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการสร้าง excerpt:', error.message);
    return '';
  }
}

// ฟังก์ชันโพสต์ไปยัง WordPress
async function postToWordPress(title, content, wpConfig) {
  try {
    const { siteUrl, username, appPassword } = wpConfig;
    
    // สร้าง Basic Auth
    const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
    
    // สร้าง excerpt อัตโนมัติ
    const excerpt = createExcerpt(content, 6); // ใช้ 6 ประโยค
    
    const postData = {
      title: title,
      content: content,
      excerpt: excerpt, // เพิ่ม excerpt
      status: 'publish', // เปลี่ยนเป็น publish อัตโนมัติ
      format: 'standard'
    };
    
    console.log(`📤 กำลังโพสต์ไปยัง WordPress: ${siteUrl}`);
    if (excerpt) {
      console.log(`📝 Excerpt (6 ประโยค): ${excerpt}`);
    }
    
    const response = await axios.post(
      `${siteUrl}/wp-json/wp/v2/posts`,
      postData,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log(`✅ โพสต์และเผยแพร่สำเร็จ! ID: ${response.data.id}`);
    
    return {
      success: true,
      postId: response.data.id,
      postUrl: response.data.link,
      editUrl: `${siteUrl}/wp-admin/post.php?post=${response.data.id}&action=edit`,
      excerpt: excerpt // ส่ง excerpt กลับเพื่อแสดงผล
    };
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการโพสต์ WordPress:', error.response?.data || error.message);
    throw new Error(`การโพสต์ล้มเหลว: ${error.response?.data?.message || error.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }
  
  try {
    const { 
      articleUrl,
      wpConfig,
      scrapingConfig = {},
      processingConfig = {}
    } = req.body;
    
    if (!articleUrl) {
      return res.status(400).json({
        success: false,
        error: 'ต้องระบุ URL ของบทความ'
      });
    }
    
    if (!wpConfig || !wpConfig.siteUrl || !wpConfig.username || !wpConfig.appPassword) {
      return res.status(400).json({
        success: false,
        error: 'ต้องระบุข้อมูล WordPress Configuration'
      });
    }
    
    // ขั้นตอนที่ 1: ดึงเนื้อหาจาก URL
    console.log('🔍 ขั้นตอนที่ 1: ดึงเนื้อหา');
    const scrapedData = await scrapeContent(
      articleUrl,
      scrapingConfig.targetClasses,
      scrapingConfig.cssSelectors,
      scrapingConfig.sessionCookie
    );
    
    // ขั้นตอนที่ 2: ประมวลผลเนื้อหา
    console.log('⚙️ ขั้นตอนที่ 2: ประมวลผลเนื้อหา');
    const processedContent = processContent(scrapedData.content, processingConfig);
    
    // ขั้นตอนที่ 3: โพสต์ไปยัง WordPress
    console.log('📤 ขั้นตอนที่ 3: โพสต์ไปยัง WordPress');
    const postResult = await postToWordPress(
      scrapedData.title,
      processedContent,
      wpConfig
    );
    
    res.status(200).json({
      success: true,
      message: 'โพสต์บทความสำเร็จ!',
      data: {
        ...postResult,
        originalUrl: articleUrl,
        title: scrapedData.title,
        extractedAt: scrapedData.extractedAt
      }
    });
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการประมวลผล:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 