/**
 * Auth Routes
 * Route xác thực (redirect từ /auth)
 */

const express = require('express');
const router = express.Router();

// Redirect tất cả auth routes về /admin
router.get('/login', (req, res) => res.redirect('/admin/login'));
router.get('/logout', (req, res) => res.redirect('/admin/logout'));

module.exports = router;
