const pool = require('./db');

async function run() {
  try {
    const [rows] = await pool.query('SELECT * FROM KhoanThu');
    console.log('Các khoản thu hiện có:');
    console.table(rows);
    
    const [desc] = await pool.query('DESCRIBE KhoanThu');
    console.log('\nCấu trúc bảng KhoanThu:');
    console.table(desc);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
