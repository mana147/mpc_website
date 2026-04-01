/**
 * Post Model
 * Xử lý các thao tác với bảng posts
 */

const { db } = require('../config/db');

const PostModel = {
  /**
   * Lấy tất cả bài viết (có phân trang)
   */
  getAll(limit = 100, offset = 0) {
    return db.prepare(`
      SELECT * FROM posts 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  },

  /**
   * Lấy bài viết đã publish
   */
  getPublished(limit = 100, offset = 0) {
    return db.prepare(`
      SELECT * FROM posts 
      WHERE status = 'published' 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  },

  /**
   * Lấy bài viết mới nhất
   */
  getLatest(limit = 5) {
    return db.prepare(`
      SELECT * FROM posts 
      WHERE status = 'published' 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);
  },

  /**
   * Tìm bài viết theo id
   */
  findById(id) {
    return db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  },

  /**
   * Tìm bài viết theo slug
   */
  findBySlug(slug) {
    return db.prepare('SELECT * FROM posts WHERE slug = ? AND status = ?').get(slug, 'published');
  },

  /**
   * Kiểm tra slug đã tồn tại chưa
   */
  slugExists(slug, excludeId = null) {
    if (excludeId) {
      return db.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').get(slug, excludeId);
    }
    return db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug);
  },

  /**
   * Tạo bài viết mới
   */
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO posts (title, slug, excerpt, content, thumbnail, status, title_en, excerpt_en, content_en) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.title,
      data.slug,
      data.excerpt || '',
      data.content || '',
      data.thumbnail || null,
      data.status || 'draft',
      data.title_en || '',
      data.excerpt_en || '',
      data.content_en || ''
    );
    return result.lastInsertRowid;
  },

  /**
   * Cập nhật bài viết
   */
  update(id, data) {
    const stmt = db.prepare(`
      UPDATE posts 
      SET title = ?, slug = ?, excerpt = ?, content = ?, thumbnail = ?, status = ?, 
          title_en = ?, excerpt_en = ?, content_en = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      data.title,
      data.slug,
      data.excerpt || '',
      data.content || '',
      data.thumbnail,
      data.status || 'draft',
      data.title_en || '',
      data.excerpt_en || '',
      data.content_en || '',
      id
    );
  },

  /**
   * Xóa bài viết
   */
  delete(id) {
    return db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  },

  /**
   * Đếm tổng số bài viết
   */
  count() {
    return db.prepare('SELECT COUNT(*) as total FROM posts').get().total;
  },

  /**
   * Đếm bài viết đã publish
   */
  countPublished() {
    return db.prepare('SELECT COUNT(*) as total FROM posts WHERE status = ?').get('published').total;
  }
};

module.exports = PostModel;
