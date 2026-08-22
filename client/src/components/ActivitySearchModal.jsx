import { useEffect, useState } from 'react';
import Modal from './Modal';
import { api } from '../lib/api';

const CATEGORIES = ['All', 'Sightseeing', 'Food', 'Adventure', 'Entertainment', 'Other'];

export default function ActivitySearchModal({ stop, onClose, onAdd }) {
  const [activities, setActivities] = useState([]);
  const [category, setCategory] = useState('All');
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ name: '', category: 'Other', cost: '', duration_hours: '', day_offset: 1 });

  useEffect(() => {
    if (stop.city_id) {
      api.cityActivities(stop.city_id).then((d) => setActivities(d.activities)).catch(() => {});
    }
  }, [stop.city_id]);

  const filtered = category === 'All' ? activities : activities.filter((a) => a.category === category);

  function addCatalogActivity(a) {
    onAdd({ name: a.name, category: a.category, cost: a.cost, duration_hours: a.duration_hours, day_offset: 1 });
  }

  function handleCustomSubmit(e) {
    e.preventDefault();
    if (!custom.name) return;
    onAdd({
      name: custom.name,
      category: custom.category,
      cost: Number(custom.cost) || 0,
      duration_hours: Number(custom.duration_hours) || null,
      day_offset: Number(custom.day_offset) || 1,
    });
  }

  return (
    <Modal title={`Activities in ${stop.city_name}`} onClose={onClose} width={560}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)} className="btn"
            style={{
              padding: '6px 12px', fontSize: 12,
              background: category === c ? 'var(--sunset)' : 'transparent',
              color: category === c ? '#211008' : 'var(--muted)',
              border: '1px solid ' + (category === c ? 'var(--sunset)' : 'var(--line)'),
            }}>
            {c}
          </button>
        ))}
      </div>

      {!customOpen ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
            {filtered.map((a) => (
              <div key={a.id} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>{a.description}</p>
                  <p style={{ color: 'var(--muted-2)', fontSize: 12, marginTop: 4 }}>
                    {a.category} · {a.duration_hours}h · {a.cost === 0 ? 'Free' : `$${a.cost}`}
                  </p>
                </div>
                <button className="btn btn-secondary" onClick={() => addCatalogActivity(a)} style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>
                  + Add
                </button>
              </div>
            ))}
            {filtered.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No activities in this category yet.</p>}
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => setCustomOpen(true)}>
            + Add a custom activity instead
          </button>
        </>
      ) : (
        <form onSubmit={handleCustomSubmit}>
          <div className="field">
            <label>Activity name</label>
            <input className="input" required value={custom.name}
              onChange={(e) => setCustom((c) => ({ ...c, name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field">
              <label>Category</label>
              <select className="input" value={custom.category}
                onChange={(e) => setCustom((c) => ({ ...c, category: e.target.value }))}>
                {CATEGORIES.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Day (trip day #)</label>
              <input className="input" type="number" min={1} value={custom.day_offset}
                onChange={(e) => setCustom((c) => ({ ...c, day_offset: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field">
              <label>Cost ($)</label>
              <input className="input" type="number" min={0} step="0.01" value={custom.cost}
                onChange={(e) => setCustom((c) => ({ ...c, cost: e.target.value }))} />
            </div>
            <div className="field">
              <label>Duration (hrs)</label>
              <input className="input" type="number" min={0} step="0.5" value={custom.duration_hours}
                onChange={(e) => setCustom((c) => ({ ...c, duration_hours: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCustomOpen(false)}>Back</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add activity</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
