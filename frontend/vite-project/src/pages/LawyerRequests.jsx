import React, { useEffect, useState } from 'react';
import api from '../Axios/axios';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/AuthContext';

const LawyerRequests = () => {
  const [pending, setPending] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [processing, setProcessing] = useState({});
  const navigate = useNavigate();
  const authUser = useAuthStore(s => s.user);

  useEffect(() => {
    if (!authUser || authUser.role !== 'lawyer') {
      navigate('/home');
    }
  }, [authUser, navigate]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          api.get('/api/lawyers/requests'),
          api.get('/api/lawyers/connections/lawyer')
        ]);
        setPending(pRes.data.requests || []);
        setAccepted(aRes.data.connections || []);
      } catch (err) { console.error(err); }
    };
    fetch();
  }, []);

  const accept = async (id) => {
    try {
      setProcessing(prev => ({ ...prev, [id]: true }));
      const res = await api.post(`/api/lawyers/requests/${id}/accept`);
      setPending(prev => prev.filter(r => r._id !== id));
      const newConnRaw = res.data.request;
      const newConn = {
        ...newConnRaw,
        chat: newConnRaw.chat && typeof newConnRaw.chat === 'object' ? newConnRaw.chat._id : newConnRaw.chat,
      };
      setAccepted(prev => [...(prev || []), newConn]);
      const chatId = res.data.chat?._id;
      if (chatId) {
        navigate(`/chat/${chatId}`);
      } else {
        alert('Accepted');
      }
    } catch (err) { console.error(err); alert('Failed'); }
    finally { setProcessing(prev => ({ ...prev, [id]: false })); }
  };

  const reject = async (id) => {
    try {
      setProcessing(prev => ({ ...prev, [id]: true }));
      await api.post(`/api/lawyers/requests/${id}/reject`);
      setPending(prev => prev.filter(r => r._id !== id));
      alert('Rejected');
    } catch (err) { console.error(err); alert('Failed'); }
    finally { setProcessing(prev => ({ ...prev, [id]: false })); }
  };

  const InitialCircle = ({ name }) => {
    const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return (
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: '#E8B96A', letterSpacing: '0.03em',
      }}>{initials}</div>
    );
  };

  return (
    <div style={{
      display: 'flex', gap: 20, flex: 1, minHeight: 0,
      padding: '28px 28px', background: '#F0F2F5',
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>

      {/* ── Left: Accepted connections ── */}
      <div style={{
        width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#ffffff', borderRadius: 14, border: '1px solid #E5E7EB',
        overflow: 'hidden',
      }}>
        {/* panel header */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#C9963A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Active</div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F1F3D', margin: 0, letterSpacing: '-0.01em' }}>Accepted Connections</h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'none' }}>
          {accepted
            .filter(c => {
              if (!c.chat) return false;
              if (typeof c.chat === 'object' && c.chat.channel) {
                return c.chat.channel === 'private';
              }
              return true;
            })
            .map(c => (
              <div key={c._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 10,
                border: '1px solid #E5E7EB', background: '#FAFAFA',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#C9963A'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <InitialCircle name={c.from.name} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1F3D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.from.name}
                  </div>
                </div>
                <div style={{ flexShrink: 0, marginLeft: 8 }}>
                  {c.chat ? (
                    <button
                      onClick={() => navigate(`/chat/${typeof c.chat === 'object' ? c.chat._id : c.chat}`)}
                      style={{
                        padding: '6px 12px', borderRadius: 7, border: 'none',
                        background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)',
                        color: '#E8B96A', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      Open Chat
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>No chat</span>
                  )}
                </div>
              </div>
            ))}

          {accepted.filter(c => {
            if (!c.chat) return false;
            if (typeof c.chat === 'object' && c.chat.channel) return c.chat.channel === 'private';
            return true;
          }).length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>No connections yet. Accept a request to start chatting.</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Pending requests ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: '#ffffff', borderRadius: 14, border: '1px solid #E5E7EB',
        overflow: 'hidden', minWidth: 0,
      }}>
        {/* panel header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#C9963A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Inbox</div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F1F3D', margin: 0, letterSpacing: '-0.01em' }}>Pending Requests</h3>
          </div>
          {pending.length > 0 && (
            <div style={{ padding: '3px 10px', background: 'rgba(201,150,58,0.12)', border: '1px solid rgba(201,150,58,0.3)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#A67820' }}>
              {pending.length} pending
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'none' }}>
          {pending.map(r => (
            <div key={r._id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
              padding: '14px 16px', borderRadius: 10,
              border: '1px solid #E5E7EB', background: '#FAFAFA',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9963A'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(201,150,58,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                <InitialCircle name={r.from.name} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1F3D', marginBottom: 3, letterSpacing: '-0.01em' }}>{r.from.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40ch' }}>{r.message}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  disabled={processing[r._id]}
                  onClick={() => accept(r._id)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: processing[r._id] ? '#9CA3AF' : 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                    color: '#ffffff', fontSize: 12, fontWeight: 700,
                    cursor: processing[r._id] ? 'not-allowed' : 'pointer',
                    opacity: processing[r._id] ? 0.6 : 1,
                    transition: 'opacity 0.15s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!processing[r._id]) e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={e => { if (!processing[r._id]) e.currentTarget.style.opacity = '1'; }}
                >
                  {processing[r._id] ? 'Accepting…' : 'Accept'}
                </button>
                <button
                  disabled={processing[r._id]}
                  onClick={() => reject(r._id)}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    border: '1px solid #FCA5A5',
                    background: processing[r._id] ? '#F3F4F6' : 'rgba(239,68,68,0.06)',
                    color: processing[r._id] ? '#9CA3AF' : '#DC2626',
                    fontSize: 12, fontWeight: 700,
                    cursor: processing[r._id] ? 'not-allowed' : 'pointer',
                    opacity: processing[r._id] ? 0.5 : 1,
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!processing[r._id]) { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = '#EF4444'; } }}
                  onMouseLeave={e => { if (!processing[r._id]) { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = '#FCA5A5'; } }}
                >
                  {processing[r._id] ? 'Rejecting…' : 'Reject'}
                </button>
              </div>
            </div>
          ))}

          {pending.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1F3D', marginBottom: 6 }}>No pending requests</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>New client requests will appear here.</div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default LawyerRequests;