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
            <Link className="btn-ghost btn" to="/community" style={{ padding: '8px 12px' }}>Community</Link>
            <Link className="btn-ghost btn" to="/admin" style={{ padding: '8px 12px' }}>Admin</Link>
            <span style={{ width: 1, height: 22, background: 'var(--line)', margin: '0 6px' }} />
            
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '4px 8px', borderRadius: 6, transition: 'background 0.2s' }} className="btn-ghost">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt={user.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--ocean)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{user.name}</span>
            </Link>

            <button className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => { logout(); navigate('/login'); }}>Log out</button>
          </nav>
        )}
      </div>
    </header>
  );
}
