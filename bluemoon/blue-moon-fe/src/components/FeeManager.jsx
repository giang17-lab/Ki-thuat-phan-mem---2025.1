import { useEffect, useState } from 'react';
import client from '../api/client';

export default function FeeManager() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ id: '', ten: '', tien_co_dinh: '', mo_ta: '' });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await client.get('/khoanthu');
      setFees(res.data || res);
    } catch (e) { setError(e.response?.data?.message || 'Không thể tải khoản thu'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ id: '', ten: '', tien_co_dinh: '', mo_ta: '' }); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editingId) {
        await client.put(`/khoanthu/${editingId}`, {
          ten: form.ten,
          tien_co_dinh: Number(form.tien_co_dinh) || 0,
          mo_ta: form.mo_ta || null,
        });
      } else {
        const body = {
          ten: form.ten,
          tien_co_dinh: Number(form.tien_co_dinh) || 0,
          mo_ta: form.mo_ta || null,
        };
        if (form.id) body.id = Number(form.id);
        await client.post('/khoanthu', body);
      }
      resetForm();
      await load();
      alert('Lưu khoản thu thành công');
    } catch (e) {
      setError(e.response?.data?.message || 'Lỗi khi lưu khoản thu');
    }
  };

  return (
    <div style={{ background: 'white', padding: 20, borderRadius: 8 }}>
      <h2>Quản Lý Khoản Thu</h2>
      {error && <div style={{ color: '#c33', marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>ID</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Tên</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #eee', padding: 8 }}>Tiền cố định</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            {fees.map(f => (
              <tr key={f.id}>
                <td style={{ padding: 8 }}>{f.id}</td>
                <td style={{ padding: 8 }}>{f.ten}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{(Number(f.tien_co_dinh)||0).toLocaleString('vi-VN')} đ</td>
                <td style={{ padding: 8 }}>{f.mo_ta || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
