const pool = require('./db');

(async()=>{
  try {
    const [rows] = await pool.query('SELECT * FROM KhoanThu ORDER BY id');
    console.log('\n=== DANH SÁCH KHOẢN THU ===\n');
    rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.ten}`);
      console.log(`   - Loại: ${row.loai_phi}`);
      console.log(`   - Đơn giá: ${row.don_gia.toLocaleString('vi-VN')} ${row.don_vi}`);
      console.log(`   - Bắt buộc: ${row.bat_buoc ? '✓' : '✗'}`);
      console.log(`   - Mô tả: ${row.mo_ta}`);
      console.log('');
    });
    process.exit(0);
  } catch(e) {
    console.error(e.message);
    process.exit(1);
  }
})();
