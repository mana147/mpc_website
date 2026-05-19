# 🗺️ MINI CMS PROJECT SKILL MAP

> **Purpose**: This document provides a comprehensive understanding of the Mini CMS codebase for AI agents and developers.
> **Last updated**: May 19, 2026
> **Related**: See also [CLAUDE.md](../CLAUDE.md) for the authoritative single source of truth.

---

## 1. Architecture Overview

### 1.1 High-Level Architecture Pattern: **MVC (Model-View-Controller)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           mini-cms/app.js                                │
│                        (Application Entry Point)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          MIDDLEWARE CHAIN                                │
│  express.urlencoded → express.static → session → flash → language → menu │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              ROUTES                                      │
│    /lang/* → /* (web) → /admin/* (requireAuth) → /auth/*                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │ Controller│   │ Controller│   │ Controller│
            └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                  │               │               │
                  ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │   Model   │   │   Model   │   │   Model   │
            └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                  │               │               │
                  └───────────────┼───────────────┘
                                  ▼
                    ┌─────────────────────────┐
                    │   better-sqlite3 (SYNC) │
                    │   database/cms.sqlite   │
                    └─────────────────────────┘
```

### 1.2 Key Architectural Decisions

| Decision | Implementation | Reason |
|----------|----------------|--------|
| **Synchronous DB** | `better-sqlite3` | Simple, no async/await overhead |
| **Session Auth** | `express-session` | Simple, no JWT complexity |
| **Server-side Rendering** | EJS | SEO-friendly, simple templating |
| **Flat Routes** | `/admin/*`, `/*` | Clear separation of concerns |
| **Flash Messages** | `req.session.success/error` | User feedback across redirects |

---

## 2. Folder Structure

```
mini-cms/
├── app.js                          # Entry point, middleware chain, error handlers
├── package.json
├── database/
│   └── cms.sqlite                  # SQLite database (WAL mode, auto-created)
├── public/
│   ├── css/
│   │   ├── style.css               # Admin panel styles — NOT used by public pages
│   │   ├── mpc-base.css            # MPC shared: fonts, variables, buttons, forms
│   │   ├── mpc-header.css          # Transparent overlay header, responsive nav
│   │   ├── mpc-footer.css          # 4-column navy footer
│   │   └── pages/
│   │       ├── landing.css         # Landing page (~2000 lines, 5 breakpoints)
│   │       ├── recruitment.css     # Careers list page
│   │       ├── job-detail.css      # Job detail page (ported from prototype)
│   │       └── org-chart.css       # Organization chart (CSS tree layout)
│   ├── fonts/barlow-condensed/     # Barlow Condensed TTF (6 weights)
│   ├── images/
│   │   ├── icons/                  # 18 SVG icons (geo-*, eport, container, etc.)
│   │   ├── logo.png
│   │   └── map-vietnam.svg
│   ├── js/
│   │   ├── main.js                 # Admin: alerts, confirm delete, thumbnail preview
│   │   └── landing.js              # Landing: mobile menu, sliders, carousels
│   ├── uploads/
│   │   ├── images/                 # Uploaded images (flat, multer saves here)
│   │   └── pdfs/                   # Uploaded PDF files
│   └── vendor/                     # Fully offline — no CDN required
│       ├── bootstrap/css/bootstrap.min.css
│       ├── bootstrap/js/bootstrap.bundle.min.js
│       ├── bootstrap-icons/bootstrap-icons.css + fonts/
│       └── font-awesome/css/all.min.css + webfonts/
└── src/
    ├── config/
    │   └── db.js                   # DB init, schema (CREATE TABLE IF NOT EXISTS), seed data
    ├── controllers/
    │   ├── adminController.js      # Dashboard stats
    │   ├── authController.js       # Login/logout (bcrypt)
    │   ├── contactController.js    # Contact form + admin CRUD
    │   ├── documentController.js   # Document upload/download + admin
    │   ├── galleryController.js    # Gallery view + admin upload/delete
    │   ├── jobController.js        # Job listings full CRUD + public list/detail (bilingual)
    │   ├── menuController.js       # Menu CRUD + visibility toggle + reorder + public page
    │   └── postController.js       # Post full CRUD (bilingual)
    ├── middlewares/
    │   ├── authMiddleware.js       # requireAuth, redirectIfAuth
    │   ├── languageMiddleware.js   # i18n: exposes lang, t, __() on res.locals
    │   ├── menuMiddleware.js       # loadMenus → res.locals.visibleMenus
    │   └── uploadMiddleware.js     # Multer: uploadImage, uploadGallery, uploadPdf
    ├── models/
    │   ├── contactModel.js         # contacts table
    │   ├── documentModel.js        # documents table (no update after create)
    │   ├── galleryModel.js         # gallery_images table (no alt_text edit)
    │   ├── jobModel.js             # jobs table (full CRUD + getOtherJobs for sidebar)
    │   ├── menuModel.js            # menus table
    │   ├── menuPostModel.js        # menu_posts junction (getPostIdsByMenuId, assignPostsToMenu, removeAllPostsFromMenu)
    │   ├── postModel.js            # posts table
    │   └── userModel.js            # users table + auth (changePassword exists but not wired)
    ├── routes/
    │   ├── admin.js                # Protected admin routes (requireAuth middleware)
    │   ├── auth.js                 # /auth/login → /admin/login redirect
    │   ├── language.js             # GET /lang/:lang
    │   └── web.js                  # Public routes
    ├── locales/
    │   ├── vi.json                 # Vietnamese translations
    │   └── en.json                 # English translations
    ├── utils/
    │   ├── slugify.js              # Vietnamese-aware slug generator
    │   └── safeFilePath.js         # safeUnlink + safeResolve (path traversal prevention)
    └── views/
        ├── admin/                  # 15 EJS templates (hardcoded Vietnamese, no i18n)
        │   ├── contact-detail.ejs, contact-list.ejs
        │   ├── dashboard.ejs, login.ejs
        │   ├── document-create.ejs, document-list.ejs
        │   ├── gallery.ejs
        │   ├── job-list.ejs, job-create.ejs, job-edit.ejs
        │   ├── menu-form.ejs, menu-list.ejs
        │   └── post-create.ejs, post-edit.ejs, post-list.ejs
        ├── partials/
        │   ├── mpc-header.ejs      # Public header: dynamic menus from visibleMenus, language pill
        │   ├── mpc-footer.ejs      # Public footer: 4-column navy, social icons, contact info
        │   ├── admin-sidebar.ejs   # Admin sidebar (Dashboard, Posts, Docs, Gallery, Contacts, Jobs, Menus)
        │   ├── header.ejs          # Legacy admin header
        │   └── footer.ejs          # Legacy admin footer
        └── web/                    # 13 EJS templates (i18n enabled, mpc-header/mpc-footer)
            ├── home.ejs            # Landing page (all 11 sections)
            ├── about.ejs           # About MPC
            ├── org-chart.ejs       # Organization chart (CSS tree: HĐQT → TGĐ → 3 Deputies → 11 depts)
            ├── recruitment.ejs     # Careers list (loads jobs from DB)
            ├── job-detail.ejs      # Job detail (breadcrumb, content, apply modal, sidebar)
            ├── posts.ejs, post-detail.ejs
            ├── gallery.ejs
            ├── documents.ejs
            ├── contact.ejs
            ├── menu-page.ejs
            └── 404.ejs, error.ejs
```

---

## 3. Database Schema

### 3.1 Table Definitions

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `users` | id, username, password_hash, role, created_at | Admin accounts |
| `posts` | id, title, slug, excerpt, content, thumbnail, status, title_en, excerpt_en, content_en, created_at, updated_at | Blog posts (bilingual) |
| `documents` | id, title, filename, filepath, description, created_at | PDF uploads |
| `gallery_images` | id, filename, filepath, alt_text, created_at | Image gallery |
| `contacts` | id, full_name, email, subject, phone, message, is_read, created_at | Contact submissions |
| `menus` | id, name_vi, name_en, slug, type, linked_post_id, is_visible, sort_order, created_at, updated_at | Navigation items |
| `menu_posts` | id, menu_id, post_id, sort_order, created_at | Junction for post_list menus (UNIQUE menu_id+post_id) |
| `jobs` | id, title, slug, content, salary, hiring_count, deadline, thumbnail, status, title_en, content_en, created_at, updated_at | Job listings (bilingual) |

### 3.2 Menu Types

| Type | Behavior | URL | Examples |
|------|----------|-----|----------|
| `system` | Fixed pages — cannot delete/change type/slug | Uses slug directly | `/`, `/about`, `/so-do-to-chuc`, `/tuyen-dung`, `/posts`, `/gallery`, `/documents`, `/contact` |
| `single_post` | Links to one post | `/posts/:slug` | About Us article |
| `post_list` | Dropdown on hover | `#` | Giới thiệu → sub-items |
| `custom` | External link | Custom URL | External sites |

### 3.3 Seed Data

- Default admin: `admin` / `admin123` (env: `ADMIN_USERNAME` / `ADMIN_PASSWORD`)
- **8 system menus** (fresh install): Home, About, Org Chart, Recruitment, Posts, Gallery, Documents, Contact
- **Auto-insert on startup** (existing DBs): `/so-do-to-chuc`, `/about`, `/tuyen-dung` — inserted if slug not found
- **20 seed job listings** (if `jobs` table empty): port/maritime roles, mix of published/draft

---

## 4. Feature → File Mapping

### 4.1 Posts Management
```yaml
model: src/models/postModel.js
controller: src/controllers/postController.js
routes:
  public:  GET /posts, GET /posts/:slug
  admin:   GET/POST /admin/posts/create, GET/POST /admin/posts/:id/edit, POST /admin/posts/:id/delete
views:
  - src/views/web/posts.ejs, post-detail.ejs
  - src/views/admin/post-list.ejs, post-create.ejs, post-edit.ejs
features:
  - Bilingual (title/excerpt/content + _en variants)
  - Thumbnail upload (uploadImage middleware)
  - Status draft/published, auto slug generation
```

### 4.2 Gallery Management
```yaml
model: src/models/galleryModel.js
controller: src/controllers/galleryController.js
routes:
  public: GET /gallery
  admin:  POST /admin/gallery/upload, POST /admin/gallery/:id/delete
views:
  - src/views/web/gallery.ejs
  - src/views/admin/gallery.ejs
features:
  - Multi-image upload (uploadGallery, up to 20 files)
  - Physical file deletion on delete
  - No edit for alt_text after upload (known issue #4)
```

### 4.3 Documents Management
```yaml
model: src/models/documentModel.js
controller: src/controllers/documentController.js
routes:
  public: GET /documents, GET /documents/:id/download
  admin:  GET/POST /admin/documents/create, POST /admin/documents/:id/delete
views:
  - src/views/web/documents.ejs
  - src/views/admin/document-list.ejs, document-create.ejs
features:
  - PDF-only upload (uploadPdf, 20MB limit)
  - res.download() for file serving
  - No edit after create (known issue #3)
```

### 4.4 Contact Form
```yaml
model: src/models/contactModel.js
controller: src/controllers/contactController.js
routes:
  public: GET /contact, POST /contact
  admin:  GET /admin/contacts, GET /admin/contacts/:id, POST /admin/contacts/:id/delete
views:
  - src/views/web/contact.ejs
  - src/views/admin/contact-list.ejs, contact-detail.ejs
features:
  - Server-side validation, email format check
  - is_read status toggle on view
  - countUnread() exists in model but not wired to dashboard (known issue #14)
```

### 4.5 Job Listings — Tuyển dụng
```yaml
model: src/models/jobModel.js
controller: src/controllers/jobController.js
routes:
  public: GET /tuyen-dung, GET /tuyen-dung/:slug
  admin:  GET /admin/jobs, GET/POST /admin/jobs/create,
          GET/POST /admin/jobs/:id/edit, POST /admin/jobs/:id/delete
views:
  - src/views/web/recruitment.ejs     # List (loads published jobs from DB)
  - src/views/web/job-detail.ejs      # Detail: breadcrumb, content, apply modal, sidebar
  - src/views/admin/job-list.ejs
  - src/views/admin/job-create.ejs
  - src/views/admin/job-edit.ejs
css:
  - public/css/pages/recruitment.css
  - public/css/pages/job-detail.css   # Ported from view-html/tuyen_dung/chi-tiet-tuyen-dung.css
features:
  - Bilingual (title/content + _en variants)
  - Fields: salary (text), hiring_count (int), deadline (text), thumbnail (optional)
  - Status draft/published
  - getOtherJobs(excludeId) for sidebar on detail page
  - Apply modal (static form, no backend submission)
  - 20 seed jobs preloaded (maritime/port roles)
model_methods:
  getAll, getPublished, getLatest(n), findById, findBySlug,
  getOtherJobs(excludeId, limit), slugExists, create, update, delete, count, countPublished
```

### 4.6 Organization Chart — Sơ đồ Tổ chức
```yaml
route: GET /so-do-to-chuc (inline handler in web.js)
view: src/views/web/org-chart.ejs
css: public/css/pages/org-chart.css
system_menu: slug=/so-do-to-chuc, type=system (auto-inserted on startup)
structure:
  Level 1: HĐQT (Board of Directors) + Ban Kiểm soát (Supervisory Board)
  Level 2: Tổng Giám đốc (General Director)
  Level 3: 3 Deputy GDs (Operations / Commercial / Administration)
  Level 4: 11 Departments under the 3 Deputies
features:
  - Pure CSS tree with connecting lines (no JS)
  - MPC brand colors: navy gradient top, red gradient deputies, white dept cards
  - Font Awesome icons per department
  - Stats strip: 3 Deputies, 11 Departments, 200+ employees, 4 shifts/day
  - Fully bilingual (vi/en inline)
  - Responsive: collapses to single column on mobile
  - header override: white bg + navy border (no transparent hero)
```

### 4.7 About Page — Về MPC
```yaml
route: GET /about (inline handler in web.js)
view: src/views/web/about.ejs
css: public/css/pages/about.css (if exists; otherwise uses mpc-base.css)
system_menu: slug=/about, type=system (auto-inserted on startup)
features:
  - Static page with hero banner
  - Bilingual title/content via res.locals.lang
```

### 4.8 Menu System
```yaml
models:
  - src/models/menuModel.js
  - src/models/menuPostModel.js
controller: src/controllers/menuController.js
middleware: src/middlewares/menuMiddleware.js
routes:
  public: GET /menu/:slug
  admin:  GET /admin/menus, GET/POST /admin/menus/create,
          GET/POST /admin/menus/:id/edit, POST /admin/menus/:id/delete,
          POST /admin/menus/:id/toggle-visibility,
          POST /admin/menus/reorder (JSON API)
views:
  - src/views/web/menu-page.ejs
  - src/views/admin/menu-list.ejs, menu-form.ejs
  - src/views/partials/mpc-header.ejs (renders visibleMenus loop)
features:
  - 4 menu types (system, single_post, post_list, custom)
  - Dropdown menus (post_list) rendered via menu_posts junction
  - Visibility toggle (is_visible flag)
  - Drag-drop reorder (sort_order)
  - menuMiddleware loads menus globally → res.locals.visibleMenus
  - mpc-header.ejs: Home rendered separately first, then rest via forEach
```

### 4.9 Multilingual (i18n)
```yaml
middleware: src/middlewares/languageMiddleware.js
routes: src/routes/language.js (GET /lang/:lang)
locales:
  - src/locales/vi.json
  - src/locales/en.json
res.locals exposed: lang, t (full object), __() (dot-path resolver)
pattern:
  - DB: field + field_en columns
  - Views: lang === 'en' && row.field_en ? row.field_en : row.field
  - Static pages: inline ternary in EJS
```

### 4.10 Authentication
```yaml
model: src/models/userModel.js
controller: src/controllers/authController.js
middleware: src/middlewares/authMiddleware.js (requireAuth, redirectIfAuth)
routes: GET/POST /admin/login, POST /admin/logout
view: src/views/admin/login.ejs
features:
  - bcrypt (saltRounds=10, compareSync)
  - Session-based (express-session, 24h expiry)
  - changePassword() exists in model but not wired (known issue #13)
```

### 4.11 File Upload
```yaml
middleware: src/middlewares/uploadMiddleware.js
exports:
  uploadImage:   single, field=thumbnail, 5MB, jpg/png/webp → public/uploads/images/
  uploadGallery: array,  field=images,    5MB each, max 20  → public/uploads/images/
  uploadPdf:     single, field=file,      20MB, pdf only    → public/uploads/pdfs/
patterns:
  - Errors → req.uploadError (check BEFORE any processing in controller)
  - Build path: '/uploads/images/' + req.file.filename
  - On update/delete: safeUnlink(oldPath) from safeFilePath.js
  - Filename: timestamp-random.ext (unique, no collision)
```

---

## 5. Code Patterns

### 5.1 Model Pattern (SYNC — Critical!)
```javascript
const { db } = require('../config/db');

const ModelName = {
  getAll() { return db.prepare('SELECT * FROM table ORDER BY created_at DESC').all(); },
  findById(id) { return db.prepare('SELECT * FROM table WHERE id = ?').get(id); },
  create(data) {
    return db.prepare('INSERT INTO table (col) VALUES (?)').run(data.col).lastInsertRowid;
  },
  update(id, data) {
    return db.prepare('UPDATE table SET col = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(data.col, id);
  },
  delete(id) { return db.prepare('DELETE FROM table WHERE id = ?').run(id); },
  count() { return db.prepare('SELECT COUNT(*) as total FROM table').get().total; }
};
module.exports = ModelName;
```

### 5.2 Controller Pattern
```javascript
const Controller = {
  index(req, res) {                            // public
    res.render('web/items', { title: 'Items', items: Model.getPublished() });
  },
  adminIndex(req, res) {                       // admin list
    res.render('admin/item-list', { title: 'Manage', items: Model.getAll() });
  },
  store(req, res) {                            // admin create
    if (req.uploadError) { req.session.error = req.uploadError; return res.redirect('/admin/items/create'); }
    const { title } = req.body;
    if (!title?.trim()) { req.session.error = 'Required'; return res.redirect('/admin/items/create'); }
    const slug = makeUniqueSlug(slugify(title), (s) => Model.slugExists(s));
    const thumbnail = req.file ? '/uploads/images/' + req.file.filename : null;
    try {
      Model.create({ title: title.trim(), slug, thumbnail, status: req.body.status || 'draft' });
      req.session.success = 'Created';
      return res.redirect('/admin/items');
    } catch (e) {
      req.session.error = 'Error'; return res.redirect('/admin/items/create');
    }
  },
  destroy(req, res) {                          // admin delete
    const item = Model.findById(req.params.id);
    if (!item) { req.session.error = 'Not found'; return res.redirect('/admin/items'); }
    safeUnlink(item.thumbnail);
    Model.delete(req.params.id);
    req.session.success = 'Deleted';
    return res.redirect('/admin/items');
  }
};
```

### 5.3 Bilingual Field Pattern
```javascript
// EJS view:
<%= (lang === 'en' && item.title_en) ? item.title_en : item.title %>

// Controller (static page):
const pageTitle = res.locals.lang === 'en' ? 'English Title' : 'Tiêu đề tiếng Việt';
```

### 5.4 Flash Message Pattern
```javascript
req.session.success = 'Thành công';   // or req.session.error
return res.redirect('/path');
// app.js middleware clears them → available as res.locals.success / res.locals.error
```

---

## 6. AI Working Rules

### ✅ MUST Do
- Use synchronous better-sqlite3: `.get()`, `.all()`, `.run()` — **never `await`**
- Export models as plain objects (not classes)
- Prefix admin controller methods with `admin*`
- Check `req.uploadError` first in any route with file upload middleware
- Flash messages via `req.session.success` / `req.session.error` + redirect
- Add translations to **both** `vi.json` and `en.json`
- Use bilingual DB fields: `field` + `field_en`
- New tables → `src/config/db.js → initDatabase()`
- New system pages → add `system` menu entry in `initDatabase()` (insert-if-not-exists pattern)
- After structural changes → update `CLAUDE.md` and this `SKILL_MAP.md`

### ❌ MUST NOT Do
- Use `async/await` for database operations
- Introduce new frameworks (React, Vue, etc.)
- Change session auth to JWT
- Modify middleware chain order in `app.js`
- Use external ORM (Sequelize, TypeORM)
- Create new database connection instances

---

## 7. Quick Reference

### Admin Sidebar Links (admin-sidebar.ejs)
| Icon | Label | URL | activePage key |
|------|-------|-----|----------------|
| 📊 | Dashboard | /admin | `dashboard` |
| 📝 | Bài viết | /admin/posts | `posts` |
| 📄 | Tài liệu | /admin/documents | `documents` |
| 🖼️ | Thư viện ảnh | /admin/gallery | `gallery` |
| 📬 | Liên hệ | /admin/contacts | `contacts` |
| 💼 | Tuyển dụng | /admin/jobs | `jobs` |
| 📋 | Quản lý Menu | /admin/menus | `menus` |

### Available in Views (`res.locals`)
```javascript
user          // Current logged-in user or null
success       // Flash success message (cleared after use)
error         // Flash error message (cleared after use)
lang          // 'vi' or 'en'
t             // Full translation object (from locales/*.json)
__()          // Translation helper: __('nav.home') → t.nav.home
visibleMenus  // Array of visible menus with children (from menuMiddleware)
csrfToken     // CSRF token (required on all forms that mutate state)
```

### Default Admin Credentials
- URL: `/admin/login`
- Username: `admin`
- Password: `admin123`

---

## 8. MPC Public Design System

### 8.1 Design Tokens

| Element | Value |
|---------|-------|
| Font | Barlow Condensed (local TTF), served from `public/fonts/barlow-condensed/` |
| Primary Red | `#DF1F28` |
| Primary Orange | `#FCB248` |
| Primary Navy | `#2c3e7d` |
| Deep Navy | `#1a2559` |
| Text Dark | `#333333` |
| Text Gray | `#828282` |
| Text Light | `#BDBDBD` |
| CSS Framework | Bootstrap 5 + Bootstrap Icons + Font Awesome 6 — all vendored, fully offline |

### 8.2 CSS Architecture

| File | Used by | Purpose |
|------|---------|---------|
| `style.css` | Admin pages only | Admin panel styles |
| `mpc-base.css` | All public pages | Fonts, variables, buttons, forms, shared components |
| `mpc-header.css` | All public pages | Transparent overlay header, responsive nav, language pill |
| `mpc-footer.css` | All public pages | 4-column navy footer |
| `pages/landing.css` | `home.ejs` | Landing page (~2000 lines) |
| `pages/recruitment.css` | `recruitment.ejs` | Careers list page |
| `pages/job-detail.css` | `job-detail.ejs` | Job detail (header override: white + navy border) |
| `pages/org-chart.css` | `org-chart.ejs` | Org chart (CSS tree lines, gradient cards) |

### 8.3 Header Rendering Logic (`mpc-header.ejs`)

1. If `visibleMenus` not empty: render Home menu first (slug=`/`), then loop remaining menus
2. Fallback (empty menus): hardcoded static links
3. Menu types in loop: `post_list` with children → dropdown `<ul class="sub-menu">`, others → plain `<a>`
4. `currentPath` variable controls active class
5. For job-detail and org-chart pages: CSS overrides header to white bg + navy border bottom

### 8.4 Page CSS Override Pattern
Pages without a hero banner (e.g. job-detail, org-chart) override the transparent header to be solid:
```css
.mpc-header {
  position: relative !important;
  background: #ffffff !important;
  border-bottom: 35px solid #1c2b5e !important;
}
.nav-menu li a { color: #333333 !important; text-shadow: none !important; }
```

### 8.5 Prototype vs CMS Status

| Aspect | Status | Notes |
|--------|--------|-------|
| Branding | **DONE** | MPC logo, Barlow Condensed, red/orange/navy on all public pages |
| Header | **DONE** | `mpc-header.ejs` — dynamic menus from DB, language pill |
| Footer | **DONE** | `mpc-footer.ejs` — 4-column navy, social icons, contact info |
| CSS framework | **DONE** | Bootstrap 5 + Bootstrap Icons + Font Awesome vendored |
| Landing page | **DONE** | All 11 sections in `home.ejs` with i18n |
| About page | **DONE** | `/about`, `about.ejs`, system menu in DB |
| Org Chart | **DONE** | `/so-do-to-chuc`, `org-chart.ejs`, CSS tree, system menu in DB |
| Recruitment | **DONE** | `/tuyen-dung` + `/:slug`, DB-driven, admin CRUD, 20 seed jobs |
| All other public pages | **DONE** | Posts, Gallery, Documents, Contact, Menu-page, 404, Error |
| Admin pages | **Unchanged** | Still use `header.ejs`/`footer.ejs` + `style.css` |
| Infrastructure page | **Pending** | No dedicated route/view yet |
| Services page | **Pending** | No dedicated route/view yet |
