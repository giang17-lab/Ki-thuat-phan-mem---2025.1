const pool = require('./db');

(async()=>{
  try {
    const [rows] = await pool.query('SELECT * FROM KhoanThu WHERE ten LIKE "%quản lý%"');
    console.log('\n=== PHÍ QUẢN LÝ CHUNG CƯ ===\n');
    rows.forEach(row => {
      console.log(`Tên: ${row.ten}`);
      console.log(`Loại: ${row.loai_phi}`);
      console.log(`Đơn giá: ${row.don_gia} ${row.don_vi}`);
      console.log(`Mô tả: ${row.mo_ta}`);
      console.log('---');
    });
    process.exit(0);
  } catch(e) {
    console.error(e.message);
    process.exit(1);
  }
})();
