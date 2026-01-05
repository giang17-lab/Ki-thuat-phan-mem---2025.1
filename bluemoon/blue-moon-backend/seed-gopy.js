const pool = require('./db');

async function seedGopY() {
  try {
    // Lấy danh sách user (không phải admin)
    const [users] = await pool.query("SELECT id, username FROM NguoiDung WHERE role = 'user' LIMIT 10");
    
    if (users.length === 0) {
      console.log('❌ Không có user nào trong database. Vui lòng tạo user trước.');
      process.exit(1);
    }

    // Dữ liệu góp ý mẫu
    const feedbackData = [
      {
        tieu_de: 'Đề xuất lắp thêm camera an ninh',
        noi_dung: 'Kính gửi Ban quản lý,\n\nTôi đề xuất lắp thêm camera an ninh ở khu vực sảnh tầng 1 và hành lang các tầng. Gần đây có một số vụ mất đồ nhỏ và việc lắp camera sẽ giúp đảm bảo an ninh tốt hơn cho cư dân.\n\nTrân trọng cảm ơn!',
        loai_gop_y: 'de_xuat',
        trang_thai: 'cho_xu_ly'
      },
      {
        tieu_de: 'Khiếu nại về tiếng ồn tầng 5',
        noi_dung: 'Tôi ở căn hộ 503, thường xuyên bị ảnh hưởng bởi tiếng ồn từ căn hộ tầng trên vào ban đêm (sau 22h). Đã nhắc nhở nhiều lần nhưng không có cải thiện.\n\nĐề nghị Ban quản lý can thiệp giải quyết.',
        loai_gop_y: 'khieu_nai',
        trang_thai: 'dang_xu_ly'
      },
      {
        tieu_de: 'Góp ý về dịch vụ vệ sinh',
        noi_dung: 'Dịch vụ vệ sinh hành lang và cầu thang bộ gần đây có phần chưa sạch sẽ. Mong Ban quản lý kiểm tra và nhắc nhở đội vệ sinh làm việc kỹ hơn.\n\nCảm ơn!',
        loai_gop_y: 'gop_y',
        trang_thai: 'da_phan_hoi',
        phan_hoi: 'Cảm ơn góp ý của bạn! Chúng tôi đã nhắc nhở đội vệ sinh và sẽ tăng cường kiểm tra chất lượng. Mọi phản ánh tiếp theo xin liên hệ hotline 0123.456.789.'
      },
      {
        tieu_de: 'Yêu cầu sửa chữa thang máy số 2',
        noi_dung: 'Thang máy số 2 tòa A thường xuyên bị kẹt và có tiếng kêu lạ khi di chuyển. Đề nghị Ban quản lý cho kiểm tra và sửa chữa sớm để đảm bảo an toàn.',
        loai_gop_y: 'yeu_cau',
        trang_thai: 'da_phan_hoi',
        phan_hoi: 'Đã tiếp nhận yêu cầu. Đội kỹ thuật sẽ kiểm tra và bảo trì thang máy vào ngày 06/01/2026. Trong thời gian này, xin cư dân sử dụng thang máy số 1. Xin lỗi vì sự bất tiện!'
      },
      {
        tieu_de: 'Đề xuất tổ chức họp cư dân định kỳ',
        noi_dung: 'Kính đề xuất Ban quản lý tổ chức họp cư dân định kỳ hàng quý để:\n- Thông báo các hoạt động chung\n- Lắng nghe ý kiến cư dân\n- Tăng cường gắn kết cộng đồng\n\nCó thể tổ chức vào Chủ nhật đầu tiên mỗi quý.',
        loai_gop_y: 'de_xuat',
        trang_thai: 'cho_xu_ly'
      },
      {
        tieu_de: 'Phản ánh về bãi đỗ xe',
        noi_dung: 'Bãi đỗ xe B1 thường xuyên bị ngập nước khi trời mưa. Việc này gây khó khăn cho việc đi lại và có thể ảnh hưởng đến xe của cư dân. Mong sớm được khắc phục.',
        loai_gop_y: 'khieu_nai',
        trang_thai: 'dang_xu_ly'
      },
      {
        tieu_de: 'Góp ý về phí quản lý',
        noi_dung: 'Đề nghị Ban quản lý công khai chi tiết các khoản chi từ phí quản lý hàng tháng để cư dân nắm được. Có thể đăng trên bảng tin hoặc app.',
        loai_gop_y: 'gop_y',
        trang_thai: 'da_dong'
      },
      {
        tieu_de: 'Yêu cầu cấp thẻ ra vào mới',
        noi_dung: 'Thẻ ra vào của tôi bị hỏng (không quẹt được). Xin được cấp thẻ mới.\n\nThông tin:\n- Căn hộ: 1205\n- Tên: Nguyễn Văn A\n- SĐT: 0901234567',
        loai_gop_y: 'yeu_cau',
        trang_thai: 'da_phan_hoi',
        phan_hoi: 'Đã tiếp nhận yêu cầu. Vui lòng đến phòng Ban quản lý (tầng 1) từ 8h-17h các ngày trong tuần để nhận thẻ mới. Phí làm thẻ: 50.000đ.'
      },
      {
        tieu_de: 'Phản ánh wifi khu vực sảnh yếu',
        noi_dung: 'Wifi miễn phí ở sảnh tầng 1 và khu vực hồ bơi rất yếu, thường xuyên mất kết nối. Mong Ban quản lý nâng cấp.',
        loai_gop_y: 'gop_y',
        trang_thai: 'cho_xu_ly'
      },
      {
        tieu_de: 'Đề xuất trồng thêm cây xanh',
        noi_dung: 'Khu vực sân chơi trẻ em thiếu bóng mát. Đề xuất trồng thêm một số cây xanh lớn để tạo bóng râm, giúp các cháu nhỏ có thể vui chơi thoải mái hơn vào mùa hè.',
        loai_gop_y: 'de_xuat',
        trang_thai: 'cho_xu_ly'
      }
    ];

    // Lấy admin để set cho phản hồi
    const [admins] = await pool.query("SELECT id FROM NguoiDung WHERE role = 'admin' LIMIT 1");
    const adminId = admins.length > 0 ? admins[0].id : null;

    console.log('🌱 Bắt đầu tạo dữ liệu góp ý mẫu...\n');

    for (let i = 0; i < feedbackData.length; i++) {
      const fb = feedbackData[i];
      const user = users[i % users.length]; // Xoay vòng user

      const [result] = await pool.query(
        `INSERT INTO GopY (user_id, tieu_de, noi_dung, loai_gop_y, trang_thai, phan_hoi, admin_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          fb.tieu_de,
          fb.noi_dung,
          fb.loai_gop_y,
          fb.trang_thai,
          fb.phan_hoi || null,
          fb.phan_hoi ? adminId : null
        ]
      );

      const statusEmoji = {
        'cho_xu_ly': '⏳',
        'dang_xu_ly': '🔄',
        'da_phan_hoi': '✅',
        'da_dong': '📁'
      };

      console.log(`${statusEmoji[fb.trang_thai]} [${fb.loai_gop_y}] ${fb.tieu_de.substring(0, 40)}... (by ${user.username})`);
    }

    console.log('\n✅ Đã tạo', feedbackData.length, 'góp ý mẫu thành công!');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
  
  process.exit();
}

seedGopY();
