# 🗺️ MINI CMS PROJECT SKILL MAP

> **Purpose**: This document provides a comprehensive understanding of the Mini CMS codebase for AI agents and developers.
> **Last updated**: April 11, 2026
> **Related**: See also [copilot-instructions.md](./copilot-instructions.md) for coding guidelines.

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
│    /lang/* → /admin/* → /auth/* → /* (web)                              │
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

### 1.2 Request Flow

```
HTTP Request
    │
    ▼
app.js (Express)
    │
    ├─► Middleware Chain:
    │   ├─ express.urlencoded() - Parse form data
    │   ├─ express.static() - Serve /public
    │   ├─ session() - Session management
    │   ├─ Flash messages - Clear after use
    │   ├─ languageMiddleware - i18n (lang, t, __)
    │   └─ menuMiddleware - Load visibleMenus
    │
    ▼
Router (web.js / admin.js)
    │
    ▼
Controller Method
    │
    ├─► Validate input
    ├─► Call Model (SYNC - NO async/await!)
    ├─► Process business logic
    └─► res.render() or redirect
            │
            ▼
        EJS Template
            │
            ▼
        HTML Response
```

### 1.3 Key Architectural Decisions

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
├── app.js                          # Entry point
├── package.json                    # Dependencies
├── database/
│   └── cms.sqlite                  # SQLite database file (WAL mode)
├── public/
│   ├── css/
│   │   ├── style.css               # Admin panel styles (~1955 lines)
│   │   ├── mpc-base.css            # MPC shared: fonts, variables, buttons, forms
│   │   ├── mpc-header.css          # MPC header (transparent overlay, responsive)
│   │   ├── mpc-footer.css          # MPC footer (4-column, navy background)
│   │   └── pages/
│   │       └── landing.css         # Landing page CSS (~2000 lines, 5 breakpoints)
│   ├── fonts/
│   │   └── barlow-condensed/       # Barlow Condensed TTF (6 weights)
│   ├── images/
│   │   ├── icons/                  # 18 SVG icons (geo-*, eport, container, etc.)
│   │   ├── logo.png                # MPC Port logo
│   │   └── map-vietnam.svg         # Vietnam map for geo section
│   ├── js/
│   │   ├── main.js                 # Admin: alerts, confirm delete, thumbnail preview
│   │   └── landing.js              # Landing: mobile menu, sliders, carousels
│   ├── uploads/
│   │   ├── images/                 # Uploaded images (flat, multer saves here)
│   │   │   ├── about/              # Pre-created static asset subfolders
│   │   │   ├── Dịch vụ/
│   │   │   ├── Hạ tầng/
│   │   │   ├── Liên hệ/
│   │   │   ├── Thư viện/
│   │   │   ├── Tin tức/
│   │   │   ├── Trang chủ/
│   │   │   └── Tuyển dụng/
│   │   └── pdfs/                   # Uploaded PDF files
│   └── vendor/                     # Offline vendor libs (no CDN required)
│       ├── bootstrap/
│       │   ├── css/bootstrap.min.css
│       │   └── js/bootstrap.bundle.min.js
│       ├── bootstrap-icons/
│       │   ├── bootstrap-icons.css
│       │   └── fonts/
│       └── font-awesome/
│           ├── css/all.min.css
│           └── webfonts/
└── src/
    ├── config/
    │   └── db.js                   # Database init & schema (CREATE TABLE IF NOT EXISTS)
    ├── controllers/                # Request handlers (public + admin* prefix)
    │   ├── adminController.js      # Dashboard stats
    │   ├── authController.js       # Login/logout (bcrypt)
    │   ├── contactController.js    # Contact form + admin CRUD
    │   ├── documentController.js   # Document upload/download + admin
    │   ├── galleryController.js    # Gallery view + admin upload/delete
    │   ├── menuController.js       # Menu CRUD + visibility toggle + reorder + public page
    │   └── postController.js       # Post full CRUD (bilingual)
    ├── middlewares/
    │   ├── authMiddleware.js       # requireAuth, redirectIfAuth
    │   ├── languageMiddleware.js   # i18n (lang, t, __)
    │   ├── menuMiddleware.js       # loadMenus → res.locals.visibleMenus
    │   └── uploadMiddleware.js     # Multer (uploadImage, uploadGallery, uploadPdf)
    ├── models/                     # Database operations (SYNC — no async/await!)
    │   ├── contactModel.js         # contacts table
    │   ├── documentModel.js        # documents table
    │   ├── galleryModel.js         # gallery_images table
    │   ├── menuModel.js            # menus table
    │   ├── menuPostModel.js        # menu_posts junction table
    │   ├── postModel.js            # posts table
    │   └── userModel.js            # users table + auth
    ├── routes/
    │   ├── admin.js                # Protected admin routes (requireAuth)
    │   ├── auth.js                 # Simple redirects: /auth/login → /admin/login
    │   ├── language.js             # GET /lang/:lang — switch language via session
    │   └── web.js                  # Public routes (home inline handler)
    ├── locales/
    │   ├── vi.json                 # Vietnamese translations
    │   └── en.json                 # English translations
    ├── utils/
    │   ├── slugify.js              # Vietnamese-aware slug generator
    │   └── safeFilePath.js         # safeUnlink + safeResolve — path traversal prevention
    └── views/
        ├── admin/                  # 12 EJS templates (hardcoded Vietnamese, no i18n)
        │   ├── contact-detail.ejs, contact-list.ejs
        │   ├── dashboard.ejs
        │   ├── document-create.ejs, document-list.ejs
        │   ├── gallery.ejs, login.ejs
        │   ├── menu-form.ejs, menu-list.ejs
        │   └── post-create.ejs, post-edit.ejs, post-list.ejs
        ├── partials/
        │   ├── mpc-header.ejs      # MPC public header (transparent overlay, dynamic menus)
        │   ├── mpc-footer.ejs      # MPC public footer (4-column, navy, social icons)
        │   ├── admin-sidebar.ejs   # Admin sidebar navigation
        │   ├── header.ejs          # Legacy admin header
        │   └── footer.ejs          # Legacy admin footer
        └── web/                    # 9 EJS templates (i18n enabled, mpc-header/mpc-footer)
            ├── home.ejs            # Landing page (all 11 sections ported from prototype)
            ├── posts.ejs, post-detail.ejs
            ├── gallery.ejs
            ├── documents.ejs
            ├── contact.ejs
            ├── menu-page.ejs
            ├── 404.ejs, error.ejs
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    users    │      │    posts    │      │  documents  │
├─────────────┤      ├─────────────┤      ├─────────────┤
│ id (PK)     │      │ id (PK)     │      │ id (PK)     │
│ username    │      │ title       │      │ title       │
│ password_h  │      │ slug        │      │ filename    │
│ role        │      │ excerpt     │      │ filepath    │
└─────────────┘      │ content     │      │ description │
                     │ thumbnail   │      └─────────────┘
                     │ status      │
                     │ title_en    │      ┌───────────────┐
                     │ excerpt_en  │      │ gallery_images│
                     │ content_en  │      ├───────────────┤
                     └─────┬───────┘      │ id (PK)       │
                           │              │ filename      │
              ┌────────────┼──────────┐   │ filepath      │
              │            │          │   │ alt_text      │
              ▼            ▼          ▼   └───────────────┘
┌─────────────┐      ┌───────────┐
│    menus    │      │menu_posts │      ┌─────────────┐
├─────────────┤      ├───────────┤      │  contacts   │
│ id (PK)     │◄─────│ menu_id   │      ├─────────────┤
│ name_vi     │      │ post_id   │──────►│ id (PK)     │
│ name_en     │      │ sort_order│      │ full_name   │
│ slug        │      └───────────┘      │ email       │
│ type        │                         │ subject     │
│ linked_post │──────────────────────►  │ phone       │
│ is_visible  │                         │ message     │
│ sort_order  │                         │ is_read     │
└─────────────┘                         └─────────────┘
```

### 3.2 Table Definitions

| Table | Columns | Purpose |
|-------|---------|---------|
| `users` | id, username, password_hash, role, created_at | Admin accounts |
| `posts` | id, title, slug, excerpt, content, thumbnail, status, title_en, excerpt_en, content_en, created_at, updated_at | Blog posts (bilingual) |
| `documents` | id, title, filename, filepath, description, created_at | PDF uploads |
| `gallery_images` | id, filename, filepath, alt_text, created_at | Image gallery |
| `contacts` | id, full_name, email, subject, phone, message, is_read, created_at | Contact submissions |
| `menus` | id, name_vi, name_en, slug, type, linked_post_id, is_visible, sort_order, created_at, updated_at | Navigation items |
| `menu_posts` | id, menu_id, post_id, sort_order, created_at | Junction for post_list menus |

### 3.3 Menu Types

| Type | Behavior | URL | Use Case |
|------|----------|-----|----------|
| `system` | Fixed pages | Uses slug directly | Home, Posts, Gallery, Documents, Contact |
| `single_post` | Links to one post | `/posts/:slug` | About Us, Services |
| `post_list` | Dropdown menu | `#` (hover for dropdown) | Products → Product A, B, C |
| `custom` | External link | Custom URL | External site links |

---

## 4. Feature → File Mapping

### 4.1 Posts Management
```yaml
model: src/models/postModel.js
controller: src/controllers/postController.js
routes: 
  - GET /posts (public list)
  - GET /posts/:slug (public detail)
  - GET /admin/posts (admin list)
  - GET /admin/posts/create
  - POST /admin/posts/create
  - GET /admin/posts/:id/edit
  - POST /admin/posts/:id/edit
  - POST /admin/posts/:id/delete
views:
  - src/views/web/posts.ejs
  - src/views/web/post-detail.ejs
  - src/views/admin/post-list.ejs
  - src/views/admin/post-create.ejs
  - src/views/admin/post-edit.ejs
features:
  - Bilingual content (title, excerpt, content + _en variants)
  - Thumbnail upload
  - Status (draft/published)
  - Auto slug generation
```

### 4.2 Gallery Management
```yaml
model: src/models/galleryModel.js
controller: src/controllers/galleryController.js
routes:
  - GET /gallery (public)
  - GET /admin/gallery
  - POST /admin/gallery/upload (multiple files)
  - POST /admin/gallery/:id/delete
views:
  - src/views/web/gallery.ejs
  - src/views/admin/gallery.ejs
features:
  - Multi-image upload
  - Physical file deletion
```

### 4.3 Documents Management
```yaml
model: src/models/documentModel.js
controller: src/controllers/documentController.js
routes:
  - GET /documents (public list)
  - GET /documents/:id/download
  - GET /admin/documents
  - GET /admin/documents/create
  - POST /admin/documents/create
  - POST /admin/documents/:id/delete
views:
  - src/views/web/documents.ejs
  - src/views/admin/document-list.ejs
  - src/views/admin/document-create.ejs
features:
  - PDF-only upload
  - Download endpoint
```

### 4.4 Contact Form
```yaml
model: src/models/contactModel.js
controller: src/controllers/contactController.js
routes:
  - GET /contact
  - POST /contact
  - GET /admin/contacts
  - GET /admin/contacts/:id
  - POST /admin/contacts/:id/delete
views:
  - src/views/web/contact.ejs
  - src/views/admin/contact-list.ejs
  - src/views/admin/contact-detail.ejs
features:
  - Form validation
  - Email format check
  - is_read status
```

### 4.5 Menu System
```yaml
models:
  - src/models/menuModel.js
  - src/models/menuPostModel.js
controller: src/controllers/menuController.js
middleware: src/middlewares/menuMiddleware.js
routes:
  - GET /menu/:slug (public page)
  - GET /admin/menus
  - GET /admin/menus/create
  - POST /admin/menus/create
  - GET /admin/menus/:id/edit
  - POST /admin/menus/:id/edit
  - POST /admin/menus/:id/delete
  - POST /admin/menus/:id/toggle-visibility
  - POST /admin/menus/reorder (JSON API)
views:
  - src/views/web/menu-page.ejs
  - src/views/admin/menu-list.ejs
  - src/views/admin/menu-form.ejs
  - src/views/partials/header.ejs (dropdown rendering)
features:
  - 4 menu types (system, single_post, post_list, custom)
  - Dropdown menus via post_list
  - Visibility toggle
  - Drag-drop reorder
  - Global middleware loading
```

### 4.6 Multilingual (i18n)
```yaml
middleware: src/middlewares/languageMiddleware.js
routes: src/routes/language.js
locales:
  - src/locales/vi.json
  - src/locales/en.json
features:
  - Session-based language storage
  - res.locals: lang, t, __()
  - Bilingual DB fields pattern
```

### 4.7 Authentication
```yaml
model: src/models/userModel.js
controller: src/controllers/authController.js
middleware: src/middlewares/authMiddleware.js
routes:
  - GET /admin/login
  - POST /admin/login
  - POST /admin/logout
views:
  - src/views/admin/login.ejs
features:
  - bcrypt password hashing
  - Session-based auth
  - Default: admin / admin123
```

### 4.8 File Upload
```yaml
middleware: src/middlewares/uploadMiddleware.js
exports:
  - uploadImage (single, field: thumbnail, 5MB, jpg/png/webp) → public/uploads/images/
  - uploadGallery (array, field: images, max 20 files, 5MB each) → public/uploads/images/
  - uploadPdf (single, field: file, 20MB, PDF only) → public/uploads/pdfs/
storage:
  - public/uploads/images/ (flat — multer saves all uploads here regardless of subfolder)
  - public/uploads/pdfs/
patterns:
  - req.file / req.files
  - req.uploadError for validation errors
  - Unique filename: timestamp-random.ext
```

---

## 5. AI Agent Skills

### Skill: Manage Posts
```
Operations:
  - Create: POST /admin/posts/create + uploadImage middleware
  - Read: GET /posts/:slug, GET /admin/posts
  - Update: POST /admin/posts/:id/edit + uploadImage middleware
  - Delete: POST /admin/posts/:id/delete (+ remove thumbnail file)

Required Knowledge:
  - Slug generation with Vietnamese support
  - Bilingual fields pattern
  - Status management (draft/published)
  - File upload handling
```

### Skill: Manage Gallery
```
Operations:
  - Upload multiple: POST /admin/gallery/upload + uploadGallery middleware
  - Delete: POST /admin/gallery/:id/delete

Required Knowledge:
  - Multi-file upload
  - createMany() batch insert
  - Physical file deletion
```

### Skill: Manage Documents
```
Operations:
  - Upload: POST /admin/documents/create + uploadPdf middleware
  - Download: GET /documents/:id/download
  - Delete: POST /admin/documents/:id/delete

Required Knowledge:
  - PDF-only validation
  - res.download() for file serving
```

### Skill: Menu System
```
Operations:
  - Create menu: POST /admin/menus/create
  - Edit menu: POST /admin/menus/:id/edit
  - Assign posts to post_list: Via post_ids[] array
  - Toggle visibility: POST /admin/menus/:id/toggle-visibility
  - Reorder: POST /admin/menus/reorder (JSON)

Required Knowledge:
  - 4 menu types and their behaviors
  - Junction table for many-to-many
  - menuMiddleware global loading
  - header.ejs dropdown rendering
```

### Skill: Multilingual Content
```
Operations:
  - Switch language: GET /lang/:lang
  - Render bilingual content in views

Required Knowledge:
  - Session storage (req.session.lang)
  - res.locals: lang, t, __()
  - Conditional field rendering in EJS
```

### Skill: File Upload
```
Operations:
  - Single image: uploadImage middleware
  - Multiple images: uploadGallery middleware
  - Single PDF: uploadPdf middleware

Required Knowledge:
  - Check req.uploadError first
  - Build filepath: '/uploads/images/' + req.file.filename
  - Delete old files on update/delete
```

---

## 6. Code Patterns

### 6.1 Model Pattern (SYNC - Critical!)
```javascript
const { db } = require('../config/db');

const ModelName = {
  getAll() {
    return db.prepare('SELECT * FROM table').all();  // SYNC!
  },
  findById(id) {
    return db.prepare('SELECT * FROM table WHERE id = ?').get(id);  // SYNC!
  },
  create(data) {
    return db.prepare('INSERT INTO table (field) VALUES (?)').run(data.field);
  },
  update(id, data) {
    return db.prepare('UPDATE table SET field = ? WHERE id = ?').run(data.field, id);
  },
  delete(id) {
    return db.prepare('DELETE FROM table WHERE id = ?').run(id);
  }
};

module.exports = ModelName;
```

### 6.2 Controller Pattern
```javascript
const Controller = {
  // PUBLIC
  index(req, res) {
    const items = Model.getAll();
    res.render('web/items', { title: 'Items', items });
  },
  
  // ADMIN
  adminIndex(req, res) {
    const items = Model.getAll();
    res.render('admin/item-list', { title: 'Manage Items', items });
  },
  
  store(req, res) {
    // 1. Handle upload error
    if (req.uploadError) {
      req.session.error = req.uploadError;
      return res.redirect('/admin/items/create');
    }
    
    // 2. Validate
    const { name } = req.body;
    if (!name?.trim()) {
      req.session.error = 'Name required';
      return res.redirect('/admin/items/create');
    }
    
    // 3. Create (SYNC)
    Model.create({ name: name.trim() });
    
    // 4. Flash + redirect
    req.session.success = 'Created successfully';
    return res.redirect('/admin/items');
  },
  
  destroy(req, res) {
    const item = Model.findById(req.params.id);
    if (!item) {
      req.session.error = 'Not found';
      return res.redirect('/admin/items');
    }
    
    // Delete file if exists
    if (item.filepath) {
      const filePath = path.join(__dirname, '../../public', item.filepath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    
    Model.delete(req.params.id);
    req.session.success = 'Deleted';
    return res.redirect('/admin/items');
  }
};
```

### 6.3 Bilingual Content Pattern
```javascript
// In EJS views:
<%= lang === 'en' && post.title_en ? post.title_en : post.title %>

// For menus:
const menuName = (lang === 'en' && menu.name_en) ? menu.name_en : menu.name_vi;
```

### 6.4 Flash Message Pattern
```javascript
// Set
req.session.success = 'Success message';
req.session.error = 'Error message';
return res.redirect('/path');

// Already cleared in app.js middleware, access via:
// res.locals.success, res.locals.error
```

### 6.5 Slug Generation Pattern
```javascript
const { slugify, makeUniqueSlug } = require('../utils/slugify');
const baseSlug = slugify(title);  // Vietnamese-aware
const slug = makeUniqueSlug(baseSlug, (s) => Model.slugExists(s, excludeId));
```

---

## 7. AI Working Rules

### ✅ MUST Do
```yaml
- Use SYNCHRONOUS better-sqlite3 methods (.get, .all, .run)
- Follow existing folder structure
- Export models as objects (not classes)
- Use public + admin* method naming in controllers
- Handle req.uploadError for file uploads
- Use req.session.success/error for flash messages
- Add translations to BOTH vi.json and en.json
- Use bilingual DB fields: field + field_en
- Add new tables in src/config/db.js → initDatabase()
```

### ❌ MUST NOT Do
```yaml
- Use async/await for database operations
- Introduce new frameworks (React, Vue, etc.)
- Change session-based auth to JWT
- Modify middleware chain order in app.js
- Use external ORM (Sequelize, TypeORM)
- Create new database connection instances
- Import db directly, always use require('../config/db')
```

### 📝 New Feature Template
```javascript
// 1. Add table in src/config/db.js → initDatabase()
db.exec(`
  CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 2. Create src/models/featureModel.js
const { db } = require('../config/db');
const FeatureModel = {
  getAll() { return db.prepare('SELECT * FROM features').all(); },
  findById(id) { return db.prepare('SELECT * FROM features WHERE id = ?').get(id); },
  create(data) { return db.prepare('INSERT INTO features (name) VALUES (?)').run(data.name); },
  delete(id) { return db.prepare('DELETE FROM features WHERE id = ?').run(id); }
};
module.exports = FeatureModel;

// 3. Create src/controllers/featureController.js
const FeatureModel = require('../models/featureModel');
const FeatureController = {
  index(req, res) {
    res.render('web/features', { title: 'Features', features: FeatureModel.getAll() });
  },
  adminIndex(req, res) {
    res.render('admin/feature-list', { title: 'Manage Features', features: FeatureModel.getAll() });
  },
  store(req, res) {
    if (!req.body.name?.trim()) {
      req.session.error = 'Name required';
      return res.redirect('/admin/features/create');
    }
    FeatureModel.create({ name: req.body.name.trim() });
    req.session.success = 'Created';
    return res.redirect('/admin/features');
  }
};
module.exports = FeatureController;

// 4. Add routes in src/routes/admin.js
const FeatureController = require('../controllers/featureController');
router.get('/features', FeatureController.adminIndex);
router.post('/features/create', FeatureController.store);

// 5. Add translations in src/locales/vi.json and en.json
```

---

## 8. Quick Reference

### Dependencies
```json
{
  "bcrypt": "^5.1.1",
  "better-sqlite3": "^9.4.3",
  "dotenv": "^16.4.5",
  "ejs": "^3.1.9",
  "express": "^4.18.2",
  "express-rate-limit": "latest",
  "express-session": "^1.18.0",
  "file-type": "^16.0.0",
  "helmet": "latest",
  "multer": "^1.4.5-lts.1"
}
```

### Commands
```bash
cd mini-cms
npm install        # Install dependencies
npm run dev        # Start with nodemon
npm start          # Production start
```

### Default Admin
- URL: `/admin/login`
- Username: `admin`
- Password: `admin123`

### Available in Views (res.locals)
```javascript
user          // Current logged-in user or null
success       // Flash success message
error         // Flash error message
lang          // Current language ('vi' or 'en')
t             // Full translation object
__()          // Translation helper function (dot-path key resolver)
visibleMenus  // Dynamic menus with children (from menuMiddleware)
```

---

## 9. MPC Public Design System

### 9.1 Design Stack

| Element | Value |
|---------|-------|
| Font | Barlow Condensed (local TTF, 6 weights), served from `public/fonts/barlow-condensed/` |
| Primary colors | Red `#DF1F28`, Orange `#FCB248`, Navy `#2c3e7d` |
| Text colors | Dark `#333333`, Gray `#828282`, Light gray `#BDBDBD` |
| CSS framework | Bootstrap 5 (vendored) + Bootstrap Icons (vendored) + Font Awesome 6 (vendored) |
| Vendor location | `public/vendor/` — fully offline, no CDN |

### 9.2 CSS Architecture

| File | Used by | Purpose |
|------|---------|--------|
| `public/css/style.css` | Admin pages only | Admin panel styles (~1955 lines) |
| `public/css/mpc-base.css` | All public pages | Fonts, CSS variables, buttons, forms, page components |
| `public/css/mpc-header.css` | All public pages | Transparent overlay header, responsive nav, language pill |
| `public/css/mpc-footer.css` | All public pages | 4-column navy footer |
| `public/css/pages/landing.css` | `home.ejs` only | Landing page specific (~2000 lines, 5 breakpoints) |

### 9.3 Partials Structure

| Partial | Used by | Includes |
|---------|---------|----------|
| `partials/mpc-header.ejs` | All public web pages | Bootstrap 5, Bootstrap Icons, FA, mpc-base.css, mpc-header.css, vendor CSS |
| `partials/mpc-footer.ejs` | All public web pages | 4-column footer, social icons, contact info, mpc-footer.css |
| `partials/header.ejs` | Admin pages | Legacy admin header |
| `partials/footer.ejs` | Admin pages | Legacy admin footer |
| `partials/admin-sidebar.ejs` | All admin pages | Sidebar nav links |

### 9.4 Landing Page Sections (home.ejs)

All 11 sections ported from `view-html/trang_chu/landing.html` with full i18n:

| # | Section | Key Classes |
|---|---------|-------------|
| 1 | Header | via `mpc-header.ejs` |
| 2 | Hero Banner | `.hero-section`, `.hero-overlay` |
| 3 | Quick Nav | `.nav-bar`, `.nav-option` (4 icon buttons) |
| 4 | About | `.about-section` (2-col, company intro) |
| 5 | Port Image | `.port-image-section` (panorama, offset) |
| 6 | Geo Location | `.geo-section`, Vietnam SVG map + 6 specs |
| 7 | Facility | `.facility`, tabbed panel + image slider |
| 8 | Services | `.wrapper`, service carousel (4×4 cards) |
| 9 | Image Library | `.gallery-section`, 3-col auto-slide |
| 10 | News & Events | `.news-section`, 2-col news list |
| 11 | Footer | via `mpc-footer.ejs` |

### 9.5 Prototype vs CMS Status

| Aspect | Status | Notes |
|--------|--------|-------|
| Branding | **DONE** | MPC Port logo, Barlow Condensed, red/orange/navy on all public pages |
| Header | **DONE** | `mpc-header.ejs` — transparent overlay, dynamic menus, language pill |
| Footer | **DONE** | `mpc-footer.ejs` — 4-column grid, navy, social icons, contact info |
| CSS framework | **DONE** | Bootstrap 5 + Bootstrap Icons + Font Awesome vendored in `public/vendor/` |
| Landing page | **DONE** | All 11 sections in `home.ejs` with i18n |
| Assets | **DONE** | Fonts, icons, logo, map-vietnam.svg in `public/` |
| All public pages | **DONE** | Posts, Gallery, Documents, Contact, Menu-page, 404, Error use mpc-header/mpc-footer |
| Admin pages | **Unchanged** | Still use `header.ejs`/`footer.ejs` + `style.css` |
| About page | **Pending** | No dedicated route/view yet |
| Infrastructure page | **Pending** | No dedicated route/view yet |
| Services page | **Pending** | No dedicated route/view yet |
| Recruitment page | **Pending** | No dedicated route/view yet |
