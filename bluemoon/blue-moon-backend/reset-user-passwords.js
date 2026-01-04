const bcrypt = require('bcryptjs');
const pool = require('./db');

async function resetUserPasswords() {
  try {
    // Hash mật khẩu mới
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Cập nhật cho tất cả user có role = 'user'
    const [result] = await pool.query(
      "UPDATE NguoiDung SET password_hash = ? WHERE role = 'user'",
      [hashedPassword]
    );
    
    console.log(`✅ Đã cập nhật mật khẩu cho ${result.affectedRows} tài khoản user`);
    console.log(`Mật khẩu mới: ${newPassword}`);
    
    // Verify
    const [users] = await pool.query(
      "SELECT username FROM NguoiDung WHERE role = 'user' LIMIT 3"
    );
    console.log('\nTài khoản test:');
    users.forEach(u => console.log(`  - Username: ${u.username}, Password: ${newPassword}`));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

resetUserPasswords();
