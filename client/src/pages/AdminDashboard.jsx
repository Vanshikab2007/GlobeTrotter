import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAdminStats(token)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) return <div className="container" style={{ paddingTop: 60 }}><p className="error-text">{error}</p></div>;
  if (!data) return <div className="container" style={{ paddingTop: 60, color: 'var(--muted)' }}>Loading stats...</div>;

  const { stats, popularDestinations, usersGrowth } = data;

  return (
    <div className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Admin Dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>
        Platform-wide statistics and analytics overview.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</p>
          <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--sunset)', marginTop: 8 }}>{stats.totalUsers}</p>
        </div>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Trips</p>
          <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--sunset)', marginTop: 8 }}>{stats.totalTrips}</p>
        </div>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cities Visited</p>
          <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--ocean)', marginTop: 8 }}>{stats.totalStops}</p>
        </div>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activities Planned</p>
          <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--gold)', marginTop: 8 }}>{stats.totalActivities}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 24 }}>Most Popular Destinations</h2>
          {popularDestinations.length > 0 ? (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularDestinations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="city_name" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'var(--surface-sunken)' }}
                    contentStyle={{ background: 'var(--bg-main)', border: '1px solid var(--line)', borderRadius: 8 }} 
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {popularDestinations.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--sunset)' : 'var(--ocean)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: 'var(--muted)' }}>No destinations added yet.</p>
          )}
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 24 }}>Recent User Growth</h2>
          {usersGrowth.length > 0 ? (
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usersGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'var(--surface-sunken)' }}
                    contentStyle={{ background: 'var(--bg-main)', border: '1px solid var(--line)', borderRadius: 8 }} 
                  />
                  <Bar dataKey="count" fill="var(--sunset)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: 'var(--muted)' }}>No data available.</p>
          )}
        </section>
      </div>
    </div>
  );
}

