// routes/requests.js - Xử lý yêu cầu thêm xe và nhân khẩu từ user
const express = require('express');
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Utility functions
const isValidId = (id) => !isNaN(id) && id > 0;
const isValidString = (str) => typeof str === 'string' && str.trim().length > 0;
const sanitizeInput = (str) => isValidString(str) ? str.trim() : null;
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ========== GET ALL PENDING REQUESTS (Admin only) ==========
router.get('/pending', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    try {
        // Lấy yêu cầu thêm xe
        const [vehicles] = await pool.query(
            `SELECT y.id, y.user_id, y.bien_so, y.loai_xe, y.trang_thai, y.created_at,
                u.username,
                u.ten_nguoi_dung,
                h.ma_can_ho,
                SUBSTRING(h.ma_can_ho, 2) AS so_phong,
                CONCAT(COALESCE(u.ten_nguoi_dung, u.username), ' ', COALESCE(h.ma_can_ho, ''), ' P', COALESCE(SUBSTRING(h.ma_can_ho, 2), '')) AS display_user
             FROM YeuCauThemXe y
             LEFT JOIN NguoiDung u ON u.id = y.user_id
             LEFT JOIN HoGiaDinh h ON h.id = y.ho_gia_dinh_id
             WHERE y.trang_thai = 'pending'
             ORDER BY y.created_at DESC`
        );

        // Lấy yêu cầu thêm nhân khẩu
        const [residents] = await pool.query(
            `SELECT y.id, y.user_id, y.ho_ten, y.quan_he, y.trang_thai, y.created_at,
                u.username,
                u.ten_nguoi_dung,
                h.ma_can_ho,
                SUBSTRING(h.ma_can_ho, 2) AS so_phong,
                CONCAT(COALESCE(u.ten_nguoi_dung, u.username), ' ', COALESCE(h.ma_can_ho, ''), ' P', COALESCE(SUBSTRING(h.ma_can_ho, 2), '')) AS display_user
             FROM YeuCauThemNhanKhau y
             LEFT JOIN NguoiDung u ON u.id = y.user_id
             LEFT JOIN HoGiaDinh h ON h.id = y.ho_gia_dinh_id
             WHERE y.trang_thai = 'pending'
             ORDER BY y.created_at DESC`
        );

        res.json({
            message: 'Danh sách yêu cầu chờ duyệt',
            data: {
                vehicles: vehicles.map(v => ({ ...v, type: 'vehicle' })),
                residents: residents.map(r => ({ ...r, type: 'resident' }))
            },
            count: vehicles.length + residents.length
        });
    } catch (error) {
        throw error;
    }
}));

// ========== CREATE REQUEST TO ADD VEHICLE ==========
router.post('/vehicle/request', verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { bien_so, loai_xe, ho_gia_dinh_id, mo_ta } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!isValidString(bien_so) || !isValidString(loai_xe)) {
        return res.status(400).json({ message: 'bien_so và loai_xe là bắt buộc' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO YeuCauThemXe (user_id, ho_gia_dinh_id, bien_so, loai_xe, mo_ta) VALUES (?, ?, ?, ?, ?)',
            [userId, ho_gia_dinh_id || null, sanitizeInput(bien_so), sanitizeInput(loai_xe), sanitizeInput(mo_ta) || null]
        );

        res.status(201).json({
            message: 'Yêu cầu thêm xe đã được gửi, chờ admin duyệt!',
            data: { id: result.insertId }
        });
    } catch (error) {
        throw error;
    }
}));

// ========== CREATE REQUEST TO ADD RESIDENT ==========
router.post('/resident/request', verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { ho_ten, quan_he, ho_gia_dinh_id, ngay_sinh, gioi_tinh, cccd, mo_ta } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!isValidString(ho_ten) || !isValidString(quan_he)) {
        return res.status(400).json({ message: 'ho_ten và quan_he là bắt buộc' });
    }

    try {
        // Kiểm tra nếu đang yêu cầu thêm quan hệ Vợ/Chồng
        const sanitizedQuanHe = sanitizeInput(quan_he);
        if (ho_gia_dinh_id && sanitizedQuanHe && 
            (sanitizedQuanHe.toLowerCase().includes('vợ') || sanitizedQuanHe.toLowerCase().includes('chồng'))) {
            // Kiểm tra trong bảng NhanKhau đã có vợ/chồng chưa
            const [existingInNhanKhau] = await pool.query(
                'SELECT COUNT(*) as count FROM NhanKhau WHERE id_ho_gia_dinh = ? AND (LOWER(quan_he) LIKE "%vợ%" OR LOWER(quan_he) LIKE "%chồng%")',
                [ho_gia_dinh_id]
            );
            
            // Kiểm tra trong bảng yêu cầu đã có yêu cầu pending nào chưa
            const [existingInRequests] = await pool.query(
                'SELECT COUNT(*) as count FROM YeuCauThemNhanKhau WHERE ho_gia_dinh_id = ? AND trang_thai = "pending" AND (LOWER(quan_he) LIKE "%vợ%" OR LOWER(quan_he) LIKE "%chồng%")',
                [ho_gia_dinh_id]
            );
            
            if (existingInNhanKhau[0].count > 0 || existingInRequests[0].count > 0) {
                return res.status(400).json({ 
                    message: 'Hộ gia đình đã có vợ/chồng hoặc đang có yêu cầu thêm vợ/chồng chờ duyệt. Mỗi hộ chỉ được có 1 quan hệ vợ/chồng' 
                });
            }
        }
        
        const [result] = await pool.query(
            'INSERT INTO YeuCauThemNhanKhau (user_id, ho_gia_dinh_id, ho_ten, quan_he, ngay_sinh, gioi_tinh, cccd, mo_ta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, ho_gia_dinh_id || null, sanitizeInput(ho_ten), sanitizedQuanHe, ngay_sinh || null, 
             sanitizeInput(gioi_tinh) || null, sanitizeInput(cccd) || null, sanitizeInput(mo_ta) || null]
        );

        res.status(201).json({
            message: 'Yêu cầu thêm nhân khẩu đã được gửi, chờ admin duyệt!',
            data: { id: result.insertId }
        });
    } catch (error) {
        throw error;
    }
}));

// ========== APPROVE VEHICLE REQUEST (Admin only) ==========
router.put('/vehicle/:id/approve', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    const requestId = req.params.id;
    const adminId = req.user?.id;

    if (!isValidId(requestId)) {
        return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    try {
        const [requests] = await pool.query(
            'SELECT * FROM YeuCauThemXe WHERE id = ?', [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Yêu cầu không tìm thấy' });
        }

        const request = requests[0];

        // Cập nhật trạng thái
        await pool.query(
            'UPDATE YeuCauThemXe SET trang_thai = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
            ['approved', adminId, requestId]
        );

        res.json({ message: 'Yêu cầu đã được phê duyệt!' });
    } catch (error) {
        throw error;
    }
}));

// ========== REJECT VEHICLE REQUEST (Admin only) ==========
router.put('/vehicle/:id/reject', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    const requestId = req.params.id;
    const { ly_do_tu_choi } = req.body;

    if (!isValidId(requestId)) {
        return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    try {
        const [requests] = await pool.query(
            'SELECT * FROM YeuCauThemXe WHERE id = ?', [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Yêu cầu không tìm thấy' });
        }

        // Cập nhật trạng thái
        await pool.query(
            'UPDATE YeuCauThemXe SET trang_thai = ?, ly_do_tu_choi = ?, rejected_at = NOW() WHERE id = ?',
            ['rejected', sanitizeInput(ly_do_tu_choi) || null, requestId]
        );

        res.json({ message: 'Yêu cầu đã bị từ chối!' });
    } catch (error) {
        throw error;
    }
}));

// ========== APPROVE RESIDENT REQUEST (Admin only) ==========
router.put('/resident/:id/approve', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    const requestId = req.params.id;
    const adminId = req.user?.id;

    if (!isValidId(requestId)) {
        return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    try {
        const [requests] = await pool.query(
            'SELECT * FROM YeuCauThemNhanKhau WHERE id = ?', [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Yêu cầu không tìm thấy' });
        }

        const request = requests[0];
        
        // Kiểm tra nếu là quan hệ vợ/chồng
        if (request.ho_gia_dinh_id && request.quan_he && 
            (request.quan_he.toLowerCase().includes('vợ') || request.quan_he.toLowerCase().includes('chồng'))) {
            const [existing] = await pool.query(
                'SELECT COUNT(*) as count FROM NhanKhau WHERE id_ho_gia_dinh = ? AND (LOWER(quan_he) LIKE "%vợ%" OR LOWER(quan_he) LIKE "%chồng%")',
                [request.ho_gia_dinh_id]
            );
            
            if (existing[0].count > 0) {
                return res.status(400).json({ 
                    message: 'Không thể phê duyệt: Hộ gia đình đã có vợ/chồng. Mỗi hộ chỉ được có 1 quan hệ vợ/chồng' 
                });
            }
        }

        // Cập nhật trạng thái
        await pool.query(
            'UPDATE YeuCauThemNhanKhau SET trang_thai = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
            ['approved', adminId, requestId]
        );

        res.json({ message: 'Yêu cầu đã được phê duyệt!' });
    } catch (error) {
        throw error;
    }
}));

// ========== REJECT RESIDENT REQUEST (Admin only) ==========
router.put('/resident/:id/reject', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    const requestId = req.params.id;
    const { ly_do_tu_choi } = req.body;

    if (!isValidId(requestId)) {
        return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    try {
        const [requests] = await pool.query(
            'SELECT * FROM YeuCauThemNhanKhau WHERE id = ?', [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Yêu cầu không tìm thấy' });
        }

        // Cập nhật trạng thái
        await pool.query(
            'UPDATE YeuCauThemNhanKhau SET trang_thai = ?, ly_do_tu_choi = ?, rejected_at = NOW() WHERE id = ?',
            ['rejected', sanitizeInput(ly_do_tu_choi) || null, requestId]
        );

        res.json({ message: 'Yêu cầu đã bị từ chối!' });
    } catch (error) {
        throw error;
    }
}));

// ========== GET USER'S REQUESTS ==========
router.get('/my-requests', verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const [vehicles] = await pool.query(
            'SELECT * FROM YeuCauThemXe WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        const [residents] = await pool.query(
            'SELECT * FROM YeuCauThemNhanKhau WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.json({
            message: 'Danh sách yêu cầu của bạn',
            data: {
                vehicles,
                residents
            }
        });
    } catch (error) {
        throw error;
    }
}));

module.exports = router;
