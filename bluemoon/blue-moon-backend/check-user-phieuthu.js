const pool = require('./db');

async function run() {
  try {
    // Kiểm tra user lyhanh
    const [users] = await pool.query(`
      SELECT u.username, u.ho_gia_dinh_id, h.ma_can_ho 
      FROM NguoiDung u 
      LEFT JOIN HoGiaDinh h ON u.ho_gia_dinh_id = h.id 
      WHERE u.username LIKE '%lyhanh%'
    `);
    console.log('User lyhanh:');
    console.table(users);

    if (users.length > 0 && users[0].ho_gia_dinh_id) {
      const hgdId = users[0].ho_gia_dinh_id;
      
      // Kiểm tra phiếu thu của hộ này
      const [pt] = await pool.query(`
        SELECT pt.id, pt.ky_thanh_toan, pt.so_tien_phai_thu, pt.trang_thai, kt.ten
        FROM PhieuThu pt
        LEFT JOIN KhoanThu kt ON pt.id_khoan_thu = kt.id
        WHERE pt.id_ho_gia_dinh = ?
        ORDER BY pt.trang_thai DESC, pt.ky_thanh_toan DESC
      `, [hgdId]);
      
      console.log(`\nPhiếu thu của hộ ${users[0].ma_can_ho}:`);
      console.table(pt);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
