# 📋 API Requests Documentation

## Tổng Quan

Hệ thống quản lý yêu cầu thêm xe và nhân khẩu từ user cho admin duyệt.

---

## 🛣️ Base URL
```
http://localhost:3000/api/requests
```

---

## 🔐 Authentication

Tất cả endpoint (ngoại trừ create request) yêu cầu **JWT Token** trong header:
```
Authorization: Bearer <token>
```

---

## 📚 Endpoints

### 1️⃣ **GET - Danh sách yêu cầu chờ duyệt** (Admin Only)
```
GET /api/requests/pending
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "message": "Danh sách yêu cầu chờ duyệt",
  "data": {
    "vehicles": [
      {
        "id": 1,
        "user_id": 2,
        "bien_so": "29-A123456",
        "loai_xe": "Ô tô",
        "trang_thai": "pending",
        "created_at": "2025-12-19T10:30:00Z",
        "username": "user1",
        "type": "vehicle"
      }
    ],
    "residents": [
      {
        "id": 1,
        "user_id": 2,
        "ho_ten": "Nguyễn Văn B",
        "quan_he": "Con",
        "trang_thai": "pending",
        "created_at": "2025-12-19T10:30:00Z",
        "username": "user1",
        "type": "resident"
      }
    ]
  },
  "count": 2
}
```

---

### 2️⃣ **POST - Gửi yêu cầu thêm xe**
```
POST /api/requests/vehicle/request
```

**Headers:**
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Body:**
```json
{
  "bien_so": "29-A123456",
  "loai_xe": "Ô tô",
  "ho_gia_dinh_id": 1,
  "mo_ta": "Xe ô tô 4 chỗ màu đen"
}
```

**Response (201):**
```json
{
  "message": "Yêu cầu thêm xe đã được gửi, chờ admin duyệt!",
  "data": {
    "id": 1
  }
}
```

**Error (400):**
```json
{
  "message": "bien_so và loai_xe là bắt buộc"
}
```

---

### 3️⃣ **POST - Gửi yêu cầu thêm nhân khẩu**
```
POST /api/requests/resident/request
```

**Headers:**
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Body:**
```json
{
  "ho_ten": "Nguyễn Văn B",
  "quan_he": "Con",
  "ho_gia_dinh_id": 1,
  "ngay_sinh": "2010-05-15",
  "gioi_tinh": "Nam",
  "cccd": "1234567890123",
  "mo_ta": "Con của chủ hộ"
}
```

**Response (201):**
```json
{
  "message": "Yêu cầu thêm nhân khẩu đã được gửi, chờ admin duyệt!",
  "data": {
    "id": 1
  }
}
```

**Error (400):**
```json
{
  "message": "ho_ten và quan_he là bắt buộc"
}
```

---

### 4️⃣ **PUT - Phê duyệt yêu cầu thêm xe** (Admin Only)
```
PUT /api/requests/vehicle/:id/approve
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "message": "Yêu cầu đã được phê duyệt!"
}
```

**Error (404):**
```json
{
  "message": "Yêu cầu không tìm thấy"
}
```

---

### 5️⃣ **PUT - Từ chối yêu cầu thêm xe** (Admin Only)
```
PUT /api/requests/vehicle/:id/reject
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "ly_do_tu_choi": "Biển số không hợp lệ"
}
```

**Response (200):**
```json
{
  "message": "Yêu cầu đã bị từ chối!"
}
```

---

### 6️⃣ **PUT - Phê duyệt yêu cầu thêm nhân khẩu** (Admin Only)
```
PUT /api/requests/resident/:id/approve
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "message": "Yêu cầu đã được phê duyệt!"
}
```

---

### 7️⃣ **PUT - Từ chối yêu cầu thêm nhân khẩu** (Admin Only)
```
PUT /api/requests/resident/:id/reject
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "ly_do_tu_choi": "CCCD không hợp lệ"
}
```

**Response (200):**
```json
{
  "message": "Yêu cầu đã bị từ chối!"
}
```

---

### 8️⃣ **GET - Danh sách yêu cầu của user hiện tại**
```
GET /api/requests/my-requests
```

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response (200):**
```json
{
  "message": "Danh sách yêu cầu của bạn",
  "data": {
    "vehicles": [
      {
        "id": 1,
        "user_id": 2,
        "ho_gia_dinh_id": 1,
        "bien_so": "29-A123456",
        "loai_xe": "Ô tô",
        "mo_ta": "Xe ô tô 4 chỗ",
        "trang_thai": "pending",
        "ly_do_tu_choi": null,
        "created_at": "2025-12-19T10:30:00Z",
        "approved_by": null,
        "approved_at": null,
        "rejected_at": null
      }
    ],
    "residents": [
      {
        "id": 1,
        "user_id": 2,
        "ho_gia_dinh_id": 1,
        "ho_ten": "Nguyễn Văn B",
        "quan_he": "Con",
        "ngay_sinh": "2010-05-15",
        "gioi_tinh": "Nam",
        "cccd": "1234567890123",
        "mo_ta": "Con của chủ hộ",
        "trang_thai": "pending",
        "ly_do_tu_choi": null,
        "created_at": "2025-12-19T10:30:00Z",
        "approved_by": null,
        "approved_at": null,
        "rejected_at": null
      }
    ]
  }
}
```

---

## 📊 Database Schema

### Bảng: `YeuCauThemXe`
```sql
CREATE TABLE YeuCauThemXe (
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
    FOREIGN KEY (user_id) REFERENCES NguoiDung(id)
);
```

### Bảng: `YeuCauThemNhanKhau`
```sql
CREATE TABLE YeuCauThemNhanKhau (
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
    FOREIGN KEY (user_id) REFERENCES NguoiDung(id)
);
```

### Bảng: `YeuCau` (General)
```sql
CREATE TABLE YeuCau (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    loai_yeu_cau ENUM('vehicle', 'resident') NOT NULL,
    chi_tiet_yeu_cau INT NOT NULL,
    trang_thai ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES NguoiDung(id)
);
```

---

## 🔄 Trạng Thái Yêu Cầu

- **pending**: Chờ admin duyệt
- **approved**: Đã được phê duyệt bởi admin
- **rejected**: Bị từ chối bởi admin

---

## 🧪 Test với Postman

### 1. Đăng nhập (lấy token)
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "user1",
  "password": "password123"
}
```

### 2. Gửi yêu cầu thêm xe
```
POST http://localhost:3000/api/requests/vehicle/request
Authorization: Bearer <token_từ_bước_1>
Content-Type: application/json

{
  "bien_so": "29-A123456",
  "loai_xe": "Ô tô",
  "ho_gia_dinh_id": 1
}
```

### 3. Đăng nhập admin (lấy admin token)
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

### 4. Xem yêu cầu chờ duyệt (Admin)
```
GET http://localhost:3000/api/requests/pending
Authorization: Bearer <admin_token>
```

### 5. Phê duyệt yêu cầu
```
PUT http://localhost:3000/api/requests/vehicle/1/approve
Authorization: Bearer <admin_token>
```

---

## ⚠️ Mã Lỗi

| Mã | Ý Nghĩa |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (Token thiếu/hết hạn) |
| 403 | Forbidden (Không có quyền) |
| 404 | Not Found |
| 409 | Conflict (Dữ liệu trùng) |
| 500 | Server Error |

---

## 🚀 Cách Tích Hợp Frontend

```javascript
// Gửi yêu cầu thêm xe
const requestVehicle = async (data) => {
  const response = await axios.post(
    'http://localhost:3000/api/requests/vehicle/request',
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// Lấy yêu cầu chờ duyệt (Admin)
const getPendingRequests = async () => {
  const response = await axios.get(
    'http://localhost:3000/api/requests/pending',
    {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    }
  );
  return response.data;
};

// Phê duyệt yêu cầu
const approveVehicleRequest = async (requestId) => {
  const response = await axios.put(
    `http://localhost:3000/api/requests/vehicle/${requestId}/approve`,
    {},
    {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    }
  );
  return response.data;
};
```
