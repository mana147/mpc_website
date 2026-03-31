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
            preview.innerHTML = '<img style="max-width:200px;margin-top:10px;border-radius:5px;">';
            thumbnailInput.parentNode.appendChild(preview);
          }
          preview.querySelector('img').src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
});
