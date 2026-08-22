import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function CreateTrip() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      setError('End date must be after the start date.');
      return;
    }
    setLoading(true);
    try {
      const { trip } = await api.createTrip(token, form);
      navigate(`/trips/${trip.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 40, maxWidth: 560 }}>
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>Plan a new trip</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>Give it a name and rough dates — you can add cities and activities next.</p>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
        <div className="field">
          <label htmlFor="name">Trip name</label>
          <input className="input" id="name" required value={form.name}
            onChange={(e) => update('name', e.target.value)} placeholder="e.g. Japan Adventure" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label htmlFor="start">Start date</label>
            <input className="input" id="start" type="date" value={form.start_date}
              onChange={(e) => update('start_date', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="end">End date</label>
            <input className="input" id="end" type="date" value={form.end_date}
              onChange={(e) => update('end_date', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="desc">Description (optional)</label>
          <textarea className="input" id="desc" rows={3} value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="What's this trip about?" style={{ resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Creating…' : 'Create trip & build itinerary'}
        </button>
      </form>
    </div>
  );
}
