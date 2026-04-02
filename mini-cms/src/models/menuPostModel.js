/**
 * Menu Post Model
 * Quản lý quan hệ nhiều-nhiều giữa menus và posts
 */

const { db } = require('../config/db');

const MenuPostModel = {
  /**
   * Lấy danh sách bài viết theo menu_id (kèm thông tin bài viết)
   */
  getPostsByMenuId(menuId) {
    return db.prepare(`
      SELECT mp.*, 
             p.id as post_id, p.title, p.title_en, p.slug as post_slug, 
             p.excerpt, p.excerpt_en, p.thumbnail, p.status
      FROM menu_posts mp
      INNER JOIN posts p ON mp.post_id = p.id
      WHERE mp.menu_id = ?
      ORDER BY mp.sort_order ASC
    `).all(menuId);
  },

  /**
   * Lấy danh sách bài viết đã publish theo menu_id
   */
  getPublishedPostsByMenuId(menuId) {
    return db.prepare(`
      SELECT mp.*, 
             p.id as post_id, p.title, p.title_en, p.slug as post_slug, 
             p.excerpt, p.excerpt_en, p.thumbnail, p.status
      FROM menu_posts mp
      INNER JOIN posts p ON mp.post_id = p.id
      WHERE mp.menu_id = ? AND p.status = 'published'
      ORDER BY mp.sort_order ASC
    `).all(menuId);
  },

  /**
   * Lấy quan hệ menu-post
   */
  getMenuPostRelations(menuId) {
    return db.prepare(`
      SELECT mp.*, p.title, p.status
      FROM menu_posts mp
      LEFT JOIN posts p ON mp.post_id = p.id
      WHERE mp.menu_id = ?
      ORDER BY mp.sort_order ASC
    `).all(menuId);
  },

  /**
   * Lấy danh sách post_ids đã gán cho menu
   */
  getPostIdsByMenuId(menuId) {
    const rows = db.prepare(`
      SELECT post_id FROM menu_posts WHERE menu_id = ? ORDER BY sort_order ASC
    `).all(menuId);
    return rows.map(r => r.post_id);
  },

  /**
   * Gán nhiều bài viết vào menu
   * @param {number} menuId - ID của menu
   * @param {Array} postIds - Mảng các post_id cần gán
   */
  assignPostsToMenu(menuId, postIds) {
    // Xóa các quan hệ cũ trước
    this.removeAllPostsFromMenu(menuId);

    // Nếu không có posts mới thì return
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return { success: true, count: 0 };
    }

    // Insert các quan hệ mới với sort_order tăng dần
    const stmt = db.prepare(`
      INSERT INTO menu_posts (menu_id, post_id, sort_order)
      VALUES (?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      items.forEach((postId, index) => {
        try {
          stmt.run(menuId, parseInt(postId), index + 1);
        } catch (e) {
          // Bỏ qua nếu post_id không hợp lệ hoặc đã tồn tại
          console.warn(`Skip post_id ${postId}:`, e.message);
        }
      });
    });

    insertMany(postIds);
    return { success: true, count: postIds.length };
  },

  /**
   * Xóa tất cả bài viết khỏi menu
   */
  removeAllPostsFromMenu(menuId) {
    return db.prepare('DELETE FROM menu_posts WHERE menu_id = ?').run(menuId);
  },

  /**
   * Xóa một bài viết khỏi menu
   */
  removePostFromMenu(menuId, postId) {
    return db.prepare('DELETE FROM menu_posts WHERE menu_id = ? AND post_id = ?').run(menuId, postId);
  },

  /**
   * Thêm một bài viết vào menu
   */
  addPostToMenu(menuId, postId, sortOrder = 0) {
    try {
      return db.prepare(`
        INSERT INTO menu_posts (menu_id, post_id, sort_order)
        VALUES (?, ?, ?)
      `).run(menuId, postId, sortOrder);
    } catch (e) {
      // Đã tồn tại
      return null;
    }
  },

  /**
   * Cập nhật thứ tự bài viết trong menu
   * @param {number} menuId 
   * @param {Array} orders - [{post_id: 1, sort_order: 1}, ...]
   */
  reorderPosts(menuId, orders) {
    const stmt = db.prepare(`
      UPDATE menu_posts SET sort_order = ? WHERE menu_id = ? AND post_id = ?
    `);
    
    const updateMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.sort_order, menuId, item.post_id);
      }
    });
    
    updateMany(orders);
    return true;
  },

  /**
   * Đếm số bài viết trong menu
   */
  countPostsInMenu(menuId) {
    const result = db.prepare('SELECT COUNT(*) as count FROM menu_posts WHERE menu_id = ?').get(menuId);
    return result.count;
  },

  /**
   * Kiểm tra bài viết có thuộc menu không
   */
  isPostInMenu(menuId, postId) {
    const result = db.prepare('SELECT id FROM menu_posts WHERE menu_id = ? AND post_id = ?').get(menuId, postId);
    return !!result;
  }
};

module.exports = MenuPostModel;
