// middleware/auth.js - JWT Authentication Middleware
const jwt = require('jsonwebtoken');

// Verify JWT token from Authorization header
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: Token không được cung cấp' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token đã hết hạn' });
        }
        return res.status(403).json({ message: 'Forbidden: Token không hợp lệ' });
    }
};

// Optional: Check if user has specific role
const requireRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ message: `Forbidden: Cần quyền ${role}` });
    }
    next();
};

module.exports = { verifyToken, requireRole };
