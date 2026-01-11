const pool = require('./db');

async function run() {
  try {
    console.log('=== TẠO BẢNG CHIẾN DỊCH QUYÊN GÓP ===\n');

    // 1. Tạo bảng QuyenGopCampaign
    console.log('1. Tạo bảng QuyenGopCampaign...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS QuyenGopCampaign (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ten VARCHAR(255) NOT NULL,
        mo_ta TEXT,
        muc_tieu DECIMAL(15,2) DEFAULT 0,
        so_tien_dat_duoc DECIMAL(15,2) DEFAULT 0,
        ngay_bat_dau DATE NOT NULL,
        ngay_ket_thuc DATE NOT NULL,
        trang_thai ENUM('dang_dien_ra', 'ket_thuc', 'huy') DEFAULT 'dang_dien_ra',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Tạo bảng QuyenGopCampaign thành công\n');

    // 2. Tạo bảng QuyenGopTransaction (ghi nhận các lần quyên góp)
    console.log('2. Tạo bảng QuyenGopTransaction...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS QuyenGopTransaction (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_campaign INT NOT NULL,
        id_ho_gia_dinh INT NOT NULL,
        so_tien DECIMAL(15,2) NOT NULL,
        ghi_chu VARCHAR(255),
        ngay_quyen_gop TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        trang_thai ENUM('hoan_tat', 'huy') DEFAULT 'hoan_tat',
        FOREIGN KEY (id_campaign) REFERENCES QuyenGopCampaign(id) ON DELETE CASCADE,
        FOREIGN KEY (id_ho_gia_dinh) REFERENCES HoGiaDinh(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Tạo bảng QuyenGopTransaction thành công\n');

    // 3. Thêm sample data
    console.log('3. Thêm dữ liệu mẫu...');
    const [result] = await pool.query(`
      INSERT INTO QuyenGopCampaign (ten, mo_ta, muc_tieu, ngay_bat_dau, ngay_ket_thuc, trang_thai)
      VALUES 
        ('Sửa chữa thang máy', 'Chiến dịch quyên góp tiền sửa chữa hệ thống thang máy', 50000000, '2025-01-01', '2025-02-28', 'dang_dien_ra'),
        ('Nâng cấp camera an ninh', 'Lắp đặt camera 24/7 tại các khu vực công cộng', 80000000, '2025-03-01', '2025-04-30', 'dang_dien_ra')
    `);
    console.log(`✓ Thêm ${result.affectedRows} chiến dịch mẫu\n`);

    console.log('✓ Hoàn thành tạo bảng!');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi:', err.message);
    process.exit(1);
  }
}

run();
