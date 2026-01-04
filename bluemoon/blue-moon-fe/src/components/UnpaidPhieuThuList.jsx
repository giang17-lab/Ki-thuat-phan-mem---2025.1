import { useEffect, useState } from 'react';
import styles from './PhieuThuSearch.module.css';

export default function UnpaidPhieuThuList() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3000/api/phieuthu/all');
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const result = await response.json();
      const data = (result.data || []).filter((item) => {
        const remaining = (parseFloat(item.so_tien_phai_thu) || 0) - (parseFloat(item.so_tien_da_thu) || 0);
        return remaining > 0;
      });
      setResults(data);
    } catch (err) {
      setError('Không thể tải danh sách chưa hoàn thành');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className={styles.container}>
      <h2>Danh Sách Khoản Thu Chưa Hoàn Thành</h2>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.resultsSection}>
        <h3>Kết Quả ({results.length})</h3>

        {loading ? (
          <p>Đang tải...</p>
        ) : results.length === 0 ? (
          <p className={styles.noResults}>Không có khoản thu chưa hoàn thành</p>
        ) : (
          <div className={styles.resultsTable}>
            <table>
              <thead>
                <tr>
                  <th>Mã Căn Hộ</th>
                  <th>Tên Chủ Hộ</th>
                  <th>Khoản Thu</th>
                  <th>Kỳ Thanh Toán</th>
                  <th>Tiền Phải Thu</th>
                  <th>Tiền Đã Thu</th>
                  <th>Còn Lại</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item) => {
                  const remaining = (parseFloat(item.so_tien_phai_thu) || 0) - (parseFloat(item.so_tien_da_thu) || 0);
                  const maCanHo = (item.ma_can_ho && item.ma_can_ho.trim()) || `CH-${String(item.id_ho_gia_dinh || item.id || 0).padStart(3, '0')}`;
                  const tenChuHo = (item.ten_chu_ho && item.ten_chu_ho.trim()) || 'Chưa cập nhật';
                  return (
                    <tr key={item.id}>
                      <td>{maCanHo}</td>
                      <td>{tenChuHo}</td>
                      <td>{item.ten_khoan_thu || `Khác ${item.id_khoan_thu}`}</td>
                      <td>{item.ky_thanh_toan}</td>
                      <td>{(parseFloat(item.so_tien_phai_thu) || 0).toLocaleString('vi-VN')} đ</td>
                      <td>{(parseFloat(item.so_tien_da_thu) || 0).toLocaleString('vi-VN')} đ</td>
                      <td style={{ color: '#dc3545', fontWeight: 'bold' }}>
                        {remaining.toLocaleString('vi-VN')} đ
                      </td>
                      <td>
                        <span className={`${styles.status} ${styles.unpaid}`}>
                          Chưa hoàn thành
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
