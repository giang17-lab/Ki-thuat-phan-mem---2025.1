const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Utility functions
const isValidId = (id) => !isNaN(id) && id > 0;
const isValidString = (str) => typeof str === 'string' && str.trim().length > 0;
const sanitizeInput = (str) => isValidString(str) ? str.trim() : null;
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ========== ADMIN: QUẢN LÝ CHIẾN DỊCH ==========

// Lấy danh sách tất cả chiến dịch (Admin)
router.get('/admin/campaigns', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    const [campaigns] = await pool.query(`
        SELECT id, ten, mo_ta, muc_tieu, so_tien_dat_duoc, ngay_bat_dau, ngay_ket_thuc, trang_thai
        FROM QuyenGopCampaign
        ORDER BY ngay_bat_dau DESC
    `);
    res.json({ message: 'Lấy danh sách chiến dịch thành công', data: campaigns, count: campaigns.length });
}));

// Tạo chiến dịch mới (Admin)
router.post('/admin/campaigns', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    const { ten, mo_ta, muc_tieu, ngay_bat_dau, ngay_ket_thuc } = req.body;

    if (!isValidString(ten)) return res.status(400).json({ message: 'ten là bắt buộc' });
    if (!ngay_bat_dau || !ngay_ket_thuc) return res.status(400).json({ message: 'Ngày bắt đầu và kết thúc là bắt buộc' });
    if (new Date(ngay_bat_dau) >= new Date(ngay_ket_thuc)) {
        return res.status(400).json({ message: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }

    const [result] = await pool.query(
        `INSERT INTO QuyenGopCampaign (ten, mo_ta, muc_tieu, ngay_bat_dau, ngay_ket_thuc)
         VALUES (?, ?, ?, ?, ?)`,
        [sanitizeInput(ten), sanitizeInput(mo_ta) || null, Number(muc_tieu) || 0, ngay_bat_dau, ngay_ket_thuc]
    );

    res.status(201).json({ message: 'Tạo chiến dịch thành công', data: { id: result.insertId } });
}));

// Cập nhật chiến dịch (Admin)
router.put('/admin/campaigns/:id', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });

    const fields = [], values = [];
    if (req.body.ten !== undefined) { fields.push('ten = ?'); values.push(sanitizeInput(req.body.ten)); }
    if (req.body.mo_ta !== undefined) { fields.push('mo_ta = ?'); values.push(sanitizeInput(req.body.mo_ta)); }
    if (req.body.muc_tieu !== undefined) { fields.push('muc_tieu = ?'); values.push(Number(req.body.muc_tieu)); }
    if (req.body.trang_thai !== undefined) { fields.push('trang_thai = ?'); values.push(req.body.trang_thai); }
    if (!fields.length) return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });

    values.push(req.params.id);
    const [result] = await pool.query(`UPDATE QuyenGopCampaign SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Chiến dịch không tìm thấy' });

    res.json({ message: 'Cập nhật chiến dịch thành công' });
}));

// Xóa chiến dịch (Admin)
router.delete('/admin/campaigns/:id', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });

    const [result] = await pool.query('DELETE FROM QuyenGopCampaign WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Chiến dịch không tìm thấy' });

    res.json({ message: 'Xóa chiến dịch thành công' });
}));

// ========== ADMIN: XEM CHI TIẾT NGƯỜI QUYÊN GÓP ==========

// Lấy danh sách người quyên góp của một chiến dịch (Admin)
router.get('/admin/campaigns/:id/donors', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });

    const [transactions] = await pool.query(`
        SELECT 
            qt.id,
            qt.id_ho_gia_dinh,
            h.ma_can_ho,
            h.ten_chu_ho,
            qt.so_tien,
            qt.ghi_chu,
            qt.ngay_quyen_gop,
            qt.trang_thai
        FROM QuyenGopTransaction qt
        JOIN HoGiaDinh h ON h.id = qt.id_ho_gia_dinh
        WHERE qt.id_campaign = ?
        ORDER BY qt.ngay_quyen_gop DESC
    `, [req.params.id]);

    const totalDonated = transactions.reduce((sum, t) => sum + (parseFloat(t.so_tien) || 0), 0);

    res.json({
        message: 'Lấy danh sách người quyên góp thành công',
        data: transactions,
        count: transactions.length,
        total: totalDonated
    });
}));

// ========== USER: QUYÊN GÓP ==========

// Lấy danh sách chiến dịch đang diễn ra (User)
router.get('/campaigns', asyncHandler(async (req, res) => {
    const [campaigns] = await pool.query(`
        SELECT id, ten, mo_ta, muc_tieu, so_tien_dat_duoc, ngay_bat_dau, ngay_ket_thuc, trang_thai
        FROM QuyenGopCampaign
        WHERE trang_thai = 'dang_dien_ra'
        ORDER BY ngay_bat_dau DESC
    `);

    // Tính phần trăm hoàn thành
    const campaignsWithPercent = campaigns.map(c => ({
        ...c,
        percent_done: c.muc_tieu > 0 ? Math.round((c.so_tien_dat_duoc / c.muc_tieu) * 100) : 0
    }));

    res.json({ message: 'Lấy danh sách chiến dịch thành công', data: campaignsWithPercent, count: campaigns.length });
}));

// User quyên góp cho chiến dịch
router.post('/campaigns/:id/donate', verifyToken, asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });

    const { so_tien, ghi_chu } = req.body;

    if (!so_tien || Number(so_tien) <= 0) return res.status(400).json({ message: 'Số tiền phải > 0' });

    // Lấy hộ gia đình của user hiện tại
    const [userHo] = await pool.query(
        'SELECT id FROM HoGiaDinh WHERE id_user = ?',
        [req.user.id]
    );

    if (!userHo.length) return res.status(404).json({ message: 'Không tìm thấy hộ gia đình của bạn' });

    // Kiểm tra chiến dịch tồn tại
    const [campaign] = await pool.query('SELECT * FROM QuyenGopCampaign WHERE id = ?', [req.params.id]);
    if (!campaign.length) return res.status(404).json({ message: 'Chiến dịch không tìm thấy' });

    // Tạo ghi nhận quyên góp
    const [result] = await pool.query(
        `INSERT INTO QuyenGopTransaction (id_campaign, id_ho_gia_dinh, so_tien, ghi_chu)
         VALUES (?, ?, ?, ?)`,
        [req.params.id, userHo[0].id, Number(so_tien), sanitizeInput(ghi_chu) || null]
    );

    // Cập nhật tổng tiền đã quyên góp
    await pool.query(
        'UPDATE QuyenGopCampaign SET so_tien_dat_duoc = so_tien_dat_duoc + ? WHERE id = ?',
        [Number(so_tien), req.params.id]
    );

    res.status(201).json({ message: 'Quyên góp thành công', data: { id: result.insertId, so_tien } });
}));

// Lấy lịch sử quyên góp của user
router.get('/my-donations', verifyToken, asyncHandler(async (req, res) => {
    const [userHo] = await pool.query(
        'SELECT id FROM HoGiaDinh WHERE id_user = ?',
        [req.user.id]
    );

    if (!userHo.length) return res.status(404).json({ message: 'Không tìm thấy hộ gia đình của bạn' });

    const [donations] = await pool.query(`
        SELECT 
            qt.id,
            qt.id_campaign,
            c.ten as campaign_name,
            qt.so_tien,
            qt.ghi_chu,
            qt.ngay_quyen_gop,
            qt.trang_thai
        FROM QuyenGopTransaction qt
        JOIN QuyenGopCampaign c ON c.id = qt.id_campaign
        WHERE qt.id_ho_gia_dinh = ?
        ORDER BY qt.ngay_quyen_gop DESC
    `, [userHo[0].id]);

    const totalDonated = donations.reduce((sum, d) => sum + (parseFloat(d.so_tien) || 0), 0);

    res.json({
        message: 'Lấy lịch sử quyên góp thành công',
        data: donations,
        count: donations.length,
        total: totalDonated
    });
}));

module.exports = router;
