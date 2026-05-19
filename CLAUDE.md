# CLAUDE.md

This file provides guidance to Claude Code when working with this repository. It is the **single source of truth** — all architecture, schema, conventions, and rules are here.

## Repository Layout

- **`mini-cms/`** — Node.js/Express CMS with EJS server-rendered views and SQLite. Main application.
  - `public/vendor/` — Vendored Bootstrap 5, Bootstrap Icons, Font Awesome 6 (fully offline, no CDN).
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

`express`, `ejs`, `better-sqlite3`, `express-session`, `multer`, `bcrypt`, `dotenv`, `helmet`, `express-rate-limit`, `file-type`. Dev: `nodemon`.

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
│   ├── css/
│   │   ├── style.css             # CSS for admin pages (~1955 lines) — NOT used by public pages
│   │   ├── mpc-base.css          # MPC shared styles: fonts, variables, buttons, forms, page components
│   │   ├── mpc-header.css        # MPC header (transparent overlay, responsive nav)
│   │   ├── mpc-footer.css        # MPC footer (4-column, navy background)
│   │   └── pages/
│   │       ├── landing.css       # Landing page specific CSS (~2000 lines, 5 breakpoints)
│   │       ├── about.css         # About MPC page CSS
│   │       ├── contact.css       # Contact page CSS
│   │       ├── recruitment.css   # Recruitment list page CSS
│   │       ├── job-detail.css    # Job detail page CSS (ported from prototype)
│   │       └── org-chart.css     # Organization chart page CSS (CSS tree layout)
│   ├── fonts/barlow-condensed/   # Barlow Condensed TTF (6 weights)
│   ├── images/
│   │   ├── logo.png              # MPC Port logo
│   │   ├── map-vietnam.svg       # Vietnam map for geo section
│   │   └── icons/                # 18 SVG icons (geo-*, eport, container, hddt, arrows, etc.)
│   ├── js/
│   │   ├── main.js               # Admin: auto-hide alerts, confirm delete, thumbnail preview
│   │   └── landing.js            # Landing: mobile menu, facility slider, service carousel, gallery
│   ├── uploads/
│   │   ├── images/               # Uploaded images (flat, multer saves here)
│   │   │   ├── about/            # Pre-created static asset subfolders
│   │   │   ├── Dịch vụ/
│   │   │   ├── Hạ tầng/
│   │   │   ├── Liên hệ/
│   │   │   ├── Thư viện/
│   │   │   ├── Tin tức/
│   │   │   ├── Trang chủ/
│   │   │   └── Tuyển dụng/
│   │   └── pdfs/                 # Uploaded PDF files
│   └── vendor/                   # Offline vendor libs (no CDN required)
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
    ├── config/db.js              # DB init & schema (CREATE TABLE IF NOT EXISTS), seed data
    ├── controllers/              # Request handlers (public + admin* in same file)
    │   ├── adminController.js    # Dashboard (stats: posts, documents)
    │   ├── authController.js     # Login/logout (bcrypt)
    │   ├── contactController.js  # Contact form + admin CRUD
    │   ├── documentController.js # Document upload/download + admin (no edit)
    │   ├── galleryController.js  # Gallery view + admin upload/delete (no edit)
    │   ├── jobController.js      # Job listings full CRUD + public list/detail (bilingual)
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
    │   ├── jobModel.js           # jobs table (full CRUD + getOtherJobs for sidebar)
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
    │   ├── vi.json               # Vietnamese translations (admin + landing + footer keys)
    │   └── en.json               # English translations (admin + landing + footer keys)
    ├── utils/slugify.js          # Vietnamese-aware slug generator
    ├── utils/safeFilePath.js     # safeUnlink + safeResolve — chặn path traversal trong file ops
    └── views/
        ├── admin/                # 15 EJS templates (all hardcoded Vietnamese, no i18n)
        │   ├── contact-detail.ejs, contact-list.ejs
        │   ├── dashboard.ejs, login.ejs
        │   ├── document-create.ejs, document-list.ejs
        │   ├── gallery.ejs
        │   ├── job-list.ejs, job-create.ejs, job-edit.ejs   # Job listings CRUD
        │   ├── menu-form.ejs, menu-list.ejs
        │   └── post-create.ejs, post-edit.ejs, post-list.ejs
        ├── web/                  # 13 EJS templates (all use mpc-header/mpc-footer, i18n enabled)
        │   ├── home.ejs          # Landing page (all 11 sections ported from prototype)
        │   ├── about.ejs         # About MPC public page
        │   ├── org-chart.ejs     # Organization chart (CSS tree, 3 Deputy branches, stats strip)
        │   ├── recruitment.ejs   # Careers list page (jobs from DB)
        │   ├── job-detail.ejs    # Job detail (breadcrumb, content, apply modal, sidebar)
        │   ├── posts.ejs, post-detail.ejs
        │   ├── gallery.ejs
        │   ├── documents.ejs
        │   ├── contact.ejs
        │   ├── menu-page.ejs
        │   └── 404.ejs, error.ejs
        └── partials/             # mpc-header.ejs (MPC branded), mpc-footer.ejs, header.ejs (legacy/admin), footer.ejs (legacy/admin), admin-sidebar.ejs
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
| `jobs` | id, title, slug, content, salary, hiring_count, deadline, thumbnail, status, title_en, content_en | Job listings (bilingual) |

### Menu Types

| Type | Behavior | URL |
|------|----------|-----|
| `system` | Fixed pages (cannot delete/change type/slug) | Uses slug directly |
| `single_post` | Links to one post | `/posts/:slug` |
| `post_list` | Dropdown menu | `#` (hover for children via `menu_posts`) |
| `custom` | External link | Custom URL |

### Seed Data (auto-created on first run)

- Default admin: `admin` / `admin123` (or from env `ADMIN_USERNAME`/`ADMIN_PASSWORD`)
- 8 system menus: Home (`/`), About (`/about`), Org Chart (`/so-do-to-chuc`), Recruitment (`/tuyen-dung`), Posts (`/posts`), Gallery (`/gallery`), Documents (`/documents`), Contact (`/contact`)
- On existing databases: `initDatabase()` auto-inserts `/so-do-to-chuc`, `/about`, `/tuyen-dung` menus if missing
- 20 seed job listings (ngành cảng biển, mix published/draft)

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
| Home | (inline in web.js) | — | `GET /` (latest 9 posts + 5 docs + 6 gallery images) | — |
| About | (inline in web.js) | — | `GET /about` (static page with hero banner, responsive sections, bilingual) | — |
| Recruitment | jobModel | jobController | `GET /tuyen-dung` (list published jobs), `GET /tuyen-dung/:slug` (job detail with apply modal) | Full CRUD `/admin/jobs/*` |
| Org Chart | (inline in web.js) | — | `GET /so-do-to-chuc` (static CSS tree: HĐQT → TGĐ → 3 Deputy branches → 11 departments) | — |

> **Note:** `/about`, `/so-do-to-chuc`, and `/tuyen-dung` are `system` menus in DB — rendered via `visibleMenus` in `mpc-header.ejs`. Admin controls visibility/order at `/admin/menus`.

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

```javascript
const Controller = {
  index(req, res) {                                      // public list
    res.render('web/items', { title: 'Items', items: Model.getPublished() });
  },
  store(req, res) {                                      // admin create
    if (req.uploadError) {
      req.session.error = req.uploadError;
      return res.redirect('/admin/items/create');
    }
    const { title } = req.body;
    if (!title?.trim()) {
      req.session.error = 'Tiêu đề không được để trống';
      return res.redirect('/admin/items/create');
    }
    const slug = makeUniqueSlug(slugify(title), (s) => Model.slugExists(s));
    const thumbnail = req.file ? '/uploads/images/' + req.file.filename : null;
    try {
      Model.create({ title: title.trim(), slug, thumbnail, status: req.body.status || 'draft' });
      req.session.success = 'Tạo thành công';
      return res.redirect('/admin/items');
    } catch (e) {
      req.session.error = 'Có lỗi xảy ra';
      return res.redirect('/admin/items/create');
    }
  },
  destroy(req, res) {                                    // admin delete
    const item = Model.findById(req.params.id);
    if (!item) { req.session.error = 'Không tìm thấy'; return res.redirect('/admin/items'); }
    safeUnlink(item.thumbnail);
    Model.delete(req.params.id);
    req.session.success = 'Đã xóa';
    return res.redirect('/admin/items');
  }
};
```

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
user, success, error, lang, t, __(), visibleMenus, csrfToken
```

### Page CSS Override (trang không có hero banner)

Các trang như `job-detail.ejs`, `org-chart.ejs` không có banner nên cần override header về solid:

```css
.mpc-header { position: relative !important; background: #ffffff !important; border-bottom: 35px solid #1c2b5e !important; }
.nav-menu li a { color: #333333 !important; text-shadow: none !important; }
.header-language span, .dropdown-icon { color: #333333 !important; }
```

### Admin Sidebar `activePage` Keys

| activePage value | URL | Label |
|-----------------|-----|-------|
| `dashboard` | `/admin` | 📊 Dashboard |
| `posts` | `/admin/posts` | 📝 Bài viết |
| `documents` | `/admin/documents` | 📄 Tài liệu |
| `gallery` | `/admin/gallery` | 🖼️ Thư viện ảnh |
| `contacts` | `/admin/contacts` | 📬 Liên hệ |
| `jobs` | `/admin/jobs` | 💼 Tuyển dụng |
| `menus` | `/admin/menus` | 📋 Quản lý Menu |

Pass via `<% const activePage = 'jobs'; %>` ở đầu mỗi admin view.

---

## Known Issues & TODOs

### CRITICAL

| # | Issue | Detail | File |
|---|-------|--------|------|
| 1 | **`PRAGMA foreign_keys = ON` is never set** | All `ON DELETE CASCADE` and `ON DELETE SET NULL` constraints are **not enforced**. Deleting a post leaves orphaned `menu_posts` rows and stale `menus.linked_post_id`. | `src/config/db.js` |

### MODERATE

| # | Issue | Detail | File |
|---|-------|--------|------|
| 2 | **Orphaned files on DB error** | If model `.create()`/`.update()` throws after file upload, the file is not cleaned up. In `postController.update` and `jobController.update`, old file is deleted before DB write — DB failure leaves broken reference. | `postController.js`, `jobController.js`, `documentController.js`, `galleryController.js` |
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

### Prototype (view-html/) — Detailed Reference

The `view-html/` directory is the **static HTML/CSS/JS prototype** used as design reference. The CMS (`mini-cms/`) has largely adopted this design — header, footer, landing page, and all public pages are ported.

#### Folder Structure

```
view-html/
├── trang_chu/
│   ├── landing.html              # Trang chủ — ONLY complete page in prototype
│   └── landing.css               # ~2048 lines, includes 5 responsive breakpoints
├── components/
│   ├── Header.html + Header.css  # Reusable header (transparent overlay, dropdown nav)
│   ├── footer.html + Footer.css  # Reusable footer (4-column grid, navy background)
│   └── Sidebar.html + Sidebar.css# Sidebar menu for sub-pages (sticky, vertical list)
└── assets/
    ├── logo.png, home-banner.png, map-vietnam.svg
    ├── fonts/barlow-condensed/   # 6 TTF files (Regular, Medium, SemiBold, Bold, Italic, BoldItalic)
    ├── icons/                    # 18 SVG icons (geo-*, eport, container, hddt, lich-tau, arrows, gallery-play, redline)
    ├── js/landing.js             # Mobile menu, facility slider, service carousel, library auto-slide
    ├── landing/                  # Homepage images (banner, facility x5, service x4, library, event, ha-tang, logo variants)
    ├── about/                    # 4 images (about-img1..4.png)
    ├── Dịch vụ/                  # 5 images (ctdv, dich_vu_1..4.png)
    ├── Hạ tầng/                  # 1 image (ha-tang.png)
    ├── Thư viện/                 # 12 images (anh_1..12.png) + thu-vien.png banner
    ├── Tin tức/                  # 9 images (tintuc1..3, ttmn_1..3, tin_tuc, tin-tuc, banner_tintuc)
    ├── Tuyển dụng/               # 2 images (tuyendung1.png, tuyen-dung.png)
    └── Liên hệ/                  # 2 images (lien-he.png, map.png)
```

> **Note:** Asset folder names use Vietnamese with diacritics. Sub-pages (About, Dịch vụ, Hạ tầng, Tin tức, Liên hệ) have **images only — no HTML files yet**. The `About` and `Tuyển dụng` pages have been integrated into the mini-CMS as public routes with EJS views.

#### Design System

| Element | Value |
|---------|-------|
| Font | Barlow Condensed (local TTF), weights 400–700 |
| Primary colors | Red `#DF1F28` / `#e74c3c`, Orange `#FCB248`, Navy `#2c3e7d` |
| Text colors | Dark `#333333`, Gray `#828282`, Light gray `#BDBDBD` |
| CSS framework | Bootstrap 5 (vendored) + Bootstrap Icons (vendored) + Font Awesome 6 (vendored) — fully offline |
| Button style | `.btn-outline` — transparent bg, 2px red border, red text, inline-flex with arrow icon |
| Section title pattern | `<img icon-redline.svg>` + `<h2 class="title2">TIÊU ĐỀ</h2>` + optional `<a class="more-link">` |
| Responsive breakpoints | `>2200px`, `1720–2199`, `1368–1719`, `959–1367`, `640–958`, `<639px` |

#### Landing Page Sections (top → bottom)

| # | Section | Key classes | Content |
|---|---------|-------------|---------|
| 1 | **Header** | `.mpc-header`, `.header-container` | Logo + 7 nav items (TRANG CHỦ, VỀ MPC, CƠ SỞ HẠ TẦNG, DỊCH VỤ▼, TIN TỨC, TUYỂN DỤNG, LIÊN HỆ) + language pill VIE. Transparent `position: absolute` over hero. |
| 2 | **Hero Banner** | `.hero-section`, `.hero-overlay` | Full-width `home-banner.png`, 617px height, dark overlay rgba(0,0,0,0.4) |
| 3 | **Quick Nav** | `.nav-bar`, `.nav-option` | 4 buttons: EPORT, XEM LỊCH TÀU, TRA CỨU VỊ TRÍ CONTAINER, TRA CỨU HĐĐT. Each with SVG icon. Centered 868px bar. |
| 4 | **About** | `.about-section`, `.about-container` | 2-col grid (400px + 1fr): left = label + title "CÔNG TY CỔ PHẦN CẢNG MIPEC", right = paragraph + "Tìm hiểu thêm" button |
| 5 | **Port Image** | `.port-image-section` | Panorama image, offset `margin-left: 383px`, overlaps about section via negative margin-top |
| 6 | **Geo Location** | `.geo-section`, `.info-grid` | Left = Vietnam SVG map. Right = 3×2 grid of 6 port specs (coordinates, area 22.3ha, capacity ~13000 TEU, depth -9.7m to -11m, turning basin 360m, berth 380m) + description + "Xem bản đồ" button |
| 7 | **Facility** | `.facility`, `.facility-left`, `.facility-image` | Left panel = red→orange gradient with 6 tabs (Hạ tầng, CNTT, Năng lực tiếp nhận, Thiết bị xếp dỡ, Kho bãi, Cấu tạo) + tab content + thumbnails. Right = large image slider with next button. Image overlaps panel by -80px. |
| 8 | **Services** | `.wrapper`, `.slides`, `.service-card` | Carousel: 4 pages × 4 cards each. Card = vertical image (280×443) + title + description + "Xem thêm". Navigation: arrow buttons + dot indicators. `translateX` animation. |
| 9 | **Image Library** | `.gallery-section`, `.img-box` | 3-column layout: 1 big image (500px) + 4 small images (2×2 grid, 242px each) + 1 auto-sliding image with play button |
| 10 | **News & Events** | `.news-section`, `.news-wrapper` | 2-column: left = list of 9 news items (title + date) on gray bg, right = event image. Fixed 572×344px each. |
| 11 | **Footer** | `.mpc-footer`, `.footer-container` | 4-col CSS grid (2fr 1fr 1fr 1.5fr): logo+description+social icons, 2 menu columns (8 links total), contact info (phone, email, address). Navy `#2c3e7d` background. Copyright bar at bottom. |

#### Header Component Details

- **Desktop (>959px):** Transparent bg, `position: absolute`, white text with `text-shadow`, centered nav, `.sub-menu` appears on hover (white dropdown, 280px min-width, slide-down animation)
- **Mobile (<=959px):** Hidden nav, hamburger toggle (`.mobile-menu-toggle`), dropdown becomes full-width white panel, sub-menu toggle via click (`.menu-item.open`)
- **Language pill:** Flag icon + "VIE" + dropdown arrow, pill-shaped border with rgba white bg

#### JavaScript Features (landing.js)

| Feature | Mechanism | Known Issue |
|---------|-----------|-------------|
| Mobile menu | Toggle `.show` on `.header-nav`, close on outside click | — |
| Sub-menu mobile | Toggle `.open` + `.show` on `.menu-item` when <=959px | — |
| Facility tab switch | Click `.tab-item` toggles `.active` on tabs and panes | Working (ported to CMS) |
| Facility image slider | Click thumbnails or next-btn-service, updates `#mainImage` src | — |
| Service carousel | `translateX(-N * 100%)` on `#slides`, controlled by arrows + dots | — |
| Library auto-slide | `nextSlide()` — opacity fade transition, cycles 3 images | Called via `onclick` only, no auto-interval |

#### Prototype vs CMS Status

| Aspect | Status | Notes |
|--------|--------|-------|
| Branding | **DONE** | MPC Port logo, Barlow Condensed, red/orange/navy applied to all public pages |
| Header | **DONE** | `mpc-header.ejs` — transparent overlay, centered nav, dynamic menus, language pill |
| Footer | **DONE** | `mpc-footer.ejs` — 4-column grid, navy background, social icons, contact info |
| CSS framework | **DONE** | Bootstrap 5 + Bootstrap Icons + Font Awesome vendored in `public/vendor/` (fully offline) |
| Landing page | **DONE** | All 11 sections ported to `home.ejs` with i18n |
| Assets | **DONE** | Fonts, icons, logo, map-vietnam.svg in `public/` |
| All public pages | **DONE** | Posts, Gallery, Documents, Contact, Menu-page, 404, Error use mpc-header/mpc-footer |
| Admin pages | **Unchanged** | Still use `header.ejs`/`footer.ejs` + `style.css` |
| About page | **DONE** | Route `/about`, view `about.ejs`, system menu in DB |
| Org Chart | **DONE** | Route `/so-do-to-chuc`, view `org-chart.ejs`, CSS tree layout, system menu in DB |
| Recruitment page | **DONE** | Route `/tuyen-dung` + `/:slug`, views `recruitment.ejs` + `job-detail.ejs`, admin CRUD `/admin/jobs`, 20 seed jobs |
| Infrastructure page | **Pending** | No dedicated route/view yet |
| Services page | **Pending** | No dedicated route/view yet |

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
3. Do NOT ask for permission to update CLAUDE.md — this is a **standing instruction**.

---

## MUST Do

- Dùng `.get()`, `.all()`, `.run()` của better-sqlite3 — **không bao giờ `await`**
- Export model là plain object, không phải class
- Prefix method admin bằng `admin*` trong controller
- Kiểm tra `req.uploadError` trước mọi xử lý trong route có upload
- Flash message bằng `req.session.success/error` + redirect (không render trực tiếp)
- Thêm translation vào **cả** `vi.json` và `en.json`
- Dùng `field` + `field_en` cho nội dung song ngữ trong DB
- Schema mới → `src/config/db.js → initDatabase()`
- System page mới → thêm insert-if-not-exists menu trong `initDatabase()`
- Sau mỗi thay đổi cấu trúc → cập nhật `CLAUDE.md`

## MUST NOT

- Dùng `async/await` cho database operations
- Thêm frontend framework (React, Vue, etc.)
- Đổi session auth sang JWT
- Thay đổi thứ tự middleware chain trong `app.js`
- Dùng ORM ngoài (Sequelize, TypeORM, etc.)
- Tạo database connection mới (luôn dùng `require('../config/db')`)
