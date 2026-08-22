import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SharedTrip() {
  const { slug } = useParams();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPublicTrip(slug).then((d) => setTrip(d.trip)).catch((e) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <p className="error-text">{error}</p>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: 16, display: 'inline-flex' }}>Go to GlobeTrotter</Link>
      </div>
    );
  }
  if (!trip) return <div className="container" style={{ paddingTop: 80, color: 'var(--muted)' }}>Loading…</div>;

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 64, maxWidth: 720 }}>
      <span className="badge" style={{ background: 'var(--ocean-dim)', color: 'var(--ocean)', marginBottom: 12 }}>
        Shared itinerary · read only
      </span>
      <h1 style={{ fontSize: 30, marginTop: 10 }}>{trip.name}</h1>
      <p style={{ color: 'var(--muted)', marginTop: 8 }}>{fmt(trip.start_date)} → {fmt(trip.end_date)}</p>
      {trip.description && <p style={{ color: 'var(--muted-2)', marginTop: 12 }}>{trip.description}</p>}

      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {trip.stops.map((stop) => (
          <div key={stop.id} className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 17 }}>{stop.city_name}{stop.country ? `, ${stop.country}` : ''}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{fmt(stop.start_date)} → {fmt(stop.end_date)}</p>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stop.activities.map((a) => (
                <div key={a.id} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '9px 12px',
                  borderRadius: 8, border: '1px solid var(--line)', background: 'var(--ink-900)', fontSize: 13,
                }}>
                  <span>{a.name}</span>
                  <span style={{ color: 'var(--gold)' }}>{a.cost ? `$${a.cost}` : 'Free'}</span>
                </div>
              ))}
              {stop.activities.length === 0 && <p style={{ color: 'var(--muted-2)', fontSize: 13 }}>No activities added.</p>}
            </div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: 40 }}>
        <Link to="/" className="btn btn-primary">Plan your own trip on GlobeTrotter</Link>
      </p>
    </div>
  );
}
