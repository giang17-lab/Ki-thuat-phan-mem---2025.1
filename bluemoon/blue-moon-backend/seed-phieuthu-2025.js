const pool = require('./db');

async function run() {
  try {
    console.log('=== TẠO DỮ LIỆU PHIẾU THU 01/2025 - 10/2025 (ĐÃ THANH TOÁN) ===\n');

    // Lấy tất cả hộ gia đình
    const [hoGiaDinhs] = await pool.query('SELECT id, dien_tich FROM HoGiaDinh ORDER BY id');
    console.log(`Tìm thấy ${hoGiaDinhs.length} hộ gia đình`);

    // Lấy tất cả khoản thu
    const [khoanThus] = await pool.query('SELECT id, ten, loai_phi, don_gia FROM KhoanThu ORDER BY id');
    console.log(`Tìm thấy ${khoanThus.length} khoản thu\n`);

    // Xóa phiếu thu cũ (tùy chọn)
    console.log('Xóa phiếu thu cũ...');
    await pool.query('DELETE FROM PhieuThu WHERE ky_thanh_toan BETWEEN "2025-01" AND "2025-10"');
    console.log('✓ Đã xóa phiếu thu cũ\n');

    let totalInserted = 0;
    const months = [];
    for (let m = 1; m <= 10; m++) {
      months.push(`2025-${String(m).padStart(2, '0')}`);
    }

    console.log(`Tạo phiếu thu cho tháng: ${months.join(', ')}\n`);

    // Với mỗi hộ gia đình
    for (const ho of hoGiaDinhs) {
      // Với mỗi tháng
      for (const month of months) {
        // Với mỗi khoản thu
        for (const khoan of khoanThus) {
          let so_tien_phai_thu = 0;

          // Tính tiền dựa vào loại phí
          if (khoan.loai_phi === 'co_dinh') {
            // Phí cố định
            so_tien_phai_thu = khoan.don_gia || 0;
          } else if (khoan.loai_phi === 'theo_dien_tich') {
            // Phí theo diện tích
            so_tien_phai_thu = (ho.dien_tich || 50) * (khoan.don_gia || 0);
          } else if (khoan.loai_phi === 'bien_dong') {
            // Phí biến động (mô phỏng: random hoặc mặc định)
            so_tien_phai_thu = khoan.don_gia || 0;
          }

          // Làm tròn số tiền
          so_tien_phai_thu = Math.round(so_tien_phai_thu);

          // Bỏ qua nếu tiền = 0
          if (so_tien_phai_thu === 0) continue;

          // Tạo mã thanh toán (ngắn gọn)
          const randomNum = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
          const ma_thanh_toan = `${month.replace('-', '')}-${ho.id}-${khoan.id}-${randomNum}`;

          // Insert phiếu thu (đã thanh toán)
          await pool.query(
            `INSERT INTO PhieuThu 
            (id_ho_gia_dinh, id_khoan_thu, ky_thanh_toan, so_tien_phai_thu, so_tien_da_thu, ngay_thu, trang_thai, ma_thanh_toan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              ho.id,
              khoan.id,
              month,
              so_tien_phai_thu,
              so_tien_phai_thu,  // Đã thanh toán full
              new Date(month + '-25'),  // Ngày 25 tháng đó
              1,  // trang_thai = 1 (đã thanh toán)
              ma_thanh_toan
            ]
          );

          totalInserted++;
        }
      }

      if (hoGiaDinhs.indexOf(ho) % 5 === 0) {
        console.log(`✓ Đã tạo phiếu cho hộ ${ho.id}`);
      }
    }

    console.log(`\n✓ Tạo xong ${totalInserted} phiếu thu\n`);

    // Thống kê
    console.log('=== THỐNG KÊ ===');
    const [totalCount] = await pool.query('SELECT COUNT(*) as count FROM PhieuThu WHERE ky_thanh_toan BETWEEN "2025-01" AND "2025-10"');
    const [totalAmount] = await pool.query('SELECT SUM(so_tien_phai_thu) as total FROM PhieuThu WHERE ky_thanh_toan BETWEEN "2025-01" AND "2025-10"');
    const [paidAmount] = await pool.query('SELECT SUM(so_tien_da_thu) as total FROM PhieuThu WHERE ky_thanh_toan BETWEEN "2025-01" AND "2025-10"');

    console.log(`Tổng phiếu thu: ${totalCount[0].count}`);
    console.log(`Tổng tiền phải thu: ${Number(totalAmount[0].total || 0).toLocaleString('vi-VN')} đ`);
    console.log(`Tổng tiền đã thu: ${Number(paidAmount[0].total || 0).toLocaleString('vi-VN')} đ`);

    // Thống kê theo tháng
    console.log('\n=== THỐNG KÊ THEO THÁNG ===');
    const [byMonth] = await pool.query(`
      SELECT ky_thanh_toan, COUNT(*) as count, SUM(so_tien_phai_thu) as total
      FROM PhieuThu
      WHERE ky_thanh_toan BETWEEN "2025-01" AND "2025-10"
      GROUP BY ky_thanh_toan
      ORDER BY ky_thanh_toan
    `);

    byMonth.forEach(row => {
      console.log(`${row.ky_thanh_toan}: ${row.count} phiếu - ${Number(row.total).toLocaleString('vi-VN')} đ`);
    });

    console.log('\n✓ Hoàn thành!');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi:', err.message);
    process.exit(1);
  }
}

run();
