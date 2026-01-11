const pool = require('./db');

async function run() {
  try {
    console.log('=== THÊM CỘT GIỚI_TÍNH VÀ SDT VÀO BẢNG NHÂN KHẨU ===\n');

    // 1. Thêm cột giới_tính
    console.log('1. Thêm cột giới_tính...');
    try {
      await pool.query(`
        ALTER TABLE NhanKhau 
        ADD COLUMN gioi_tinh VARCHAR(1) DEFAULT 'M' AFTER quan_he
      `);
      console.log('✓ Thêm cột giới_tính thành công\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ Cột giới_tính đã tồn tại\n');
      } else {
        throw err;
      }
    }

    // 2. Thêm cột sdt
    console.log('2. Thêm cột sdt...');
    try {
      await pool.query(`
        ALTER TABLE NhanKhau 
        ADD COLUMN sdt VARCHAR(20) AFTER gioi_tinh
      `);
      console.log('✓ Thêm cột sdt thành công\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ Cột sdt đã tồn tại\n');
      } else {
        throw err;
      }
    }

    // 3. Kiểm tra schema
    console.log('3. Kiểm tra schema hiện tại...');
    const [cols] = await pool.query('DESCRIBE NhanKhau');
    console.log('✓ Các cột của bảng NhanKhau:\n');
    cols.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
    });

    console.log('\n✅ Migration thành công!');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    await pool.end();
    process.exit(1);
  }
}

run();
