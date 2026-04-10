/**
 * Menu Post Model
 * Quản lý quan hệ nhiều-nhiều giữa menus và posts
 */

const { db } = require('../config/db');

const MenuPostModel = {
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
  }
};

module.exports = MenuPostModel;
