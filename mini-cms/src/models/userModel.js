/**
 * User Model
 * Xử lý các thao tác với bảng users
 */

const { db } = require('../config/db');
const bcrypt = require('bcrypt');

const UserModel = {
  /**
   * Tìm user theo username
   */
  findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  /**
   * Tìm user theo id
   */
  findById(id) {
    return db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id);
  },

  /**
   * Xác thực đăng nhập
   */
  authenticate(username, password) {
    const user = this.findByUsername(username);
    if (!user) return null;
    
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return null;
    
    // Trả về user không có password
    return {
      id: user.id,
      username: user.username,
      role: user.role
    };
  },

  /**
   * Đổi mật khẩu
   */
  changePassword(id, newPassword) {
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    return db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
  }
};

module.exports = UserModel;
