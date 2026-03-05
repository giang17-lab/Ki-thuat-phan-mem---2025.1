import { useState, useEffect } from 'react';
import { quyenGopService } from '../api/services';
import styles from './UserCampaigns.module.css';

export default function UserCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [donateAmount, setDonateAmount] = useState('');
  const [donateNote, setDonateNote] = useState('');
  const [showMyDonations, setShowMyDonations] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank'); // 'bank' hoặc 'direct'
  const [showPaymentGuide, setShowPaymentGuide] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchMyDonations();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await quyenGopService.getCampaigns();
      setCampaigns(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải chiến dịch');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDonations = async () => {
    try {
      const res = await quyenGopService.getMyDonations();
      console.log('My donations response:', res);
      setMyDonations(res.data || []);
    } catch (err) {
      console.error('Lỗi tải lịch sử quyên góp:', err);
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    
    if (!donateAmount || Number(donateAmount) <= 0) {
      setError('Vui lòng nhập số tiền > 0');
      return;
    }

    try {
      const note = donateNote || `Quyên góp qua ${paymentMethod === 'bank' ? 'chuyển khoản' : 'nộp trực tiếp'}`;
      await quyenGopService.donate(selectedCampaign.id, Number(donateAmount), note);
      alert('✓ Quyên góp thành công!');
      setDonateAmount('');
      setDonateNote('');
      setSelectedCampaign(null);
      setError('');
      setPaymentMethod('bank');
      fetchCampaigns();
      fetchMyDonations();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi quyên góp');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🤝 Chiến Dịch Quyên Góp</h2>
        <button 
          onClick={() => setShowMyDonations(!showMyDonations)}
          className={styles.btnToggle}
        >
          {showMyDonations ? '← Quay lại' : 'Xem lịch sử quyên góp →'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {showMyDonations ? (
        <div className={styles.donationHistory}>
          <h3>Lịch sử quyên góp của tôi</h3>
          {myDonations.length === 0 ? (
            <p className={styles.empty}>Bạn chưa quyên góp chiến dịch nào</p>
          ) : (
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Tên chiến dịch</th>
                    <th>Số tiền</th>
                    <th>Ghi chú</th>
                    <th>Ngày quyên góp</th>
                  </tr>
                </thead>
                <tbody>
                  {myDonations.map(donation => (
                    <tr key={donation.id}>
                      <td>{donation.campaign_name}</td>
                      <td className={styles.amount}>{Number(donation.so_tien).toLocaleString('vi-VN')} đ</td>
                      <td>{donation.ghi_chu || '-'}</td>
                      <td>{new Date(donation.ngay_quyen_gop).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.total}>
                Tổng đã quyên góp: <strong>{Number(myDonations.reduce((sum, d) => sum + Number(d.so_tien), 0)).toLocaleString('vi-VN')} đ</strong>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {selectedCampaign && (
            <div className={styles.donateForm}>
              <h3>Quyên góp cho: {selectedCampaign.ten}</h3>
              <form onSubmit={handleDonate}>
                <div className={styles.formGroup}>
                  <label>Số tiền (đ) *</label>
                  <input
                    type="number"
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(e.target.value)}
                    placeholder="Nhập số tiền"
                    min="1000"
                    step="1000"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Ghi chú (tùy chọn)</label>
                  <input
                    type="text"
                    value={donateNote}
                    onChange={(e) => setDonateNote(e.target.value)}
                    placeholder="Ví dụ: Quyên góp từ gia đình A101"
                  />
                </div>

                <div className={styles.paymentOptions}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>💳 Chuyển khoản (Quét QR)</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="direct"
                      checked={paymentMethod === 'direct'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>🏪 Nộp trực tiếp</span>
                  </label>
                </div>

                {paymentMethod === 'bank' && (
                  <div className={styles.paymentGuide}>
                    <p className={styles.guideTitle}>Hướng dẫn chuyển khoản:</p>
                    <div className={styles.bankInfo}>
                      <p><strong>Ngân hàng:</strong> Techcombank</p>
                      <p><strong>Số tài khoản:</strong> 19071649369017</p>
                      <p><strong>Chủ tài khoản:</strong> NGUYEN THI HIEN DIEU</p>
                      <p style={{marginTop: '10px', fontSize: '12px', color: '#6b7280'}}>
                        <strong>Nội dung:</strong> Quyên góp chiến dịch "{selectedCampaign.ten}"
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowPaymentGuide(!showPaymentGuide)}
                      className={styles.btnShowQR}
                    >
                      {showPaymentGuide ? '🔼 Ẩn QR' : '📱 Hiển thị QR Code'}
                    </button>
                    {showPaymentGuide && (
                      <div className={styles.qrContainer}>
                        <img 
                          src="https://img.vietqr.io/image/TCB-19071649369017-compact2.png?accountName=NGUYEN%20THI%20HIEN%20DIEU" 
                          alt="QR Thanh toán"
                          className={styles.qrImage}
                        />
                        <p className={styles.qrHint}>Quét mã QR để chuyển khoản nhanh</p>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'direct' && (
                  <div className={styles.paymentGuide}>
                    <p className={styles.guideTitle}>Nộp trực tiếp:</p>
                    <div className={styles.directInfo}>
                      <p>📍 <strong>Địa điểm:</strong> Văn phòng Ban Quản Lý - Tầng 1</p>
                      <p>⏰ <strong>Giờ làm việc:</strong> 8:00 - 17:00 (Thứ 2 - Thứ 6)</p>
                      <p>📞 <strong>Hotline:</strong> 0372779671</p>
                      <p style={{marginTop: '10px', fontSize: '12px', color: '#6b7280'}}>
                        Vui lòng mang theo CCCD/CMND khi nộp tiền trực tiếp
                      </p>
                    </div>
                  </div>
                )}

                <div className={styles.formButtons}>
                  <button type="submit" className={styles.btnDonate}>
                    ✓ Xác nhận quyên góp
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedCampaign(null);
                      setPaymentMethod('bank');
                      setShowPaymentGuide(false);
                    }}
                    className={styles.btnCancel}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div>Đang tải chiến dịch...</div>
          ) : campaigns.length === 0 ? (
            <p className={styles.empty}>Không có chiến dịch nào đang diễn ra</p>
          ) : (
            <div className={styles.campaignList}>
              {campaigns.map(campaign => (
                <div key={campaign.id} className={styles.campaignCard}>
                  <h3>{campaign.ten}</h3>
                  
                  <p className={styles.description}>{campaign.mo_ta}</p>

                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progress}
                      style={{width: `${campaign.percent_done}%`}}
                    />
                  </div>

                  <div className={styles.stats}>
                    <div>
                      <span>Đã quyên: {Number(campaign.so_tien_dat_duoc).toLocaleString('vi-VN')} đ</span>
                      <span>/ {Number(campaign.muc_tieu).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div>
                      Tiến độ: <strong>{campaign.percent_done}%</strong>
                    </div>
                  </div>

                  <div className={styles.dates}>
                    {new Date(campaign.ngay_bat_dau).toLocaleDateString('vi-VN')} - {new Date(campaign.ngay_ket_thuc).toLocaleDateString('vi-VN')}
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setPaymentMethod('bank');
                    }}
                    className={styles.btnDonateNow}
                  >
                    Quyên góp
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
