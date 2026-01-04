import { useEffect, useState } from 'react';
import { nhanKhauService, xeCoService, phieuThuService } from '../api/services';
import NhanKhauTab from './tabs/NhanKhauTab';
import XeCoTab from './tabs/XeCoTab';
import PhieuThuTab from './tabs/PhieuThuTab';
import styles from './HoGiaDinhDetail.module.css';

export default function HoGiaDinhDetail({ ho, onEdit, onDelete, onClose }) {
  const [activeTab, setActiveTab] = useState('info');
  const [nhanKhau, setNhanKhau] = useState([]);
  const [xeCo, setXeCo] = useState([]);
  const [phieuThu, setPhieuThu] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all counts on mount
  useEffect(() => {
    loadAllCounts();
  }, [ho.id]);

  const loadAllCounts = async () => {
    try {
      const nkRes = await nhanKhauService.getByHo(ho.id);
      setNhanKhau(nkRes.data || []);
      const xeRes = await xeCoService.getByHo(ho.id);
      setXeCo(xeRes.data || []);
      const ptRes = await phieuThuService.getByHo(ho.id);
      setPhieuThu(ptRes.data || []);
    } catch (err) {
      console.error('Error loading counts:', err);
    }
  };

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'nhankhau') {
        const response = await nhanKhauService.getByHo(ho.id);
        setNhanKhau(response.data || []);
      } else if (tab === 'xeco') {
        const response = await xeCoService.getByHo(ho.id);
        setXeCo(response.data || []);
      } else if (tab === 'phieuthu') {
        const response = await phieuThuService.getByHo(ho.id);
        setPhieuThu(response.data || []);
      }
    } catch (err) {
      console.error('Error loading tab data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.detail}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Thông Tin
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'nhankhau' ? styles.active : ''}`}
          onClick={() => setActiveTab('nhankhau')}
        >
          Nhân Khẩu ({nhanKhau.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'xeco' ? styles.active : ''}`}
          onClick={() => setActiveTab('xeco')}
        >
          Xe Cộ ({xeCo.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'phieuthu' ? styles.active : ''}`}
          onClick={() => setActiveTab('phieuthu')}
        >
          Phiếu Thu ({phieuThu.length})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'info' && (
          <div className={styles.info}>
            <div className={styles.infoRow}>
              <label>Mã Căn Hộ:</label>
              <span>{ho.ma_can_ho}</span>
            </div>
            <div className={styles.infoRow}>
              <label>Tên Chủ Hộ:</label>
              <span>{ho.ten_chu_ho}</span>
            </div>
            <div className={styles.infoRow}>
              <label>CCCD:</label>
              <span>{ho.cccd || 'Chưa cập nhật'}</span>
            </div>
            <div className={styles.infoRow}>
              <label>Số Điện Thoại:</label>
              <span>{ho.sdt || 'Chưa cập nhật'}</span>
            </div>
            {ho.dien_tich && (
              <div className={styles.infoRow}>
                <label>Diện Tích:</label>
                <span>{ho.dien_tich} m²</span>
              </div>
            )}
            {ho.ngay_chuyen_den && (
              <div className={styles.infoRow}>
                <label>Ngày Chuyển Đến:</label>
                <span>{new Date(ho.ngay_chuyen_den).toLocaleDateString('vi-VN')}</span>
              </div>
            )}

            <div className={styles.actions}>
              <button onClick={() => onEdit(ho.id)} className={styles.editBtn}>
                ✏️ Chỉnh Sửa
              </button>
              <button onClick={() => onDelete(ho.id)} className={styles.deleteBtn}>
                🗑️ Xóa
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Đang tải...</div>
        ) : (
          <>
            {activeTab === 'nhankhau' && (
              <NhanKhauTab idHo={ho.id} data={nhanKhau} onDataChange={() => loadTabData('nhankhau')} />
            )}
            {activeTab === 'xeco' && (
              <XeCoTab idHo={ho.id} data={xeCo} onDataChange={() => loadTabData('xeco')} />
            )}
            {activeTab === 'phieuthu' && (
              <PhieuThuTab idHo={ho.id} data={phieuThu} onDataChange={() => loadTabData('phieuthu')} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
