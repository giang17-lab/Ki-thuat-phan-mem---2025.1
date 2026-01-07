const pool = require('./db');

async function run() {
  try {
    // 1. Thêm cột ma_thanh_toan vào bảng PhieuThu
    console.log('Thêm cột ma_thanh_toan...');
    try {
      await pool.query(`
        ALTER TABLE PhieuThu 
        ADD COLUMN ma_thanh_toan VARCHAR(20) UNIQUE
      `);
      console.log('Đã thêm cột ma_thanh_toan');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Cột ma_thanh_toan đã tồn tại');
      } else {
        throw err;
      }
    }

    // 2. Tạo mã thanh toán cố định cho từng phiếu thu
    console.log('Tạo mã thanh toán cố định...');
    const [phieuThus] = await pool.query(`
      SELECT pt.id, pt.id_ho_gia_dinh, pt.id_khoan_thu, hgd.ma_can_ho
      FROM PhieuThu pt
      LEFT JOIN HoGiaDinh hgd ON pt.id_ho_gia_dinh = hgd.id
    `);

    for (const pt of phieuThus) {
      // Mã định dạng: {ma_can_ho}-{id_khoan_thu padded 2}-{random 4 số}
      const maCanHo = pt.ma_can_ho || 'XX';
      const idKhoanThu = String(pt.id_khoan_thu).padStart(2, '0');
      const randomCode = String(Math.floor(1000 + Math.random() * 9000)); // 4 số ngẫu nhiên
      const maThanhToan = `${maCanHo}-${idKhoanThu}-${randomCode}`;
      
      await pool.query(
        'UPDATE PhieuThu SET ma_thanh_toan = ? WHERE id = ?',
        [maThanhToan, pt.id]
      );
    }

    console.log(`Đã tạo mã thanh toán cho ${phieuThus.length} phiếu thu`);

    // 3. Kiểm tra kết quả
    const [result] = await pool.query(`
      SELECT id, ma_thanh_toan, id_khoan_thu 
      FROM PhieuThu 
      ORDER BY id 
      LIMIT 10
    `);
    console.log('\nMẫu mã thanh toán:');
    console.table(result);

    process.exit(0);
  } catch (err) {
    console.error('Lỗi:', err);
    process.exit(1);
  }
}

run();
