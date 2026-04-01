/**
 * Language Routes
 * Route chuyển đổi ngôn ngữ
 */

const express = require('express');
const router = express.Router();

/**
 * GET /lang/:lang - Chuyển đổi ngôn ngữ
 */
router.get('/:lang', (req, res) => {
  const { lang } = req.params;
  const supportedLangs = ['vi', 'en'];
  
  // Kiểm tra ngôn ngữ hợp lệ
  if (supportedLangs.includes(lang)) {
    req.session.lang = lang;
  }
  
  // Redirect về trang trước đó hoặc trang chủ
  const referer = req.get('Referer') || '/';
  res.redirect(referer);
});

module.exports = router;
