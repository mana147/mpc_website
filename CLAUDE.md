# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This repo contains two related but independent pieces:

- **`mini-cms/`** — Node.js/Express CMS with EJS server-rendered views and SQLite. This is the main application.
- **`view-html/`** — Static HTML/CSS/JS prototypes (e.g. `view-html/trang_chu/landing.html`) used as design references for the public site. Edit these directly; they have no build step.

Authoritative project context lives in `.github/copilot-instructions.md` and `.github/SKILL_MAP.md`. **Read SKILL_MAP.md** for the full architecture, DB schema, feature→file mapping, and code patterns — it is kept in sync with the codebase and is the canonical reference. After any structural change (new feature, table, model, controller, route, middleware), update SKILL_MAP.md accordingly.

## Common Commands

```bash
cd mini-cms
npm install        # Install deps
npm run dev        # Start with nodemon (auto-reload)
npm start          # Production start
```

There is no test suite, no linter, and no build step. Default admin login at `/admin/login`: `admin` / `admin123`.

## Architecture (mini-cms)

Classic MVC over Express:

```
app.js → middleware chain → routes/ → controllers/ → models/ → config/db.js (better-sqlite3)
                                                          ↓
                                                       views/ (EJS)
```

Middleware order in `app.js` is load-bearing — do not reorder:
`urlencoded → static → session → flash-clear → languageMiddleware → menuMiddleware → routes`.

Routes are mounted as: `/lang/*` (language switch), `/admin/*` (protected by `requireAuth`), `/auth/*`, then `/*` (public web).

### Critical conventions

- **better-sqlite3 is synchronous.** Models call `.get()`, `.all()`, `.run()` directly — never `await` them. Models are exported as plain objects (not classes), and always import the shared db via `require('../config/db')` — never instantiate a new connection.
- **Controllers contain both public and admin handlers in the same file.** Admin methods are prefixed `admin*` (e.g. `index` vs `adminIndex`). CRUD methods use `store` / `update` / `destroy`.
- **Schema changes go in `src/config/db.js` → `initDatabase()`** as `CREATE TABLE IF NOT EXISTS`. There are no migrations.
- **Auth is session-based** (`express-session`), not JWT. Do not change this.
- **Flash messages** are set via `req.session.success` / `req.session.error`, then exposed as `res.locals.success` / `res.locals.error` and cleared by middleware in `app.js`.
- **File uploads** go through Multer middleware in `src/middlewares/uploadMiddleware.js` (`uploadImage`, `uploadGallery`, `uploadPdf`). Always check `req.uploadError` first in the controller. On update/delete, remove the old file from disk.
- **Slugs:** use `src/utils/slugify.js` (`slugify` + `makeUniqueSlug`) — it handles Vietnamese diacritics.
- **i18n / bilingual content:** content tables carry both `field` and `field_en` columns. In views, render with `lang === 'en' && row.field_en ? row.field_en : row.field`. `languageMiddleware` exposes `lang`, `t`, and `__()` on `res.locals`. Add new strings to **both** `src/locales/vi.json` and `src/locales/en.json`.
- **Menus** are loaded globally by `menuMiddleware` into `res.locals.visibleMenus`. There are 4 menu types — `system`, `single_post`, `post_list` (dropdown via `menu_posts` junction table), `custom` — see SKILL_MAP §3.3 and §4.5 before changing menu logic.

## Database operations require explicit user confirmation

Per `.github/copilot-instructions.md`: **before any CREATE / UPDATE / DELETE on schema or data**, describe the change (action, columns/SQL, impact, files affected) and wait for user approval. This applies to schema edits in `db.js` as well as destructive data scripts. Do not run migrations or destructive SQL unprompted.
