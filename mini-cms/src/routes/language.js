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
  
  // Redirect về trang trước đó (chỉ same-origin) hoặc trang chủ
  const referer = req.get('Referer');
  let redirectTo = '/';
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === req.get('Host')) {
        redirectTo = refererUrl.pathname + refererUrl.search;
      }
    } catch (e) {
      // URL không hợp lệ, redirect về trang chủ
    }
  }
  res.redirect(redirectTo);
});

module.exports = router;
