import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function UserProfile() {
  const { user, token, updateUser } = useAuth();
  
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    city: user?.city || '',
    country: user?.country || '',
    phone_number: user?.phone_number || ''
  });
  
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || null);
  const [trips, setTrips] = useState([]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Fetch user's trips to display as "Preferred Trips" or saved trips
    api.listTrips(token).then((d) => setTrips(d.trips)).catch(() => {});
  }, [token]);

  function handleUpdate(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = { ...form, profile_photo: profilePhoto };
      const { user: updatedUser } = await api.updateUser(token, payload);
      updateUser(updatedUser);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize avatar to max 400x400
        const MAX_SIZE = 400;
        if (width > height && width > MAX_SIZE) {
          height = Math.round(height * (MAX_SIZE / width));
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round(width * (MAX_SIZE / height));
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setProfilePhoto(base64);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 2fr)', gap: 32 }}>
        
        {/* Left Col: Profile Edit */}
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 24 }}>Your Profile</h1>
          
          <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              <div 
                style={{ 
                  width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', 
                  background: 'var(--ink-900)', border: '2px solid var(--line)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 32 }}>👤</span>
                )}
              </div>
              <div>
                <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  Change Photo
                </button>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                />
              </div>
            </div>

            <div className="field">
              <label>Name</label>
              <input className="input" name="name" required value={form.name} onChange={handleUpdate} />
            </div>

            <div className="field">
              <label>Email Address</label>
              <input className="input" type="email" name="email" required value={form.email} onChange={handleUpdate} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label>City</label>
                <input className="input" name="city" value={form.city} onChange={handleUpdate} placeholder="e.g. London" />
              </div>
              <div className="field">
                <label>Country</label>
                <input className="input" name="country" value={form.country} onChange={handleUpdate} placeholder="e.g. UK" />
              </div>
            </div>

            <div className="field">
              <label>Phone Number</label>
              <input className="input" type="tel" name="phone_number" value={form.phone_number} onChange={handleUpdate} placeholder="e.g. +1 234 567 890" />
            </div>

            {error && <p className="error-text">{error}</p>}
            {success && <p style={{ color: 'var(--ocean)', fontSize: 14, marginBottom: 16 }}>{success}</p>}
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Right Col: Saved Trips / Stats */}
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 24, marginTop: 4 }}>Preferred Trips</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {trips.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No trips created yet.</p>
            ) : (
              trips.map(trip => (
                <div key={trip.id} className="card" style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 8, color: 'var(--sunset)' }}>{trip.name}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 13 }}>{trip.stopCount} stops</p>
                  <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
                    {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : 'Unscheduled'}
                  </p>
                  <a href={`/trips/${trip.id}`} className="btn-ghost" style={{ fontSize: 13, textDecoration: 'none' }}>View Trip →</a>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
