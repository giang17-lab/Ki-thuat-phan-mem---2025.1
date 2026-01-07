const pool = require('./db');

async function run() {
  try {
    // Giảm phí quản lý chung cư xuống một nửa: 7000 -> 3500
    await pool.query(`UPDATE KhoanThu SET don_gia = 3500 WHERE ten = 'Phí quản lý chung cư'`);
    console.log('Phí quản lý chung cư: 7,000 -> 3,500đ/m²');

    // Giảm quỹ bảo trì xuống một nửa: 5000 -> 2500
    await pool.query(`UPDATE KhoanThu SET don_gia = 2500 WHERE ten = 'Quỹ bảo trì'`);
    console.log('Quỹ bảo trì: 5,000 -> 2,500đ/m²');

    // Cập nhật lại số tiền trong phiếu thu
    // Phí quản lý
    const [kt1] = await pool.query("SELECT id FROM KhoanThu WHERE ten = 'Phí quản lý chung cư'");
    if (kt1.length > 0) {
      await pool.query(`
        UPDATE PhieuThu pt
        JOIN HoGiaDinh hgd ON pt.id_ho_gia_dinh = hgd.id
        SET pt.so_tien_phai_thu = COALESCE(hgd.dien_tich, 70) * 3500,
            pt.so_tien_da_thu = CASE WHEN pt.trang_thai = 1 THEN COALESCE(hgd.dien_tich, 70) * 3500 ELSE 0 END
        WHERE pt.id_khoan_thu = ?
      `, [kt1[0].id]);
    }

    // Quỹ bảo trì
    const [kt2] = await pool.query("SELECT id FROM KhoanThu WHERE ten = 'Quỹ bảo trì'");
    if (kt2.length > 0) {
      await pool.query(`
        UPDATE PhieuThu pt
        JOIN HoGiaDinh hgd ON pt.id_ho_gia_dinh = hgd.id
        SET pt.so_tien_phai_thu = COALESCE(hgd.dien_tich, 70) * 2500,
            pt.so_tien_da_thu = CASE WHEN pt.trang_thai = 1 THEN COALESCE(hgd.dien_tich, 70) * 2500 ELSE 0 END
        WHERE pt.id_khoan_thu = ?
      `, [kt2[0].id]);
    }

    console.log('\nĐã cập nhật số tiền trong phiếu thu');

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
    console.log('\nPhiếu thu tháng 01/2026 hộ C130 (91.9m²):');
    console.table(c130);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
