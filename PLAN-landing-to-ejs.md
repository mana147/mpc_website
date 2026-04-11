# Plan: Migrate landing.html to EJS in mini-cms

## Context

The static prototype at `view-html/trang_chu/landing.html` is the design reference for MPC Port's homepage. The CMS (`mini-cms/`) currently has a generic "Mini CMS" look with system fonts, blue/purple scheme, and a simple hero+posts+documents layout. The goal is to replace the public-facing homepage (and header/footer) with the MPC Port branded design, while keeping admin pages untouched.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CSS strategy | Separate new CSS files (mpc-base, mpc-header, mpc-footer, pages/landing) | Admin pages keep `style.css` unchanged |
| Header/Footer | New partials `mpc-header.ejs` + `mpc-footer.ejs` | Zero collision with admin; `.mpc-header` vs `.site-header` |
| Bootstrap | CDN links in `mpc-header.ejs` only | Admin pages never see Bootstrap |
| Font | Copy Barlow Condensed TTFs to `public/fonts/` | Loaded via `@font-face` in `mpc-base.css` |
| Dynamic content | News from `PostModel.getLatest(9)`, Gallery from `GalleryModel.getAll(6)` | Rest hardcoded with i18n |
| JS | New `public/js/landing.js` (adapted, bugs fixed) | `main.js` stays for admin only |

## Files to Create (new)

| File | Lines | Source |
|------|-------|--------|
| `public/css/mpc-base.css` | ~150 | @font-face + CSS vars + shared components |
| `public/css/mpc-header.css` | ~400 | Port from `view-html/components/Header.css` |
| `public/css/mpc-footer.css` | ~190 | Port from `view-html/components/Footer.css` |
| `public/css/pages/landing.css` | ~2000 | Port from `view-html/trang_chu/landing.css` (without @font-face) |
| `src/views/partials/mpc-header.ejs` | ~70 | New MPC-branded header with dynamic menu + lang switcher |
| `src/views/partials/mpc-footer.ejs` | ~80 | New 4-column footer with social icons + contact info |
| `public/js/landing.js` | ~170 | Adapted from `view-html/assets/js/landing.js` (fix bugs) |
| `public/fonts/barlow-condensed/*.ttf` | 6 files | Copy from `view-html/assets/fonts/` |
| `public/images/icons/*.svg` | ~18 files | Copy from `view-html/assets/icons/` |
| `public/images/logo.png` | 1 file | Copy from `view-html/assets/logo.png` |
| `public/images/map-vietnam.svg` | 1 file | Copy from `view-html/assets/map-vietnam.svg` |

## Files to Modify (existing)

| File | Change |
|------|--------|
| `src/views/web/home.ejs` | **Full rewrite** - 11 sections from prototype |
| `src/routes/web.js` | Add GalleryModel import, update home route to pass gallery + 9 posts |
| `src/views/web/posts.ejs` | Switch to mpc-header/mpc-footer includes |
| `src/views/web/post-detail.ejs` | Switch to mpc-header/mpc-footer includes |
| `src/views/web/gallery.ejs` | Switch to mpc-header/mpc-footer includes |
| `src/views/web/documents.ejs` | Switch to mpc-header/mpc-footer includes |
| `src/views/web/contact.ejs` | Switch to mpc-header/mpc-footer includes |
| `src/views/web/menu-page.ejs` | Switch to mpc-header/mpc-footer includes |
| `src/views/web/404.ejs` | Switch to mpc-header/mpc-footer includes |
| `src/views/web/error.ejs` | Switch to mpc-header/mpc-footer includes |
| `src/locales/vi.json` | Add landing + footer translation keys |
| `src/locales/en.json` | Add landing + footer translation keys |

## Files NOT Touched

- `app.js` (no middleware changes)
- `public/css/style.css` (admin pages keep working)
- `public/js/main.js` (admin pages keep working)
- All `src/views/admin/*.ejs`
- All `src/models/`, `src/controllers/`, `src/middlewares/`
- `src/views/partials/header.ejs`, `footer.ejs`, `admin-sidebar.ejs` (kept for reference/fallback)

## Execution Steps

### Phase 0: Copy Assets
1. `mkdir -p public/fonts/barlow-condensed && cp view-html/assets/fonts/barlow-condensed/*.ttf public/fonts/barlow-condensed/`
2. `mkdir -p public/images/icons && cp view-html/assets/icons/* public/images/icons/`
3. `cp view-html/assets/logo.png public/images/logo.png`
4. `cp view-html/assets/map-vietnam.svg public/images/map-vietnam.svg`

### Phase 1: Create CSS Files
1. Create `public/css/mpc-base.css` - @font-face (6 weights), CSS custom properties, shared components (`.btn-outline`, `.title1`, `.title2`, `.more-link`), plus public page rules extracted from `style.css` (post-grid, gallery-hero, etc.) so other pages look correct
2. Create `public/css/mpc-header.css` - port Header.css, update image paths to `/images/icons/`
3. Create `public/css/mpc-footer.css` - port Footer.css as-is
4. Create `public/css/pages/landing.css` - port landing.css, remove @font-face, update all image paths from `../assets/` to `/uploads/images/Trang%20ch%E1%BB%A7/` and `/images/icons/`

### Phase 2: Create EJS Partials
1. Create `mpc-header.ejs` - DOCTYPE + head (Bootstrap CDN + MPC CSS + optional pageCss) + MPC branded header (transparent overlay, dynamic nav from `visibleMenus`, functional lang switcher) + `<main>` open
2. Create `mpc-footer.ejs` - `</main>` close + 4-column footer (about, 2 menu cols from `visibleMenus`, contact) + Bootstrap JS CDN + optional pageJs + close tags

### Phase 3: Rewrite Homepage
1. Rewrite `home.ejs` with all 11 sections using `mpc-header`/`mpc-footer` includes
   - Hero, Quick Nav, About, Port Image, Geo, Facility, Services: hardcoded with i18n
   - Gallery: dynamic from `galleryImages` with static fallback
   - News: dynamic from `posts` array (9 items)
2. Update `web.js` home route: add `GalleryModel` import, pass `galleryImages`, increase posts to 9, add `currentPath: '/'`

### Phase 4: Migrate Other Public Pages
For each of the 8 remaining web views:
1. Replace `<%- include('../partials/header') %>` with `<%- include('../partials/mpc-header') %>`
2. Replace `<%- include('../partials/footer') %>` with `<%- include('../partials/mpc-footer') %>`
3. Remove the `<div class="container">` wrapper that old header.ejs opened (add own container where needed)
4. Test each page individually

### Phase 5: i18n Keys
Add translation keys to both `vi.json` and `en.json` for:
- `landing.*` (about_label, about_title, about_text, geo_title, facility_title, services_title, gallery_title, news_title, learn_more, view_map)
- `footer.*` (description, connect, category, contact_title)

### Phase 6: Cleanup + CLAUDE.md Update
- Update CLAUDE.md: new files in folder structure, updated feature mapping
- Optionally rename old `header.ejs`/`footer.ejs` to `header-legacy.ejs`/`footer-legacy.ejs`

## Image Path Mapping

Landing images are already at `public/uploads/images/Trang chủ/`:
| Prototype Path | CMS Path |
|---|---|
| `../assets/landing/home-banner.png` | `/uploads/images/Trang%20ch%E1%BB%A7/home-banner.png` |
| `../assets/landing/facility-img*.png` | `/uploads/images/Trang%20ch%E1%BB%A7/facility-img*.png` |
| `../assets/landing/service-img*.png` | `/uploads/images/Trang%20ch%E1%BB%A7/service-img*.png` |
| `../assets/icons/*.svg` | `/images/icons/*.svg` |
| `../assets/logo.png` | `/images/logo.png` |
| `../assets/map-vietnam.svg` | `/images/map-vietnam.svg` |

## Known Issues to Fix During Migration

1. **landing.js line 91**: `images.length` should be `arrayImages.length` (undefined variable bug)
2. **Tab switch commented out**: Uncomment and wire up facility tabs
3. **URL-encoded Vietnamese paths**: Use `encodeURIComponent()` or pre-encode in templates

## Verification

1. `cd mini-cms && npm run dev`
2. Open `http://localhost:3000/` - verify all 11 landing sections render correctly
3. Check responsive: 2200px, 1720px, 1368px, 959px, 640px, <639px
4. Test mobile menu toggle and submenu dropdown
5. Test facility image slider (thumbnails + next button)
6. Test service carousel (arrows + dots)
7. Test gallery auto-slider
8. Open `http://localhost:3000/admin` - verify admin pages unchanged
9. Test language switch: `/lang/en` then `/lang/vi`
10. Check all other public pages: /posts, /gallery, /documents, /contact
