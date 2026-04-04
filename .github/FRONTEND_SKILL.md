# 🎨 MPC WEBSITE - FRONTEND SKILL MAP

> **Purpose**: Tài liệu mô tả cấu trúc và quy ước frontend cho website MPC (Cảng MIPEC)
> **Auto-generated**: April 4, 2026
> **Type**: Static HTML/CSS Frontend với Bootstrap 5

---

## 1. Tổng quan Architecture

### 1.1 Cấu trúc thư mục Frontend

```
frontend/
├── assets/                     # Static assets (images, icons)
│   ├── logo.png               # Logo chính
│   ├── home-banner.png        # Banner trang chủ
│   ├── about/                 # Assets cho trang Về MPC
│   ├── Dịch vụ/               # Assets cho trang Dịch vụ
│   ├── Hạ tầng/               # Assets cho trang Cơ sở hạ tầng
│   ├── Liên hệ/               # Assets cho trang Liên hệ
│   ├── Thư viện/              # Assets cho thư viện ảnh
│   ├── Tin tức/               # Assets cho trang Tin tức
│   ├── Trang chủ/             # Assets cho Homepage
│   └── Tuyển dụng/            # Assets cho trang Tuyển dụng
│
├── components/                 # Reusable components
│   ├── Header.html            # Header template (reference)
│   ├── Header.css             # Header styles
│   ├── Footer.css             # Footer styles
│   ├── Sidebar.html           # Sidebar menu template
│   └── Sidebar.css            # Sidebar styles
│
├── css/                        # Foundation CSS
│   ├── variables.css          # CSS Variables (Design Tokens)
│   └── common.css             # Shared component styles
│
└── pages/                      # Page-specific HTML/CSS
    ├── About_mipec/
    │   ├── about_mipec.html
    │   └── about_mipec.css
    ├── Cơ sở hạ tầng/
    │   ├── ha-tang.html
    │   └── ha-tang.css
    ├── Dịch vụ/
    │   ├── dich-vu.html         # Danh sách dịch vụ
    │   ├── dich-vu.css
    │   ├── chi-tiet-dich-vu.html # Chi tiết dịch vụ
    │   └── chi-tiet-dich-vu.css
    ├── Liên hệ/
    │   ├── lien-he.html
    │   └── lien-he.css
    ├── Thư viện/
    │   ├── thu-vien.html
    │   └── thu-vien.css
    ├── Tin tức/
    │   ├── tin-tuc.html         # Danh sách tin tức
    │   ├── tin-tuc.css
    │   ├── chi-tiet-tin-tuc.html # Chi tiết tin tức
    │   └── chi-tiet-tin-tuc.css
    ├── Trang chủ/
    │   ├── home.html            # Homepage
    │   └── page.css
    └── Tuyển dụng/
        ├── tuyen-dung.html      # Danh sách tuyển dụng
        ├── tuyen-dung.css
        ├── chi-tiet-tuyen-dung.html
        └── chi-tiet-tuyen-dung.css
```

---

## 2. Design System (CSS Variables)

### 2.1 Color Palette

```css
/* Primary Colors */
--color-primary: #DF1F28;           /* Màu đỏ chủ đạo */
--color-primary-hover: #c91b23;     /* Hover state */
--color-primary-light: rgba(223, 31, 40, 0.1);

/* Secondary / Accent */
--color-accent: #FCB248;            /* Màu cam accent */
--color-gradient: linear-gradient(to right, #DF1F28, #FCB248);

/* Neutral Colors */
--color-text: #333333;              /* Text chính */
--color-text-muted: #666666;        /* Text phụ */
--color-text-light: #828282;        /* Text nhạt */
--color-white: #FFFFFF;
--color-black: #000000;

/* Background Colors */
--color-bg-primary: #FFFFFF;
--color-bg-secondary: #F5F5F5;
--color-bg-dark: #2c3e7d;
--color-bg-overlay: rgba(0, 0, 0, 0.3);

/* Border Colors */
--color-border: #EAEAEA;
--color-border-active: #ff4d4f;
```

### 2.2 Typography

```css
/* Font Family */
--font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes (Mobile First) */
--font-size-xs: 12px;
--font-size-sm: 13px;
--font-size-base: 14px;
--font-size-md: 16px;
--font-size-lg: 18px;
--font-size-xl: 24px;
--font-size-2xl: 28px;
--font-size-3xl: 32px;
--font-size-4xl: 36px;
--font-size-hero: clamp(32px, 8vw, 60px);

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### 2.3 Spacing Scale

```css
--spacing-xs: 8px;
--spacing-sm: 12px;
--spacing-md: 16px;
--spacing-lg: 20px;
--spacing-xl: 30px;
--spacing-2xl: 40px;
--spacing-3xl: 60px;
--spacing-4xl: 80px;
--spacing-5xl: 100px;
```

### 2.4 Breakpoints (Mobile-First)

```css
/* Breakpoint Reference:
 * - Base: 0-639px (Mobile)
 * - sm: 640px+ (Large phones, small tablets)
 * - md: 768px+ (Tablets)
 * - lg: 960px+ (Small laptops)
 * - xl: 1200px+ (Desktop)
 * - xxl: 1400px+ (Large desktop)
 */

/* Container Max Widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 960px;
--container-xl: 1200px;
--container-xxl: 1400px;
```

---

## 3. Component Patterns

### 3.1 Header Component

```css
/* File: components/Header.css */
.mpc-header {
    background: transparent;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: var(--z-header);       /* z-index: 1000 */
}

.header-container {
    max-width: 1400px;
    height: 70px;
    padding: 0 30px;
}

/* Navigation Menu */
.nav-menu li a {
    padding: 10px 18px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
}

/* Submenu (Dropdown) */
.header-nav .sub-menu {
    position: absolute;
    /* hover to show */
}
```

### 3.2 Hero Section

```css
/* File: css/common.css */
.hero-banner,
.hero-section {
    position: relative;
    width: 100%;
    min-height: var(--hero-height-mobile);  /* 280px */
    overflow: hidden;
}

/* Responsive Heights */
/* sm: 350px, lg: 445px, xl: 600px */

.hero-overlay {
    background: var(--color-bg-overlay);
    z-index: 1;
}

.hero-title {
    font-size: var(--font-size-hero);
    color: var(--color-white);
    text-transform: uppercase;
}
```

### 3.3 Card Component

```css
/* File: css/common.css */
.card {
    background: var(--color-bg-primary);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    transition: var(--transition-base);
}

.card:hover {
    border-color: var(--color-border-active);  /* #ff4d4f */
    box-shadow: var(--shadow-card);
}

.card-image {
    aspect-ratio: 4/3;
}

.card:hover .card-image img {
    transform: scale(1.05);
}
```

### 3.4 Grid Layouts

```css
/* File: css/common.css */
.card-grid {
    display: grid;
    gap: var(--grid-gap-md);
    grid-template-columns: 1fr;
}

/* Responsive Grid */
@media (min-width: 640px) {
    .card-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 960px) {
    .card-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1200px) {
    .card-grid-4 { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 4. Page Structure Pattern

### 4.1 HTML Template Pattern

Mỗi page HTML tuân theo cấu trúc:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - MPCC</title>
    
    <!-- External Libraries -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    
    <!-- Foundation CSS -->
    <link rel="stylesheet" href="../../css/variables.css">
    <link rel="stylesheet" href="../../css/common.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../../components/Header.css">
    <link rel="stylesheet" href="../../components/Footer.css">
    <link rel="stylesheet" href="../../components/Sidebar.css">  <!-- Optional -->
    
    <!-- Page CSS -->
    <link rel="stylesheet" href="page-name.css">
</head>
<body>
    <!-- Header -->
    <header class="mpc-header">...</header>

    <!-- Hero Banner -->
    <section class="hero-banner">
        <div class="hero-overlay"></div>
        <img src="../../assets/banner.png" alt="Banner">
    </section>

    <!-- Main Content -->
    <main class="main-content">
        <div class="container">
            <div class="section-header">
                <h1 class="page-title">TIÊU ĐỀ TRANG</h1>
                <p class="page-subtitle">Mô tả ngắn</p>
            </div>
            <!-- Page-specific content -->
        </div>
    </main>

    <!-- Footer -->
    <footer>...</footer>
</body>
</html>
```

### 4.2 CSS Import Pattern

```css
/**
 * Page Name - Page Styles
 * Imports shared foundation from variables.css and common.css
 */
@import url('../../css/variables.css');
@import url('../../css/common.css');

/* Page-specific styles below */
```

---

## 5. Navigation Structure

### 5.1 Menu Items

| Menu Label | Page | Path |
|------------|------|------|
| TRANG CHỦ | Homepage | `/pages/Trang chủ/home.html` |
| VỀ MPC | About | `/pages/About_mipec/about_mipec.html` |
| CƠ SỞ HẠ TẦNG | Infrastructure | `/pages/Cơ sở hạ tầng/ha-tang.html` |
| DỊCH VỤ | Services (Dropdown) | `/pages/Dịch vụ/dich-vu.html` |
| TIN TỨC | News | `/pages/Tin tức/tin-tuc.html` |
| TUYỂN DỤNG | Careers | `/pages/Tuyển dụng/tuyen-dung.html` |
| LIÊN HỆ | Contact | `/pages/Liên hệ/lien-he.html` |

### 5.2 Submenu - Dịch vụ

```
DỊCH VỤ
├── DỊCH VỤ CẢNG QUẢN TRỊ E-PORT
├── BẢNG GIÁ CHỨNG TỪ
├── TRA CỨU VỊ TRÍ CONTAINER
├── TRA CỨU HÓA ĐƠN ĐIỆN TỬ
├── THÔNG TIN TÀU RA VÀO CẢNG
└── BẢNG THỦY TRIỀU
```

---

## 6. Feature Components

### 6.1 Quick Access Nav Bar (Homepage)

```html
<div class="nav-bar">
    <a href="#" class="nav-option">
        <svg>...</svg>     <!-- Icon SVG với gradient -->
        EPORT
    </a>
    <a href="#" class="nav-option">XEM LỊCH TÀU</a>
    <a href="#" class="nav-option">TRA CỨU VỊ TRÍ CONTAINER</a>
    <a href="#" class="nav-option">TRA CỨU HĐĐT</a>
</div>
```

### 6.2 Language Switcher

```html
<div class="header-language">
    <img src="https://flagcdn.com/w20/vn.png" alt="VN" class="flag-icon">
    <span>VIE</span>
    <span class="dropdown-icon">▼</span>
</div>
```

### 6.3 Sidebar Menu (News/Blog pages)

```html
<div class="sidebar-menu">
    <h3 class="sidebar-menu-title">Menu</h3>
    <ul class="sidebar-menu-list">
        <li class="active"><a href="#">Trang chủ</a></li>
        <li><a href="#">Cơ sở hạ tầng</a></li>
    </ul>
</div>
```

---

## 7. Naming Conventions

### 7.1 CSS Class Naming (BEM-inspired)

```css
/* Component */
.service-card { }

/* Component element */
.service-card .service-image { }
.service-card .service-title { }
.service-card .service-excerpt { }

/* State modifier */
.service-card.active { }
.nav-menu li a.active { }
```

### 7.2 File Naming

| Type | Convention | Example |
|------|------------|---------|
| HTML page (list) | `kebab-case.html` | `dich-vu.html`, `tin-tuc.html` |
| HTML page (detail) | `chi-tiet-{type}.html` | `chi-tiet-dich-vu.html` |
| CSS page | `{page-slug}.css` | `dich-vu.css`, `page.css` |
| CSS component | `PascalCase.css` | `Header.css`, `Footer.css` |
| Assets folder | Vietnamese name | `Dịch vụ/`, `Tin tức/` |

---

## 8. Integration với Mini-CMS

Frontend này là **static HTML mockups** được dùng làm reference cho `mini-cms`:

| Frontend | → | Mini-CMS |
|----------|---|----------|
| `frontend/pages/` | → | `mini-cms/src/views/web/` (EJS) |
| `frontend/css/` | → | `mini-cms/public/css/` |
| `frontend/assets/` | → | `mini-cms/public/assets/` |
| `frontend/components/` | → | `mini-cms/src/views/partials/` |

### 8.1 Conversion Pattern

```ejs
<!-- Frontend: static HTML -->
<h1 class="page-title">TIN TỨC</h1>

<!-- Mini-CMS: dynamic EJS -->
<h1 class="page-title"><%= menu.name %></h1>
```

---

## 9. Quick Reference

### 9.1 Add New Page Checklist

1. [ ] Tạo folder trong `pages/` (Vietnamese name OK)
2. [ ] Tạo `page-name.html` với template pattern
3. [ ] Tạo `page-name.css` với imports
4. [ ] Tạo assets folder trong `assets/` nếu cần
5. [ ] Update navigation menu trong tất cả pages

### 9.2 Responsive Testing Breakpoints

```
Mobile:   375px (iPhone SE)
Tablet:   768px (iPad)
Laptop:   1024px (MacBook)
Desktop:  1280px+
```

### 9.3 External Dependencies

```html
<!-- Bootstrap 5.3 -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">

<!-- Bootstrap Icons -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">

<!-- Font Awesome 6.5 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

<!-- Google Fonts - Barlow -->
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap');
```

---

## 10. AI Agent Instructions

### 10.1 Khi tạo page mới

```markdown
1. Copy template từ `/pages/Trang chủ/home.html`
2. Đảm bảo import đúng thứ tự CSS:
   - variables.css → common.css → components → page.css
3. Sử dụng CSS variables thay vì hardcode colors
4. Follow mobile-first responsive pattern
```

### 10.2 Khi sửa styles

```markdown
1. Check `css/variables.css` trước khi thêm color/spacing mới
2. Styles dùng chung → thêm vào `css/common.css`
3. Styles riêng page → thêm vào `pages/{folder}/{page}.css`
4. Component styles → thêm vào `components/{Component}.css`
```

### 10.3 Khi convert sang Mini-CMS

```markdown
1. Giữ nguyên CSS class names
2. Replace static content với EJS variables
3. Header/Footer → partials
4. Navigation → dynamic từ menuMiddleware
```

---

**Last Updated**: April 4, 2026
