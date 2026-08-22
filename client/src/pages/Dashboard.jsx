import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import TripCard from '../components/TripCard';
import DropInImage from '../components/DropInImage';

function groupTrips(trips) {
  const now = new Date();
  const groups = { ongoing: [], upcoming: [], completed: [] };
  for (const t of trips) {
    const start = t.start_date ? new Date(t.start_date) : null;
    const end = t.end_date ? new Date(t.end_date) : null;
    if (start && end && start <= now && end >= now) groups.ongoing.push(t);
    else if (start && start > now) groups.upcoming.push(t);
    else if (end && end < now) groups.completed.push(t);
    else groups.upcoming.push(t);
  }
  return groups;
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const [trips, setTrips] = useState(null);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listTrips(token).then((d) => setTrips(d.trips)).catch((e) => setError(e.message));
    api.searchCities('').then((d) => setCities(d.cities.slice(0, 6))).catch(() => {});
  }, [token]);

  const groups = useMemo(() => groupTrips(trips || []), [trips]);

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ color: 'var(--sunset)', fontWeight: 600, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Welcome back
          </p>
          <h1 style={{ fontSize: 30, marginTop: 4 }}>{user?.name?.split(' ')[0]}'s trips</h1>
        </div>
        <Link to="/trips/new" className="btn btn-primary">+ Plan a trip</Link>
      </div>

      {error && <p className="error-text">{error}</p>}

      {trips && trips.length === 0 && (
        <div className="card empty-state" style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>No trips yet</p>
          <p style={{ marginBottom: 16 }}>Plan your first multi-city itinerary — add stops, activities, and a budget.</p>
          <Link to="/trips/new" className="btn btn-primary">Plan your first trip</Link>
        </div>
      )}

      {['ongoing', 'upcoming', 'completed'].map((key) => (
        groups[key].length > 0 && (
          <section key={key} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 14 }}>
              {key === 'ongoing' ? 'Ongoing' : key === 'upcoming' ? 'Upcoming' : 'Completed'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {groups[key].map((t) => <TripCard key={t.id} trip={t} />)}
            </div>
          </section>
        )
      ))}

      {cities.length > 0 && (
        <section>
          <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 14 }}>
            Popular destinations
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {cities.map((c) => (
              <div key={c.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <DropInImage 
                  folder="cities" 
                  name={c.name} 
                  style={{ width: '100%', height: 100, objectFit: 'cover' }}
                  fallbackStyle={{ width: '100%', height: 60 }} 
                />
                <div style={{ padding: 14 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{c.country}</p>
                  <p style={{ color: 'var(--muted-2)', fontSize: 12, marginTop: 8 }}>{c.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

