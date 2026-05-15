import { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MaterialsPage from './pages/MaterialsPage';
import MaterialDetailPage from './pages/MaterialDetailPage';
import AddMaterialPage from './pages/AddMaterialPage';
import LogsPage from './pages/LogsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import Spinner from './components/ui/Spinner';

function LoginGate({ children }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <Spinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { loadSession, isLoading } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontSize: 14 },
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={
            <LoginGate>
              <LoginPage />
            </LoginGate>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/materials/add" element={
            <ProtectedRoute adminOnly>
              <AddMaterialPage />
            </ProtectedRoute>
          } />
          <Route path="/materials/:id" element={<MaterialDetailPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
