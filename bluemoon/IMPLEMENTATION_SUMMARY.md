# 📋 Tóm Tắt Các Thay Đổi - Role-Based Access Control

## ✨ Tính Năng Mới

### **1. Admin Panel** (`/admin`)
Một dashboard hoàn chỉnh cho quản trị viên với:
- **Tab "Hộ Gia Đình"**: Xem, thêm, sửa, xóa tất cả hộ gia đình
- **Tab "Yêu Cầu Chờ Duyệt"**: 
  - Xem tất cả yêu cầu từ user (thêm xe / thêm nhân khẩu)
  - Phê duyệt → thêm vào hệ thống
  - Từ chối → xóa khỏi hàng chờ

### **2. User Dashboard** (`/user`)
Một dashboard riêng cho người dùng thường với:
- **Thông Tin Hộ Gia Đình** (chỉ xem, không sửa)
- **Xe Cộ**:
  - Xem danh sách xe của mình
  - Nút "+ Thêm Xe" → gửi yêu cầu cho admin
- **Nhân Khẩu**:
  - Xem danh sách thành viên gia đình
  - Nút "+ Thêm Nhân Khẩu" → gửi yêu cầu cho admin

### **3. Automatic Redirect** (Chuyển hướng tự động)
- Khi user đăng nhập, sẽ tự động chuyển:
  - **Admin** → `/admin` (Admin Panel)
  - **User** → `/user` (User Dashboard)

---

## 📂 Files Được Tạo

### Frontend:
```
blue-moon-fe/
├── src/pages/
│   ├── AdminPanel.jsx          ✨ NEW - Dashboard cho admin
│   └── UserDashboard.jsx       ✨ NEW - Dashboard cho user
```

---

## 🔧 Files Được Sửa

### Frontend:

#### **1. `src/context/AuthContext.jsx`**
```javascript
// Thêm property mới:
- isAdmin  // boolean - kiểm tra nếu user là admin
- isUser   // boolean - kiểm tra nếu user là user
```

#### **2. `src/router/router.jsx`**
```javascript
// Thêm route mới:
- /admin  → <AdminPanel />
- /user   → <UserDashboard />
// Update imports để include AdminPanel và UserDashboard
```

#### **3. `src/router/ProtectedRoute.jsx`**
```javascript
// Thêm parameter:
- requireRole  // kiểm tra role của user

// Logic mới:
- Nếu requireRole không match với user.role → redirect
- Admin đến /user → redirect sang /admin
- User đến /admin → redirect sang /user
```

#### **4. `src/pages/Dashboard.jsx`**
```javascript
// Đổi thành redirect page:
- Kiểm tra role của user
- Redirect admin → /admin
- Redirect user → /user
// Không còn hiển thị danh sách hộ gia đình trên trang /
```

#### **5. `src/pages/Dashboard.module.css`**
```css
/* Thêm styles mới cho: */
- .tabs                /* Phần tab */
- .activeTab           /* Tab được chọn */
- .requestCard         /* Card yêu cầu */
- .requestActions      /* Nút phê duyệt/từ chối */
- .userCard            /* Card thông tin user */
- .modal               /* Modal form */
- .formGroup           /* Group input */
- .success             /* Thông báo thành công */
/* ... và nhiều styles khác */
```

---

## 🎯 Luồng Hoạt Động

### **Luồng Đăng Nhập:**
```
┌──────────────────┐
│ User Login Page  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ POST /api/auth/login
│ Nhận token + user (có role)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Dashboard.jsx    │
│ Redirect dựa trên role
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Admin     User
   │         │
   ▼         ▼
/admin    /user
```

### **Luồng Thêm Xe/Nhân Khẩu (User):**
```
User nhấn "+ Thêm Xe"
   ↓
Modal form hiện lên
   ↓
User điền thông tin
   ↓
User nhấn "Gửi Yêu Cầu"
   ↓
Request lưu vào localStorage (pendingRequests)
   ↓
Thông báo "Yêu cầu đã được gửi cho admin"
   ↓
Admin nhìn thấy ở Tab "Yêu Cầu Chờ Duyệt"
   ↓
Admin phê duyệt hoặc từ chối
```

---

## 🔐 Bảo Mật

### **Backend:**
- JWT token chứa `role` field
- Middleware `requireRole()` có thể được thêm vào protected routes
- All API calls require valid JWT token

### **Frontend:**
- ProtectedRoute kiểm tra role trước khi hiển thị component
- UI elements bị ẩn dựa trên `useAuth().isAdmin` / `useAuth().isUser`

---

## 💾 Lưu Trữ Dữ Liệu

### **Hiện Tại (Tạm Thời):**
- Yêu cầu lưu trong `localStorage` (key: `pendingRequests`)
- Không bền bỉ khi reload page

### **Cần Thêm (Khuyến Nghị):**
```sql
-- Tạo bảng cho yêu cầu
CREATE TABLE YeuCauThemXe (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  bien_so VARCHAR(20),
  loai_xe VARCHAR(50),
  status ENUM('pending', 'approved', 'rejected'),
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES NguoiDung(id)
);

CREATE TABLE YeuCauThemNhanKhau (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  ho_ten VARCHAR(100),
  quan_he VARCHAR(50),
  status ENUM('pending', 'approved', 'rejected'),
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES NguoiDung(id)
);
```

---

## 🧪 Cách Test

### **Test Admin:**
1. Đăng nhập với: `admin` / `password123`
2. Sẽ chuyển tới `/admin`
3. Xem Tab "Hộ Gia Đình" - danh sách tất cả
4. Xem Tab "Yêu Cầu Chờ Duyệt" (nếu có yêu cầu từ user)

### **Test User:**
1. Tạo tài khoản mới hoặc dùng user có sẵn
2. Đăng nhập - sẽ chuyển tới `/user`
3. Xem thông tin cá nhân (read-only)
4. Nhấn "+ Thêm Xe" → gửi yêu cầu
5. Đăng nhập admin → xem yêu cầu ở Tab 2

---

## ❌ Những Gì Không Thể (User)

- ❌ Sửa thông tin hộ gia đình
- ❌ Xóa xe của mình (phải thông qua admin)
- ❌ Xóa nhân khẩu của mình (phải thông qua admin)
- ❌ Xem thông tin của hộ gia đình khác
- ❌ Truy cập `/admin`

---

## ✅ Những Gì Có Thể (Admin)

- ✅ Xem/Thêm/Sửa/Xóa tất cả hộ gia đình
- ✅ Xem/Thêm/Sửa/Xóa tất cả xe
- ✅ Xem/Thêm/Sửa/Xóa tất cả nhân khẩu
- ✅ Phê duyệt yêu cầu từ user
- ✅ Từ chối yêu cầu từ user

---

## 📝 Notes & TODO

### Đã Hoàn Thành:
- ✅ Tách Frontend thành 2 dashboard (admin + user)
- ✅ Automatic redirect dựa trên role
- ✅ Tab yêu cầu chờ duyệt cho admin
- ✅ Request submission flow cho user
- ✅ UI/UX styles cho tất cả components

### Cần Làm (Tương Lai):
- 📌 Tạo bảng Request trong database
- 📌 Tạo API endpoints xử lý requests (POST, GET, PUT)
- 📌 Thêm notification real-time (WebSocket)
- 📌 Email notification cho admin
- 📌 Audit log cho tất cả actions
- 📌 Status tracking cho user (approved/rejected/pending)

---

## 🎨 UI/UX Improvements

- ✨ Gradient header với icon cho admin/user
- ✨ Tab navigation cho admin
- ✨ Card-based layout cho user dashboard
- ✨ Modal forms cho thêm xe/nhân khẩu
- ✨ Action buttons (Phê Duyệt/Từ Chối)
- ✨ Success/Error message notifications
- ✨ Responsive design cho mobile

