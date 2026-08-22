import { Link } from 'react-router-dom';
import DropInImage from './DropInImage';

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TripCard({ trip }) {
  return (
    <Link to={`/trips/${trip.id}`} className="card" style={{
      display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, textDecoration: 'none', color: 'inherit',
      transition: 'border-color 0.15s ease', minWidth: 220,
    }}>
      <DropInImage 
        folder="trips" 
        name={trip.name} 
        style={{ width: '100%', height: 120, objectFit: 'cover' }}
        fallbackStyle={{ width: '100%', height: 80 }} 
      />
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontSize: 16 }}>{trip.name}</h3>
          <span className="badge" style={{ background: 'var(--ocean-dim)', color: 'var(--ocean)' }}>
            {trip.stopCount} {trip.stopCount === 1 ? 'stop' : 'stops'}
          </span>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>
          {fmt(trip.start_date)} → {fmt(trip.end_date)}
        </p>
        {trip.description && (
          <p style={{ color: 'var(--muted-2)', fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
            {trip.description.length > 90 ? trip.description.slice(0, 90) + '…' : trip.description}
          </p>
        )}
      </div>
    </Link>
  );
}
