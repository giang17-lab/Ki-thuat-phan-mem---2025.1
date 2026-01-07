const pool = require('./db');

async function run() {
  try {
    // Cập nhật quỹ bảo trì xuống 5,000đ/m²
    await pool.query(`UPDATE KhoanThu SET don_gia = 5000, tien_co_dinh = 0 WHERE ten = 'Quỹ bảo trì'`);
    console.log('Đã cập nhật quỹ bảo trì: 5,000đ/m²');

    // Cập nhật lại số tiền trong phiếu thu cho quỹ bảo trì
    const [kt] = await pool.query("SELECT id FROM KhoanThu WHERE ten = 'Quỹ bảo trì'");
    if (kt.length > 0) {
      const ktId = kt[0].id;
      
      // Cập nhật theo diện tích từng hộ
      await pool.query(`
        UPDATE PhieuThu pt
        JOIN HoGiaDinh hgd ON pt.id_ho_gia_dinh = hgd.id
        SET pt.so_tien_phai_thu = COALESCE(hgd.dien_tich, 70) * 5000,
            pt.so_tien_da_thu = CASE WHEN pt.trang_thai = 1 THEN COALESCE(hgd.dien_tich, 70) * 5000 ELSE 0 END
        WHERE pt.id_khoan_thu = ?
      `, [ktId]);
      
      console.log('Đã cập nhật số tiền trong phiếu thu');
    }

    // Kiểm tra kết quả
    const [result] = await pool.query('SELECT id, ten, don_gia, don_vi FROM KhoanThu');
    console.log('\nDanh sách khoản thu:');
    console.table(result);

    // Kiểm tra phiếu thu hộ C130
    const [c130] = await pool.query(`
      SELECT kt.ten, pt.so_tien_phai_thu, pt.ky_thanh_toan
      FROM PhieuThu pt
      JOIN KhoanThu kt ON pt.id_khoan_thu = kt.id
      JOIN HoGiaDinh hgd ON pt.id_ho_gia_dinh = hgd.id
      WHERE hgd.ma_can_ho = 'C130' AND pt.ky_thanh_toan = '2026-01'
    `);
    console.log('\nPhiếu thu tháng 01/2026 hộ C130:');
    console.table(c130);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
