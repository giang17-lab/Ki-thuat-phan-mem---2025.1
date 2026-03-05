import { useState, useEffect } from 'react';
import { phieuThuService, khoanThuService } from '../../api/services';
import styles from './TabsCommon.module.css';

export default function PhieuThuTab({ idHo, data, onDataChange }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id_khoan_thu: '',
    ten_khoan_thu_moi: '',
    so_tien_phai_thu: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [khoanThus, setKhoanThus] = useState([]);

  useEffect(() => {
    if (showForm) {
      khoanThuService.getAll().then(res => {
        setKhoanThus(res.data || []);
      }).catch(() => setKhoanThus([]));
    }
  }, [showForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isOther = formData.id_khoan_thu === 'other';

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let khoanThuId = formData.id_khoan_thu;
      // Nếu chọn 'Khác', tạo khoản thu mới trước
      if (isOther) {
        if (!formData.ten_khoan_thu_moi.trim()) {
          setError('Vui lòng nhập tên khoản thu mới');
          setLoading(false);
          return;
        }
        const res = await khoanThuService.create(formData.ten_khoan_thu_moi, formData.so_tien_phai_thu);
        khoanThuId = res.data?.id;
        if (!khoanThuId) throw new Error('Không tạo được khoản thu mới');
      }
      // Mặc định kỳ thanh toán là tháng hiện tại (YYYY-MM)
      const now = new Date();
      const month = now.getMonth() + 1;
      const ky_thanh_toan = `${now.getFullYear()}-${month.toString().padStart(2, '0')}`;
      await phieuThuService.create(
        idHo,
        khoanThuId,
        ky_thanh_toan,
        formData.so_tien_phai_thu
      );
      setFormData({
        id_khoan_thu: '',
        ten_khoan_thu_moi: '',
        so_tien_phai_thu: '',
      });
      setShowForm(false);
      onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi thêm');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Xóa phiếu thu này?')) {
      try {
        await phieuThuService.delete(id);
        onDataChange();
      } catch (err) {
        alert(err.response?.data?.message || 'Lỗi khi xóa');
      }
    }
  };

  return (
    <div>
      {error && <div className={styles.error}>{error}</div>}

      <button
        onClick={() => setShowForm(!showForm)}
        className={styles.addBtn}
        disabled={loading}
      >
        + Thêm Phiếu Thu
      </button>

      {showForm && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <form onSubmit={handleAdd} className={styles.formMultiple}>
              <div>
                <label>Tên khoản thu</label>
                <select
                  name="id_khoan_thu"
                  value={formData.id_khoan_thu}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">-- Chọn khoản thu --</option>
                  {khoanThus.map((kt) => (
                    <option key={kt.id} value={kt.id}>{kt.ten}</option>
                  ))}
                  <option value="other">Khác...</option>
                </select>
              </div>
              {isOther && (
                <div>
                  <label>Tên khoản thu mới</label>
                  <input
                    type="text"
                    name="ten_khoan_thu_moi"
                    value={formData.ten_khoan_thu_moi}
                    onChange={handleChange}
                    placeholder="Nhập tên khoản thu mới"
                    required={isOther}
                    disabled={loading}
                  />
                </div>
              )}
              <div>
                <label>Số tiền cần thu</label>
                <input
                  type="number"
                  name="so_tien_phai_thu"
                  value={formData.so_tien_phai_thu}
                  onChange={handleChange}
                  placeholder="Số tiền cần thu"
                  required
                  disabled={loading}
                  step="0.01"
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Thêm'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={styles.cancelBtn}
                  disabled={loading}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {data.length === 0 ? (
          <p className={styles.empty}>Không có phiếu thu</p>
        ) : (
          data.map((item) => (
            <div key={item.id} className={styles.item}>
              <div>
                <strong>{item.ten_khoan_thu || item.ky_thanh_toan}</strong>
                <span className={styles.amount}>
                  {item.so_tien_da_thu || 0} / {item.so_tien_phai_thu}
                </span>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className={styles.deleteItemBtn}
              >
                Xóa
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
