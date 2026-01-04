// seed-billing-monthly.js - Tạo hóa đơn/phiếu thu cho một hoặc nhiều tháng
const pool = require('./db');

async function seedBillingForMonth(month) {
    console.log(`\n📅 Đang tạo hóa đơn cho tháng ${month}...`);

    try {
        // Get all households
        const [households] = await pool.query('SELECT id, ma_can_ho, ten_chu_ho FROM HoGiaDinh ORDER BY id');
        console.log(`✓ Tìm thấy ${households.length} hộ gia đình`);

        // Get billing categories
        const [categories] = await pool.query('SELECT id, ten, tien_co_dinh FROM KhoanThu ORDER BY id');
        if (categories.length === 0) {
            console.log('❌ Chưa có khoản thu nào. Chạy seed-khoanthu.js trước!');
            return 0;
        }
        console.log(`✓ Tìm thấy ${categories.length} khoản thu`);

        let insertedCount = 0;

        // For each household, create phiếu thu for each category
        for (const household of households) {
            // Get vehicle info for parking fee calculation
            const [[vehicleInfo]] = await pool.query(`
                SELECT 
                    COUNT(CASE WHEN loai_xe = 'Xe máy' THEN 1 END) as motorbikes,
                    COUNT(CASE WHEN loai_xe = 'Ô tô' THEN 1 END) as cars
                FROM XeCo 
                WHERE id_ho_gia_dinh = ? AND trang_thai = 1
            `, [household.id]);

            const motorbikes = vehicleInfo?.motorbikes || 0;
            const cars = vehicleInfo?.cars || 0;
            const parking_fee = motorbikes * 50000 + cars * 150000;

            for (const category of categories) {
                // Check if already exists
                const [existing] = await pool.query(
                    'SELECT id FROM PhieuThu WHERE id_ho_gia_dinh = ? AND id_khoan_thu = ? AND ky_thanh_toan = ?',
                    [household.id, category.id, month]
                );

                if (existing.length === 0) {
                    // Calculate amount with variation
                    let so_tien_phai_thu = (category.tien_co_dinh || 0) + (category.id === 1 ? parking_fee : 0);
                    const variation = Math.floor(Math.random() * 101000) - 50000; // ±50000
                    so_tien_phai_thu = Math.max(so_tien_phai_thu + variation, 0);

                    // Random status: 70% paid, 20% unpaid, 10% overdue
                    const rand = Math.random();
                    let trang_thai = 0;
                    let so_tien_da_thu = 0;
                    let ngay_thu = null;

                    if (rand < 0.7) {
                        trang_thai = 1; // Đã thanh toán (Paid)
                        so_tien_da_thu = so_tien_phai_thu;
                        const [y, m] = month.split('-');
                        ngay_thu = `${y}-${m}-${Math.floor(Math.random() * 28) + 1}`;
                    } else if (rand < 0.9) {
                        trang_thai = 0; // Chưa thanh toán (Unpaid)
                        so_tien_da_thu = 0;
                    } else {
                        trang_thai = 2; // Nợ/Quá hạn (Overdue)
                        so_tien_da_thu = Math.floor(so_tien_phai_thu * 0.5);
                    }

                    await pool.query(
                        'INSERT INTO PhieuThu (id_ho_gia_dinh, id_khoan_thu, ky_thanh_toan, so_tien_phai_thu, so_tien_da_thu, trang_thai, ngay_thu) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [household.id, category.id, month, so_tien_phai_thu, so_tien_da_thu, trang_thai, ngay_thu]
                    );
                    insertedCount++;
                }
            }
        }

        console.log(`✅ Tạo ${insertedCount} phiếu thu cho tháng ${month}`);
        return insertedCount;
    } catch (error) {
        console.error(`❌ Lỗi tạo hóa đơn tháng ${month}:`, error.message);
        return 0;
    }
}

async function main() {
    try {
        console.log('🔄 Bắt đầu seeding hóa đơn hàng tháng...');

        // Tạo hóa đơn cho 12 tháng năm 2025
        const months = [];
        for (let m = 1; m <= 12; m++) {
            months.push(`2025-${String(m).padStart(2, '0')}`);
        }

        let totalCount = 0;
        for (const month of months) {
            const count = await seedBillingForMonth(month);
            totalCount += count;
        }

        console.log(`\n✅ Hoàn thành! Tạo tổng cộng ${totalCount} phiếu thu cho 12 tháng`);
        console.log(`📊 Chi tiết:`);
        console.log(`   • Năm: 2025`);
        console.log(`   • Tháng: 1-12 (mỗi tháng)`);
        console.log(`   • Trạng thái: 70% đã thanh toán, 20% chưa thanh toán, 10% quá hạn`);
        console.log(`   • Số tiền: ±50,000 từ giá cơ bản`);

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
