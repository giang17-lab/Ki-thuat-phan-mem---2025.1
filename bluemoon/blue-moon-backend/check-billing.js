const pool = require('./db');

(async () => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM PhieuThu');
    console.log('Total PhieuThu records:', rows[0].total);
    
    const [sample] = await pool.query('SELECT * FROM PhieuThu LIMIT 3');
    console.log('\nSample records:');
    console.table(sample);
    
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
