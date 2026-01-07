// routes/auth.js - Authentication Routes
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db');

const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Utility functions
const isValidString = (str) => typeof str === 'string' && str.trim().length > 0;
const sanitizeInput = (str) => isValidString(str) ? str.trim() : null;
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ========== REGISTER - POST /api/auth/register (Admin only) ==========
router.post('/register', verifyToken, asyncHandler(async (req, res) => {
    // Only admin can create new users
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ admin mới có thể tạo tài khoản mới' });
    }
    
    const { username, password, email, ten_nguoi_dung } = req.body;
    
    // Validate input
    if (!isValidString(username) || !isValidString(password) || !isValidString(email)) {
        return res.status(400).json({ message: 'username, password, email là bắt buộc' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải ít nhất 6 ký tự' });
    }

    try {
        // Check if user already exists
        const [existing] = await pool.query('SELECT id FROM NguoiDung WHERE username = ? OR email = ?', [sanitizeInput(username), sanitizeInput(email)]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Username hoặc Email đã tồn tại' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const [result] = await pool.query(
            'INSERT INTO NguoiDung (username, password_hash, email, ten_nguoi_dung, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [sanitizeInput(username), hashedPassword, sanitizeInput(email), sanitizeInput(ten_nguoi_dung) || null, 'user']
        );

        res.status(201).json({ 
            message: 'Đăng ký thành công!',
            data: { id: result.insertId, username: sanitizeInput(username) }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username hoặc Email đã tồn tại' });
        }
        throw error;
    }
}));

// ========== CHANGE PASSWORD - POST /api/auth/change-password ==========
router.post('/change-password', verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { current_password, new_password } = req.body;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!isValidString(current_password) || !isValidString(new_password)) {
        return res.status(400).json({ message: 'current_password và new_password là bắt buộc' });
    }
    if (new_password.length < 6) return res.status(400).json({ message: 'Mật khẩu mới phải ít nhất 6 ký tự' });

    // Fetch user
    const [rows] = await pool.query('SELECT id, password_hash FROM NguoiDung WHERE id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ message: 'Người dùng không tìm thấy' });
    const user = rows[0];

    // Verify current password
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });

    // Hash and update
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE NguoiDung SET password_hash = ?, updated_at = NOW() WHERE id = ?', [hashed, userId]);
    res.json({ message: 'Đổi mật khẩu thành công' });
}));

// ========== LOGIN - POST /api/auth/login ==========
router.post('/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    if (!isValidString(username) || !isValidString(password)) {
        return res.status(400).json({ message: 'username và password là bắt buộc' });
    }

    // Find user by username
    const [rows] = await pool.query('SELECT id, username, password_hash, role, email FROM NguoiDung WHERE username = ?', [sanitizeInput(username)]);
    
    if (rows.length === 0) {
        return res.status(401).json({ message: 'Username hoặc mật khẩu không chính xác' });
    }

    const user = rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
        return res.status(401).json({ message: 'Username hoặc mật khẩu không chính xác' });
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );

    res.json({
        message: 'Đăng nhập thành công!',
        token,
        user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
}));

// ========== VERIFY TOKEN - GET /api/auth/verify ==========
router.get('/verify', asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Token không được cung cấp' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        res.json({ message: 'Token hợp lệ', ...decoded });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Token không hợp lệ' });
        }
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
}));

// ========== GET ALL USERS (Admin only) - GET /api/auth/users ==========
router.get('/users', verifyToken, asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
    }

    const [rows] = await pool.query(
        'SELECT id, username, email, ten_nguoi_dung, role, trang_thai, created_at FROM NguoiDung ORDER BY id DESC'
    );
    res.json({ message: 'Lấy danh sách người dùng thành công!', data: rows, count: rows.length });
}));

// ========== UPDATE USER (Admin only) - PUT /api/auth/users/:id ==========
router.put('/users/:id', verifyToken, asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ admin mới có quyền cập nhật' });
    }

    const { id } = req.params;
    const { ten_nguoi_dung, email, role, trang_thai, password } = req.body;
    const updates = [];
    const values = [];

    // Validate and add fields to update
    if (ten_nguoi_dung !== undefined && isValidString(ten_nguoi_dung)) {
        updates.push('ten_nguoi_dung = ?');
        values.push(sanitizeInput(ten_nguoi_dung));
    }

    if (email !== undefined && isValidString(email)) {
        updates.push('email = ?');
        values.push(sanitizeInput(email));
    }

    if (role !== undefined && ['admin', 'user', 'moderator'].includes(role)) {
        updates.push('role = ?');
        values.push(role);
    }

    if (trang_thai !== undefined && [0, 1].includes(trang_thai)) {
        updates.push('trang_thai = ?');
        values.push(trang_thai);
    }

    // Handle password change
    if (password !== undefined && isValidString(password)) {
        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải ít nhất 6 ký tự' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.push('password_hash = ?');
        values.push(hashedPassword);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });
    }

    values.push(id);
    const [result] = await pool.query(
        `UPDATE NguoiDung SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
        values
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Người dùng không tìm thấy' });
    }

    res.json({ message: 'Cập nhật người dùng thành công!' });
}));

// ========== DELETE USER (Admin only) - DELETE /api/auth/users/:id ==========
router.delete('/users/:id', verifyToken, asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ admin mới có quyền xóa' });
    }

    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ message: 'Không thể xóa tài khoản của chính mình' });
    }

    const [result] = await pool.query('DELETE FROM NguoiDung WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Người dùng không tìm thấy' });
    }

    res.json({ message: 'Xóa người dùng thành công!' });
}));

// ========== GET MY HOUSEHOLD - GET /api/auth/my-household ==========
router.get('/my-household', verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Tìm hộ gia đình liên kết với user qua NguoiDung.ho_gia_dinh_id hoặc qua email/username
    const [user] = await pool.query(
        'SELECT id, username, email, ten_nguoi_dung, ho_gia_dinh_id FROM NguoiDung WHERE id = ?',
        [userId]
    );

    if (!user.length) {
        return res.status(404).json({ message: 'User không tồn tại' });
    }

    let hoGiaDinh = null;
    let nhanKhau = [];
    let xeCo = [];
    let phieuThu = [];

    // Nếu user đã được liên kết với hộ gia đình
    if (user[0].ho_gia_dinh_id) {
        const [hgd] = await pool.query(
            'SELECT * FROM HoGiaDinh WHERE id = ?',
            [user[0].ho_gia_dinh_id]
        );
        if (hgd.length) {
            hoGiaDinh = hgd[0];
            
            // Lấy nhân khẩu
            const [nk] = await pool.query(
                'SELECT * FROM NhanKhau WHERE id_ho_gia_dinh = ? ORDER BY quan_he, id',
                [hoGiaDinh.id]
            );
            nhanKhau = nk;

            // Lấy xe cộ
            const [xe] = await pool.query(
                'SELECT * FROM XeCo WHERE id_ho_gia_dinh = ? ORDER BY id',
                [hoGiaDinh.id]
            );
            xeCo = xe;

            // Lấy phiếu thu
            const [pt] = await pool.query(
                `SELECT pt.*, kt.ten as ten_khoan_thu, kt.mo_ta as loai_khoan_thu,
                 CASE 
                   WHEN pt.trang_thai = 1 THEN true 
                   WHEN pt.trang_thai = 2 THEN false
                   ELSE false 
                 END as da_thu,
                 CASE
                   WHEN pt.trang_thai = 2 THEN 'cho_xac_nhan'
                   WHEN pt.trang_thai = 1 THEN 'da_thanh_toan'
                   ELSE 'chua_thanh_toan'
                 END as trang_thai_text
                FROM PhieuThu pt
                LEFT JOIN KhoanThu kt ON pt.id_khoan_thu = kt.id
                WHERE pt.id_ho_gia_dinh = ?
                ORDER BY pt.ky_thanh_toan DESC, pt.id DESC`,
                [hoGiaDinh.id]
            );
            phieuThu = pt;
        }
    }

    res.json({
        message: 'Thông tin hộ gia đình của bạn',
        data: {
            user: {
                id: user[0].id,
                username: user[0].username,
                email: user[0].email,
                ten_nguoi_dung: user[0].ten_nguoi_dung
            },
            hoGiaDinh,
            nhanKhau,
            xeCo,
            phieuThu
        }
    });
}));

// ========== CONFIRM PAYMENT - POST /api/auth/confirm-payment/:id ==========
router.post('/confirm-payment/:id', verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const phieuThuId = req.params.id;
    
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Kiểm tra phiếu thu có thuộc về user này không
    const [user] = await pool.query(
        'SELECT ho_gia_dinh_id FROM NguoiDung WHERE id = ?',
        [userId]
    );

    if (!user.length || !user[0].ho_gia_dinh_id) {
        return res.status(400).json({ message: 'Chưa liên kết với hộ gia đình' });
    }

    const [phieuThu] = await pool.query(
        'SELECT * FROM PhieuThu WHERE id = ? AND id_ho_gia_dinh = ?',
        [phieuThuId, user[0].ho_gia_dinh_id]
    );

    if (!phieuThu.length) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu thu' });
    }

    if (phieuThu[0].trang_thai === 1) {
        return res.status(400).json({ message: 'Phiếu thu này đã được thanh toán' });
    }

    // Cập nhật trạng thái: chờ xác nhận (trang_thai = 2)
    await pool.query(
        'UPDATE PhieuThu SET trang_thai = 2, ngay_thu = CURDATE() WHERE id = ?',
        [phieuThuId]
    );

    res.json({
        message: 'Đã gửi xác nhận thanh toán. Ban quản lý sẽ kiểm tra và cập nhật.',
        data: { phieuThuId }
    });
}));

// ========== GET MY BILLS - GET /api/auth/my-bills ==========
router.get('/my-bills', verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Lấy ho_gia_dinh_id của user
    const [user] = await pool.query(
        'SELECT ho_gia_dinh_id FROM NguoiDung WHERE id = ?',
        [userId]
    );

    if (!user.length || !user[0].ho_gia_dinh_id) {
        return res.json({
            message: 'Chưa liên kết với hộ gia đình',
            data: { unpaid: [], paid: [], total_unpaid: 0 }
        });
    }

    const hoGiaDinhId = user[0].ho_gia_dinh_id;

    // Lấy phiếu thu chưa đóng (trang_thai = 0)
    const [unpaid] = await pool.query(`
        SELECT pt.*, kt.ten as ten_khoan_thu, kt.mo_ta as loai_khoan_thu
        FROM PhieuThu pt
        LEFT JOIN KhoanThu kt ON pt.id_khoan_thu = kt.id
        WHERE pt.id_ho_gia_dinh = ? AND pt.trang_thai = 0
        ORDER BY pt.ky_thanh_toan DESC, pt.id DESC
    `, [hoGiaDinhId]);

    // Lấy phiếu thu đã đóng (trang_thai = 1 hoặc 2)
    const [paid] = await pool.query(`
        SELECT pt.*, kt.ten as ten_khoan_thu, kt.mo_ta as loai_khoan_thu
        FROM PhieuThu pt
        LEFT JOIN KhoanThu kt ON pt.id_khoan_thu = kt.id
        WHERE pt.id_ho_gia_dinh = ? AND pt.trang_thai > 0
        ORDER BY pt.ngay_thu DESC, pt.id DESC
        LIMIT 10
    `, [hoGiaDinhId]);

    // Tính tổng tiền chưa đóng
    const totalUnpaid = unpaid.reduce((sum, item) => sum + (parseFloat(item.so_tien_phai_thu) || 0), 0);

    res.json({
        message: 'Danh sách phiếu thu',
        data: {
            unpaid,
            paid,
            total_unpaid: totalUnpaid
        }
    });
}));

module.exports = router;
