# Kế hoạch Vá Bảo mật — MPC Mini CMS

> **Ngày tạo:** 2026-05-09
> **Tham chiếu:** `SECURITY_REPORT.md`
> **Tổng thời gian ước tính:** 3–4 ngày

---

## Tổng quan các Phase

| Phase | Tên | CVEs | Ưu tiên | Thời gian |
|-------|-----|------|---------|-----------|
| 1 | Quick Wins — Vá không cần cài thêm gì | C1, C3, C4, C5, C6 | Khẩn cấp | 1–2 giờ |
| 2 | Security Infrastructure | H1, H2, H3 | Cao | 3–4 giờ |
| 3 | CSRF + Path Safety + Crypto | C2, M1, M2, M3, M4 | Trung bình | 4–6 giờ |
| 4 | Hardening + Cleanup | H4, L1–L5 | Thấp | 2–3 giờ |

---

## Phase 1 — Quick Wins (Không cần cài thêm dependency)

**Mục tiêu:** Vá các lỗi nghiêm trọng nhất mà không cần thêm thư viện nào.

---

### 1.1 Xóa console.log password [CVE-C5]

**File:** `src/config/db.js:152`

**Trước:**
```javascript
console.log(`✅ Đã tạo tài khoản admin: ${username} / ${password}`);
```

**Sau:**
```javascript
console.log(`✅ Đã tạo tài khoản admin: ${username}`);
```

**Thời gian:** 2 phút

---

### 1.2 Fix XSS trong contact-detail.ejs [CVE-C1]

**File:** `src/views/admin/contact-detail.ejs:56`

**Trước:**
```ejs
<%- contact.message.replace(/\n/g, '<br>') %>
```

**Sau:**
```ejs
<%= contact.message.replace(/\n/g, '\n') %>
```
Thêm CSS `white-space: pre-wrap` vào element để giữ xuống dòng mà không cần `<br>`.

**Thời gian:** 10 phút

---

### 1.3 Thêm httpOnly + sameSite vào session cookie [CVE-C3]

**File:** `app.js:43–51`

**Trước:**
```javascript
cookie: {
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000
}
```

**Sau:**
```javascript
cookie: {
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'Strict',
  maxAge: 24 * 60 * 60 * 1000
}
```

**Thời gian:** 5 phút

---

### 1.4 Validate same-origin redirect trong language.js [CVE-C4]

**File:** `src/routes/language.js`

**Sau:**
```javascript
const referer = req.get('Referer');
const host = req.get('Host');
let redirectTo = '/';
if (referer) {
  try {
    const refererUrl = new URL(referer);
    if (refererUrl.host === host) {
      redirectTo = refererUrl.pathname + refererUrl.search;
    }
  } catch (e) {
    // Invalid URL, dùng '/'
  }
}
res.redirect(redirectTo);
```

**Thời gian:** 15 phút

---

### 1.5 Bắt buộc SESSION_SECRET phải được set [CVE-C6]

**File:** `app.js`

**Thêm vào đầu file, trước session middleware:**
```javascript
if (!process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable is not set');
  process.exit(1);
}
```

**Cập nhật `.env.example`:**
```
SESSION_SECRET=  # BẮT BUỘC: tạo bằng: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Thời gian:** 10 phút

---

### Checklist Phase 1

- [ ] 1.1 Xóa console.log password
- [ ] 1.2 Fix XSS contact-detail.ejs
- [ ] 1.3 Thêm httpOnly + sameSite
- [ ] 1.4 Fix open redirect language.js
- [ ] 1.5 Bắt buộc SESSION_SECRET
- [ ] Test: restart server, login, kiểm tra session cookie trong DevTools (phải có httpOnly flag)
- [ ] Test: gửi contact form với `<script>alert(1)</script>` → admin xem → không được alert

---

## Phase 2 — Security Infrastructure

**Mục tiêu:** Cài các thư viện bảo mật chuẩn.

**Packages cần cài:**
```bash
cd mini-cms
npm install helmet express-rate-limit file-type@16
```
> Lưu ý: `file-type` v16 là phiên bản CommonJS. Từ v17 trở đi là ESM-only, không tương thích với `require()`.

---

### 2.1 Cài Helmet — Security Headers [CVE-H2]

**File:** `app.js`

**Thêm sau `const express = require('express')`:**
```javascript
const helmet = require('helmet');
```

**Thêm vào đầu middleware chain (trước express.static):**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:"],
    }
  },
  crossOriginEmbedderPolicy: false
}));
```

**Thời gian:** 30 phút (cần test CSP không block static assets)

---

### 2.2 Rate Limiting trên Login [CVE-H1]

**File:** `src/routes/admin.js`

**Thêm:**
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10,                   // 10 lần thử
  message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Áp dụng cho route login:**
```javascript
router.post('/login', loginLimiter, AuthController.login);
```

**Thời gian:** 15 phút

---

### 2.3 Validate Magic Bytes khi Upload [CVE-H3]

**File:** `src/middlewares/uploadMiddleware.js`

**Thêm sau khi file đã được lưu (trong controller hoặc middleware sau Multer):**
```javascript
const { fileTypeFromFile } = require('file-type');

async function validateFileType(filePath, allowedMimes) {
  const type = await fileTypeFromFile(filePath);
  if (!type || !allowedMimes.includes(type.mime)) {
    fs.unlinkSync(filePath); // Xóa file vi phạm
    throw new Error(`File không hợp lệ. Chỉ cho phép: ${allowedMimes.join(', ')}`);
  }
}
```

**Thời gian:** 45 phút

---

### Checklist Phase 2

- [ ] 2.1 Cài và cấu hình helmet
- [ ] 2.2 Rate limiting trên POST /admin/login
- [ ] 2.3 Magic bytes validation cho upload
- [ ] Test: mở DevTools Network → kiểm tra response headers có CSP, X-Frame-Options
- [ ] Test: thử login sai 11 lần → bị block
- [ ] Test: upload file .html đổi tên thành .jpg → bị reject

---

## Phase 3 — CSRF + Path Safety + Crypto

**Packages cần cài:**
```bash
npm install csurf
```

---

### 3.1 Thêm CSRF Protection [CVE-C2]

**File:** `app.js` + tất cả form views

**Setup middleware:**
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false }); // Dùng session, không dùng cookie
app.use(csrfProtection);

// Expose token cho tất cả views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
```

**Thêm vào tất cả forms (admin + web):**
```ejs
<input type="hidden" name="_csrf" value="<%= csrfToken %>">
```

**Files cần cập nhật:**
- `src/views/admin/post-create.ejs`
- `src/views/admin/post-edit.ejs`
- `src/views/admin/menu-form.ejs`
- `src/views/admin/document-create.ejs`
- `src/views/admin/gallery.ejs`
- `src/views/admin/contact-list.ejs`
- `src/views/admin/contact-detail.ejs`
- `src/views/web/contact.ejs`
- Tất cả form có `method="POST"`

**Thêm error handler cho CSRF:**
```javascript
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('web/error', {
      title: 'Lỗi bảo mật',
      message: 'Form đã hết hạn. Vui lòng tải lại trang.'
    });
  }
  next(err);
});
```

**Lưu ý:** CSRF token cũng cần gửi qua AJAX (menuController reorder). Thêm vào request header:
```javascript
headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content }
```

**Thời gian:** 2–3 giờ (nhiều files)

---

### 3.2 Path Traversal Prevention [CVE-M1, CVE-M2]

**File:** Tạo utility `src/utils/safeFilePath.js`:
```javascript
const path = require('path');

const UPLOADS_DIR = path.resolve(__dirname, '../../public/uploads');

function safeUnlink(relativePath) {
  const resolved = path.resolve(UPLOADS_DIR, '..', relativePath.replace(/^\//, ''));
  if (!resolved.startsWith(UPLOADS_DIR)) {
    throw new Error(`Path traversal detected: ${relativePath}`);
  }
  const fs = require('fs');
  if (fs.existsSync(resolved)) {
    fs.unlinkSync(resolved);
  }
}

function safeResolve(relativePath) {
  const resolved = path.resolve(UPLOADS_DIR, '..', relativePath.replace(/^\//, ''));
  if (!resolved.startsWith(UPLOADS_DIR)) {
    throw new Error(`Path traversal detected: ${relativePath}`);
  }
  return resolved;
}

module.exports = { safeUnlink, safeResolve };
```

**Thay thế trong:** `postController.js`, `documentController.js`, `galleryController.js`

**Thời gian:** 45 phút

---

### 3.3 Filename Generation dùng crypto [CVE-M3]

**File:** `src/middlewares/uploadMiddleware.js`

**Trước:**
```javascript
const random = Math.floor(Math.random() * 10000);
return `${timestamp}-${random}${ext}`;
```

**Sau:**
```javascript
const crypto = require('crypto');
const random = crypto.randomBytes(8).toString('hex');
return `${timestamp}-${random}${ext}`;
```

**Thời gian:** 5 phút

---

### 3.4 Cải thiện Email Validation [CVE-M4]

**File:** `src/controllers/contactController.js`

**Trước:**
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

**Sau:**
```javascript
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
```

**Thời gian:** 10 phút

---

### Checklist Phase 3

- [ ] 3.1 Cài csurf + thêm CSRF token vào tất cả forms
- [ ] 3.2 Tạo safeFilePath utility + thay thế trong controllers
- [ ] 3.3 Đổi Math.random → crypto.randomBytes
- [ ] 3.4 Cải thiện email regex
- [ ] Test: submit form không có CSRF token → bị 403
- [ ] Test: thử path traversal trong filepath → bị reject

---

## Phase 4 — Hardening + Cleanup

**Mục tiêu:** Dọn kỹ thuật nợ, tăng resilience.

---

### 4.1 Input Validation cho Menu Reorder [CVE-H4]

**File:** `src/controllers/menuController.js`

```javascript
reorder(req, res) {
  const { orders } = req.body;
  if (!Array.isArray(orders)) {
    return res.json({ success: false, message: 'Dữ liệu không hợp lệ' });
  }

  // Validate từng phần tử
  const isValid = orders.every(
    (o) =>
      Number.isInteger(Number(o.id)) &&
      Number(o.id) > 0 &&
      Number.isInteger(Number(o.sort_order)) &&
      Number(o.sort_order) >= 0
  );
  if (!isValid) {
    return res.json({ success: false, message: 'Dữ liệu không hợp lệ' });
  }

  MenuModel.reorder(orders);
  return res.json({ success: true });
}
```

**Thời gian:** 20 phút

---

### 4.2 Tạo .env.example với hướng dẫn

**File:** `.env.example`

```bash
# App
NODE_ENV=development
PORT=3000

# Session — BẮT BUỘC thay đổi trong production
# Tạo giá trị ngẫu nhiên: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=

# Admin mặc định (chỉ dùng khi khởi tạo DB lần đầu)
# SAU KHI CHẠY LẦN ĐẦU: đổi mật khẩu ngay trong admin panel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=   # Không để trống, không dùng admin123
```

**Thời gian:** 15 phút

---

### 4.3 Refactor innerHTML → textContent [CVE-L2]

**File:** `public/js/main.js:41`

**Trước:**
```javascript
preview.innerHTML = '<img style="max-width:200px;..." src="">';
```

**Sau:**
```javascript
const img = document.createElement('img');
img.style.cssText = 'max-width:200px;margin-top:10px;border-radius:5px;';
preview.textContent = '';
preview.appendChild(img);
```

**Thời gian:** 15 phút

---

### 4.4 Cập nhật NODE_ENV check trong error handler [CVE-L5]

**File:** `app.js:85–91`

**Trước:**
```javascript
message: process.env.NODE_ENV === 'development' ? err.message : 'Đã xảy ra lỗi'
```

**Sau:**
```javascript
const isDev = process.env.NODE_ENV === 'development';
message: isDev ? err.message : 'Đã xảy ra lỗi hệ thống'
```

Thêm vào startup log để dễ debug:
```javascript
console.log(`Server running in ${process.env.NODE_ENV || 'undefined (defaulting to production-safe)'} mode`);
```

**Thời gian:** 10 phút

---

### Checklist Phase 4

- [ ] 4.1 Validate integer trong menu reorder
- [ ] 4.2 Tạo .env.example với hướng dẫn rõ ràng
- [ ] 4.3 Refactor innerHTML trong main.js
- [ ] 4.4 Fix NODE_ENV check trong error handler
- [ ] Cập nhật `SECURITY_REPORT.md` — đánh dấu các CVE đã vá
- [ ] Cập nhật `CLAUDE.md` — thêm security conventions
- [ ] Cập nhật `SKILL_MAP.md` — ghi nhận các package mới

---

## Tracking Progress

### Phase 1 — Quick Wins
| CVE | Mô tả | Status |
|-----|--------|--------|
| C5 | Xóa console.log password | ✅ Hoàn thành — 2026-05-09 |
| C1 | Fix XSS contact-detail.ejs | ✅ Hoàn thành — 2026-05-09 |
| C3 | httpOnly + sameSite cookie | ✅ Hoàn thành — 2026-05-09 |
| C4 | Fix open redirect language.js | ✅ Hoàn thành — 2026-05-09 |
| C6 | Bắt buộc SESSION_SECRET | ✅ Hoàn thành — 2026-05-09 |

### Phase 2 — Security Infrastructure
| CVE | Mô tả | Status |
|-----|--------|--------|
| H2 | Cài helmet | ✅ Hoàn thành — 2026-05-09 |
| H1 | Rate limiting login | ✅ Hoàn thành — 2026-05-09 |
| H3 | Magic bytes validation | ✅ Hoàn thành — 2026-05-09 |

### Phase 3 — CSRF + Path Safety + Crypto
| CVE | Mô tả | Status |
|-----|--------|--------|
| C2 | CSRF protection | ✅ Hoàn thành — 2026-05-09 |
| M1, M2 | Path traversal prevention | ✅ Hoàn thành — 2026-05-09 |
| M3 | crypto.randomBytes filename | ✅ Hoàn thành — 2026-05-09 |
| M4 | Email validation | ✅ Hoàn thành — 2026-05-09 |

### Phase 4 — Hardening
| CVE | Mô tả | Status |
|-----|--------|--------|
| H4 | Menu reorder validation | ✅ Hoàn thành — 2026-05-09 |
| L1 | .env.example documentation | ✅ Hoàn thành — 2026-05-09 |
| L2 | innerHTML → textContent | ✅ Hoàn thành — 2026-05-09 |
| L5 | NODE_ENV error handler | ✅ Hoàn thành — 2026-05-09 |

---

## Dependencies Summary

| Package | Phiên bản | Mục đích | Phase |
|---------|-----------|---------|-------|
| `helmet` | latest | Security headers | 2 |
| `express-rate-limit` | latest | Brute force protection | 2 |
| `file-type` | ^16.0.0 | Magic bytes validation | 2 |
| `csurf` | latest | CSRF protection | 3 |

```bash
npm install helmet express-rate-limit file-type@16 csurf
```

---

*Sau khi hoàn thành tất cả phases: chạy lại security scan và cập nhật SECURITY_REPORT.md với status "RESOLVED" cho từng CVE.*
