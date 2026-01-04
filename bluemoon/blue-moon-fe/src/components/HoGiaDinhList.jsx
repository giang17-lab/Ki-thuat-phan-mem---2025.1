import { useMemo, useState } from 'react';
import HoGiaDinhDetail from './HoGiaDinhDetail';
import styles from './HoGiaDinhList.module.css';

export default function HoGiaDinhList({ hoGiaDinh, onEdit, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return hoGiaDinh;
    return hoGiaDinh.filter((ho) => {
      const ten = (ho.ten_chu_ho || '').toLowerCase();
      const ma = (ho.ma_can_ho || '').toLowerCase();
      const cccd = (ho.cccd || '').toLowerCase();
      const sdt = (ho.sdt || '').toLowerCase();
      return ten.includes(q) || ma.includes(q) || cccd.includes(q) || sdt.includes(q);
    });
  }, [hoGiaDinh, search]);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2>Danh Sách Hộ Gia Đình ({filtered.length})</h2>
        <div className={styles.searchBox}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm (Tên chủ hộ/Mã căn hộ/CCCD/SĐT)"
            className={styles.searchInput}
          />
        </div>
      </div>
      {hoGiaDinh.length === 0 ? (
        <p className={styles.empty}>Không có hộ gia đình nào.</p>
      ) : (
        <div className={styles.list}>
          {filtered.map((ho) => (
            <div key={ho.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.info}>
                  <h3>{ho.ten_chu_ho}</h3>
                  <p>{ho.ma_can_ho}</p>
                </div>
                <button
                  className={`${styles.expandBtn} ${expandedId === ho.id ? styles.expanded : ''}`}
                  onClick={() => setExpandedId(expandedId === ho.id ? null : ho.id)}
                >
                  ▼
                </button>
              </div>

              {expandedId === ho.id && (
                <HoGiaDinhDetail
                  ho={ho}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onClose={() => setExpandedId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
