const pool = require('./db');

(async () => {
  try {
    const [months] = await pool.query('SELECT DISTINCT ky_thanh_toan FROM PhieuThu ORDER BY ky_thanh_toan');
    console.log('Available months in database:');
    console.table(months);
    
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
