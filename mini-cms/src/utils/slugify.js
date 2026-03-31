/**
 * Slugify Utility
 * Chuyển đổi tiêu đề thành slug URL-friendly
 */

/**
 * Chuyển đổi text thành slug
 * Hỗ trợ tiếng Việt
 */
function slugify(text) {
  if (!text) return '';
  
  // Bảng chuyển đổi tiếng Việt
  const vietnameseMap = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'đ': 'd',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y'
  };

  let slug = text.toLowerCase();
  
  // Chuyển đổi ký tự tiếng Việt
  for (const [key, value] of Object.entries(vietnameseMap)) {
    slug = slug.replace(new RegExp(key, 'g'), value);
  }
  
  // Xóa các ký tự đặc biệt, chỉ giữ chữ, số và khoảng trắng
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  
  // Thay khoảng trắng bằng dấu gạch ngang
  slug = slug.replace(/\s+/g, '-');
  
  // Xóa các dấu gạch ngang liên tiếp
  slug = slug.replace(/-+/g, '-');
  
  // Xóa dấu gạch ngang ở đầu và cuối
  slug = slug.replace(/^-+|-+$/g, '');
  
  return slug;
}

/**
 * Tạo slug unique bằng cách thêm số
 */
function makeUniqueSlug(baseSlug, existsCallback) {
  let slug = baseSlug;
  let counter = 1;
  
  while (existsCallback(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

module.exports = {
  slugify,
  makeUniqueSlug
};
