const pool = require('./db');

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS GopY (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        tieu_de VARCHAR(200) NOT NULL,
        noi_dung TEXT NOT NULL,
        loai_gop_y ENUM('gop_y', 'khieu_nai', 'de_xuat', 'yeu_cau', 'khac') DEFAULT 'gop_y',
        trang_thai ENUM('cho_xu_ly', 'dang_xu_ly', 'da_phan_hoi', 'da_dong') DEFAULT 'cho_xu_ly',
        phan_hoi TEXT,
        admin_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES NguoiDung(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_status (trang_thai)
      )
    `);
    console.log('✅ GopY table created successfully!');
  } catch(e) { 
    console.error('Error:', e.message); 
  }
  process.exit();
}

setup();
