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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDOB(minAge = 3, maxAge = 80) {
  const now = new Date();
  const age = randomInt(minAge, maxAge);
  const year = now.getFullYear() - age;
  const month = String(randomInt(1,12)).padStart(2,'0');
  const day = String(randomInt(1,28)).padStart(2,'0');
  return `${year}-${month}-${day}`;
}

function randomPhone() {
  const prefix = Math.random() < 0.5 ? '09' : '03';
  const suffix = Array(8).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
  return prefix + suffix;
}

function randomCCCD() {
  return Array(12).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
}

(async () => {
  try {
    const env = await readEnv();
    const pool = await mysql.createPool({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
      port: env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
    });

    // Ensure NhanKhau has quan_he column
    try {
      await pool.query("ALTER TABLE NhanKhau ADD COLUMN quan_he VARCHAR(50) NULL");
      console.log('Added column quan_he to NhanKhau');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        throw err;
      }
    }

    console.log('⚠️  This will DELETE existing HoGiaDinh/NhanKhau/XeCo/PhieuThu data and recreate seeds.');
    // Confirm via env flag to be safe
    if (process.env.CONFIRM_SEED !== 'yes') {
      console.log("To actually run this script, set environment variable CONFIRM_SEED=yes and re-run. Aborting.");
      process.exit(0);
    }

    console.log('Cleaning tables...');
    await pool.query('DELETE FROM PhieuThu');
    await pool.query('DELETE FROM XeCo');
    await pool.query('DELETE FROM NhanKhau');
    await pool.query('DELETE FROM HoGiaDinh');

    const familyNames = ['Nguyễn','Trần','Lê','Phạm','Hoàng','Vũ','Đặng','Bùi','Đỗ','Phan','Võ','Dương','Lý','Cao','Ngô','Tô'];
    const maleGiven = ['Anh','Bình','Cường','Dũng','Huy','Khánh','Minh','Quân','Sơn','Tiến','Tuấn','Vinh','Giang','Hùng','Long'];
    const femaleGiven = ['Bình','Dung','Hạnh','Hương','Linh','Lệ','Nga','Ngọc','Phương','Thảo','Thu','Trang','Uyên','Ý','Mai'];
    const relations = ['Chủ hộ','Vợ/Chồng','Con','Cha/Mẹ','Anh/Chị/Em'];

    const totalHouseholds = 30;
    let hoCount = 0, nkCount = 0, xeCount = 0, phieuCount = 0;

    for (let i=1;i<=totalHouseholds;i++){
      const block = String.fromCharCode(64 + Math.floor((i-1)/10) + 1); // A,B,C...
      const unit = (100 + i).toString();
      const ma = `${block}${unit}`;

      const family = familyNames[randomInt(0,familyNames.length-1)];
      const isMale = Math.random() < 0.5;
      const given = isMale ? maleGiven[randomInt(0,maleGiven.length-1)] : femaleGiven[randomInt(0,femaleGiven.length-1)];
      const ten_chu_ho = `${family} ${given}`;

      const dien_tich = (randomInt(40,130) + Math.floor(Math.random()*10)/10).toFixed(1);
      const ngay = `${2018 + randomInt(0,7)}-${String(randomInt(1,12)).padStart(2,'0')}-${String(randomInt(1,28)).padStart(2,'0')}`;

      const [res] = await pool.query(
        'INSERT INTO HoGiaDinh (ma_can_ho, ten_chu_ho, dien_tich, ngay_chuyen_den, cccd, sdt) VALUES (?, ?, ?, ?, ?, ?)',
        [ma, ten_chu_ho, dien_tich, ngay, randomCCCD(), randomPhone()]
      );
      const hoId = res.insertId;
      hoCount++;

      // residents: 1-6 (include chủ hộ with relation), diverse relations
      const residentCount = randomInt(1,6);
      for (let r=0;r<residentCount;r++){
        const isHead = r === 0;
        const fullname = isHead
          ? ten_chu_ho
          : `${familyNames[randomInt(0,familyNames.length-1)]} ${(Math.random()<0.5)?maleGiven[randomInt(0,maleGiven.length-1)]:femaleGiven[randomInt(0,femaleGiven.length-1)]}`;

        let relation;
        if (isHead) {
          relation = 'Chủ hộ';
        } else {
          const nonHeadRelations = ['Vợ/Chồng','Con','Cha/Mẹ','Anh/Chị/Em'];
          relation = nonHeadRelations[randomInt(0, nonHeadRelations.length-1)];
        }

        const dob = randomDOB(3, 80);
        await pool.query(
          'INSERT INTO NhanKhau (id_ho_gia_dinh, ho_ten, ngay_sinh, quan_he, loai_cu_tru) VALUES (?, ?, ?, ?, 1)',
          [hoId, fullname, dob, relation]
        );
        nkCount++;
      }

      // vehicles: 0-6
      const vehCount = randomInt(0,6);
      for (let v=0; v<vehCount; v++){
        const isCar = Math.random() < 0.25; // 25% chance car
        const loai = isCar ? 'Ô tô' : 'Xe máy';
        const plate = `${randomInt(10,99)}A-${randomInt(100,999)}${randomInt(0,9)}`;
        await pool.query('INSERT INTO XeCo (id_ho_gia_dinh, bien_so, loai_xe, ngay_dang_ky, trang_thai) VALUES (?, ?, ?, ?, 1)', [hoId, plate, loai, new Date().toISOString().slice(0,10)]);
        xeCount++;
      }

      // PhieuThu: create 1-3 receipts across recent months with varied paid amounts
      const receiptCount = randomInt(1,3);
      const now = new Date();
      for (let p=0; p<receiptCount; p++) {
        const dt = new Date(now.getFullYear(), now.getMonth() - p, 1);
        const month = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
        const amount = randomInt(200000,1500000);
        const paid = Math.random() < 0.6 ? amount : randomInt(0, amount);
        // status: 0 = unpaid, 1 = paid, 2 = partial
        const status = paid >= amount ? 1 : (paid === 0 ? 0 : 2);
        await pool.query(
          'INSERT INTO PhieuThu (id_ho_gia_dinh, id_khoan_thu, ky_thanh_toan, so_tien_phai_thu, so_tien_da_thu, trang_thai) VALUES (?, ?, ?, ?, ?, ?)',
          [hoId, 1, month, amount, paid, status]
        );
        phieuCount++;
      }
    }

    console.log(`Seed complete. HoGiaDinh: ${hoCount}, NhanKhau: ${nkCount}, XeCo: ${xeCount}, PhieuThu: ${phieuCount}`);
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('Seed error:', e.message);
    process.exit(1);
  }
})();
