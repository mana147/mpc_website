# Mini CMS - AI Coding Instructions

## ⚠️ Database Operations (CRITICAL!)

**Before ANY database operation, AI MUST ask for user confirmation and describe clearly:**

1. **CREATE** (new table, new column, insert data):
   - Describe exactly what will be created
   - Show the SQL schema or data to be inserted
   - Wait for user approval before executing

2. **UPDATE** (modify schema, update data):
   - Describe what will be changed
   - Show before/after comparison
   - Wait for user approval before executing

3. **DELETE** (drop table, remove column, delete data):
   - Clearly warn about data loss
   - List what will be deleted
   - Wait for user approval before executing

**Example prompt to user:**
```
🗄️ DATABASE CHANGE REQUEST:
- Action: CREATE TABLE `categories`
- Columns: id, name, slug, description, created_at
- Impact: New table will be added to database
- Files affected: src/config/db.js

Proceed with this change? (yes/no)
```

---

## Architecture Overview

This is a Node.js/Express CMS with server-rendered EJS templates and SQLite database. The codebase follows a classic MVC pattern within `mini-cms/`:

```
app.js (entry point) → routes/ → controllers/ → models/ → config/db.js (better-sqlite3)
                                      ↓
                              views/ (EJS templates)
```

**Key design decisions:**
- Uses **synchronous** `better-sqlite3` (not async) - all DB calls use `.get()`, `.all()`, `.run()` directly
- Session-based auth via `express-session` (no JWT)
- Flash messages stored in `req.session.success/error`, cleared after use via middleware in `app.js`

## Development Commands

```bash
cd mini-cms
npm install          # Install dependencies
npm run dev          # Start with nodemon (auto-reload)
npm start            # Production start
```

**Default admin login**: `admin` / `admin123` at `/admin/login`

## Code Patterns

### Database Models (`src/models/`)
Models return data directly (sync), not Promises. Example pattern from `mini-cms/src/models/postModel.js`:
```javascript
// ✅ Correct - synchronous better-sqlite3
const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

// ❌ Wrong - no async/await needed
const post = await db.prepare(...).get(id);
```

### Controllers (`src/controllers/`)
Controllers handle both public and admin routes in the same file. Admin methods prefixed with `admin*`:
- `index()` → public listing
- `adminIndex()` → admin listing
- `store()` → create (POST)
- `update()` → edit (POST)
- `destroy()` → delete (POST)

### Route Protection
Admin routes use `requireAuth` middleware. Pattern from `mini-cms/src/routes/admin.js`:
```javascript
router.use(requireAuth);  // All routes below require login
router.get('/posts', PostController.adminIndex);
```

### File Uploads
Multer middleware in `mini-cms/src/middlewares/uploadMiddleware.js`:
- Images: `uploadImage` → `public/uploads/images/` (5MB max, jpg/png/webp)
- PDFs: `uploadPdf` → `public/uploads/pdfs/` (10MB max)
- Access via `req.file`, errors via `req.uploadError`

### Slug Generation
Use `mini-cms/src/utils/slugify.js` for URL-friendly slugs with Vietnamese support:
```javascript
const { slugify, makeUniqueSlug } = require('../utils/slugify');
const slug = makeUniqueSlug(slugify(title), (s) => PostModel.slugExists(s));
```

## Views & Templates

- Admin templates: `src/views/admin/` - include sidebar navigation
- Public templates: `src/views/web/`
- Partials: `src/views/partials/header.ejs`, `footer.ejs`
- All views receive `user`, `success`, `error` via `res.locals` middleware

## Adding New Features

1. **New model**: Create in `src/models/`, export object with methods using `db.prepare()`
2. **New routes**: Add to `src/routes/admin.js` (protected) or `web.js` (public)
3. **New controller**: Single file with both public and `admin*` prefixed methods
4. **Database migration**: Add `CREATE TABLE IF NOT EXISTS` in `src/config/db.js` → `initDatabase()`

## Important Files

- `mini-cms/app.js` - Entry point, middleware setup, flash message handling
- `mini-cms/src/config/db.js` - Database init, schema definitions, default admin creation
- `mini-cms/src/routes/admin.js` - All admin routes with auth middleware

## After Major Changes (IMPORTANT!)

When you complete any of the following tasks, **UPDATE `.github/SKILL_MAP.md`** accordingly:

1. **New feature added** → Update "Feature → File Mapping" section
2. **New database table** → Update "Database Schema" section  
3. **New model/controller** → Update "Folder Structure" and "AI Agent Skills" sections
4. **New route** → Update the corresponding feature's route list
5. **New middleware** → Update "Folder Structure" section

This ensures the SKILL_MAP stays in sync with the codebase for future AI sessions.
