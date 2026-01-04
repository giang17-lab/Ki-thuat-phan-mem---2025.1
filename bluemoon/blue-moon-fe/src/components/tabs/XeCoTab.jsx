import { useState } from 'react';
import { xeCoService } from '../../api/services';
import styles from './TabsCommon.module.css';

export default function XeCoTab({ idHo, data, onDataChange }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bien_so: '',
    loai_xe: 'Ô tô',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.bien_so.trim()) return;

    setLoading(true);
    setError('');
    try {
      await xeCoService.create(idHo, formData.bien_so, formData.loai_xe);
      setFormData({ bien_so: '', loai_xe: 'Ô tô' });
      setShowForm(false);
      onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi thêm');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Xóa xe cộ này?')) {
      try {
        await xeCoService.delete(id);
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
        + Thêm Xe Cộ
      </button>

      {showForm && (
        <form onSubmit={handleAdd} className={styles.formDouble}>
          <div>
            <input
              type="text"
              name="bien_so"
              value={formData.bien_so}
              onChange={handleChange}
              placeholder="Biển số xe"
              required
              disabled={loading}
            />
          </div>
          <div>
            <select
              name="loai_xe"
              value={formData.loai_xe}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="Ô tô">Ô tô</option>
              <option value="Xe máy">Xe máy</option>
              <option value="Xe đạp">Xe đạp</option>
              <option value="Khác">Khác</option>
            </select>
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
          <p className={styles.empty}>Không có xe cộ</p>
        ) : (
          data.map((item) => (
            <div key={item.id} className={styles.item}>
              <div>
                <strong>{item.bien_so}</strong>
                <span className={styles.type}>{item.loai_xe}</span>
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
