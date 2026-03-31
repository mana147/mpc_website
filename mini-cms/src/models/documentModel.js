/**
 * Document Model
 * Xử lý các thao tác với bảng documents (PDF)
 */

const { db } = require('../config/db');

const DocumentModel = {
  /**
   * Lấy tất cả tài liệu
   */
  getAll(limit = 100, offset = 0) {
    return db.prepare(`
      SELECT * FROM documents 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  },

  /**
   * Lấy tài liệu mới nhất
   */
  getLatest(limit = 5) {
    return db.prepare(`
      SELECT * FROM documents 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);
  },

  /**
   * Tìm tài liệu theo id
   */
  findById(id) {
    return db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  },

  /**
   * Tạo tài liệu mới
   */
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO documents (title, filename, filepath, description) 
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.title,
      data.filename,
      data.filepath,
      data.description || ''
    );
    return result.lastInsertRowid;
  },

  /**
   * Cập nhật tài liệu
   */
  update(id, data) {
    const stmt = db.prepare(`
      UPDATE documents 
      SET title = ?, description = ?
      WHERE id = ?
    `);
    return stmt.run(data.title, data.description || '', id);
  },

  /**
   * Xóa tài liệu
   */
  delete(id) {
    return db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  },

  /**
   * Đếm tổng số tài liệu
   */
  count() {
    return db.prepare('SELECT COUNT(*) as total FROM documents').get().total;
  }
};

module.exports = DocumentModel;
