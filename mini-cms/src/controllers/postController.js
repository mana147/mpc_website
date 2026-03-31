/**
 * Post Controller
 * Xử lý bài viết (public + admin)
 */

const PostModel = require('../models/postModel');
const { slugify, makeUniqueSlug } = require('../utils/slugify');
const fs = require('fs');
const path = require('path');

const PostController = {
  // ============================================
  // PUBLIC ROUTES
  // ============================================

  /**
   * GET /posts - Danh sách bài viết public
   */
  index(req, res) {
    const posts = PostModel.getPublished();
    res.render('web/posts', {
      title: 'Bài viết',
      posts
    });
  },

  /**
   * GET /posts/:slug - Chi tiết bài viết
   */
  show(req, res) {
    const { slug } = req.params;
    const post = PostModel.findBySlug(slug);
    
    if (!post) {
      return res.status(404).render('web/404', { title: 'Không tìm thấy bài viết' });
    }

    res.render('web/post-detail', {
      title: post.title,
      post
    });
  },

  // ============================================
  // ADMIN ROUTES
  // ============================================

  /**
   * GET /admin/posts - Danh sách bài viết admin
   */
  adminIndex(req, res) {
    const posts = PostModel.getAll();
    res.render('admin/post-list', {
      title: 'Quản lý bài viết',
      posts
    });
  },

  /**
   * GET /admin/posts/create - Form tạo bài viết
   */
  create(req, res) {
    res.render('admin/post-create', {
      title: 'Tạo bài viết mới'
    });
  },

  /**
   * POST /admin/posts/create - Xử lý tạo bài viết
   */
  store(req, res) {
    // Kiểm tra lỗi upload
    if (req.uploadError) {
      req.session.error = req.uploadError;
      return res.redirect('/admin/posts/create');
    }

    const { title, excerpt, content, status } = req.body;

    // Validate
    if (!title || !title.trim()) {
      req.session.error = 'Tiêu đề không được để trống';
      return res.redirect('/admin/posts/create');
    }

    // Tạo slug unique
    const baseSlug = slugify(title);
    const slug = makeUniqueSlug(baseSlug, (s) => PostModel.slugExists(s));

    // Thumbnail
    let thumbnail = null;
    if (req.file) {
      thumbnail = '/uploads/images/' + req.file.filename;
    }

    // Lưu database
    try {
      PostModel.create({
        title: title.trim(),
        slug,
        excerpt: excerpt ? excerpt.trim() : '',
        content: content ? content.trim() : '',
        thumbnail,
        status: status || 'draft'
      });

      req.session.success = 'Tạo bài viết thành công';
      return res.redirect('/admin/posts');
    } catch (error) {
      console.error('Create post error:', error);
      req.session.error = 'Có lỗi xảy ra khi tạo bài viết';
      return res.redirect('/admin/posts/create');
    }
  },

  /**
   * GET /admin/posts/:id/edit - Form sửa bài viết
   */
  edit(req, res) {
    const { id } = req.params;
    const post = PostModel.findById(id);

    if (!post) {
      req.session.error = 'Bài viết không tồn tại';
      return res.redirect('/admin/posts');
    }

    res.render('admin/post-edit', {
      title: 'Sửa bài viết',
      post
    });
  },

  /**
   * POST /admin/posts/:id/edit - Xử lý cập nhật bài viết
   */
  update(req, res) {
    const { id } = req.params;
    const post = PostModel.findById(id);

    if (!post) {
      req.session.error = 'Bài viết không tồn tại';
      return res.redirect('/admin/posts');
    }

    // Kiểm tra lỗi upload
    if (req.uploadError) {
      req.session.error = req.uploadError;
      return res.redirect(`/admin/posts/${id}/edit`);
    }

    const { title, excerpt, content, status } = req.body;

    // Validate
    if (!title || !title.trim()) {
      req.session.error = 'Tiêu đề không được để trống';
      return res.redirect(`/admin/posts/${id}/edit`);
    }

    // Tạo slug mới nếu title thay đổi
    let slug = post.slug;
    if (title.trim() !== post.title) {
      const baseSlug = slugify(title);
      slug = makeUniqueSlug(baseSlug, (s) => PostModel.slugExists(s, id));
    }

    // Xử lý thumbnail
    let thumbnail = post.thumbnail;
    if (req.file) {
      // Xóa ảnh cũ nếu có
      if (post.thumbnail) {
        const oldPath = path.join(__dirname, '../../public', post.thumbnail);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      thumbnail = '/uploads/images/' + req.file.filename;
    }

    // Cập nhật database
    try {
      PostModel.update(id, {
        title: title.trim(),
        slug,
        excerpt: excerpt ? excerpt.trim() : '',
        content: content ? content.trim() : '',
        thumbnail,
        status: status || 'draft'
      });

      req.session.success = 'Cập nhật bài viết thành công';
      return res.redirect('/admin/posts');
    } catch (error) {
      console.error('Update post error:', error);
      req.session.error = 'Có lỗi xảy ra khi cập nhật bài viết';
      return res.redirect(`/admin/posts/${id}/edit`);
    }
  },

  /**
   * POST /admin/posts/:id/delete - Xóa bài viết
   */
  destroy(req, res) {
    const { id } = req.params;
    const post = PostModel.findById(id);

    if (!post) {
      req.session.error = 'Bài viết không tồn tại';
      return res.redirect('/admin/posts');
    }

    try {
      // Xóa thumbnail nếu có
      if (post.thumbnail) {
        const imagePath = path.join(__dirname, '../../public', post.thumbnail);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      PostModel.delete(id);
      req.session.success = 'Xóa bài viết thành công';
    } catch (error) {
      console.error('Delete post error:', error);
      req.session.error = 'Có lỗi xảy ra khi xóa bài viết';
    }

    return res.redirect('/admin/posts');
  }
};

module.exports = PostController;
