import { useEffect, useState } from 'react';
import { hoGiaDinhService, requestsService, gopyService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import HoGiaDinhList from '../components/HoGiaDinhList';
import HoGiaDinhForm from '../components/HoGiaDinhForm';
import Modal from '../components/Modal';
import NotificationManagement from '../components/NotificationManagement';
import AccountSettings from '../components/AccountSettings';
import PhieuThuStats from '../components/PhieuThuStats';
import PhieuThuSearch from '../components/PhieuThuSearch';
import UnpaidPhieuThuList from '../components/UnpaidPhieuThuList';
import styles from './Dashboard.module.css';

export function AdminPanel() {
  const [hoGiaDinh, setHoGiaDinh] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [activeFeeView, setActiveFeeView] = useState('stats');
  const [showFeeMenu, setShowFeeMenu] = useState(false);
  const [pendingRequests, setPendingRequests] = useState({ vehicles: [], residents: [] });
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [rejectingType, setRejectingType] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState({ trang_thai: '', loai_gop_y: '' });
  const [respondingFeedbackId, setRespondingFeedbackId] = useState(null);
  const [feedbackResponse, setFeedbackResponse] = useState('');
  const { user, logout } = useAuth();

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const householdResponse = await hoGiaDinhService.getAll();
      setHoGiaDinh(householdResponse.data || []);

      // Load pending requests from API
      const requestsResponse = await requestsService.getPending();
      setPendingRequests(requestsResponse.data || { vehicles: [], residents: [] });

      // Load feedback
      const feedbackResponse = await gopyService.getAll();
      setFeedbackList(feedbackResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFeeView = (view) => {
    setActiveTab('fees');
    setActiveFeeView(view);
    setShowFeeMenu(false);
  };

  const handleAddSuccess = () => {
    setShowForm(false);
    setEditingId(null);
    loadData();
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn chắc chắn muốn xóa hộ gia đình này?')) {
      try {
        await hoGiaDinhService.delete(id);
        loadData();
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi xóa');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  // Feedback handlers
  const loadFeedback = async () => {
    try {
      const response = await gopyService.getAll(feedbackFilter);
      setFeedbackList(response.data || []);
    } catch (err) {
      console.error('Lỗi tải góp ý:', err);
    }
  };

  const handleRespondFeedback = async (feedbackId) => {
    if (!feedbackResponse.trim()) {
      alert('Vui lòng nhập phản hồi');
      return;
    }
    try {
      await gopyService.update(feedbackId, {
        phan_hoi: feedbackResponse,
        trang_thai: 'da_phan_hoi'
      });
      alert('Đã gửi phản hồi thành công!');
      setRespondingFeedbackId(null);
      setFeedbackResponse('');
      loadFeedback();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gửi phản hồi');
    }
  };

  const handleUpdateFeedbackStatus = async (feedbackId, trang_thai) => {
    try {
      await gopyService.update(feedbackId, { trang_thai });
      loadFeedback();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleApproveVehicle = async (requestId) => {
    try {
      await requestsService.approveVehicle(requestId);
      alert('Yêu cầu thêm xe đã được phê duyệt!');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi phê duyệt');
    }
  };

  const handleRejectVehicle = async (requestId) => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await requestsService.rejectVehicle(requestId, rejectReason);
      alert('Yêu cầu đã bị từ chối!');
      setRejectingRequestId(null);
      setRejectReason('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi từ chối');
    }
  };

  const handleApproveResident = async (requestId) => {
    try {
      await requestsService.approveResident(requestId);
      alert('Yêu cầu thêm nhân khẩu đã được phê duyệt!');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi phê duyệt');
    }
  };

  const handleRejectResident = async (requestId) => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await requestsService.rejectResident(requestId, rejectReason);
      alert('Yêu cầu đã bị từ chối!');
      setRejectingRequestId(null);
      setRejectReason('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi từ chối');
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* Top Header with Contact Info */}
      <div className={styles.topBar}>
        <div className={styles.topBarContent}>
          <div className={styles.contactInfo}>
            <span>📧 admin@bluemoon.vn</span>
            <span>📞 0123.456.789</span>
          </div>
          <div className={styles.userInfo}>
            <span>Xin chào, {user?.username}!</span>
            <button onClick={logout} className={styles.logoutBtn}>
              Đăng Xuất
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="Blue Moon" />
            <span>BlueMoon</span>
          </div>
          <div className={styles.navLinks}>
            <button 
              className={activeTab === 'home' ? styles.navActive : ''}
              onClick={() => setActiveTab('home')}
            >
              Trang Chủ
            </button>
            <button 
              className={activeTab === 'residents' ? styles.navActive : ''}
              onClick={() => setActiveTab('residents')}
            >
              Quản Lý Cư Dân
            </button>
            <button 
              className={activeTab === 'requests' ? styles.navActive : ''}
              onClick={() => setActiveTab('requests')}
            >
              Yêu Cầu Chờ Duyệt
            </button>
            <div 
              className={styles.navDropdown}
              onMouseEnter={() => setShowFeeMenu(true)}
              onMouseLeave={() => setShowFeeMenu(false)}
            >
              <button
                className={activeTab === 'fees' ? styles.navActive : ''}
                onClick={(e) => e.preventDefault()}
              >
                Khoản Thu
              </button>
              {showFeeMenu && (
                <div className={styles.dropdownMenu}>
                  <button className={styles.dropdownItem} onClick={() => handleFeeView('stats')}>
                    Thống kê
                  </button>
                  <button className={styles.dropdownItem} onClick={() => handleFeeView('search')}>
                    Tra cứu khoản thu
                  </button>
                  <button className={styles.dropdownItem} onClick={() => handleFeeView('unpaid')}>
                    Danh sách khoản thu chưa hoàn thành
                  </button>
                </div>
              )}
            </div>
            <button 
              className={activeTab === 'feedback' ? styles.navActive : ''}
              onClick={() => { setActiveTab('feedback'); loadFeedback(); }}
            >
              Góp Ý Cư Dân
            </button>
            <button 
              className={activeTab === 'notifications' ? styles.navActive : ''}
              onClick={() => setActiveTab('notifications')}
            >
              Quản Lý Thông Báo
            </button>
            <button 
              className={activeTab === 'account' ? styles.navActive : ''}
              onClick={() => setActiveTab('account')}
            >
              Quản Lý Tài Khoản
            </button>
          </div>
        </div>
      </nav>

      {/* Home section - image only */}
      {activeTab === 'home' && (
        <section className={styles.homeHero}>
          <img
            className={styles.homeHeroImg}
            src="/main-panel.jpg"
            alt="Quản lý chung cư Blue Moon"
            loading="lazy"
          />
          <div className={styles.homeHeroOverlay} />
          <div className={styles.homeHeroContent}>
            <div className={styles.homeTag}>🏢 Hệ thống quản lý chung cư hiện đại</div>
            <h1 className={styles.homeTitle}>
              QUẢN LÝ<br />
              CHUNG CƯ BLUE MOON
            </h1>
            <p className={styles.homeSubtitle}>
              Giải pháp quản lý toàn diện cho cư dân và ban quản lý
            </p>
            <div className={styles.homeButtons}>
              <button
                className={styles.homePrimaryBtn}
                onClick={() => setActiveTab('residents')}
              >
                Xem Hộ Gia Đình →
              </button>
              <button
                className={styles.homeSecondaryBtn}
                onClick={() => setActiveTab('fees')}
              >
                Xem Thống Kê →
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab !== 'home' && (
        <div className={styles.mainContent}>
          <div className={styles.content}>
            {error && <div className={styles.error}>{error}</div>}

            {activeTab === 'residents' && (
              <>
                <div className={styles.actions}>
                  <button
                    onClick={() => setShowForm(true)}
                    className={styles.addBtn}
                    disabled={loading}
                  >
                    + Thêm Hộ Gia Đình
                  </button>
                </div>

                <Modal open={showForm} onClose={handleCloseForm} title={editingId ? 'Chỉnh Sửa Hộ Gia Đình' : 'Thêm Hộ Gia Đình'}>
                  <HoGiaDinhForm
                    editingId={editingId}
                    onSuccess={handleAddSuccess}
                    onCancel={handleCloseForm}
                  />
                </Modal>

                {loading && !showForm ? (
                  <div className={styles.loading}>Đang tải dữ liệu...</div>
                ) : (
                  <HoGiaDinhList
                    hoGiaDinh={hoGiaDinh}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </>
            )}

            {activeTab === 'requests' && (
              <div className={styles.requestsContainer}>
                {(pendingRequests.vehicles?.length || 0) + (pendingRequests.residents?.length || 0) === 0 ? (
                  <p className={styles.noData}>Không có yêu cầu chờ duyệt</p>
                ) : (
                  <div className={styles.requestsList}>
                    {/* Yêu cầu thêm xe */}
                    {pendingRequests.vehicles?.map((request) => (
                      <div key={`vehicle-${request.id}`} className={styles.requestCard}>
                        <div className={styles.requestInfo}>
                          <h3>🚗 Thêm Xe Cộ</h3>
                          <p><strong>Từ user:</strong> {request.display_user || request.username}</p>
                          <p><strong>Biển số:</strong> {request.bien_so}</p>
                          <p><strong>Loại xe:</strong> {request.loai_xe}</p>
                          <p><strong>Ngày gửi:</strong> {new Date(request.created_at).toLocaleString('vi-VN')}</p>
                        </div>
                        <div className={styles.requestActions}>
                          {rejectingRequestId === request.id && rejectingType === 'vehicle' ? (
                            <div className={styles.rejectForm}>
                              <input
                                type="text"
                                placeholder="Lý do từ chối..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className={styles.rejectInput}
                              />
                              <button
                                className={styles.submitBtn}
                                onClick={() => handleRejectVehicle(request.id)}
                              >
                                Xác Nhận
                              </button>
                              <button
                                className={styles.cancelBtn}
                                onClick={() => {
                                  setRejectingRequestId(null);
                                  setRejectReason('');
                                }}
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                className={styles.approveBtn}
                                onClick={() => handleApproveVehicle(request.id)}
                              >
                                ✓ Phê Duyệt
                              </button>
                              <button 
                                className={styles.rejectBtn}
                                onClick={() => {
                                  setRejectingRequestId(request.id);
                                  setRejectingType('vehicle');
                                }}
                              >
                                ✗ Từ Chối
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Yêu cầu thêm nhân khẩu */}
                    {pendingRequests.residents?.map((request) => (
                      <div key={`resident-${request.id}`} className={styles.requestCard}>
                        <div className={styles.requestInfo}>
                          <h3>👤 Thêm Nhân Khẩu</h3>
                          <p><strong>Từ user:</strong> {request.display_user || request.username}</p>
                          <p><strong>Họ tên:</strong> {request.ho_ten}</p>
                          <p><strong>Quan hệ:</strong> {request.quan_he}</p>
                          <p><strong>Ngày gửi:</strong> {new Date(request.created_at).toLocaleString('vi-VN')}</p>
                        </div>
                        <div className={styles.requestActions}>
                          {rejectingRequestId === request.id && rejectingType === 'resident' ? (
                            <div className={styles.rejectForm}>
                              <input
                                type="text"
                                placeholder="Lý do từ chối..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className={styles.rejectInput}
                              />
                              <button
                                className={styles.submitBtn}
                                onClick={() => handleRejectResident(request.id)}
                              >
                                Xác Nhận
                              </button>
                              <button
                                className={styles.cancelBtn}
                                onClick={() => {
                                  setRejectingRequestId(null);
                                  setRejectReason('');
                                }}
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                className={styles.approveBtn}
                                onClick={() => handleApproveResident(request.id)}
                              >
                                ✓ Phê Duyệt
                              </button>
                              <button 
                                className={styles.rejectBtn}
                                onClick={() => {
                                  setRejectingRequestId(request.id);
                                  setRejectingType('resident');
                                }}
                              >
                                ✗ Từ Chối
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'fees' && (
              <div className={styles.feesStack}>
                {activeFeeView === 'search' && (
                  <div className={styles.cardBlock} style={{ order: 0 }}>
                    <PhieuThuSearch />
                  </div>
                )}
                {activeFeeView === 'stats' && (
                  <div className={styles.cardBlock} style={{ order: 0 }}>
                    <PhieuThuStats />
                  </div>
                )}
                {activeFeeView === 'unpaid' && (
                  <div className={styles.cardBlock} style={{ order: 0 }}>
                    <UnpaidPhieuThuList />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className={styles.requestsSection}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  padding: '25px 30px', 
                  borderRadius: '12px', 
                  marginBottom: '25px',
                  color: 'white'
                }}>
                  <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '600' }}>
                    📝 Góp Ý Từ Cư Dân
                  </h2>
                  
                  {/* Bộ lọc */}
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      value={feedbackFilter.trang_thai}
                      onChange={(e) => {
                        setFeedbackFilter({ ...feedbackFilter, trang_thai: e.target.value });
                      }}
                      style={{ 
                        padding: '10px 15px', 
                        borderRadius: '8px', 
                        border: 'none',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        color: '#333',
                        fontSize: '14px',
                        minWidth: '160px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">📊 Tất cả trạng thái</option>
                      <option value="cho_xu_ly">⏳ Chờ xử lý</option>
                      <option value="dang_xu_ly">🔄 Đang xử lý</option>
                      <option value="da_phan_hoi">✅ Đã phản hồi</option>
                      <option value="da_dong">📁 Đã đóng</option>
                    </select>
                    <select
                      value={feedbackFilter.loai_gop_y}
                      onChange={(e) => {
                        setFeedbackFilter({ ...feedbackFilter, loai_gop_y: e.target.value });
                      }}
                      style={{ 
                        padding: '10px 15px', 
                        borderRadius: '8px', 
                        border: 'none',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        color: '#333',
                        fontSize: '14px',
                        minWidth: '140px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">📑 Tất cả loại</option>
                      <option value="gop_y">💬 Góp ý</option>
                      <option value="khieu_nai">⚠️ Khiếu nại</option>
                      <option value="de_xuat">💡 Đề xuất</option>
                      <option value="yeu_cau">📋 Yêu cầu</option>
                      <option value="khac">📌 Khác</option>
                    </select>
                    <button
                      onClick={loadFeedback}
                      style={{ 
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#ffd700',
                        color: '#333',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                    >
                      🔍 Lọc
                    </button>
                  </div>
                </div>

                {feedbackList.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '60px 20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    color: '#888'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
                    <p style={{ fontSize: '16px', margin: 0 }}>Không có góp ý nào.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {feedbackList.map((fb) => (
                      <div key={fb.id} style={{ 
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                        border: fb.loai_gop_y === 'khieu_nai' ? '2px solid #ff6b6b' : '1px solid #eee'
                      }}>
                        {/* Header */}
                        <div style={{
                          padding: '15px 20px',
                          backgroundColor: fb.loai_gop_y === 'khieu_nai' ? '#fff5f5' : 
                                          fb.loai_gop_y === 'de_xuat' ? '#fffbeb' : 
                                          fb.loai_gop_y === 'yeu_cau' ? '#f0f9ff' : '#f8f9fa',
                          borderBottom: '1px solid #eee',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}>
                          <h3 style={{ margin: 0, fontSize: '18px', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px' }}>
                              {fb.loai_gop_y === 'khieu_nai' ? '🚨' : fb.loai_gop_y === 'de_xuat' ? '💡' : fb.loai_gop_y === 'yeu_cau' ? '📋' : '💬'}
                            </span>
                            {fb.tieu_de}
                          </h3>
                          <span style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            backgroundColor: fb.trang_thai === 'cho_xu_ly' ? '#ffd700' : 
                                           fb.trang_thai === 'dang_xu_ly' ? '#3b82f6' : 
                                           fb.trang_thai === 'da_phan_hoi' ? '#10b981' : '#6b7280',
                            color: fb.trang_thai === 'cho_xu_ly' ? '#333' : 'white'
                          }}>
                            {fb.trang_thai === 'cho_xu_ly' ? '⏳ Chờ xử lý' : 
                             fb.trang_thai === 'dang_xu_ly' ? '🔄 Đang xử lý' : 
                             fb.trang_thai === 'da_phan_hoi' ? '✅ Đã phản hồi' : '📁 Đã đóng'}
                          </span>
                        </div>
                        
                        {/* Body */}
                        <div style={{ padding: '20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#667eea' }}>👤</span>
                              <span><strong>Người gửi:</strong> {fb.sender_name || fb.username || 'Ẩn danh'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#667eea' }}>🏷️</span>
                              <span><strong>Loại:</strong> {fb.loai_gop_y === 'gop_y' ? 'Góp ý' : fb.loai_gop_y === 'khieu_nai' ? 'Khiếu nại' : fb.loai_gop_y === 'de_xuat' ? 'Đề xuất' : fb.loai_gop_y === 'yeu_cau' ? 'Yêu cầu' : 'Khác'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#667eea' }}>📅</span>
                              <span><strong>Ngày gửi:</strong> {new Date(fb.created_at).toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                          
                          <div style={{ 
                            padding: '15px', 
                            backgroundColor: '#f8fafc', 
                            borderRadius: '10px', 
                            borderLeft: '4px solid #667eea',
                            marginBottom: '15px'
                          }}>
                            <div style={{ fontWeight: '600', color: '#475569', marginBottom: '8px' }}>📄 Nội dung:</div>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#333', lineHeight: '1.6' }}>{fb.noi_dung}</p>
                          </div>
                          
                          {fb.phan_hoi && (
                            <div style={{ 
                              padding: '15px', 
                              backgroundColor: '#ecfdf5', 
                              borderRadius: '10px', 
                              borderLeft: '4px solid #10b981',
                              marginBottom: '15px'
                            }}>
                              <div style={{ fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
                                📨 Phản hồi từ Admin {fb.admin_name ? `(${fb.admin_name})` : ''}:
                              </div>
                              <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#333', lineHeight: '1.6' }}>{fb.phan_hoi}</p>
                            </div>
                          )}
                          
                          {/* Actions */}
                          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                          {respondingFeedbackId === fb.id ? (
                            <div style={{ width: '100%' }}>
                              <textarea
                                placeholder="Nhập phản hồi..."
                                value={feedbackResponse}
                                onChange={(e) => setFeedbackResponse(e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  minHeight: '100px', 
                                  padding: '12px', 
                                  borderRadius: '8px', 
                                  border: '2px solid #667eea',
                                  marginBottom: '12px',
                                  fontSize: '14px',
                                  resize: 'vertical'
                                }}
                              />
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                  onClick={() => handleRespondFeedback(fb.id)}
                                  style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✓ Gửi Phản Hồi
                                </button>
                                <button 
                                  onClick={() => { setRespondingFeedbackId(null); setFeedbackResponse(''); }}
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
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              {fb.trang_thai !== 'da_dong' && (
                                <>
                                  <button 
                                    onClick={() => { setRespondingFeedbackId(fb.id); setFeedbackResponse(fb.phan_hoi || ''); }}
                                    style={{
                                      padding: '10px 18px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      backgroundColor: '#667eea',
                                      color: 'white',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}
                                  >
                                    💬 Phản Hồi
                                  </button>
                                  {fb.trang_thai === 'cho_xu_ly' && (
                                    <button 
                                      onClick={() => handleUpdateFeedbackStatus(fb.id, 'dang_xu_ly')}
                                      style={{
                                        padding: '10px 18px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      🔄 Đang Xử Lý
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleUpdateFeedbackStatus(fb.id, 'da_dong')}
                                    style={{
                                      padding: '10px 18px',
                                      borderRadius: '8px',
                                      border: '1px solid #dc3545',
                                      backgroundColor: 'white',
                                      color: '#dc3545',
                                      fontWeight: '600',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ✗ Đóng
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <NotificationManagement />
              </div>
            )}

            {activeTab === 'account' && (
              <div>
                <AccountSettings />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
