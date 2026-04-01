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
const PostModel = require('../models/postModel');
const DocumentModel = require('../models/documentModel');

// Trang chủ
router.get('/', (req, res) => {
  const latestPosts = PostModel.getLatest(6);
  const latestDocuments = DocumentModel.getLatest(5);
  
  res.render('web/home', {
    title: 'Trang chủ',
    posts: latestPosts,
    documents: latestDocuments
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

module.exports = router;
