import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import DropInImage from '../components/DropInImage';

export default function CommunityHub() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPublicTrips()
      .then(d => setTrips(d.trips))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Community Hub</h1>
        <p style={{ color: 'var(--muted)', fontSize: 16 }}>
          Discover and copy itineraries created by fellow travelers around the world.
        </p>
      </div>

      {loading && <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading public trips...</p>}
      {error && <p className="error-text" style={{ textAlign: 'center' }}>{error}</p>}
      
      {!loading && !error && trips.length === 0 && (
        <div className="card empty-state" style={{ padding: 40 }}>
          <p style={{ color: 'var(--muted-2)' }}>No public trips available yet.</p>
          <p>Be the first to share a trip!</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        {trips.map(trip => (
          <Link key={trip.id} to={`/share/${trip.share_slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } }}>
              <div style={{ height: 160, width: '100%', position: 'relative' }}>
                <DropInImage 
                  folder="trips" 
                  name={trip.name} 
                  coverOverride={trip.cover_photo} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>
                  {trip.stopCount} {trip.stopCount === 1 ? 'stop' : 'stops'}
                </div>
              </div>
              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 18, marginBottom: 6, color: 'var(--text-primary)' }}>{trip.name}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16, flex: 1 }}>
                  {trip.description ? trip.description.substring(0, 80) + (trip.description.length > 80 ? '...' : '') : 'An amazing journey waiting to be explored.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                  {trip.user_profile_photo ? (
                    <img src={trip.user_profile_photo} alt={trip.user_name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--ocean)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                      {trip.user_name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span style={{ color: 'var(--muted-2)', fontSize: 13 }}>By {trip.user_name}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

