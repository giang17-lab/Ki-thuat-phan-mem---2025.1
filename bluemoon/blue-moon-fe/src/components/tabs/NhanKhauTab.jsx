import { useState } from 'react';
import { nhanKhauService } from '../../api/services';
import styles from './TabsCommon.module.css';

export default function NhanKhauTab({ idHo, data, onDataChange }) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQuan, setNewQuan] = useState('');
  const [newDOB, setNewDOB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    setError('');
    try {
      await nhanKhauService.create(idHo, newName, newDOB || null, newQuan || null);
      setNewName('');
      setNewQuan('');
      setNewDOB('');
      setShowForm(false);
      onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi thêm');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Xóa nhân khẩu này?')) {
      try {
        await nhanKhauService.delete(id);
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
        + Thêm Nhân Khẩu
      </button>

      {showForm && (
        <form onSubmit={handleAdd} className={styles.form}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nhập tên nhân khẩu"
            required
            disabled={loading}
          />
          <input
            type="text"
            value={newQuan}
            onChange={(e) => setNewQuan(e.target.value)}
            placeholder="Quan hệ (ví dụ: Con, Vợ/Chồng, Cha/Mẹ)"
            disabled={loading}
          />
          <input
            type="date"
            value={newDOB}
            onChange={(e) => setNewDOB(e.target.value)}
            placeholder="Ngày sinh"
            disabled={loading}
          />
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
        </form>
      )}

      <div className={styles.list}>
        {!data || data.length === 0 ? (
          <p className={styles.empty}>Không có nhân khẩu</p>
        ) : (
          data.map((item) => (
            <div key={item.id} className={styles.item}>
              <div style={{flex:1}}>
                <div style={{fontWeight:'bold', fontSize:'16px', marginBottom:'4px', color:'#333'}}>
                  {item.ho_ten || '(Chưa có tên)'}
                </div>
                <div style={{fontSize:'14px',color:'#666', marginBottom:'4px'}}>Quan hệ: {item.quan_he || 'Chưa cập nhật'}</div>
                {item.ngay_sinh && <div style={{fontSize:'14px',color:'#999'}}>Sinh: {new Date(item.ngay_sinh).toLocaleDateString('vi-VN')}</div>}
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
