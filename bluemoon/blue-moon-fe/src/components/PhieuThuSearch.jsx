import { useState, useEffect } from 'react';
import styles from './PhieuThuSearch.module.css';

export default function PhieuThuSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchTerm || filterMonth) {
      handleSearch();
    }
  }, [searchTerm, filterMonth]);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      // Lấy tất cả phiếu thu từ API
      const response = await fetch('http://localhost:3000/api/phieuthu/all');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const result = await response.json();
      let data = result.data || [];

      // Filter theo tên chủ hộ (nếu có searchTerm)
      if (searchTerm) {
        data = data.filter(item => 
          (item.ten_chu_ho && item.ten_chu_ho.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.ma_can_ho && item.ma_can_ho.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Filter theo kỳ thanh toán (nếu có)
      if (filterMonth) {
        data = data.filter(item => item.ky_thanh_toan === filterMonth);
      }

      setResults(data);
    } catch (err) {
      setError('Không thể tìm kiếm dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilterMonth('');
    setResults([]);
  };

  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  return (
    <div className={styles.container}>
      <h2>Tra Cứu Khoản Thu</h2>
      
      <div className={styles.searchBox}>
        <div className={styles.searchField}>
          <label>Tìm kiếm (Tên chủ hộ/Mã căn hộ):</label>
          <input
            type="text"
            placeholder="Nhập tên hoặc mã căn hộ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.searchField}>
          <label>Kỳ thanh toán:</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className={styles.select}
          >
            <option value="">Tất cả kỳ</option>
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>

        <button onClick={clearSearch} className={styles.clearBtn}>
          Xóa Bộ Lọc
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.resultsSection}>
        <h3>Kết Quả ({results.length})</h3>
        
        {loading ? (
          <p>Đang tìm kiếm...</p>
        ) : results.length === 0 ? (
          <p className={styles.noResults}>Không tìm thấy kết quả</p>
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
                {results.map(item => {
                  const remaining = (parseFloat(item.so_tien_phai_thu) || 0) - (parseFloat(item.so_tien_da_thu) || 0);
                  const status = remaining <= 0 ? 'Đã thanh toán' : 'Chưa hoàn thành';
                  
                  return (
                    <tr key={item.id}>
                      <td>{item.ma_can_ho}</td>
                      <td>{item.ten_chu_ho}</td>
                      <td>{item.ten_khoan_thu || `Khác ${item.id_khoan_thu}`}</td>
                      <td>{item.ky_thanh_toan}</td>
                      <td>{(parseFloat(item.so_tien_phai_thu) || 0).toLocaleString('vi-VN')} đ</td>
                      <td>{(parseFloat(item.so_tien_da_thu) || 0).toLocaleString('vi-VN')} đ</td>
                      <td style={{ color: remaining > 0 ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                        {remaining.toLocaleString('vi-VN')} đ
                      </td>
                      <td>
                        <span className={`${styles.status} ${remaining <= 0 ? styles.paid : styles.unpaid}`}>
                          {status}
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
