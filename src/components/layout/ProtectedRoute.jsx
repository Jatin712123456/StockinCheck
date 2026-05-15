import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <Spinner />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
