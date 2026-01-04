const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'blue_moon_db'
    });

    // Create NguoiDung table
    const createTableSql = `CREATE TABLE IF NOT EXISTS NguoiDung (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      ten_nguoi_dung VARCHAR(100),
      role ENUM('admin', 'user', 'moderator') DEFAULT 'user',
      trang_thai TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_email (email)
    )`;

    await conn.execute(createTableSql);
    console.log('✅ NguoiDung table created successfully');

    // Insert test users (plain passwords for hashing)
    const bcrypt = require('bcryptjs');
    
    // Hash test passwords
    const adminHash = await bcrypt.hash('password123', 10);
    const userHash = await bcrypt.hash('password123', 10);

    const insertSql = `INSERT IGNORE INTO NguoiDung (username, password_hash, email, ten_nguoi_dung, role) VALUES (?, ?, ?, ?, ?)`;
    
    await conn.execute(insertSql, ['admin', adminHash, 'admin@bluemoon.com', 'Quản trị viên', 'admin']);
    console.log('✅ Admin user inserted');
    
    await conn.execute(insertSql, ['user1', userHash, 'user1@bluemoon.com', 'Người dùng 1', 'user']);
    console.log('✅ Test user inserted');

    await conn.end();
    console.log('\n✅ Migration completed successfully!');
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
