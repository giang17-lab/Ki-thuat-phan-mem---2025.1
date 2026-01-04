const fs = require('fs');
const mysql = require('mysql2/promise');

function readEnv() {
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
    const env = readEnv();
    const pool = await mysql.createPool({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
      port: env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 5,
    });

    const out = {};

    const [[{count:hoCount}]] = await pool.query('SELECT COUNT(*) as count FROM HoGiaDinh');
    out.hoGiaDinh_count = hoCount;
    const [hos] = await pool.query('SELECT id, ma_can_ho, ten_chu_ho, dien_tich, ngay_chuyen_den FROM HoGiaDinh ORDER BY id LIMIT 8');
    out.hoGiaDinh_samples = hos;

    const [[{count:nkCount}]] = await pool.query('SELECT COUNT(*) as count FROM NhanKhau');
    out.nhanKhau_count = nkCount;
    const [nks] = await pool.query('SELECT id, id_ho_gia_dinh, ho_ten, ngay_sinh, cccd FROM NhanKhau ORDER BY id LIMIT 8');
    out.nhanKhau_samples = nks;

    const [[{count:xeCount}]] = await pool.query('SELECT COUNT(*) as count FROM XeCo');
    out.xeCo_count = xeCount;
    const [xes] = await pool.query('SELECT id, id_ho_gia_dinh, bien_so, loai_xe FROM XeCo ORDER BY id LIMIT 8');
    out.xeCo_samples = xes;

    const [[{count:phCount}]] = await pool.query('SELECT COUNT(*) as count FROM PhieuThu');
    out.phieuThu_count = phCount;
    const [phs] = await pool.query(`SELECT p.id, p.id_ho_gia_dinh, p.id_khoan_thu, p.ky_thanh_toan, p.so_tien_phai_thu, p.so_tien_da_thu, h.ma_can_ho, h.ten_chu_ho FROM PhieuThu p JOIN HoGiaDinh h ON p.id_ho_gia_dinh = h.id ORDER BY p.id DESC LIMIT 8`);
    out.phieuThu_samples = phs;

    console.log(JSON.stringify(out, null, 2));

    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('Error querying DB:', e.message);
    process.exit(1);
  }
})();
