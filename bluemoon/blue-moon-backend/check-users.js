const pool = require('./db');

async function checkUsers() {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, role, ten_nguoi_dung, ho_gia_dinh_id FROM NguoiDung ORDER BY role, id"
    );
    console.log('Danh sách tài khoản:');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkUsers();
