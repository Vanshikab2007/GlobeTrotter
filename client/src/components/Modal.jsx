export default function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(5,8,16,0.7)',
        display: 'grid', placeItems: 'center', zIndex: 50, padding: 20,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 24 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 17 }}>{title}</h3>
          <button className="btn-ghost btn" onClick={onClose} aria-label="Close" style={{ fontSize: 18, padding: 4 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
