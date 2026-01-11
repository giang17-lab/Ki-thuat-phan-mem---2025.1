const pool = require('./db');

async function run() {
  try {
    console.log('=== TẠO DỮ LIỆU SEED CHO CHIẾN DỊCH QUYÊN GÓP ===\n');

    // 1. Lấy danh sách chiến dịch hiện có
    console.log('1. Lấy danh sách chiến dịch...');
    const [campaigns] = await pool.query('SELECT id, ten FROM QuyenGopCampaign');
    console.log(`Tìm thấy ${campaigns.length} chiến dịch\n`);
    campaigns.forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.ten} (ID: ${c.id})`);
    });

    // 2. Lấy danh sách hộ gia đình
    console.log('\n2. Lấy danh sách hộ gia đình...');
    const [hoGiaDinhs] = await pool.query('SELECT id, ma_can_ho FROM HoGiaDinh ORDER BY id');
    console.log(`Tìm thấy ${hoGiaDinhs.length} hộ gia đình\n`);

    // 3. Xóa ghi nhận quyên góp cũ
    console.log('3. Xóa ghi nhận quyên góp cũ...');
    await pool.query('DELETE FROM QuyenGopTransaction');
    await pool.query('UPDATE QuyenGopCampaign SET so_tien_dat_duoc = 0');
    console.log('✓ Đã xóa dữ liệu cũ\n');

    // 4. Tạo ghi nhận quyên góp
    console.log('4. Tạo ghi nhận quyên góp...');
    let totalTransactions = 0;
    const campaignTotals = {};

    for (const campaign of campaigns) {
      campaignTotals[campaign.id] = 0;
      
      // Mỗi chiến dịch: 15-20 hộ quyên góp, số tiền từ 50k-500k
      const numDonors = Math.floor(Math.random() * 6) + 15; // 15-20
      
      for (let i = 0; i < numDonors; i++) {
        const randomHo = hoGiaDinhs[Math.floor(Math.random() * hoGiaDinhs.length)];
        const amounts = [50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000];
        const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
        
        const ghi_chu_options = [
          null,
          `Quyên góp từ gia đình ${randomHo.ma_can_ho}`,
          'Góp chút công sức cho cộng đồng',
          'Mong chiến dịch thành công',
          'Cộng đóng góp gia đình'
        ];
        
        const ghi_chu = ghi_chu_options[Math.floor(Math.random() * ghi_chu_options.length)];
        
        await pool.query(
          `INSERT INTO QuyenGopTransaction (id_campaign, id_ho_gia_dinh, so_tien, ghi_chu)
           VALUES (?, ?, ?, ?)`,
          [campaign.id, randomHo.id, randomAmount, ghi_chu]
        );
        
        campaignTotals[campaign.id] += randomAmount;
        totalTransactions++;
      }
    }

    console.log(`✓ Tạo xong ${totalTransactions} ghi nhận quyên góp\n`);

    // 5. Cập nhật tổng tiền cho từng chiến dịch
    console.log('5. Cập nhật tổng tiền quyên góp cho chiến dịch...');
    for (const [campaignId, total] of Object.entries(campaignTotals)) {
      await pool.query(
        'UPDATE QuyenGopCampaign SET so_tien_dat_duoc = ? WHERE id = ?',
        [total, campaignId]
      );
    }
    console.log('✓ Đã cập nhật tổng tiền\n');

    // 6. Hiển thị thống kê
    console.log('=== THỐNG KÊ ===');
    const [stats] = await pool.query(`
      SELECT 
        c.id,
        c.ten,
        c.muc_tieu,
        c.so_tien_dat_duoc,
        COUNT(qt.id) as so_luong_nguoi_quyen_gop,
        ROUND((c.so_tien_dat_duoc / c.muc_tieu) * 100) as percent
      FROM QuyenGopCampaign c
      LEFT JOIN QuyenGopTransaction qt ON qt.id_campaign = c.id
      GROUP BY c.id
      ORDER BY c.id
    `);

    stats.forEach((row, idx) => {
      console.log(`\n${idx + 1}. ${row.ten}`);
      console.log(`   Mục tiêu: ${Number(row.muc_tieu).toLocaleString('vi-VN')} đ`);
      console.log(`   Đã quyên: ${Number(row.so_tien_dat_duoc).toLocaleString('vi-VN')} đ`);
      console.log(`   Tiến độ: ${row.percent}%`);
      console.log(`   Số người quyên góp: ${row.so_luong_nguoi_quyen_gop}`);
    });

    console.log('\n✓ Hoàn thành tạo seed data!');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi:', err.message);
    process.exit(1);
  }
}

run();
