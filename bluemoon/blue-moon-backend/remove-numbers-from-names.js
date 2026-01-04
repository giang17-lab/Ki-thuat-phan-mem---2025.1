const pool = require('./db');

(async () => {
    try {
        // Lấy tất cả nhân khẩu có số ở cuối tên
        const [rows] = await pool.query('SELECT id, ho_ten FROM NhanKhau WHERE ho_ten REGEXP " [0-9]+$"');
        
        console.log(`Tìm thấy ${rows.length} nhân khẩu có số ở cuối tên`);
        
        for (const row of rows) {
            // Xóa số ở cuối tên (pattern: space + số)
            const newName = row.ho_ten.replace(/ \d+$/, '');
            await pool.query('UPDATE NhanKhau SET ho_ten = ? WHERE id = ?', [newName, row.id]);
            console.log(`${row.ho_ten} → ${newName}`);
        }
        
        console.log('\n✅ Đã xóa hết số ở cuối tên!');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error.message);
        process.exit(1);
    }
})();
