/**
 * Database Configuration
 * Sử dụng better-sqlite3 (sync) cho đơn giản
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Đường dẫn database
const dbPath = path.join(__dirname, '../../database/cms.sqlite');

// Đảm bảo thư mục database tồn tại
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Tạo connection
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('journal_mode = WAL');

/**
 * Khởi tạo database - tạo bảng và admin mặc định
 */
function initDatabase() {
  console.log('📦 Đang khởi tạo database...');

  // Tạo bảng users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tạo bảng posts
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      content TEXT,
      thumbnail TEXT,
      status TEXT DEFAULT 'draft',
      title_en TEXT,
      excerpt_en TEXT,
      content_en TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Thêm cột tiếng Anh nếu chưa có (cho database cũ)
  try {
    db.exec(`ALTER TABLE posts ADD COLUMN title_en TEXT`);
    db.exec(`ALTER TABLE posts ADD COLUMN excerpt_en TEXT`);
    db.exec(`ALTER TABLE posts ADD COLUMN content_en TEXT`);
  } catch (e) {
    // Cột đã tồn tại, bỏ qua
  }

  // Tạo bảng documents
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tạo bảng gallery_images
  db.exec(`
    CREATE TABLE IF NOT EXISTS gallery_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      alt_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tạo bảng contacts
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tạo bảng menus
  db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_vi TEXT NOT NULL,
      name_en TEXT,
      slug TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      linked_post_id INTEGER,
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (linked_post_id) REFERENCES posts(id) ON DELETE SET NULL
    )
  `);

  // Tạo bảng jobs (tin tuyển dụng)
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT,
      salary TEXT,
      hiring_count INTEGER DEFAULT 1,
      deadline TEXT,
      thumbnail TEXT,
      status TEXT DEFAULT 'draft',
      title_en TEXT,
      content_en TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tạo bảng menu_posts (quan hệ nhiều-nhiều giữa menu và posts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(menu_id, post_id)
    )
  `);

  // Tạo admin mặc định nếu chưa có
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  
  if (!adminExists) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = bcrypt.hashSync(password, 10);
    
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
      username,
      passwordHash,
      'admin'
    );
    
    console.log(`✅ Đã tạo tài khoản admin: ${username}`);
  }

  // Seed menu mặc định nếu bảng menus trống
  const menuCount = db.prepare('SELECT COUNT(*) as count FROM menus').get();
  if (menuCount.count === 0) {
    const defaultMenus = [
      { name_vi: 'Trang chủ', name_en: 'Home', slug: '/', type: 'system', sort_order: 1 },
      { name_vi: 'Về MPC', name_en: 'About MPC', slug: '/about', type: 'system', sort_order: 2 },
      { name_vi: 'Tuyển dụng', name_en: 'Careers', slug: '/tuyen-dung', type: 'system', sort_order: 3 },
      { name_vi: 'Bài viết', name_en: 'Posts', slug: '/posts', type: 'system', sort_order: 4 },
      { name_vi: 'Thư viện ảnh', name_en: 'Gallery', slug: '/gallery', type: 'system', sort_order: 5 },
      { name_vi: 'Tài liệu', name_en: 'Documents', slug: '/documents', type: 'system', sort_order: 6 },
      { name_vi: 'Liên hệ', name_en: 'Contact', slug: '/contact', type: 'system', sort_order: 7 }
    ];

    const insertMenu = db.prepare(`
      INSERT INTO menus (name_vi, name_en, slug, type, is_visible, sort_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `);

    for (const menu of defaultMenus) {
      insertMenu.run(menu.name_vi, menu.name_en, menu.slug, menu.type, menu.sort_order);
    }
    console.log('✅ Đã tạo 7 menu mặc định');
  }

  // Seed 20 tin tuyển dụng mẫu nếu bảng jobs trống
  const jobCount = db.prepare('SELECT COUNT(*) as count FROM jobs').get();
  if (jobCount.count === 0) {
    const insertJob = db.prepare(`
      INSERT INTO jobs (title, slug, content, salary, hiring_count, deadline, status, title_en, content_en, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const seedJobs = [
      {
        title: 'Chuyên viên Khai thác Cảng', slug: 'chuyen-vien-khai-thac-cang',
        content: '<p>MPC Port tuyển dụng Chuyên viên Khai thác Cảng có kinh nghiệm trong điều phối hoạt động bốc xếp hàng hóa container.</p><p><strong>Yêu cầu:</strong></p><ul><li>Tốt nghiệp Đại học chuyên ngành Hàng hải, Kinh tế Vận tải biển hoặc tương đương</li><li>Ít nhất 2 năm kinh nghiệm tại cảng biển</li><li>Thành thạo các nghiệp vụ khai thác cảng, hệ thống TOS</li><li>Tiếng Anh giao tiếp tốt</li></ul><p><strong>Quyền lợi:</strong> Lương thỏa thuận, bảo hiểm đầy đủ, phụ cấp ca 3.</p>',
        salary: '15-25 triệu', hiring_count: 2, deadline: '30/09/2024', status: 'published',
        title_en: 'Port Operations Specialist',
        content_en: '<p>MPC Port is recruiting Port Operations Specialists experienced in coordinating container cargo handling activities.</p><p><strong>Requirements:</strong></p><ul><li>University degree in Maritime, Transport Economics or equivalent</li><li>At least 2 years of port experience</li><li>Proficient in port operations and TOS systems</li><li>Good English communication</li></ul><p><strong>Benefits:</strong> Negotiable salary, full insurance, night shift allowance.</p>',
        created_at: '2024-08-01 08:00:00'
      },
      {
        title: 'Nhân viên Điều độ Tàu', slug: 'nhan-vien-dieu-do-tau',
        content: '<p>Chịu trách nhiệm lên kế hoạch, điều phối lịch tàu ra vào cảng, phối hợp với đại lý tàu và cơ quan Cảng vụ.</p><p><strong>Yêu cầu:</strong></p><ul><li>Tốt nghiệp ĐH chuyên ngành Hàng hải, Ngoại thương</li><li>Có kinh nghiệm điều độ tàu hoặc làm việc tại cảng biển</li><li>Tiếng Anh trình độ B2 trở lên</li><li>Làm việc theo ca (bao gồm ca đêm và cuối tuần)</li></ul>',
        salary: '12-18 triệu', hiring_count: 3, deadline: '15/09/2024', status: 'published',
        title_en: 'Vessel Dispatcher',
        content_en: '<p>Responsible for planning and coordinating vessel arrival/departure schedules, liaising with shipping agents and Port Authority.</p><p><strong>Requirements:</strong></p><ul><li>University degree in Maritime or Foreign Trade</li><li>Experience in vessel dispatching or port operations</li><li>English proficiency B2 or above</li><li>Shift work including nights and weekends</li></ul>',
        created_at: '2024-08-03 09:00:00'
      },
      {
        title: 'Kỹ sư Cơ khí Thiết bị Bốc xếp', slug: 'ky-su-co-khi-thiet-bi-boc-xep',
        content: '<p>Bảo trì, sửa chữa và vận hành các thiết bị bốc xếp cảng: cần cẩu bờ (STS), RTG, xe đầu kéo cảng.</p><p><strong>Yêu cầu:</strong></p><ul><li>Kỹ sư Cơ khí, Cơ điện tử hoặc tương đương</li><li>Kinh nghiệm làm việc với thiết bị nâng hạng nặng</li><li>Có chứng chỉ vận hành thiết bị nâng là lợi thế</li><li>Chịu được áp lực, làm việc ngoài trời</li></ul>',
        salary: '18-28 triệu', hiring_count: 2, deadline: '31/10/2024', status: 'published',
        title_en: 'Mechanical Engineer - Cargo Handling Equipment',
        content_en: '<p>Maintain, repair and operate port cargo handling equipment: STS cranes, RTG cranes, terminal tractors.</p><p><strong>Requirements:</strong></p><ul><li>Mechanical or Mechatronics Engineering degree</li><li>Experience with heavy lifting equipment</li><li>Lifting equipment operation certificate is an advantage</li><li>Ability to work under pressure and outdoors</li></ul>',
        created_at: '2024-08-05 08:30:00'
      },
      {
        title: 'Chuyên viên Logistics & Xuất nhập khẩu', slug: 'chuyen-vien-logistics-xuat-nhap-khau',
        content: '<p>Xử lý chứng từ xuất nhập khẩu, phối hợp với các đại lý, hãng tàu và cơ quan hải quan để đảm bảo hàng hóa thông quan đúng hạn.</p><p><strong>Yêu cầu:</strong></p><ul><li>ĐH chuyên ngành Ngoại thương, Kinh tế, Luật</li><li>Hiểu biết về Incoterms, L/C, thủ tục hải quan</li><li>Tiếng Anh thương mại tốt</li><li>Thành thạo Excel, phần mềm khai báo hải quan</li></ul>',
        salary: '14-22 triệu', hiring_count: 2, deadline: '30/09/2024', status: 'published',
        title_en: 'Logistics & Import/Export Specialist',
        content_en: '<p>Handle import/export documentation, coordinate with agents, shipping lines and customs to ensure timely cargo clearance.</p><p><strong>Requirements:</strong></p><ul><li>University degree in Foreign Trade, Economics or Law</li><li>Knowledge of Incoterms, L/C, customs procedures</li><li>Good business English</li><li>Proficient in Excel and customs declaration software</li></ul>',
        created_at: '2024-08-07 10:00:00'
      },
      {
        title: 'Nhân viên Kinh doanh', slug: 'nhan-vien-kinh-doanh',
        content: '<p>Phát triển thị trường, tìm kiếm và chăm sóc khách hàng sử dụng dịch vụ cảng, đạt chỉ tiêu doanh thu được giao.</p><p><strong>Yêu cầu:</strong></p><ul><li>Tốt nghiệp ĐH chuyên ngành Kinh tế, Ngoại thương, Marketing</li><li>Ưu tiên có kinh nghiệm trong lĩnh vực cảng biển, logistics</li><li>Kỹ năng đàm phán, thuyết phục tốt</li><li>Có xe máy, sẵn sàng đi công tác</li></ul>',
        salary: '12-20 triệu + hoa hồng', hiring_count: 3, deadline: '15/10/2024', status: 'published',
        title_en: 'Sales Executive',
        content_en: '<p>Develop market, acquire and manage clients using port services, achieve assigned revenue targets.</p><p><strong>Requirements:</strong></p><ul><li>University degree in Economics, Foreign Trade, Marketing</li><li>Experience in port, logistics field is preferred</li><li>Good negotiation and persuasion skills</li><li>Own a motorbike, willing to travel</li></ul>',
        created_at: '2024-08-10 08:00:00'
      },
      {
        title: 'Kỹ thuật viên Hệ thống CNTT Cảng', slug: 'ky-thuat-vien-cntt-cang',
        content: '<p>Vận hành, bảo trì hệ thống TOS (Terminal Operating System), hạ tầng mạng nội bộ, camera an ninh, thiết bị đọc container số tự động (OCR).</p><p><strong>Yêu cầu:</strong></p><ul><li>Kỹ sư CNTT, Điện tử Viễn thông hoặc tương đương</li><li>Kinh nghiệm quản trị hệ thống Linux/Windows Server</li><li>Hiểu biết về network, VPN, firewall</li><li>Tiếng Anh đọc hiểu tài liệu kỹ thuật</li></ul>',
        salary: '16-24 triệu', hiring_count: 1, deadline: '31/10/2024', status: 'published',
        title_en: 'Port IT Systems Technician',
        content_en: '<p>Operate and maintain TOS (Terminal Operating System), internal network infrastructure, security cameras, and OCR container number recognition equipment.</p><p><strong>Requirements:</strong></p><ul><li>IT Engineering, Electronics Telecommunications or equivalent</li><li>Linux/Windows Server administration experience</li><li>Knowledge of network, VPN, firewall</li><li>English reading comprehension for technical documents</li></ul>',
        created_at: '2024-08-12 09:00:00'
      },
      {
        title: 'Nhân viên Kế toán', slug: 'nhan-vien-ke-toan',
        content: '<p>Thực hiện các nghiệp vụ kế toán thanh toán, theo dõi công nợ khách hàng, lập báo cáo tài chính định kỳ theo quy định.</p><p><strong>Yêu cầu:</strong></p><ul><li>ĐH chuyên ngành Kế toán, Tài chính</li><li>Có chứng chỉ kế toán hành nghề là lợi thế</li><li>Thành thạo phần mềm kế toán (MISA, Fast Accounting)</li><li>Cẩn thận, trung thực, có trách nhiệm</li></ul>',
        salary: '10-16 triệu', hiring_count: 1, deadline: '30/09/2024', status: 'published',
        title_en: 'Accountant',
        content_en: '<p>Perform payment accounting, track customer receivables, prepare periodic financial reports as required.</p><p><strong>Requirements:</strong></p><ul><li>University degree in Accounting or Finance</li><li>Certified Practicing Accountant is an advantage</li><li>Proficient in accounting software (MISA, Fast Accounting)</li><li>Careful, honest, and responsible</li></ul>',
        created_at: '2024-08-14 08:00:00'
      },
      {
        title: 'Trưởng phòng Vận hành Cảng', slug: 'truong-phong-van-hanh-cang',
        content: '<p>Quản lý toàn bộ hoạt động khai thác cảng, đảm bảo năng suất bốc xếp, an toàn lao động và chất lượng dịch vụ theo tiêu chuẩn ISO.</p><p><strong>Yêu cầu:</strong></p><ul><li>ĐH trở lên chuyên ngành Hàng hải, Quản trị kinh doanh</li><li>Tối thiểu 5 năm kinh nghiệm vận hành cảng container</li><li>Kỹ năng lãnh đạo, quản lý đội nhóm trên 50 người</li><li>Tiếng Anh thành thạo</li></ul>',
        salary: '30-50 triệu', hiring_count: 1, deadline: '15/11/2024', status: 'published',
        title_en: 'Port Operations Manager',
        content_en: '<p>Manage all port exploitation activities, ensure loading/unloading productivity, occupational safety and service quality per ISO standards.</p><p><strong>Requirements:</strong></p><ul><li>University or above in Maritime, Business Administration</li><li>Minimum 5 years container port operations experience</li><li>Leadership skills, manage team of 50+ people</li><li>Fluent English</li></ul>',
        created_at: '2024-08-15 09:00:00'
      },
      {
        title: 'Nhân viên An toàn Lao động (HSE)', slug: 'nhan-vien-an-toan-lao-dong-hse',
        content: '<p>Xây dựng và triển khai hệ thống quản lý an toàn lao động, môi trường tại cảng; đào tạo nhân viên và kiểm tra định kỳ.</p><p><strong>Yêu cầu:</strong></p><ul><li>ĐH chuyên ngành Bảo hộ lao động, Môi trường, Kỹ thuật</li><li>Có chứng chỉ An toàn Lao động cấp quốc gia</li><li>Kinh nghiệm tại cảng biển hoặc khu công nghiệp</li><li>Kỹ năng đào tạo, thuyết trình tốt</li></ul>',
        salary: '13-19 triệu', hiring_count: 2, deadline: '31/10/2024', status: 'published',
        title_en: 'HSE Officer (Health, Safety & Environment)',
        content_en: '<p>Develop and implement occupational safety and environmental management systems at the port; train staff and conduct periodic inspections.</p><p><strong>Requirements:</strong></p><ul><li>University degree in Occupational Safety, Environment, or Engineering</li><li>National Occupational Safety Certificate</li><li>Experience at seaport or industrial zone</li><li>Good training and presentation skills</li></ul>',
        created_at: '2024-08-17 08:30:00'
      },
      {
        title: 'Lái xe Nâng hàng (Forklift Operator)', slug: 'lai-xe-nang-hang',
        content: '<p>Vận hành xe nâng hàng trong kho bãi cảng, đảm bảo an toàn trong quá trình bốc xếp và di chuyển hàng hóa.</p><p><strong>Yêu cầu:</strong></p><ul><li>Tốt nghiệp THPT trở lên</li><li>Có chứng chỉ lái xe nâng còn hiệu lực</li><li>Kinh nghiệm vận hành xe nâng tối thiểu 1 năm</li><li>Sức khỏe tốt, không mắc các bệnh cấm theo quy định</li><li>Làm việc theo ca</li></ul>',
        salary: '8-12 triệu', hiring_count: 5, deadline: '15/09/2024', status: 'published',
        title_en: 'Forklift Operator',
        content_en: '<p>Operate forklifts in the port yard and warehouses, ensuring safety during cargo handling and movement.</p><p><strong>Requirements:</strong></p><ul><li>High school diploma or above</li><li>Valid forklift operation certificate</li><li>Minimum 1 year forklift operation experience</li><li>Good health, no prohibited medical conditions</li><li>Shift work required</li></ul>',
        created_at: '2024-08-18 08:00:00'
      },
      {
        title: 'Nhân viên Thủ tục Hải quan', slug: 'nhan-vien-thu-tuc-hai-quan',
        content: '<p>Khai báo hải quan điện tử, theo dõi hàng hóa thông quan, phối hợp với cơ quan hải quan giải quyết các vướng mắc phát sinh.</p><p><strong>Yêu cầu:</strong></p><ul><li>ĐH chuyên ngành Ngoại thương, Hải quan, Kinh tế</li><li>Có kinh nghiệm khai báo hải quan điện tử (VNACCS/VCIS)</li><li>Am hiểu biểu thuế xuất nhập khẩu, chính sách thương mại</li><li>Cẩn thận, chịu áp lực tốt</li></ul>',
        salary: '11-17 triệu', hiring_count: 2, deadline: '30/09/2024', status: 'published',
        title_en: 'Customs Clearance Officer',
        content_en: '<p>Handle electronic customs declarations, monitor cargo clearance, coordinate with customs authorities to resolve issues.</p><p><strong>Requirements:</strong></p><ul><li>University degree in Foreign Trade, Customs, or Economics</li><li>Experience with electronic customs declaration (VNACCS/VCIS)</li><li>Knowledge of import/export tariffs and trade policies</li><li>Detail-oriented, ability to work under pressure</li></ul>',
        created_at: '2024-08-20 09:00:00'
      },
      {
        title: 'Kỹ sư Điện', slug: 'ky-su-dien',
        content: '<p>Thiết kế, lắp đặt, bảo trì hệ thống điện cảng, cấp điện cho thiết bị bốc xếp, hệ thống chiếu sáng và điện dân dụng.</p><p><strong>Yêu cầu:</strong></p><ul><li>Kỹ sư Điện, Điện-Điện tử</li><li>Có chứng chỉ hành nghề điện lực</li><li>Kinh nghiệm trong lĩnh vực công nghiệp nặng hoặc cảng biển</li><li>Đọc hiểu bản vẽ kỹ thuật điện</li></ul>',
        salary: '17-26 triệu', hiring_count: 2, deadline: '31/10/2024', status: 'published',
        title_en: 'Electrical Engineer',
        content_en: '<p>Design, install, and maintain the port electrical system, powering handling equipment, lighting and utilities.</p><p><strong>Requirements:</strong></p><ul><li>Electrical or Electrical-Electronics Engineering degree</li><li>Electrical license</li><li>Experience in heavy industry or seaport</li><li>Ability to read electrical technical drawings</li></ul>',
        created_at: '2024-08-21 08:00:00'
      },
      {
        title: 'Nhân viên Kiểm đếm Hàng hóa', slug: 'nhan-vien-kiem-dem-hang-hoa',
        content: '<p>Kiểm đếm, ghi nhận số lượng và tình trạng hàng hóa khi xuất nhập kho bãi cảng; lập biên bản hiện trường khi có hàng hư hỏng.</p><p><strong>Yêu cầu:</strong></p><ul><li>Tốt nghiệp THPT hoặc Trung cấp trở lên</li><li>Cẩn thận, trung thực, chịu khó</li><li>Sức khỏe tốt, chịu được điều kiện làm việc ngoài trời</li><li>Ưu tiên có kinh nghiệm tại cảng biển hoặc kho vận</li></ul>',
        salary: '7-10 triệu', hiring_count: 4, deadline: '15/09/2024', status: 'published',
        title_en: 'Cargo Tally Clerk',
        content_en: '<p>Count and record quantity and condition of cargo during port yard operations; prepare incident reports for damaged goods.</p><p><strong>Requirements:</strong></p><ul><li>High school diploma or above</li><li>Careful, honest, hardworking</li><li>Good health, able to work outdoors</li><li>Experience at seaport or warehouse is preferred</li></ul>',
        created_at: '2024-08-22 09:30:00'
      },
      {
        title: 'Chuyên viên Pháp lý Hàng hải', slug: 'chuyen-vien-phap-ly-hang-hai',
        content: '<p>Tư vấn pháp lý cho các hoạt động kinh doanh, hợp đồng thương mại quốc tế, xử lý tranh chấp hàng hải và bảo hiểm P&I.</p><p><strong>Yêu cầu:</strong></p><ul><li>Tốt nghiệp ĐH Luật, ưu tiên chuyên ngành Luật hàng hải quốc tế</li><li>Kinh nghiệm tối thiểu 3 năm trong lĩnh vực pháp lý hàng hải</li><li>Tiếng Anh pháp lý thành thạo</li><li>Có chứng chỉ luật sư là lợi thế lớn</li></ul>',
        salary: '20-35 triệu', hiring_count: 1, deadline: '30/11/2024', status: 'draft',
        title_en: 'Maritime Legal Specialist',
        content_en: '<p>Provide legal advice for business operations, international commercial contracts, handle maritime disputes and P&I insurance.</p><p><strong>Requirements:</strong></p><ul><li>Law degree, preferably with specialization in international maritime law</li><li>Minimum 3 years experience in maritime legal field</li><li>Proficient legal English</li><li>Lawyer certificate is a major advantage</li></ul>',
        created_at: '2024-08-23 08:00:00'
      },
      {
        title: 'Trưởng ca Vận hành Cảng', slug: 'truong-ca-van-hanh-cang',
        content: '<p>Quản lý ca vận hành, điều phối nhân lực và thiết bị để đảm bảo kế hoạch bốc xếp, an toàn và năng suất trong ca làm việc.</p><p><strong>Yêu cầu:</strong></p><ul><li>ĐH chuyên ngành Hàng hải, Kỹ thuật hoặc tương đương</li><li>Kinh nghiệm ít nhất 3 năm vận hành cảng container</li><li>Kỹ năng lãnh đạo nhóm, xử lý tình huống nhanh</li><li>Chấp nhận làm việc theo ca (bao gồm ca đêm)</li></ul>',
        salary: '20-30 triệu', hiring_count: 3, deadline: '15/10/2024', status: 'published',
        title_en: 'Port Shift Supervisor',
        content_en: '<p>Manage the operation shift, coordinate manpower and equipment to ensure loading plan, safety and productivity during the shift.</p><p><strong>Requirements:</strong></p><ul><li>University degree in Maritime, Engineering or equivalent</li><li>At least 3 years container port operations experience</li><li>Team leadership skills, quick problem solving</li><li>Accept shift work including night shifts</li></ul>',
        created_at: '2024-08-25 09:00:00'
      },
      {
        title: 'Nhân viên Dịch vụ Khách hàng', slug: 'nhan-vien-dich-vu-khach-hang',
        content: '<p>Tiếp nhận và xử lý yêu cầu dịch vụ từ khách hàng (hãng tàu, chủ hàng, đại lý), giải đáp thắc mắc và chăm sóc khách hàng sau dịch vụ.</p><p><strong>Yêu cầu:</strong></p><ul><li>ĐH chuyên ngành Kinh tế, Ngoại ngữ, Quản trị</li><li>Tiếng Anh giao tiếp tốt, ưu tiên biết thêm tiếng Trung</li><li>Kỹ năng giao tiếp xuất sắc, nhiệt tình</li><li>Thành thạo tin học văn phòng</li></ul>',
        salary: '10-15 triệu', hiring_count: 2, deadline: '30/09/2024', status: 'published',
        title_en: 'Customer Service Officer',
        content_en: '<p>Receive and process service requests from customers (shipping lines, cargo owners, agents), answer inquiries and provide after-service support.</p><p><strong>Requirements:</strong></p><ul><li>University degree in Economics, Foreign Languages, or Management</li><li>Good English communication, Chinese is a plus</li><li>Excellent interpersonal skills, enthusiastic</li><li>Proficient in office software</li></ul>',
        created_at: '2024-08-26 08:30:00'
      },
      {
        title: 'Kỹ thuật viên Bảo trì Thiết bị Cảng', slug: 'ky-thuat-vien-bao-tri-thiet-bi-cang',
        content: '<p>Thực hiện bảo trì định kỳ và sửa chữa đột xuất các thiết bị cơ khí, thủy lực tại cảng theo quy trình kỹ thuật.</p><p><strong>Yêu cầu:</strong></p><ul><li>Cao đẳng/ĐH chuyên ngành Cơ khí, Cơ điện</li><li>Kinh nghiệm bảo trì thiết bị công nghiệp nặng</li><li>Đọc hiểu bản vẽ kỹ thuật cơ khí</li><li>Chịu khó, tỉ mỉ, có trách nhiệm với công việc</li></ul>',
        salary: '12-18 triệu', hiring_count: 3, deadline: '31/10/2024', status: 'draft',
        title_en: 'Port Equipment Maintenance Technician',
        content_en: '<p>Perform periodic maintenance and emergency repairs of mechanical and hydraulic equipment at the port according to technical procedures.</p><p><strong>Requirements:</strong></p><ul><li>College/University degree in Mechanical or Electromechanical Engineering</li><li>Experience in heavy industrial equipment maintenance</li><li>Ability to read mechanical technical drawings</li><li>Diligent, meticulous, responsible</li></ul>',
        created_at: '2024-08-27 09:00:00'
      },
      {
        title: 'Chuyên viên Công nghệ Thông tin', slug: 'chuyen-vien-cntt',
        content: '<p>Phát triển và duy trì các ứng dụng nội bộ, hỗ trợ tích hợp hệ thống TOS với các phần mềm quản lý doanh nghiệp (ERP, CRM).</p><p><strong>Yêu cầu:</strong></p><ul><li>Kỹ sư CNTT, Khoa học máy tính hoặc tương đương</li><li>Thành thạo Java, Python hoặc .NET</li><li>Kinh nghiệm làm việc với REST API, cơ sở dữ liệu SQL</li><li>Ưu tiên có kinh nghiệm logistics, cảng biển</li></ul>',
        salary: '18-30 triệu', hiring_count: 2, deadline: '15/11/2024', status: 'published',
        title_en: 'IT Specialist',
        content_en: '<p>Develop and maintain internal applications, support TOS system integration with enterprise management software (ERP, CRM).</p><p><strong>Requirements:</strong></p><ul><li>IT Engineering, Computer Science or equivalent</li><li>Proficient in Java, Python or .NET</li><li>Experience with REST API, SQL databases</li><li>Experience in logistics or seaport sector preferred</li></ul>',
        created_at: '2024-08-28 08:00:00'
      },
      {
        title: 'Nhân viên An ninh Cảng', slug: 'nhan-vien-an-ninh-cang',
        content: '<p>Tuần tra, kiểm soát an ninh cảng theo tiêu chuẩn ISPS Code; kiểm tra phương tiện và người ra vào cảng, xử lý các tình huống an ninh phát sinh.</p><p><strong>Yêu cầu:</strong></p><ul><li>Tốt nghiệp THPT trở lên, ưu tiên đã qua đào tạo nghiệp vụ bảo vệ</li><li>Có chứng chỉ nghiệp vụ an ninh cảng biển (ISPS) là lợi thế</li><li>Thể lực tốt, phản xạ nhanh</li><li>Làm việc theo ca 3</li></ul>',
        salary: '7-11 triệu', hiring_count: 5, deadline: '15/09/2024', status: 'published',
        title_en: 'Port Security Officer',
        content_en: '<p>Patrol and control port security per ISPS Code standards; check vehicles and personnel entering/exiting the port, handle security incidents.</p><p><strong>Requirements:</strong></p><ul><li>High school diploma or above, security training is preferred</li><li>ISPS port security certificate is an advantage</li><li>Good physical condition, quick reflexes</li><li>3-shift work</li></ul>',
        created_at: '2024-08-29 09:00:00'
      },
      {
        title: 'Phó Trưởng phòng Kinh doanh', slug: 'pho-truong-phong-kinh-doanh',
        content: '<p>Hỗ trợ Trưởng phòng Kinh doanh quản lý đội ngũ bán hàng, xây dựng chiến lược phát triển thị trường, tham gia đàm phán hợp đồng lớn với hãng tàu và chủ hàng.</p><p><strong>Yêu cầu:</strong></p><ul><li>ĐH trở lên chuyên ngành Kinh tế, Ngoại thương, Quản trị</li><li>Ít nhất 5 năm kinh nghiệm kinh doanh trong ngành cảng biển/logistics</li><li>Tiếng Anh thành thạo, ưu tiên có thêm ngoại ngữ khác</li><li>Kỹ năng lãnh đạo, phân tích thị trường xuất sắc</li></ul>',
        salary: '25-40 triệu', hiring_count: 1, deadline: '30/11/2024', status: 'draft',
        title_en: 'Deputy Sales Manager',
        content_en: '<p>Support the Sales Manager in managing the sales team, build market development strategies, participate in negotiating major contracts with shipping lines and cargo owners.</p><p><strong>Requirements:</strong></p><ul><li>University or above in Economics, Foreign Trade, Management</li><li>At least 5 years sales experience in port/logistics sector</li><li>Fluent English, additional languages are a plus</li><li>Excellent leadership and market analysis skills</li></ul>',
        created_at: '2024-08-30 08:00:00'
      }
    ];

    for (const job of seedJobs) {
      insertJob.run(
        job.title, job.slug, job.content, job.salary, job.hiring_count,
        job.deadline, job.status, job.title_en, job.content_en, job.created_at
      );
    }
    console.log('✅ Đã tạo 20 tin tuyển dụng mẫu');
  }

  // Đảm bảo menu /about và /tuyen-dung tồn tại (cho database cũ)
  const existsAbout = db.prepare("SELECT id FROM menus WHERE slug = ?").get('/about');
  if (!existsAbout) {
    const maxOrder = db.prepare("SELECT MAX(sort_order) as m FROM menus").get().m || 0;
    db.prepare("INSERT INTO menus (name_vi, name_en, slug, type, is_visible, sort_order) VALUES (?, ?, ?, 'system', 1, ?)").run(
      'Về MPC', 'About MPC', '/about', maxOrder + 1
    );
    console.log('✅ Đã thêm menu Về MPC');
  }
  const existsRecruitment = db.prepare("SELECT id FROM menus WHERE slug = ?").get('/tuyen-dung');
  if (!existsRecruitment) {
    const maxOrder = db.prepare("SELECT MAX(sort_order) as m FROM menus").get().m || 0;
    db.prepare("INSERT INTO menus (name_vi, name_en, slug, type, is_visible, sort_order) VALUES (?, ?, ?, 'system', 1, ?)").run(
      'Tuyển dụng', 'Careers', '/tuyen-dung', maxOrder + 1
    );
    console.log('✅ Đã thêm menu Tuyển dụng');
  }

  console.log('✅ Database đã sẵn sàng!');
}

module.exports = {
  db,
  initDatabase
};
