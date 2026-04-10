# CLAUDE.md

This file provides guidance to Claude Code when working with this repository. It is the **single source of truth** — all architecture, schema, conventions, and rules are here.

Detailed reference (optional deep-dive): `.github/SKILL_MAP.md`. After any structural change (new feature, table, model, controller, route, middleware), update SKILL_MAP.md accordingly.

## Repository Layout

- **`mini-cms/`** — Node.js/Express CMS with EJS server-rendered views and SQLite. Main application.
- **`view-html/`** — Static HTML/CSS/JS prototypes (e.g. `view-html/trang_chu/landing.html`) used as design references. No build step.

## Commands

```bash
cd mini-cms
npm install        # Install deps
npm run dev        # Start with nodemon (auto-reload)
npm start          # Production start
```

No test suite, no linter, no build step. Default admin: `admin` / `admin123` at `/admin/login`.

---

## Architecture (mini-cms)

### MVC Pattern

```
app.js → middleware chain → routes/ → controllers/ → models/ → config/db.js (better-sqlite3)
                                                        ↓
                                                     views/ (EJS)
```

### Middleware Order (load-bearing — do NOT reorder)

`urlencoded → static → session → flash-clear → languageMiddleware → menuMiddleware → routes`

### Route Mounting Order

`/lang/*` → `/*` (public web) → `/admin/*` (protected by `requireAuth`) → `/auth/*`

### Folder Structure

```
mini-cms/src/
├── config/db.js              # DB init & schema (CREATE TABLE IF NOT EXISTS)
├── controllers/              # Request handlers (public + admin* in same file)
│   ├── adminController.js    # Dashboard
│   ├── authController.js     # Login/logout
│   ├── contactController.js  # Contact CRUD
│   ├── documentController.js # Document CRUD
│   ├── galleryController.js  # Gallery CRUD
│   ├── menuController.js     # Menu CRUD + public page
│   └── postController.js     # Post CRUD
├── middlewares/
│   ├── authMiddleware.js     # requireAuth, redirectIfAuth
│   ├── languageMiddleware.js # i18n (lang, t, __)
│   ├── menuMiddleware.js     # loadMenus → res.locals.visibleMenus
│   └── uploadMiddleware.js   # Multer (uploadImage, uploadGallery, uploadPdf)
├── models/                   # DB operations (SYNC — no async/await!)
│   ├── contactModel.js       # contacts table
│   ├── documentModel.js      # documents table
│   ├── galleryModel.js       # gallery_images table
│   ├── menuModel.js          # menus table
│   ├── menuPostModel.js      # menu_posts junction table
│   ├── postModel.js          # posts table
│   └── userModel.js          # users table + auth
├── routes/
│   ├── admin.js              # Protected admin routes
│   ├── auth.js               # Auth routes
│   ├── language.js           # /lang/:lang switch
│   └── web.js                # Public routes
├── locales/
│   ├── vi.json               # Vietnamese translations
│   └── en.json               # English translations
├── utils/slugify.js          # Vietnamese-aware slug generator
└── views/
    ├── admin/                # Admin panel views
    ├── web/                  # Public views
    └── partials/             # header.ejs, footer.ejs
```

---

## Database Schema

All tables defined in `src/config/db.js` → `initDatabase()` as `CREATE TABLE IF NOT EXISTS`. No migrations.

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `users` | id, username, password_hash, role | Admin accounts |
| `posts` | id, title, slug, excerpt, content, thumbnail, status, title_en, excerpt_en, content_en | Blog posts (bilingual) |
| `documents` | id, title, filename, filepath, description | PDF uploads |
| `gallery_images` | id, filename, filepath, alt_text | Image gallery |
| `contacts` | id, full_name, email, subject, phone, message, is_read | Contact submissions |
| `menus` | id, name_vi, name_en, slug, type, linked_post_id, is_visible, sort_order | Navigation items |
| `menu_posts` | id, menu_id, post_id, sort_order | Junction for post_list menus |

### Menu Types

| Type | Behavior | URL |
|------|----------|-----|
| `system` | Fixed pages | Uses slug directly |
| `single_post` | Links to one post | `/posts/:slug` |
| `post_list` | Dropdown menu | `#` (hover for children via `menu_posts`) |
| `custom` | External link | Custom URL |

---

## Feature → File Mapping

| Feature | Model | Controller | Public Routes | Admin Routes |
|---------|-------|------------|---------------|--------------|
| Posts | postModel | postController | `GET /posts`, `GET /posts/:slug` | `/admin/posts/*` |
| Gallery | galleryModel | galleryController | `GET /gallery` | `/admin/gallery/*` |
| Documents | documentModel | documentController | `GET /documents`, `GET /documents/:id/download` | `/admin/documents/*` |
| Contact | contactModel | contactController | `GET /contact`, `POST /contact` | `/admin/contacts/*` |
| Menus | menuModel, menuPostModel | menuController | `GET /menu/:slug` | `/admin/menus/*` |
| Auth | userModel | authController | — | `GET/POST /admin/login`, `POST /admin/logout` |
| i18n | — | — | `GET /lang/:lang` | — |

---

## Critical Conventions

### Database (better-sqlite3 is SYNCHRONOUS)

- Models call `.get()`, `.all()`, `.run()` directly — **never `await`** them.
- Models are exported as **plain objects** (not classes).
- Always import via `require('../config/db')` — never create new connections.
- Schema changes go in `src/config/db.js` → `initDatabase()`.

```javascript
// CORRECT
const { db } = require('../config/db');
const Model = {
  getAll() { return db.prepare('SELECT * FROM table').all(); },
  findById(id) { return db.prepare('SELECT * FROM table WHERE id = ?').get(id); },
  create(data) { return db.prepare('INSERT INTO table (name) VALUES (?)').run(data.name); },
  delete(id) { return db.prepare('DELETE FROM table WHERE id = ?').run(id); }
};
module.exports = Model;
```

### Controllers

- Single file with **public + admin** handlers. Admin methods prefixed `admin*`.
- CRUD: `store` (create), `update` (edit), `destroy` (delete).
- Always check `req.uploadError` first for file upload routes.

### Auth

- **Session-based** (`express-session`). Do NOT change to JWT.
- Protected by `requireAuth` middleware in `src/routes/admin.js`.

### Flash Messages

```javascript
req.session.success = 'Message';  // or req.session.error
return res.redirect('/path');
// Cleared by middleware in app.js, available as res.locals.success / res.locals.error
```

### File Uploads (Multer)

- `uploadImage` — single, 5MB, jpg/png/webp → `public/uploads/images/`
- `uploadGallery` — multiple, 5MB each → `public/uploads/images/`
- `uploadPdf` — single, 20MB → `public/uploads/pdfs/`
- On update/delete: **remove old file from disk**.

### Slugs

```javascript
const { slugify, makeUniqueSlug } = require('../utils/slugify');
const slug = makeUniqueSlug(slugify(title), (s) => Model.slugExists(s, excludeId));
```

### i18n / Bilingual Content

- DB tables carry `field` + `field_en` columns.
- Views: `lang === 'en' && row.field_en ? row.field_en : row.field`
- `languageMiddleware` exposes `lang`, `t`, `__()` on `res.locals`.
- Add new UI strings to **both** `src/locales/vi.json` and `src/locales/en.json`.

### Available in Views (res.locals)

```
user, success, error, lang, t, __(), visibleMenus
```

---

## Database Operations Require User Confirmation

**Before ANY CREATE / UPDATE / DELETE on schema or data**, describe the change and wait for user approval:

```
DATABASE CHANGE REQUEST:
- Action: [CREATE TABLE / ALTER / INSERT / DELETE]
- SQL: [exact SQL]
- Impact: [what changes]
- Files affected: [which files]
Proceed? (yes/no)
```

This applies to schema edits in `db.js` and destructive data operations. Do NOT run unprompted.

---

## Self-Maintenance: Keep CLAUDE.md in Sync

**After completing any task** that changes the codebase structure, Claude Code MUST update this `CLAUDE.md` file to reflect the changes. This ensures CLAUDE.md remains the single source of truth.

### When to update

| Trigger | What to update in CLAUDE.md |
|---------|----------------------------|
| New/renamed model, controller, middleware, route file | Folder Structure, Feature → File Mapping |
| New/altered/dropped DB table or column | Database Schema table |
| New menu type | Menu Types table |
| New feature (full CRUD or public page) | Feature → File Mapping, Folder Structure |
| New upload type or changed limits | File Uploads section |
| New middleware added to chain | Middleware Order, Folder Structure |
| New route group mounted in `app.js` | Route Mounting Order |
| New `res.locals` variable exposed globally | Available in Views section |
| New locale keys pattern or i18n behavior change | i18n section |
| New util file | Folder Structure |

### How to update

1. After finishing the code task, review which sections of CLAUDE.md are affected.
2. Edit **only** the affected sections — keep the rest untouched.
3. Also update `.github/SKILL_MAP.md` if it exists (detailed reference).
4. Do NOT ask for permission to update CLAUDE.md — this is a **standing instruction**.

---

## MUST NOT

- Use `async/await` for database operations
- Introduce frontend frameworks (React, Vue, etc.)
- Change session auth to JWT
- Modify middleware chain order in `app.js`
- Use external ORM (Sequelize, TypeORM, etc.)
- Create new database connection instances
