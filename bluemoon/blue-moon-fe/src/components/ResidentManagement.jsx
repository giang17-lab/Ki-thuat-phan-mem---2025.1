import { useState, useEffect } from 'react';
import styles from './ResidentManagement.module.css';

export default function ResidentManagement() {
  const [residents, setResidents] = useState([
    {
      id: 1,
      hoTen: 'Nguyễn Văn Anh',
      maCanHo: 'A101',
      ngaySinh: '1985-05-15',
      cccd: '001234567890',
      gioi_tinh: 'Nam',
      quanHe: 'Chủ hộ',
    },
    {
      id: 2,
      hoTen: 'Nguyễn Thị B',
      maCanHo: 'A101',
      ngaySinh: '1988-07-20',
      cccd: '001234567891',
      gioi_tinh: 'Nữ',
      quanHe: 'Vợ',
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    hoTen: '',
    maCanHo: '',
    ngaySinh: '',
    cccd: '',
    gioi_tinh: 'Nam',
    quanHe: 'Thành viên',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!formData.hoTen.trim() || !formData.maCanHo.trim()) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (editingId) {
      setResidents(residents.map(r =>
        r.id === editingId ? { ...formData, id: editingId } : r
      ));
      setEditingId(null);
    } else {
      setResidents([
        ...residents,
        { ...formData, id: Math.max(...residents.map(r => r.id), 0) + 1 },
      ]);
    }

    setFormData({
      hoTen: '',
      maCanHo: '',
      ngaySinh: '',
      cccd: '',
      gioi_tinh: 'Nam',
      quanHe: 'Thành viên',
    });
    setShowForm(false);
  };

  const handleEdit = (resident) => {
    setFormData(resident);
    setEditingId(resident.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Xóa cư dân này?')) {
      setResidents(residents.filter(r => r.id !== id));
    }
  };

  const filteredResidents = residents.filter(r =>
    r.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.maCanHo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <h2>👥 Quản Lý Cư Dân</h2>

      <div className={styles.header}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã căn hộ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button className={styles.addBtn} onClick={() => {
          setShowForm(!showForm);
          setEditingId(null);
          setFormData({
            hoTen: '',
            maCanHo: '',
            ngaySinh: '',
            cccd: '',
            gioi_tinh: 'Nam',
            quanHe: 'Thành viên',
          });
        }}>
          + Thêm Cư Dân
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Họ Tên</label>
              <input
                type="text"
                name="hoTen"
                value={formData.hoTen}
                onChange={handleChange}
                placeholder="Nhập họ tên"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Mã Căn Hộ</label>
              <input
                type="text"
                name="maCanHo"
                value={formData.maCanHo}
                onChange={handleChange}
                placeholder="VD: A101"
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Ngày Sinh</label>
              <input
                type="date"
                name="ngaySinh"
                value={formData.ngaySinh}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>CCCD</label>
              <input
                type="text"
                name="cccd"
                value={formData.cccd}
                onChange={handleChange}
                placeholder="Nhập số CCCD"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Giới Tính</label>
              <select
                name="gioi_tinh"
                value={formData.gioi_tinh}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Quan Hệ</label>
              <select
                name="quanHe"
                value={formData.quanHe}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="Chủ hộ">Chủ hộ</option>
                <option value="Vợ/Chồng">Vợ/Chồng</option>
                <option value="Con">Con</option>
                <option value="Cha/Mẹ">Cha/Mẹ</option>
                <option value="Thành viên">Thành viên khác</option>
              </select>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.submitBtn}>
              {editingId ? 'Cập Nhật' : 'Thêm Cư Dân'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className={styles.cancelBtn}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className={styles.residentsTable}>
        {filteredResidents.length === 0 ? (
          <p className={styles.empty}>Không có cư dân nào</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Họ Tên</th>
                <th>Mã Căn Hộ</th>
                <th>Ngày Sinh</th>
                <th>CCCD</th>
                <th>Giới Tính</th>
                <th>Quan Hệ</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.map(resident => (
                <tr key={resident.id}>
                  <td>{resident.hoTen}</td>
                  <td>{resident.maCanHo}</td>
                  <td>{resident.ngaySinh || '-'}</td>
                  <td>{resident.cccd || '-'}</td>
                  <td>{resident.gioi_tinh}</td>
                  <td>{resident.quanHe}</td>
                  <td className={styles.actions}>
                    <button
                      onClick={() => handleEdit(resident)}
                      className={styles.editBtn}
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(resident.id)}
                      className={styles.deleteBtn}
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
