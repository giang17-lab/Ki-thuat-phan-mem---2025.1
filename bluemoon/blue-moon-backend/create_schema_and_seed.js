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
    const cn = await mysql.createConnection({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
      port: env.DB_PORT || 3306,
      multipleStatements: true,
    });

    console.log('Connected, creating schema...');

    const createSql = `
    CREATE TABLE IF NOT EXISTS HoGiaDinh (
      id INT PRIMARY KEY AUTO_INCREMENT,
      ma_can_ho VARCHAR(50) UNIQUE NOT NULL,
      ten_chu_ho VARCHAR(200) NOT NULL,
      dien_tich DECIMAL(8,2),
      ngay_chuyen_den DATE
    );

    CREATE TABLE IF NOT EXISTS NhanKhau (
      id INT PRIMARY KEY AUTO_INCREMENT,
      id_ho_gia_dinh INT NOT NULL,
      ho_ten VARCHAR(200) NOT NULL,
      ngay_sinh DATE,
      cccd VARCHAR(50),
      loai_cu_tru TINYINT DEFAULT 1,
      FOREIGN KEY (id_ho_gia_dinh) REFERENCES HoGiaDinh(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS XeCo (
      id INT PRIMARY KEY AUTO_INCREMENT,
      id_ho_gia_dinh INT NOT NULL,
      bien_so VARCHAR(50) NOT NULL,
      loai_xe VARCHAR(50),
      ngay_dang_ky DATE,
      trang_thai TINYINT DEFAULT 1,
      FOREIGN KEY (id_ho_gia_dinh) REFERENCES HoGiaDinh(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS PhieuThu (
      id INT PRIMARY KEY AUTO_INCREMENT,
      id_ho_gia_dinh INT NOT NULL,
      id_khoan_thu INT NOT NULL,
      ky_thanh_toan VARCHAR(100),
      so_tien_phai_thu DECIMAL(10,2) DEFAULT 0,
      so_tien_da_thu DECIMAL(10,2) DEFAULT 0,
      ngay_thu DATE,
      trang_thai TINYINT DEFAULT 0,
      FOREIGN KEY (id_ho_gia_dinh) REFERENCES HoGiaDinh(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS YeuCauThemXe (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      ho_gia_dinh_id INT,
      bien_so VARCHAR(50) NOT NULL,
      loai_xe VARCHAR(50) NOT NULL,
      mo_ta TEXT,
      trang_thai ENUM('pending','approved','rejected') DEFAULT 'pending',
      ly_do_tu_choi VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_by INT,
      approved_at TIMESTAMP NULL,
      rejected_at TIMESTAMP NULL,
      FOREIGN KEY (user_id) REFERENCES NguoiDung(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS YeuCauThemNhanKhau (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      ho_gia_dinh_id INT,
      ho_ten VARCHAR(100) NOT NULL,
      quan_he VARCHAR(50) NOT NULL,
      ngay_sinh DATE,
      gioi_tinh VARCHAR(10),
      cccd VARCHAR(20),
      mo_ta TEXT,
      trang_thai ENUM('pending','approved','rejected') DEFAULT 'pending',
      ly_do_tu_choi VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_by INT,
      approved_at TIMESTAMP NULL,
      rejected_at TIMESTAMP NULL,
      FOREIGN KEY (user_id) REFERENCES NguoiDung(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS YeuCau (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      loai_yeu_cau ENUM('vehicle','resident') NOT NULL,
      chi_tiet_yeu_cau INT NOT NULL,
      trang_thai ENUM('pending','approved','rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES NguoiDung(id) ON DELETE CASCADE
    );
    `;

    await cn.query(createSql);
    console.log('Schema created (if not existed).');

    // Insert sample data
    const hoGiaDinhSamples = [
      { ma: 'A101', ten: 'Nguyễn Văn A', dien_tich: 75.5, ngay: '2020-01-15' },
      { ma: 'A102', ten: 'Trần Thị B', dien_tich: 60, ngay: '2019-06-20' },
      { ma: 'B201', ten: 'Lê Văn C', dien_tich: 88.2, ngay: '2021-03-05' },
      { ma: 'B202', ten: 'Phạm Thị D', dien_tich: 45, ngay: '2018-11-01' },
      { ma: 'C301', ten: 'Hoàng Văn E', dien_tich: 120, ngay: '2022-07-10' },
    ];

    let insertedHo = 0;
    for (const ho of hoGiaDinhSamples) {
      let hoId;
      try {
        const [r] = await cn.query('INSERT INTO HoGiaDinh (ma_can_ho, ten_chu_ho, dien_tich, ngay_chuyen_den) VALUES (?, ?, ?, ?)', [ho.ma, ho.ten, ho.dien_tich, ho.ngay]);
        hoId = r.insertId;
        insertedHo++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          const [rows] = await cn.query('SELECT id FROM HoGiaDinh WHERE ma_can_ho = ?', [ho.ma]);
          hoId = rows[0].id;
        } else {
          throw err;
        }
      }

      // residents
      const residents = [
        { name: `${ho.ten} - Thành viên 1` },
        { name: `${ho.ten} - Thành viên 2` },
      ];
      for (const r of residents) {
        await cn.query('INSERT INTO NhanKhau (id_ho_gia_dinh, ho_ten, loai_cu_tru) VALUES (?, ?, 1)', [hoId, r.name]);
      }

      // vehicle
      await cn.query('INSERT INTO XeCo (id_ho_gia_dinh, bien_so, loai_xe, ngay_dang_ky, trang_thai) VALUES (?, ?, ?, ?, 1)', [hoId, `30A-${Math.floor(Math.random()*9000)+1000}`, 'Xe máy', new Date().toISOString().slice(0,10)]);

      // receipt
      await cn.query('INSERT INTO PhieuThu (id_ho_gia_dinh, id_khoan_thu, ky_thanh_toan, so_tien_phai_thu, so_tien_da_thu, ngay_thu, trang_thai) VALUES (?, ?, ?, ?, 0, ?, 0)', [hoId, 1, 'Tháng 12', Math.floor(Math.random()*1000)+100, new Date().toISOString().slice(0,10)]);
    }

    console.log('Inserted sample data for HoGiaDinh and related tables.');

    await cn.end();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
