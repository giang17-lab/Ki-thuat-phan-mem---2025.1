import { useState } from 'react';
import styles from './BillingManager.module.css';
import { billingService } from '../api/services';

function formatCurrency(v) {
  return v == null ? '0' : v.toLocaleString('vi-VN') + ' ₫';
}

export default function BillingManager() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const [month, setMonth] = useState(defaultMonth);
  const [items, setItems] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePreview = async () => {
    setLoading(true); setError('');
    try {
      const res = await billingService.preview(month);
      const data = res.data?.data || res.data || {};
      setItems(data.items || []);
      setTotals(data.totals || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lấy dữ liệu');
    } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!confirm('Tạo và lưu phiếu thu cho tất cả hộ trong tháng ' + month + '?')) return;
    setSaving(true); setError('');
    try {
      const body = { month, additionalFeesByHousehold: [], save: true };
      const res = await billingService.generate(body);
      alert(`Tạo xong (${res.data.insertedCount || 0} phiếu thu)`);
      handlePreview();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tạo phiếu thu');
    } finally { setSaving(false); }
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <label>Chọn tháng: <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
        <button onClick={handlePreview} disabled={loading} className={styles.previewBtn}>Xem trước</button>
        <button onClick={handleGenerate} disabled={saving || items.length===0} className={styles.generateBtn}>Tạo & Lưu</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? <div>Đang lấy dữ liệu...</div> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Chủ hộ</th>
                <th>Xe máy</th>
                <th>Ô tô</th>
                <th>Phí gửi xe</th>
                <th>Phụ phí</th>
                <th>Tổng</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.ma_can_ho}>
                  <td>{it.ma_can_ho}</td>
                  <td>{it.ten_chu_ho}</td>
                  <td>{it.motorbikes}</td>
                  <td>{it.cars}</td>
                  <td>{formatCurrency(it.parking_fee)}</td>
                  <td>{formatCurrency((it.additional?.dien||0)+(it.additional?.nuoc||0)+(it.additional?.internet||0))}</td>
                  <td>{formatCurrency(it.total_due)}</td>
                </tr>
              ))}
            </tbody>
            {items.length>0 && (
              <tfoot>
                <tr>
                  <td colSpan={4}>Tổng</td>
                  <td>{formatCurrency((totals && totals.total_parking) || items.reduce((s,i)=>s+(i.parking_fee||0),0))}</td>
                  <td>-</td>
                  <td>{formatCurrency((totals && totals.total_due) || items.reduce((s,i)=>s+(i.total_due||0),0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
