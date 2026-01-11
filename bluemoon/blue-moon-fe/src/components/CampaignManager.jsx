import { useState, useEffect } from 'react';
import { quyenGopService } from '../api/services';
import styles from './CampaignManager.module.css';

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    ten: '',
    mo_ta: '',
    muc_tieu: '',
    ngay_bat_dau: '',
    ngay_ket_thuc: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await quyenGopService.getAllCampaigns();
      console.log('API Response:', res);
      setCampaigns(res.data || []);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.response?.data?.message || 'Không thể tải chiến dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ten || !formData.ngay_bat_dau || !formData.ngay_ket_thuc) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await quyenGopService.createCampaign(
        formData.ten,
        formData.mo_ta,
        formData.muc_tieu,
        formData.ngay_bat_dau,
        formData.ngay_ket_thuc
      );
      setError('');
      setFormData({ ten: '', mo_ta: '', muc_tieu: '', ngay_bat_dau: '', ngay_ket_thuc: '' });
      setShowForm(false);
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tạo chiến dịch');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xác nhận xóa chiến dịch?')) return;
    try {
      await quyenGopService.deleteCampaign(id);
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Quản Lý Chiến Dịch Quyên Góp</h2>
      
      {error && <div className={styles.error}>{error}</div>}

      <button 
        onClick={() => setShowForm(!showForm)} 
        className={styles.btnCreate}
      >
        {showForm ? 'Hủy' : '+ Tạo chiến dịch mới'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Tên chiến dịch *</label>
            <input
              type="text"
              value={formData.ten}
              onChange={(e) => setFormData({...formData, ten: e.target.value})}
              placeholder="Ví dụ: Sửa chữa thang máy"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mô tả</label>
            <textarea
              value={formData.mo_ta}
              onChange={(e) => setFormData({...formData, mo_ta: e.target.value})}
              placeholder="Mô tả chi tiết về chiến dịch"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Mục tiêu (đ)</label>
              <input
                type="number"
                value={formData.muc_tieu}
                onChange={(e) => setFormData({...formData, muc_tieu: e.target.value})}
                placeholder="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Ngày bắt đầu *</label>
              <input
                type="date"
                value={formData.ngay_bat_dau}
                onChange={(e) => setFormData({...formData, ngay_bat_dau: e.target.value})}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Ngày kết thúc *</label>
              <input
                type="date"
                value={formData.ngay_ket_thuc}
                onChange={(e) => setFormData({...formData, ngay_ket_thuc: e.target.value})}
              />
            </div>
          </div>

          <button type="submit" className={styles.btnSubmit}>Tạo chiến dịch</button>
        </form>
      )}

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className={styles.campaignList}>
          {campaigns.map(campaign => (
            <div key={campaign.id} className={styles.campaignCard}>
              <h3>{campaign.ten}</h3>
              <p className={styles.description}>{campaign.mo_ta}</p>
              
              <div className={styles.progressBar}>
                <div 
                  className={styles.progress}
                  style={{width: campaign.muc_tieu > 0 ? `${Math.min((campaign.so_tien_dat_duoc / campaign.muc_tieu) * 100, 100)}%` : '0%'}}
                />
              </div>

              <div className={styles.stats}>
                <div>Đã quyên: {Number(campaign.so_tien_dat_duoc).toLocaleString('vi-VN')} đ</div>
                <div>Mục tiêu: {Number(campaign.muc_tieu).toLocaleString('vi-VN')} đ</div>
                <div>Trạng thái: <span className={styles[campaign.trang_thai]}>{campaign.trang_thai}</span></div>
              </div>

              <button onClick={() => window.location.href = `/campaign/${campaign.id}`} className={styles.btnView}>
                Chi tiết & Quản lý
              </button>

              <button 
                onClick={() => handleDelete(campaign.id)} 
                className={styles.btnDelete}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
