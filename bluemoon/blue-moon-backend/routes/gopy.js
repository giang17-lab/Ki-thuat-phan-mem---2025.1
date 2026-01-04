// routes/gopy.js - Xử lý góp ý, khiếu nại từ cư dân
const express = require('express');
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Utility functions
const isValidId = (id) => !isNaN(id) && id > 0;
const isValidString = (str) => typeof str === 'string' && str.trim().length > 0;
const sanitizeInput = (str) => isValidString(str) ? str.trim() : null;
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ========== GỬI GÓP Ý MỚI (User) ==========
router.post('/', verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { tieu_de, noi_dung, loai_gop_y } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!isValidString(tieu_de) || !isValidString(noi_dung)) {
        return res.status(400).json({ message: 'Tiêu đề và nội dung là bắt buộc' });
    }

    const validTypes = ['gop_y', 'khieu_nai', 'de_xuat', 'yeu_cau', 'khac'];
    const type = validTypes.includes(loai_gop_y) ? loai_gop_y : 'gop_y';

    const [result] = await pool.query(
        'INSERT INTO GopY (user_id, tieu_de, noi_dung, loai_gop_y) VALUES (?, ?, ?, ?)',
        [userId, sanitizeInput(tieu_de), sanitizeInput(noi_dung), type]
    );

    res.status(201).json({
        message: 'Gửi góp ý thành công!',
        data: { id: result.insertId }
    });
}));

// ========== LẤY DANH SÁCH GÓP Ý CỦA USER ==========
router.get('/my-feedback', verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await pool.query(
        `SELECT g.*, u.ten_nguoi_dung as admin_name 
         FROM GopY g 
         LEFT JOIN NguoiDung u ON g.admin_id = u.id 
         WHERE g.user_id = ? 
         ORDER BY g.created_at DESC`,
        [userId]
    );

    res.json({
        message: 'Danh sách góp ý của bạn',
        data: rows,
        count: rows.length
    });
}));

// ========== LẤY TẤT CẢ GÓP Ý (Admin) ==========
router.get('/all', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    const { trang_thai, loai_gop_y } = req.query;

    let sql = `
        SELECT g.*, u.username, u.ten_nguoi_dung as sender_name, u.email as sender_email,
               a.ten_nguoi_dung as admin_name
        FROM GopY g
        LEFT JOIN NguoiDung u ON g.user_id = u.id
        LEFT JOIN NguoiDung a ON g.admin_id = a.id
        WHERE 1=1
    `;
    const params = [];

    if (trang_thai) {
        sql += ' AND g.trang_thai = ?';
        params.push(trang_thai);
    }
    if (loai_gop_y) {
        sql += ' AND g.loai_gop_y = ?';
        params.push(loai_gop_y);
    }

    sql += ' ORDER BY g.created_at DESC';

    const [rows] = await pool.query(sql, params);

    res.json({
        message: 'Danh sách tất cả góp ý',
        data: rows,
        count: rows.length
    });
}));

// ========== CẬP NHẬT TRẠNG THÁI GÓP Ý (Admin) ==========
router.put('/:id', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user?.id;
    const { trang_thai, phan_hoi } = req.body;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const validStatuses = ['moi', 'dang_xu_ly', 'da_xu_ly', 'tu_choi'];
    if (trang_thai && !validStatuses.includes(trang_thai)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const updates = [];
    const values = [];

    if (trang_thai) {
        updates.push('trang_thai = ?');
        values.push(trang_thai);
    }
    if (phan_hoi !== undefined) {
        updates.push('phan_hoi = ?');
        values.push(sanitizeInput(phan_hoi));
    }
    updates.push('admin_id = ?');
    values.push(adminId);

    if (updates.length === 1) {
        return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });
    }

    values.push(id);
    const [result] = await pool.query(
        `UPDATE GopY SET ${updates.join(', ')} WHERE id = ?`,
        values
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Góp ý không tìm thấy' });
    }

    res.json({ message: 'Cập nhật góp ý thành công!' });
}));

// ========== XÓA GÓP Ý (Admin hoặc owner) ==========
router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    // Check ownership or admin
    const [existing] = await pool.query('SELECT user_id FROM GopY WHERE id = ?', [id]);
    if (existing.length === 0) {
        return res.status(404).json({ message: 'Góp ý không tìm thấy' });
    }

    if (userRole !== 'admin' && existing[0].user_id !== userId) {
        return res.status(403).json({ message: 'Bạn không có quyền xóa góp ý này' });
    }

    await pool.query('DELETE FROM GopY WHERE id = ?', [id]);
    res.json({ message: 'Xóa góp ý thành công!' });
}));

// ========== THỐNG KÊ GÓP Ý (Admin) ==========
router.get('/stats', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
    const [statusStats] = await pool.query(`
        SELECT trang_thai, COUNT(*) as count 
        FROM GopY 
        GROUP BY trang_thai
    `);

    const [typeStats] = await pool.query(`
        SELECT loai_gop_y, COUNT(*) as count 
        FROM GopY 
        GROUP BY loai_gop_y
    `);

    const [total] = await pool.query('SELECT COUNT(*) as total FROM GopY');

    res.json({
        message: 'Thống kê góp ý',
        data: {
            total: total[0].total,
            by_status: statusStats,
            by_type: typeStats
        }
    });
}));

module.exports = router;
