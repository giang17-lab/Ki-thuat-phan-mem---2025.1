// seed-requests.js - Thêm sample data cho YeuCauThemXe và YeuCauThemNhanKhau
const fs = require('fs');
const mysql = require('mysql2/promise');

async function readEnv() {
  const p = './.env';
  const c = fs.readFileSync(p, 'utf8');
  const obj = {};
  c.split(/\r?\n/).forEach(l => {
    if (!l || l.trim().startsWith('#')) return;
    const idx = l.indexOf('=');
    if (idx > -1) obj[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
  });
  return obj;
}

(async () => {
  try {
    const env = await readEnv();
    const pool = mysql.createPool({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
      port: env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
    });

    console.log('📝 Đang thêm sample data cho yêu cầu...');

    // Lấy danh sách user (role=user) để phân bổ yêu cầu cho nhiều người dùng khác nhau
    const [users] = await pool.query("SELECT id, username FROM NguoiDung WHERE role = 'user' ORDER BY id");
    if (!users.length) {
      console.log('❌ Không có user nào trong hệ thống. Hãy chạy seed-users.js trước.');
      await pool.end();
      process.exit(1);
    }
    console.log(`✓ Tìm thấy ${users.length} user để phân bổ yêu cầu.`);

    // Dọn sạch dữ liệu yêu cầu cũ để đảm bảo hiển thị đúng
    await pool.query('DELETE FROM YeuCauThemXe');
    await pool.query('DELETE FROM YeuCauThemNhanKhau');

    // Lấy household IDs
    const [households] = await pool.query('SELECT id FROM HoGiaDinh LIMIT 3');
    
    let insertedVehicles = 0;
    let insertedResidents = 0;

    // Sample vehicle requests (8 requests)
    const vehicleRequests = [
      { bien_so: '29-A12345', loai_xe: 'Ô tô', mo_ta: 'Toyota Vios 2022 màu bạc', trang_thai: 'pending' },
      { bien_so: '30B-98765', loai_xe: 'Xe máy', mo_ta: 'Honda Wave 110cc màu đen', trang_thai: 'pending' },
      { bien_so: '51-C55555', loai_xe: 'Ô tô', mo_ta: 'Ford Ranger Wildtrak bán tải', trang_thai: 'approved' },
      { bien_so: '29-D11111', loai_xe: 'Xe máy', mo_ta: 'Yamaha Exciter 150cc màu xanh', trang_thai: 'pending' },
      { bien_so: '30-E22222', loai_xe: 'Ô tô', mo_ta: 'Kia Soluto 2021 màu trắng', trang_thai: 'pending' },
      { bien_so: '29-F33333', loai_xe: 'Xe máy', mo_ta: 'Suzuki Raider 150 màu đỏ', trang_thai: 'approved' },
      { bien_so: '51-G44444', loai_xe: 'Ô tô', mo_ta: 'Hyundai i10 2023 màu vàng', trang_thai: 'rejected' },
      { bien_so: '30-H55555', loai_xe: 'Xe máy', mo_ta: 'SYM Jet 2023 màu bạc', trang_thai: 'pending' },
    ];

    for (const req of vehicleRequests) {
      try {
        const hoId = households.length > 0 ? households[Math.floor(Math.random() * households.length)].id : null;
        const user = users[Math.floor(Math.random() * users.length)];
        const [result] = await pool.query(
          'INSERT IGNORE INTO YeuCauThemXe (user_id, ho_gia_dinh_id, bien_so, loai_xe, mo_ta, trang_thai, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [user.id, hoId, req.bien_so, req.loai_xe, req.mo_ta, req.trang_thai]
        );
        if (result.affectedRows > 0) {
          insertedVehicles++;
          console.log(`✓ Thêm yêu cầu xe: ${req.bien_so} - từ ${user.username} (${req.trang_thai})`);
        }
      } catch (err) {
        console.log(`⚠ Lỗi thêm xe: ${err.message}`);
      }
    }

    // Sample resident requests (7 requests) - tên mới
    const residentRequests = [
      { ho_ten: 'Tạ Minh Huy', quan_he: 'Con', ngay_sinh: '2010-05-15', gioi_tinh: 'Nam', cccd: '0123456789012', mo_ta: 'Con trai - học sinh', trang_thai: 'pending' },
      { ho_ten: 'Vũ Thị Hương', quan_he: 'Vợ/Chồng', ngay_sinh: '1985-03-20', gioi_tinh: 'Nữ', cccd: '0987654321098', mo_ta: 'Vợ chủ hộ - kế toán', trang_thai: 'pending' },
      { ho_ten: 'Phan Văn Kiệt', quan_he: 'Cha/Mẹ', ngay_sinh: '1960-07-10', gioi_tinh: 'Nam', cccd: '0555555555555', mo_ta: 'Cha của chủ hộ - hưu trí', trang_thai: 'approved' },
      { ho_ten: 'Mạc Thị Lan', quan_he: 'Anh/Chị/Em', ngay_sinh: '1995-12-25', gioi_tinh: 'Nữ', cccd: '0666666666666', mo_ta: 'Em gái - công nhân', trang_thai: 'pending' },
      { ho_ten: 'Ngô Đức Trung', quan_he: 'Con', ngay_sinh: '2015-08-03', gioi_tinh: 'Nam', cccd: '0777777777777', mo_ta: 'Con thứ hai - học sinh', trang_thai: 'pending' },
      { ho_ten: 'Sơn Thị Hoa', quan_he: 'Cha/Mẹ', ngay_sinh: '1958-06-15', gioi_tinh: 'Nữ', cccd: '0888888888888', mo_ta: 'Mẹ của chủ hộ - hưu trí', trang_thai: 'approved' },
      { ho_ten: 'Cầu Văn Sơn', quan_he: 'Anh/Chị/Em', ngay_sinh: '1990-01-10', gioi_tinh: 'Nam', cccd: '0999999999999', mo_ta: 'Anh rể - kỹ sư', trang_thai: 'pending' },
    ];

    for (const req of residentRequests) {
      try {
        const hoId = households.length > 0 ? households[Math.floor(Math.random() * households.length)].id : null;
        const user = users[Math.floor(Math.random() * users.length)];
        const [result] = await pool.query(
          'INSERT IGNORE INTO YeuCauThemNhanKhau (user_id, ho_gia_dinh_id, ho_ten, quan_he, ngay_sinh, gioi_tinh, cccd, mo_ta, trang_thai, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
          [user.id, hoId, req.ho_ten, req.quan_he, req.ngay_sinh, req.gioi_tinh, req.cccd, req.mo_ta, req.trang_thai]
        );
        if (result.affectedRows > 0) {
          insertedResidents++;
          console.log(`✓ Thêm yêu cầu nhân khẩu: ${req.ho_ten} - từ ${user.username} (${req.trang_thai})`);
        }
      } catch (err) {
        console.log(`⚠ Lỗi thêm nhân khẩu: ${err.message}`);
      }
    }

    console.log(`\n✅ Hoàn thành! Yêu cầu xe: ${insertedVehicles}, Yêu cầu nhân khẩu: ${insertedResidents}`);
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Lỗi seed:', e.message);
    process.exit(1);
  }
})();
