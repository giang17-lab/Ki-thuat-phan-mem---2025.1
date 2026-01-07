const pool = require('./db');

async function run() {
  try {
    console.log('=== TẠO PHIẾU THU CHO TẤT CẢ HỘ GIA ĐÌNH ===\n');

    // Lấy tất cả hộ gia đình
    const [hoGiaDinhs] = await pool.query('SELECT id, ma_can_ho, dien_tich FROM HoGiaDinh');
    console.log(`Tổng số hộ gia đình: ${hoGiaDinhs.length}`);

    // Lấy các khoản thu bắt buộc
    const [khoanThus] = await pool.query('SELECT id, ten, loai_phi, don_gia FROM KhoanThu WHERE bat_buoc = true');
    console.log(`Số khoản thu bắt buộc: ${khoanThus.length}`);
    console.table(khoanThus);

    // Xóa phiếu thu cũ
    await pool.query('DELETE FROM PhieuThu');
    console.log('\nĐã xóa phiếu thu cũ');

    let phieuThuCount = 0;
    const months = ['2025-11', '2025-12', '2026-01'];

    for (const hgd of hoGiaDinhs) {
      const dienTich = hgd.dien_tich || 70; // Mặc định 70m²

      for (const month of months) {
        for (const kt of khoanThus) {
          let soTien = 0;

          if (kt.loai_phi === 'co_dinh') {
            soTien = kt.don_gia;
          } else if (kt.loai_phi === 'theo_dien_tich') {
            soTien = kt.don_gia * dienTich;
          } else if (kt.loai_phi === 'bien_dong') {
            // Phí thang máy theo số người (random 2-5 người)
            if (kt.ten.includes('thang máy')) {
              const nguoi = Math.floor(2 + Math.random() * 4);
              soTien = kt.don_gia * nguoi;
            }
          }

          // Mã thanh toán
          const maThanhToan = `${hgd.ma_can_ho}-${String(kt.id).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;

          // Tỷ lệ đã thu: 11/2025 = 95%, 12/2025 = 70%, 01/2026 = 20%
          let daThuRate = 0;
          if (month === '2025-11') daThuRate = 0.95;
          else if (month === '2025-12') daThuRate = 0.70;
          else daThuRate = 0.20;

          const daThu = Math.random() < daThuRate;
          const ngayThu = daThu ? `${month}-${String(Math.floor(5 + Math.random() * 20)).padStart(2, '0')}` : null;
          const soTienDaThu = daThu ? soTien : 0;
          const trangThai = daThu ? 1 : 0;

          await pool.query(
            `INSERT INTO PhieuThu (id_ho_gia_dinh, id_khoan_thu, so_tien_phai_thu, so_tien_da_thu, ngay_thu, ky_thanh_toan, ma_thanh_toan, trang_thai)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [hgd.id, kt.id, soTien, soTienDaThu, ngayThu, month, maThanhToan, trangThai]
          );
          phieuThuCount++;
        }
      }
    }

    console.log(`\nĐã tạo ${phieuThuCount} phiếu thu`);

    // Thống kê
    const [stats] = await pool.query(`
      SELECT ky_thanh_toan, 
             COUNT(*) as tong_phieu,
             SUM(CASE WHEN trang_thai = 1 THEN 1 ELSE 0 END) as da_thu,
             SUM(CASE WHEN trang_thai = 0 THEN 1 ELSE 0 END) as chua_thu
      FROM PhieuThu 
      GROUP BY ky_thanh_toan
      ORDER BY ky_thanh_toan
    `);
    console.log('\n=== THỐNG KÊ PHIẾU THU ===');
    console.table(stats);

    // Kiểm tra hộ C130
    const [c130] = await pool.query(`
      SELECT pt.ky_thanh_toan, pt.trang_thai, kt.ten, pt.so_tien_phai_thu
      FROM PhieuThu pt
      LEFT JOIN KhoanThu kt ON pt.id_khoan_thu = kt.id
      LEFT JOIN HoGiaDinh hgd ON pt.id_ho_gia_dinh = hgd.id
      WHERE hgd.ma_can_ho = 'C130'
      ORDER BY pt.ky_thanh_toan DESC
    `);
    console.log('\n=== PHIẾU THU HỘ C130 ===');
    console.table(c130);

    process.exit(0);
  } catch (err) {
    console.error('Lỗi:', err);
    process.exit(1);
  }
}

run();
