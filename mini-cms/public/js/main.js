/**
 * Mini CMS JavaScript
 * Basic client-side functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  // Auto-hide alerts after 5 seconds
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(function(alert) {
    setTimeout(function() {
      alert.style.transition = 'opacity 0.5s';
      alert.style.opacity = '0';
      setTimeout(function() {
        alert.remove();
      }, 500);
    }, 5000);
  });

  // Confirm before delete
  const deleteForms = document.querySelectorAll('form[action*="/delete"]');
  deleteForms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      if (!confirm('Bạn có chắc muốn xóa?')) {
        e.preventDefault();
      }
    });
  });

  // Preview image before upload
  const thumbnailInput = document.getElementById('thumbnail');
  if (thumbnailInput) {
    thumbnailInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          let preview = document.querySelector('.upload-preview');
          if (!preview) {
            preview = document.createElement('div');
            preview.className = 'upload-preview';
            const img = document.createElement('img');
            img.style.cssText = 'max-width:200px;margin-top:10px;border-radius:5px;';
            preview.appendChild(img);
            thumbnailInput.parentNode.appendChild(preview);
          }
          preview.querySelector('img').src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Mobile dropdown toggle - Updated for new structure
  const dropdownItems = document.querySelectorAll('.nav-item.has-dropdown');
  dropdownItems.forEach(function(item) {
    const link = item.querySelector('.nav-link');
    if (link) {
      link.addEventListener('click', function(e) {
        // Chỉ toggle trên mobile
        if (window.innerWidth <= 768) {
          e.preventDefault();
          // Đóng các dropdown khác
          dropdownItems.forEach(function(other) {
            if (other !== item) {
              other.classList.remove('mobile-open');
            }
          });
          item.classList.toggle('mobile-open');
        }
      });
    }
  });
});

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
  const nav = document.querySelector('.main-nav');
  if (nav) {
    nav.classList.toggle('mobile-open');
  }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
  const nav = document.querySelector('.main-nav');
  const toggle = document.querySelector('.mobile-menu-toggle');
  
  if (nav && nav.classList.contains('mobile-open')) {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove('mobile-open');
    }
  }
});
