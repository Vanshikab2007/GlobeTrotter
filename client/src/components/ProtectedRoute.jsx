import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, ready } = useAuth();
  if (!ready) {
    return <div className="container" style={{ paddingTop: 80, color: 'var(--muted)' }}>Loading…</div>;
  }
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
