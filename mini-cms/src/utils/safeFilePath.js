const path = require('path');
const fs   = require('fs');

const UPLOADS_ROOT = path.resolve(__dirname, '../../public/uploads');

// Xóa file an toàn — chặn path traversal
function safeUnlink(filepath) {
  if (!filepath) return;
  const full = path.resolve(__dirname, '../../public', filepath.replace(/^\//, ''));
  if (!full.startsWith(UPLOADS_ROOT)) {
    throw new Error(`Path traversal blocked: ${filepath}`);
  }
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

// Resolve path an toàn — chặn path traversal
function safeResolve(filepath) {
  const full = path.resolve(__dirname, '../../public', filepath.replace(/^\//, ''));
  if (!full.startsWith(UPLOADS_ROOT)) {
    throw new Error(`Path traversal blocked: ${filepath}`);
  }
  return full;
}

module.exports = { safeUnlink, safeResolve };
