/**
 * Upload Middleware
 * Cấu hình Multer cho upload file
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

let fileTypeModulePromise;
async function detectFileType(filePath) {
  fileTypeModulePromise ||= import('file-type');
  const { fileTypeFromFile } = await fileTypeModulePromise;
  return fileTypeFromFile(filePath);
}

const IMAGE_ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const PDF_ALLOWED_MIMES   = ['application/pdf'];

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
  const ext    = path.extname(originalname);
  const timestamp = Date.now();
  const random = require('crypto').randomBytes(8).toString('hex');
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
// MIDDLEWARE WRAPPER — xử lý lỗi + validate magic bytes
// ============================================
function handleUploadError(uploadMiddleware, allowedMimes) {
  return (req, res, next) => {
    uploadMiddleware(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        req.uploadError = err.code === 'LIMIT_FILE_SIZE' ? 'File quá lớn' : 'Lỗi upload file';
        return next();
      }
      if (err) {
        req.uploadError = err.message;
        return next();
      }

      // Validate nội dung thực tế của file (magic bytes) — không tin MIME từ client
      const files = req.file ? [req.file] : (req.files || []);
      for (const file of files) {
        try {
          const detected = await detectFileType(file.path);
          if (!detected || !allowedMimes.includes(detected.mime)) {
            fs.unlinkSync(file.path);
            req.uploadError = 'File không hợp lệ. Nội dung không khớp định dạng được phép.';
            req.file  = undefined;
            req.files = undefined;
            return next();
          }
        } catch (e) {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          req.uploadError = 'Không thể xác thực file upload.';
          req.file  = undefined;
          req.files = undefined;
          return next();
        }
      }

      next();
    });
  };
}

module.exports = {
  uploadImage:   handleUploadError(uploadImage.single('thumbnail'),   IMAGE_ALLOWED_MIMES),
  uploadGallery: handleUploadError(uploadImage.array('images', 20),   IMAGE_ALLOWED_MIMES),
  uploadPdf:     handleUploadError(uploadPdf.single('file'),          PDF_ALLOWED_MIMES),
  imageDir,
  pdfDir
};
