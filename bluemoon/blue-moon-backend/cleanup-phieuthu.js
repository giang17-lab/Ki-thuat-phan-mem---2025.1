const pool = require('./db');

async function run() {
  try {
    // Xóa phiếu thu từ tháng 10/2025 trở về trước và những phiếu có ngày null
    const [result] = await pool.query(`
      DELETE FROM PhieuThu 
      WHERE ngay_thu IS NULL 
         OR ngay_thu < '2025-11-01'
    `);
    
    console.log(`Đã xóa ${result.affectedRows} phiếu thu từ 10/2025 trở về trước và phiếu có ngày null`);
    
    // Giữ lại chỉ 2 phiếu của tháng 11/2025 (xóa bớt 1)
    const [nov] = await pool.query(`
      SELECT id FROM PhieuThu 
      WHERE ngay_thu >= '2025-11-01' AND ngay_thu < '2025-12-01'
      LIMIT 1
    `);
    
    if (nov.length > 0) {
      const [delNov] = await pool.query(`
        DELETE FROM PhieuThu 
        WHERE ngay_thu >= '2025-11-01' AND ngay_thu < '2025-12-01'
        AND id = ?
      `, [nov[0].id]);
      console.log(`Đã xóa bớt ${delNov.affectedRows} phiếu thu tháng 11/2025`);
    }
    
    // Kiểm tra lại
    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(ngay_thu, '%Y-%m') as thang, COUNT(*) as so_luong 
      FROM PhieuThu 
      GROUP BY DATE_FORMAT(ngay_thu, '%Y-%m') 
      ORDER BY thang
    `);
    console.log('\nSố phiếu thu còn lại:');
    console.table(rows);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
