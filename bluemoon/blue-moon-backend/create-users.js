// create-users.js - Tạo các user mặc định với password bcrypt đúng
const fs = require('fs');
const bcrypt = require('bcryptjs');
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

    console.log('🔐 Tạo/Cập nhật tài khoản mặc định...\n');

    // Hash password
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Hash của "password123": ${hashedPassword}\n`);

    // Xóa user cũ nếu có
    await pool.query('DELETE FROM NguoiDung WHERE username IN (?, ?)', ['admin', 'user1']);
    console.log('✓ Xóa user cũ (nếu có)\n');

    // Tạo admin
    const [adminResult] = await pool.query(
      'INSERT INTO NguoiDung (username, password_hash, email, ten_nguoi_dung, role) VALUES (?, ?, ?, ?, ?)',
      ['admin', hashedPassword, 'admin@bluemoon.com', 'Quản trị viên', 'admin']
    );
    console.log('✅ Admin được tạo');
    console.log(`   Username: admin`);
    console.log(`   Password: password123`);
    console.log(`   Role: admin\n`);

    // Tạo user1
    const [userResult] = await pool.query(
      'INSERT INTO NguoiDung (username, password_hash, email, ten_nguoi_dung, role) VALUES (?, ?, ?, ?, ?)',
      ['user1', hashedPassword, 'user1@bluemoon.com', 'Người dùng 1', 'user']
    );
    console.log('✅ User1 được tạo');
    console.log(`   Username: user1`);
    console.log(`   Password: password123`);
    console.log(`   Role: user\n`);

    // Kiểm tra
    const [users] = await pool.query('SELECT id, username, role FROM NguoiDung');
    console.log('📋 Danh sách user trong database:');
    users.forEach(u => {
      console.log(`   - ${u.username} (ID: ${u.id}, Role: ${u.role})`);
    });

    console.log('\n✨ Hoàn thành! Bạn có thể đăng nhập ngay.');
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  }
})();
