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
    
    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      console.log('IndexedDB opened successfully');
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      console.log('IndexedDB upgrade needed');
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
        console.log('Created settings store');
      }
      if (!db.objectStoreNames.contains(DEFAULT_STORE)) {
        db.createObjectStore(DEFAULT_STORE, { keyPath: 'id' });
        console.log('Created defaults store');
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
    cssSelectors: '.content,.article-content,.post-content,.entry-content',
    ithySessionCookie: ''
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
  try {
    const key = 'ithyScraper2024Key';
    const encrypted = btoa(JSON.stringify(data) + key);
    console.log('🔐 Encrypted data successfully');
    return encrypted;
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw error;
  }
};

const decryptData = (encryptedData) => {
  try {
    const key = 'ithyScraper2024Key';
    const decrypted = atob(encryptedData);
    const jsonString = decrypted.replace(key, '');
    const data = JSON.parse(jsonString);
    console.log('🔓 Decrypted data successfully');
    return data;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    return null;
  }
};

const saveSettings = async (settings) => {
  try {
    console.log('💾 Starting to save settings to IndexedDB...');
    console.log('📦 Settings to save:', settings);
    
    const db = await openDB();
    const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    const encryptedSettings = encryptData(settings);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ 
        id: 'main', 
        data: encryptedSettings, 
        timestamp: new Date().toISOString() 
      });
      
      request.onsuccess = () => {
        console.log('✅ Settings saved successfully to IndexedDB');
        resolve();
      };
      
      request.onerror = () => {
        console.error('❌ Failed to save settings:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ SaveSettings error:', error);
    throw error;
  }
};

const loadSettings = async () => {
  try {
    console.log('📂 Starting to load settings from IndexedDB...');
    
    const db = await openDB();
    const transaction = db.transaction([SETTINGS_STORE], 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get('main');
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          console.log('📦 Found settings in IndexedDB:', result);
          const decryptedData = decryptData(result.data);
          if (decryptedData) {
            console.log('✅ Settings loaded and decrypted successfully');
            resolve(decryptedData);
          } else {
            console.log('⚠️ Failed to decrypt settings, using defaults');
            resolve(null);
          }
        } else {
          console.log('📭 No settings found in IndexedDB');
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('❌ Failed to load settings:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ LoadSettings error:', error);
    return null;
  }
};

// บันทึกเป็น Default
const saveAsDefault = async (settings) => {
  try {
    console.log('⭐ Saving as default settings...');
    
    const db = await openDB();
    const transaction = db.transaction([DEFAULT_STORE], 'readwrite');
    const store = transaction.objectStore(DEFAULT_STORE);
    const encryptedSettings = encryptData(settings);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ 
        id: 'user_defaults', 
        data: encryptedSettings, 
        timestamp: new Date().toISOString() 
      });
      
      request.onsuccess = () => {
        console.log('✅ Default settings saved successfully');
        resolve();
      };
      
      request.onerror = () => {
        console.error('❌ Failed to save default settings:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ SaveAsDefault error:', error);
    throw error;
  }
};

// ฟังก์ชันตรวจสอบสถานะ IndexedDB
const checkIndexedDBStatus = async () => {
  try {
    if (!window.indexedDB) {
      return { status: 'unsupported', message: 'IndexedDB ไม่รองรับในเบราว์เซอร์นี้' };
    }
    
    const db = await openDB();
    const transaction = db.transaction([SETTINGS_STORE], 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    const result = await store.get('main');
    
    return {
      status: 'working',
      message: 'IndexedDB ทำงานปกติ',
      hasData: !!result,
      storageSize: await getStorageSize()
    };
  } catch (error) {
    return { status: 'error', message: `เกิดข้อผิดพลาด: ${error.message}` };
  }
};

// ฟังก์ชันตรวจสอบขนาดข้อมูลที่เก็บ
const getStorageSize = async () => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: (estimate.usage / 1024 / 1024).toFixed(2) + ' MB',
        quota: (estimate.quota / 1024 / 1024 / 1024).toFixed(2) + ' GB'
      };
    }
    return { used: 'N/A', quota: 'N/A' };
  } catch (error) {
    return { used: 'Error', quota: 'Error' };
  }
};

// โหลด Default ที่บันทึกไว้
const loadUserDefaults = async () => {
  try {
    console.log('📂 Loading user default settings...');
    
    const db = await openDB();
    const transaction = db.transaction([DEFAULT_STORE], 'readonly');
    const store = transaction.objectStore(DEFAULT_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get('user_defaults');
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          console.log('📦 Found user defaults in IndexedDB');
          const decryptedData = decryptData(result.data);
          if (decryptedData) {
            console.log('✅ User defaults loaded successfully');
            resolve(decryptedData);
          } else {
            console.log('⚠️ Failed to decrypt user defaults');
            resolve(null);
          }
        } else {
          console.log('📭 No user defaults found');
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('❌ Failed to load user defaults:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ LoadUserDefaults error:', error);
    return null;
  }
};

// ลบ User Defaults
const clearUserDefaults = async () => {
  try {
    console.log('🗑️ Clearing user defaults...');
    
    const db = await openDB();
    const transaction = db.transaction([DEFAULT_STORE], 'readwrite');
    const store = transaction.objectStore(DEFAULT_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.delete('user_defaults');
      
      request.onsuccess = () => {
        console.log('✅ User defaults cleared successfully');
        resolve();
      };
      
      request.onerror = () => {
        console.error('❌ Failed to clear user defaults:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ ClearUserDefaults error:', error);
    throw error;
  }
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
    cssSelectors: '.content,.article-content,.post-content,.entry-content',
    ithySessionCookie: ''
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
  const [dbStatus, setDbStatus] = useState(null);
  const [storageInfo, setStorageInfo] = useState({ used: 'N/A', quota: 'N/A' });

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // สร้าง URL พร้อม session cookie ถ้ามี
      let apiUrl = '/api/articles';
      if (scrapingSettings.ithySessionCookie) {
        const params = new URLSearchParams({
          sessionCookie: scrapingSettings.ithySessionCookie
        });
        apiUrl = `/api/articles?${params.toString()}`;
      }
      
      const response = await fetch(apiUrl);
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
        console.log('🔄 เริ่มโหลดการตั้งค่าจาก IndexedDB...');
        
        // ตรวจสอบสถานะ IndexedDB
        const dbStatusResult = await checkIndexedDBStatus();
        setDbStatus(dbStatusResult);
        setStorageInfo(dbStatusResult.storageSize || { used: 'N/A', quota: 'N/A' });
        
        console.log('🔍 สถานะ IndexedDB:', dbStatusResult);
        
        // โหลดการตั้งค่า
        const settings = await loadSettings();
        console.log('📦 ข้อมูลที่โหลดมา:', settings);
        
        if (settings) {
          // ตั้งค่า WordPress
          if (settings.wordpress) {
            setWpSettings(prev => ({
              ...prev,
              ...settings.wordpress
            }));
            console.log('✅ โหลด WordPress settings สำเร็จ:', settings.wordpress);
          }
          
          // ตั้งค่า Scraping
          if (settings.scraping) {
            setScrapingSettings(prev => ({
              ...prev,
              ...settings.scraping
            }));
            console.log('✅ โหลด Scraping settings สำเร็จ:', settings.scraping);
          }
          
          // ตั้งค่า Processing
          if (settings.processing) {
            setProcessingSettings(prev => ({
              ...prev,
              ...settings.processing
            }));
            console.log('✅ โหลด Processing settings สำเร็จ:', settings.processing);
          }
          
          console.log('✅ โหลดการตั้งค่าสำเร็จทั้งหมด!');
        } else {
          console.log('⚠️ ไม่พบการตั้งค่าที่บันทึกไว้ ใช้ค่าเริ่มต้นจากโรงงาน');
          // ถ้าไม่มีการตั้งค่า ใช้ค่า factory defaults
          setWpSettings(FACTORY_DEFAULTS.wordpress);
          setScrapingSettings(FACTORY_DEFAULTS.scraping);
          setProcessingSettings(FACTORY_DEFAULTS.processing);
        }
      } catch (error) {
        console.error('❌ ไม่สามารถโหลดการตั้งค่าได้:', error);
        setDbStatus({ status: 'error', message: `เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}` });
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

  // Auto-save เมื่อมีการเปลี่ยนแปลงการตั้งค่า (หลังจากโหลดเสร็จแล้ว)
  useEffect(() => {
    // ตรวจสอบว่าได้โหลดข้อมูลเสร็จแล้วหรือไม่
    const isDataLoaded = dbStatus && (dbStatus.status === 'working' || dbStatus.status === 'error');
    
    // ตรวจสอบว่ามีการเปลี่ยนแปลงจริงหรือไม่ (ไม่ใช่ค่าเริ่มต้นเปล่า)
    const hasRealData = wpSettings.siteUrl || 
                       wpSettings.username || 
                       wpSettings.appPassword ||
                       scrapingSettings.targetClasses !== FACTORY_DEFAULTS.scraping.targetClasses;
    
    console.log('🔍 Auto-save check:', {
      isDataLoaded,
      hasRealData,
      dbStatus: dbStatus?.status,
      wpSettings,
      scrapingSettings
    });
    
    if (isDataLoaded && hasRealData) {
      console.log('🔄 Auto-save: การตั้งค่ามีการเปลี่ยนแปลง');
      
      const autoSave = async () => {
        try {
          const allSettings = {
            wordpress: wpSettings,
            scraping: scrapingSettings,
            processing: processingSettings
          };
          
          console.log('💾 Auto-save: กำลังบันทึก...', allSettings);
          await saveSettings(allSettings);
          console.log('✅ Auto-save สำเร็จ');
          
          // อัพเดทสถานะ DB
          const newDbStatus = await checkIndexedDBStatus();
          setDbStatus(newDbStatus);
          setStorageInfo(newDbStatus.storageSize || { used: 'N/A', quota: 'N/A' });
          
        } catch (error) {
          console.error('❌ Auto-save ล้มเหลว:', error);
        }
      };
      
      // Debounce auto-save 1 วินาที
      const timeoutId = setTimeout(autoSave, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [wpSettings, scrapingSettings, processingSettings, dbStatus]);

  // Save all settings
  const saveAllSettings = async () => {
    try {
      console.log('🔄 เริ่มบันทึกการตั้งค่าแบบแมนนวล...');
      
      const allSettings = {
        wordpress: wpSettings,
        scraping: scrapingSettings,
        processing: processingSettings
      };
      
      console.log('📦 ข้อมูลที่จะบันทึก:', allSettings);
      
      // บันทึกการตั้งค่า
      await saveSettings(allSettings);
      
      // ตรวจสอบสถานะ IndexedDB หลังบันทึก
      const dbStatusResult = await checkIndexedDBStatus();
      setDbStatus(dbStatusResult);
      setStorageInfo(dbStatusResult.storageSize || { used: 'N/A', quota: 'N/A' });
      
      // ทดสอบการโหลดกลับมาเพื่อยืนยัน
      const verifySettings = await loadSettings();
      console.log('🔍 ยืนยันข้อมูลที่บันทึก:', verifySettings);
      
      console.log('✅ บันทึกการตั้งค่าสำเร็จ!');
      setCopyStatus('✅ บันทึกการตั้งค่าสำเร็จ!');
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (error) {
      console.error('❌ ไม่สามารถบันทึกการตั้งค่าได้:', error);
      setCopyStatus(`❌ ไม่สามารถบันทึกการตั้งค่าได้: ${error.message}`);
      setTimeout(() => setCopyStatus(''), 5000);
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
      
      // เตรียมการตั้งค่า scraping พร้อม session cookie
      const scrapingConfigWithCookie = {
        ...scrapingSettings,
        sessionCookie: scrapingSettings.ithySessionCookie
      };
      
      const response = await fetch('/api/wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleUrl: article.url,
          wpConfig: wpSettings,
          scrapingConfig: scrapingConfigWithCookie,
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
    
    // ตัดข้อความหลัง '-' ออก
    const titleBeforeDash = title.split(' - ')[0] || title.split(' – ')[0] || title.split('-')[0];
    const cleanTitle = titleBeforeDash.trim();
    
    return cleanTitle.length > maxLength ? cleanTitle.substring(0, maxLength) + '...' : cleanTitle;
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
        console.log('🏭 เริ่มรีเซ็ตเป็นค่าเริ่มต้นจากโรงงาน...');
        
        const db = await openDB();
        const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);
        await store.delete('main');
        
        // Reset states to factory defaults
        setWpSettings(FACTORY_DEFAULTS.wordpress);
        setScrapingSettings(FACTORY_DEFAULTS.scraping);
        setProcessingSettings(FACTORY_DEFAULTS.processing);
        
        // ตรวจสอบสถานะ IndexedDB หลังรีเซ็ต
        const dbStatusResult = await checkIndexedDBStatus();
        setDbStatus(dbStatusResult);
        setStorageInfo(dbStatusResult.storageSize || { used: 'N/A', quota: 'N/A' });
        
        console.log('✅ รีเซ็ตเป็นค่าเริ่มต้นจากโรงงานสำเร็จ!');
        setCopyStatus('🏭 รีเซ็ตเป็นค่าเริ่มต้นจากโรงงานแล้ว!');
        setTimeout(() => setCopyStatus(''), 3000);
      } catch (error) {
        console.error('❌ ไม่สามารถรีเซ็ตการตั้งค่าได้:', error);
        setCopyStatus(`❌ ไม่สามารถรีเซ็ตการตั้งค่าได้: ${error.message}`);
        setTimeout(() => setCopyStatus(''), 3000);
      }
    }
  };

  // Set as Default
  const setAsDefault = async () => {
    if (confirm('คุณต้องการบันทึกการตั้งค่าปัจจุบันเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      try {
        console.log('⭐ เริ่มบันทึกเป็นค่าเริ่มต้น...');
        
        const currentSettings = {
          wordpress: wpSettings,
          scraping: scrapingSettings,
          processing: processingSettings
        };
        
        console.log('📦 ข้อมูลที่จะบันทึกเป็นค่าเริ่มต้น:', currentSettings);
        
        // บันทึกทั้งเป็นการตั้งค่าปัจจุบันและเป็นค่าเริ่มต้น
        await saveAsDefault(currentSettings);
        await saveSettings(currentSettings);
        
        // ตรวจสอบสถานะ IndexedDB หลังบันทึก
        const dbStatusResult = await checkIndexedDBStatus();
        setDbStatus(dbStatusResult);
        setStorageInfo(dbStatusResult.storageSize || { used: 'N/A', quota: 'N/A' });
        
        console.log('✅ บันทึกเป็นค่าเริ่มต้นสำเร็จ!');
        setCopyStatus('⭐ บันทึกเป็นค่าเริ่มต้นแล้ว!');
        setTimeout(() => setCopyStatus(''), 3000);
      } catch (error) {
        console.error('❌ ไม่สามารถบันทึกเป็นค่าเริ่มต้นได้:', error);
        setCopyStatus(`❌ ไม่สามารถบันทึกเป็นค่าเริ่มต้นได้: ${error.message}`);
        setTimeout(() => setCopyStatus(''), 3000);
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

  // ฟังก์ชันทดสอบการโหลดข้อมูล
  const testLoadSettings = async () => {
    try {
      console.log('🧪 ทดสอบการโหลดข้อมูล...');
      setCopyStatus('🧪 กำลังทดสอบการโหลดข้อมูล...');
      
      const settings = await loadSettings();
      const dbStatus = await checkIndexedDBStatus();
      
      console.log('📊 ผลการทดสอบ:');
      console.log('- ข้อมูลที่โหลดมา:', settings);
      console.log('- สถานะ IndexedDB:', dbStatus);
      console.log('- WordPress settings ปัจจุบัน:', wpSettings);
      console.log('- Scraping settings ปัจจุบัน:', scrapingSettings);
      console.log('- Processing settings ปัจจุบัน:', processingSettings);
      
      if (settings) {
        setCopyStatus(`✅ พบข้อมูล: WordPress(${settings.wordpress ? '✓' : '✗'}), Scraping(${settings.scraping ? '✓' : '✗'}), Processing(${settings.processing ? '✓' : '✗'})`);
      } else {
        setCopyStatus('⚠️ ไม่พบข้อมูลที่บันทึกไว้');
      }
      
      setTimeout(() => setCopyStatus(''), 5000);
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการทดสอบ:', error);
      setCopyStatus(`❌ ข้อผิดพลาดในการทดสอบ: ${error.message}`);
      setTimeout(() => setCopyStatus(''), 5000);
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
          maxWidth: '1300px', 
          margin: '0 auto', 
        }}>
          {/* Header */}
          <div style={{ 
            background: 'transparent',
            borderRadius: '10px',
            marginBottom: '20px',
          }}>
            <h1 style={{ 
              color: '#333',
              margin: '0 0 10px 0',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              📊 Data Scraper & WordPress Publisher
            </h1>
            <p style={{ 
              color: '#666',
              margin: '0 0 20px 0',
              fontSize: '16px'
            }}>
              ระบบดึงข้อมูลบทความจากเว็บ AI Deep Researchสร้างบทความ และโพสต์ไปยัง WordPress อัตโนมัติ
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
                  width: '90%',
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
                        ITHY Session Cookie:
                      </label>
                      <input
                        type="password"
                        placeholder="gAAAAAB... (Session cookie จาก ithy.com)"
                        value={scrapingSettings.ithySessionCookie}
                        onChange={(e) => setScrapingSettings(prev => ({ ...prev, ithySessionCookie: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      />
                      <small style={{ color: '#666', fontSize: '11px' }}>
                        คุกกี้สำหรับเข้าถึง ithy.com (ตรวจสอบได้จาก Developer Tools → Application → Cookies)
                      </small>
                    </div>
                    
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
                  <button
                    onClick={testLoadSettings}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#fd7e14',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🧪 ทดสอบการโหลด
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
                
                {/* Table Container with Better Responsive */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ 
                    overflowX: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    backgroundColor: 'white'
                  }}>
                    <style jsx>{`
                      .responsive-table {
                        width: 100%;
                        border-collapse: collapse;
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                      }
                      
                      .responsive-table thead {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      }
                      
                      .responsive-table th {
                        padding: 16px 12px;
                        text-align: center;
                        font-weight: 700;
                        color: white;
                        font-size: 14px;
                        border-bottom: 3px solid #5a67d8;
                        position: relative;
                      }
                      
                      .responsive-table th:nth-child(1) { width: 30px; min-width: 30px; }
                      .responsive-table th:nth-child(2) { width: 21%; min-width: 200px; text-align: left; }
                      .responsive-table th:nth-child(3) { width: 12%; min-width: 120px; }
                      .responsive-table th:nth-child(4) { width: 12%; min-width: 120px; }
                      .responsive-table th:nth-child(5) { width: 80px; min-width: 80px; }
                      .responsive-table th:nth-child(6) { width: 90px; min-width: 90px; }
                      .responsive-table th:nth-child(7) { width: 130px; min-width: 130px; }
                      
                      .responsive-table tbody tr {
                        transition: all 0.3s ease;
                        border-bottom: 1px solid #e2e8f0;
                      }
                      
                      .responsive-table tbody tr:nth-child(even) {
                        background-color: #f8fafc;
                      }
                      
                      .responsive-table tbody tr:hover {
                        background-color: #e6fffa !important;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                      }
                      
                      .responsive-table td {
                        padding: 16px 12px;
                        color: #374151;
                        font-size: 14px;
                        text-align: center;
                        vertical-align: middle;
                      }
                      
                      .responsive-table td:nth-child(2) {
                        text-align: left;
                        font-weight: 500;
                        color: #1f2937;
                      }
                      
                      .number-badge {
                        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                        color: white;
                        border-radius: 50%;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto;
                        font-size: 12px;
                        font-weight: bold;
                        box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
                      }
                      
                      .title-cell {
                        overflow: hidden;
                        text-overflow: ellipsis;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        line-height: 1.4;
                        max-height: 2.8em;
                      }
                      
                      .date-badge {
                        background: #f3f4f6;
                        color: #374151;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 600;
                        white-space: nowrap;
                        border: 1px solid #e5e7eb;
                      }
                      
                      .id-badge {
                        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                        color: #1e40af;
                        padding: 6px 10px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: bold;
                        font-family: 'Monaco', 'Consolas', monospace;
                        border: 1px solid #93c5fd;
                      }
                      
                      .action-btn {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-decoration: none;
                        display: inline-block;
                        min-width: 70px;
                        text-align: center;
                      }
                      
                      .action-btn:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                      }
                      
                      .link-btn {
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                      }
                      
                      .copy-btn {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                      }
                      
                      .wp-btn {
                        color: white;
                        min-width: 110px;
                        font-size: 11px;
                      }
                      
                      .wp-btn.posting { background: #f59e0b; opacity: 0.8; cursor: not-allowed; }
                      .wp-btn.success { background: #10b981; }
                      .wp-btn.error { background: #ef4444; }
                      .wp-btn.disabled { background: #9ca3af; opacity: 0.6; cursor: not-allowed; }
                      .wp-btn.ready { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
                      
                      @media (max-width: 1024px) {
                        .responsive-table th,
                        .responsive-table td {
                          padding: 12px 8px;
                          font-size: 13px;
                        }
                        .responsive-table th:nth-child(2) { min-width: 180px; }
                        .action-btn { padding: 6px 12px; font-size: 11px; }
                      }
                      
                      @media (max-width: 768px) {
                        .responsive-table th,
                        .responsive-table td {
                          padding: 10px 6px;
                          font-size: 12px;
                        }
                        .responsive-table th:nth-child(2) { min-width: 150px; }
                        .number-badge { width: 24px; height: 24px; font-size: 10px; }
                        .action-btn { padding: 5px 8px; font-size: 10px; min-width: 60px; }
                        .date-badge { padding: 4px 8px; font-size: 10px; }
                        .id-badge { padding: 4px 6px; font-size: 9px; }
                      }
                      
                      @media (max-width: 480px) {
                        .responsive-table {
                          font-size: 11px;
                        }
                        .responsive-table th,
                        .responsive-table td {
                          padding: 8px 4px;
                        }
                        .responsive-table th:nth-child(2) { min-width: 120px; }
                        .action-btn { padding: 4px 6px; font-size: 9px; min-width: 50px; }
                        .wp-btn { min-width: 80px; }
                      }
                    `}</style>
                    <table className="responsive-table">
                      <thead>
                        <tr>
                          <th>🔢</th>
                          <th>📝 หัวข้อบทความ</th>
                          <th>📅 วันที่สร้าง</th>
                          <th>🆔 Article ID</th>
                          <th>🔗 ลิงก์</th>
                          <th>📋 คัดลอกลิงค์</th>
                          <th>📤 WordPress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredArticles.map((article, index) => (
                          <tr key={article.articleId}>
                            <td>
                              <div className="number-badge">
                                {index + 1}
                              </div>
                            </td>
                            <td>
                              <div className="title-cell">
                                {truncateTitle(article.title, 100)}
                              </div>
                            </td>
                            <td>
                              <div className="date-badge">
                                {article.date}
                              </div>
                            </td>
                            <td>
                              <div className="id-badge">
                                {article.articleId.substring(0, 12)}
                              </div>
                            </td>
                            <td>
                              {article.url && (
                                <a 
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="action-btn link-btn"
                                >
                                  🔗 เปิด
                                </a>
                              )}
                            </td>
                            <td>
                              {article.url && (
                                <button
                                  onClick={() => copyLink(article.url)}
                                  className="action-btn copy-btn"
                                >
                                  📋 คัดลอก
                                </button>
                              )}
                            </td>
                            <td>
                              {article.url && (
                                <button
                                  onClick={() => postToWordPress(article)}
                                  disabled={postingStates[article.articleId] === 'posting' || 
                                           !wpSettings.siteUrl || !wpSettings.username || !wpSettings.appPassword}
                                  className={`action-btn wp-btn ${
                                    postingStates[article.articleId] === 'posting' ? 'posting' :
                                    postingStates[article.articleId] === 'success' ? 'success' :
                                    postingStates[article.articleId] === 'error' ? 'error' :
                                    (!wpSettings.siteUrl || !wpSettings.username || !wpSettings.appPassword) ? 'disabled' :
                                    'ready'
                                  }`}
                                >
                                  {postingStates[article.articleId] === 'posting' ? '⏳ กำลังโพสต์...' :
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
                  <ul>
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
                  <li><strong>IndexedDB:</strong> เก็บการตั้งค่าในเครื่องของผู้ใช้</li>
                  <li><strong>ไม่หายเมื่อ Refresh:</strong> ข้อมูลคงอยู่หลังรีเฟรชหน้า</li>
                  <li><strong>Encryption:</strong> รหัสผ่านถูกเข้ารหัส Base64 + Key</li>
                  <li><strong>Auto Save:</strong> บันทึกอัตโนมัติเมื่อมีการเปลี่ยนแปลง</li>
                  <li><strong>Version Control:</strong> มีระบบการจัดการเวอร์ชัน</li>
                </ul>
              </div>
            </div>
            
            {/* IndexedDB Status Display */}
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: dbStatus?.status === 'working' ? '#d4edda' : dbStatus?.status === 'error' ? '#f8d7da' : '#fff3cd', 
              borderRadius: '5px',
              border: `1px solid ${dbStatus?.status === 'working' ? '#c3e6cb' : dbStatus?.status === 'error' ? '#f5c6cb' : '#ffeaa7'}`
            }}>
              <div style={{ color: dbStatus?.status === 'working' ? '#155724' : dbStatus?.status === 'error' ? '#721c24' : '#856404', fontWeight: 'bold', fontSize: '13px' }}>
                {dbStatus?.status === 'working' ? '✅' : dbStatus?.status === 'error' ? '❌' : '⚠️'} สถานะ IndexedDB
              </div>
              <div style={{ fontSize: '12px', color: '#495057', marginTop: '5px' }}>
                <strong>สถานะ:</strong> {dbStatus?.message || 'กำลังตรวจสอบ...'} • 
                <strong>มีข้อมูล:</strong> {dbStatus?.hasData ? 'ใช่' : 'ไม่'} • 
                <strong>พื้นที่ใช้:</strong> {storageInfo.used} • 
                <strong>พื้นที่ทั้งหมด:</strong> {storageInfo.quota}
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
                🔒 Security Features & Cookie Guide
              </div>
              <div style={{ fontSize: '12px', color: '#495057', marginTop: '5px' }}>
                <strong>HTTP/HTTPS Compatible:</strong> รองรับการเชื่อมต่อทั้ง HTTP และ HTTPS • 
                <strong>Local Storage:</strong> การตั้งค่าเก็บใน IndexedDB • 
                <strong>Password Encryption:</strong> Application Password ถูกเข้ารหัส Base64
              </div>
              <div style={{ fontSize: '11px', color: '#0056b3', marginTop: '8px', lineHeight: '1.4' }}>
                <strong>🔍 วิธีหา ITHY Session Cookie:</strong><br/>
                1. เปิด ithy.com และเข้าสู่ระบบ<br/>
                2. กด F12 เพื่อเปิด Developer Tools<br/>
                3. ไปที่แท็บ Application → Storage → Cookies → https://ithy.com<br/>
                4. หาคุกกี้ชื่อ "session" และคัดลอกค่าที่ขึ้นต้นด้วย "gAAAAAB..."<br/>
                5. วางใส่ในช่อง ITHY Session Cookie ด้านบน
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 