/**
 * Auth Controller
 * Xử lý đăng nhập/đăng xuất admin
 */

const UserModel = require('../models/userModel');

const AuthController = {
  /**
   * GET /admin/login - Hiển thị form đăng nhập
   */
  showLogin(req, res) {
    const error = req.session.error;
    delete req.session.error;
    
    res.render('admin/login', { 
      title: 'Đăng nhập Admin',
      layout: false,
      error: error || null
    });
  },

  /**
   * POST /admin/login - Xử lý đăng nhập
   */
  login(req, res) {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      req.session.error = 'Vui lòng nhập đầy đủ thông tin';
      return res.redirect('/admin/login');
    }

    // Xác thực
    const user = UserModel.authenticate(username, password);
    
    if (!user) {
      req.session.error = 'Tên đăng nhập hoặc mật khẩu không đúng';
      return res.redirect('/admin/login');
    }

    // Lưu session
    req.session.user = user;
    req.session.success = 'Đăng nhập thành công';
    
    return res.redirect('/admin');
  },

  /**
   * POST /admin/logout - Đăng xuất
   */
  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/admin/login');
    });
  }
};

module.exports = AuthController;
