const pool = require('./db');

async function run() {
  try {
    console.log('=== TẠO DỮ LIỆU SEED CHO CHIẾN DỊCH QUYÊN GÓP ===\n');

    // 1. Xóa dữ liệu cũ
    console.log('1. Xóa dữ liệu cũ...');
    await pool.query('DELETE FROM QuyenGopTransaction');
    await pool.query('DELETE FROM QuyenGopCampaign');
    console.log('✓ Đã xóa dữ liệu cũ\n');

    // 2. Tạo các chiến dịch
    console.log('2. Tạo các chiến dịch quyên góp...');
    const campaigns = [
      {
        ten: 'Quỹ Cộng đồng 2025',
        mo_ta: 'Quỹ cộng đồng hỗ trợ các hoạt động xây dựng sân vận động, sân chơi trẻ em và các công trình công cộng',
        muc_tieu: 500000000,
        ngay_bat_dau: '2025-01-01',
        ngay_ket_thuc: '2025-03-31',
        trang_thai: 'dang_dien_ra'
      },
      {
        ten: 'Quỹ Từ thiện Tết 2025',
        mo_ta: 'Chương trình từ thiện dành cho các hộ gia đình khó khăn trong khu vực nhân dịp Tết Nguyên Đán',
        muc_tieu: 300000000,
        ngay_bat_dau: '2024-12-15',
        ngay_ket_thuc: '2025-02-15',
        trang_thai: 'ket_thuc'
      },
      {
        ten: 'Quỹ Xanh - Bảo vệ Môi trường',
        mo_ta: 'Quỹ xanh để phủ xanh cây cối, giảm đô thị hóa và cải thiện không khí tại khu vực',
        muc_tieu: 250000000,
        ngay_bat_dau: '2025-02-01',
        ngay_ket_thuc: '2025-04-30',
        trang_thai: 'dang_dien_ra'
      },
      {
        ten: 'Quỹ Giáo dục - Hỗ trợ học sinh',
        mo_ta: 'Hỗ trợ học bổng cho học sinh có hoàn cảnh khó khăn và các chương trình nâng cao chất lượng giáo dục',
        muc_tieu: 400000000,
        ngay_bat_dau: '2025-01-15',
        ngay_ket_thuc: '2025-05-31',
        trang_thai: 'dang_dien_ra'
      },
      {
        ten: 'Quỹ Y tế Cộng đồng',
        mo_ta: 'Chương trình khám bệnh miễn phí, cấp phát thuốc và hỗ trợ y tế cho cư dân trong khu vực',
        muc_tieu: 350000000,
        ngay_bat_dau: '2025-03-01',
        ngay_ket_thuc: '2025-06-30',
        trang_thai: 'dang_dien_ra'
      }
    ];

    const [campaignResults] = await pool.query(
      `INSERT INTO QuyenGopCampaign (ten, mo_ta, muc_tieu, ngay_bat_dau, ngay_ket_thuc, trang_thai)
       VALUES ?`,
      [campaigns.map(c => [c.ten, c.mo_ta, c.muc_tieu, c.ngay_bat_dau, c.ngay_ket_thuc, c.trang_thai])]
    );

    console.log(`✓ Tạo ${campaignResults.affectedRows} chiến dịch thành công\n`);

    // 3. Lấy danh sách hộ gia đình
    console.log('3. Lấy danh sách hộ gia đình...');
    const [hoGiaDinhs] = await pool.query(
      'SELECT id, ma_can_ho, ten_chu_ho FROM HoGiaDinh ORDER BY id'
    );
    console.log(`✓ Tìm thấy ${hoGiaDinhs.length} hộ gia đình\n`);

    if (hoGiaDinhs.length === 0) {
      console.log('⚠️ Chưa có hộ gia đình trong hệ thống. Vui lòng tạo hộ gia đình trước.');
      await pool.end();
      process.exit(0);
    }

    // 4. Tạo ghi nhận quyên góp
    console.log('4. Tạo ghi nhận quyên góp cho từng chiến dịch...');

    const ghi_chu_options = [
      'Xin hãy nhận sự đóng góp nhỏ này của gia đình chúng tôi',
      'Mong chiến dịch thành công và giúp được nhiều người',
      'Cộng đóng góp từ các thành viên trong gia đình',
      'Góp chút công sức cho cộng đồng thân yêu',
      'Chúc chiến dịch đạt được mục tiêu cao',
      'Hân hạnh được tham gia vào chiến dịch này',
      'Ủng hộ hết lòng cho chương trình cộng đồng',
      null
    ];

    const allTransactions = [];
    let totalTransactions = 0;
    const campaignTotals = {};

    // Lấy ID của các chiến dịch vừa tạo
    const [createdCampaigns] = await pool.query(
      'SELECT id, ten, muc_tieu FROM QuyenGopCampaign ORDER BY id DESC LIMIT ?',
      [campaigns.length]
    );

    for (const campaign of createdCampaigns) {
      campaignTotals[campaign.id] = 0;
      console.log(`   - ${campaign.ten}`);

      // Mỗi chiến dịch: 20-30 hộ quyên góp với số tiền từ 50k-1 triệu VND
      const numDonors = Math.floor(Math.random() * 11) + 20; // 20-30 hộ

      for (let i = 0; i < numDonors; i++) {
        const randomHo = hoGiaDinhs[Math.floor(Math.random() * hoGiaDinhs.length)];

        // Tạo số tiền ngẫu nhiên: 50k, 100k, 200k, 300k, 500k, 1 triệu
        const amounts = [50000, 100000, 200000, 300000, 500000, 1000000];
        const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];

        const ghi_chu = ghi_chu_options[Math.floor(Math.random() * ghi_chu_options.length)];

        // Random ngày quyên góp trong khoảng thời gian chiến dịch
        const startDate = new Date(campaign.ngay_bat_dau || '2025-01-01');
        const endDate = new Date(campaign.ngay_ket_thuc || '2025-03-31');
        const randomDate = new Date(
          startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
        );

        allTransactions.push([
          campaign.id,
          randomHo.id,
          randomAmount,
          ghi_chu,
          randomDate.toISOString().split('T')[0],
          'hoan_tat'
        ]);

        campaignTotals[campaign.id] += randomAmount;
        totalTransactions++;
      }

      console.log(`     → ${numDonors} hộ quyên góp, tổng: ${campaignTotals[campaign.id].toLocaleString('vi-VN')} đ`);
    }

    // Insert tất cả transactions
    if (allTransactions.length > 0) {
      await pool.query(
        `INSERT INTO QuyenGopTransaction (id_campaign, id_ho_gia_dinh, so_tien, ghi_chu, ngay_quyen_gop, trang_thai)
         VALUES ?`,
        [allTransactions]
      );
    }

    console.log(`\n✓ Tạo xong ${totalTransactions} ghi nhận quyên góp\n`);

    // 5. Cập nhật tổng tiền cho từng chiến dịch
    console.log('5. Cập nhật tổng tiền quyên góp cho từng chiến dịch...');
    for (const [campaignId, total] of Object.entries(campaignTotals)) {
      await pool.query(
        'UPDATE QuyenGopCampaign SET so_tien_dat_duoc = ? WHERE id = ?',
        [total, campaignId]
      );
    }
    console.log('✓ Đã cập nhật tổng tiền\n');

    // 6. Hiển thị thống kê
    console.log('=== THỐNG KÊ CHI TIẾT ===\n');
    const [stats] = await pool.query(`
      SELECT 
        c.id,
        c.ten,
        c.muc_tieu,
        c.so_tien_dat_duoc,
        c.trang_thai,
        c.ngay_bat_dau,
        c.ngay_ket_thuc,
        COUNT(qt.id) as so_luong_quyengop,
        ROUND((c.so_tien_dat_duoc / c.muc_tieu * 100), 2) as phan_tram_dat_duoc
      FROM QuyenGopCampaign c
      LEFT JOIN QuyenGopTransaction qt ON c.id = qt.id_campaign
      GROUP BY c.id
      ORDER BY c.ngay_bat_dau DESC
    `);

    let totalGoal = 0;
    let totalCollected = 0;

    stats.forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.ten}`);
      console.log(`   Mục tiêu: ${s.muc_tieu.toLocaleString('vi-VN')} đ`);
      console.log(`   Đã quyên góp: ${s.so_tien_dat_duoc.toLocaleString('vi-VN')} đ`);
      console.log(`   Tiến độ: ${s.phan_tram_dat_duoc || 0}%`);
      console.log(`   Số lượng quyên góp: ${s.so_luong_quyengop}`);
      console.log(`   Trạng thái: ${s.trang_thai}`);
      console.log(`   Từ ${s.ngay_bat_dau} đến ${s.ngay_ket_thuc}\n`);

      totalGoal += s.muc_tieu;
      totalCollected += s.so_tien_dat_duoc;
    });

    console.log('=== TỔNG HỢP ===');
    console.log(`Tổng mục tiêu: ${totalGoal.toLocaleString('vi-VN')} đ`);
    console.log(`Tổng đã quyên góp: ${totalCollected.toLocaleString('vi-VN')} đ`);
    console.log(`Tiến độ chung: ${((totalCollected / totalGoal) * 100).toFixed(2)}%`);

    console.log('\n✅ Hoàn thành tạo dữ liệu seed cho chiến dịch quyên góp!');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    await pool.end();
    process.exit(1);
  }
}

run();
