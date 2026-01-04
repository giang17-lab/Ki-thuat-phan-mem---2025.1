// seed-khoanthu.js - Tạo bảng KhoanThu và seed dữ liệu chuẩn
const fs = require('fs');
const mysql = require('mysql2/promise');

async function readEnv() {
  const p = './.env';
  const c = fs.readFileSync(p, 'utf8');
  const obj = {};
  c.split(/\r?\n/).forEach(l => {
    if (!l || l.trim().startsWith('#')) return;
    const idx = l.indexOf('=');
    if (idx > -1) obj[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
  });
  return obj;
}

(async () => {
  try {
    const env = await readEnv();
    const pool = mysql.createPool({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
      port: env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
    });

    console.log('📝 Tạo bảng KhoanThu (nếu chưa có) và seed dữ liệu...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS KhoanThu (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        ten VARCHAR(255) NOT NULL,
        tien_co_dinh INT DEFAULT 0,
        mo_ta VARCHAR(255) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Đảm bảo cột id là AUTO_INCREMENT nếu bảng đã tồn tại trước đó
    try {
      await pool.query('ALTER TABLE KhoanThu MODIFY id INT NOT NULL AUTO_INCREMENT');
    } catch (e) {
      // Bỏ qua nếu không cần thay đổi
    }

    const items = [
      { id: 1, ten: 'Phí quản lý chung cư', tien: 500000, mo_ta: 'Phí vận hành, bảo trì khu chung cư' },
      { id: 2, ten: 'Phí nước', tien: 200000, mo_ta: 'Tạm tính theo hộ gia đình' },
      { id: 3, ten: 'Phí điện', tien: 300000, mo_ta: 'Tạm tính theo hộ gia đình' },
      { id: 4, ten: 'Phí vệ sinh', tien: 150000, mo_ta: 'Thu gom rác, vệ sinh khu vực chung' },
      { id: 5, ten: 'Phí an ninh', tien: 100000, mo_ta: 'Bảo vệ, camera, hệ thống an ninh' },
    ];

    for (const it of items) {
      await pool.query(
        `INSERT INTO KhoanThu (id, ten, tien_co_dinh, mo_ta)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE ten = VALUES(ten), tien_co_dinh = VALUES(tien_co_dinh), mo_ta = VALUES(mo_ta)`,
        [it.id, it.ten, it.tien, it.mo_ta]
      );
    }

    console.log('✅ Seed KhoanThu hoàn tất.');
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Lỗi seed KhoanThu:', e.message);
    process.exit(1);
  }
})();
