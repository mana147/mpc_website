/**
 * Menu Controller
 * Xử lý quản lý menu (admin + public)
 */

const MenuModel = require('../models/menuModel');
const MenuPostModel = require('../models/menuPostModel');
const PostModel = require('../models/postModel');
const { slugify } = require('../utils/slugify');

const MenuController = {
  // ============================================
  // ADMIN ROUTES
  // ============================================

  /**
   * GET /admin/menus - Danh sách menu
   */
  adminIndex(req, res) {
    const menus = MenuModel.getAll();
    res.render('admin/menu-list', {
      title: 'Quản lý Menu',
      menus
    });
  },

  /**
   * GET /admin/menus/create - Form tạo menu
   */
  create(req, res) {
    const posts = PostModel.getAll();
    res.render('admin/menu-form', {
      title: 'Tạo menu mới',
      menu: null,
      posts,
      selectedPostIds: [],
      errors: {}
    });
  },

  /**
   * POST /admin/menus/create - Xử lý tạo menu
   */
  store(req, res) {
    const { name_vi, name_en, slug, type, linked_post_id, is_visible, sort_order } = req.body;
    let { post_ids } = req.body; // Array of post_ids for post_list type
    const errors = {};

    // Validate
    if (!name_vi || !name_vi.trim()) {
      errors.name_vi = 'Tên menu tiếng Việt không được để trống';
    }

    // Tạo slug nếu không có
    let menuSlug = slug ? slug.trim() : '';
    if (!menuSlug && type !== 'system') {
      menuSlug = '/menu/' + slugify(name_vi);
    }

    // Validate slug cho non-system menu
    if (type !== 'system' && !menuSlug) {
      errors.slug = 'Slug không được để trống';
    }

    // Kiểm tra slug trùng
    if (menuSlug && MenuModel.slugExists(menuSlug)) {
      errors.slug = 'Slug đã tồn tại';
    }

    // Validate linked_post_id cho single_post
    if (type === 'single_post' && !linked_post_id) {
      errors.linked_post_id = 'Vui lòng chọn bài viết để gán';
    }

    // Validate post_ids cho post_list
    if (type === 'post_list') {
      // Chuyển thành mảng nếu là string đơn
      if (post_ids && !Array.isArray(post_ids)) {
        post_ids = [post_ids];
      }
      if (!post_ids || post_ids.length === 0) {
        errors.post_ids = 'Vui lòng chọn ít nhất 1 bài viết cho menu dropdown';
      }
    }

    // Nếu có lỗi
    if (Object.keys(errors).length > 0) {
      const posts = PostModel.getAll();
      return res.render('admin/menu-form', {
        title: 'Tạo menu mới',
        menu: { name_vi, name_en, slug: menuSlug, type, linked_post_id, is_visible, sort_order },
        posts,
        selectedPostIds: post_ids || [],
        errors
      });
    }

    try {
      const result = MenuModel.create({
        name_vi: name_vi.trim(),
        name_en: name_en ? name_en.trim() : '',
        slug: menuSlug,
        type: type || 'custom',
        linked_post_id: type === 'single_post' ? linked_post_id : null,
        is_visible: is_visible === 'on' || is_visible === '1',
        sort_order: parseInt(sort_order) || MenuModel.getNextSortOrder()
      });

      // Nếu là post_list, gán các bài viết
      if (type === 'post_list' && post_ids && result.lastInsertRowid) {
        MenuPostModel.assignPostsToMenu(result.lastInsertRowid, post_ids);
      }

      req.session.success = 'Tạo menu thành công';
      return res.redirect('/admin/menus');
    } catch (error) {
      console.error('Create menu error:', error);
      req.session.error = 'Có lỗi xảy ra khi tạo menu';
      return res.redirect('/admin/menus/create');
    }
  },

  /**
   * GET /admin/menus/:id/edit - Form sửa menu
   */
  edit(req, res) {
    const { id } = req.params;
    const menu = MenuModel.findById(id);

    if (!menu) {
      req.session.error = 'Menu không tồn tại';
      return res.redirect('/admin/menus');
    }

    const posts = PostModel.getAll();
    
    // Lấy danh sách post_ids đã gán cho menu (nếu là post_list)
    const selectedPostIds = menu.type === 'post_list' 
      ? MenuPostModel.getPostIdsByMenuId(id) 
      : [];

    res.render('admin/menu-form', {
      title: 'Sửa menu',
      menu,
      posts,
      selectedPostIds,
      errors: {}
    });
  },

  /**
   * POST /admin/menus/:id/edit - Xử lý cập nhật menu
   */
  update(req, res) {
    const { id } = req.params;
    const menu = MenuModel.findById(id);

    if (!menu) {
      req.session.error = 'Menu không tồn tại';
      return res.redirect('/admin/menus');
    }

    const { name_vi, name_en, slug, type, linked_post_id, is_visible, sort_order } = req.body;
    let { post_ids } = req.body;
    const errors = {};

    // Validate
    if (!name_vi || !name_vi.trim()) {
      errors.name_vi = 'Tên menu tiếng Việt không được để trống';
    }

    // Xử lý slug
    let menuSlug = slug ? slug.trim() : menu.slug;
    
    // Không cho sửa slug của menu system
    if (menu.type === 'system') {
      menuSlug = menu.slug;
    }

    // Kiểm tra slug trùng
    if (menuSlug && MenuModel.slugExists(menuSlug, id)) {
      errors.slug = 'Slug đã tồn tại';
    }

    // Validate linked_post_id cho single_post
    if (type === 'single_post' && !linked_post_id) {
      errors.linked_post_id = 'Vui lòng chọn bài viết để gán';
    }

    // Validate post_ids cho post_list
    if (type === 'post_list') {
      if (post_ids && !Array.isArray(post_ids)) {
        post_ids = [post_ids];
      }
      if (!post_ids || post_ids.length === 0) {
        errors.post_ids = 'Vui lòng chọn ít nhất 1 bài viết cho menu dropdown';
      }
    }

    // Nếu có lỗi
    if (Object.keys(errors).length > 0) {
      const posts = PostModel.getAll();
      return res.render('admin/menu-form', {
        title: 'Sửa menu',
        menu: { ...menu, name_vi, name_en, slug: menuSlug, type, linked_post_id, is_visible, sort_order },
        posts,
        selectedPostIds: post_ids || [],
        errors
      });
    }

    try {
      // Xác định type thực tế (không cho thay đổi type của system menu)
      const actualType = menu.type === 'system' ? 'system' : (type || 'custom');

      MenuModel.update(id, {
        name_vi: name_vi.trim(),
        name_en: name_en ? name_en.trim() : '',
        slug: menuSlug,
        type: actualType,
        linked_post_id: actualType === 'single_post' ? linked_post_id : null,
        is_visible: is_visible === 'on' || is_visible === '1',
        sort_order: parseInt(sort_order) || menu.sort_order
      });

      // Cập nhật menu_posts nếu là post_list
      if (actualType === 'post_list') {
        MenuPostModel.assignPostsToMenu(id, post_ids || []);
      } else {
        // Nếu không phải post_list nữa thì xóa các quan hệ cũ
        MenuPostModel.removeAllPostsFromMenu(id);
      }

      req.session.success = 'Cập nhật menu thành công';
      return res.redirect('/admin/menus');
    } catch (error) {
      console.error('Update menu error:', error);
      req.session.error = 'Có lỗi xảy ra khi cập nhật menu';
      return res.redirect(`/admin/menus/${id}/edit`);
    }
  },

  /**
   * POST /admin/menus/:id/delete - Xóa menu
   */
  destroy(req, res) {
    const { id } = req.params;
    const menu = MenuModel.findById(id);

    if (!menu) {
      req.session.error = 'Menu không tồn tại';
      return res.redirect('/admin/menus');
    }

    if (menu.type === 'system') {
      req.session.error = 'Không thể xóa menu hệ thống';
      return res.redirect('/admin/menus');
    }

    try {
      const result = MenuModel.delete(id);
      if (result.success) {
        req.session.success = 'Xóa menu thành công';
      } else {
        req.session.error = result.message || 'Không thể xóa menu';
      }
    } catch (error) {
      console.error('Delete menu error:', error);
      req.session.error = 'Có lỗi xảy ra khi xóa menu';
    }

    return res.redirect('/admin/menus');
  },

  /**
   * POST /admin/menus/:id/toggle-visibility - Bật/tắt hiển thị
   */
  toggleVisibility(req, res) {
    const { id } = req.params;
    
    try {
      const result = MenuModel.toggleVisibility(id);
      if (result) {
        req.session.success = result.is_visible ? 'Đã hiển thị menu' : 'Đã ẩn menu';
      } else {
        req.session.error = 'Menu không tồn tại';
      }
    } catch (error) {
      console.error('Toggle menu visibility error:', error);
      req.session.error = 'Có lỗi xảy ra';
    }

    return res.redirect('/admin/menus');
  },

  /**
   * POST /admin/menus/reorder - Sắp xếp lại thứ tự
   */
  reorder(req, res) {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      return res.json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }

    // Validate từng phần tử: id và sort_order phải là số nguyên dương hợp lệ
    const isValid = orders.every(o => {
      const id        = Number(o.id);
      const sortOrder = Number(o.sort_order);
      return Number.isInteger(id) && id > 0 &&
             Number.isInteger(sortOrder) && sortOrder >= 0;
    });

    if (!isValid) {
      return res.json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }

    try {
      MenuModel.reorder(orders);
      return res.json({ success: true });
    } catch (error) {
      console.error('Reorder menu error:', error);
      return res.json({ success: false, message: 'Có lỗi xảy ra' });
    }
  },

  // ============================================
  // PUBLIC ROUTES
  // ============================================

  /**
   * GET /menu/:slug - Xem trang menu (single_post)
   */
  showMenuPage(req, res) {
    const { slug } = req.params;
    const menu = MenuModel.findBySlug('/menu/' + slug);

    if (!menu) {
      return res.status(404).render('web/404', { title: 'Không tìm thấy trang' });
    }

    // Nếu là single_post và có linked_post_id
    if (menu.type === 'single_post' && menu.linked_post_id) {
      const post = PostModel.findById(menu.linked_post_id);
      
      if (!post || post.status !== 'published') {
        return res.status(404).render('web/404', { title: 'Không tìm thấy trang' });
      }

      // Render như trang bài viết
      return res.render('web/menu-page', {
        title: menu.name_vi,
        menu,
        post
      });
    }

    // Custom menu hoặc không có bài viết gán
    return res.render('web/menu-page', {
      title: menu.name_vi,
      menu,
      post: null
    });
  }
};

module.exports = MenuController;
