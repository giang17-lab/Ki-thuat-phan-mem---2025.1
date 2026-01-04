// db.js
const mysql = require('mysql2/promise');
require('dotenv').config(); 

// Tạo Pool kết nối
// Đảm bảo bạn đang sử dụng mysql2/promise, không phải mysql2 thông thường.
const pool = mysql.createPool({ 
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log(`Đã thiết lập Pool kết nối cho DB: ${process.env.DB_DATABASE}`);

// 🛑 DÒNG EXPORT QUAN TRỌNG NHẤT:
// Phải export chính đối tượng pool, không có dấu ngoặc nhọn {} bao quanh.
module.exports = pool;