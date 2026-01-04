import { useState, useEffect } from 'react';
import styles from './NotificationManagement.module.css';

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Thông báo về nợ phí quản lý',
      message: 'Các hộ gia đình có nợ phí quản lý tháng 12 cần thanh toán trong vòng 7 ngày',
      type: 'warning',
      date: '2025-12-20',
      read: false,
    },
    {
      id: 2,
      title: 'Bảo dưỡng hệ thống điện',
      message: 'Sẽ bảo dưỡng hệ thống điện chung từ 14h-16h ngày 21/12/2025',
      type: 'info',
      date: '2025-12-19',
      read: false,
    },
  ]);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
  });
  const [showForm, setShowForm] = useState(false);

  const handleAddNotification = (e) => {
    e.preventDefault();
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const notification = {
      id: Math.max(...notifications.map(n => n.id), 0) + 1,
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type,
      date: new Date().toISOString().split('T')[0],
      read: false,
    };

    setNotifications([notification, ...notifications]);
    setNewNotification({ title: '', message: '', type: 'info' });
    setShowForm(false);
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <p>Tổng thông báo: <strong>{notifications.length}</strong></p>
          <p>Chưa đọc: <strong style={{ color: '#dc3545' }}>{unreadCount}</strong></p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          + Thêm Thông Báo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddNotification} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Tiêu Đề</label>
            <input
              type="text"
              value={newNotification.title}
              onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
              placeholder="Nhập tiêu đề thông báo"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Nội Dung</label>
            <textarea
              value={newNotification.message}
              onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
              placeholder="Nhập nội dung thông báo"
              className={styles.textarea}
              rows="4"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Loại Thông Báo</label>
            <select
              value={newNotification.type}
              onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
              className={styles.select}
            >
              <option value="info">ℹ️ Thông Tin</option>
              <option value="warning">⚠️ Cảnh Báo</option>
              <option value="success">✓ Thành Công</option>
              <option value="error">✗ Lỗi</option>
            </select>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.submitBtn}>Gửi Thông Báo</button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className={styles.cancelBtn}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className={styles.notificationsList}>
        {notifications.length === 0 ? (
          <p className={styles.empty}>Không có thông báo</p>
        ) : (
          notifications.map(notification => (
            <div key={notification.id} className={`${styles.notificationItem} ${notification.read ? styles.read : styles.unread} ${styles[notification.type]}`}>
              <div className={styles.notificationContent}>
                <div className={styles.notificationHeader}>
                  <h3>{notification.title}</h3>
                  <span className={styles.date}>{notification.date}</span>
                </div>
                <p>{notification.message}</p>
              </div>
              <div className={styles.notificationActions}>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className={styles.markReadBtn}
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className={styles.deleteBtn}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
