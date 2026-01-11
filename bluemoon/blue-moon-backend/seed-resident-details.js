const pool = require('./db');

async function run() {
  try {
    console.log('=== THÊM DỮ LIỆU GIỚI TÍNH, CCCD, SĐT CHO CƯ DÂN ===\n');

    // 1. Lấy danh sách tất cả cư dân
    console.log('1. Lấy danh sách cư dân...');
    const [residents] = await pool.query(`
      SELECT id, ho_ten, quan_he 
      FROM NhanKhau 
      ORDER BY id
    `);
    console.log(`✓ Tìm thấy ${residents.length} cư dân\n`);

    // 2. Danh sách CCCD giả lập (định dạng hợp lệ)
    const cccdList = [
      '001234567890',
      '001234567891',
      '001234567892',
      '001234567893',
      '001234567894',
      '001234567895',
      '001234567896',
      '001234567897',
      '001234567898',
      '001234567899',
      '001234567900',
      '001234567901',
      '001234567902',
      '001234567903',
      '001234567904',
      '001234567905',
      '001234567906',
      '001234567907',
      '001234567908',
      '001234567909',
      '001234567910',
      '001234567911',
      '001234567912',
      '001234567913',
      '001234567914',
      '001234567915',
      '001234567916',
      '001234567917',
      '001234567918',
      '001234567919',
      '001234567920',
      '001234567921',
      '001234567922',
      '001234567923',
      '001234567924',
      '001234567925',
      '001234567926',
      '001234567927',
      '001234567928',
      '001234567929',
      '001234567930',
      '001234567931',
      '001234567932',
      '001234567933',
      '001234567934',
      '001234567935',
      '001234567936',
      '001234567937',
      '001234567938',
      '001234567939',
      '001234567940',
    ];

    // 3. Hàm tạo SĐT ngẫu nhiên
    const generatePhoneNumber = () => {
      const carriers = ['090', '091', '092', '093', '094', '095', '096', '097', '098', '099'];
      const carrier = carriers[Math.floor(Math.random() * carriers.length)];
      const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
      return carrier + number;
    };

    // 4. Cập nhật dữ liệu cư dân
    console.log('2. Cập nhật giới tính, CCCD, SĐT cho cư dân...\n');
    let updated = 0;

    for (let i = 0; i < residents.length; i++) {
      const resident = residents[i];
      
      // Giới tính: dựa vào tên và quan hệ
      let gioi_tinh = 'M'; // Mặc định nam
      if (resident.quan_he === 'Vợ' || resident.quan_he === 'Con gái' || resident.quan_he === 'Mẹ') {
        gioi_tinh = 'F'; // Nữ
      } else if (Math.random() > 0.65) {
        // 35% nữ cho những trường hợp khác
        gioi_tinh = 'F';
      }

      // CCCD
      const cccd = cccdList[i % cccdList.length];

      // SĐT - không phải tất cả đều có
      const sdt = Math.random() > 0.3 ? generatePhoneNumber() : null;

      // Cập nhật vào database
      await pool.query(
        `UPDATE NhanKhau 
         SET gioi_tinh = ?, cccd = ?, sdt = ? 
         WHERE id = ?`,
        [gioi_tinh, cccd, sdt, resident.id]
      );

      updated++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`   ✓ Đã cập nhật ${i + 1}/${residents.length} cư dân...`);
      }
    }

    console.log(`\n✓ Hoàn thành cập nhật ${updated} cư dân\n`);

    // 5. Hiển thị thống kê
    console.log('=== THỐNG KÊ ===\n');

    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN gioi_tinh = 'M' THEN 1 ELSE 0 END) as nam,
        SUM(CASE WHEN gioi_tinh = 'F' THEN 1 ELSE 0 END) as nu,
        SUM(CASE WHEN cccd IS NOT NULL THEN 1 ELSE 0 END) as co_cccd,
        SUM(CASE WHEN sdt IS NOT NULL THEN 1 ELSE 0 END) as co_sdt
      FROM NhanKhau
    `);

    const stat = stats[0];
    console.log(`Tổng cư dân: ${stat.total}`);
    console.log(`  👨 Nam: ${stat.nam} (${((stat.nam / stat.total) * 100).toFixed(1)}%)`);
    console.log(`  👩 Nữ: ${stat.nu} (${((stat.nu / stat.total) * 100).toFixed(1)}%)`);
    console.log(`  🆔 Có CCCD: ${stat.co_cccd} (${((stat.co_cccd / stat.total) * 100).toFixed(1)}%)`);
    console.log(`  📞 Có SĐT: ${stat.co_sdt} (${((stat.co_sdt / stat.total) * 100).toFixed(1)}%)\n`);

    // 6. Hiển thị mẫu dữ liệu
    console.log('=== MẪU DỮ LIỆU ===\n');
    const [samples] = await pool.query(`
      SELECT ho_ten, quan_he, gioi_tinh, cccd, sdt 
      FROM NhanKhau 
      LIMIT 10
    `);

    console.log('STT | Tên                  | Quan Hệ      | Giới Tính | CCCD           | SĐT');
    console.log('-'.repeat(100));
    samples.forEach((s, idx) => {
      const genderDisplay = s.gioi_tinh === 'M' ? '👨 Nam' : '👩 Nữ';
      const sdt = s.sdt || 'N/A';
      console.log(
        `${String(idx + 1).padEnd(3)} | ${s.ho_ten.padEnd(20)} | ${s.quan_he.padEnd(12)} | ${genderDisplay} | ${s.cccd || 'N/A'} | ${sdt}`
      );
    });

    console.log('\n✅ Hoàn thành thêm dữ liệu giới tính, CCCD, SĐT!');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    await pool.end();
    process.exit(1);
  }
}

run();
