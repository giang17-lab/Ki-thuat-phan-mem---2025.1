import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { AdminPanel } from '../pages/AdminPanel';
import { UserDashboard } from '../pages/UserDashboard';
import ProtectedRoute from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute component={Dashboard} />,
  },
  {
    path: '/admin',
    element: <ProtectedRoute component={AdminPanel} requireRole="admin" />,
  },
  {
    path: '/user',
    element: <ProtectedRoute component={UserDashboard} requireRole="user" />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
