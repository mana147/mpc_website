/**
 * Auth Middleware
 * Kiểm tra đăng nhập admin
 */

/**
 * Yêu cầu đăng nhập để truy cập
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.error = 'Vui lòng đăng nhập để tiếp tục';
  return res.redirect('/admin/login');
}

/**
 * Chuyển hướng nếu đã đăng nhập
 */
function redirectIfAuth(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/admin');
  }
  return next();
}

module.exports = {
  requireAuth,
  redirectIfAuth
};
