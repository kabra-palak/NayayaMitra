import React, { useEffect, useState } from 'react';
import api from '../Axios/axios';
import useAuthStore from '../context/AuthContext';
import InitialAvatar from '../components/InitialAvatar';
import { useNavigate } from 'react-router-dom';

const MyClients = () => {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'lawyer') {
      navigate('/home');
      return;
    }
    const fetch = async () => {
      try {
        const res = await api.get('/api/lawyers/connections/lawyer');
        setClients(res.data.connections || []);
      } catch (e) { console.error(e); }
    };
    fetch();
  }, [user, navigate]);

  useEffect(() => {
    if (!activeChat) return;
    const fetchMsgs = async () => {
      try {
        const res = await api.get(`/api/messages/${activeChat}`);
        setMessages(res.data.messages || []);
      } catch (e) { console.error(e); }
    };
    fetchMsgs();
  }, [activeChat]);

  const openChat = (chatId) => {
    setActiveChat(chatId);
    setClients(prev => prev.map(c => c.chat === chatId ? { ...c, unread: 0, unreadCount: 0 } : c));
  };

  const sendMessage = async () => {
    if (!text.trim() || !activeChat) return;
    try {
      await api.post('/api/messages', { chatId: activeChat, content: text });
      setMessages(prev => [...prev, { _id: `tmp-${Date.now()}`, content: text, user: user._id, createdAt: new Date().toISOString() }]);
      setText('');
    } catch (e) { console.error(e); }
  };

  // Find active client name for the header
  const activeClient = clients.find(c => c.chat === activeChat);

  return (
    <div style={{
      flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0,
      background: '#F0F2F5', fontFamily: "'Inter','Segoe UI',sans-serif",
      borderRadius: 14, border: '1px solid #E5E7EB',
    }}>

      {/* ── Left sidebar: client list ── */}
      <div style={{
        width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#ffffff', borderRight: '1px solid #F3F4F6',
      }}>
        {/* My profile strip */}
        <div style={{
          padding: '16px 16px', borderBottom: '1px solid #F3F4F6',
          background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg,#C9963A,#A67820)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#ffffff',
          }}>
            {(user?.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Lawyer</div>
          </div>
        </div>

        {/* Client list */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {clients.map(c => {
            const last = c.lastMessage || null;
            const lastText = last ? (last.content || '') : null;
            const lastTime = last ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
            const unread = c.unread || c.unreadCount || c.unreadMessages || 0;
            const isActive = c.chat === activeChat;

            return (
              <div
                key={c._id}
                onClick={() => openChat(c.chat)}
                style={{
                  padding: '11px 14px',
                  borderBottom: '1px solid #F9FAFB',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: isActive ? 'rgba(201,150,58,0.06)' : '#ffffff',
                  borderLeft: isActive ? '3px solid #C9963A' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#FAFAFA'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#ffffff'; }}
              >
                <InitialAvatar name={(c.from || {}).name} style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1F3D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {(c.from || {}).name}
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 6, flexShrink: 0 }}>{lastTime}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12, color: unread > 0 ? '#0F1F3D' : '#9CA3AF', fontWeight: unread > 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                      {lastText ? lastText : <em style={{ fontStyle: 'normal', color: '#D1D5DB', fontSize: 11 }}>No messages yet</em>}
                    </div>
                    {unread > 0 && (
                      <div style={{
                        marginLeft: 8, flexShrink: 0,
                        minWidth: 20, height: 20, borderRadius: 99,
                        background: '#EF4444', color: '#fff',
                        fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 5px',
                      }}>
                        {unread > 9 ? '9+' : unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {clients.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 12, lineHeight: 1.6 }}>
              No clients yet.<br />Accept a request to start.
            </div>
          )}
        </div>
      </div>

      {/* ── Right: chat pane ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>

        {/* Chat header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #F3F4F6',
          background: '#ffffff',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {activeChat && activeClient ? (
            <>
              <InitialAvatar name={(activeClient.from || {}).name} style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1F3D', letterSpacing: '-0.01em' }}>{(activeClient.from || {}).name}</div>
                <div style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>● Active</div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>Select a client to start chatting</div>
          )}
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#F8F9FB', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'none' }}>
          {activeChat ? messages.map(m => (
            <div key={m._id} style={{ display: 'flex', justifyContent: m.user === user?._id ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '62%', padding: '10px 14px', borderRadius: m.user === user?._id ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: m.user === user?._id ? 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)' : '#ffffff',
                color: m.user === user?._id ? '#E8B96A' : '#0F1F3D',
                border: m.user === user?._id ? 'none' : '1px solid #E5E7EB',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: 13, lineHeight: 1.55, wordBreak: 'break-word' }}>{m.content}</div>
                <div style={{ fontSize: 10, marginTop: 4, textAlign: 'right', color: m.user === user?._id ? 'rgba(232,185,106,0.6)' : '#9CA3AF' }}>
                  {new Date(m.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 36 }}>💬</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>No client selected</div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', background: '#ffffff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message…"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8,
              border: '1px solid #E5E7EB', background: '#F9FAFB',
              fontSize: 13, color: '#0F1F3D', outline: 'none',
              transition: 'border-color 0.15s', fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = '#C9963A'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)',
              color: '#ffffff', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', transition: 'opacity 0.15s', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyClients;