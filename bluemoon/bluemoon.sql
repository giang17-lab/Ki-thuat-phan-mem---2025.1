CREATE DATABASE IF NOT EXISTS bluemoon;
USE bluemoon;
-- Create NguoiDung (Users) table for authentication
CREATE TABLE IF NOT EXISTS NguoiDung (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    ten_nguoi_dung VARCHAR(100),
    role ENUM('admin', 'user', 'moderator') DEFAULT 'user',
    trang_thai TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Insert test user (password: 'password123')
INSERT IGNORE INTO NguoiDung (username, password_hash, email, ten_nguoi_dung, role) 
VALUES ('admin', '$2a$10$mI5ZvjMg6zcOYhqyLW.Cyu4jB4RqN1QBZvJ8z0N0eJ0K0L5L0L5L0', 'admin@bluemoon.com', 'Quản trị viên', 'admin');

INSERT IGNORE INTO NguoiDung (username, password_hash, email, ten_nguoi_dung, role) 
VALUES ('user1', '$2a$10$mI5ZvjMg6zcOYhqyLW.Cyu4jB4RqN1QBZvJ8z0N0eJ0K0L5L0L5L0', 'user1@bluemoon.com', 'Người dùng 1', 'user');
-- Create YeuCauThemXe (Request to add vehicle) table
CREATE TABLE IF NOT EXISTS YeuCauThemXe (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    ho_gia_dinh_id INT,
    bien_so VARCHAR(50) NOT NULL,
    loai_xe VARCHAR(50) NOT NULL,
    mo_ta TEXT,
    trang_thai ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    ly_do_tu_choi VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES NguoiDung(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (trang_thai),
    INDEX idx_created_at (created_at)
);

-- Create YeuCauThemNhanKhau (Request to add resident) table
CREATE TABLE IF NOT EXISTS YeuCauThemNhanKhau (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    ho_gia_dinh_id INT,
    ho_ten VARCHAR(100) NOT NULL,
    quan_he VARCHAR(50) NOT NULL,
    ngay_sinh DATE,
    gioi_tinh VARCHAR(10),
    cccd VARCHAR(20),
    mo_ta TEXT,
    trang_thai ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    ly_do_tu_choi VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES NguoiDung(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (trang_thai),
    INDEX idx_created_at (created_at)
);

-- Create general request table (to track all requests)
CREATE TABLE IF NOT EXISTS YeuCau (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    loai_yeu_cau ENUM('vehicle', 'resident') NOT NULL,
    chi_tiet_yeu_cau INT NOT NULL,
    trang_thai ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES NguoiDung(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (trang_thai),
    INDEX idx_created_at (created_at)
);