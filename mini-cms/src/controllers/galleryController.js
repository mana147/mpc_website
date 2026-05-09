/**
 * Gallery Controller
 * Xử lý thư viện hình ảnh (public + admin)
 */

const GalleryModel = require('../models/galleryModel');
const { safeUnlink } = require('../utils/safeFilePath');

const GalleryController = {
  // ============================================
  // PUBLIC ROUTES
  // ============================================

  /**
   * GET /gallery - Trang thư viện hình ảnh public
   */
  index(req, res) {
    const images = GalleryModel.getAll();
    res.render('web/gallery', {
      title: 'Thư viện hình ảnh',
      images
    });
  },

  // ============================================
  // ADMIN ROUTES
  // ============================================

  /**
   * GET /admin/gallery - Quản lý thư viện ảnh
   */
  adminIndex(req, res) {
    const images = GalleryModel.getAll();
    const totalImages = GalleryModel.count();
    res.render('admin/gallery', {
      title: 'Quản lý thư viện ảnh',
      images,
      totalImages
    });
  },

  /**
   * POST /admin/gallery/upload - Upload nhiều ảnh
   */
  upload(req, res) {
    // Kiểm tra lỗi upload
    if (req.uploadError) {
      req.session.error = req.uploadError;
      return res.redirect('/admin/gallery');
    }

    if (!req.files || req.files.length === 0) {
      req.session.error = 'Vui lòng chọn ít nhất 1 ảnh để upload';
      return res.redirect('/admin/gallery');
    }

    try {
      // Chuẩn bị data cho nhiều ảnh
      const images = req.files.map(file => ({
        filename: file.originalname,
        filepath: '/uploads/images/' + file.filename,
        alt_text: ''
      }));

      // Lưu vào database
      GalleryModel.createMany(images);

      req.session.success = `Đã upload thành công ${images.length} ảnh`;
      return res.redirect('/admin/gallery');
    } catch (error) {
      console.error('Upload gallery error:', error);
      req.session.error = 'Có lỗi xảy ra khi upload ảnh';
      return res.redirect('/admin/gallery');
    }
  },

  /**
   * POST /admin/gallery/:id/delete - Xóa ảnh
   */
  destroy(req, res) {
    const { id } = req.params;
    const image = GalleryModel.findById(id);

    if (!image) {
      req.session.error = 'Ảnh không tồn tại';
      return res.redirect('/admin/gallery');
    }

    try {
      safeUnlink(image.filepath);
      GalleryModel.delete(id);
      req.session.success = 'Đã xóa ảnh thành công';
    } catch (error) {
      console.error('Delete gallery image error:', error);
      req.session.error = 'Có lỗi xảy ra khi xóa ảnh';
    }

    return res.redirect('/admin/gallery');
  }
};

module.exports = GalleryController;
