// seed-users.js - Tạo tài khoản đăng nhập: admin + mỗi Chủ hộ là 1 user (mật khẩu ngẫu nhiên)
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Hàm tạo mật khẩu ngẫu nhiên
function generatePassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Hàm chuẩn hóa tên thành username (bỏ dấu, viết liền)
function toUsername(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, '')
    .toLowerCase();
}

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

    console.log('📝 Đang thêm tài khoản đăng nhập...\n');

    // Admin accounts với mật khẩu cố định
    const adminPassword = 'admin123';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    const adminAccounts = [
      {
        username: 'admin',
        email: 'admin@bluemoon.com',
        ten_nguoi_dung: 'Nguyễn Quản Trị',
        role: 'admin',
        password: adminPassword
      },
      {
        username: 'admin2',
        email: 'admin2@bluemoon.com',
        ten_nguoi_dung: 'Trần Quản Lý',
        role: 'admin',
        password: adminPassword
      }
    ];

    // Lấy danh sách Chủ hộ từ bảng HoGiaDinh để tạo user
    const [households] = await pool.query(
      'SELECT id, ma_can_ho, ten_chu_ho FROM HoGiaDinh ORDER BY id'
    );

    // Xây dựng danh sách user: username = tên chủ hộ (không dấu) + mã căn hộ
    const userAccounts = [];
    for (const h of households) {
      const name = (h.ten_chu_ho || '').trim();
      const maCanHo = (h.ma_can_ho || '').trim();
      const username = toUsername(name) + '_' + maCanHo.toLowerCase();
      const password = generatePassword(8);
      const hashedPassword = await bcrypt.hash(password, 10);
      
      userAccounts.push({
        ho_gia_dinh_id: h.id,
        username,
        email: `${maCanHo.toLowerCase()}@bluemoon.com`,
        ten_nguoi_dung: name,
        ma_can_ho: maCanHo,
        role: 'user',
        password,
        hashedPassword
      });
    }

    let insertedAdmin = 0;
    let insertedUser = 0;
    let skipped = 0;

    // Xóa toàn bộ tài khoản user hiện có để tạo lại
    await pool.query("DELETE FROM NguoiDung WHERE role = 'user'");

    // Insert admin accounts
    console.log('🔐 Thêm tài khoản Admin:');
    for (const admin of adminAccounts) {
      try {
        await pool.query(
          'INSERT INTO NguoiDung (username, password_hash, email, ten_nguoi_dung, role) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
          [admin.username, hashedAdminPassword, admin.email, admin.ten_nguoi_dung, admin.role]
        );
        console.log(`  ✓ ${admin.username} (${admin.ten_nguoi_dung}) - Mật khẩu: ${admin.password}`);
        insertedAdmin++;
      } catch (err) {
        console.log(`  ❌ ${admin.username} - ${err.message}`);
      }
    }

    // Insert user accounts theo Chủ hộ
    console.log('\n👤 Thêm tài khoản User (theo Chủ hộ):');
    const csvLines = ['Mã căn hộ,Tên chủ hộ,Username,Mật khẩu,Email'];
    
    for (const user of userAccounts) {
      try {
        await pool.query(
          'INSERT INTO NguoiDung (username, password_hash, email, ten_nguoi_dung, role, ho_gia_dinh_id) VALUES (?, ?, ?, ?, ?, ?)',
          [user.username, user.hashedPassword, user.email, user.ten_nguoi_dung, user.role, user.ho_gia_dinh_id]
        );
        console.log(`  ✓ ${user.username} | Mật khẩu: ${user.password}`);
        csvLines.push(`${user.ma_can_ho},${user.ten_nguoi_dung},${user.username},${user.password},${user.email}`);
        insertedUser++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠ ${user.username} - đã tồn tại (bỏ qua)`);
          skipped++;
        } else {
          console.log(`  ❌ ${user.username} - ${err.message}`);
        }
      }
    }

    // Lưu danh sách tài khoản ra file CSV
    const csvPath = './user_accounts.csv';
    fs.writeFileSync(csvPath, '\uFEFF' + csvLines.join('\n'), 'utf8');
    console.log(`\n📄 Đã lưu danh sách tài khoản vào: ${csvPath}`);

    console.log('\n📊 Tóm tắt:');
    console.log(`  ✓ Admin thêm vào: ${insertedAdmin}`);
    console.log(`  ✓ User thêm vào: ${insertedUser}`);
    console.log(`  ⚠ Bỏ qua (đã tồn tại): ${skipped}`);
    console.log(`\n✅ Tất cả tài khoản đã được thiết lập!`);
    console.log(`\n🔑 Mật khẩu Admin: ${adminPassword}`);
    console.log(`🔑 Mật khẩu User: Xem file ${csvPath}\n`);

    await pool.end();
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
})();
