import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import CitySearchModal from '../components/CitySearchModal';
import ActivitySearchModal from '../components/ActivitySearchModal';
import BudgetPanel from '../components/BudgetPanel';
import CalendarPanel from '../components/CalendarPanel';

const TABS = ['Build', 'Itinerary', 'Budget', 'Calendar'];

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TripDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Build');
  const [showCityModal, setShowCityModal] = useState(false);
  const [activityModalStop, setActivityModalStop] = useState(null);
  const [shareSlug, setShareSlug] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.getTrip(token, id).then((d) => setTrip(d.trip)).catch((e) => setError(e.message));
  }, [token, id]);

  useEffect(() => { load(); }, [load]);

  async function handleAddStop(payload) {
    setBusy(true);
    try {
      const d = await api.addStop(token, id, payload);
      setTrip(d.trip);
      setShowCityModal(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteStop(stopId) {
    if (!confirm('Remove this stop and all its activities?')) return;
    const d = await api.deleteStop(token, id, stopId);
    setTrip(d.trip);
  }

  async function handleAddActivity(stopId, payload) {
    setBusy(true);
    try {
      const d = await api.addActivity(token, id, stopId, payload);
      setTrip(d.trip);
      setActivityModalStop(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteActivity(stopId, activityId) {
    const d = await api.deleteActivity(token, id, stopId, activityId);
    setTrip(d.trip);
  }

  async function handleDeleteTrip() {
    if (!confirm(`Delete "${trip.name}"? This cannot be undone.`)) return;
    await api.deleteTrip(token, id);
    navigate('/');
  }

  async function handleShare() {
    const d = await api.shareTrip(token, id);
    setShareSlug(d.share_slug);
  }

  if (error) {
    return <div className="container" style={{ paddingTop: 60 }}><p className="error-text">{error}</p></div>;
  }
  if (!trip) {
    return <div className="container" style={{ paddingTop: 60, color: 'var(--muted)' }}>Loading trip…</div>;
  }

  return (
    <div className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 28 }}>{trip.name}</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>
            {fmt(trip.start_date)} → {fmt(trip.end_date)} · {trip.stops.length} {trip.stops.length === 1 ? 'stop' : 'stops'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleShare}>Share trip</button>
          <button className="btn btn-danger" onClick={handleDeleteTrip}>Delete</button>
        </div>
      </div>

      {trip.description && <p style={{ color: 'var(--muted-2)', marginTop: 10, maxWidth: 640 }}>{trip.description}</p>}

      {shareSlug && (
        <div className="card" style={{ padding: 14, marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--ocean)', fontSize: 13 }}>Public link (read-only):</span>
          <code style={{ fontSize: 13, color: 'var(--paper)' }}>/share/{shareSlug}</code>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginTop: 28, borderBottom: '1px solid var(--line)' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '10px 16px', background: 'transparent', border: 'none',
              borderBottom: `2px solid ${tab === t ? 'var(--sunset)' : 'transparent'}`,
              color: tab === t ? 'var(--paper)' : 'var(--muted)',
              fontWeight: 600, fontSize: 14,
            }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        {tab === 'Build' && (
          <BuildPanel
            trip={trip}
            busy={busy}
            onAddStopClick={() => setShowCityModal(true)}
            onDeleteStop={handleDeleteStop}
            onAddActivityClick={(stop) => setActivityModalStop(stop)}
            onDeleteActivity={handleDeleteActivity}
          />
        )}
        {tab === 'Itinerary' && <ItineraryPanel trip={trip} />}
        {tab === 'Budget' && <BudgetPanel tripId={id} />}
        {tab === 'Calendar' && <CalendarPanel trip={trip} />}
      </div>

      {showCityModal && (
        <CitySearchModal onClose={() => setShowCityModal(false)} onAdd={handleAddStop} />
      )}
      {activityModalStop && (
        <ActivitySearchModal
          stop={activityModalStop}
          onClose={() => setActivityModalStop(null)}
          onAdd={(payload) => handleAddActivity(activityModalStop.id, payload)}
        />
      )}
    </div>
  );
}

function BuildPanel({ trip, onAddStopClick, onDeleteStop, onAddActivityClick, onDeleteActivity }) {
  return (
    <div>
      {trip.stops.length === 0 && (
        <div className="card empty-state" style={{ marginBottom: 20 }}>
          <p style={{ color: 'var(--paper)', marginBottom: 6 }}>No stops yet</p>
          <p>Add the first city on this trip to start building the itinerary.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {trip.stops.map((stop, i) => (
          <div key={stop.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge" style={{ background: 'var(--sunset-dim)', color: 'var(--sunset)', marginBottom: 8 }}>
                  Stop {i + 1}
                </span>
                <h3 style={{ fontSize: 18 }}>{stop.city_name}{stop.country ? `, ${stop.country}` : ''}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{fmt(stop.start_date)} → {fmt(stop.end_date)}</p>
              </div>
              <button className="btn-ghost btn" onClick={() => onDeleteStop(stop.id)}>Remove stop</button>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stop.activities.map((a) => (
                <div key={a.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--ink-900)',
                }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 8 }}>
                      Day {a.day_offset} · {a.category}{a.duration_hours ? ` · ${a.duration_hours}h` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--gold)' }}>{a.cost ? `$${a.cost}` : 'Free'}</span>
                    <button className="btn-ghost btn" onClick={() => onDeleteActivity(stop.id, a.id)} style={{ padding: 4 }}>✕</button>
                  </div>
                </div>
              ))}
              {stop.activities.length === 0 && (
                <p style={{ color: 'var(--muted-2)', fontSize: 13 }}>No activities added yet.</p>
              )}
            </div>

            <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={() => onAddActivityClick(stop)}>
              + Add activity
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onAddStopClick}>
        + Add another stop
      </button>
    </div>
  );
}

function ItineraryPanel({ trip }) {
  if (trip.stops.length === 0) {
    return <div className="card empty-state"><p>Add stops and activities in the Build tab to see your itinerary here.</p></div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {trip.stops.map((stop) => {
        const byDay = {};
        for (const a of stop.activities) {
          const day = a.day_offset || 1;
          (byDay[day] = byDay[day] || []).push(a);
        }
        const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);
        return (
          <div key={stop.id}>
            <h3 style={{ fontSize: 18, marginBottom: 4 }}>{stop.city_name}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>{fmt(stop.start_date)} → {fmt(stop.end_date)}</p>
            {days.length === 0 && <p style={{ color: 'var(--muted-2)', fontSize: 13 }}>No activities scheduled for this stop.</p>}
            {days.map((day) => (
              <div key={day} style={{ marginBottom: 16 }}>
                <div className="badge" style={{ background: 'var(--ocean-dim)', color: 'var(--ocean)', marginBottom: 8 }}>Day {day}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {byDay[day].map((a) => (
                    <div key={a.id} style={{
                      display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
                      borderRadius: 10, border: '1px solid var(--line)', background: 'var(--ink-900)',
                    }}>
                      <span style={{ fontSize: 14 }}>{a.name}</span>
                      <span style={{ fontSize: 13, color: 'var(--gold)' }}>{a.cost ? `$${a.cost}` : 'Free'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
