/**
 * Menu Middleware
 * Load visible menus vào res.locals cho tất cả public pages
 */

const MenuModel = require('../models/menuModel');

/**
 * Middleware load menu động
 * Gán visibleMenus vào res.locals để dùng trong views
 * Với menu type = post_list, attach thêm children posts
 */
function loadMenus(req, res, next) {
  try {
    // Sử dụng getVisibleMenusWithChildren để load cả children cho post_list
    const menus = MenuModel.getVisibleMenusWithChildren();
    
    // Xử lý URL cho từng menu
    const processedMenus = menus.map(menu => {
      let url = menu.slug;
      
      // Với post_list type, không cần URL (chỉ hover để xem dropdown)
      if (menu.type === 'post_list') {
        url = '#'; // hoặc javascript:void(0)
      }
      
      return {
        ...menu,
        url
      };
    });

    res.locals.visibleMenus = processedMenus;
  } catch (error) {
    console.error('Load menus error:', error);
    res.locals.visibleMenus = [];
  }
  
  next();
}

module.exports = {
  loadMenus
};
