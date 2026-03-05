# 📊 Thiết Kế Dữ Liệu - Blue Moon Apartment Management System

## Tổng Quan
Blue Moon là hệ thống quản lý chung cư với 10 bảng chính, lưu trữ thông tin về hộ gia đình, nhân khẩu, xe cộ, phiếu thu, và chiến dịch quyên góp.

---

## 📋 Danh Sách Bảng Dữ Liệu

### 1. **NguoiDung** (Users)
**Mục đích:** Xác thực người dùng và quản lý vai trò  
**Khóa chính:** `id`  

| Cột | Kiểu | Ghi Chú |
|-----|------|---------|
| id | INT | Auto-increment |
| username | VARCHAR(50) | UNIQUE, bắt buộc |
| password_hash | VARCHAR(255) | Mã hóa bcrypt |
| email | VARCHAR(100) | UNIQUE, bắt buộc |
| ten_nguoi_dung | VARCHAR(100) | Tên đầy đủ |
| role | ENUM('admin', 'user', 'moderator') | Mặc định: 'user' |
| ho_gia_dinh_id | INT | FK → HoGiaDinh (null nếu user là admin) |
| trang_thai | TINYINT | 1: active, 0: inactive |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto on update |

**Ví dụ:**
```sql
admin / password123 (role: admin)
user1 / password123 (role: user, ho_gia_dinh_id: 1)
```

---

### 2. **HoGiaDinh** (Households)
**Mục đích:** Thông tin căn hộ/hộ gia đình  
**Khóa chính:** `id`  

| Cột | Kiểu | Ghi Chú |
|-----|------|---------|
| id | INT | Auto-increment |
| ma_can_ho | VARCHAR(50) | UNIQUE, Ví dụ: "A101", "B205" |
| ten_chu_ho | VARCHAR(200) | Tên chủ hộ |
| dien_tich | DECIMAL(8,2) | Diện tích m² (mặc định 70) |
| sdt | VARCHAR(20) | Số điện thoại |
| cccd | VARCHAR(20) | CCCD chủ hộ |
| ngay_chuyen_den | DATE | Ngày chuyển vào |

**Ví dụ:**
```
ma_can_ho: A101, ten_chu_ho: Nguyễn Văn A, dien_tich: 85, sdt: 0901234567
```

---

### 3. **NhanKhau** (Residents)
**Mục đích:** Thành viên trong hộ gia đình  
**Khóa chính:** `id`  
**Khóa ngoài:** `id_ho_gia_dinh` → HoGiaDinh  

| Cột | Kiểu | Ghi Chú |
|-----|------|---------|
| id | INT | Auto-increment |
| id_ho_gia_dinh | INT | FK, bắt buộc |
| ho_ten | VARCHAR(100) | Bắt buộc |
| quan_he | VARCHAR(50) | Mối quan hệ (vợ/chồng/con/cha/mẹ) |
| ngay_sinh | DATE | Ngày sinh |
| gioi_tinh | VARCHAR(10) | Nam/Nữ |
| cccd | VARCHAR(20) | Số CCCD |
| sdt | VARCHAR(20) | Số điện thoại |

**Ví dụ:**
```
id_ho_gia_dinh: 1, ho_ten: Nguyễn Thị B, quan_he: Vợ, ngay_sinh: 1990-05-15
```

---

### 4. **XeCo** (Vehicles)
**Mục đích:** Quản lý phương tiện của hộ  
**Khóa chính:** `id`  
**Khóa ngoài:** `id_ho_gia_dinh` → HoGiaDinh  

| Cột | Kiểu | Ghi Chú |
|-----|------|---------|
| id | INT | Auto-increment |
| id_ho_gia_dinh | INT | FK, bắt buộc |
| bien_so | VARCHAR(50) | Biển số xe (UNIQUE) |
| loai_xe | VARCHAR(50) | Loại (ô tô/xe máy/xe đạp) |
| mo_ta | TEXT | Mô tả thêm |

---

### 5. **KhoanThu** (Fee Types)
**Mục đích:** Định nghĩa các loại phí quản lý, phí vệ sinh, phí khác  
**Khóa chính:** `id`  

| Cột | Kiểu | Ghi Chú |
|-----|------|---------|
| id | INT | Auto-increment |
| ten | VARCHAR(100) | Tên khoản (phí quản lý, phí nước, phí điện) |
| loai_phi | VARCHAR(50) | Loại (phi_quan_ly, phi_nuoc, phi_dien, v.v.) |
| don_gia | DECIMAL(10,2) | Đơn giá (/ m² hoặc cố định) |
| don_vi | VARCHAR(20) | Đơn vị (m²/tháng, cái/tháng) |
| tien_co_dinh | DECIMAL(10,2) | Tiền cố định (nếu không tính theo m²) |
| bat_buoc | BOOLEAN | Bắt buộc hay tùy chọn |
| mo_ta | TEXT | Mô tả |

**Ví dụ:**
```
ten: Phí quản lý, loai_phi: phi_quan_ly, don_gia: 5000, don_vi: m²/tháng, bat_buoc: 1
ten: Phí nước, loai_phi: phi_nuoc, tien_co_dinh: 50000, don_vi: tháng, bat_buoc: 1
```

---

### 6. **PhieuThu** (Receipts/Billing)
**Mục đích:** Phiếu tính phí tháng cho mỗi hộ gia đình  
**Khóa chính:** `id`  
**Khóa ngoài:** 
- `id_ho_gia_dinh` → HoGiaDinh
- `id_khoan_thu` → KhoanThu  

| Cột | Kiểu | Ghi Chú |
|-----|------|---------|
| id | INT | Auto-increment |
| id_ho_gia_dinh | INT | FK, bắt buộc |
| id_khoan_thu | INT | FK, bắt buộc |
| ky_thanh_toan | VARCHAR(50) | "Tháng 1", "2025-01" |
| so_tien_phai_thu | DECIMAL(10,2) | Số tiền phải thanh toán |
| so_tien_da_thu | DECIMAL(10,2) | Số tiền đã thu (mặc định 0) |
| ngay_thu | DATE | Ngày thu |
| trang_thai | TINYINT | 0: chưa đóng, 1: đã đóng, 2: chờ xác nhận |

**Ví dụ:**
```
PhieuThu: HoGiaDinh=A101, KhoanThu=Phí Quản Lý, ky_thanh_toan=Tháng 1, 
so_tien_phai_thu=425000 (85m² × 5000), trang_thai=0 (chưa đóng)
```

---

### 7. **QuyenGopCampaign** (Donation Campaigns)
**Mục đích:** Chiến dịch quyên góp từ cư dân  
**Khóa chính:** `id`  

| Cột | Kiểu | Ghi Chú |
|-----|------|---------|
| id | INT | Auto-increment |
| ten | VARCHAR(255) | Tên chiến dịch (Sửa chữa thang máy) |
| mo_ta | TEXT | Mô tả chi tiết |
| muc_tieu | DECIMAL(15,2) | Mục tiêu tiền cần quyên góp |
| so_tien_dat_duoc | DECIMAL(15,2) | Số tiền đã quyên góp (mặc định 0) |
| ngay_bat_dau | DATE | Ngày bắt đầu |
| ngay_ket_thuc | DATE | Ngày kết thúc |
| trang_thai | ENUM | 'dang_dien_ra', 'ket_thuc', 'huy' |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

**Ví dụ:**
```
ten: Sửa chữa thang máy, muc_tieu: 50000000, ngay_bat_dau: 2025-01-01, 
ngay_ket_thuc: 2025-02-28, trang_thai: dang_dien_ra
```

---

### 8. **QuyenGopTransaction** (Donation Records)
**Mục đích:** Ghi nhận từng lần quyên góp của hộ gia đình  
**Khóa chính:** `id`  
**Khóa ngoài:**
- `id_campaign` → QuyenGopCampaign
- `id_ho_gia_dinh` → HoGiaDinh  

| Cột | Kiểu | Ghi Chú |
|-----|------|---------|
| id | INT | Auto-increment |
| id_campaign | INT | FK, bắt buộc |
| id_ho_gia_dinh | INT | FK, bắt buộc |
| so_tien | DECIMAL(15,2) | Số tiền quyên góp |
| ghi_chu | VARCHAR(255) | Ghi chú (mục đích quyên góp) |
| ngay_quyen_gop | TIMESTAMP | Thời gian quyên góp |
| trang_thai | ENUM | 'hoan_tat', 'huy' (mặc định: 'hoan_tat') |

**Ví dụ:**
```
id_campaign: 1, id_ho_gia_dinh: 5, so_tien: 500000, ghi_chu: Quyên góp sửa thang máy
```

---

### 9. **YeuCauThemNhanKhau** (Requests to Add Residents)
**Mục đích:** Yêu cầu thêm thành viên mới vào hộ  
**Khóa chính:** `id`  
**Khóa ngoài:**
- `user_id` → NguoiDung
- `ho_gia_dinh_id` → HoGiaDinh  

| Cột | Kiểu | Ghi Chú |
|-----|------|---------|
| id | INT | Auto-increment |
| user_id | INT | FK, bắt buộc |
| ho_gia_dinh_id | INT | FK |
| ho_ten | VARCHAR(100) | Bắt buộc |
| quan_he | VARCHAR(50) | Mối quan hệ |
| ngay_sinh | DATE | Ngày sinh |
| gioi_tinh | VARCHAR(10) | Nam/Nữ |
| cccd | VARCHAR(20) | Số CCCD |
| mo_ta | TEXT | Mô tả thêm |
| trang_thai | ENUM | 'pending', 'approved', 'rejected' |
| ly_do_tu_choi | VARCHAR(255) | Lý do nếu từ chối |
| created_at | TIMESTAMP | Auto |
| approved_by | INT | FK → NguoiDung (admin phê duyệt) |
| approved_at | TIMESTAMP | Thời gian phê duyệt |
| rejected_at | TIMESTAMP | Thời gian từ chối |

---

### 10. **YeuCauThemXe** (Requests to Add Vehicles)
**Mục đích:** Yêu cầu thêm phương tiện mới  
**Khóa chính:** `id`  
**Khóa ngoài:**
- `user_id` → NguoiDung
- `ho_gia_dinh_id` → HoGiaDinh  

| Cột | Kiểu | Ghi Chú |
|-----|------|---------|
| id | INT | Auto-increment |
| user_id | INT | FK, bắt buộc |
| ho_gia_dinh_id | INT | FK |
| bien_so | VARCHAR(50) | Bắt buộc |
| loai_xe | VARCHAR(50) | Loại xe |
| mo_ta | TEXT | Mô tả |
| trang_thai | ENUM | 'pending', 'approved', 'rejected' |
| ly_do_tu_choi | VARCHAR(255) | Lý do từ chối |
| created_at | TIMESTAMP | Auto |
| approved_by | INT | FK → NguoiDung |
| approved_at | TIMESTAMP | Thời gian phê duyệt |
| rejected_at | TIMESTAMP | Thời gian từ chối |

---

## 📊 Mối Quan Hệ (Relationships)

```
NguoiDung
├─ FK: ho_gia_dinh_id → HoGiaDinh (một user → một hộ)
└─ 1:N ← YeuCauThemNhanKhau (một user tạo nhiều yêu cầu)
└─ 1:N ← YeuCauThemXe (một user tạo nhiều yêu cầu)

HoGiaDinh
├─ 1:N → NhanKhau (một hộ → nhiều thành viên)
├─ 1:N → XeCo (một hộ → nhiều xe)
├─ 1:N → PhieuThu (một hộ → nhiều phiếu thu)
└─ 1:N → QuyenGopTransaction (một hộ → nhiều lần quyên góp)

KhoanThu
└─ 1:N → PhieuThu (một khoản → nhiều phiếu)

QuyenGopCampaign
└─ 1:N → QuyenGopTransaction (một campaign → nhiều lần quyên góp)
```

---

## 🔑 Các Trường Hợp Sử Dụng

### Case 1: Một hộ gia đình mới chuyển vào
```sql
-- 1. Thêm HoGiaDinh
INSERT INTO HoGiaDinh (ma_can_ho, ten_chu_ho, dien_tich) 
VALUES ('A101', 'Nguyễn Văn A', 85);

-- 2. Tạo user cho chủ hộ
INSERT INTO NguoiDung (username, password_hash, email, ho_gia_dinh_id, role)
VALUES ('user_a101', 'hash...', 'a101@bluemoon.com', 1, 'user');

-- 3. Thêm thành viên gia đình
INSERT INTO NhanKhau (id_ho_gia_dinh, ho_ten, quan_he)
VALUES (1, 'Nguyễn Thị B', 'Vợ'), (1, 'Nguyễn Văn C', 'Con');

-- 4. Tự động tạo phiếu thu tháng
INSERT INTO PhieuThu (id_ho_gia_dinh, id_khoan_thu, ky_thanh_toan, so_tien_phai_thu)
VALUES (1, 1, 'Tháng 1', 425000); -- 85m² × 5000
```

### Case 2: Thu tiền phí quản lý
```sql
-- Admin xác nhận thu tiền
UPDATE PhieuThu 
SET so_tien_da_thu = 425000, trang_thai = 1, ngay_thu = NOW()
WHERE id = 1;
```

### Case 3: Tạo chiến dịch quyên góp
```sql
-- Admin tạo campaign
INSERT INTO QuyenGopCampaign (ten, muc_tieu, ngay_bat_dau, ngay_ket_thuc, trang_thai)
VALUES ('Sửa thang máy', 50000000, '2025-01-01', '2025-02-28', 'dang_dien_ra');

-- User quyên góp
INSERT INTO QuyenGopTransaction (id_campaign, id_ho_gia_dinh, so_tien, ghi_chu)
VALUES (1, 1, 500000, 'Quyên góp sửa thang máy');

-- Cập nhật tổng tiền đã quyên góp
UPDATE QuyenGopCampaign SET so_tien_dat_duoc = so_tien_dat_duoc + 500000 WHERE id = 1;
```

---

## 📈 Tính Toán Phí

**Phí Quản Lý Tháng:**
```
so_tien_phai_thu = dien_tich × don_gia
                 = 85m² × 5000/m²/tháng
                 = 425,000 VND
```

**Phí Nước/Điện:**
- Cố định: 50,000 - 100,000 VND/tháng

**Tiến Độ Quyên Góp:**
```
percent_done = (so_tien_dat_duoc / muc_tieu) × 100%
             = (15,000,000 / 50,000,000) × 100%
             = 30%
```

---

## 🔐 Chỉ Số (Indexes)
```sql
CREATE INDEX idx_username ON NguoiDung(username);
CREATE INDEX idx_email ON NguoiDung(email);
CREATE INDEX idx_ma_can_ho ON HoGiaDinh(ma_can_ho);
CREATE INDEX idx_id_ho_gia_dinh ON NhanKhau(id_ho_gia_dinh);
CREATE INDEX idx_ky_thanh_toan ON PhieuThu(ky_thanh_toan);
CREATE INDEX idx_campaign_id ON QuyenGopTransaction(id_campaign);
```

---

## 📌 Ghi Chú Thiết Kế

1. **Naming Convention:** 
   - Bảng: PascalCase (HoGiaDinh)
   - Cột: snake_case với tiếp đầu ngữ id_ cho FK

2. **Timestamps:** Tất cả bảng quan trọng có created_at/updated_at

3. **Soft Delete:** Sử dụng trang_thai thay vì xóa dữ liệu thật

4. **Cascading:** Xóa hộ gia đình sẽ xóa cascading nhân khẩu, xe, phiếu thu

5. **Transactions:** Khi quyên góp, cập nhật cả bảng ghi nhận lẫn tổng tiền

---

**Ngày cập nhật:** 2025-01-15  
**Phiên bản:** 1.0
