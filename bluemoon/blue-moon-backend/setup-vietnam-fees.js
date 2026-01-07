const pool = require('./db');

async function run() {
  try {
    console.log('=== THIẾT LẬP KHOẢN THU THEO MÔ HÌNH VIỆT NAM ===\n');

    // 1. Xóa khoản thu cũ
    console.log('1. Xóa các khoản thu cũ...');
    await pool.query('DELETE FROM PhieuThu');
    await pool.query('DELETE FROM KhoanThu');
    await pool.query('ALTER TABLE KhoanThu AUTO_INCREMENT = 1');
    
    // 2. Thêm cột mới cho bảng KhoanThu
    console.log('2. Cập nhật cấu trúc bảng KhoanThu...');
    const columnsToAdd = [
      { name: 'loai_phi', sql: "ADD COLUMN loai_phi ENUM('co_dinh', 'bien_dong', 'theo_dien_tich') DEFAULT 'co_dinh'" },
      { name: 'don_gia', sql: 'ADD COLUMN don_gia INT DEFAULT 0' },
      { name: 'don_vi', sql: "ADD COLUMN don_vi VARCHAR(50) DEFAULT 'đồng/tháng'" },
      { name: 'bat_buoc', sql: 'ADD COLUMN bat_buoc BOOLEAN DEFAULT true' }
    ];

    for (const col of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE KhoanThu ${col.sql}`);
        console.log(`   + Đã thêm cột ${col.name}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log(`   - Cột ${col.name} đã tồn tại`);
        } else {
          throw e;
        }
      }
    }

    // 3. Thêm các khoản thu theo mô hình Việt Nam
    console.log('\n3. Thêm các khoản thu theo mô hình Việt Nam...');
    
    const khoanThus = [
      // Phí quản lý - theo diện tích căn hộ
      {
        ten: 'Phí quản lý chung cư',
        tien_co_dinh: 0,
        mo_ta: 'Phí quản lý, vận hành tòa nhà (tính theo m² sàn)',
        loai_phi: 'theo_dien_tich',
        don_gia: 7000, // 7,000đ/m²/tháng
        don_vi: 'đồng/m²/tháng',
        bat_buoc: true
      },
      // Tiền điện sinh hoạt - theo số điện tiêu thụ (bậc thang EVN)
      {
        ten: 'Tiền điện sinh hoạt',
        tien_co_dinh: 0,
        mo_ta: 'Tính theo số kWh tiêu thụ (giá bậc thang EVN)',
        loai_phi: 'bien_dong',
        don_gia: 2927, // Giá bình quân ~2,927đ/kWh
        don_vi: 'đồng/kWh',
        bat_buoc: true
      },
      // Tiền nước sinh hoạt - theo số khối
      {
        ten: 'Tiền nước sinh hoạt',
        tien_co_dinh: 0,
        mo_ta: 'Tính theo số m³ nước tiêu thụ',
        loai_phi: 'bien_dong',
        don_gia: 15000, // ~15,000đ/m³
        don_vi: 'đồng/m³',
        bat_buoc: true
      },
      // Phí gửi xe máy
      {
        ten: 'Phí gửi xe máy',
        tien_co_dinh: 100000,
        mo_ta: 'Phí gửi xe máy hàng tháng (mỗi xe)',
        loai_phi: 'co_dinh',
        don_gia: 100000,
        don_vi: 'đồng/xe/tháng',
        bat_buoc: false
      },
      // Phí gửi ô tô
      {
        ten: 'Phí gửi ô tô',
        tien_co_dinh: 1500000,
        mo_ta: 'Phí gửi ô tô hàng tháng (mỗi xe)',
        loai_phi: 'co_dinh',
        don_gia: 1500000,
        don_vi: 'đồng/xe/tháng',
        bat_buoc: false
      },
      // Phí vệ sinh - rác thải
      {
        ten: 'Phí vệ sinh môi trường',
        tien_co_dinh: 30000,
        mo_ta: 'Phí thu gom, xử lý rác thải',
        loai_phi: 'co_dinh',
        don_gia: 30000,
        don_vi: 'đồng/hộ/tháng',
        bat_buoc: true
      },
      // Phí thang máy
      {
        ten: 'Phí thang máy',
        tien_co_dinh: 0,
        mo_ta: 'Phí vận hành thang máy (theo số người trong hộ)',
        loai_phi: 'bien_dong',
        don_gia: 30000, // 30,000đ/người/tháng
        don_vi: 'đồng/người/tháng',
        bat_buoc: true
      },
      // Phí bảo trì (2% giá trị căn hộ - thu 1 lần hoặc theo năm)
      {
        ten: 'Quỹ bảo trì',
        tien_co_dinh: 0,
        mo_ta: 'Quỹ bảo trì tòa nhà (2% giá trị căn hộ)',
        loai_phi: 'theo_dien_tich',
        don_gia: 500000, // Tạm tính/m² cho đơn giản
        don_vi: 'đồng/m²',
        bat_buoc: true
      },
      // Internet (tùy chọn)
      {
        ten: 'Internet chung cư',
        tien_co_dinh: 150000,
        mo_ta: 'Gói Internet chung cư (tùy chọn)',
        loai_phi: 'co_dinh',
        don_gia: 150000,
        don_vi: 'đồng/tháng',
        bat_buoc: false
      },
      // Phí trông giữ xe đạp
      {
        ten: 'Phí gửi xe đạp',
        tien_co_dinh: 30000,
        mo_ta: 'Phí gửi xe đạp hàng tháng',
        loai_phi: 'co_dinh',
        don_gia: 30000,
        don_vi: 'đồng/xe/tháng',
        bat_buoc: false
      }
    ];

    for (const kt of khoanThus) {
      await pool.query(
        `INSERT INTO KhoanThu (ten, tien_co_dinh, mo_ta, loai_phi, don_gia, don_vi, bat_buoc) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [kt.ten, kt.tien_co_dinh, kt.mo_ta, kt.loai_phi, kt.don_gia, kt.don_vi, kt.bat_buoc]
      );
    }
    console.log(`   Đã thêm ${khoanThus.length} loại khoản thu`);

    // 4. Hiển thị kết quả
    const [result] = await pool.query('SELECT id, ten, loai_phi, don_gia, don_vi, bat_buoc FROM KhoanThu');
    console.log('\n=== DANH SÁCH KHOẢN THU MỚI ===');
    console.table(result);

    // 5. Tạo phiếu thu mẫu cho tháng 12/2025 và 1/2026
    console.log('\n4. Tạo phiếu thu mẫu...');
    
    const [hoGiaDinhs] = await pool.query('SELECT id, ma_can_ho, dien_tich FROM HoGiaDinh LIMIT 20');
    const [newKhoanThus] = await pool.query('SELECT id, ten, loai_phi, don_gia FROM KhoanThu WHERE bat_buoc = true');
    
    let phieuThuCount = 0;
    const months = ['2025-12', '2026-01'];
    
    for (const hgd of hoGiaDinhs) {
      const dienTich = hgd.dien_tich || 70; // Mặc định 70m²
      
      for (const month of months) {
        for (const kt of newKhoanThus) {
          let soTien = 0;
          
          if (kt.loai_phi === 'co_dinh') {
            soTien = kt.don_gia;
          } else if (kt.loai_phi === 'theo_dien_tich') {
            soTien = kt.don_gia * dienTich;
          } else if (kt.loai_phi === 'bien_dong') {
            // Tạo số ngẫu nhiên cho điện/nước/thang máy
            if (kt.ten.includes('điện')) {
              const kwh = Math.floor(150 + Math.random() * 200); // 150-350 kWh
              soTien = kt.don_gia * kwh;
            } else if (kt.ten.includes('nước')) {
              const m3 = Math.floor(8 + Math.random() * 12); // 8-20 m³
              soTien = kt.don_gia * m3;
            } else if (kt.ten.includes('thang máy')) {
              const nguoi = Math.floor(2 + Math.random() * 3); // 2-4 người
              soTien = kt.don_gia * nguoi;
            }
          }
          
          // Mã thanh toán
          const maThanhToan = `${hgd.ma_can_ho}-${String(kt.id).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;
          
          // Random đã thu hay chưa (70% đã thu cho tháng 12, 20% cho tháng 1)
          const daThu = month === '2025-12' ? Math.random() < 0.7 : Math.random() < 0.2;
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
    
    console.log(`   Đã tạo ${phieuThuCount} phiếu thu mẫu`);

    // Thống kê
    const [stats] = await pool.query(`
      SELECT ky_thanh_toan, 
             COUNT(*) as tong_phieu,
             SUM(CASE WHEN trang_thai = 1 THEN 1 ELSE 0 END) as da_thu,
             FORMAT(SUM(so_tien_phai_thu), 0) as tong_tien
      FROM PhieuThu 
      GROUP BY ky_thanh_toan
    `);
    console.log('\n=== THỐNG KÊ PHIẾU THU ===');
    console.table(stats);

    console.log('\n✅ Hoàn tất thiết lập khoản thu theo mô hình Việt Nam!');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi:', err);
    process.exit(1);
  }
}

run();
