/**
 * Admin Controller
 * Xử lý dashboard và các trang admin chung
 */

const PostModel = require('../models/postModel');
const DocumentModel = require('../models/documentModel');

const AdminController = {
  /**
   * GET /admin - Dashboard
   */
  dashboard(req, res) {
    const stats = {
      totalPosts: PostModel.count(),
      publishedPosts: PostModel.countPublished(),
      totalDocuments: DocumentModel.count()
    };

    const latestPosts = PostModel.getLatest(5);
    const latestDocuments = DocumentModel.getLatest(5);

    res.render('admin/dashboard', {
      title: 'Dashboard',
      stats,
      latestPosts,
      latestDocuments
    });
  }
};

module.exports = AdminController;
