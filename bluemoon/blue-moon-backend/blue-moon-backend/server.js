// server.js - Blue Moon Backend with Security & Modular Routes
const express = require('express');
require('dotenv').config(); 
const pool = require('../db'); 
const app = express();
const port = process.env.PORT || 3000;

// Import routes
const authRoutes = require('../routes/auth');
const quyenGopRoutes = require('../routes/quyengop');
const { verifyToken } = require('../middleware/auth');

// ========== MIDDLEWARE ==========
app.use(express.json({ limit: '10mb' })); 
const cors = require('cors');
app.use(cors());

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// ========== UTILITY FUNCTIONS ==========
const isValidId = (id) => !isNaN(id) && id > 0;
const isValidString = (str) => typeof str === 'string' && str.trim().length > 0;
const sanitizeInput = (str) => isValidString(str) ? str.trim() : null;
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ========== AUTHENTICATION ROUTES ==========
app.use('/api/auth', authRoutes);

// ========== QUYÊN GÓP ROUTES ==========
app.use('/api/quyengop', quyenGopRoutes);

// ========== HỘ GIA ĐÌNH ROUTES (6 APIs) ==========
app.get('/api/hogiadinh', asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT id, ma_can_ho, ten_chu_ho, dien_tich, ngay_chuyen_den FROM HoGiaDinh ORDER BY id DESC');
    res.json({ message: 'Lấy danh sách hộ gia đình thành công!', data: rows, count: rows.length });
}));

app.get('/api/hogiadinh/:id', asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [rows] = await pool.query('SELECT * FROM HoGiaDinh WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Hộ gia đình không tìm thấy' });
    res.json({ data: rows[0] });
}));

app.get('/api/hogiadinh/:id/nhankhau', asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [rows] = await pool.query('SELECT * FROM NhanKhau WHERE id_ho_gia_dinh = ? ORDER BY id', [req.params.id]);
    res.json({ data: rows, count: rows.length });
}));

app.post('/api/hogiadinh', verifyToken, asyncHandler(async (req, res) => {
    const { ma_can_ho, ten_chu_ho, dien_tich, ngay_chuyen_den } = req.body;
    if (!isValidString(ma_can_ho) || !isValidString(ten_chu_ho)) {
        return res.status(400).json({ message: 'ma_can_ho và ten_chu_ho là bắt buộc' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO HoGiaDinh (ma_can_ho, ten_chu_ho, dien_tich, ngay_chuyen_den) VALUES (?, ?, ?, ?)',
            [sanitizeInput(ma_can_ho), sanitizeInput(ten_chu_ho), dien_tich || null, ngay_chuyen_den || null]
        );
        res.status(201).json({ message: 'Tạo hộ gia đình thành công!', data: { id: result.insertId } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Mã căn hộ đã tồn tại' });
        }
        throw error;
    }
}));

app.put('/api/hogiadinh/:id', verifyToken, asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const fields = [], values = [];
    ['ma_can_ho', 'ten_chu_ho', 'dien_tich', 'ngay_chuyen_den'].forEach(f => {
        if (req.body[f] !== undefined) { fields.push(`${f} = ?`); values.push(req.body[f]); }
    });
    if (!fields.length) return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });
    values.push(req.params.id);
    const [result] = await pool.query(`UPDATE HoGiaDinh SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Hộ gia đình không tìm thấy' });
    res.json({ message: 'Cập nhật hộ gia đình thành công!' });
}));

app.delete('/api/hogiadinh/:id', verifyToken, asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    try {
        const [result] = await pool.query('DELETE FROM HoGiaDinh WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Hộ gia đình không tìm thấy' });
        res.json({ message: 'Xóa hộ gia đình thành công!' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_FK_CONSTRAINT_FAILED') {
            return res.status(409).json({ message: 'Không thể xóa: có dữ liệu liên kết' });
        }
        throw error;
    }
}));

// ========== NHÂN KHẨU ROUTES (4 APIs) ==========
app.get('/api/nhankhau/ho/:id_ho', asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id_ho)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [rows] = await pool.query('SELECT id, ho_ten, ngay_sinh, cccd, quan_he, gioi_tinh, sdt FROM NhanKhau WHERE id_ho_gia_dinh = ? ORDER BY id', [req.params.id_ho]);
    res.json({ data: rows, count: rows.length });
}));

app.post('/api/nhankhau', verifyToken, asyncHandler(async (req, res) => {
    const { id_ho_gia_dinh, ho_ten, ngay_sinh, quan_he, cccd, sdt, gioi_tinh } = req.body;
    if (!isValidId(id_ho_gia_dinh) || !isValidString(ho_ten)) {
        return res.status(400).json({ message: 'id_ho_gia_dinh và ho_ten là bắt buộc' });
    }
    const [result] = await pool.query(
        'INSERT INTO NhanKhau (id_ho_gia_dinh, ho_ten, ngay_sinh, quan_he, cccd, sdt, gioi_tinh, loai_cu_tru) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [id_ho_gia_dinh, sanitizeInput(ho_ten), ngay_sinh || null, sanitizeInput(quan_he) || null, sanitizeInput(cccd) || null, sanitizeInput(sdt) || null, sanitizeInput(gioi_tinh) || null]
    );
    res.status(201).json({ message: 'Tạo nhân khẩu thành công!', data: { id: result.insertId } });
}));

app.put('/api/nhankhau/:id', verifyToken, asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    if (!req.body.ho_ten) return res.status(400).json({ message: 'ho_ten là bắt buộc' });
    const [result] = await pool.query('UPDATE NhanKhau SET ho_ten = ? WHERE id = ?', [sanitizeInput(req.body.ho_ten), req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Nhân khẩu không tìm thấy' });
    res.json({ message: 'Cập nhật nhân khẩu thành công!' });
}));

app.delete('/api/nhankhau/:id', verifyToken, asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [result] = await pool.query('DELETE FROM NhanKhau WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Nhân khẩu không tìm thấy' });
    res.json({ message: 'Xóa nhân khẩu thành công!' });
}));

// ========== XE CỘ ROUTES (4 APIs) ==========
app.get('/api/xeco/ho/:id_ho', asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id_ho)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [rows] = await pool.query('SELECT id, bien_so, loai_xe, ngay_dang_ky FROM XeCo WHERE id_ho_gia_dinh = ? ORDER BY id', [req.params.id_ho]);
    res.json({ data: rows, count: rows.length });
}));

app.post('/api/xeco', verifyToken, asyncHandler(async (req, res) => {
    const { id_ho_gia_dinh, bien_so } = req.body;
    if (!isValidId(id_ho_gia_dinh) || !isValidString(bien_so)) {
        return res.status(400).json({ message: 'id_ho_gia_dinh và bien_so là bắt buộc' });
    }
    const [result] = await pool.query('INSERT INTO XeCo (id_ho_gia_dinh, bien_so, loai_xe, ngay_dang_ky, trang_thai) VALUES (?, ?, ?, ?, 1)',
        [id_ho_gia_dinh, sanitizeInput(bien_so), req.body.loai_xe || 'Khác', req.body.ngay_dang_ky || new Date().toISOString().split('T')[0]]);
    res.status(201).json({ message: 'Tạo xe cộ thành công!', data: { id: result.insertId } });
}));

app.put('/api/xeco/:id', verifyToken, asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const fields = [], values = [];
    ['bien_so', 'loai_xe', 'ngay_dang_ky', 'trang_thai'].forEach(f => {
        if (req.body[f] !== undefined) { fields.push(`${f} = ?`); values.push(req.body[f]); }
    });
    if (!fields.length) return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });
    values.push(req.params.id);
    const [result] = await pool.query(`UPDATE XeCo SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Xe cộ không tìm thấy' });
    res.json({ message: 'Cập nhật xe cộ thành công!' });
}));

app.delete('/api/xeco/:id', verifyToken, asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [result] = await pool.query('DELETE FROM XeCo WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Xe cộ không tìm thấy' });
    res.json({ message: 'Xóa xe cộ thành công!' });
}));

// ========== PHIẾU THU ROUTES (4 APIs) ==========
// Lấy tất cả phiếu thu (kèm tên khoản thu + thông tin hộ) để thống kê/tra cứu
app.get('/api/phieuthu/all', asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            p.id,
            p.id_ho_gia_dinh,
            p.id_khoan_thu,
            kt.ten AS ten_khoan_thu,
            p.ky_thanh_toan,
            p.so_tien_phai_thu,
            p.so_tien_da_thu,
            p.ngay_thu,
            p.trang_thai,
            COALESCE(NULLIF(TRIM(h.ma_can_ho), ''), CONCAT('CH-', LPAD(p.id_ho_gia_dinh, 3, '0'))) AS ma_can_ho,
            COALESCE(NULLIF(TRIM(h.ten_chu_ho), ''), 'Chưa cập nhật') AS ten_chu_ho
        FROM PhieuThu p
        JOIN HoGiaDinh h ON h.id = p.id_ho_gia_dinh
        INNER JOIN KhoanThu kt ON kt.id = p.id_khoan_thu
        ORDER BY p.id DESC
    `);
    res.json({ message: 'Lấy danh sách phiếu thu thành công!', data: rows, count: rows.length });
}));
app.get('/api/phieuthu/ho/:id_ho', asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id_ho)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [rows] = await pool.query('SELECT id, id_khoan_thu, ky_thanh_toan, so_tien_phai_thu, so_tien_da_thu FROM PhieuThu WHERE id_ho_gia_dinh = ? ORDER BY id', [req.params.id_ho]);
    res.json({ data: rows, count: rows.length });
}));

app.post('/api/phieuthu', verifyToken, asyncHandler(async (req, res) => {
    const { id_ho_gia_dinh, id_khoan_thu, ky_thanh_toan, so_tien_phai_thu } = req.body;
    if (!isValidId(id_ho_gia_dinh) || !isValidId(id_khoan_thu)) {
        return res.status(400).json({ message: 'id_ho_gia_dinh và id_khoan_thu là bắt buộc' });
    }
    const [result] = await pool.query('INSERT INTO PhieuThu (id_ho_gia_dinh, id_khoan_thu, ky_thanh_toan, so_tien_phai_thu, so_tien_da_thu, trang_thai) VALUES (?, ?, ?, ?, 0, 0)',
        [id_ho_gia_dinh, id_khoan_thu, ky_thanh_toan || 'Tháng 1', so_tien_phai_thu || 0]);
    res.status(201).json({ message: 'Tạo phiếu thu thành công!', data: { id: result.insertId } });
}));

app.put('/api/phieuthu/:id', verifyToken, asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const fields = [], values = [];
    ['so_tien_da_thu', 'ngay_thu', 'trang_thai'].forEach(f => {
        if (req.body[f] !== undefined) { fields.push(`${f} = ?`); values.push(req.body[f]); }
    });
    if (!fields.length) return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });
    values.push(req.params.id);
    const [result] = await pool.query(`UPDATE PhieuThu SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Phiếu thu không tìm thấy' });
    res.json({ message: 'Cập nhật phiếu thu thành công!' });
}));

app.delete('/api/phieuthu/:id', verifyToken, asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [result] = await pool.query('DELETE FROM PhieuThu WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Phiếu thu không tìm thấy' });
    res.json({ message: 'Xóa phiếu thu thành công!' });
}));

// ========== KHOẢN THU ROUTES ==========
// Danh sách khoản thu
app.get('/api/khoanthu', asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT id, ten, tien_co_dinh, mo_ta FROM KhoanThu ORDER BY id');
    res.json({ message: 'Lấy danh sách khoản thu thành công', data: rows, count: rows.length });
}));

// Thêm khoản thu (admin)
app.post('/api/khoanthu', verifyToken, asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden: Cần quyền admin' });
    const { id, ten, tien_co_dinh, mo_ta } = req.body;
    if (!ten || !ten.trim()) return res.status(400).json({ message: 'ten là bắt buộc' });
    const fee = Number.isFinite(+tien_co_dinh) ? +tien_co_dinh : 0;
    if (id) {
        await pool.query('INSERT INTO KhoanThu (id, ten, tien_co_dinh, mo_ta) VALUES (?, ?, ?, ?)', [id, ten.trim(), fee, mo_ta || null]);
        return res.status(201).json({ message: 'Tạo khoản thu thành công', data: { id } });
    }
    const [result] = await pool.query('INSERT INTO KhoanThu (ten, tien_co_dinh, mo_ta) VALUES (?, ?, ?)', [ten.trim(), fee, mo_ta || null]);
    res.status(201).json({ message: 'Tạo khoản thu thành công', data: { id: result.insertId } });
}));

// Cập nhật khoản thu (admin)
app.put('/api/khoanthu/:id', verifyToken, asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden: Cần quyền admin' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
    const fields = [], values = [];
    if (req.body.ten !== undefined) { fields.push('ten = ?'); values.push(req.body.ten); }
    if (req.body.tien_co_dinh !== undefined) { fields.push('tien_co_dinh = ?'); values.push(+req.body.tien_co_dinh || 0); }
    if (req.body.mo_ta !== undefined) { fields.push('mo_ta = ?'); values.push(req.body.mo_ta); }
    if (!fields.length) return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });
    values.push(id);
    const [result] = await pool.query(`UPDATE KhoanThu SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Khoản thu không tìm thấy' });
    res.json({ message: 'Cập nhật khoản thu thành công' });
}));

// Xoá khoản thu (admin)
app.delete('/api/khoanthu/:id', verifyToken, asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden: Cần quyền admin' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [[ref]] = await pool.query('SELECT COUNT(*) AS cnt FROM PhieuThu WHERE id_khoan_thu = ?', [id]);
    if (ref.cnt > 0) return res.status(409).json({ message: 'Không thể xoá: Khoản thu đang được sử dụng trong Phiếu Thu' });
    const [result] = await pool.query('DELETE FROM KhoanThu WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Khoản thu không tìm thấy' });
    res.json({ message: 'Xóa khoản thu thành công' });
}));

// ========== ERROR HANDLERS ==========
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${new Date().toISOString()}:`, err.message);
    if (err.code && err.code.startsWith('ER_')) {
        return res.status(400).json({ message: 'Lỗi cơ sở dữ liệu', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint không tìm thấy' });
});

// ========== SERVER STARTUP ==========
const server = app.listen(port, '0.0.0.0', () => {
    const os = require('os');
    const getLocalIP = () => {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) return iface.address;
            }
        }
        return 'localhost';
    };
    const localIP = getLocalIP();
    console.log(`✓ Server chạy: http://${localIP}:${port}`);
    console.log(`✓ Localhost: http://localhost:${port}`);
    console.log(`✓ 18 API endpoints ready`);
    console.log(`✓ Database: ${process.env.DB_DATABASE}`);
});

server.on('error', (err) => {
    console.error('❌ Server error:', err.message);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});