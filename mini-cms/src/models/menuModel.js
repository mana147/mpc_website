/**
 * Menu Model
 * Quản lý menu động cho website
 */

const { db } = require('../config/db');

const MenuModel = {
  /**
   * Lấy tất cả menu (sắp xếp theo sort_order)
   */
  getAll() {
    return db.prepare(`
      SELECT m.*, p.title as linked_post_title,
        (SELECT COUNT(*) FROM menu_posts WHERE menu_id = m.id) as children_count
      FROM menus m
      LEFT JOIN posts p ON m.linked_post_id = p.id
      ORDER BY m.sort_order ASC
    `).all();
  },

  /**
   * Lấy menu hiển thị (is_visible = 1)
   */
  getVisible() {
    return db.prepare(`
      SELECT m.*, p.title as linked_post_title, p.slug as linked_post_slug
      FROM menus m
      LEFT JOIN posts p ON m.linked_post_id = p.id
      WHERE m.is_visible = 1
      ORDER BY m.sort_order ASC
    `).all();
  },

  /**
   * Lấy menu visible kèm children posts (cho post_list type)
   */
  getVisibleMenusWithChildren() {
    const menus = this.getVisible();
    
    // Load children cho các menu type = post_list
    return menus.map(menu => {
      if (menu.type === 'post_list') {
        // Lấy danh sách bài viết con đã publish
        const children = db.prepare(`
          SELECT mp.sort_order as child_sort_order,
                 p.id, p.title, p.title_en, p.slug, p.excerpt, p.excerpt_en
          FROM menu_posts mp
          INNER JOIN posts p ON mp.post_id = p.id
          WHERE mp.menu_id = ? AND p.status = 'published'
          ORDER BY mp.sort_order ASC
        `).all(menu.id);
        
        return { ...menu, children };
      }
      return { ...menu, children: [] };
    });
  },

  /**
   * Lấy menu theo ID
   */
  findById(id) {
    return db.prepare(`
      SELECT m.*, p.title as linked_post_title,
        (SELECT COUNT(*) FROM menu_posts WHERE menu_id = m.id) as children_count
      FROM menus m
      LEFT JOIN posts p ON m.linked_post_id = p.id
      WHERE m.id = ?
    `).get(id);
  },

  /**
   * Lấy menu theo slug
   */
  findBySlug(slug) {
    return db.prepare(`
      SELECT m.*, p.title as linked_post_title, p.slug as linked_post_slug
      FROM menus m
      LEFT JOIN posts p ON m.linked_post_id = p.id
      WHERE m.slug = ?
    `).get(slug);
  },

  /**
   * Kiểm tra slug đã tồn tại chưa
   */
  slugExists(slug, excludeId = null) {
    if (excludeId) {
      const result = db.prepare('SELECT id FROM menus WHERE slug = ? AND id != ?').get(slug, excludeId);
      return !!result;
    }
    const result = db.prepare('SELECT id FROM menus WHERE slug = ?').get(slug);
    return !!result;
  },

  /**
   * Tạo menu mới
   */
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO menus (name_vi, name_en, slug, type, linked_post_id, is_visible, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.name_vi,
      data.name_en || '',
      data.slug,
      data.type || 'custom',
      data.linked_post_id || null,
      data.is_visible ? 1 : 0,
      data.sort_order || 0
    );
  },

  /**
   * Cập nhật menu
   */
  update(id, data) {
    const stmt = db.prepare(`
      UPDATE menus 
      SET name_vi = ?, name_en = ?, slug = ?, type = ?, 
          linked_post_id = ?, is_visible = ?, sort_order = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      data.name_vi,
      data.name_en || '',
      data.slug,
      data.type || 'custom',
      data.linked_post_id || null,
      data.is_visible ? 1 : 0,
      data.sort_order || 0,
      id
    );
  },

  /**
   * Xóa menu (không cho xóa menu system)
   */
  delete(id) {
    const menu = this.findById(id);
    if (menu && menu.type === 'system') {
      return { success: false, message: 'Không thể xóa menu hệ thống' };
    }
    const stmt = db.prepare('DELETE FROM menus WHERE id = ? AND type != ?');
    const result = stmt.run(id, 'system');
    return { success: result.changes > 0 };
  },

  /**
   * Bật/tắt hiển thị menu
   */
  toggleVisibility(id) {
    const menu = this.findById(id);
    if (!menu) return null;
    
    const newVisibility = menu.is_visible ? 0 : 1;
    const stmt = db.prepare('UPDATE menus SET is_visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(newVisibility, id);
    return { ...menu, is_visible: newVisibility };
  },

  /**
   * Cập nhật thứ tự menu
   * @param {Array} orders - [{id: 1, sort_order: 1}, {id: 2, sort_order: 2}, ...]
   */
  reorder(orders) {
    const stmt = db.prepare('UPDATE menus SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const updateMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.sort_order, item.id);
      }
    });
    updateMany(orders);
    return true;
  },

  /**
   * Lấy sort_order tiếp theo
   */
  getNextSortOrder() {
    const result = db.prepare('SELECT MAX(sort_order) as maxOrder FROM menus').get();
    return (result.maxOrder || 0) + 1;
  },

  /**
   * Kiểm tra xem có phải menu hệ thống không
   */
  isSystemMenu(id) {
    const menu = this.findById(id);
    return menu && menu.type === 'system';
  }
};

module.exports = MenuModel;
