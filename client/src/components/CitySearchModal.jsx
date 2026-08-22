import { useEffect, useState } from 'react';
import Modal from './Modal';
import { api } from '../lib/api';

export default function CitySearchModal({ onClose, onAdd }) {
  const [q, setQ] = useState('');
  const [cities, setCities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dates, setDates] = useState({ start_date: '', end_date: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => {
      api.searchCities(q).then((d) => setCities(d.cities)).catch(() => {});
    }, 200);
    return () => clearTimeout(handle);
  }, [q]);

  function handleAdd(e) {
    e.preventDefault();
    if (!dates.start_date || !dates.end_date) {
      setError('Pick a start and end date for this stop.');
      return;
    }
    if (dates.start_date > dates.end_date) {
      setError('End date must be after the start date.');
      return;
    }
    onAdd({
      city_id: selected.id,
      city_name: selected.name,
      country: selected.country,
      ...dates,
    });
  }

  if (selected) {
    return (
      <Modal title={`Add ${selected.name}`} onClose={onClose}>
        <form onSubmit={handleAdd}>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>{selected.blurb}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field">
              <label>Arrive</label>
              <input className="input" type="date" value={dates.start_date}
                onChange={(e) => setDates((d) => ({ ...d, start_date: e.target.value }))} required />
            </div>
            <div className="field">
              <label>Depart</label>
              <input className="input" type="date" value={dates.end_date}
                onChange={(e) => setDates((d) => ({ ...d, end_date: e.target.value }))} required />
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Back</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add stop to trip</button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal title="Search cities" onClose={onClose}>
      <input
        className="input" autoFocus placeholder="Search by city or country…"
        value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 14 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
        {cities.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              textAlign: 'left', padding: '12px 14px', borderRadius: 10,
              border: '1px solid var(--line)', background: 'var(--surface-sunken)', color: 'var(--text-primary)',
            }}
          >
            <span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
              <span style={{ color: 'var(--muted)', fontSize: 12, display: 'block' }}>{c.country}</span>
            </span>
            <span className="badge" style={{ background: 'var(--sunset-dim)', color: 'var(--sunset)' }}>
              cost {c.cost_index}
            </span>
          </button>
        ))}
        {cities.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No cities match "{q}".</p>}
      </div>
    </Modal>
  );
}
