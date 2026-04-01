/**
 * Gallery Model
 * Xử lý các thao tác với bảng gallery_images
 */

const { db } = require('../config/db');

const GalleryModel = {
  /**
   * Lấy tất cả ảnh (mới nhất trước)
   */
  getAll(limit = 100, offset = 0) {
    return db.prepare(`
      SELECT * FROM gallery_images 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  },

  /**
   * Tìm ảnh theo id
   */
  findById(id) {
    return db.prepare('SELECT * FROM gallery_images WHERE id = ?').get(id);
  },

  /**
   * Thêm một ảnh
   */
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO gallery_images (filename, filepath, alt_text) 
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(data.filename, data.filepath, data.alt_text || '');
    return result.lastInsertRowid;
  },

  /**
   * Thêm nhiều ảnh cùng lúc
   */
  createMany(images) {
    const stmt = db.prepare(`
      INSERT INTO gallery_images (filename, filepath, alt_text) 
      VALUES (?, ?, ?)
    `);
    
    const insertMany = db.transaction((items) => {
      const ids = [];
      for (const img of items) {
        const result = stmt.run(img.filename, img.filepath, img.alt_text || '');
        ids.push(result.lastInsertRowid);
      }
      return ids;
    });

    return insertMany(images);
  },

  /**
   * Xóa ảnh theo id
   */
  delete(id) {
    return db.prepare('DELETE FROM gallery_images WHERE id = ?').run(id);
  },

  /**
   * Đếm tổng số ảnh
   */
  count() {
    return db.prepare('SELECT COUNT(*) as total FROM gallery_images').get().total;
  }
};

module.exports = GalleryModel;
