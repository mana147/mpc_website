const { db } = require('../config/db');

const JobModel = {
  getAll(limit = 100, offset = 0) {
    return db.prepare(`
      SELECT * FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset);
  },

  getPublished(limit = 100, offset = 0) {
    return db.prepare(`
      SELECT * FROM jobs WHERE status = 'published' ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset);
  },

  getLatest(limit = 6) {
    return db.prepare(`
      SELECT * FROM jobs WHERE status = 'published' ORDER BY created_at DESC LIMIT ?
    `).all(limit);
  },

  findById(id) {
    return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  },

  findBySlug(slug) {
    return db.prepare(`SELECT * FROM jobs WHERE slug = ? AND status = 'published'`).get(slug);
  },

  getOtherJobs(excludeId, limit = 6) {
    return db.prepare(`
      SELECT id, title, title_en, slug FROM jobs
      WHERE status = 'published' AND id != ?
      ORDER BY created_at DESC LIMIT ?
    `).all(excludeId, limit);
  },

  slugExists(slug, excludeId = null) {
    if (excludeId) {
      return db.prepare('SELECT id FROM jobs WHERE slug = ? AND id != ?').get(slug, excludeId);
    }
    return db.prepare('SELECT id FROM jobs WHERE slug = ?').get(slug);
  },

  create(data) {
    return db.prepare(`
      INSERT INTO jobs (title, slug, content, salary, hiring_count, deadline, thumbnail, status, title_en, content_en)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.title, data.slug, data.content || '',
      data.salary || '', data.hiring_count || 1, data.deadline || '',
      data.thumbnail || null, data.status || 'draft',
      data.title_en || '', data.content_en || ''
    ).lastInsertRowid;
  },

  update(id, data) {
    return db.prepare(`
      UPDATE jobs
      SET title = ?, slug = ?, content = ?, salary = ?, hiring_count = ?, deadline = ?,
          thumbnail = ?, status = ?, title_en = ?, content_en = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.title, data.slug, data.content || '',
      data.salary || '', data.hiring_count || 1, data.deadline || '',
      data.thumbnail, data.status || 'draft',
      data.title_en || '', data.content_en || '', id
    );
  },

  delete(id) {
    return db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as total FROM jobs').get().total;
  },

  countPublished() {
    return db.prepare(`SELECT COUNT(*) as total FROM jobs WHERE status = 'published'`).get().total;
  }
};

module.exports = JobModel;
