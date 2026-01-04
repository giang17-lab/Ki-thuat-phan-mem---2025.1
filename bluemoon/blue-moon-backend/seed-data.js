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

    const hoGiaDinhSamples = [
      { ma: 'A101', ten: 'Nguyễn Văn Anh', dien_tich: 75.5, ngay: '2020-01-15' },
      { ma: 'A102', ten: 'Trần Thị Bình', dien_tich: 60, ngay: '2019-06-20' },
      { ma: 'A103', ten: 'Lê Văn Cường', dien_tich: 70, ngay: '2021-02-10' },
      { ma: 'B201', ten: 'Phạm Thị Dung', dien_tich: 88.2, ngay: '2021-03-05' },
      { ma: 'B202', ten: 'Hoàng Văn Em', dien_tich: 45, ngay: '2018-11-01' },
      { ma: 'B203', ten: 'Vũ Thị Phương', dien_tich: 65, ngay: '2020-05-15' },
      { ma: 'C301', ten: 'Đặng Văn Giang', dien_tich: 120, ngay: '2022-07-10' },
      { ma: 'C302', ten: 'Ngô Thị Hạnh', dien_tich: 95, ngay: '2021-08-20' },
      { ma: 'C303', ten: 'Bùi Văn Huy', dien_tich: 80, ngay: '2019-12-05' },
      { ma: 'D401', ten: 'Tô Thị Ích', dien_tich: 110, ngay: '2020-09-30' },
    ];

    let insertedHoCount = 0;
    let insertedNhanKhau = 0;
    let insertedXe = 0;
    let insertedPhieu = 0;

    for (const ho of hoGiaDinhSamples) {
      // Insert HoGiaDinh (ignore duplicate by catching error)
      let hoId;
      try {
        const [res] = await pool.query(
          'INSERT INTO HoGiaDinh (ma_can_ho, ten_chu_ho, dien_tich, ngay_chuyen_den) VALUES (?, ?, ?, ?)',
          [ho.ma, ho.ten, ho.dien_tich, ho.ngay]
        );
        hoId = res.insertId;
        insertedHoCount++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          const [rows] = await pool.query('SELECT id FROM HoGiaDinh WHERE ma_can_ho = ?', [ho.ma]);
          hoId = rows[0].id;
        } else {
          throw err;
        }
      }

      // Insert 2 residents
      const residents = [
        `${ho.ten.split(' ')[0]} Nam`,
        `${ho.ten.split(' ')[0]} Nữ`,
      ];

      for (const name of residents) {
        try {
          const [r] = await pool.query(
            'INSERT INTO NhanKhau (id_ho_gia_dinh, ho_ten, loai_cu_tru) VALUES (?, ?, 1)',
            [hoId, name]
          );
          insertedNhanKhau++;
        } catch (err) {
          // ignore duplicates or continue
        }
      }

      // Insert one vehicle
      try {
        const [vx] = await pool.query(
          'INSERT INTO XeCo (id_ho_gia_dinh, bien_so, loai_xe, ngay_dang_ky, trang_thai) VALUES (?, ?, ?, ?, 1)',
          [hoId, `30A-${Math.floor(Math.random() * 9000) + 1000}`, 'Xe máy', new Date().toISOString().slice(0, 10)]
        );
        insertedXe++;
      } catch (err) {
        // ignore
      }

      // Insert one receipt
      try {
        const [p] = await pool.query(
          'INSERT INTO PhieuThu (id_ho_gia_dinh, id_khoan_thu, ky_thanh_toan, so_tien_phai_thu, so_tien_da_thu, trang_thai) VALUES (?, ?, ?, ?, 0, 0)',
          [hoId, 1, 'Tháng 12', Math.floor(Math.random() * 1000) + 100]
        );
        insertedPhieu++;
      } catch (err) {
        // ignore
      }
    }

    console.log(`Done. HoGiaDinh inserted: ${insertedHoCount}, NhanKhau: ${insertedNhanKhau}, XeCo: ${insertedXe}, PhieuThu: ${insertedPhieu}`);
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('Seed error:', e.message);
    process.exit(1);
  }
})();
