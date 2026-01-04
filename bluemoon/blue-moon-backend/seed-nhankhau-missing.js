const pool = require('./db');

function randomDOB(minAge = 3, maxAge = 80) {
  const now = new Date();
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
  const year = now.getFullYear() - age;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

(async () => {
  try {
    console.log('Seeding missing ngay_sinh/quan_he for NhanKhau...');
    const [rows] = await pool.query('SELECT id, ho_ten, ngay_sinh, quan_he FROM NhanKhau WHERE ngay_sinh IS NULL OR quan_he IS NULL');
    console.log(`Found ${rows.length} records missing data`);
    for (const r of rows) {
      const quan_he = r.quan_he || 'Con';
      const ngay_sinh = r.ngay_sinh || randomDOB();
      await pool.query('UPDATE NhanKhau SET ngay_sinh = ?, quan_he = ? WHERE id = ?', [ngay_sinh, quan_he, r.id]);
      console.log(`Updated ${r.ho_ten}: quan_he=${quan_he}, ngay_sinh=${ngay_sinh}`);
    }
    console.log('✅ Done');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
