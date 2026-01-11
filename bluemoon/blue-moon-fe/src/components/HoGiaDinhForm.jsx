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
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [currentMemberIdx, setCurrentMemberIdx] = useState(null);
  const [memberForm, setMemberForm] = useState({
    ho_ten: '',
    quan_he: '',
    ngay_sinh: '',
    cccd: '',
    sdt: '',
    gioi_tinh: 'Nam'
  });

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

  const openMemberModal = (idx = null) => {
    if (idx !== null) {
      setMemberForm(members[idx]);
      setCurrentMemberIdx(idx);
    } else {
      setMemberForm({
        ho_ten: '',
        quan_he: '',
        ngay_sinh: '',
        cccd: '',
        sdt: '',
        gioi_tinh: 'Nam'
      });
      setCurrentMemberIdx(null);
    }
    setShowMemberModal(true);
  };

  const closeMemberModal = () => {
    setShowMemberModal(false);
    setCurrentMemberIdx(null);
    setMemberForm({
      ho_ten: '',
      quan_he: '',
      ngay_sinh: '',
      cccd: '',
      sdt: '',
      gioi_tinh: 'Nam'
    });
  };

  const saveMember = () => {
    if (!memberForm.ho_ten.trim()) {
      alert('Vui lòng nhập họ tên');
      return;
    }
    const newMembers = [...members];
    if (currentMemberIdx !== null) {
      newMembers[currentMemberIdx] = memberForm;
    } else {
      newMembers.push(memberForm);
    }
    setMembers(newMembers);
    closeMemberModal();
  };

  const deleteMember = (idx) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleMemberChange = (e) => {
    const { name, value } = e.target;
    setMemberForm((prev) => ({ ...prev, [name]: value }));
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
            await nhanKhauService.create(
              idHo,
              formData.ten_chu_ho,
              formData.ngay_sinh || null,
              'Chủ hộ',
              formData.cccd || null,
              formData.sdt || null,
              formData.gioi_tinh || 'Nam'
            );
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
              await nhanKhauService.create(
                idHo,
                m.ho_ten.trim(),
                m.ngay_sinh || null,
                m.quan_he || null,
                m.cccd || null,
                m.sdt || null,
                m.gioi_tinh || 'Nam'
              );
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
    <>
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
              onClick={() => openMemberModal()}
              disabled={loading}
            >
              + Thêm Nhân Khẩu
            </button>
          </div>

          {members.length === 0 ? (
            <p className={styles.empty}>Chưa có thành viên nào</p>
          ) : (
            <table className={styles.membersTable}>
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Quan hệ</th>
                  <th>Ngày sinh</th>
                  <th>CCCD</th>
                  <th>SĐT</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => (
                  <tr key={idx}>
                    <td>{m.ho_ten}</td>
                    <td>{m.quan_he}</td>
                    <td>{m.ngay_sinh}</td>
                    <td>{m.cccd}</td>
                    <td>{m.sdt}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => openMemberModal(idx)}
                        disabled={loading}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className={styles.memberDelete}
                        onClick={() => deleteMember(idx)}
                        disabled={loading}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {showMemberModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{currentMemberIdx !== null ? 'Chỉnh Sửa' : 'Thêm'} Thành Viên</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={closeMemberModal}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Họ và Tên *</label>
                <input
                  type="text"
                  name="ho_ten"
                  value={memberForm.ho_ten}
                  onChange={handleMemberChange}
                  placeholder="Nhập họ tên"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Quan hệ</label>
                <input
                  type="text"
                  name="quan_he"
                  value={memberForm.quan_he}
                  onChange={handleMemberChange}
                  placeholder="VD: Con, Vợ/Chồng, Cha/Mẹ"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Ngày Sinh</label>
                <input
                  type="date"
                  name="ngay_sinh"
                  value={memberForm.ngay_sinh}
                  onChange={handleMemberChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Giới Tính</label>
                <select
                  name="gioi_tinh"
                  value={memberForm.gioi_tinh}
                  onChange={handleMemberChange}
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
                  value={memberForm.cccd}
                  onChange={handleMemberChange}
                  placeholder="Số căn cước công dân"
                  maxLength="20"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Số Điện Thoại</label>
                <input
                  type="tel"
                  name="sdt"
                  value={memberForm.sdt}
                  onChange={handleMemberChange}
                  placeholder="Số điện thoại liên hệ"
                  maxLength="15"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={saveMember}
              >
                Lưu
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={closeMemberModal}
              >
                Hủy
              </button>
            </div>
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

    {showMemberModal && (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3>{currentMemberIdx !== null ? 'Chỉnh Sửa' : 'Thêm'} Thành Viên</h3>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={closeMemberModal}
            >
              ✕
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label>Họ và Tên *</label>
              <input
                type="text"
                name="ho_ten"
                value={memberForm.ho_ten}
                onChange={handleMemberChange}
                placeholder="Nhập họ tên"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Quan hệ</label>
              <input
                type="text"
                name="quan_he"
                value={memberForm.quan_he}
                onChange={handleMemberChange}
                placeholder="VD: Con, Vợ/Chồng, Cha/Mẹ"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Ngày Sinh</label>
              <input
                type="date"
                name="ngay_sinh"
                value={memberForm.ngay_sinh}
                onChange={handleMemberChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Giới Tính</label>
              <select
                name="gioi_tinh"
                value={memberForm.gioi_tinh}
                onChange={handleMemberChange}
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
                value={memberForm.cccd}
                onChange={handleMemberChange}
                placeholder="Số căn cước công dân"
                maxLength="20"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Số Điện Thoại</label>
              <input
                type="tel"
                name="sdt"
                value={memberForm.sdt}
                onChange={handleMemberChange}
                placeholder="Số điện thoại liên hệ"
                maxLength="15"
              />
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={saveMember}
            >
              Lưu
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={closeMemberModal}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
