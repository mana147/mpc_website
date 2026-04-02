/**
 * Database Configuration
 * Sử dụng better-sqlite3 (sync) cho đơn giản
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Đường dẫn database
const dbPath = path.join(__dirname, '../../database/cms.sqlite');

// Đảm bảo thư mục database tồn tại
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Tạo connection
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('journal_mode = WAL');

/**
 * Khởi tạo database - tạo bảng và admin mặc định
 */
function initDatabase() {
  console.log('📦 Đang khởi tạo database...');

  // Tạo bảng users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tạo bảng posts
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      content TEXT,
      thumbnail TEXT,
      status TEXT DEFAULT 'draft',
      title_en TEXT,
      excerpt_en TEXT,
      content_en TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Thêm cột tiếng Anh nếu chưa có (cho database cũ)
  try {
    db.exec(`ALTER TABLE posts ADD COLUMN title_en TEXT`);
    db.exec(`ALTER TABLE posts ADD COLUMN excerpt_en TEXT`);
    db.exec(`ALTER TABLE posts ADD COLUMN content_en TEXT`);
  } catch (e) {
    // Cột đã tồn tại, bỏ qua
  }

  // Tạo bảng documents
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tạo bảng gallery_images
  db.exec(`
    CREATE TABLE IF NOT EXISTS gallery_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      alt_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tạo bảng contacts
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tạo bảng menus
  db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_vi TEXT NOT NULL,
      name_en TEXT,
      slug TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      linked_post_id INTEGER,
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (linked_post_id) REFERENCES posts(id) ON DELETE SET NULL
    )
  `);

  // Tạo bảng menu_posts (quan hệ nhiều-nhiều giữa menu và posts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(menu_id, post_id)
    )
  `);

  // Tạo admin mặc định nếu chưa có
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  
  if (!adminExists) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = bcrypt.hashSync(password, 10);
    
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
      username,
      passwordHash,
      'admin'
    );
    
    console.log(`✅ Đã tạo tài khoản admin: ${username} / ${password}`);
  }

  // Seed menu mặc định nếu bảng menus trống
  const menuCount = db.prepare('SELECT COUNT(*) as count FROM menus').get();
  if (menuCount.count === 0) {
    const defaultMenus = [
      { name_vi: 'Trang chủ', name_en: 'Home', slug: '/', type: 'system', sort_order: 1 },
      { name_vi: 'Bài viết', name_en: 'Posts', slug: '/posts', type: 'system', sort_order: 2 },
      { name_vi: 'Thư viện ảnh', name_en: 'Gallery', slug: '/gallery', type: 'system', sort_order: 3 },
      { name_vi: 'Tài liệu', name_en: 'Documents', slug: '/documents', type: 'system', sort_order: 4 },
      { name_vi: 'Liên hệ', name_en: 'Contact', slug: '/contact', type: 'system', sort_order: 5 }
    ];

    const insertMenu = db.prepare(`
      INSERT INTO menus (name_vi, name_en, slug, type, is_visible, sort_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `);

    for (const menu of defaultMenus) {
      insertMenu.run(menu.name_vi, menu.name_en, menu.slug, menu.type, menu.sort_order);
    }
    console.log('✅ Đã tạo 5 menu mặc định');
  }

  console.log('✅ Database đã sẵn sàng!');
}

module.exports = {
  db,
  initDatabase
};
