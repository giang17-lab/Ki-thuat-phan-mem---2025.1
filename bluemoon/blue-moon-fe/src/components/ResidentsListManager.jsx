import { useState, useEffect } from 'react';
import { hoGiaDinhService, nhanKhauService } from '../api/services';
import styles from './ResidentsListManager.module.css';

export default function ResidentsListManager() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHouse, setFilterHouse] = useState('');
  const [houses, setHouses] = useState([]);
  const [selectedResident, setSelectedResident] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadHousesAndResidents();
  }, []);

  const loadHousesAndResidents = async () => {
    setLoading(true);
    try {
      // Load all houses
      const housesRes = await hoGiaDinhService.getAll();
      const housesList = Array.isArray(housesRes) ? housesRes : housesRes.data || [];
      setHouses(housesList);

      // Load all residents from all houses
      const allResidents = [];
      for (const house of housesList) {
        try {
          const resRes = await nhanKhauService.getByHo(house.id);
          const resList = Array.isArray(resRes) ? resRes : resRes.data || [];
          resList.forEach(res => {
            allResidents.push({
              ...res,
              house_name: house.ten_chu_ho,
              house_code: house.ma_can_ho,
              house_id: house.id
            });
          });
        } catch (err) {
          console.error(`Error loading residents for house ${house.id}:`, err);
        }
      }
      
      setResidents(allResidents);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu cư dân');
    } finally {
      setLoading(false);
    }
  };

  const filteredResidents = residents.filter(resident => {
    const matchSearch = resident.ho_ten?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       resident.cccd?.includes(searchTerm);
    const matchFilter = !filterHouse || resident.house_id === parseInt(filterHouse);
    return matchSearch && matchFilter;
  });

  const handleViewDetail = (resident) => {
    setSelectedResident(resident);
    setShowDetail(true);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className={styles.container}>
      <h2>Quản Lý Toàn Bộ Cư Dân</h2>
      
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.filterSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc CCCD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterBox}>
          <select 
            value={filterHouse}
            onChange={(e) => setFilterHouse(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Tất cả hộ gia đình</option>
            {houses.map(house => (
              <option key={house.id} value={house.id}>
                {house.ma_can_ho} - {house.ten_chu_ho}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.stats}>
        <span>📊 Tổng cư dân: <strong>{filteredResidents.length}</strong></span>
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải dữ liệu...</div>
      ) : filteredResidents.length === 0 ? (
        <div className={styles.noData}>Không tìm thấy cư dân nào</div>
      ) : (
        <div className={styles.residentsTable}>
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên Cư Dân</th>
                <th>Căn Hộ</th>
                <th>Chủ Hộ</th>
                <th>Quan Hệ</th>
                <th>Năm Sinh</th>
                <th>Tuổi</th>
                <th>Giới Tính</th>
                <th>CCCD</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.map((resident, idx) => (
                <tr key={resident.id} className={styles.residentRow}>
                  <td>{idx + 1}</td>
                  <td className={styles.nameCell}>{resident.ho_ten}</td>
                  <td>{resident.house_code}</td>
                  <td>{resident.house_name}</td>
                  <td>{resident.quan_he}</td>
                  <td>{resident.ngay_sinh ? new Date(resident.ngay_sinh).getFullYear() : '-'}</td>
                  <td className={styles.ageCell}>{calculateAge(resident.ngay_sinh)}</td>
                  <td>{resident.gioi_tinh === 'M' ? '👨 Nam' : resident.gioi_tinh === 'F' ? '👩 Nữ' : '-'}</td>
                  <td className={styles.cccdCell}>{resident.cccd || '-'}</td>
                  <td>
                    <button 
                      className={styles.viewBtn}
                      onClick={() => handleViewDetail(resident)}
                    >
                      👁️ Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedResident && (
        <div className={styles.modal} onClick={() => setShowDetail(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowDetail(false)}>✕</button>
            <h3>Thông Tin Chi Tiết Cư Dân</h3>
            
            <div className={styles.detailGrid}>
              <div className={styles.detailRow}>
                <label>Tên:</label>
                <span>{selectedResident.ho_ten}</span>
              </div>
              
              <div className={styles.detailRow}>
                <label>Căn Hộ:</label>
                <span>{selectedResident.house_code}</span>
              </div>

              <div className={styles.detailRow}>
                <label>Chủ Hộ:</label>
                <span>{selectedResident.house_name}</span>
              </div>

              <div className={styles.detailRow}>
                <label>Quan Hệ:</label>
                <span>{selectedResident.quan_he}</span>
              </div>

              <div className={styles.detailRow}>
                <label>Ngày Sinh:</label>
                <span>{selectedResident.ngay_sinh ? new Date(selectedResident.ngay_sinh).toLocaleDateString('vi-VN') : '-'}</span>
              </div>

              <div className={styles.detailRow}>
                <label>Tuổi:</label>
                <span>{calculateAge(selectedResident.ngay_sinh)}</span>
              </div>

              <div className={styles.detailRow}>
                <label>Giới Tính:</label>
                <span>{selectedResident.gioi_tinh === 'M' ? 'Nam' : selectedResident.gioi_tinh === 'F' ? 'Nữ' : '-'}</span>
              </div>

              <div className={styles.detailRow}>
                <label>CCCD:</label>
                <span>{selectedResident.cccd || '-'}</span>
              </div>

              <div className={styles.detailRow}>
                <label>SDT:</label>
                <span>{selectedResident.sdt || '-'}</span>
              </div>
            </div>

            <button className={styles.closeModalBtn} onClick={() => setShowDetail(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
