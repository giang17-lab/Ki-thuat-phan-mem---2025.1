import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestsService, gopyService, authService } from '../api/services';
import styles from './UserDashboard.module.css';

export function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  
  // Thông tin hộ gia đình
  const [hoGiaDinh, setHoGiaDinh] = useState(null);
  const [nhanKhauList, setNhanKhauList] = useState([]);
  const [xeCoList, setXeCoList] = useState([]);
  const [phieuThuList, setPhieuThuList] = useState([]);
  
  // Yêu cầu của user
  const [myRequests, setMyRequests] = useState({ vehicles: [], residents: [] });
  
  // Góp ý
  const [myFeedback, setMyFeedback] = useState([]);
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    tieu_de: '',
    noi_dung: '',
    loai_gop_y: 'gop_y'
  });
  
  // Form thêm xe/nhân khẩu
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddResident, setShowAddResident] = useState(false);
  
  const [vehicleData, setVehicleData] = useState({
    bien_so: '',
    loai_xe: 'Ô tô',
    mo_ta: ''
  });

  const [residentData, setResidentData] = useState({
    ho_ten: '',
    quan_he: 'Con',
    ngay_sinh: '',
    gioi_tinh: 'Nam',
    cccd: '',
    mo_ta: ''
  });

  const { user, logout } = useAuth();

  // Load tất cả dữ liệu
  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load thông tin hộ gia đình
      const hoRes = await authService.getMyHousehold();
      if (hoRes.data) {
        setHoGiaDinh(hoRes.data.hoGiaDinh);
        setNhanKhauList(hoRes.data.nhanKhau || []);
        setXeCoList(hoRes.data.xeCo || []);
        setPhieuThuList(hoRes.data.phieuThu || []);
      }
      
      // Load yêu cầu
      const reqRes = await requestsService.getMyRequests();
      setMyRequests(reqRes.data || { vehicles: [], residents: [] });
      
      // Load góp ý
      const fbRes = await gopyService.getMyFeedback();
      setMyFeedback(fbRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      // Không hiện lỗi nếu chỉ là chưa có hộ gia đình
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers
  const handleAddVehicle = async () => {
    if (!vehicleData.bien_so.trim() || !vehicleData.loai_xe.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await requestsService.requestVehicle(
        vehicleData.bien_so,
        vehicleData.loai_xe,
        hoGiaDinh?.id || null,
        vehicleData.mo_ta
      );
      setSuccess('✅ Yêu cầu thêm xe đã được gửi cho admin. Vui lòng chờ phê duyệt!');
      setVehicleData({ bien_so: '', loai_xe: 'Ô tô', mo_ta: '' });
      setShowAddVehicle(false);
      loadAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi gửi yêu cầu');
    }
  };

  const handleAddResident = async () => {
    if (!residentData.ho_ten.trim() || !residentData.quan_he.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await requestsService.requestResident(
        residentData.ho_ten,
        residentData.quan_he,
        hoGiaDinh?.id || null,
        residentData.ngay_sinh || null,
        residentData.gioi_tinh || null,
        residentData.cccd || null,
        residentData.mo_ta || null
      );
      setSuccess('✅ Yêu cầu thêm nhân khẩu đã được gửi cho admin. Vui lòng chờ phê duyệt!');
      setResidentData({
        ho_ten: '',
        quan_he: 'Con',
        ngay_sinh: '',
        gioi_tinh: 'Nam',
        cccd: '',
        mo_ta: ''
      });
      setShowAddResident(false);
      loadAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi gửi yêu cầu');
    }
  };

  const handleAddFeedback = async () => {
    if (!feedbackData.tieu_de.trim() || !feedbackData.noi_dung.trim()) {
      alert('Vui lòng điền đầy đủ tiêu đề và nội dung');
      return;
    }

    try {
      await gopyService.create(
        feedbackData.tieu_de,
        feedbackData.noi_dung,
        feedbackData.loai_gop_y
      );
      setSuccess('✅ Góp ý đã được gửi thành công!');
      setFeedbackData({ tieu_de: '', noi_dung: '', loai_gop_y: 'gop_y' });
      setShowAddFeedback(false);
      loadAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi gửi góp ý');
    }
  };

  const handleCloseForm = () => {
    setShowAddVehicle(false);
    setShowAddResident(false);
    setShowAddFeedback(false);
    setError('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
      case 'moi':
        return <span className={styles.badgePending}>⏳ Chờ xử lý</span>;
      case 'approved':
      case 'da_xu_ly':
        return <span className={styles.badgeApproved}>✅ Đã xử lý</span>;
      case 'rejected':
      case 'tu_choi':
        return <span className={styles.badgeRejected}>❌ Từ chối</span>;
      case 'dang_xu_ly':
        return <span className={styles.badgeProcessing}>🔄 Đang xử lý</span>;
      default:
        return <span className={styles.badgePending}>{status}</span>;
    }
  };

  const getPaymentStatus = (da_thu) => {
    return da_thu ? 
      <span className={styles.badgeApproved}>✅ Đã thanh toán</span> : 
      <span className={styles.badgeRejected}>❌ Chưa thanh toán</span>;
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Tính tổng tiền chưa thanh toán
  const unpaidTotal = phieuThuList
    .filter(p => !p.da_thu)
    .reduce((sum, p) => sum + (parseFloat(p.so_tien_phai_thu) || 0), 0);

  const pendingRequestsCount = 
    (myRequests.vehicles?.filter(r => r.trang_thai === 'pending').length || 0) +
    (myRequests.residents?.filter(r => r.trang_thai === 'pending').length || 0);

  return (
    <div className={styles.dashboard}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarContent}>
          <div className={styles.contactInfo}>
            <span>📞 Hotline: 1900-xxxx</span>
            <span>✉️ support@bluemoon.vn</span>
          </div>
          <div className={styles.userInfo}>
            <span>👤 Xin chào, <strong>{user?.ten_nguoi_dung || user?.username}</strong></span>
            {hoGiaDinh && <span>🏠 Căn hộ: <strong>{hoGiaDinh.ma_can_ho}</strong></span>}
            <button onClick={logout} className={styles.logoutBtn}>Đăng Xuất</button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="BlueMoon" />
            <span>BlueMoon</span>
          </div>
          <div className={styles.navLinks}>
            <button 
              className={activeTab === 'home' ? styles.navActive : ''} 
              onClick={() => setActiveTab('home')}
            >
              🏠 Trang Chủ
            </button>
            <button 
              className={activeTab === 'household' ? styles.navActive : ''} 
              onClick={() => setActiveTab('household')}
            >
              👨‍👩‍👧‍👦 Hộ Gia Đình
            </button>
            <button 
              className={activeTab === 'fees' ? styles.navActive : ''} 
              onClick={() => setActiveTab('fees')}
            >
              💰 Phí & Thanh Toán
            </button>
            <button 
              className={activeTab === 'requests' ? styles.navActive : ''} 
              onClick={() => setActiveTab('requests')}
            >
              📝 Yêu Cầu {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
            </button>
            <button 
              className={activeTab === 'feedback' ? styles.navActive : ''} 
              onClick={() => setActiveTab('feedback')}
            >
              💬 Góp Ý
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* Tab: Trang Chủ */}
            {activeTab === 'home' && (
              <div className={styles.homeTab}>
                <div className={styles.welcomeBanner}>
                  <h1>👋 Chào mừng, {user?.ten_nguoi_dung || user?.username}!</h1>
                  <p>Quản lý thông tin căn hộ và các dịch vụ của bạn tại đây.</p>
                </div>

                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>🏠</div>
                    <div className={styles.statInfo}>
                      <h3>{hoGiaDinh?.ma_can_ho || 'Chưa có'}</h3>
                      <p>Căn hộ</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statInfo}>
                      <h3>{nhanKhauList.length}</h3>
                      <p>Nhân khẩu</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>🚗</div>
                    <div className={styles.statInfo}>
                      <h3>{xeCoList.length}</h3>
                      <p>Phương tiện</p>
                    </div>
                  </div>
                  <div className={`${styles.statCard} ${unpaidTotal > 0 ? styles.statWarning : ''}`}>
                    <div className={styles.statIcon}>💰</div>
                    <div className={styles.statInfo}>
                      <h3>{formatCurrency(unpaidTotal)}</h3>
                      <p>Chưa thanh toán</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.quickActions}>
                  <h2>⚡ Thao Tác Nhanh</h2>
                  <div className={styles.actionGrid}>
                    <button onClick={() => { setActiveTab('requests'); setShowAddVehicle(true); }} className={styles.actionBtn}>
                      <span className={styles.actionIcon}>🚗</span>
                      <span>Đăng ký xe mới</span>
                    </button>
                    <button onClick={() => { setActiveTab('requests'); setShowAddResident(true); }} className={styles.actionBtn}>
                      <span className={styles.actionIcon}>👤</span>
                      <span>Thêm nhân khẩu</span>
                    </button>
                    <button onClick={() => { setActiveTab('feedback'); setShowAddFeedback(true); }} className={styles.actionBtn}>
                      <span className={styles.actionIcon}>💬</span>
                      <span>Gửi góp ý</span>
                    </button>
                    <button onClick={() => setActiveTab('fees')} className={styles.actionBtn}>
                      <span className={styles.actionIcon}>📋</span>
                      <span>Xem hóa đơn</span>
                    </button>
                  </div>
                </div>

                {/* Thông báo quan trọng */}
                {unpaidTotal > 0 && (
                  <div className={styles.alertBox}>
                    <h3>⚠️ Bạn có khoản phí chưa thanh toán</h3>
                    <p>Tổng số tiền: <strong>{formatCurrency(unpaidTotal)}</strong></p>
                    <button onClick={() => setActiveTab('fees')} className={styles.primaryBtn}>
                      Xem chi tiết
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Hộ Gia Đình */}
            {activeTab === 'household' && (
              <div className={styles.householdTab}>
                <h2>👨‍👩‍👧‍👦 Thông Tin Hộ Gia Đình</h2>
                
                {hoGiaDinh ? (
                  <>
                    {/* Thông tin căn hộ */}
                    <div className={styles.infoCard}>
                      <h3>🏠 Thông Tin Căn Hộ</h3>
                      <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                          <label>Mã căn hộ:</label>
                          <span>{hoGiaDinh.ma_can_ho}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Chủ hộ:</label>
                          <span>{hoGiaDinh.ten_chu_ho}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Diện tích:</label>
                          <span>{hoGiaDinh.dien_tich} m²</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Ngày chuyển đến:</label>
                          <span>{formatDate(hoGiaDinh.ngay_chuyen_den)}</span>
                        </div>
                        {hoGiaDinh.cccd && (
                          <div className={styles.infoItem}>
                            <label>CCCD chủ hộ:</label>
                            <span>{hoGiaDinh.cccd}</span>
                          </div>
                        )}
                        {hoGiaDinh.sdt && (
                          <div className={styles.infoItem}>
                            <label>Số điện thoại:</label>
                            <span>{hoGiaDinh.sdt}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Danh sách nhân khẩu */}
                    <div className={styles.infoCard}>
                      <div className={styles.cardHeader}>
                        <h3>👥 Danh Sách Nhân Khẩu ({nhanKhauList.length})</h3>
                        <button onClick={() => setShowAddResident(true)} className={styles.addBtnSmall}>
                          + Thêm mới
                        </button>
                      </div>
                      {nhanKhauList.length > 0 ? (
                        <div className={styles.tableWrapper}>
                          <table className={styles.dataTable}>
                            <thead>
                              <tr>
                                <th>Họ Tên</th>
                                <th>Quan Hệ</th>
                                <th>Ngày Sinh</th>
                                <th>Giới Tính</th>
                                <th>CCCD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {nhanKhauList.map((nk, idx) => (
                                <tr key={nk.id || idx}>
                                  <td><strong>{nk.ho_ten}</strong></td>
                                  <td>{nk.quan_he}</td>
                                  <td>{formatDate(nk.ngay_sinh)}</td>
                                  <td>{nk.gioi_tinh || 'N/A'}</td>
                                  <td>{nk.cccd || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className={styles.noData}>Chưa có thông tin nhân khẩu</p>
                      )}
                    </div>

                    {/* Danh sách xe */}
                    <div className={styles.infoCard}>
                      <div className={styles.cardHeader}>
                        <h3>🚗 Danh Sách Phương Tiện ({xeCoList.length})</h3>
                        <button onClick={() => setShowAddVehicle(true)} className={styles.addBtnSmall}>
                          + Đăng ký xe
                        </button>
                      </div>
                      {xeCoList.length > 0 ? (
                        <div className={styles.tableWrapper}>
                          <table className={styles.dataTable}>
                            <thead>
                              <tr>
                                <th>Biển Số</th>
                                <th>Loại Xe</th>
                                <th>Ngày Đăng Ký</th>
                              </tr>
                            </thead>
                            <tbody>
                              {xeCoList.map((xe, idx) => (
                                <tr key={xe.id || idx}>
                                  <td><strong>{xe.bien_so}</strong></td>
                                  <td>{xe.loai_xe}</td>
                                  <td>{formatDate(xe.ngay_dang_ky)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className={styles.noData}>Chưa có phương tiện đăng ký</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className={styles.noHousehold}>
                    <div className={styles.noHouseholdIcon}>🏠</div>
                    <h3>Chưa có thông tin hộ gia đình</h3>
                    <p>Tài khoản của bạn chưa được liên kết với căn hộ nào.</p>
                    <p>Vui lòng liên hệ Ban Quản Lý để được hỗ trợ.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Phí & Thanh Toán */}
            {activeTab === 'fees' && (
              <div className={styles.feesTab}>
                <h2>💰 Phí & Thanh Toán</h2>
                
                {/* Tổng quan */}
                <div className={styles.feesSummary}>
                  <div className={styles.summaryCard}>
                    <h4>Tổng phí chưa thanh toán</h4>
                    <p className={styles.amountLarge}>{formatCurrency(unpaidTotal)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Số hóa đơn chưa thanh toán</h4>
                    <p className={styles.amountLarge}>{phieuThuList.filter(p => !p.da_thu).length}</p>
                  </div>
                </div>

                {/* Danh sách hóa đơn */}
                <div className={styles.infoCard}>
                  <h3>📋 Danh Sách Hóa Đơn</h3>
                  {phieuThuList.length > 0 ? (
                    <div className={styles.tableWrapper}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Khoản Thu</th>
                            <th>Kỳ Thanh Toán</th>
                            <th>Số Tiền</th>
                            <th>Trạng Thái</th>
                            <th>Ngày Thu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {phieuThuList.map((pt, idx) => (
                            <tr key={pt.id || idx} className={!pt.da_thu ? styles.unpaidRow : ''}>
                              <td><strong>{pt.ten_khoan_thu || `Khoản thu #${pt.id_khoan_thu}`}</strong></td>
                              <td>{pt.ky_thanh_toan}</td>
                              <td className={styles.amount}>{formatCurrency(pt.so_tien_phai_thu)}</td>
                              <td>{getPaymentStatus(pt.da_thu)}</td>
                              <td>{pt.ngay_thu ? formatDate(pt.ngay_thu) : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className={styles.noData}>Không có hóa đơn nào</p>
                  )}
                </div>

                {/* Hướng dẫn thanh toán */}
                <div className={styles.paymentGuide}>
                  <h3>📌 Hướng Dẫn Thanh Toán</h3>
                  <ul>
                    <li>Thanh toán trực tiếp tại văn phòng Ban Quản Lý (Tầng 1)</li>
                    <li>Chuyển khoản qua số tài khoản: <strong>0123456789 - Ngân hàng ABC</strong></li>
                    <li>Nội dung: <strong>{hoGiaDinh?.ma_can_ho || 'Mã căn hộ'} - Họ tên</strong></li>
                    <li>Liên hệ hotline: <strong>1900-xxxx</strong> nếu cần hỗ trợ</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab: Yêu Cầu */}
            {activeTab === 'requests' && (
              <div className={styles.requestsTab}>
                <h2>📝 Yêu Cầu Của Tôi</h2>
                
                <div className={styles.requestActions}>
                  <button onClick={() => setShowAddVehicle(true)} className={styles.primaryBtn}>
                    🚗 Đăng Ký Xe Mới
                  </button>
                  <button onClick={() => setShowAddResident(true)} className={styles.primaryBtn}>
                    👤 Thêm Nhân Khẩu
                  </button>
                </div>

                {/* Yêu cầu thêm xe */}
                <div className={styles.infoCard}>
                  <h3>🚗 Yêu Cầu Đăng Ký Xe ({myRequests.vehicles?.length || 0})</h3>
                  {myRequests.vehicles && myRequests.vehicles.length > 0 ? (
                    <div className={styles.requestsList}>
                      {myRequests.vehicles.map((request) => (
                        <div key={request.id} className={styles.requestItem}>
                          <div className={styles.requestInfo}>
                            <p><strong>Biển số:</strong> {request.bien_so}</p>
                            <p><strong>Loại xe:</strong> {request.loai_xe}</p>
                            {request.mo_ta && <p><strong>Mô tả:</strong> {request.mo_ta}</p>}
                          </div>
                          <div className={styles.requestMeta}>
                            {getStatusBadge(request.trang_thai)}
                            {request.ly_do_tu_choi && (
                              <p className={styles.rejectReason}>
                                <strong>Lý do:</strong> {request.ly_do_tu_choi}
                              </p>
                            )}
                            <p className={styles.requestDate}>
                              Gửi: {new Date(request.created_at).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noData}>Chưa có yêu cầu đăng ký xe</p>
                  )}
                </div>

                {/* Yêu cầu thêm nhân khẩu */}
                <div className={styles.infoCard}>
                  <h3>👥 Yêu Cầu Thêm Nhân Khẩu ({myRequests.residents?.length || 0})</h3>
                  {myRequests.residents && myRequests.residents.length > 0 ? (
                    <div className={styles.requestsList}>
                      {myRequests.residents.map((request) => (
                        <div key={request.id} className={styles.requestItem}>
                          <div className={styles.requestInfo}>
                            <p><strong>Họ tên:</strong> {request.ho_ten}</p>
                            <p><strong>Quan hệ:</strong> {request.quan_he}</p>
                            {request.ngay_sinh && <p><strong>Ngày sinh:</strong> {formatDate(request.ngay_sinh)}</p>}
                          </div>
                          <div className={styles.requestMeta}>
                            {getStatusBadge(request.trang_thai)}
                            {request.ly_do_tu_choi && (
                              <p className={styles.rejectReason}>
                                <strong>Lý do:</strong> {request.ly_do_tu_choi}
                              </p>
                            )}
                            <p className={styles.requestDate}>
                              Gửi: {new Date(request.created_at).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noData}>Chưa có yêu cầu thêm nhân khẩu</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Góp Ý */}
            {activeTab === 'feedback' && (
              <div className={styles.feedbackTab}>
                <h2>💬 Góp Ý & Phản Hồi</h2>
                
                <div className={styles.feedbackActions}>
                  <button onClick={() => setShowAddFeedback(true)} className={styles.primaryBtn}>
                    ✍️ Gửi Góp Ý Mới
                  </button>
                </div>

                <div className={styles.infoCard}>
                  <h3>📋 Lịch Sử Góp Ý ({myFeedback.length})</h3>
                  {myFeedback.length > 0 ? (
                    <div className={styles.feedbackList}>
                      {myFeedback.map((fb) => (
                        <div key={fb.id} className={styles.feedbackItem}>
                          <div className={styles.feedbackHeader}>
                            <h4>{fb.tieu_de}</h4>
                            {getStatusBadge(fb.trang_thai)}
                          </div>
                          <div className={styles.feedbackType}>
                            {fb.loai_gop_y === 'khieu_nai' ? '⚠️ Khiếu nại' : 
                             fb.loai_gop_y === 'de_xuat' ? '💡 Đề xuất' : '📝 Góp ý'}
                          </div>
                          <p className={styles.feedbackContent}>{fb.noi_dung}</p>
                          {fb.phan_hoi && (
                            <div className={styles.adminResponse}>
                              <strong>📩 Phản hồi từ BQL:</strong>
                              <p>{fb.phan_hoi}</p>
                            </div>
                          )}
                          <p className={styles.feedbackDate}>
                            Gửi: {new Date(fb.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noData}>Bạn chưa gửi góp ý nào</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Thêm Xe */}
      {showAddVehicle && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>🚗 Đăng Ký Xe Mới</h3>
            <div className={styles.formGroup}>
              <label>Biển Số *</label>
              <input 
                type="text" 
                placeholder="VD: 29-A12345"
                value={vehicleData.bien_so}
                onChange={(e) => setVehicleData({...vehicleData, bien_so: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Loại Xe *</label>
              <select
                value={vehicleData.loai_xe}
                onChange={(e) => setVehicleData({...vehicleData, loai_xe: e.target.value})}
              >
                <option>Ô tô</option>
                <option>Xe máy</option>
                <option>Xe đạp</option>
                <option>Xe đạp điện</option>
                <option>Khác</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Mô Tả (tùy chọn)</label>
              <textarea
                placeholder="Màu sắc, hãng xe, ghi chú..."
                value={vehicleData.mo_ta}
                onChange={(e) => setVehicleData({...vehicleData, mo_ta: e.target.value})}
                rows="3"
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.submitBtn} onClick={handleAddVehicle}>
                Gửi Yêu Cầu
              </button>
              <button className={styles.cancelBtn} onClick={handleCloseForm}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thêm Nhân Khẩu */}
      {showAddResident && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>👤 Thêm Nhân Khẩu Mới</h3>
            <div className={styles.formGroup}>
              <label>Họ Tên *</label>
              <input 
                type="text" 
                placeholder="Nhập họ tên đầy đủ"
                value={residentData.ho_ten}
                onChange={(e) => setResidentData({...residentData, ho_ten: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Quan Hệ Với Chủ Hộ *</label>
              <select
                value={residentData.quan_he}
                onChange={(e) => setResidentData({...residentData, quan_he: e.target.value})}
              >
                <option>Vợ/Chồng</option>
                <option>Con</option>
                <option>Cha/Mẹ</option>
                <option>Anh/Chị/Em</option>
                <option>Ông/Bà</option>
                <option>Cháu</option>
                <option>Khác</option>
              </select>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Ngày Sinh</label>
                <input 
                  type="date"
                  value={residentData.ngay_sinh}
                  onChange={(e) => setResidentData({...residentData, ngay_sinh: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Giới Tính</label>
                <select
                  value={residentData.gioi_tinh}
                  onChange={(e) => setResidentData({...residentData, gioi_tinh: e.target.value})}
                >
                  <option>Nam</option>
                  <option>Nữ</option>
                </select>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Số CCCD</label>
              <input 
                type="text" 
                placeholder="Nhập số CCCD (nếu có)"
                value={residentData.cccd}
                onChange={(e) => setResidentData({...residentData, cccd: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Ghi Chú</label>
              <textarea
                placeholder="Thông tin bổ sung..."
                value={residentData.mo_ta}
                onChange={(e) => setResidentData({...residentData, mo_ta: e.target.value})}
                rows="2"
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.submitBtn} onClick={handleAddResident}>
                Gửi Yêu Cầu
              </button>
              <button className={styles.cancelBtn} onClick={handleCloseForm}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gửi Góp Ý */}
      {showAddFeedback && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>💬 Gửi Góp Ý / Phản Hồi</h3>
            <div className={styles.formGroup}>
              <label>Loại Góp Ý *</label>
              <select
                value={feedbackData.loai_gop_y}
                onChange={(e) => setFeedbackData({...feedbackData, loai_gop_y: e.target.value})}
              >
                <option value="gop_y">📝 Góp ý chung</option>
                <option value="de_xuat">💡 Đề xuất cải tiến</option>
                <option value="khieu_nai">⚠️ Khiếu nại</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Tiêu Đề *</label>
              <input 
                type="text" 
                placeholder="Nhập tiêu đề ngắn gọn"
                value={feedbackData.tieu_de}
                onChange={(e) => setFeedbackData({...feedbackData, tieu_de: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Nội Dung Chi Tiết *</label>
              <textarea
                placeholder="Mô tả chi tiết góp ý, đề xuất hoặc vấn đề của bạn..."
                value={feedbackData.noi_dung}
                onChange={(e) => setFeedbackData({...feedbackData, noi_dung: e.target.value})}
                rows="5"
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.submitBtn} onClick={handleAddFeedback}>
                Gửi Góp Ý
              </button>
              <button className={styles.cancelBtn} onClick={handleCloseForm}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
