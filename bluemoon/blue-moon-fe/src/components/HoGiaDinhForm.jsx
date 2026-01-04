import { useEffect, useState } from 'react';
import { hoGiaDinhService, nhanKhauService } from '../api/services';
import styles from './HoGiaDinhForm.module.css';

export default function HoGiaDinhForm({ editingId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    ma_can_ho: '',
    ten_chu_ho: '',
    cccd: '',
    sdt: '',
    dien_tich: '',
    ngay_chuyen_den: '',
    ngay_sinh: '',
    gioi_tinh: 'Nam',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState('canho'); // canho | chuho | thanhvien (optional)
  const [members, setMembers] = useState([]); // danh sách thành viên bổ sung

  useEffect(() => {
    if (editingId) {
      loadData();
    }
  }, [editingId]);

  const loadData = async () => {
    try {
      const response = await hoGiaDinhService.getById(editingId);
      setFormData(response.data);
    } catch (err) {
      setError('Lỗi khi tải dữ liệu');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingId) {
        await hoGiaDinhService.update(editingId, formData);
      } else {
        const res = await hoGiaDinhService.create(
          formData.ma_can_ho,
          formData.ten_chu_ho,
          formData.dien_tich,
          formData.ngay_chuyen_den,
          formData.cccd,
          formData.sdt
        );
        // Tạo nhân khẩu cho Chủ hộ (tùy chọn), không cần email hay địa chỉ thường trú/tạm trú
        const idHo = res?.data?.data?.id;
        if (idHo && formData.ten_chu_ho) {
          try {
            await nhanKhauService.create(idHo, formData.ten_chu_ho, formData.ngay_sinh || null, 'Chủ hộ');
          } catch (nkErr) {
            console.warn('Không thể tạo nhân khẩu Chủ hộ:', nkErr?.response?.data?.message || nkErr?.message);
          }
        }
        // Tạo các thành viên bổ sung (nếu có)
        if (idHo && Array.isArray(members) && members.length > 0) {
          const spouseCount = members.filter(m => (m.quan_he || '').toLowerCase().includes('vợ') || (m.quan_he || '').toLowerCase().includes('chồng')).length;
          if (spouseCount > 1) {
            throw new Error('Mỗi hộ chỉ có 1 quan hệ Vợ/Chồng');
          }
          for (const m of members) {
            if (!m.ho_ten || !m.ho_ten.trim()) continue;
            try {
              await nhanKhauService.create(idHo, m.ho_ten.trim(), m.ngay_sinh || null, m.quan_he || null);
            } catch (mkErr) {
              console.warn('Không thể tạo thành viên:', m.ho_ten, mkErr?.response?.data?.message || mkErr?.message);
            }
          }
        }
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi lưu dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{editingId ? 'Chỉnh Sửa' : 'Thêm'} Hộ Gia Đình</h2>

      {/* Step Tabs */}
      <div className={styles.stepTabs}>
        <button
          type="button"
          className={`${styles.stepTab} ${activeStep === 'canho' ? styles.activeStep : ''}`}
          onClick={() => setActiveStep('canho')}
        >
          Căn hộ
        </button>
        <button
          type="button"
          className={`${styles.stepTab} ${activeStep === 'chuho' ? styles.activeStep : ''}`}
          onClick={() => setActiveStep('chuho')}
        >
          Chủ hộ
        </button>
        <button
          type="button"
          className={`${styles.stepTab} ${activeStep === 'thanhvien' ? styles.activeStep : ''}`}
          onClick={() => setActiveStep('thanhvien')}
        >
          Thành viên
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {activeStep === 'canho' && (
        <div className={styles.gridTwo}>
          <div className={styles.formGroup}>
            <label>Mã Căn Hộ *</label>
            <input
              type="text"
              name="ma_can_ho"
              value={formData.ma_can_ho}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Diện Tích (m²)</label>
            <input
              type="number"
              name="dien_tich"
              value={formData.dien_tich}
              onChange={handleChange}
              disabled={loading}
              step="0.01"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Ngày Chuyển Đến</label>
            <input
              type="date"
              name="ngay_chuyen_den"
              value={formData.ngay_chuyen_den}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {activeStep === 'thanhvien' && (
        <div className={styles.membersSection}>
          <div className={styles.membersHeader}>
            <span>Thêm thành viên cho hộ (tùy chọn)</span>
            <button
              type="button"
              className={styles.addMemberBtn}
              onClick={() => setMembers([...members, { ho_ten: '', quan_he: '', ngay_sinh: '' }])}
              disabled={loading}
            >
              + Thêm dòng
            </button>
          </div>

          {members.length === 0 ? (
            <p className={styles.empty}>Chưa có thành viên nào</p>
          ) : (
            members.map((m, idx) => (
              <div key={idx} className={styles.memberRow}>
                <div className={styles.formGroup}>
                  <label>Họ tên</label>
                  <input
                    type="text"
                    value={m.ho_ten}
                    onChange={(e) => {
                      const v = e.target.value; const next = [...members]; next[idx] = { ...next[idx], ho_ten: v }; setMembers(next);
                    }}
                    disabled={loading}
                    placeholder="Nhập họ tên"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Quan hệ</label>
                  <input
                    type="text"
                    value={m.quan_he}
                    onChange={(e) => {
                      const v = e.target.value; const next = [...members]; next[idx] = { ...next[idx], quan_he: v }; setMembers(next);
                    }}
                    disabled={loading}
                    placeholder="VD: Con, Vợ/Chồng, Cha/Mẹ"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Ngày sinh</label>
                  <input
                    type="date"
                    value={m.ngay_sinh}
                    onChange={(e) => {
                      const v = e.target.value; const next = [...members]; next[idx] = { ...next[idx], ngay_sinh: v }; setMembers(next);
                    }}
                    disabled={loading}
                  />
                </div>
                <button
                  type="button"
                  className={styles.memberDelete}
                  onClick={() => setMembers(members.filter((_, i) => i !== idx))}
                  disabled={loading}
                >
                  Xóa
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeStep === 'chuho' && (
        <div className={styles.gridTwo}>
          <div className={styles.formGroup}>
            <label>Họ và Tên Chủ Hộ *</label>
            <input
              type="text"
              name="ten_chu_ho"
              value={formData.ten_chu_ho}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Số Điện Thoại</label>
            <input
              type="tel"
              name="sdt"
              value={formData.sdt}
              onChange={handleChange}
              disabled={loading}
              maxLength="15"
              placeholder="Số điện thoại liên hệ"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Ngày Sinh (tuỳ chọn)</label>
            <input
              type="date"
              name="ngay_sinh"
              value={formData.ngay_sinh}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Giới Tính</label>
            <select
              name="gioi_tinh"
              value={formData.gioi_tinh}
              onChange={handleChange}
              disabled={loading}
              className={styles.select}
            >
              <option>Nam</option>
              <option>Nữ</option>
              <option>Khác</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>CCCD</label>
            <input
              type="text"
              name="cccd"
              value={formData.cccd}
              onChange={handleChange}
              disabled={loading}
              maxLength="20"
              placeholder="Số căn cước công dân"
            />
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Đang xử lý...' : 'Lưu'}
        </button>
        <button type="button" onClick={onCancel} disabled={loading} className={styles.cancelBtn}>
          Hủy
        </button>
      </div>
    </form>
  );
}
