const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// ใส่คุกกี้ของคุณที่นี่
const SESSION_COOKIE = 'gAAAAABoNwPWbyoPqL4qvx6eCXl_cRWv0lrgvKfFfOzEHbZsH6F5f8JvCM6xeoB5U_9uVb4KhdXA0e7kQQtid1iZLykMZZJoIOIk5PhCXacKqRvtB7qIipE';
const INTERCOM_COOKIE = 'TmtPZlU3UityQU91QUEvMVF0NFA2eUZIQ2luMFFUeGJrY3NHZ3p2eHB6U2R4T3VQZ1MxM1AzWHBZeXhWRG1hbDVUQ2RxclJvSG1LdkFjaWwzUktaVXVXLzZiVjF0c3JmZFc3VThIZWFCT1U9LS1OditXbHZiV2hZVTlSeWJHWU9pV2ZRPT0=--d834fda71b6d22bacc350de6632f54387dc820bc';

(async () => {
  console.log('🔍 Debug HTML จาก ithy.com/account...');
  
  try {
    const res = await axios.get('https://ithy.com/account', {
      headers: {
        'Cookie': [
          `session=${SESSION_COOKIE}`,
          `intercom-session-j3aqi0fi=${INTERCOM_COOKIE}`
        ].join('; '),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('✅ สำเร็จ! สถานะ:', res.status);
    
    // บันทึก HTML ลงไฟล์
    fs.writeFileSync('debug-page.html', res.data, 'utf8');
    console.log('💾 บันทึก HTML ลงไฟล์ debug-page.html');

    const $ = cheerio.load(res.data);
    
    // หาตารางทั้งหมด
    console.log('\n🔍 การค้นหาตาราง:');
    $('table').each((i, table) => {
      const id = $(table).attr('id') || 'ไม่มี ID';
      const className = $(table).attr('class') || 'ไม่มี class';
      const rowCount = $(table).find('tr').length;
      
      console.log(`📊 ตาราง ${i + 1}:`);
      console.log(`   - ID: ${id}`);
      console.log(`   - Class: ${className}`);
      console.log(`   - จำนวนแถว: ${rowCount}`);
      console.log('');
    });

    // หา div ที่มี table หรือ DataTable
    console.log('🔍 การค้นหา DataTable containers:');
    $('[id*="DataTable"], [class*="DataTable"], [class*="datatable"]').each((i, elem) => {
      const tagName = elem.tagName;
      const id = $(elem).attr('id') || 'ไม่มี ID';
      const className = $(elem).attr('class') || 'ไม่มี class';
      
      console.log(`📦 Element ${i + 1}: <${tagName}>`);
      console.log(`   - ID: ${id}`);
      console.log(`   - Class: ${className}`);
      console.log('');
    });

    // หา element ที่มี class article
    console.log('🔍 การค้นหา Article elements:');
    $('[class*="article"]').each((i, elem) => {
      const tagName = elem.tagName;
      const className = $(elem).attr('class');
      const text = $(elem).text().trim().substring(0, 100);
      
      console.log(`📝 Article Element ${i + 1}: <${tagName}>`);
      console.log(`   - Class: ${className}`);
      console.log(`   - Text: ${text}...`);
      console.log('');
    });

    // ตรวจสอบว่ามี login form หรือ redirect ไหม
    const hasLoginForm = $('form[action*="login"], input[type="email"], input[type="password"]').length > 0;
    const hasAccountContent = $('title').text().toLowerCase().includes('account');
    
    console.log('🔒 การตรวจสอบ Authentication:');
    console.log(`   - มี Login Form: ${hasLoginForm ? 'ใช่' : 'ไม่'}`);
    console.log(`   - มีคำว่า Account ใน title: ${hasAccountContent ? 'ใช่' : 'ไม่'}`);
    console.log(`   - Title: ${$('title').text()}`);

  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาด:', err.message);
    
    if (err.response) {
      console.error('📊 สถานะ HTTP:', err.response.status);
      console.error('📄 ข้อความตอบกลับ:', err.response.statusText);
    }
  }
})(); 