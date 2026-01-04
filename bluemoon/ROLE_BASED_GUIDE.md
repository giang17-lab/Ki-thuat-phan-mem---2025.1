# 🛡️ Hướng Dẫn Sử Dụng Hệ Thống Quản Lý Theo Role

## 📋 Tổng Quan

Hệ thống Quản Lý Chung Cư Blue Moon đã được sửa đổi để hỗ trợ **2 chế độ khác nhau** dựa trên vai trò (Role) của người dùng:

### 1️⃣ **Admin (Quản Trị Viên)**
- **Tài khoản mặc định**: `admin` / `password123`
- Có quyền truy cập toàn bộ hệ thống
- Có thể duyệt/từ chối yêu cầu từ user

### 2️⃣ **User (Người Dùng Thường)**
- **Tạo khi đăng ký** - tất cả tài khoản mới sẽ có role `user`
- Chỉ xem thông tin của chính mình
- Yêu cầu thêm xe hoặc nhân khẩu sẽ được gửi cho admin duyệt

---

## 🔐 Cách Đăng Nhập

### Đăng nhập với tài khoản Admin:
```
Username: admin
Password: password123
→ Sẽ được chuyển tới /admin (Admin Panel)
```

### Đăng nhập với tài khoản User:
```
Username: [tên đăng nhập của bạn]
Password: [mật khẩu của bạn]
→ Sẽ được chuyển tới /user (User Dashboard)
```

---

## 👨‍💼 Chức Năng Admin Panel (`/admin`)

### **Tab 1: Hộ Gia Đình**
- ✅ Xem **danh sách tất cả** hộ gia đình
- ✅ **Thêm mới** hộ gia đình
- ✅ **Sửa** thông tin hộ gia đình
- ✅ **Xóa** hộ gia đình
- ✅ Quản lý tất cả thông tin (xe, nhân khẩu, v.v.)

### **Tab 2: Yêu Cầu Chờ Duyệt**
- 📥 Xem danh sách **yêu cầu thêm xe** từ user
- 📥 Xem danh sách **yêu cầu thêm nhân khẩu** từ user
- ✅ **Phê duyệt** yêu cầu → thêm vào hệ thống
- ❌ **Từ chối** yêu cầu → xóa khỏi hàng chờ

### **Quy trình duyệt yêu cầu:**
1. User gửi yêu cầu (xe/nhân khẩu) từ User Dashboard
2. Yêu cầu xuất hiện ở Tab "Yêu Cầu Chờ Duyệt"
3. Admin xem chi tiết và chọn "Phê Duyệt" hoặc "Từ Chối"
4. Nếu phê duyệt → thêm vào hệ thống
5. Nếu từ chối → user phải gửi lại

---

## 👤 Chức Năng User Dashboard (`/user`)

### **Thông Tin Hộ Gia Đình** (Chỉ Xem)
- 👁️ Xem thông tin chủ hộ
- 👁️ Xem mã căn hộ
- 👁️ Xem diện tích

> ⚠️ **Không thể sửa** - chỉ có admin có quyền

### **Xe Cộ**
- 👁️ Xem **danh sách xe của mình**
- ➕ **Thêm xe mới** → Gửi yêu cầu cho admin
- ❌ **Không thể xóa** - phải liên hệ admin

### **Nhân Khẩu**
- 👁️ Xem **danh sách thành viên gia đình**
- ➕ **Thêm nhân khẩu mới** → Gửi yêu cầu cho admin
- ❌ **Không thể xóa** - phải liên hệ admin

### **Cách thêm xe/nhân khẩu:**
1. Nhấn nút **"+ Thêm Xe"** hoặc **"+ Thêm Nhân Khẩu"**
2. Điền thông tin vào form
3. Nhấn **"Gửi Yêu Cầu"**
4. Thông báo: *"Yêu cầu của bạn đã được gửi cho admin"*
5. Chờ admin duyệt trong tab **"Yêu Cầu Chờ Duyệt"**

---

## 🔄 Luồng Dữ Liệu

```
┌─────────────────────────────────────────┐
│ User gửi yêu cầu thêm xe/nhân khẩu     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Yêu cầu lưu vào localStorage            │
│ (pendingRequests)                       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Admin nhìn thấy yêu cầu ở                │
│ Tab "Yêu Cầu Chờ Duyệt"                 │
└────────────────┬────────────────────────┘
                 │
         ┌───────┴────────┐
         ▼                ▼
    ✅ Phê Duyệt    ❌ Từ Chối
         │                │
         ▼                ▼
    Xóa khỏi     Xóa khỏi
    hàng chờ     hàng chờ
```

---

## 🛠️ Công Nghệ Được Dùng

### Frontend:
- **React 19** - UI component
- **React Router** - Navigation & routing
- **ProtectedRoute** - Kiểm tra quyền trước khi vào trang

### Backend:
- **Express.js** - Server
- **JWT** - Authentication
- **MySQL** - Database
- Role-based access control (RBAC)

---

## 📝 Thay Đổi Chính

### Files Được Tạo Mới:
- ✨ [AdminPanel.jsx](src/pages/AdminPanel.jsx) - Giao diện admin
- ✨ [UserDashboard.jsx](src/pages/UserDashboard.jsx) - Giao diện user

### Files Được Sửa Đổi:
- 🔧 [AuthContext.jsx](src/context/AuthContext.jsx) - Thêm `isAdmin`, `isUser`
- 🔧 [router.jsx](src/router/router.jsx) - Thêm route `/admin` và `/user`
- 🔧 [ProtectedRoute.jsx](src/router/ProtectedRoute.jsx) - Thêm role validation
- 🔧 [Dashboard.jsx](src/pages/Dashboard.jsx) - Redirect dựa trên role
- 🔧 [Dashboard.module.css](src/pages/Dashboard.module.css) - Thêm styles mới

---

## 🚀 Cách Chạy Dự Án

### Frontend:
```bash
cd blue-moon-fe
npm install
npm run dev      # Chạy trên http://localhost:5173
```

### Backend:
```bash
cd blue-moon-backend
npm install
npm start        # Chạy trên http://localhost:3000
```

---

## ⚡ Lưu Ý Quan Trọng

### 📌 Lưu Trữ Yêu Cầu:
Hiện tại, yêu cầu được lưu trong **localStorage** (tạm thời).
- Nếu **xóa localStorage**, yêu cầu sẽ mất
- **Trong thực tế**, cần tạo bảng `Requests` trong database

### 🔐 Bảo Mật:
- Role được lưu trong **JWT token** (backend phát hành)
- Frontend kiểm tra role để hiển thị UI phù hợp
- Backend nên thêm `requireRole()` middleware cho các route nhạy cảm

### 🔄 Tương Lai:
Để hoàn thiện, cần:
1. Tạo bảng `YeuCauThemXe` và `YeuCauThemNhanKhau` trong DB
2. Tạo API endpoint xử lý yêu cầu (POST, GET, PUT)
3. Thêm notification real-time (WebSocket)
4. Thêm email notification cho admin

---

## 📞 Hỗ Trợ

Nếu có vấn đề, kiểm tra:
- ✅ Token JWT còn hiệu lực (24h)
- ✅ Browser localStorage không bị xóa
- ✅ Backend API đang chạy trên port 3000
- ✅ Frontend đang chạy trên port 5173
