/**
 * Language Middleware
 * Xử lý đa ngôn ngữ (i18n)
 */

const fs = require('fs');
const path = require('path');

// Load translations
const locales = {};
const localesDir = path.join(__dirname, '../locales');

// Load tất cả file translation
['vi', 'en'].forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    locales[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
});

/**
 * Middleware đọc và set ngôn ngữ
 */
function languageMiddleware(req, res, next) {
  // Lấy ngôn ngữ từ session, mặc định là 'vi'
  const lang = req.session.lang || 'vi';
  
  // Gán vào res.locals để dùng trong views
  res.locals.lang = lang;
  res.locals.t = locales[lang] || locales['vi'];
  
  // Helper function để lấy translation theo key path
  res.locals.__ = (key) => {
    const keys = key.split('.');
    let value = locales[lang] || locales['vi'];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return key; // Fallback to key if not found
      }
    }
    
    return value;
  };
  
  next();
}

/**
 * Lấy danh sách ngôn ngữ hỗ trợ
 */
function getSupportedLanguages() {
  return [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];
}

module.exports = {
  languageMiddleware,
  getSupportedLanguages,
  locales
};
