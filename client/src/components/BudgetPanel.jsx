import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const COLORS = ['#FF7A54', '#35CFC0', '#F2B84B', '#8C7AFF', '#5E97FF'];

export default function BudgetPanel({ tripId }) {
  const { token } = useAuth();
  const [budget, setBudget] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getBudget(token, tripId).then((d) => setBudget(d.budget)).catch((e) => setError(e.message));
  }, [token, tripId]);

  if (error) return <p className="error-text">{error}</p>;
  if (!budget) return <p style={{ color: 'var(--muted)' }}>Loading budget…</p>;

  const breakdownData = Object.entries(budget.breakdown).map(([name, value]) => ({ name, value }));
  const categoryData = Object.entries(budget.byActivityCategory).map(([name, value]) => ({ name, value }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, 1fr)', gap: 24 }}>
      <div className="card" style={{ padding: 24 }}>
        <p style={{ color: 'var(--muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estimated total</p>
        <h2 style={{ fontSize: 34, marginTop: 6, color: 'var(--sunset)' }}>${budget.total.toLocaleString()}</h2>
        <p style={{ color: 'var(--muted-2)', fontSize: 12, marginTop: 8 }}>
          Stay & transport are placeholder estimates (${'{'}60/night, $120/hop{'}'}) until real bookings are added — a good next milestone.
        </p>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {breakdownData.map((row, i) => (
            <div key={row.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length] }} />
                {row.name}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>${row.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <p style={{ color: 'var(--muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          Cost breakdown
        </p>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={breakdownData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {breakdownData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#141D33', border: '1px solid #26314C', borderRadius: 8, color: '#F3F5FA' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {categoryData.length > 0 && (
          <>
            <p style={{ color: 'var(--muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 20, marginBottom: 10 }}>
              Activities by category
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categoryData.map((row) => (
                <div key={row.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>{row.name}</span>
                  <span>${row.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
