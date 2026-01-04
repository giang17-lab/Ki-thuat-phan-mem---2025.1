const pool = require('./db');

(async () => {
    try {
        const [rows] = await pool.query('SELECT id, ma_can_ho, ten_chu_ho, cccd, sdt FROM HoGiaDinh WHERE ma_can_ho = "C130"');
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error.message);
        process.exit(1);
    }
})();
