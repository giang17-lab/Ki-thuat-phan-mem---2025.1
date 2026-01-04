import { useState } from 'react';
import { phieuThuService } from '../../api/services';
import styles from './TabsCommon.module.css';

export default function PhieuThuTab({ idHo, data, onDataChange }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id_khoan_thu: '1',
    ky_thanh_toan: 'Tháng 1',
    so_tien_phai_thu: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await phieuThuService.create(
        idHo,
        formData.id_khoan_thu,
        formData.ky_thanh_toan,
        formData.so_tien_phai_thu
      );
      setFormData({
        id_khoan_thu: '1',
        ky_thanh_toan: 'Tháng 1',
        so_tien_phai_thu: '',
      });
      setShowForm(false);
      onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi thêm');
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
        <form onSubmit={handleAdd} className={styles.formMultiple}>
          <div>
            <input
              type="text"
              name="ky_thanh_toan"
              value={formData.ky_thanh_toan}
              onChange={handleChange}
              placeholder="Kỳ thanh toán"
              required
              disabled={loading}
            />
          </div>
          <div>
            <input
              type="number"
              name="so_tien_phai_thu"
              value={formData.so_tien_phai_thu}
              onChange={handleChange}
              placeholder="Số tiền phải thu"
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
      )}

      <div className={styles.list}>
        {data.length === 0 ? (
          <p className={styles.empty}>Không có phiếu thu</p>
        ) : (
          data.map((item) => (
            <div key={item.id} className={styles.item}>
              <div>
                <strong>{item.ky_thanh_toan}</strong>
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
