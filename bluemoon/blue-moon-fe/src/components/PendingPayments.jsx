import { useState, useEffect } from 'react';
import { phieuThuService } from '../api/services';
import styles from './PendingPayments.module.css';

function formatCurrency(value) {
  return value == null ? '0 ₫' : value.toLocaleString('vi-VN') + ' ₫';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN');
}

export default function PendingPayments() {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const loadPending = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await phieuThuService.getPending();
      setPendingList(response.data?.data || response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách chờ xác nhận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (id) => {
    if (!confirm('Xác nhận đã nhận được thanh toán cho phiếu thu này?')) return;
    
    setProcessingId(id);
    setError('');
    setSuccess('');
    try {
      await phieuThuService.approve(id);
      setSuccess('Đã xác nhận thanh toán thành công!');
      loadPending();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xác nhận thanh toán');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    
    setProcessingId(id);
    setError('');
    setSuccess('');
    try {
      await phieuThuService.reject(id, rejectReason);
      setSuccess('Đã từ chối xác nhận thanh toán');
      setRejectingId(null);
      setRejectReason('');
      loadPending();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi từ chối');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelReject = () => {
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📋 Xác Nhận Thanh Toán</h2>
        <button onClick={loadPending} className={styles.refreshBtn} disabled={loading}>
          🔄 Làm mới
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.infoBox}>
        <p>💡 Danh sách các phiếu thu mà cư dân đã xác nhận thanh toán và đang chờ ban quản lý kiểm tra.</p>
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải...</div>
      ) : pendingList.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>✅</span>
          <p>Không có phiếu thu nào chờ xác nhận</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã Căn Hộ</th>
                <th>Tên Chủ Hộ</th>
                <th>Khoản Thu</th>
                <th>Kỳ Thanh Toán</th>
                <th>Số Tiền</th>
                <th>Ngày Xác Nhận</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {pendingList.map((item) => (
                <tr key={item.id}>
                  <td className={styles.maCanHo}>{item.ma_can_ho}</td>
                  <td>{item.ten_chu_ho}</td>
                  <td>{item.ten_khoan_thu}</td>
                  <td>{item.ky_thanh_toan}</td>
                  <td className={styles.amount}>{formatCurrency(item.so_tien_phai_thu)}</td>
                  <td>{formatDate(item.ngay_thu)}</td>
                  <td className={styles.actions}>
                    {rejectingId === item.id ? (
                      <div className={styles.rejectForm}>
                        <input
                          type="text"
                          placeholder="Lý do từ chối..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className={styles.rejectInput}
                        />
                        <button
                          onClick={() => handleReject(item.id)}
                          className={styles.confirmRejectBtn}
                          disabled={processingId === item.id}
                        >
                          Xác nhận
                        </button>
                        <button
                          onClick={handleCancelReject}
                          className={styles.cancelBtn}
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(item.id)}
                          className={styles.approveBtn}
                          disabled={processingId === item.id}
                        >
                          ✅ Duyệt
                        </button>
                        <button
                          onClick={() => setRejectingId(item.id)}
                          className={styles.rejectBtn}
                          disabled={processingId === item.id}
                        >
                          ❌ Từ chối
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

      <div className={styles.legend}>
        <h4>Trạng thái phiếu thu:</h4>
        <ul>
          <li><strong>Chờ xác nhận:</strong> Cư dân đã báo thanh toán, cần kiểm tra</li>
          <li><strong>Duyệt:</strong> Xác nhận đã nhận tiền → Phiếu thu chuyển thành "Đã thanh toán"</li>
          <li><strong>Từ chối:</strong> Không xác nhận được giao dịch → Phiếu thu về "Chưa thanh toán"</li>
        </ul>
      </div>
    </div>
  );
}
