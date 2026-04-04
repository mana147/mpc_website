# 🗺️ MINI CMS PROJECT SKILL MAP

> **Purpose**: This document provides a comprehensive understanding of the Mini CMS codebase for AI agents and developers.
> **Auto-generated**: April 2, 2026
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
├── .env / .env.example             # Environment config
├── database/
│   └── cms.sqlite                  # SQLite database file
├── public/                         # Static assets
│   ├── css/style.css               # Main stylesheet
│   ├── js/main.js                  # Client-side JS
│   └── uploads/
│       ├── images/                 # Uploaded images
│       └── pdfs/                   # Uploaded PDFs
└── src/
    ├── config/
    │   └── db.js                   # Database init & schema
    ├── controllers/                # Request handlers
    │   ├── adminController.js      # Dashboard
    │   ├── authController.js       # Login/logout
    │   ├── contactController.js    # Contact CRUD
    │   ├── documentController.js   # Document CRUD
    │   ├── galleryController.js    # Gallery CRUD
    │   ├── menuController.js       # Menu CRUD + public page
    │   └── postController.js       # Post CRUD
    ├── middlewares/
    │   ├── authMiddleware.js       # requireAuth, redirectIfAuth
    │   ├── languageMiddleware.js   # i18n (lang, t, __)
    │   ├── menuMiddleware.js       # loadMenus → visibleMenus
    │   └── uploadMiddleware.js     # Multer config (image, pdf, gallery)
    ├── models/                     # Database operations (SYNC!)
    │   ├── contactModel.js         # contacts table
    │   ├── documentModel.js        # documents table
    │   ├── galleryModel.js         # gallery_images table
    │   ├── menuModel.js            # menus table
    │   ├── menuPostModel.js        # menu_posts junction table
    │   ├── postModel.js            # posts table
    │   └── userModel.js            # users table + auth
    ├── routes/
    │   ├── admin.js                # Protected admin routes
    │   ├── auth.js                 # Auth redirects
    │   ├── language.js             # /lang/:lang switch
    │   └── web.js                  # Public routes
    ├── locales/
    │   ├── vi.json                 # Vietnamese translations
    │   └── en.json                 # English translations
    ├── utils/
    │   └── slugify.js              # Vietnamese-aware slug generator
    └── views/
        ├── admin/                  # Admin panel views
        ├── web/                    # Public views
        └── partials/               # Shared partials
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
  - uploadImage (single, 5MB, jpg/png/webp)
  - uploadGallery (multiple, 5MB each)
  - uploadPdf (single, 20MB)
storage:
  - public/uploads/images/
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
  "express-session": "^1.18.0",
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
__()          // Translation helper function
visibleMenus  // Dynamic menus with children
```
