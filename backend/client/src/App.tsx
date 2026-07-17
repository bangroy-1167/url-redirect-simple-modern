import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UrlsPage from './pages/UrlsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import LogoutPage from './pages/LogoutPage';
import UrlFoundPage from './pages/UrlFoundPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/kelola/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/kelola" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <SettingsProvider>
      <Routes>
        {/* public route for URL found page with auto-redirect */}
        <Route path="/f/:shortUrl" element={<UrlFoundPage />} />
        
        <Route path="/kelola/login" element={<LoginPage />} />
        <Route path="/kelola/logout" element={<LogoutPage />} />
        <Route
          path="/kelola"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kelola/urls"
          element={
            <ProtectedRoute>
              <UrlsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kelola/users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/kelola/settings"
          element={
            <AdminRoute>
              <SettingsPage />
            </AdminRoute>
          }
        />
        <Route path="/" element={<Navigate to="/kelola" replace />} />
        <Route path="*" element={<Navigate to="/kelola" replace />} />
      </Routes>
    </SettingsProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
