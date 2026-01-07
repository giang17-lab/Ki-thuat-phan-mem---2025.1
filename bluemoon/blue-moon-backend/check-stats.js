const pool = require('./db');

async function run() {
  try {
    console.log('=== KIỂM TRA DỮ LIỆU THỐNG KÊ ===\n');

    // Kiểm tra số lượng
    const [phieuThuCount] = await pool.query('SELECT COUNT(*) as count FROM PhieuThu');
    const [khoanThuCount] = await pool.query('SELECT COUNT(*) as count FROM KhoanThu');
    const [hoGiaDinhCount] = await pool.query('SELECT COUNT(*) as count FROM HoGiaDinh');

    console.log(`PhieuThu (Phiếu thu): ${phieuThuCount[0].count}`);
    console.log(`KhoanThu (Khoản thu): ${khoanThuCount[0].count}`);
    console.log(`HoGiaDinh (Hộ gia đình): ${hoGiaDinhCount[0].count}`);

    // Kiểm tra dữ liệu KhoanThu
    console.log('\n--- Dữ liệu KhoanThu ---');
    const [khoans] = await pool.query('SELECT * FROM KhoanThu LIMIT 5');
    if (khoans.length) {
      console.log(khoans);
    } else {
      console.log('Không có dữ liệu KhoanThu');
    }

    // Kiểm tra PhieuThu
    console.log('\n--- Dữ liệu PhieuThu (5 bản ghi) ---');
    const [phieus] = await pool.query(`
      SELECT p.*, kt.ten as ten_khoan_thu 
      FROM PhieuThu p 
      LEFT JOIN KhoanThu kt ON kt.id = p.id_khoan_thu
      LIMIT 5
    `);
    if (phieus.length) {
      console.log(phieus);
    } else {
      console.log('Không có dữ liệu PhieuThu');
    }

    // Kiểm tra join problem
    console.log('\n--- Kiểm tra JOIN ---');
    const [joined] = await pool.query(`
      SELECT COUNT(*) as count
      FROM PhieuThu p
      INNER JOIN KhoanThu kt ON kt.id = p.id_khoan_thu
      JOIN HoGiaDinh h ON h.id = p.id_ho_gia_dinh
    `);
    console.log(`PhieuThu với INNER JOIN KhoanThu: ${joined[0].count}`);

    // Kiểm tra id_khoan_thu NULL
    console.log('\n--- Kiểm tra id_khoan_thu NULL ---');
    const [nulls] = await pool.query('SELECT COUNT(*) as count FROM PhieuThu WHERE id_khoan_thu IS NULL');
    console.log(`PhieuThu có id_khoan_thu = NULL: ${nulls[0].count}`);

    // Kiểm tra id_khoan_thu không tồn tại trong KhoanThu
    console.log('\n--- Kiểm tra id_khoan_thu không tồn tại ---');
    const [invalid] = await pool.query(`
      SELECT COUNT(*) as count FROM PhieuThu p
      WHERE p.id_khoan_thu NOT IN (SELECT id FROM KhoanThu)
    `);
    console.log(`PhieuThu có id_khoan_thu không tồn tại: ${invalid[0].count}`);

    console.log('\n=== HẾT ===');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi:', err.message);
    process.exit(1);
  }
}

run();
