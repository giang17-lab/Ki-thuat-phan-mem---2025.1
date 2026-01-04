import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './AccountSettings.module.css';

const API_BASE = 'http://localhost:3000';

export default function AccountSettings() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    ten_nguoi_dung: '',
    email: '',
    role: 'user',
    trang_thai: 1,
    password: '',
  });
  const [createData, setCreateData] = useState({
    username: '',
    password: '',
    email: '',
    ten_nguoi_dung: '',
    role: 'user',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (response.ok) {
        setUsers(result.data || []);
      } else {
        setError(result.message || 'Không thể tải danh sách người dùng');
      }
    } catch (err) {
      setError('Lỗi khi tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usr) => {
    setEditingId(usr.id);
    setFormData({
      ten_nguoi_dung: usr.ten_nguoi_dung || '',
      email: usr.email || '',
      role: usr.role,
      trang_thai: usr.trang_thai,
      password: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!editingId) return;

    try {
      const updateData = {
        ten_nguoi_dung: formData.ten_nguoi_dung,
        email: formData.email,
        role: formData.role,
        trang_thai: parseInt(formData.trang_thai),
      };

      // Chỉ gửi password nếu có nhập
      if (formData.password.trim()) {
        if (formData.password.length < 6) {
          setError('Mật khẩu phải ít nhất 6 ký tự');
          return;
        }
        updateData.password = formData.password;
      }

      const response = await fetch(`${API_BASE}/api/auth/users/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess('Cập nhật người dùng thành công!');
        setEditingId(null);
        loadUsers();
      } else {
        setError(result.message || 'Lỗi khi cập nhật');
      }
    } catch (err) {
      setError('Lỗi khi cập nhật người dùng');
      console.error(err);
    }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`Xóa tài khoản ${username}? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_BASE}/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess('Xóa người dùng thành công!');
        loadUsers();
      } else {
        setError(result.message || 'Lỗi khi xóa');
      }
    } catch (err) {
      setError('Lỗi khi xóa người dùng');
      console.error(err);
    }
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateData({ ...createData, [name]: value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!createData.username.trim() || !createData.password.trim() || !createData.email.trim()) {
      setError('Vui lòng điền đầy đủ tên đăng nhập, mật khẩu và email');
      return;
    }

    if (createData.password.length < 6) {
      setError('Mật khẩu phải ít nhất 6 ký tự');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(createData)
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess('Tạo tài khoản thành công!');
        setShowCreateForm(false);
        setCreateData({
          username: '',
          password: '',
          email: '',
          ten_nguoi_dung: '',
          role: 'user',
        });
        loadUsers();
      } else {
        setError(result.message || 'Lỗi khi tạo tài khoản');
      }
    } catch (err) {
      setError('Lỗi khi tạo tài khoản');
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.ten_nguoi_dung?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.topActions}>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)} 
          className={styles.createBtn}
        >
          {showCreateForm ? '✕ Đóng' : '➕ Tạo Tài Khoản Mới'}
        </button>
      </div>

      {showCreateForm && (
        <div className={styles.createForm}>
          <h3>Tạo Tài Khoản Mới</h3>
          <form onSubmit={handleCreate}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Tên Đăng Nhập *</label>
                <input
                  type="text"
                  name="username"
                  value={createData.username}
                  onChange={handleCreateChange}
                  placeholder="Nhập tên đăng nhập"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Mật Khẩu *</label>
                <input
                  type="password"
                  name="password"
                  value={createData.password}
                  onChange={handleCreateChange}
                  placeholder="Ít nhất 6 ký tự"
                  className={styles.input}
                  required
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Tên Người Dùng</label>
                <input
                  type="text"
                  name="ten_nguoi_dung"
                  value={createData.ten_nguoi_dung}
                  onChange={handleCreateChange}
                  placeholder="Họ và tên"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={createData.email}
                  onChange={handleCreateChange}
                  placeholder="example@email.com"
                  className={styles.input}
                  required
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Vai Trò</label>
                <select
                  name="role"
                  value={createData.role}
                  onChange={handleCreateChange}
                  className={styles.select}
                >
                  <option value="user">👤 User</option>
                  <option value="admin">🛡️ Admin</option>
                  <option value="moderator">👮 Moderator</option>
                </select>
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.saveBtn}>Tạo Tài Khoản</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className={styles.cancelBtn}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên đăng nhập, tên hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : filteredUsers.length === 0 ? (
        <p className={styles.empty}>Không tìm thấy người dùng</p>
      ) : (
        <div className={styles.usersTable}>
          <table>
            <thead>
              <tr>
                <th>Tên Đăng Nhập</th>
                <th>Tên Người Dùng</th>
                <th>Email</th>
                <th>Vai Trò</th>
                <th>Trạng Thái</th>
                <th>Ngày Tạo</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(usr => (
                <tr key={usr.id}>
                  <td><strong>{usr.username}</strong></td>
                  <td>{usr.ten_nguoi_dung || '-'}</td>
                  <td>{usr.email}</td>
                  <td>
                    {editingId === usr.id ? (
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className={styles.select}
                      >
                        <option value="user">👤 User</option>
                        <option value="admin">🛡️ Admin</option>
                        <option value="moderator">👮 Moderator</option>
                      </select>
                    ) : (
                      <span className={`${styles.role} ${styles[usr.role]}`}>
                        {usr.role === 'admin' ? '🛡️ Admin' : usr.role === 'moderator' ? '👮 Moderator' : '👤 User'}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === usr.id ? (
                      <select
                        name="trang_thai"
                        value={formData.trang_thai}
                        onChange={handleChange}
                        className={styles.select}
                      >
                        <option value="1">✓ Hoạt động</option>
                        <option value="0">✗ Khóa</option>
                      </select>
                    ) : (
                      <span className={usr.trang_thai ? styles.active : styles.inactive}>
                        {usr.trang_thai ? '✓ Hoạt động' : '✗ Khóa'}
                      </span>
                    )}
                  </td>
                  <td className={styles.date}>{new Date(usr.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className={styles.actions}>
                    {editingId === usr.id ? (
                      <>
                        <form onSubmit={handleSave} className={styles.editForm}>
                          <div className={styles.formGroup}>
                            <label>Tên Người Dùng</label>
                            <input
                              type="text"
                              name="ten_nguoi_dung"
                              value={formData.ten_nguoi_dung}
                              onChange={handleChange}
                              className={styles.input}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className={styles.input}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Mật Khẩu Mới (để trống nếu không đổi)</label>
                            <input
                              type="password"
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              placeholder="••••••"
                              className={styles.input}
                            />
                          </div>
                          <div className={styles.editActions}>
                            <button type="submit" className={styles.saveBtn}>Lưu</button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className={styles.cancelBtn}
                            >
                              Hủy
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(usr)}
                          className={styles.editBtn}
                          disabled={usr.id === user?.id}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(usr.id, usr.username)}
                          className={styles.deleteBtn}
                          disabled={usr.id === user?.id}
                        >
                          🗑️ Xóa
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.info}>
        <p>📝 Tổng: <strong>{users.length}</strong> người dùng</p>
        <p>👤 User: <strong>{users.filter(u => u.role === 'user').length}</strong></p>
        <p>🛡️ Admin: <strong>{users.filter(u => u.role === 'admin').length}</strong></p>
      </div>
    </div>
  );
}
