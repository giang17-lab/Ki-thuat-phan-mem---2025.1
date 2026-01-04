const pool = require('./db');

function randomCCCD() {
    // Format: 12 chữ số (CCCD mới)
    return Array(12).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
}

function randomPhone() {
    // Format: 09xx xxx xxx hoặc 03xx xxx xxx
    const prefix = Math.random() < 0.5 ? '09' : '03';
    const suffix = Array(8).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
    return prefix + suffix;
}

(async () => {
    try {
        console.log('Đang tạo CCCD và SĐT cho các hộ gia đình...');
        
        const [households] = await pool.query('SELECT id, ten_chu_ho FROM HoGiaDinh');
        
        let count = 0;
        for (const ho of households) {
            const cccd = randomCCCD();
            const sdt = randomPhone();
            
            await pool.query('UPDATE HoGiaDinh SET cccd = ?, sdt = ? WHERE id = ?', [cccd, sdt, ho.id]);
            console.log(`${ho.ten_chu_ho}: CCCD ${cccd}, SĐT ${sdt}`);
            count++;
        }
        
        console.log(`\n✅ Đã thêm CCCD và SĐT cho ${count} hộ gia đình!`);
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error.message);
        process.exit(1);
    }
})();
