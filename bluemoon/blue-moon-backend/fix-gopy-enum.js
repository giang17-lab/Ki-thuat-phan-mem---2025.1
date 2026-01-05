const pool = require('./db');

async function fixEnum() {
  try {
    await pool.query(`
      ALTER TABLE GopY 
      MODIFY COLUMN trang_thai ENUM('cho_xu_ly','dang_xu_ly','da_phan_hoi','da_dong') 
      DEFAULT 'cho_xu_ly'
    `);
    console.log('✅ Đã cập nhật enum trang_thai thành công!');
  } catch(e) { 
    console.error('❌ Lỗi:', e.message); 
  }
  process.exit();
}

fixEnum();
