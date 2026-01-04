const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  try {
    console.log('🔄 Tạo kết nối đến MySQL...');
    
    // Kết nối không dùng database
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('✅ Kết nối thành công');

    // Tạo database
    console.log('🔄 Tạo database blue_moon_db...');
    await conn.execute('CREATE DATABASE IF NOT EXISTS blue_moon_db');
    console.log('✅ Database tạo thành công');

    // Chọn database
    await conn.execute('USE blue_moon_db');

    // Đọc schema file
    const schemaSQL = fs.readFileSync('./sql/auth_schema.sql', 'utf8');
    
    // Chạy từng câu lệnh
    const statements = schemaSQL.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`🔄 Thực thi: ${statement.substring(0, 50)}...`);
        await conn.execute(statement);
      }
    }

    console.log('✅ Schema tạo thành công');
    
    await conn.end();
    console.log('\n✅ Setup database hoàn tất!');
  } catch(e) {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  }
})();
