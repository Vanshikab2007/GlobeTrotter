const STOP_COLORS = ['#FF7A54', '#35CFC0', '#F2B84B', '#8C7AFF', '#5E97FF', '#FF6B9D'];

function toDate(s) { return s ? new Date(s + 'T00:00:00') : null; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmtDay(d) { return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }

export default function CalendarPanel({ trip }) {
  const stopsWithDates = trip.stops.filter((s) => s.start_date && s.end_date);

  if (stopsWithDates.length === 0) {
    return (
      <div className="card empty-state">
        <p>Add stops with dates in the Build tab to see your trip laid out day by day.</p>
      </div>
    );
  }

  const allStarts = stopsWithDates.map((s) => toDate(s.start_date));
  const allEnds = stopsWithDates.map((s) => toDate(s.end_date));
  const rangeStart = new Date(Math.min(...allStarts));
  const rangeEnd = new Date(Math.max(...allEnds));

  const days = [];
  for (let d = new Date(rangeStart); d <= rangeEnd; d = addDays(d, 1)) {
    days.push(new Date(d));
  }

  function stopForDay(day) {
    const idx = stopsWithDates.findIndex((s) => {
      const start = toDate(s.start_date);
      const end = toDate(s.end_date);
      return day >= start && day <= end;
    });
    return idx === -1 ? null : { stop: stopsWithDates[idx], color: STOP_COLORS[idx % STOP_COLORS.length] };
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        {stopsWithDates.map((s, i) => (
          <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: STOP_COLORS[i % STOP_COLORS.length] }} />
            {s.city_name}
          </span>
        ))}
      </div>

      <div className="card" style={{ padding: 8 }}>
        {days.map((day, i) => {
          const match = stopForDay(day);
          const dayActivities = match
            ? match.stop.activities.filter((a) => {
                const dayNum = Math.round((day - toDate(match.stop.start_date)) / 86400000) + 1;
                return a.day_offset === dayNum;
              })
            : [];
          return (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: '10px 12px', alignItems: 'flex-start',
              borderBottom: i < days.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <div style={{ width: 130, flexShrink: 0, fontSize: 13, color: 'var(--muted)' }}>{fmtDay(day)}</div>
              {match ? (
                <div style={{ flex: 1 }}>
                  <span className="badge" style={{ background: match.color + '22', color: match.color }}>
                    {match.stop.city_name}
                  </span>
                  {dayActivities.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {dayActivities.map((a) => (
                        <span key={a.id} style={{ fontSize: 12, color: 'var(--muted-2)' }}>
                          {a.name}{dayActivities.indexOf(a) < dayActivities.length - 1 ? ' ·' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>Free / travel day</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
