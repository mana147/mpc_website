# CLAUDE.md

This file provides guidance to Claude Code when working with this repository. It is the **single source of truth** — all architecture, schema, conventions, and rules are here.

Detailed reference (optional deep-dive): `.github/SKILL_MAP.md`. After any structural change (new feature, table, model, controller, route, middleware), update SKILL_MAP.md accordingly.

## Repository Layout

- **`mini-cms/`** — Node.js/Express CMS with EJS server-rendered views and SQLite. Main application.
- **`view-html/`** — Static HTML/CSS/JS prototypes (e.g. `view-html/trang_chu/landing.html`) used as design references for MPC Port website. No build step. Uses Bootstrap 5, Font Awesome, Barlow Condensed font, red/orange/navy color scheme.

## Commands

```bash
cd mini-cms
npm install        # Install deps
npm run dev        # Start with nodemon (auto-reload)
npm start          # Production start
```

No test suite, no linter, no build step. Default admin: `admin` / `admin123` at `/admin/login`.

### Dependencies

`express`, `ejs`, `better-sqlite3`, `express-session`, `multer`, `bcrypt`, `dotenv`. Dev: `nodemon`.

---

## Architecture (mini-cms)

### MVC Pattern

```
app.js → middleware chain → routes/ → controllers/ → models/ → config/db.js (better-sqlite3)
                                                        ↓
                                                     views/ (EJS)
```

### Middleware Order (load-bearing — do NOT reorder)

`urlencoded → json → static → session → flash-clear → languageMiddleware → menuMiddleware → routes`

### Route Mounting Order (as in app.js)

`/lang/*` → `/*` (public web) → `/admin/*` (protected by `requireAuth`) → `/auth/*`

### Folder Structure

```
mini-cms/
├── app.js                        # Entry point, middleware chain, route mounting, error handlers
├── database/cms.sqlite           # SQLite database file (auto-created)
├── public/
│   ├── css/style.css             # Single CSS file for ALL public + admin pages (~1955 lines)
│   ├── css/pages/                # Empty — reserved for page-specific CSS
│   ├── js/main.js                # Auto-hide alerts, confirm delete, thumbnail preview, mobile menu
│   └── uploads/                  # Runtime uploads (images/, pdfs/)
└── src/
    ├── config/db.js              # DB init & schema (CREATE TABLE IF NOT EXISTS), seed data
    ├── controllers/              # Request handlers (public + admin* in same file)
    │   ├── adminController.js    # Dashboard (stats: posts, documents)
    │   ├── authController.js     # Login/logout (bcrypt)
    │   ├── contactController.js  # Contact form + admin CRUD
    │   ├── documentController.js # Document upload/download + admin (no edit)
    │   ├── galleryController.js  # Gallery view + admin upload/delete (no edit)
    │   ├── menuController.js     # Menu CRUD + visibility toggle + reorder + public page
    │   └── postController.js     # Post full CRUD (bilingual)
    ├── middlewares/
    │   ├── authMiddleware.js     # requireAuth, redirectIfAuth
    │   ├── languageMiddleware.js # i18n (lang, t, __)
    │   ├── menuMiddleware.js     # loadMenus → res.locals.visibleMenus
    │   └── uploadMiddleware.js   # Multer (uploadImage, uploadGallery, uploadPdf)
    ├── models/                   # DB operations (SYNC — no async/await!)
    │   ├── contactModel.js       # contacts table (has countUnread — not yet wired to dashboard)
    │   ├── documentModel.js      # documents table (read-only after create, no update)
    │   ├── galleryModel.js       # gallery_images table (no update/edit for alt_text)
    │   ├── menuModel.js          # menus table
    │   ├── menuPostModel.js      # menu_posts junction (3 methods: getPostIdsByMenuId, assignPostsToMenu, removeAllPostsFromMenu)
    │   ├── postModel.js          # posts table
    │   └── userModel.js          # users table + auth (has changePassword — not yet wired to admin)
    ├── routes/
    │   ├── admin.js              # Protected admin routes (login/logout before requireAuth, rest after)
    │   ├── auth.js               # Simple redirects: /auth/login → /admin/login
    │   ├── language.js           # GET /lang/:lang — switch language via session
    │   └── web.js                # Public routes (home has inline handler, not in controller)
    ├── locales/
    │   ├── vi.json               # Vietnamese translations (~40 admin keys defined but UNUSED in views)
    │   └── en.json               # English translations (~40 admin keys defined but UNUSED in views)
    ├── utils/slugify.js          # Vietnamese-aware slug generator
    └── views/
        ├── admin/                # 12 EJS templates (all hardcoded Vietnamese, no i18n)
        ├── web/                  # 9 EJS templates (i18n enabled, except 404.ejs and error.ejs)
        └── partials/             # header.ejs (dynamic menu + lang switcher), footer.ejs, admin-sidebar.ejs
```

---

## Database Schema

All tables defined in `src/config/db.js` → `initDatabase()` as `CREATE TABLE IF NOT EXISTS`. No migrations. `journal_mode = WAL` is set.

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `users` | id, username, password_hash, role | Admin accounts |
| `posts` | id, title, slug, excerpt, content, thumbnail, status, title_en, excerpt_en, content_en | Blog posts (bilingual) |
| `documents` | id, title, filename, filepath, description | PDF uploads |
| `gallery_images` | id, filename, filepath, alt_text | Image gallery |
| `contacts` | id, full_name, email, subject, phone, message, is_read | Contact submissions |
| `menus` | id, name_vi, name_en, slug, type, linked_post_id, is_visible, sort_order | Navigation items |
| `menu_posts` | id, menu_id, post_id, sort_order | Junction for post_list menus (UNIQUE menu_id+post_id) |

### Menu Types

| Type | Behavior | URL |
|------|----------|-----|
| `system` | Fixed pages (cannot delete/change type/slug) | Uses slug directly |
| `single_post` | Links to one post | `/posts/:slug` |
| `post_list` | Dropdown menu | `#` (hover for children via `menu_posts`) |
| `custom` | External link | Custom URL |

### Seed Data (auto-created on first run)

- Default admin: `admin` / `admin123` (or from env `ADMIN_USERNAME`/`ADMIN_PASSWORD`)
- 5 system menus: Home (`/`), Posts (`/posts`), Gallery (`/gallery`), Documents (`/documents`), Contact (`/contact`)

---

## Feature → File Mapping

| Feature | Model | Controller | Public Routes | Admin Routes |
|---------|-------|------------|---------------|--------------|
| Posts | postModel | postController | `GET /posts`, `GET /posts/:slug` | Full CRUD `/admin/posts/*` |
| Gallery | galleryModel | galleryController | `GET /gallery` | Upload + delete only `/admin/gallery/*` |
| Documents | documentModel | documentController | `GET /documents`, `GET /documents/:id/download` | Create + delete only `/admin/documents/*` |
| Contact | contactModel | contactController | `GET /contact`, `POST /contact` | View + delete `/admin/contacts/*` |
| Menus | menuModel, menuPostModel | menuController | `GET /menu/:slug` | Full CRUD + reorder + toggle `/admin/menus/*` |
| Auth | userModel | authController | — | `GET/POST /admin/login`, `POST /admin/logout` |
| i18n | — | — | `GET /lang/:lang` | — |
| Home | (inline in web.js) | — | `GET /` (latest 6 posts + 5 docs) | — |

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

- **Session-based** (`express-session`, 24h expiry). Do NOT change to JWT.
- Protected by `requireAuth` middleware in `src/routes/admin.js`.
- Password hashing: `bcrypt` with salt rounds 10, `compareSync` for verification.

### Flash Messages

```javascript
req.session.success = 'Message';  // or req.session.error
return res.redirect('/path');
// Cleared by middleware in app.js, available as res.locals.success / res.locals.error
```

### File Uploads (Multer)

- `uploadImage` — single, field `thumbnail`, 5MB, jpg/png/webp → `public/uploads/images/`
- `uploadGallery` — multiple, field `images`, max 20 files, 5MB each → `public/uploads/images/`
- `uploadPdf` — single, field `file`, 20MB → `public/uploads/pdfs/`
- On update/delete: **remove old file from disk**.
- Errors are caught by `handleUploadError` wrapper → sets `req.uploadError` for controllers.

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

## Known Issues & TODOs

### CRITICAL

| # | Issue | Detail | File |
|---|-------|--------|------|
| 1 | **`PRAGMA foreign_keys = ON` is never set** | All `ON DELETE CASCADE` and `ON DELETE SET NULL` constraints are **not enforced**. Deleting a post leaves orphaned `menu_posts` rows and stale `menus.linked_post_id`. | `src/config/db.js` |

### MODERATE

| # | Issue | Detail | File |
|---|-------|--------|------|
| 2 | **Orphaned files on DB error** | If model `.create()`/`.update()` throws after file upload, the file is not cleaned up. In `postController.update`, old file is deleted before DB write — DB failure leaves broken reference. | `postController.js`, `documentController.js`, `galleryController.js` |
| 3 | **No edit for Documents** | Can only create + delete. No edit route, controller, or view. | `documentController.js`, `admin.js` |
| 4 | **No edit for Gallery** | Cannot update `alt_text` after upload. No update model method, route, or view. | `galleryController.js`, `galleryModel.js` |
| 5 | **Dashboard missing metrics** | No stats for gallery images or contacts. `ContactModel.countUnread()` exists but unused. | `adminController.js` |

### MINOR

| # | Issue | Detail | File |
|---|-------|--------|------|
| 6 | **`showMenuPage` ignores i18n for title** | Always uses `menu.name_vi` regardless of language. | `menuController.js` |
| 7 | **`slugExists` inconsistent return** | PostModel returns row object; MenuModel returns boolean. Both work but inconsistent. | `postModel.js`, `menuModel.js` |
| 8 | **Menu `reorder` lacks input validation** | Only checks `Array.isArray(orders)`, not integer types. | `menuController.js` |
| 9 | **Gallery upload always sets empty `alt_text`** | No form field for alt text during upload. | `galleryController.js` |
| 10 | **404.ejs, error.ejs hardcode Vietnamese** | Locale keys exist (`t.common.not_found` etc.) but not used. | `views/web/404.ejs`, `views/web/error.ejs` |
| 11 | **All admin views hardcode Vietnamese** | ~40 admin locale keys defined in both JSON files but completely unused. | All `views/admin/*.ejs` |
| 12 | **`gallery.ejs` hardcodes "Hinh anh"** | Should use locale key. | `views/web/gallery.ejs` |
| 13 | **`UserModel.changePassword` not wired** | Method exists but no route/view to change admin password. | `userModel.js` |
| 14 | **`ContactModel.countUnread` not wired** | Method exists but not shown on dashboard or nav. | `contactModel.js` |

### Prototype vs CMS Gap

The `view-html/` prototype represents the target MPC Port website design. Current CMS has **not yet adopted** the prototype design:

| Aspect | Prototype | CMS Current |
|--------|-----------|-------------|
| Branding | MPC Port logo, Barlow Condensed, red/orange/navy (`#DF1F28`, `#FCB248`, `#2c3e7d`) | Generic "Mini CMS", system fonts, purple/blue gradient |
| Header | Transparent overlay on banner, centered nav, language pill | White sticky bar, left logo + right nav |
| Footer | 4-column grid (about + menus + contact), navy, social icons | Single-line dark footer with copyright |
| CSS framework | Bootstrap 5 + Font Awesome + Bootstrap Icons | No framework, custom CSS only |
| Missing pages | About, Infrastructure, Services (6 sub-items), Recruitment | Not implemented |
| Missing sections | Hero banner, quick nav (EPort/Ship Schedule/Container/Invoice), Vietnam map with port specs, facility tabs, services carousel, image library slider | Not implemented |
| Assets | Logo, custom fonts, 18 icons, 20+ images | No branded assets in `public/` |

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
| Bug fix or feature completion from Known Issues | Known Issues & TODOs section |

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
