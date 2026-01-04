import { useEffect, useState } from 'react';
import { hoGiaDinhService, requestsService } from '../api/services';
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
            src="https://scontent.fhan2-3.fna.fbcdn.net/v/t39.30808-6/306126396_406500701631545_2404627812171912103_n.jpg?_nc_cat=108&_nc_cb=99be929b-ad57045b&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeHO6WdjVGdD1Pd1BESEu8RYFHPdV8_HkTsUc91Xz8eRO-Q0TB_Qym_F7LwHXtf1aRl7KCImph-_QNaCceJn-USJ&_nc_ohc=B3CleMT9lhMQ7kNvwErc9dS&_nc_oc=AdnmSWu5CnR2kLk6-UcFvIYuNwY6qjpkS-zgNOueI8jSLqivdAkmc91isb1f9ex2aqY-L_8mV6US8SxKCs7bv4G7&_nc_zt=23&_nc_ht=scontent.fhan2-3.fna&_nc_gid=ymtHeZWUSydOApUx_YSDIw&oh=00_Afmqb8on30_f714nb68FVgIHhvQC6rMh6K5lPQwIaaJzVA&oe=694DCCB6"
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
