/** Guards private routes: waits for the startup /auth/me check, then redirects to /login remembering the page. */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui.jsx';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite" style={{ color: 'var(--primary)' }}>
        <Spinner large /><span className="sr-only-live">Loading</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
