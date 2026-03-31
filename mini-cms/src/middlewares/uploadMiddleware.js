/**
 * Upload Middleware
 * Cấu hình Multer cho upload file
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục upload tồn tại
const imageDir = path.join(__dirname, '../../public/uploads/images');
const pdfDir = path.join(__dirname, '../../public/uploads/pdfs');

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

/**
 * Tạo tên file unique
 */
function generateFilename(originalname) {
  const ext = path.extname(originalname);
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${timestamp}-${random}${ext}`;
}

// ============================================
// STORAGE CHO HÌNH ẢNH
// ============================================
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file.originalname));
  }
});

// Filter chỉ cho phép ảnh
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh (jpg, jpeg, png, webp)'), false);
  }
};

// Multer instance cho ảnh
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// ============================================
// STORAGE CHO PDF
// ============================================
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pdfDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file.originalname));
  }
});

// Filter chỉ cho phép PDF
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file PDF'), false);
  }
};

// Multer instance cho PDF
const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

// ============================================
// MIDDLEWARE WRAPPER để xử lý lỗi
// ============================================
function handleUploadError(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          req.uploadError = 'File quá lớn';
        } else {
          req.uploadError = 'Lỗi upload file';
        }
      } else if (err) {
        req.uploadError = err.message;
      }
      next();
    });
  };
}

module.exports = {
  uploadImage: handleUploadError(uploadImage.single('thumbnail')),
  uploadPdf: handleUploadError(uploadPdf.single('file')),
  imageDir,
  pdfDir
};
