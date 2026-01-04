// seed-billing.js - Tạo dữ liệu Phiếu Thu (Hóa đơn/Khoản Thu) cho thống kê
const fs = require('fs');
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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

    console.log('📝 Đang tạo dữ liệu Phiếu Thu (Hóa đơn/Khoản Thu)...\n');

    // Xóa dữ liệu cũ để đảm bảo thống kê đúng
    await pool.query('DELETE FROM PhieuThu');
    console.log('✓ Xóa dữ liệu cũ\n');

    // Lấy danh sách hộ gia đình
    const [households] = await pool.query('SELECT id, ma_can_ho FROM HoGiaDinh ORDER BY id');
    if (!households.length) {
      console.log('❌ Không có hộ gia đình. Hãy chạy generate-seeds.js trước.');
      await pool.end();
      process.exit(1);
    }

    console.log(`✓ Tìm thấy ${households.length} hộ gia đình`);

    // Giới hạn ~100 phiếu: dùng tối đa 8 hộ đầu tiên
    const selectedHouseholds = households.slice(0, 8);
    console.log(`✓ Sử dụng ${selectedHouseholds.length} hộ đầu tiên để tạo dữ liệu gọn (~100 phiếu)`);

    // Đọc các khoản thu từ bảng KhoanThu để đồng bộ tên & số tiền
    const [khoanRows] = await pool.query('SELECT id, ten, tien_co_dinh FROM KhoanThu ORDER BY id');
    const khoanThu = khoanRows.length ? khoanRows : [
      { id: 1, ten: 'Phí quản lý chung cư', tien_co_dinh: 500000 },
      { id: 2, ten: 'Phí nước', tien_co_dinh: 200000 },
      { id: 3, ten: 'Phí điện', tien_co_dinh: 300000 },
      { id: 4, ten: 'Phí vệ sinh', tien_co_dinh: 150000 },
      { id: 5, ten: 'Phí an ninh', tien_co_dinh: 100000 },
    ];

    // Tạo phiếu thu cho 6 tháng gần đây để dữ liệu gọn, dễ xem
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      // Lưu ở định dạng "Tháng MM/YYYY" cho UI dễ đọc
      months.push(`Tháng ${month}/${year}`);
    }

    console.log(`\nĐang tạo phiếu thu cho 6 tháng: ${months[0]} đến ${months[months.length - 1]}`);

    let insertedCount = 0;
    const targetCap = 100;

    for (const ho of selectedHouseholds) {
      for (const month of months) {
        // Mỗi hộ có 2 khoản thu mỗi tháng để kiểm soát tổng số phiếu
        const khoanCount = 2;
        for (let k = 0; k < khoanCount; k++) {
          const khoan = khoanThu[k];
          const soTienPhaiThu = Math.max(0, khoan.tien_co_dinh + randomInt(-50000, 80000));

          // Phân bố trạng thái: 50% đã thanh toán, 30% chưa thanh toán, 20% quá hạn/thu một phần
          let trangThai = 0; // 0: chưa thanh toán
          let soTienDaThu = 0;
          let ngayThu = null;

          const rand = Math.random();
          if (rand < 0.5) {
            trangThai = 1; // đã thanh toán
            soTienDaThu = soTienPhaiThu;
            // chọn ngày thu trong tháng tương ứng (giả lập mốc 15)
            ngayThu = new Date(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`).toISOString().split('T')[0];
          } else if (rand < 0.8) {
            trangThai = 0; // chưa thanh toán
            soTienDaThu = 0;
          } else {
            trangThai = 2; // quá hạn / thu một phần
            soTienDaThu = randomInt(Math.floor(soTienPhaiThu * 0.2), Math.floor(soTienPhaiThu * 0.7));
            ngayThu = null;
          }

          try {
            await pool.query(
              `INSERT INTO PhieuThu (id_ho_gia_dinh, id_khoan_thu, ky_thanh_toan, so_tien_phai_thu, so_tien_da_thu, ngay_thu, trang_thai) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [ho.id, khoan.id, month, soTienPhaiThu, soTienDaThu, ngayThu, trangThai]
            );
            insertedCount++;
            if (insertedCount >= targetCap) break;
          } catch (err) {
            console.log(`⚠ Lỗi khi thêm phiếu: ${err.message}`);
          }
        }
        if (insertedCount >= targetCap) break;
      }
      if (insertedCount >= targetCap) break;
    }

    console.log(`\n✅ Hoàn thành! Tạo ${insertedCount} phiếu thu.`);
    console.log(`\n📊 Thống kê:`);
    console.log(`  - Hộ gia đình: ${households.length}`);
    console.log(`  - Khoản thu: ${khoanThu.length}`);
    console.log(`  - Tháng: 6`);
    console.log(`  - Tổng phiếu thu: ${insertedCount}`);
    console.log(`\n💡 Trạng thái phiếu:`);
    console.log(`  - 0: Chưa thanh toán`);
    console.log(`  - 1: Đã thanh toán`);
    console.log(`  - 2: Quá hạn/Chậm thanh toán`);

    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Lỗi seed billing:', e.message);
    process.exit(1);
  }
})();
