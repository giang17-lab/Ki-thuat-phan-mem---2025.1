const pool = require('./db');

async function createGopYTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS GopY (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                tieu_de VARCHAR(200) NOT NULL,
                noi_dung TEXT NOT NULL,
                loai_gop_y ENUM('gop_y', 'khieu_nai', 'yeu_cau', 'khac') DEFAULT 'gop_y',
                trang_thai ENUM('moi', 'dang_xu_ly', 'da_xu_ly', 'tu_choi') DEFAULT 'moi',
                phan_hoi TEXT,
                admin_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES NguoiDung(id) ON DELETE CASCADE,
                INDEX idx_user (user_id),
                INDEX idx_status (trang_thai)
            )
        `);
        console.log('✅ Created GopY table successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createGopYTable();
