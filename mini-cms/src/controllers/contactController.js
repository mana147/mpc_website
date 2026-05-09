/**
 * Contact Controller
 * Xử lý liên hệ (public + admin)
 */

const ContactModel = require('../models/contactModel');

const ContactController = {
  // ============================================
  // PUBLIC ROUTES
  // ============================================

  /**
   * GET /contact - Trang liên hệ
   */
  index(req, res) {
    res.render('web/contact', {
      title: 'Liên hệ',
      formData: {},
      errors: {}
    });
  },

  /**
   * POST /contact - Xử lý gửi liên hệ
   */
  submit(req, res) {
    const { full_name, email, subject, phone, message } = req.body;
    const errors = {};

    // Validate
    if (!full_name || !full_name.trim()) {
      errors.full_name = 'Vui lòng nhập họ tên';
    }

    if (!email || !email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!isValidEmail(email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!subject || !subject.trim()) {
      errors.subject = 'Vui lòng nhập tiêu đề';
    }

    if (!message || !message.trim()) {
      errors.message = 'Vui lòng nhập nội dung';
    }

    // Nếu có lỗi, render lại form
    if (Object.keys(errors).length > 0) {
      return res.render('web/contact', {
        title: 'Liên hệ',
        formData: { full_name, email, subject, phone, message },
        errors
      });
    }

    // Lưu vào database
    try {
      ContactModel.create({
        full_name: full_name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        phone: phone ? phone.trim() : '',
        message: message.trim()
      });

      req.session.success = 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.';
      return res.redirect('/contact');
    } catch (error) {
      console.error('Contact submit error:', error);
      req.session.error = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
      return res.redirect('/contact');
    }
  },

  // ============================================
  // ADMIN ROUTES
  // ============================================

  /**
   * GET /admin/contacts - Danh sách liên hệ
   */
  adminIndex(req, res) {
    const contacts = ContactModel.getAll();
    res.render('admin/contact-list', {
      title: 'Quản lý liên hệ',
      contacts
    });
  },

  /**
   * GET /admin/contacts/:id - Chi tiết liên hệ
   */
  adminShow(req, res) {
    const { id } = req.params;
    const contact = ContactModel.findById(id);

    if (!contact) {
      req.session.error = 'Liên hệ không tồn tại';
      return res.redirect('/admin/contacts');
    }

    // Đánh dấu đã đọc
    if (!contact.is_read) {
      ContactModel.markAsRead(id);
    }

    res.render('admin/contact-detail', {
      title: 'Chi tiết liên hệ',
      contact
    });
  },

  /**
   * POST /admin/contacts/:id/delete - Xóa liên hệ
   */
  destroy(req, res) {
    const { id } = req.params;
    const contact = ContactModel.findById(id);

    if (!contact) {
      req.session.error = 'Liên hệ không tồn tại';
      return res.redirect('/admin/contacts');
    }

    try {
      ContactModel.delete(id);
      req.session.success = 'Đã xóa liên hệ thành công';
    } catch (error) {
      console.error('Delete contact error:', error);
      req.session.error = 'Có lỗi xảy ra khi xóa liên hệ';
    }

    return res.redirect('/admin/contacts');
  }
};

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

module.exports = ContactController;
