/**
 * Contact Model
 * Quản lý liên hệ từ khách hàng
 */

const { db } = require('../config/db');

const ContactModel = {
  /**
   * Tạo liên hệ mới
   */
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO contacts (full_name, email, subject, phone, message)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.full_name,
      data.email,
      data.subject,
      data.phone || '',
      data.message
    );
  },

  /**
   * Lấy tất cả liên hệ (mới nhất trước)
   */
  getAll() {
    return db.prepare(`
      SELECT * FROM contacts 
      ORDER BY created_at DESC
    `).all();
  },

  /**
   * Lấy liên hệ theo ID
   */
  findById(id) {
    return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
  },

  /**
   * Đánh dấu đã đọc
   */
  markAsRead(id) {
    const stmt = db.prepare('UPDATE contacts SET is_read = 1 WHERE id = ?');
    return stmt.run(id);
  },

  /**
   * Đếm số liên hệ chưa đọc
   */
  countUnread() {
    const result = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE is_read = 0').get();
    return result.count;
  },

  /**
   * Xóa liên hệ
   */
  delete(id) {
    const stmt = db.prepare('DELETE FROM contacts WHERE id = ?');
    return stmt.run(id);
  }
};

module.exports = ContactModel;
