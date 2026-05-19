const JobModel = require('../models/jobModel');
const { slugify, makeUniqueSlug } = require('../utils/slugify');
const { safeUnlink } = require('../utils/safeFilePath');

const JobController = {
  // ============================================
  // PUBLIC ROUTES
  // ============================================

  index(req, res) {
    const jobs = JobModel.getPublished();
    res.render('web/recruitment', {
      title: res.locals.lang === 'en' ? 'Careers' : 'Tuyển dụng',
      currentPath: '/tuyen-dung',
      pageCss: '/css/pages/recruitment.css',
      jobs
    });
  },

  show(req, res) {
    const { slug } = req.params;
    const job = JobModel.findBySlug(slug);

    if (!job) {
      return res.status(404).render('web/404', { title: 'Không tìm thấy tin tuyển dụng' });
    }

    const otherJobs = JobModel.getOtherJobs(job.id, 6);

    const jobTitle = (res.locals.lang === 'en' && job.title_en) ? job.title_en : job.title;
    res.render('web/job-detail', {
      title: jobTitle,
      currentPath: '/tuyen-dung/' + slug,
      pageCss: '/css/pages/job-detail.css',
      job,
      otherJobs
    });
  },

  // ============================================
  // ADMIN ROUTES
  // ============================================

  adminIndex(req, res) {
    const jobs = JobModel.getAll();
    res.render('admin/job-list', {
      title: 'Quản lý Tuyển dụng',
      jobs
    });
  },

  create(req, res) {
    res.render('admin/job-create', {
      title: 'Tạo tin tuyển dụng mới'
    });
  },

  store(req, res) {
    if (req.uploadError) {
      req.session.error = req.uploadError;
      return res.redirect('/admin/jobs/create');
    }

    const { title, content, salary, hiring_count, deadline, status, title_en, content_en } = req.body;

    if (!title || !title.trim()) {
      req.session.error = 'Tiêu đề không được để trống';
      return res.redirect('/admin/jobs/create');
    }

    const baseSlug = slugify(title);
    const slug = makeUniqueSlug(baseSlug, (s) => JobModel.slugExists(s));

    let thumbnail = null;
    if (req.file) {
      thumbnail = '/uploads/images/' + req.file.filename;
    }

    try {
      JobModel.create({
        title: title.trim(),
        slug,
        content: content ? content.trim() : '',
        salary: salary ? salary.trim() : '',
        hiring_count: parseInt(hiring_count) || 1,
        deadline: deadline ? deadline.trim() : '',
        thumbnail,
        status: status || 'draft',
        title_en: title_en ? title_en.trim() : '',
        content_en: content_en ? content_en.trim() : ''
      });

      req.session.success = 'Tạo tin tuyển dụng thành công';
      return res.redirect('/admin/jobs');
    } catch (error) {
      console.error('Create job error:', error);
      req.session.error = 'Có lỗi xảy ra khi tạo tin tuyển dụng';
      return res.redirect('/admin/jobs/create');
    }
  },

  edit(req, res) {
    const { id } = req.params;
    const job = JobModel.findById(id);

    if (!job) {
      req.session.error = 'Tin tuyển dụng không tồn tại';
      return res.redirect('/admin/jobs');
    }

    res.render('admin/job-edit', {
      title: 'Sửa tin tuyển dụng',
      job
    });
  },

  update(req, res) {
    const { id } = req.params;
    const job = JobModel.findById(id);

    if (!job) {
      req.session.error = 'Tin tuyển dụng không tồn tại';
      return res.redirect('/admin/jobs');
    }

    if (req.uploadError) {
      req.session.error = req.uploadError;
      return res.redirect(`/admin/jobs/${id}/edit`);
    }

    const { title, content, salary, hiring_count, deadline, status, title_en, content_en } = req.body;

    if (!title || !title.trim()) {
      req.session.error = 'Tiêu đề không được để trống';
      return res.redirect(`/admin/jobs/${id}/edit`);
    }

    let slug = job.slug;
    if (title.trim() !== job.title) {
      const baseSlug = slugify(title);
      slug = makeUniqueSlug(baseSlug, (s) => JobModel.slugExists(s, id));
    }

    let thumbnail = job.thumbnail;
    if (req.file) {
      safeUnlink(job.thumbnail);
      thumbnail = '/uploads/images/' + req.file.filename;
    }

    try {
      JobModel.update(id, {
        title: title.trim(),
        slug,
        content: content ? content.trim() : '',
        salary: salary ? salary.trim() : '',
        hiring_count: parseInt(hiring_count) || 1,
        deadline: deadline ? deadline.trim() : '',
        thumbnail,
        status: status || 'draft',
        title_en: title_en ? title_en.trim() : '',
        content_en: content_en ? content_en.trim() : ''
      });

      req.session.success = 'Cập nhật tin tuyển dụng thành công';
      return res.redirect('/admin/jobs');
    } catch (error) {
      console.error('Update job error:', error);
      req.session.error = 'Có lỗi xảy ra khi cập nhật tin tuyển dụng';
      return res.redirect(`/admin/jobs/${id}/edit`);
    }
  },

  destroy(req, res) {
    const { id } = req.params;
    const job = JobModel.findById(id);

    if (!job) {
      req.session.error = 'Tin tuyển dụng không tồn tại';
      return res.redirect('/admin/jobs');
    }

    try {
      safeUnlink(job.thumbnail);
      JobModel.delete(id);
      req.session.success = 'Xóa tin tuyển dụng thành công';
    } catch (error) {
      console.error('Delete job error:', error);
      req.session.error = 'Có lỗi xảy ra khi xóa tin tuyển dụng';
    }

    return res.redirect('/admin/jobs');
  }
};

module.exports = JobController;
