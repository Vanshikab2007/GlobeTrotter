import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header style={{
      borderBottom: '1px solid var(--line)',
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(10,15,29,0.85)', backdropFilter: 'blur(10px)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{
            width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center',
            background: 'linear-gradient(135deg, var(--sunset), var(--gold))', fontSize: 16,
          }}>🧭</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>GlobeTrotter</span>
        </Link>

        {user && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link className="btn-ghost btn" to="/" style={{ padding: '8px 12px' }}>Dashboard</Link>
            <Link className="btn-ghost btn" to="/trips/new" style={{ padding: '8px 12px' }}>New Trip</Link>
            <span style={{ width: 1, height: 22, background: 'var(--line)', margin: '0 6px' }} />
            <span style={{ color: 'var(--muted)', fontSize: 13, marginRight: 4 }}>{user.name}</span>
            <button className="btn btn-secondary" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
          </nav>
        )}
      </div>
    </header>
  );
}
