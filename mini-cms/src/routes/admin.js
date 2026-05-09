/**
 * Admin Routes
 * Các route cho admin panel
 */

const express = require('express');
const router = express.Router();

const { requireAuth, redirectIfAuth } = require('../middlewares/authMiddleware');
const { uploadImage, uploadGallery, uploadPdf } = require('../middlewares/uploadMiddleware');

const AuthController = require('../controllers/authController');
const AdminController = require('../controllers/adminController');
const PostController = require('../controllers/postController');
const DocumentController = require('../controllers/documentController');
const GalleryController = require('../controllers/galleryController');
const ContactController = require('../controllers/contactController');
const MenuController = require('../controllers/menuController');

// Rate limiting cho login — chặn brute force
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.session.error = 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.';
    res.redirect('/admin/login');
  }
});

// ============================================
// AUTH ROUTES (không cần đăng nhập)
// ============================================
router.get('/login', redirectIfAuth, AuthController.showLogin);
router.post('/login', loginLimiter, AuthController.login);
router.post('/logout', AuthController.logout);

// ============================================
// PROTECTED ROUTES (cần đăng nhập)
// ============================================
router.use(requireAuth);

// Dashboard
router.get('/', AdminController.dashboard);

// Posts
router.get('/posts', PostController.adminIndex);
router.get('/posts/create', PostController.create);
router.post('/posts/create', uploadImage, PostController.store);
router.get('/posts/:id/edit', PostController.edit);
router.post('/posts/:id/edit', uploadImage, PostController.update);
router.post('/posts/:id/delete', PostController.destroy);

// Documents
router.get('/documents', DocumentController.adminIndex);
router.get('/documents/create', DocumentController.create);
router.post('/documents/create', uploadPdf, DocumentController.store);
router.post('/documents/:id/delete', DocumentController.destroy);

// Gallery
router.get('/gallery', GalleryController.adminIndex);
router.post('/gallery/upload', uploadGallery, GalleryController.upload);
router.post('/gallery/:id/delete', GalleryController.destroy);

// Contacts
router.get('/contacts', ContactController.adminIndex);
router.get('/contacts/:id', ContactController.adminShow);
router.post('/contacts/:id/delete', ContactController.destroy);

// Menus
router.get('/menus', MenuController.adminIndex);
router.get('/menus/create', MenuController.create);
router.post('/menus/create', MenuController.store);
router.get('/menus/:id/edit', MenuController.edit);
router.post('/menus/:id/edit', MenuController.update);
router.post('/menus/:id/delete', MenuController.destroy);
router.post('/menus/:id/toggle-visibility', MenuController.toggleVisibility);
router.post('/menus/reorder', MenuController.reorder);

module.exports = router;
