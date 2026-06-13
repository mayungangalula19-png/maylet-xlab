// C:\Users\user\maylet-xlab\src\app\routes\Hackathons.tsx
// PROFESSIONAL HACKATHON HUB – Browse, register, and track hackathons

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
type HackathonStatus = 'upcoming' | 'ongoing' | 'completed';
type HackathonMode = 'online' | 'offline' | 'hybrid';

interface Hackathon {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  mode: HackathonMode;
  location: string | null;
  prize_pool: number;
  max_participants: number | null;
  registered_count: number;
  status: HackathonStatus;
  image_url: string | null;
  organizer: string;
  created_at: string;
}

interface UserRegistration {
  id: string;
  hackathon_id: string;
  user_id: string;
  team_name: string | null;
  registered_at: string;
}

// ============================================================
// HACKATHON CARD COMPONENT
// ============================================================
const HackathonCard = ({ hackathon, isRegistered, onRegister, onView }: {
  hackathon: Hackathon;
  isRegistered: boolean;
  onRegister: (id: string) => void;
  onView: (hackathon: Hackathon) => void;
}) => {
  const statusColors = {
    upcoming: '#f6c90e',
    ongoing: '#2fd4ff',
    completed: '#48bb78',
  };

  const getModeIcon = (mode: HackathonMode) => {
    switch(mode) {
      case 'online': return '💻';
      case 'offline': return '📍';
      case 'hybrid': return '🔄';
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  return (
    <div className="hackathon-card">
      <div className="card-image">
        {hackathon.image_url ? (
          <img loading="lazy" decoding="async" src={hackathon.image_url} alt={hackathon.title} />
        ) : (
          <div className="image-placeholder">🏆</div>
        )}
      </div>
      <div className="card-content">
        <div className="card-header">
          <h3>{hackathon.title}</h3>
          <span className="status-badge" style={{ background: statusColors[hackathon.status] }}>
            {hackathon.status.toUpperCase()}
          </span>
        </div>
        <p className="description">{hackathon.description.substring(0, 100)}...</p>
        <div className="details">
          <span>📅 {formatDate(hackathon.start_date)} – {formatDate(hackathon.end_date)}</span>
          <span>{getModeIcon(hackathon.mode)} {hackathon.mode}</span>
          {hackathon.location && <span>📍 {hackathon.location}</span>}
          <span>🏆 ${hackathon.prize_pool.toLocaleString()}</span>
          <span>👥 {hackathon.registered_count} / {hackathon.max_participants || '∞'}</span>
        </div>
        <div className="card-actions">
          <button onClick={() => onView(hackathon)} className="btn-view">View Details</button>
          {hackathon.status !== 'completed' && (
            <button
              onClick={() => onRegister(hackathon.id)}
              disabled={isRegistered}
              className={`btn-register ${isRegistered ? 'registered' : ''}`}
            >
              {isRegistered ? '✓ Registered' : 'Register'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// HACKATHON DETAIL MODAL
// ============================================================
const HackathonDetailModal = ({ hackathon, onClose, onRegister, isRegistered }: {
  hackathon: Hackathon;
  onClose: () => void;
  onRegister: (id: string) => void;
  isRegistered: boolean;
}) => {
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>{hackathon.title}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          <div className="detail-section">
            <strong>Organizer:</strong> {hackathon.organizer}
          </div>
          <div className="detail-section">
            <strong>Dates:</strong> {formatDate(hackathon.start_date)} – {formatDate(hackathon.end_date)}
          </div>
          <div className="detail-section">
            <strong>Mode:</strong> {hackathon.mode} {hackathon.location ? `· ${hackathon.location}` : ''}
          </div>
          <div className="detail-section">
            <strong>Prize Pool:</strong> ${hackathon.prize_pool.toLocaleString()}
          </div>
          <div className="detail-section">
            <strong>Participants:</strong> {hackathon.registered_count} / {hackathon.max_participants || 'Unlimited'}
          </div>
          <div className="detail-section">
            <strong>Description:</strong>
            <p>{hackathon.description}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">Close</button>
          {hackathon.status !== 'completed' && (
            <button onClick={() => onRegister(hackathon.id)} disabled={isRegistered} className="btn-register-modal">
              {isRegistered ? 'Already Registered' : 'Register Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN HACKATHONS PAGE
// ============================================================
const Hackathons = () => {
  const [loading, setLoading] = useState(true);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<UserRegistration[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<Hackathon | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const fetchHackathons = useCallback(async () => {
    let query = supabase.from('hackathons').select('*');
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (modeFilter !== 'all') query = query.eq('mode', modeFilter);
    const { data, error } = await query.order('start_date', { ascending: true });
    if (!error) setHackathons(data || []);
    setLoading(false);
  }, [statusFilter, modeFilter]);

  const fetchMyRegistrations = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('hackathon_registrations')
      .select('*')
      .eq('user_id', userId);
    if (!error) setMyRegistrations(data || []);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchHackathons();
      fetchMyRegistrations();
    }
  }, [userId, statusFilter, modeFilter, fetchHackathons, fetchMyRegistrations]);

  // Real-time subscription for hackathon changes (e.g., registered_count updates)
  useEffect(() => {
    const channel = supabase
      .channel('hackathons')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hackathons' }, () => fetchHackathons())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [fetchHackathons]);

  const handleRegister = async (hackathonId: string) => {
    if (!userId) return;
    const hackathon = hackathons.find(h => h.id === hackathonId);
    if (!hackathon) return;
    if (hackathon.max_participants && hackathon.registered_count >= hackathon.max_participants) {
      alert('This hackathon has reached its maximum number of participants.');
      return;
    }
    const { error } = await supabase.from('hackathon_registrations').insert({
      hackathon_id: hackathonId,
      user_id: userId,
      registered_at: new Date().toISOString(),
    });
    if (error) {
      alert('Registration failed: ' + error.message);
    } else {
      // Increment registered_count in hackathons table (best done via DB trigger, but manual for simplicity)
      await supabase.rpc('increment_hackathon_registrations', { hackathon_id: hackathonId });
      fetchMyRegistrations();
      fetchHackathons();
      alert('Successfully registered!');
    }
  };

  const isRegistered = (hackathonId: string) => myRegistrations.some(r => r.hackathon_id === hackathonId);

  if (loading) {
    return (
      <div className="hackathons-container">
        <main className="hackathons-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="hackathons-container">
      <main className="hackathons-main">
        <div className="hackathons-header">
          <h1>🏆 Hackathons</h1>
          <p>Discover and join innovation competitions to build, pitch, and win</p>
        </div>

        <div className="filters-bar">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
          <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
            <option value="all">All Modes</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {hackathons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>No hackathons found</h3>
            <p>Check back later for upcoming competitions.</p>
          </div>
        ) : (
          <div className="hackathons-grid">
            {hackathons.map(h => (
              <HackathonCard
                key={h.id}
                hackathon={h}
                isRegistered={isRegistered(h.id)}
                onRegister={handleRegister}
                onView={setSelectedHackathon}
              />
            ))}
          </div>
        )}

        {selectedHackathon && (
          <HackathonDetailModal
            hackathon={selectedHackathon}
            onClose={() => setSelectedHackathon(null)}
            onRegister={handleRegister}
            isRegistered={isRegistered(selectedHackathon.id)}
          />
        )}
      </main>

      <style>{`
        .hackathons-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .hackathons-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .hackathons-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .hackathons-header {
          margin-bottom: 2rem;
        }
        .hackathons-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .filters-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .filters-bar select {
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          padding: 0.5rem 1rem;
          color: white;
        }
        .hackathons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        .hackathon-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          overflow: hidden;
          transition: transform 0.2s;
        }
        .hackathon-card:hover {
          transform: translateY(-4px);
        }
        .card-image {
          height: 140px;
          background: #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .image-placeholder {
          font-size: 3rem;
        }
        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .card-content {
          padding: 1rem;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          color: #0a0d1a;
          font-weight: 600;
        }
        .description {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
          margin: 0.5rem 0;
        }
        .details {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
          margin: 0.5rem 0;
        }
        .card-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .btn-view, .btn-register {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.3rem 0.8rem;
          border-radius: 30px;
          cursor: pointer;
        }
        .btn-view:hover {
          background: #7c5fe6;
        }
        .btn-register {
          background: #2fd4ff;
          color: #0a0d1a;
        }
        .btn-register.registered {
          background: #48bb78;
          cursor: default;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
        }
        .loading-spinner {
          width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6;
          border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .modal-overlay {
          position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.8);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content {
          background: #1a1a2e; border-radius: 20px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;
        }
        .modal-content.large { max-width: 700px; }
        .modal-header { display: flex; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .modal-body { padding: 1.5rem; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
        .detail-section { margin-bottom: 1rem; }
        .btn-cancel, .btn-register-modal { padding: 0.4rem 1rem; border-radius: 30px; border: none; cursor: pointer; }
        .btn-cancel { background: rgba(255,255,255,0.1); color: white; }
        .btn-register-modal { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default Hackathons;