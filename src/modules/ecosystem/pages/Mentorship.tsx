// C:\Users\user\maylet-xlab\src\app\routes\Mentorship.tsx
// PROFESSIONAL MENTORSHIP HUB – Find mentors, request sessions, track progress

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface Mentor {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  title: string;
  expertise: string[];      // e.g. ['AI', 'Product', 'Funding']
  bio: string;
  years_experience: number;
  hourly_rate: number | null;
  rating: number;           // average rating from reviews
  total_sessions: number;
  is_active: boolean;
}

interface MentorshipRequest {
  id: string;
  mentor_id: string;
  mentor_name?: string;
  mentor_avatar?: string;
  user_id: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_date: string;
  scheduled_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface MentorshipSession {
  id: string;
  request_id: string;
  mentor_id: string;
  mentor_name?: string;
  user_id: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  feedback: string | null;
  rating: number | null;
}

// ============================================================
// COMPONENTS
// ============================================================
const MentorCard = ({ mentor, onRequest }: { mentor: Mentor; onRequest: (mentor: Mentor) => void }) => (
  <div className="mentor-card">
    <div className="mentor-avatar">
      {mentor.avatar_url ? <img loading="lazy" decoding="async" src={mentor.avatar_url} alt={mentor.full_name} /> : <span>{mentor.full_name.charAt(0)}</span>}
    </div>
    <div className="mentor-info">
      <h3>{mentor.full_name}</h3>
      <p className="mentor-title">{mentor.title}</p>
      <div className="mentor-expertise">
        {mentor.expertise.slice(0, 3).map(exp => <span key={exp} className="expertise-tag">{exp}</span>)}
      </div>
      <div className="mentor-stats">
        <span>⭐ {mentor.rating.toFixed(1)}</span>
        <span>📅 {mentor.years_experience} years</span>
        <span>🎓 {mentor.total_sessions} sessions</span>
      </div>
      <p className="mentor-bio">{mentor.bio.substring(0, 100)}...</p>
    </div>
    <div className="mentor-actions">
      {mentor.hourly_rate && <div className="rate">${mentor.hourly_rate}/hour</div>}
      <button onClick={() => onRequest(mentor)} className="btn-request">Request Session</button>
    </div>
  </div>
);

const RequestModal = ({ mentor, onClose, onSubmit }: { mentor: Mentor; onClose: () => void; onSubmit: (message: string) => void }) => {
  const [message, setMessage] = useState('');
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Request Mentorship from {mentor.full_name}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          <textarea
            placeholder="Why do you want to connect with this mentor? What specific challenges do you need help with?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
          />
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={() => onSubmit(message)} disabled={!message.trim()} className="btn-submit">Send Request</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN MENTORSHIP PAGE
// ============================================================
const Mentorship = () => {
  const [activeTab, setActiveTab] = useState<'mentors' | 'sessions' | 'requests'>('mentors');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    const userId = session.user.id;

    try {
      // Fetch active mentors
      const { data: mentorsData, error: mError } = await supabase
        .from('mentors')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });
      if (mError) throw mError;
      setMentors(mentorsData as Mentor[]);

      // Fetch mentorship requests made by this user
      const { data: reqData, error: rError } = await supabase
        .from('mentorship_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (rError) throw rError;
      // enrich with mentor names
      const enrichedReqs = await Promise.all((reqData || []).map(async (req) => {
        const { data: mentor } = await supabase.from('mentors').select('full_name, avatar_url').eq('id', req.mentor_id).single();
        return { ...req, mentor_name: mentor?.full_name || 'Unknown', mentor_avatar: mentor?.avatar_url };
      }));
      setRequests(enrichedReqs);

      // Fetch upcoming/completed sessions
      const { data: sessData, error: sError } = await supabase
        .from('mentorship_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: true });
      if (sError) throw sError;
      const enrichedSess = await Promise.all((sessData || []).map(async (sess) => {
        const { data: mentor } = await supabase.from('mentors').select('full_name').eq('id', sess.mentor_id).single();
        return { ...sess, mentor_name: mentor?.full_name || 'Unknown' };
      }));
      setSessions(enrichedSess);
    } catch (err) {
      console.error('Mentorship fetch error:', err);
      setError('Failed to load mentorship data');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequest = (mentor: Mentor) => {
    setSelectedMentor(mentor);
  };

  const submitRequest = async (message: string) => {
    if (!selectedMentor) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error: insertError } = await supabase.from('mentorship_requests').insert({
      mentor_id: selectedMentor.id,
      user_id: session.user.id,
      message,
      status: 'pending',
      requested_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (insertError) {
      alert('Failed to send request: ' + insertError.message);
    } else {
      alert('Request sent! The mentor will review your request.');
      setSelectedMentor(null);
      fetchData(); // refresh
    }
  };

  const cancelRequest = async (requestId: string) => {
    if (window.confirm('Cancel this mentorship request?')) {
      const { error } = await supabase.from('mentorship_requests').delete().eq('id', requestId);
      if (error) alert('Cancel failed');
      else fetchData();
    }
  };

  if (loading) {
    return (
      <div className="mentorship-container">
        <main className="mentorship-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="mentorship-container">
      <main className="mentorship-main">
        <div className="mentorship-header">
          <h1>🎓 Mentorship Hub</h1>
          <p>Connect with experienced mentors to accelerate your innovation journey</p>
        </div>

        <div className="mentorship-tabs">
          <button className={`tab ${activeTab === 'mentors' ? 'active' : ''}`} onClick={() => setActiveTab('mentors')}>
            🔍 Find Mentors
          </button>
          <button className={`tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
            📅 My Sessions
          </button>
          <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            ✉️ My Requests
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {activeTab === 'mentors' && (
          <div className="mentors-grid">
            {mentors.length === 0 ? (
              <div className="empty-state">No mentors available at the moment. Check back soon!</div>
            ) : (
              mentors.map(mentor => <MentorCard key={mentor.id} mentor={mentor} onRequest={handleRequest} />)
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="sessions-list">
            {sessions.length === 0 ? (
              <div className="empty-state">No sessions yet. Request a mentorship session to get started!</div>
            ) : (
              <>
                <h3>Upcoming Sessions</h3>
                {sessions.filter(s => s.status === 'upcoming').map(session => (
                  <div key={session.id} className="session-card upcoming">
                    <div className="session-info">
                      <strong>{session.mentor_name}</strong>
                      <div>📅 {new Date(session.scheduled_at).toLocaleString()}</div>
                      <div>⏱️ {session.duration_minutes} minutes</div>
                      {session.meeting_link && <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">Join Meeting →</a>}
                    </div>
                  </div>
                ))}
                <h3>Past Sessions</h3>
                {sessions.filter(s => s.status === 'completed').map(session => (
                  <div key={session.id} className="session-card past">
                    <div className="session-info">
                      <strong>{session.mentor_name}</strong>
                      <div>📅 {new Date(session.scheduled_at).toLocaleString()}</div>
                      {session.feedback && <div className="feedback">Feedback: {session.feedback}</div>}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests-list">
            {requests.length === 0 ? (
              <div className="empty-state">No pending requests. Find a mentor to start!</div>
            ) : (
              requests.map(req => (
                <div key={req.id} className={`request-card status-${req.status}`}>
                  <div className="request-info">
                    <strong>{req.mentor_name}</strong>
                    <div>📝 {req.message.substring(0, 120)}...</div>
                    <div>📅 Requested: {new Date(req.created_at).toLocaleDateString()}</div>
                    <div className="request-status">Status: {req.status.toUpperCase()}</div>
                  </div>
                  {req.status === 'pending' && (
                    <button onClick={() => cancelRequest(req.id)} className="btn-cancel-request">Cancel</button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {selectedMentor && <RequestModal mentor={selectedMentor} onClose={() => setSelectedMentor(null)} onSubmit={submitRequest} />}
      </main>

      <style>{`
        .mentorship-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .mentorship-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .mentorship-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .mentorship-header {
          margin-bottom: 2rem;
        }
        .mentorship-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .mentorship-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 0.5rem;
        }
        .tab {
          background: none;
          border: none;
          padding: 0.5rem 1.2rem;
          border-radius: 30px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab.active {
          background: #7c5fe6;
          color: white;
        }
        .mentors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        .mentor-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1.2rem;
          display: flex;
          gap: 1rem;
          transition: transform 0.2s;
        }
        .mentor-card:hover {
          transform: translateY(-4px);
          background: rgba(0,0,0,0.6);
        }
        .mentor-avatar {
          width: 70px;
          height: 70px;
          background: #7c5fe6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          font-weight: bold;
        }
        .mentor-info {
          flex: 1;
        }
        .mentor-info h3 {
          margin: 0 0 0.25rem 0;
        }
        .mentor-title {
          font-size: 0.8rem;
          color: #2fd4ff;
          margin-bottom: 0.5rem;
        }
        .mentor-expertise {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin-bottom: 0.5rem;
        }
        .expertise-tag {
          background: rgba(124,95,230,0.2);
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          font-size: 0.7rem;
        }
        .mentor-stats {
          display: flex;
          gap: 0.75rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.5rem;
        }
        .mentor-bio {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.7);
          margin: 0;
        }
        .mentor-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }
        .rate {
          font-size: 0.8rem;
          font-weight: 600;
          color: #48bb78;
        }
        .btn-request {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.4rem 1rem;
          border-radius: 30px;
          cursor: pointer;
          font-weight: 600;
        }
        .sessions-list h3 {
          margin-top: 1rem;
        }
        .session-card, .request-card {
          background: rgba(0,0,0,0.4);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .session-card.upcoming {
          border-left: 4px solid #2fd4ff;
        }
        .request-card.status-pending {
          border-left: 4px solid #f6c90e;
        }
        .request-card.status-approved {
          border-left: 4px solid #48bb78;
        }
        .btn-cancel-request {
          background: rgba(252,129,129,0.2);
          border: none;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          color: #fc8181;
          cursor: pointer;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
        }
        .loading-spinner {
          width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6; border-radius: 50%;
          animation: spin 1s linear infinite; margin: 20% auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-banner {
          background: rgba(252,129,129,0.2); border: 1px solid #fc8181; border-radius: 12px; padding: 0.75rem; margin-bottom: 1rem; color: #fc8181;
        }
        .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #1a1a2e; border-radius: 20px; width: 90%; max-width: 500px; }
        .modal-header { display: flex; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .modal-body { padding: 1.5rem; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
        .btn-cancel { background: rgba(255,255,255,0.1); border: none; padding: 0.4rem 1rem; border-radius: 30px; cursor: pointer; }
        .btn-submit { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); border: none; padding: 0.4rem 1rem; border-radius: 30px; cursor: pointer; font-weight: 600; }
        textarea { width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.75rem; color: white; resize: vertical; }
      `}</style>
    </div>
  );
};

export default Mentorship;