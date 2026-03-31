/**
 * Document Controller
 * Xử lý tài liệu PDF (public + admin)
 */

const DocumentModel = require('../models/documentModel');
const fs = require('fs');
const path = require('path');

const DocumentController = {
  // ============================================
  // PUBLIC ROUTES
  // ============================================

  /**
   * GET /documents - Danh sách tài liệu public
   */
  index(req, res) {
    const documents = DocumentModel.getAll();
    res.render('web/documents', {
      title: 'Tài liệu',
      documents
    });
  },

  /**
   * GET /documents/:id/download - Tải tài liệu
   */
  download(req, res) {
    const { id } = req.params;
    const doc = DocumentModel.findById(id);

    if (!doc) {
      return res.status(404).render('web/404', { title: 'Không tìm thấy tài liệu' });
    }

    const filePath = path.join(__dirname, '../../public', doc.filepath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).render('web/404', { title: 'File không tồn tại' });
    }

    res.download(filePath, doc.filename);
  },

  // ============================================
  // ADMIN ROUTES
  // ============================================

  /**
   * GET /admin/documents - Danh sách tài liệu admin
   */
  adminIndex(req, res) {
    const documents = DocumentModel.getAll();
    res.render('admin/document-list', {
      title: 'Quản lý tài liệu',
      documents
    });
  },

  /**
   * GET /admin/documents/create - Form upload tài liệu
   */
  create(req, res) {
    res.render('admin/document-create', {
      title: 'Upload tài liệu mới'
    });
  },

  /**
   * POST /admin/documents/create - Xử lý upload tài liệu
   */
  store(req, res) {
    // Kiểm tra lỗi upload
    if (req.uploadError) {
      req.session.error = req.uploadError;
      return res.redirect('/admin/documents/create');
    }

    if (!req.file) {
      req.session.error = 'Vui lòng chọn file PDF để upload';
      return res.redirect('/admin/documents/create');
    }

    const { title, description } = req.body;

    // Validate
    if (!title || !title.trim()) {
      // Xóa file đã upload nếu validate fail
      fs.unlinkSync(req.file.path);
      req.session.error = 'Tiêu đề không được để trống';
      return res.redirect('/admin/documents/create');
    }

    // Lưu database
    try {
      DocumentModel.create({
        title: title.trim(),
        filename: req.file.originalname,
        filepath: '/uploads/pdfs/' + req.file.filename,
        description: description ? description.trim() : ''
      });

      req.session.success = 'Upload tài liệu thành công';
      return res.redirect('/admin/documents');
    } catch (error) {
      console.error('Create document error:', error);
      req.session.error = 'Có lỗi xảy ra khi upload tài liệu';
      return res.redirect('/admin/documents/create');
    }
  },

  /**
   * POST /admin/documents/:id/delete - Xóa tài liệu
   */
  destroy(req, res) {
    const { id } = req.params;
    const doc = DocumentModel.findById(id);

    if (!doc) {
      req.session.error = 'Tài liệu không tồn tại';
      return res.redirect('/admin/documents');
    }

    try {
      // Xóa file vật lý
      const filePath = path.join(__dirname, '../../public', doc.filepath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      DocumentModel.delete(id);
      req.session.success = 'Xóa tài liệu thành công';
    } catch (error) {
      console.error('Delete document error:', error);
      req.session.error = 'Có lỗi xảy ra khi xóa tài liệu';
    }

    return res.redirect('/admin/documents');
  }
};

module.exports = DocumentController;
