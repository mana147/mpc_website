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

  console.log('✅ Database đã sẵn sàng!');
}

module.exports = {
  db,
  initDatabase
};
