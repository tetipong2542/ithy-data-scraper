const axios = require('axios');

// คุกกี้ที่อัพเดทแล้ว
const FULL_COOKIE_HEADER = 'intercom-device-id-j3aqi0fi=8f2c4809-cb64-403c-823f-37308dc98db7;g_state={"i_l":0};session=gAAAAABoNwPWbyoPqL4qvx6eCXl_cRWv0lrgvKfFfOzEHbZsH6F5f8JvCM6xeoB5U_9uVb4KhdXA0e7kQQtid1iZLykMZZJoIOIk5PhCXacKqRvtB7qIipE;is_pro=false;intercom-session-j3aqi0fi=YVBEbGpaMDdaYlMyOHQzcW9nd2RFaUNWQzE1QjBmS2pmdUlaRjdLdVBvRnhTQW1WMHEwMFVuYzhmeSszWU9KUDd6SjlSZUUyV3NrWmk1SnJIb3gzL0ZEN1FsUURRYWIxRmt1YWRsMCtpTEk9LS02U3c1NWVLcWpMSm50N0ZLYWl4Y1N3PT0=--e0f1297776361fe43dfcdd9a5f004bd7d7697c42';

const headers = {
  'Cookie': FULL_COOKIE_HEADER,
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Referer': 'https://ithy.com/account',
  'X-Requested-With': 'XMLHttpRequest'
};

(async () => {
  console.log('🚀 ทดสอบ API endpoints ของ ithy.com...');
  
  try {
    // ทดสอบ /get_user_data
    console.log('\n📊 เรียก /get_user_data...');
    const userDataResponse = await axios.get('https://ithy.com/get_user_data', { headers });
    
    console.log('✅ สำเร็จ! สถานะ:', userDataResponse.status);
    console.log('📄 ข้อมูลผู้ใช้:', JSON.stringify(userDataResponse.data, null, 2));
    
    // ถ้ามีข้อมูลบทความ ให้แสดง
    if (userDataResponse.data && userDataResponse.data.articles) {
      console.log(`\n📝 จำนวนบทความ: ${userDataResponse.data.articles.length}`);
      userDataResponse.data.articles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title || article.name || 'ไม่มีชื่อ'}`);
      });
    }

    // บันทึกข้อมูลลงไฟล์
    const fs = require('fs');
    fs.writeFileSync('user-data.json', JSON.stringify(userDataResponse.data, null, 2), 'utf8');
    console.log('\n💾 บันทึกข้อมูลลงไฟล์ user-data.json แล้ว');

  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาด:', err.message);
    
    if (err.response) {
      console.error('📊 สถานะ HTTP:', err.response.status);
      console.error('📄 ข้อความตอบกลับ:', err.response.statusText);
      if (err.response.data) {
        console.error('📋 ข้อมูลตอบกลับ:', err.response.data);
      }
    }
  }
})(); 