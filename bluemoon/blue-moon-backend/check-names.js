const pool = require('./db');

(async () => {
  try {
    const [countRows] = await pool.query('SELECT COUNT(*) AS cnt FROM NhanKhau WHERE ho_ten REGEXP " [0-9]+$"');
    console.log(`So nhan khau co so cuoi ten: ${countRows[0].cnt}`);
    const [sample] = await pool.query('SELECT id, id_ho_gia_dinh, ho_ten FROM NhanKhau WHERE ho_ten REGEXP " [0-9]+$" LIMIT 10');
    console.table(sample);
    process.exit(0);
  } catch (e) {
    console.error('Loi:', e.message);
    process.exit(1);
  }
})();
