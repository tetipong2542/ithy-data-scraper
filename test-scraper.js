const axios = require('axios');
const cheerio = require('cheerio');

// คุกกี้ที่อัพเดทแล้ว
const FULL_COOKIE_HEADER = 'intercom-device-id-j3aqi0fi=8f2c4809-cb64-403c-823f-37308dc98db7;g_state={"i_l":0};session=gAAAAABoNwPWbyoPqL4qvx6eCXl_cRWv0lrgvKfFfOzEHbZsH6F5f8JvCM6xeoB5U_9uVb4KhdXA0e7kQQtid1iZLykMZZJoIOIk5PhCXacKqRvtB7qIipE;is_pro=false;intercom-session-j3aqi0fi=YVBEbGpaMDdaYlMyOHQzcW9nd2RFaUNWQzE1QjBmS2pmdUlaRjdLdVBvRnhTQW1WMHEwMFVuYzhmeSszWU9KUDd6SjlSZUUyV3NrWmk1SnJIb3gzL0ZEN1FsUURRYWIxRmt1YWRsMCtpTEk9LS02U3c1NWVLcWpMSm50N0ZLYWl4Y1N3PT0=--e0f1297776361fe43dfcdd9a5f004bd7d7697c42';

(async () => {
  console.log('🚀 เริ่มดึงข้อมูลจาก ithy.com...');
  console.log('🔑 ใช้คุกกี้:', FULL_COOKIE_HEADER.substring(0, 100) + '...');
  
  try {
    const res = await axios.get('https://ithy.com/account', {
      headers: {
        'Cookie': FULL_COOKIE_HEADER,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    console.log('📊 สถานะการตอบกลับ:', res.status);
    console.log('📄 ขนาดเนื้อหา:', res.data.length, 'characters');

    const $ = cheerio.load(res.data);
    
    // ตรวจสอบ title และ login status
    const title = $('title').text();
    const hasLoginForm = $('form[action*="login"], input[type="email"], input[type="password"]').length > 0;
    
    console.log('📋 ข้อมูลหน้าเว็บ:');
    console.log(`   - Title: ${title}`);
    console.log(`   - มี Login Form: ${hasLoginForm ? 'ใช่ (คุกกี้อาจหมดอายุ)' : 'ไม่'}`);
    
    // ลองหาตารางหลายรูปแบบ
    let table = $('#DataTables_Table_0');
    
    if (table.length === 0) {
      table = $('table').first();
      console.log('🔍 ไม่พบ #DataTables_Table_0 ใช้ตารางแรกแทน');
    }

    if (table.length > 0) {
      console.log('✅ พบตารางข้อมูล!');
      const articles = [];

      table.find('tbody tr, tr').each((i, row) => {
        const $row = $(row);
        const cells = [];
        
        $row.find('td, th').each((j, cell) => {
          const text = $(cell).text().trim();
          if (text && text.length > 0) {
            cells.push(text);
          }
        });

        if (cells.length > 0) {
          // หาหัวข้อ
          let title = $row.find('td.article-column, .article-title, td:first-child').text().trim();
          
          if (!title) {
            title = cells.find(cell => cell.length > 10) || cells[0] || '';
          }

          if (title && title.length > 5) {
            articles.push({
              id: i + 1,
              title: title,
              allColumns: cells
            });
          }
        }
      });

      console.log(`📝 จำนวนรายการที่พบ: ${articles.length}`);
      console.log('\n📋 รายการข้อมูล:');
      articles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   ข้อมูลทั้งหมด:`, article.allColumns);
        console.log('');
      });

      // บันทึกข้อมูลเป็น JSON
      const fs = require('fs');
      fs.writeFileSync('scraped-data.json', JSON.stringify(articles, null, 2), 'utf8');
      console.log('💾 บันทึกข้อมูลลงไฟล์ scraped-data.json แล้ว');

    } else {
      console.error('❌ ไม่พบตารางใดๆ ในหน้าเว็บ');
      console.log('🔍 กำลังค้นหาตารางทั้งหมด...');
      
      $('table').each((i, table) => {
        const id = $(table).attr('id') || 'ไม่มี ID';
        const className = $(table).attr('class') || 'ไม่มี class';
        const rowCount = $(table).find('tr').length;
        console.log(`ตาราง ${i + 1}: id="${id}", class="${className}", rows=${rowCount}`);
      });
      
      // บันทึก HTML สำหรับ debug
      const fs = require('fs');
      fs.writeFileSync('debug-page.html', res.data, 'utf8');
      console.log('💾 บันทึก HTML ลงไฟล์ debug-page.html สำหรับตรวจสอบ');
    }
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาด:', err.message);
    
    if (err.response) {
      console.error('📊 สถานะ HTTP:', err.response.status);
      console.error('📄 ข้อความตอบกลับ:', err.response.statusText);
    }
  }
})(); 