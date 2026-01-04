import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { hoGiaDinhService } from '../api/services';
import HoGiaDinhList from '../components/HoGiaDinhList';
import HoGiaDinhForm from '../components/HoGiaDinhForm';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { user, logout, loading, isAdmin, isUser } = useAuth();
  const navigate = useNavigate();

  // Redirect based on role
  useEffect(() => {
    if (!loading) {
      if (isAdmin) {
        navigate('/admin');
      } else if (isUser) {
        navigate('/user');
      }
    }
  }, [isAdmin, isUser, loading, navigate]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>;
  }

  return null; // Trang này chỉ để redirect
}
