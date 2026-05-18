/**
 * Web Routes
 * Các route public cho website
 */

const express = require('express');
const router = express.Router();

const PostController = require('../controllers/postController');
const DocumentController = require('../controllers/documentController');
const GalleryController = require('../controllers/galleryController');
const ContactController = require('../controllers/contactController');
const MenuController = require('../controllers/menuController');
const PostModel = require('../models/postModel');
const DocumentModel = require('../models/documentModel');
const GalleryModel = require('../models/galleryModel');

// Trang chủ
router.get('/', (req, res) => {
  const latestPosts = PostModel.getLatest(9);
  const latestDocuments = DocumentModel.getLatest(5);
  const galleryImages = GalleryModel.getAll().slice(0, 6);

  res.render('web/home', {
    title: 'Trang chủ',
    posts: latestPosts,
    documents: latestDocuments,
    galleryImages: galleryImages,
    currentPath: '/',
    pageCss: '/css/pages/landing.css',
    pageJs: '/js/landing.js'
  });
});

// Bài viết
router.get('/posts', PostController.index);
router.get('/posts/:slug', PostController.show);

// Tài liệu
router.get('/documents', DocumentController.index);
router.get('/documents/:id/download', DocumentController.download);

// Thư viện ảnh
router.get('/gallery', GalleryController.index);

// Liên hệ
router.get('/contact', ContactController.index);
router.post('/contact', ContactController.submit);

// About MPC
router.get('/about', (req, res) => {
  const pageTitle = res.locals.lang === 'en' ? 'About MPC' : 'Về MPC';

  res.render('web/about', {
    title: pageTitle,
    currentPath: '/about',
    pageCss: '/css/pages/about.css',
    pageJs: '/js/landing.js'
  });
});

// Menu page (single_post hoặc custom)
router.get('/menu/:slug', MenuController.showMenuPage);

module.exports = router;
