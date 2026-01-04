const pool = require('./db');

(async () => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM NhanKhau WHERE ho_ten IN ("xzxz", "Lê Thu 32", "Dương Minh 86", "Lê Lệ 11") ORDER BY id'
        );
        console.log('Dữ liệu các nhân khẩu:');
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error.message);
        process.exit(1);
    }
})();
