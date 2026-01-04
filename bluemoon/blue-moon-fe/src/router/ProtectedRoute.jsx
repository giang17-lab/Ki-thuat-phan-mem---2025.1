import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ component: Component, requireRole }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có requireRole, kiểm tra role của user
  if (requireRole && user?.role !== requireRole) {
    // Chuyển hướng đến trang phù hợp với role của user
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'user') {
      return <Navigate to="/user" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Component />;
}
