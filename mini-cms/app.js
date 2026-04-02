/**
 * Mini CMS - Entry Point
 * Simple CMS for small business website
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

// Import database và init
const { initDatabase } = require('./src/config/db');

// Import routes
const webRoutes = require('./src/routes/web');
const adminRoutes = require('./src/routes/admin');
const authRoutes = require('./src/routes/auth');
const languageRoutes = require('./src/routes/language');

// Import middleware
const { languageMiddleware } = require('./src/middlewares/languageMiddleware');
const { loadMenus } = require('./src/middlewares/menuMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Parse body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Truyền user session vào tất cả views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  // Clear flash messages
  delete req.session.success;
  delete req.session.error;
  next();
});

// Language middleware - phải đặt sau session
app.use(languageMiddleware);

// Menu middleware - load visible menus cho public pages
app.use(loadMenus);

// ============================================
// ROUTES
// ============================================

app.use('/lang', languageRoutes);
app.use('/', webRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('web/404', { title: 'Không tìm thấy trang' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('web/error', { 
    title: 'Lỗi hệ thống',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Đã xảy ra lỗi'
  });
});

// ============================================
// START SERVER
// ============================================

// Init database trước khi start server
initDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Mini CMS đang chạy tại http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
});
