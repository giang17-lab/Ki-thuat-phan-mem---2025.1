import { useState, useEffect } from 'react';
import { hoGiaDinhService, xeCoService } from '../api/services';
import styles from './VehiclesListManager.module.css';

export default function VehiclesListManager() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHouse, setFilterHouse] = useState('');
  const [houses, setHouses] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadHousesAndVehicles();
  }, []);

  const loadHousesAndVehicles = async () => {
    setLoading(true);
    try {
      // Load all houses
      const housesRes = await hoGiaDinhService.getAll();
      const housesList = Array.isArray(housesRes) ? housesRes : housesRes.data || [];
      setHouses(housesList);

      // Load all vehicles from all houses
      const allVehicles = [];
      for (const house of housesList) {
        try {
          const vehRes = await xeCoService.getByHo(house.id);
          const vehList = Array.isArray(vehRes) ? vehRes : vehRes.data || [];
          vehList.forEach(veh => {
            allVehicles.push({
              ...veh,
              house_name: house.ten_chu_ho,
              house_code: house.ma_can_ho,
              house_id: house.id
            });
          });
        } catch (err) {
          console.error(`Error loading vehicles for house ${house.id}:`, err);
        }
      }
      
      setVehicles(allVehicles);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu xe cộ');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchSearch = vehicle.bien_so?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       vehicle.loai_xe?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = !filterHouse || vehicle.house_id === parseInt(filterHouse);
    return matchSearch && matchFilter;
  });

  const handleViewDetail = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetail(true);
  };

  const getVehicleTypeIcon = (type) => {
    if (!type) return '🚗';
    const lowerType = type.toLowerCase();
    if (lowerType.includes('xe máy') || lowerType.includes('motorbike')) return '🏍️';
    if (lowerType.includes('xe đạp')) return '🚲';
    if (lowerType.includes('ô tô') || lowerType.includes('car')) return '🚙';
    if (lowerType.includes('tải')) return '🚚';
    return '🚗';
  };

  return (
    <div className={styles.container}>
      <h2>Quản Lý Xe Cộ</h2>
      
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.filterSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Tìm kiếm theo biển số hoặc loại xe..."
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
        <span>📊 Tổng xe: <strong>{filteredVehicles.length}</strong></span>
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải dữ liệu...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className={styles.noData}>Không tìm thấy xe cộ nào</div>
      ) : (
        <div className={styles.vehiclesTable}>
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Biển Số</th>
                <th>Loại Xe</th>
                <th>Căn Hộ</th>
                <th>Chủ Hộ</th>
                <th>Ngày Đăng Ký</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle, idx) => (
                <tr key={vehicle.id} className={styles.vehicleRow}>
                  <td>{idx + 1}</td>
                  <td className={styles.bienSoCell}>
                    <strong>{vehicle.bien_so}</strong>
                  </td>
                  <td className={styles.typeCell}>
                    {getVehicleTypeIcon(vehicle.loai_xe)} {vehicle.loai_xe}
                  </td>
                  <td>{vehicle.house_code}</td>
                  <td>{vehicle.house_name}</td>
                  <td>{vehicle.ngay_dang_ky ? new Date(vehicle.ngay_dang_ky).toLocaleDateString('vi-VN') : '-'}</td>
                  <td>
                    <button 
                      className={styles.viewBtn}
                      onClick={() => handleViewDetail(vehicle)}
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
      {showDetail && selectedVehicle && (
        <div className={styles.modal} onClick={() => setShowDetail(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowDetail(false)}>✕</button>
            <h3>Thông Tin Chi Tiết Xe Cộ</h3>
            
            <div className={styles.detailGrid}>
              <div className={styles.detailRow}>
                <label>Biển Số:</label>
                <span><strong>{selectedVehicle.bien_so}</strong></span>
              </div>
              
              <div className={styles.detailRow}>
                <label>Loại Xe:</label>
                <span>{getVehicleTypeIcon(selectedVehicle.loai_xe)} {selectedVehicle.loai_xe}</span>
              </div>

              <div className={styles.detailRow}>
                <label>Căn Hộ:</label>
                <span>{selectedVehicle.house_code}</span>
              </div>

              <div className={styles.detailRow}>
                <label>Chủ Hộ:</label>
                <span>{selectedVehicle.house_name}</span>
              </div>

              <div className={styles.detailRow}>
                <label>Ngày Đăng Ký:</label>
                <span>{selectedVehicle.ngay_dang_ky ? new Date(selectedVehicle.ngay_dang_ky).toLocaleDateString('vi-VN') : '-'}</span>
              </div>

              {selectedVehicle.trang_thai && (
                <div className={styles.detailRow}>
                  <label>Trạng Thái:</label>
                  <span className={styles[selectedVehicle.trang_thai]}>{selectedVehicle.trang_thai}</span>
                </div>
              )}
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
