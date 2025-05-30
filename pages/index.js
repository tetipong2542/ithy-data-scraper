import { useState, useEffect } from 'react';
import Head from 'next/head';

// ฟังก์ชันจัดการ IndexedDB
const DB_NAME = 'ithyScraperDB';
const DB_VERSION = 1;
const SETTINGS_STORE = 'settings';
const DEFAULT_STORE = 'defaults';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DEFAULT_STORE)) {
        db.createObjectStore(DEFAULT_STORE, { keyPath: 'id' });
      }
    };
  });
};

// ค่า Factory Default
const FACTORY_DEFAULTS = {
  wordpress: {
    siteUrl: '',
    username: '',
    appPassword: '',
    postStatus: 'publish'
  },
  scraping: {
    targetClasses: 'div.outer.theme-transitions,div.content-area,article,main',
    cssSelectors: '.content,.article-content,.post-content,.entry-content'
  },
  processing: {
    convertGutenberg: true,
    removeDuplicateH1: true,
    removeLogo: true,
    removeFooterContent: true
  }
};

// ฟังก์ชันเข้ารหัส/ถอดรหัสแบบ simple encryption
const encryptData = (data) => {
  const key = 'ithyScraper2024Key';
  const encrypted = btoa(JSON.stringify(data) + key);
  return encrypted;
};

const decryptData = (encryptedData) => {
  try {
    const key = 'ithyScraper2024Key';
    const decrypted = atob(encryptedData);
    const jsonString = decrypted.replace(key, '');
    return JSON.parse(jsonString);
  } catch (error) {
    return null;
  }
};

const saveSettings = async (settings) => {
  const db = await openDB();
  const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
  const store = transaction.objectStore(SETTINGS_STORE);
  const encryptedSettings = encryptData(settings);
  await store.put({ id: 'main', data: encryptedSettings, timestamp: new Date().toISOString() });
};

const loadSettings = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([SETTINGS_STORE], 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    const result = await store.get('main');
    if (result && result.data) {
      return decryptData(result.data);
    }
    return null;
  } catch (error) {
    console.log('No settings found, using defaults');
    return null;
  }
};

// บันทึกเป็น Default
const saveAsDefault = async (settings) => {
  const db = await openDB();
  const transaction = db.transaction([DEFAULT_STORE], 'readwrite');
  const store = transaction.objectStore(DEFAULT_STORE);
  const encryptedSettings = encryptData(settings);
  await store.put({ id: 'user_defaults', data: encryptedSettings, timestamp: new Date().toISOString() });
};

// โหลด Default ที่บันทึกไว้
const loadUserDefaults = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([DEFAULT_STORE], 'readonly');
    const store = transaction.objectStore(DEFAULT_STORE);
    const result = await store.get('user_defaults');
    if (result && result.data) {
      return decryptData(result.data);
    }
    return null;
  } catch (error) {
    return null;
  }
};

// ลบ User Defaults
const clearUserDefaults = async () => {
  const db = await openDB();
  const transaction = db.transaction([DEFAULT_STORE], 'readwrite');
  const store = transaction.objectStore(DEFAULT_STORE);
  await store.delete('user_defaults');
};

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  
  // WordPress related states
  const [wpSettings, setWpSettings] = useState({
    siteUrl: '',
    username: '',
    appPassword: '',
    postStatus: 'draft'
  });
  const [scrapingSettings, setScrapingSettings] = useState({
    targetClasses: 'div.outer.theme-transitions,div.content-area,article,main',
    cssSelectors: '.content,.article-content,.post-content,.entry-content'
  });
  const [processingSettings, setProcessingSettings] = useState({
    convertGutenberg: true,
    removeDuplicateH1: true,
    removeLogo: true,
    removeFooterContent: true
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [postingStates, setPostingStates] = useState({});
  const [connectionStatus, setConnectionStatus] = useState(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/articles');
      const data = await response.json();
      
      if (data.success) {
        setArticles(data.data);
        setFilteredArticles(data.data);
        setLastUpdated(data.timestamp);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    const loadSettingsFromDB = async () => {
      try {
        const settings = await loadSettings();
        if (settings) {
          if (settings.wordpress) {
            setWpSettings(settings.wordpress);
          }
          if (settings.scraping) {
            setScrapingSettings(settings.scraping);
          }
          if (settings.processing) {
            setProcessingSettings(settings.processing);
          }
          console.log('โหลดการตั้งค่าสำเร็จ');
        } else {
          // ถ้าไม่มีการตั้งค่า ใช้ค่า factory defaults
          setWpSettings(FACTORY_DEFAULTS.wordpress);
          setScrapingSettings(FACTORY_DEFAULTS.scraping);
          setProcessingSettings(FACTORY_DEFAULTS.processing);
          console.log('ใช้ค่าเริ่มต้นจากโรงงาน');
        }
      } catch (error) {
        console.error('ไม่สามารถโหลดการตั้งค่าได้:', error);
        // ใช้ค่า factory defaults
        setWpSettings(FACTORY_DEFAULTS.wordpress);
        setScrapingSettings(FACTORY_DEFAULTS.scraping);
        setProcessingSettings(FACTORY_DEFAULTS.processing);
      }
    };

    loadSettingsFromDB();
    fetchArticles();
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [articles]);

  // Save all settings
  const saveAllSettings = async () => {
    try {
      const allSettings = {
        wordpress: wpSettings,
        scraping: scrapingSettings,
        processing: processingSettings
      };
      
      await saveSettings(allSettings);
      setCopyStatus('บันทึกการตั้งค่าสำเร็จ!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (error) {
      setCopyStatus('ไม่สามารถบันทึกการตั้งค่าได้');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  // ทดสอบการเชื่อมต่อ WordPress
  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-connection',
          config: wpSettings
        })
      });
      
      const result = await response.json();
      setConnectionStatus(result.success ? 'success' : 'error');
      
      if (result.success) {
        setCopyStatus(`เชื่อมต่อสำเร็จ! ผู้ใช้: ${result.userInfo?.name}`);
      } else {
        setCopyStatus(`ข้อผิดพลาด: ${result.error}`);
      }
      
      setTimeout(() => {
        setConnectionStatus(null);
        setCopyStatus('');
      }, 3000);
      
    } catch (error) {
      setConnectionStatus('error');
      setCopyStatus('ไม่สามารถทดสอบการเชื่อมต่อได้');
      setTimeout(() => {
        setConnectionStatus(null);
        setCopyStatus('');
      }, 3000);
    }
  };

  // โพสต์บทความไปยัง WordPress
  const postToWordPress = async (article) => {
    const articleId = article.articleId;
    
    try {
      setPostingStates(prev => ({ ...prev, [articleId]: 'posting' }));
      
      const response = await fetch('/api/wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleUrl: article.url,
          wpConfig: wpSettings,
          scrapingConfig: scrapingSettings,
          processingConfig: processingSettings
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPostingStates(prev => ({ ...prev, [articleId]: 'success' }));
        setCopyStatus(`โพสต์และเผยแพร่สำเร็จ! ${result.data.title}`);
        
        // ลบการเปิดหน้าแก้ไขใน tab ใหม่
        // if (result.data.editUrl) {
        //   window.open(result.data.editUrl, '_blank');
        // }
      } else {
        setPostingStates(prev => ({ ...prev, [articleId]: 'error' }));
        setCopyStatus(`ข้อผิดพลาด: ${result.error}`);
      }
      
    } catch (error) {
      setPostingStates(prev => ({ ...prev, [articleId]: 'error' }));
      setCopyStatus(`ไม่สามารถโพสต์ได้: ${error.message}`);
    }
    
    setTimeout(() => {
      setPostingStates(prev => ({ ...prev, [articleId]: null }));
      setCopyStatus('');
    }, 5000);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('th-TH');
    } catch {
      return dateString;
    }
  };

  const truncateTitle = (title, maxLength = 80) => {
    if (!title) return 'ไม่มีชื่อ';
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  // Search function
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(article =>
        article.title.toLowerCase().includes(term.toLowerCase()) ||
        article.articleId.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredArticles(filtered);
    }
  };

  // Copy single link
  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('คัดลอกลิงก์แล้ว!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      setCopyStatus('ไม่สามารถคัดลอกได้');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  // Copy all links
  const copyAllLinks = async () => {
    try {
      const allLinks = filteredArticles.map(article => article.url).join('\n');
      await navigator.clipboard.writeText(allLinks);
      setCopyStatus(`คัดลอก ${filteredArticles.length} ลิงก์แล้ว!`);
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (err) {
      setCopyStatus('ไม่สามารถคัดลอกได้');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  // Reset factory settings
  const resetSettings = async () => {
    if (confirm('คุณต้องการรีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นจากโรงงานใช่หรือไม่?')) {
      try {
        const db = await openDB();
        const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);
        await store.delete('main');
        
        // Reset states to factory defaults
        setWpSettings(FACTORY_DEFAULTS.wordpress);
        setScrapingSettings(FACTORY_DEFAULTS.scraping);
        setProcessingSettings(FACTORY_DEFAULTS.processing);
        
        setCopyStatus('รีเซ็ตเป็นค่าเริ่มต้นจากโรงงานแล้ว!');
        setTimeout(() => setCopyStatus(''), 2000);
      } catch (error) {
        setCopyStatus('ไม่สามารถรีเซ็ตการตั้งค่าได้');
        setTimeout(() => setCopyStatus(''), 2000);
      }
    }
  };

  // Set as Default
  const setAsDefault = async () => {
    if (confirm('คุณต้องการบันทึกการตั้งค่าปัจจุบันเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      try {
        const currentSettings = {
          wordpress: wpSettings,
          scraping: scrapingSettings,
          processing: processingSettings
        };
        
        await saveAsDefault(currentSettings);
        setCopyStatus('บันทึกเป็นค่าเริ่มต้นแล้ว!');
        setTimeout(() => setCopyStatus(''), 2000);
      } catch (error) {
        setCopyStatus('ไม่สามารถบันทึกเป็นค่าเริ่มต้นได้');
        setTimeout(() => setCopyStatus(''), 2000);
      }
    }
  };

  // Reset to Default (User's saved defaults)
  const resetToDefault = async () => {
    try {
      const userDefaults = await loadUserDefaults();
      
      if (userDefaults) {
        if (confirm('คุณต้องการรีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นที่คุณบันทึกไว้ใช่หรือไม่?')) {
          if (userDefaults.wordpress) setWpSettings(userDefaults.wordpress);
          if (userDefaults.scraping) setScrapingSettings(userDefaults.scraping);
          if (userDefaults.processing) setProcessingSettings(userDefaults.processing);
          
          setCopyStatus('รีเซ็ตเป็นค่าเริ่มต้นที่บันทึกไว้แล้ว!');
          setTimeout(() => setCopyStatus(''), 2000);
        }
      } else {
        setCopyStatus('ไม่พบค่าเริ่มต้นที่บันทึกไว้ กรุณาบันทึกค่าเริ่มต้นก่อน');
        setTimeout(() => setCopyStatus(''), 3000);
      }
    } catch (error) {
      setCopyStatus('ไม่สามารถโหลดค่าเริ่มต้นได้');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  // Clear User Defaults
  const clearDefaults = async () => {
    if (confirm('คุณต้องการลบค่าเริ่มต้นที่บันทึกไว้ใช่หรือไม่?')) {
      try {
        await clearUserDefaults();
        setCopyStatus('ลบค่าเริ่มต้นที่บันทึกไว้แล้ว!');
        setTimeout(() => setCopyStatus(''), 2000);
      } catch (error) {
        setCopyStatus('ไม่สามารถลบค่าเริ่มต้นได้');
        setTimeout(() => setCopyStatus(''), 2000);
      }
    }
  };

  return (
    <>
      <Head>
        <title>Ithy Data Scraper</title>
        <meta name="description" content="ระบบดึงข้อมูลจาก ithy.com และโพสต์ไปยัง WordPress" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ 
          maxWidth: '1600px', 
          margin: '0 auto', 
          padding: '20px' 
        }}>
          {/* Header */}
          <div style={{ 
            background: 'white',
            borderRadius: '10px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ 
              color: '#333',
              margin: '0 0 10px 0',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              📊 Ithy Data Scraper & WordPress Publisher
            </h1>
            <p style={{ 
              color: '#666',
              margin: '0 0 20px 0',
              fontSize: '16px'
            }}>
              ระบบดึงข้อมูลบทความจาก ithy.com และโพสต์ไปยัง WordPress อัตโนมัติ
            </p>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              flexWrap: 'wrap',
              marginBottom: '20px'
            }}>
              <button
                onClick={fetchArticles}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {loading ? '🔄 กำลังโหลด...' : '🔄 รีเฟรชข้อมูล'}
              </button>

              <button
                onClick={copyAllLinks}
                disabled={filteredArticles.length === 0}
                style={{
                  backgroundColor: filteredArticles.length === 0 ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: filteredArticles.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                📋 คัดลอกลิงก์ทั้งหมด ({filteredArticles.length})
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ⚙️ การตั้งค่า WordPress
              </button>
              
              {lastUpdated && (
                <span style={{ 
                  color: '#666', 
                  fontSize: '14px' 
                }}>
                  อัพเดทล่าสุด: {formatDate(lastUpdated)}
                </span>
              )}

              {copyStatus && (
                <span style={{
                  color: '#28a745',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  backgroundColor: '#d4edda',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  border: '1px solid #c3e6cb'
                }}>
                  ✅ {copyStatus}
                </span>
              )}
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="🔍 ค้นหาบทความ... (ชื่อบทความ หรือ Article ID)"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
              {searchTerm && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  พบ {filteredArticles.length} จาก {articles.length} บทความ
                  <button
                    onClick={() => handleSearch('')}
                    style={{
                      marginLeft: '10px',
                      background: 'none',
                      border: 'none',
                      color: '#007bff',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '14px'
                    }}
                  >
                    ล้างการค้นหา
                  </button>
                </div>
              )}
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>⚙️ การตั้งค่า WordPress & Content Processing</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {/* WordPress Settings */}
                  <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', border: '1px solid #dee2e6' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#6f42c1' }}>🔗 WordPress Configuration</h4>
                    
                    <div style={{
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '4px',
                      padding: '8px',
                      marginBottom: '15px',
                      fontSize: '12px',
                      color: '#856404'
                    }}>
                      <strong>⚠️ หมายเหตุ:</strong> บทความจะถูกเผยแพร่ (Publish) อัตโนมัติทันทีเมื่อโพสต์สำเร็จ
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                        Site URL:
                      </label>
                      <input
                        type="url"
                        placeholder="https://yoursite.com"
                        value={wpSettings.siteUrl}
                        onChange={(e) => setWpSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                        Username:
                      </label>
                      <input
                        type="text"
                        value={wpSettings.username}
                        onChange={(e) => setWpSettings(prev => ({ ...prev, username: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                        Application Password:
                      </label>
                      <input
                        type="password"
                        value={wpSettings.appPassword}
                        onChange={(e) => setWpSettings(prev => ({ ...prev, appPassword: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    
                    <button
                      onClick={testConnection}
                      disabled={!wpSettings.siteUrl || !wpSettings.username || !wpSettings.appPassword || connectionStatus === 'testing'}
                      style={{
                        backgroundColor: connectionStatus === 'testing' ? '#ffc107' : 
                                        connectionStatus === 'success' ? '#28a745' : 
                                        connectionStatus === 'error' ? '#dc3545' : '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '4px',
                        cursor: connectionStatus === 'testing' ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        width: '100%'
                      }}
                    >
                      {connectionStatus === 'testing' ? '🔄 กำลังทดสอบ...' :
                       connectionStatus === 'success' ? '✅ เชื่อมต่อสำเร็จ' :
                       connectionStatus === 'error' ? '❌ เชื่อมต่อล้มเหลว' :
                       '🔗 ทดสอบการเชื่อมต่อ'}
                    </button>
                  </div>
                  
                  {/* Scraping Settings */}
                  <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', border: '1px solid #dee2e6' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#28a745' }}>🕷️ Web Scraping Configuration</h4>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                        Target Classes:
                      </label>
                      <textarea
                        placeholder="div.outer.theme-transitions,div.content-area,article,main"
                        value={scrapingSettings.targetClasses}
                        onChange={(e) => setScrapingSettings(prev => ({ ...prev, targetClasses: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '12px',
                          height: '60px',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                        CSS Selectors:
                      </label>
                      <textarea
                        placeholder=".content,.article-content,.post-content,.entry-content"
                        value={scrapingSettings.cssSelectors}
                        onChange={(e) => setScrapingSettings(prev => ({ ...prev, cssSelectors: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '12px',
                          height: '40px',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Processing Settings */}
                  <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', border: '1px solid #dee2e6' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#fd7e14' }}>⚙️ Content Processing</h4>
                    
                    {Object.entries({
                      convertGutenberg: 'แปลง Gutenberg Blocks',
                      removeDuplicateH1: 'ลบ H1 ซ้ำ',
                      removeLogo: 'ลบ Logo',
                      removeFooterContent: 'ลบเนื้อหาท้าย'
                    }).map(([key, label]) => (
                      <div key={key} style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={processingSettings[key]}
                            onChange={(e) => setProcessingSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                            style={{ marginRight: '8px' }}
                          />
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={saveAllSettings}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#007cba',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    💾 บันทึกการตั้งค่า
                  </button>
                  <button
                    onClick={setAsDefault}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ⭐ Set as Default
                  </button>
                  <button
                    onClick={resetToDefault}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Reset to Default
                  </button>
                  <button
                    onClick={resetSettings}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🏭 Factory Reset
                  </button>
                  <button
                    onClick={clearDefaults}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Clear Defaults
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ 
            background: 'white',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            {error && (
              <div style={{
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                color: '#721c24',
                padding: '15px',
                borderRadius: '5px',
                marginBottom: '20px'
              }}>
                <strong>❌ เกิดข้อผิดพลาด:</strong> {error}
              </div>
            )}

            {loading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: '#666'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                <div>กำลังดึงข้อมูลจาก ithy.com...</div>
              </div>
            ) : filteredArticles.length > 0 ? (
              <>
                <h2 style={{ 
                  color: '#333',
                  marginBottom: '20px',
                  fontSize: '20px'
                }}>
                  📝 รายการบทความ ({filteredArticles.length} รายการ)
                </h2>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ 
                          padding: '12px',
                          textAlign: 'left',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: 'bold',
                          color: '#495057',
                          width: '40px'
                        }}>
                          #
                        </th>
                        <th style={{ 
                          padding: '12px',
                          textAlign: 'left',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: 'bold',
                          color: '#495057',
                          width: '35%'
                        }}>
                          หัวข้อบทความ
                        </th>
                        <th style={{ 
                          padding: '12px',
                          textAlign: 'left',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: 'bold',
                          color: '#495057',
                          width: '120px'
                        }}>
                          วันที่สร้าง
                        </th>
                        <th style={{ 
                          padding: '12px',
                          textAlign: 'left',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: 'bold',
                          color: '#495057',
                          width: '80px'
                        }}>
                          Article ID
                        </th>
                        <th style={{ 
                          padding: '12px',
                          textAlign: 'center',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: 'bold',
                          color: '#495057',
                          width: '70px'
                        }}>
                          ลิงก์
                        </th>
                        <th style={{ 
                          padding: '12px',
                          textAlign: 'center',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: 'bold',
                          color: '#495057',
                          width: '70px'
                        }}>
                          คัดลอก
                        </th>
                        <th style={{ 
                          padding: '12px',
                          textAlign: 'center',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: 'bold',
                          color: '#495057',
                          width: '100px'
                        }}>
                          WordPress
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArticles.map((article, index) => (
                        <tr 
                          key={article.articleId}
                          style={{ 
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                            borderBottom: '1px solid #dee2e6'
                          }}
                        >
                          <td style={{ 
                            padding: '12px',
                            color: '#6c757d',
                            fontSize: '14px'
                          }}>
                            {index + 1}
                          </td>
                          <td style={{ 
                            padding: '12px',
                            color: '#212529',
                            fontWeight: '500',
                            lineHeight: '1.4'
                          }}>
                            {truncateTitle(article.title)}
                          </td>
                          <td style={{ 
                            padding: '12px',
                            color: '#6c757d',
                            fontSize: '14px',
                            whiteSpace: 'nowrap'
                          }}>
                            {article.date}
                          </td>
                          <td style={{ 
                            padding: '12px',
                            color: '#6c757d',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}>
                            {article.articleId}
                          </td>
                          <td style={{ 
                            padding: '12px',
                            textAlign: 'center'
                          }}>
                            {article.url && (
                              <a 
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: '#007bff',
                                  textDecoration: 'none',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  border: '1px solid #007bff',
                                  backgroundColor: 'transparent',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#007bff';
                                  e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                  e.target.style.color = '#007bff';
                                }}
                              >
                                🔗 เปิด
                              </a>
                            )}
                          </td>
                          <td style={{ 
                            padding: '12px',
                            textAlign: 'center'
                          }}>
                            {article.url && (
                              <button
                                onClick={() => copyLink(article.url)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#007bff',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold'
                                }}
                              >
                                📋 คัดลอก
                              </button>
                            )}
                          </td>
                          <td style={{ 
                            padding: '12px',
                            textAlign: 'center'
                          }}>
                            {article.url && (
                              <button
                                onClick={() => postToWordPress(article)}
                                disabled={postingStates[article.articleId] === 'posting' || 
                                         !wpSettings.siteUrl || !wpSettings.username || !wpSettings.appPassword}
                                style={{
                                  backgroundColor: 
                                    postingStates[article.articleId] === 'posting' ? '#ffc107' :
                                    postingStates[article.articleId] === 'success' ? '#28a745' :
                                    postingStates[article.articleId] === 'error' ? '#dc3545' :
                                    (!wpSettings.siteUrl || !wpSettings.username || !wpSettings.appPassword) ? '#6c757d' :
                                    '#6f42c1',
                                  color: 'white',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  cursor: (postingStates[article.articleId] === 'posting' || 
                                          !wpSettings.siteUrl || !wpSettings.username || !wpSettings.appPassword) ? 
                                          'not-allowed' : 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  width: '90px'
                                }}
                              >
                                {postingStates[article.articleId] === 'posting' ? '📤 กำลังโพสต์...' :
                                 postingStates[article.articleId] === 'success' ? '✅ สำเร็จ' :
                                 postingStates[article.articleId] === 'error' ? '❌ ล้มเหลว' :
                                 (!wpSettings.siteUrl || !wpSettings.username || !wpSettings.appPassword) ? '⚙️ ตั้งค่าก่อน' :
                                 '📤 โพสต์เนื้อหา'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: '#e9f4f8',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#555'
                }}>
                  <strong>💡 คำแนะนำ:</strong> 
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    <li>• ตั้งค่า WordPress ก่อนใช้งาน</li>
                    <li>• ทดสอบการเชื่อมต่อเพื่อความมั่นใจ</li>
                    <li>• ปรับ Target Classes ตามเว็บไซต์</li>
                    <li>• บันทึกการตั้งค่าทุกครั้งที่เปลี่ยน</li>
                    <li>• บทความจะถูกเผยแพร่อัตโนมัติทันที</li>
                  </ul>
                </div>
              </>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: '#666'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>📭</div>
                <div>ไม่พบข้อมูลบทความ</div>
              </div>
            )}
          </div>

          {/* Security & Storage Information */}
          <div style={{ 
            marginTop: '25px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#495057', fontSize: '16px' }}>
              🔒 ระบบความปลอดภัยและการจัดเก็บข้อมูล
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '13px' }}>
              <div>
                <div style={{ color: '#28a745', fontWeight: 'bold', marginBottom: '5px' }}>
                  📦 Default Configuration Management
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#6c757d' }}>
                  <li><strong>Set as Default:</strong> บันทึกการตั้งค่าปัจจุบันเป็นค่าเริ่มต้น</li>
                  <li><strong>Reset to Default:</strong> กลับไปใช้ค่าเริ่มต้นที่บันทึกไว้</li>
                  <li><strong>Factory Reset:</strong> กลับไปใช้ค่าเริ่มต้นจากโรงงาน</li>
                </ul>
              </div>
              
              <div>
                <div style={{ color: '#007cba', fontWeight: 'bold', marginBottom: '5px' }}>
                  💾 ระบบจัดเก็บข้อมูล
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#6c757d' }}>
                  <li><strong>IndexedDB:</strong> เก็บการตั้งค่าในเครื่อง</li>
                  <li><strong>ไม่หายเมื่อ Refresh:</strong> ข้อมูลคงอยู่</li>
                  <li><strong>Encryption:</strong> รหัสผ่านถูกเข้ารหัส</li>
                </ul>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: '#e7f3ff', 
              borderRadius: '5px',
              border: '1px solid #b3d7ff'
            }}>
              <div style={{ color: '#0056b3', fontWeight: 'bold', fontSize: '13px' }}>
                🔒 Security Features
              </div>
              <div style={{ fontSize: '12px', color: '#495057', marginTop: '5px' }}>
                <strong>HTTPS Only:</strong> การเชื่อมต่อใช้ HTTPS เท่านั้น • 
                <strong>Local Storage:</strong> การตั้งค่าเก็บใน IndexedDB • 
                <strong>Password Encryption:</strong> Application Password ถูกเข้ารหัส
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 