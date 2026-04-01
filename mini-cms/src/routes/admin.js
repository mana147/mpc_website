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

// ============================================
// AUTH ROUTES (không cần đăng nhập)
// ============================================
router.get('/login', redirectIfAuth, AuthController.showLogin);
router.post('/login', AuthController.login);
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

module.exports = router;
