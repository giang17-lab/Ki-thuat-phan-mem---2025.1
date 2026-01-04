// Check NhanKhau data
const pool = require('./db');

async function checkNhanKhau() {
    try {
        const [rows] = await pool.query('SELECT id, id_ho_gia_dinh, ho_ten, quan_he, ngay_sinh FROM NhanKhau LIMIT 10');
        console.log('Dữ liệu NhanKhau:');
        console.table(rows);
        
        // Check nếu có record nào thiếu ho_ten
        const [noName] = await pool.query('SELECT COUNT(*) as count FROM NhanKhau WHERE ho_ten IS NULL OR ho_ten = ""');
        console.log(`\nSố bản ghi không có tên: ${noName[0].count}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error.message);
        process.exit(1);
    }
}

checkNhanKhau();
