const pool = require('./db');

async function run() {
  try {
    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(ngay_thu, '%Y-%m') as thang, COUNT(*) as so_luong 
      FROM PhieuThu 
      GROUP BY DATE_FORMAT(ngay_thu, '%Y-%m') 
      ORDER BY thang
    `);
    console.log('Số phiếu thu theo tháng:');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
