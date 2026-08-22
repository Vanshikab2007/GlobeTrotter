import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import CitySearchModal from '../components/CitySearchModal';
import ActivitySearchModal from '../components/ActivitySearchModal';
import BudgetPanel from '../components/BudgetPanel';
import CalendarPanel from '../components/CalendarPanel';
import Modal from '../components/Modal';
import DropInImage from '../components/DropInImage';

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

  // Edit Modals State
  const [editTripOpen, setEditTripOpen] = useState(false);
  const [editStop, setEditStop] = useState(null);
  const [editActivity, setEditActivity] = useState(null);

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

  async function handleMoveStop(stopId, direction) {
    const sorted = [...trip.stops].sort((a,b) => a.order_index - b.order_index || new Date(a.start_date) - new Date(b.start_date));
    const idx = sorted.findIndex(s => s.id === stopId);
    if (idx < 0) return;
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    
    const temp = sorted[idx];
    sorted[idx] = sorted[swapIdx];
    sorted[swapIdx] = temp;
    
    setBusy(true);
    try {
      let latestTrip = trip;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].order_index !== i) {
          const res = await api.updateStop(token, id, sorted[i].id, { order_index: i });
          latestTrip = res.trip;
        }
      }
      setTrip(latestTrip);
    } catch(e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <div className="container" style={{ paddingTop: 60 }}><p className="error-text">{error}</p></div>;
  }
  if (!trip) {
    return <div className="container" style={{ paddingTop: 60, color: 'var(--muted)' }}>Loading trip…</div>;
  }

  return (
    <div className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden' }}>
        <DropInImage 
          folder="trips" 
          name={trip.name} 
          coverOverride={trip.cover_photo}
          style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 28 }}>{trip.name}</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>
            {fmt(trip.start_date)} → {fmt(trip.end_date)} · {trip.stops.length} {trip.stops.length === 1 ? 'stop' : 'stops'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <CoverUploadButton tripId={trip.id} token={token} onUploaded={(t) => setTrip(t)} />
          <button className="btn btn-secondary" onClick={() => setEditTripOpen(true)}>Edit</button>
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
            onEditStop={(s) => setEditStop(s)}
            onMoveStop={handleMoveStop}
            onAddActivityClick={(stop) => setActivityModalStop(stop)}
            onDeleteActivity={handleDeleteActivity}
            onEditActivity={(stop, act) => setEditActivity({ stop, act })}
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

      {editTripOpen && (
        <EditTripModal trip={trip} token={token} onClose={() => setEditTripOpen(false)} onSaved={(t) => setTrip(t)} />
      )}
      {editStop && (
        <EditStopModal stop={editStop} tripId={trip.id} token={token} onClose={() => setEditStop(null)} onSaved={(t) => setTrip(t)} />
      )}
      {editActivity && (
        <EditActivityModal stop={editActivity.stop} activity={editActivity.act} tripId={trip.id} token={token} onClose={() => setEditActivity(null)} onSaved={(t) => setTrip(t)} />
      )}
    </div>
  );
}

function BuildPanel({ trip, onAddStopClick, onDeleteStop, onEditStop, onMoveStop, onAddActivityClick, onDeleteActivity, onEditActivity }) {
  const sortedStops = [...trip.stops].sort((a,b) => a.order_index - b.order_index || new Date(a.start_date) - new Date(b.start_date));
  
  return (
    <div>
      {trip.stops.length === 0 && (
        <div className="card empty-state" style={{ marginBottom: 20 }}>
          <p style={{ color: 'var(--paper)', marginBottom: 6 }}>No stops yet</p>
          <p>Add the first city on this trip to start building the itinerary.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sortedStops.map((stop, i) => (
          <div key={stop.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge" style={{ background: 'var(--sunset-dim)', color: 'var(--sunset)', marginBottom: 8 }}>
                  Stop {i + 1}
                </span>
                <h3 style={{ fontSize: 18 }}>{stop.city_name}{stop.country ? `, ${stop.country}` : ''}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{fmt(stop.start_date)} → {fmt(stop.end_date)}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {i > 0 && <button className="btn-ghost btn" onClick={() => onMoveStop(stop.id, -1)}>↑</button>}
                {i < sortedStops.length - 1 && <button className="btn-ghost btn" onClick={() => onMoveStop(stop.id, 1)}>↓</button>}
                <button className="btn-ghost btn" onClick={() => onEditStop(stop)}>Edit</button>
                <button className="btn-ghost btn" onClick={() => onDeleteStop(stop.id)}>✕</button>
              </div>
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
                    <button className="btn-ghost btn" onClick={() => onEditActivity(stop, a)} style={{ padding: 4 }}>Edit</button>
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
  const sortedStops = [...trip.stops].sort((a,b) => a.order_index - b.order_index || new Date(a.start_date) - new Date(b.start_date));
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {sortedStops.map((stop) => {
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

// --- Edit Modals ---

function EditTripModal({ trip, token, onClose, onSaved }) {
  const [name, setName] = useState(trip.name || '');
  const [description, setDescription] = useState(trip.description || '');
  const [startDate, setStartDate] = useState(trip.start_date || '');
  const [endDate, setEndDate] = useState(trip.end_date || '');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const d = await api.updateTrip(token, trip.id, { name, description, start_date: startDate, end_date: endDate });
      onSaved(d.trip);
      onClose();
    } catch(err) {
      setError(err.message);
    }
  }

  return (
    <Modal title="Edit Trip" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Trip Name</label>
          <input className="input" required value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label>Start Date</label>
            <input type="date" className="input" required value={startDate} onChange={e=>setStartDate(e.target.value)} />
          </div>
          <div className="field">
            <label>End Date</label>
            <input type="date" className="input" required value={endDate} onChange={e=>setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="input" value={description} onChange={e=>setDescription(e.target.value)} rows={3}></textarea>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Save Trip</button>
      </form>
    </Modal>
  );
}

function EditStopModal({ tripId, stop, token, onClose, onSaved }) {
  const [startDate, setStartDate] = useState(stop.start_date || '');
  const [endDate, setEndDate] = useState(stop.end_date || '');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const d = await api.updateStop(token, tripId, stop.id, { start_date: startDate, end_date: endDate });
      onSaved(d.trip);
      onClose();
    } catch(err) {
      setError(err.message);
    }
  }

  return (
    <Modal title={`Edit ${stop.city_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label>Arrive</label>
            <input type="date" className="input" required value={startDate} onChange={e=>setStartDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Depart</label>
            <input type="date" className="input" required value={endDate} onChange={e=>setEndDate(e.target.value)} />
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Save Stop</button>
      </form>
    </Modal>
  );
}

function EditActivityModal({ tripId, stop, activity, token, onClose, onSaved }) {
  const [name, setName] = useState(activity.name || '');
  const [category, setCategory] = useState(activity.category || 'Other');
  const [cost, setCost] = useState(activity.cost || 0);
  const [duration, setDuration] = useState(activity.duration_hours || '');
  const [day, setDay] = useState(activity.day_offset || 1);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const d = await api.updateActivity(token, tripId, stop.id, activity.id, { 
        name, category, cost: Number(cost), duration_hours: duration ? Number(duration) : null, day_offset: Number(day) 
      });
      onSaved(d.trip);
      onClose();
    } catch(err) {
      setError(err.message);
    }
  }

  return (
    <Modal title="Edit Activity" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input className="input" required value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label>Category</label>
            <input className="input" required value={category} onChange={e=>setCategory(e.target.value)} />
          </div>
          <div className="field">
            <label>Cost ($)</label>
            <input type="number" step="0.01" min="0" className="input" required value={cost} onChange={e=>setCost(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label>Day of stop (1 = first day)</label>
            <input type="number" min="1" className="input" required value={day} onChange={e=>setDay(e.target.value)} />
          </div>
          <div className="field">
            <label>Duration (hours, optional)</label>
            <input type="number" step="0.5" min="0" className="input" value={duration} onChange={e=>setDuration(e.target.value)} />
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Save Activity</button>
      </form>
    </Modal>
  );
}

function CoverUploadButton({ tripId, token, onUploaded }) {
  const [busy, setBusy] = useState(false);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    setBusy(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let scaleSize = 1;
        if (img.width > MAX_WIDTH) {
          scaleSize = MAX_WIDTH / img.width;
        }
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
          const res = await api.uploadTripCover(token, tripId, dataUrl);
          onUploaded(res.trip);
        } catch (err) {
          alert(err.message);
        } finally {
          setBusy(false);
          e.target.value = ''; // reset input
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  return (
    <label className="btn btn-secondary" style={{ cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
      {busy ? 'Uploading...' : 'Upload cover'}
      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} disabled={busy} />
    </label>
  );
}
