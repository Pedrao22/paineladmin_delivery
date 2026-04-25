import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SuperAdminLayout from './pages/super/SuperAdminLayout';
import SuperDashboard from './pages/super/SuperDashboard';
import RestaurantsManagement from './pages/super/RestaurantsManagement';
import PlansManager from './pages/super/PlansManager';
import AuditHistory from './pages/super/AuditHistory';
import GlobalSettings from './pages/super/GlobalSettings';
import SuperLoginPage from './pages/super/SuperLoginPage';
import SuperPasswordReset from './pages/super/SuperPasswordReset';

function ProtectedSuperRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#03030a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(168,85,247,0.2)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const mustReset = profile?.forcarTrocaSenha || profile?.avatar_url === 'FORCE_RESET';
  if (mustReset) return <Navigate to="/reset-password" replace />;

  if (profile?.role !== 'super_admin') return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<SuperLoginPage />} />
      <Route path="/reset-password" element={<SuperPasswordReset />} />

      <Route
        path="/"
        element={
          <ProtectedSuperRoute>
            <SuperAdminLayout />
          </ProtectedSuperRoute>
        }
      >
        <Route index element={<SuperDashboard />} />
        <Route path="restaurantes" element={<RestaurantsManagement />} />
        <Route path="planos" element={<PlansManager />} />
        <Route path="audit" element={<AuditHistory />} />
        <Route path="config" element={<GlobalSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
