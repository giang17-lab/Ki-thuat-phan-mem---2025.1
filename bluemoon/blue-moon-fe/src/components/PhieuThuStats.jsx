import { useState, useEffect } from 'react';
import { phieuThuService } from '../api/services';
import styles from './PhieuThuStats.module.css';

export default function PhieuThuStats() {
  const [stats, setStats] = useState({
    totalReceipts: 0,
    totalDue: 0,
    totalPaid: 0,
    totalRemaining: 0,
    paidPercentage: 0,
    unpaidCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2025-01');
  const [allReceipts, setAllReceipts] = useState([]);
  const [feeStats, setFeeStats] = useState([]); // aggregated per fee
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderFee, setReminderFee] = useState(null);
  const [reminderMessage, setReminderMessage] = useState('');

  useEffect(() => {
    fetchStats();
  }, [selectedMonth]);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      // Lấy tất cả phiếu thu
      const response = await fetch('http://localhost:3000/api/phieuthu/all');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      let receipts = result.data || [];

      // Lọc theo tháng nếu chọn
      if (selectedMonth) {
        receipts = receipts.filter(r => r.ky_thanh_toan === selectedMonth);
      }

      if (receipts.length === 0) {
        setStats({
          totalReceipts: 0,
          totalDue: 0,
          totalPaid: 0,
          totalRemaining: 0,
          paidPercentage: 0,
          unpaidCount: 0,
        });
        setFeeStats([]);
        setLoading(false);
        return;
      }

      const totalReceipts = receipts.length;
      const totalDue = receipts.reduce((sum, r) => sum + (parseFloat(r.so_tien_phai_thu) || 0), 0);
      const totalPaid = receipts.reduce((sum, r) => sum + (parseFloat(r.so_tien_da_thu) || 0), 0);
      const totalRemaining = totalDue - totalPaid;
      const paidPercentage = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
      const unpaidCount = receipts.filter(r => parseFloat(r.so_tien_da_thu) < parseFloat(r.so_tien_phai_thu)).length;

      setStats({
        totalReceipts,
        totalDue,
        totalPaid,
        totalRemaining,
        paidPercentage,
        unpaidCount,
      });
      
      // Lưu receipts để sử dụng cho lọc
      setAllReceipts(receipts);

      // Tính thống kê theo từng khoản thu (chỉ lấy phiếu có tên khoản thu hợp lệ)
      const byFee = new Map();
      receipts.forEach(r => {
        // Bỏ qua phiếu thu không có tên khoản thu hợp lệ
        const tenKhoanThu = r.ten_khoan_thu;
        if (tenKhoanThu === null || tenKhoanThu === undefined || String(tenKhoanThu).trim() === '') return;
        
        const key = String(tenKhoanThu).trim();
        const due = parseFloat(r.so_tien_phai_thu) || 0;
        const paid = parseFloat(r.so_tien_da_thu) || 0;
        const remaining = due - paid;
        const item = byFee.get(key) || { ten: key, count: 0, totalDue: 0, totalPaid: 0, totalRemaining: 0, unpaidCount: 0 };
        item.count += 1;
        item.totalDue += due;
        item.totalPaid += paid;
        item.totalRemaining += remaining;
        if (remaining > 0) item.unpaidCount += 1;
        byFee.set(key, item);
      });
      setFeeStats(Array.from(byFee.values()));
    } catch (err) {
      setError('Không thể tải thống kê');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mở modal nhắc nhở đóng tiền
  const openReminderModal = (fee) => {
    setReminderFee(fee);
    setReminderMessage(`Kính gửi Quý cư dân,\n\nBan quản lý chung cư Blue Moon xin nhắc nhở về khoản thu "${fee.ten}" tháng ${selectedMonth}.\n\nNội dung: Mã căn hộ + Tên chủ hộ + Tên khoản thu\n\nVui lòng thanh toán trong thời gian sớm nhất.\n\nTrân trọng!`);
    setShowReminderModal(true);
  };

  // Gửi nhắc nhở
  const handleSendReminder = () => {
    if (!reminderMessage.trim()) {
      alert('Vui lòng nhập nội dung nhắc nhở');
      return;
    }
    alert(`✅ Đã gửi nhắc nhở đến ${reminderFee?.unpaidCount} hộ chưa thanh toán "${reminderFee?.ten}"!\n\nNội dung:\n${reminderMessage}`);
    setShowReminderModal(false);
    setReminderFee(null);
    setReminderMessage('');
  };

  if (loading) return <div className={styles.container}><p>Đang tải dữ liệu...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Thống Kê Khoản Thu</h2>
        <div className={styles.dateFilter}>
          <label>Chọn tháng và năm:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={styles.monthInput}
          />
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tổng Phiếu Thu</div>
          <div className={styles.statValue}>{stats.totalReceipts}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tổng Tiền Phải Thu</div>
          <div className={styles.statValue}>
            {stats.totalDue.toLocaleString('vi-VN')} đ
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tổng Tiền Đã Thu</div>
          <div className={styles.statValue} style={{ color: '#28a745' }}>
            {stats.totalPaid.toLocaleString('vi-VN')} đ
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Còn Phải Thu</div>
          <div className={styles.statValue} style={{ color: '#dc3545' }}>
            {stats.totalRemaining.toLocaleString('vi-VN')} đ
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tỷ Lệ Thanh Toán</div>
          <div className={styles.statValue} style={{ color: '#007bff' }}>
            {stats.paidPercentage}%
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Chưa Thanh Toán</div>
          <div 
            className={styles.statValue} 
            style={{ color: '#ff6b6b' }}
          >
            {stats.unpaidCount}
          </div>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progress} style={{ width: `${stats.paidPercentage}%` }}>
          {stats.paidPercentage > 0 && <span>{stats.paidPercentage}%</span>}
        </div>
      </div>

      {/* Bảng thống kê theo khoản thu */}
      <div className={styles.feeStats}>
        <h3>Thống kê theo khoản thu</h3>
        {feeStats.length === 0 ? (
          <p>Không có dữ liệu cho tháng này.</p>
        ) : (
          <table className={styles.feeTable}>
            <thead>
              <tr>
                <th>Khoản thu</th>
                <th>Số phiếu</th>
                <th>Tổng phải thu</th>
                <th>Tổng đã thu</th>
                <th>Còn lại</th>
                <th>Chưa thanh toán</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {feeStats.filter(f => f.ten && f.ten.trim() !== '').map((f, idx) => (
                <tr key={idx}>
                  <td>{f.ten}</td>
                  <td>{f.count}</td>
                  <td>{f.totalDue.toLocaleString('vi-VN')} đ</td>
                  <td>{f.totalPaid.toLocaleString('vi-VN')} đ</td>
                  <td>{f.totalRemaining.toLocaleString('vi-VN')} đ</td>
                  <td>{f.unpaidCount}</td>
                  <td>
                    {f.unpaidCount > 0 && (
                      <button
                        onClick={() => openReminderModal(f)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        🔔 Nhắc nhở
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nhắc Nhở Đóng Tiền */}
      {showReminderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '550px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '20px 25px',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🔔 Nhắc Nhở Đóng Tiền
              </h3>
              <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '14px' }}>
                Khoản thu: {reminderFee?.ten} - Tháng {selectedMonth}
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '25px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '15px', 
                marginBottom: '20px' 
              }}>
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: '#fef3c7', 
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#d97706' }}>
                    {reminderFee?.unpaidCount}
                  </div>
                  <div style={{ fontSize: '13px', color: '#92400e' }}>Hộ chưa thanh toán</div>
                </div>
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: '#fee2e2', 
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                    {reminderFee?.totalRemaining.toLocaleString('vi-VN')} đ
                  </div>
                  <div style={{ fontSize: '13px', color: '#991b1b' }}>Tổng còn lại</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  Nội dung nhắc nhở:
                </label>
                <textarea
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '180px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px',
                    resize: 'vertical',
                    lineHeight: '1.6'
                  }}
                  placeholder="Nhập nội dung nhắc nhở..."
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              padding: '15px 25px', 
              backgroundColor: '#f8fafc', 
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => { setShowReminderModal(false); setReminderFee(null); setReminderMessage(''); }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  color: '#666',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSendReminder}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📤 Gửi Nhắc Nhở ({reminderFee?.unpaidCount} hộ)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
