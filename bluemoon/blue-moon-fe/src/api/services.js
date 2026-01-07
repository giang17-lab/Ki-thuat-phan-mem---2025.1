import client from './client';

export const authService = {
  register: async (username, password, email, ten_nguoi_dung) => {
    return client.post('/auth/register', {
      username,
      password,
      email,
      ten_nguoi_dung,
    });
  },

  login: async (username, password) => {
    return client.post('/auth/login', {
      username,
      password,
    });
  },

  verify: async () => {
    return client.get('/auth/verify');
  },

  changePassword: async (current_password, new_password) => {
    return client.post('/auth/change-password', {
      current_password,
      new_password,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Lấy thông tin hộ gia đình của user hiện tại
  getMyHousehold: async () => {
    return client.get('/auth/my-household');
  },

  // Xác nhận đã thanh toán
  confirmPayment: async (phieuThuId) => {
    return client.post(`/auth/confirm-payment/${phieuThuId}`);
  },
};

export const hoGiaDinhService = {
  getAll: async () => {
    return client.get('/hogiadinh');
  },

  getById: async (id) => {
    return client.get(`/hogiadinh/${id}`);
  },

  getNhanKhau: async (id) => {
    return client.get(`/hogiadinh/${id}/nhankhau`);
  },

  create: async (ma_can_ho, ten_chu_ho, dien_tich, ngay_chuyen_den, cccd, sdt) => {
    return client.post('/hogiadinh', {
      ma_can_ho,
      ten_chu_ho,
      dien_tich,
      ngay_chuyen_den,
      cccd,
      sdt,
    });
  },

  update: async (id, data) => {
    return client.put(`/hogiadinh/${id}`, data);
  },

  delete: async (id) => {
    return client.delete(`/hogiadinh/${id}`);
  },
};

export const nhanKhauService = {
  getByHo: async (id_ho) => {
    return client.get(`/nhankhau/ho/${id_ho}`);
  },

  create: async (id_ho_gia_dinh, ho_ten, ngay_sinh, quan_he) => {
    return client.post('/nhankhau', {
      id_ho_gia_dinh,
      ho_ten,
      ngay_sinh,
      quan_he,
    });
  },

  update: async (id, ho_ten) => {
    return client.put(`/nhankhau/${id}`, { ho_ten });
  },

  delete: async (id) => {
    return client.delete(`/nhankhau/${id}`);
  },
};

export const xeCoService = {
  getByHo: async (id_ho) => {
    return client.get(`/xeco/ho/${id_ho}`);
  },

  create: async (id_ho_gia_dinh, bien_so, loai_xe, ngay_dang_ky) => {
    return client.post('/xeco', {
      id_ho_gia_dinh,
      bien_so,
      loai_xe,
      ngay_dang_ky,
    });
  },

  update: async (id, data) => {
    return client.put(`/xeco/${id}`, data);
  },

  delete: async (id) => {
    return client.delete(`/xeco/${id}`);
  },
};

export const phieuThuService = {
  getByHo: async (id_ho) => {
    return client.get(`/phieuthu/ho/${id_ho}`);
  },

  create: async (id_ho_gia_dinh, id_khoan_thu, ky_thanh_toan, so_tien_phai_thu) => {
    return client.post('/phieuthu', {
      id_ho_gia_dinh,
      id_khoan_thu,
      ky_thanh_toan,
      so_tien_phai_thu,
    });
  },

  update: async (id, data) => {
    return client.put(`/phieuthu/${id}`, data);
  },

  delete: async (id) => {
    return client.delete(`/phieuthu/${id}`);
  },

  // Admin: Lấy danh sách phiếu thu chờ xác nhận
  getPending: async () => {
    return client.get('/phieuthu/pending');
  },

  // Admin: Phê duyệt thanh toán
  approve: async (id) => {
    return client.put(`/phieuthu/${id}/approve`);
  },

  // Admin: Từ chối xác nhận thanh toán
  reject: async (id, ly_do) => {
    return client.put(`/phieuthu/${id}/reject`, { ly_do });
  },
};
export const requestsService = {
  // Lấy yêu cầu chờ duyệt (Admin)
  getPending: async () => {
    return client.get('/requests/pending');
  },

  // Gửi yêu cầu thêm xe
  requestVehicle: async (bien_so, loai_xe, ho_gia_dinh_id, mo_ta) => {
    return client.post('/requests/vehicle/request', {
      bien_so,
      loai_xe,
      ho_gia_dinh_id,
      mo_ta,
    });
  },

  // Gửi yêu cầu thêm nhân khẩu
  requestResident: async (ho_ten, quan_he, ho_gia_dinh_id, ngay_sinh, gioi_tinh, cccd, mo_ta) => {
    return client.post('/requests/resident/request', {
      ho_ten,
      quan_he,
      ho_gia_dinh_id,
      ngay_sinh,
      gioi_tinh,
      cccd,
      mo_ta,
    });
  },

  // Phê duyệt yêu cầu thêm xe
  approveVehicle: async (id) => {
    return client.put(`/requests/vehicle/${id}/approve`);
  },

  // Từ chối yêu cầu thêm xe
  rejectVehicle: async (id, ly_do_tu_choi) => {
    return client.put(`/requests/vehicle/${id}/reject`, { ly_do_tu_choi });
  },

  // Phê duyệt yêu cầu thêm nhân khẩu
  approveResident: async (id) => {
    return client.put(`/requests/resident/${id}/approve`);
  },

  // Từ chối yêu cầu thêm nhân khẩu
  rejectResident: async (id, ly_do_tu_choi) => {
    return client.put(`/requests/resident/${id}/reject`, { ly_do_tu_choi });
  },

  // Lấy yêu cầu của user hiện tại
  getMyRequests: async () => {
    return client.get('/requests/my-requests');
  },
};

export const billingService = {
  // month: 'YYYY-MM'
  preview: async (month) => {
    return client.get(`/billing/monthly?month=${encodeURIComponent(month)}`);
  },

  generate: async (body) => {
    return client.post('/billing/generate', body);
  }
};

export const gopyService = {
  // Gửi góp ý mới (User)
  create: async (tieu_de, noi_dung, loai_gop_y = 'gop_y') => {
    return client.post('/gopy', {
      tieu_de,
      noi_dung,
      loai_gop_y,
    });
  },

  // Lấy góp ý của user hiện tại
  getMyFeedback: async () => {
    return client.get('/gopy/my-feedback');
  },

  // Lấy tất cả góp ý (Admin)
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.trang_thai) params.append('trang_thai', filters.trang_thai);
    if (filters.loai_gop_y) params.append('loai_gop_y', filters.loai_gop_y);
    return client.get(`/gopy/all?${params.toString()}`);
  },

  // Cập nhật góp ý (Admin)
  update: async (id, data) => {
    return client.put(`/gopy/${id}`, data);
  },

  // Xóa góp ý
  delete: async (id) => {
    return client.delete(`/gopy/${id}`);
  },

  // Thống kê góp ý (Admin)
  getStats: async () => {
    return client.get('/gopy/stats');
  },
};

export const userService = {
  // Lấy thông tin hộ gia đình của user hiện tại
  getMyHousehold: async () => {
    return client.get('/auth/my-household');
  },

  // Lấy thông tin phiếu thu chưa đóng
  getMyUnpaidBills: async () => {
    return client.get('/auth/my-bills');
  },
};