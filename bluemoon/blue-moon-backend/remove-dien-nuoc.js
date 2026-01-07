const pool = require('./db');

async function run() {
  try {
    console.log('=== XÓA PHÍ ĐIỆN VÀ NƯỚC ===\n');

    // 1. Xem danh sách khoản thu hiện có
    const [khoanThus] = await pool.query('SELECT id, ten FROM KhoanThu');
    console.log('Danh sách khoản thu hiện có:');
    console.table(khoanThus);

    // 2. Tìm ID của phí điện và nước
    const [dien] = await pool.query("SELECT id FROM KhoanThu WHERE ten LIKE '%điện%'");
    const [nuoc] = await pool.query("SELECT id FROM KhoanThu WHERE ten LIKE '%nước%'");
    
    const dienIds = dien.map(d => d.id);
    const nuocIds = nuoc.map(n => n.id);
    const idsToDelete = [...dienIds, ...nuocIds];
    
    console.log(`\nID phí điện: ${dienIds.join(', ')}`);
    console.log(`ID phí nước: ${nuocIds.join(', ')}`);

    if (idsToDelete.length > 0) {
      // 3. Xóa phiếu thu liên quan
      const [delPT] = await pool.query(
        'DELETE FROM PhieuThu WHERE id_khoan_thu IN (?)',
        [idsToDelete]
      );
      console.log(`\nĐã xóa ${delPT.affectedRows} phiếu thu liên quan đến điện/nước`);

      // 4. Xóa khoản thu điện và nước
      const [delKT] = await pool.query(
        'DELETE FROM KhoanThu WHERE id IN (?)',
        [idsToDelete]
      );
      console.log(`Đã xóa ${delKT.affectedRows} khoản thu điện/nước`);
    }

    // 5. Hiển thị khoản thu còn lại
    const [remaining] = await pool.query('SELECT id, ten, don_gia, don_vi FROM KhoanThu');
    console.log('\n=== KHOẢN THU CÒN LẠI ===');
    console.table(remaining);

    // 6. Kiểm tra phiếu thu
    const [stats] = await pool.query(`
      SELECT ky_thanh_toan, 
             COUNT(*) as tong_phieu,
             SUM(CASE WHEN trang_thai = 1 THEN 1 ELSE 0 END) as da_thu
      FROM PhieuThu 
      GROUP BY ky_thanh_toan
    `);
    console.log('\n=== THỐNG KÊ PHIẾU THU ===');
    console.table(stats);

    process.exit(0);
  } catch (err) {
    console.error('Lỗi:', err);
    process.exit(1);
  }
}

run();
