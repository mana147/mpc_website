# Mini CMS

Hệ thống quản lý nội dung đơn giản cho website doanh nghiệp nhỏ.

## Tính năng

- ✅ Quản lý bài viết (CRUD)
- ✅ Upload và quản lý hình ảnh
- ✅ Upload và quản lý tài liệu PDF
- ✅ Trang public: Trang chủ, Bài viết, Tài liệu
- ✅ Admin panel với đăng nhập session
- ✅ Responsive design

## Công nghệ sử dụng

- Node.js + Express.js
- EJS (View Engine)
- SQLite (Database)
- Multer (Upload file)
- bcrypt (Hash password)
- express-session (Authentication)

## Cài đặt

### 1. Clone project

```bash
cd mini-cms
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` nếu cần (thay đổi SESSION_SECRET trong production).

### 4. Chạy development server

```bash
npm run dev
```

### 5. Chạy production

```bash
npm start
```

## Truy cập

- **Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

### Tài khoản admin mặc định

- Username: `admin`
- Password: `admin123`

⚠️ **Lưu ý**: Hãy đổi mật khẩu admin ngay sau khi deploy!

## Cấu trúc thư mục

```
mini-cms/
├── app.js                 # Entry point
├── package.json
├── .env                   # Environment variables
├── /src
│   ├── /config           # Database config
│   ├── /controllers      # Request handlers
│   ├── /middlewares      # Auth & Upload middleware
│   ├── /models           # Database models
│   ├── /routes           # Route definitions
│   ├── /utils            # Helper functions
│   └── /views            # EJS templates
├── /public
│   ├── /css              # Stylesheets
│   ├── /js               # Client-side JavaScript
│   └── /uploads          # Uploaded files
└── /database             # SQLite database
```

## Routes

### Public Routes

| Method | URL | Mô tả |
|--------|-----|-------|
| GET | / | Trang chủ |
| GET | /posts | Danh sách bài viết |
| GET | /posts/:slug | Chi tiết bài viết |
| GET | /documents | Danh sách tài liệu |
| GET | /documents/:id/download | Tải tài liệu |

### Admin Routes

| Method | URL | Mô tả |
|--------|-----|-------|
| GET | /admin/login | Form đăng nhập |
| POST | /admin/login | Xử lý đăng nhập |
| POST | /admin/logout | Đăng xuất |
| GET | /admin | Dashboard |
| GET | /admin/posts | Danh sách bài viết |
| GET | /admin/posts/create | Form tạo bài viết |
| POST | /admin/posts/create | Tạo bài viết |
| GET | /admin/posts/:id/edit | Form sửa bài viết |
| POST | /admin/posts/:id/edit | Cập nhật bài viết |
| POST | /admin/posts/:id/delete | Xóa bài viết |
| GET | /admin/documents | Danh sách tài liệu |
| GET | /admin/documents/create | Form upload tài liệu |
| POST | /admin/documents/create | Upload tài liệu |
| POST | /admin/documents/:id/delete | Xóa tài liệu |

## Deploy lên VPS

1. Cài đặt Node.js (v18+)
2. Clone code lên server
3. Cài dependencies: `npm install --production`
4. Cấu hình `.env` (đặc biệt SESSION_SECRET)
5. Sử dụng PM2 để chạy production:

```bash
npm install -g pm2
pm2 start app.js --name mini-cms
pm2 save
pm2 startup
```

## Mở rộng sau này

Project được thiết kế đơn giản để dễ mở rộng:

- Thêm category/tag cho bài viết
- Thêm rich text editor (TinyMCE, CKEditor)
- Thêm tìm kiếm
- Thêm phân trang
- Thêm nhiều user roles
- Chuyển sang MySQL/PostgreSQL
- Thêm API REST

## License

MIT
