import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../Axios/axios';
import { initSocket } from '../utils/socket';
import useAuthStore from '../context/AuthContext';
import InitialAvatar from '../components/InitialAvatar';

const ChatView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [connections, setConnections] = useState([]);
  const [activeChat, setActiveChat] = useState(id || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  const isLawyer = user?.role === 'lawyer';
  const location = useLocation();
  const qp = new URLSearchParams(location.search);
  const target = qp.get('target');

  const extractLastMessage = (lm) => {
    if (!lm) return null;
    let m = lm;
    if (Array.isArray(m)) m = m[m.length - 1] || null;
    if (m && m.lastMessage) m = m.lastMessage;
    if (!m) return null;
    const content = m.content || m.text || m.message || m.body || m.msg || (typeof m === 'string' ? m : null);
    const created = m.createdAt || m.created_at || m.created || m.timestamp || m.time || null;
    return { content, created };
  };

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const route = isLawyer ? '/api/lawyers/connections/lawyer' : '/api/lawyers/connections/me';
        const res = await api.get(route);
        const normalized = (res.data.connections || []).map(c => {
          const peer = isLawyer ? c.from : c.to;
          const chatId = (c.chat && typeof c.chat === 'object') ? c.chat._id : c.chat;
          return { id: c._id, chat: chatId, peer, lastMessage: c.lastMessage || null, unread: c.unread || 0, raw: c };
        });
        let filtered = normalized;
        if (target === 'lawyer') {
          filtered = normalized.filter(n => {
            if (n.peer && typeof n.peer === 'object' && n.peer.role) return n.peer.role === 'lawyer';
            if (!isLawyer && n.raw && n.raw.to) return true;
            if (isLawyer && n.raw && n.raw.to && typeof n.raw.to === 'object' && n.raw.to.role === 'lawyer') return true;
            return false;
          });
        }
        if (target === 'client' || target === 'helpseeker') {
          filtered = normalized.filter(n => {
            if (n.peer && typeof n.peer === 'object' && n.peer.role) return n.peer.role !== 'lawyer';
            if (isLawyer && n.raw && n.raw.from) return true;
            return false;
          });
        }
        setConnections(filtered);
      } catch (e) { console.error(e); }
    };
    fetchConnections();
  }, [isLawyer, navigate, target]);

  useEffect(() => {
    const s = initSocket();
    socketRef.current = s;
    s.on('connect', () => {});
    s.on('new_message', (msg) => {
      if (msg.chat === activeChat) {
        setMessages(prev => {
          if (msg.clientTempId) {
            const mapped = prev.map(m => m._id === msg.clientTempId ? msg : m);
            const uniq = []; const seen = new Set();
            for (const m of mapped) { if (!seen.has(m._id)) { uniq.push(m); seen.add(m._id); } }
            return uniq;
          }
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setConnections(prev => prev.map(p => p.chat === msg.chat ? { ...p, lastMessage: msg, unread: 0 } : p));
      } else {
        setConnections(prev => prev.map(p => p.chat === msg.chat ? { ...p, lastMessage: msg, unread: (p.unread || 0) + 1 } : p));
      }
    });
    return () => { s.off('new_message'); s.off('connect_error'); s.off('reconnect_attempt'); };
  }, [activeChat]);

  useEffect(() => {
    const s = socketRef.current; if (!s) return;
    const onReconnect = () => { if (activeChat) s.emit('join', activeChat); };
    s.on('reconnect', onReconnect);
    return () => { s.off('reconnect', onReconnect); };
  }, [activeChat]);

  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/api/messages/${activeChat}`);
        setMessages(res.data.messages || []);
        socketRef.current?.emit('join', activeChat);
        setConnections(prev => prev.map(p => p.chat === activeChat ? { ...p, unread: 0 } : p));
        navigate(`/chat/${activeChat}`, { replace: true });
      } catch (e) { console.error(e); }
    };
    fetchMessages();
    return () => { socketRef.current?.emit('leave', activeChat); };
  }, [activeChat, navigate]);

  useEffect(() => { if (id) setActiveChat(id); }, [id]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const openChat = (chatId) => { setActiveChat(typeof chatId === 'object' ? chatId._id : chatId); };

  const sendMessage = async () => {
    if (!text.trim() || !activeChat) return;
    const payload = { chatId: activeChat, content: text, userId: user?._id, role: isLawyer ? 'lawyer' : 'user' };
    const temp = { _id: `tmp-${Date.now()}`, chat: activeChat, content: text, user: user?._id, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, temp]);
    setConnections(prev => prev.map(p => p.chat === activeChat ? { ...p, lastMessage: { ...temp } } : p));
    setText('');
    try {
      const clientTempId = temp._id;
      const res = await api.post('/api/messages', { chatId: activeChat, content: payload.content, role: payload.role });
      const saved = res.data.message;
      setMessages(prev => {
        let replaced = prev.map(m => m._id === clientTempId ? saved : m);
        if (!replaced.some(m => m._id === saved._id)) {
          replaced = replaced.map(m => m._id === clientTempId ? saved : m);
          if (!replaced.some(m => m._id === saved._id)) replaced = [...replaced, saved];
        }
        const uniq = []; const seen = new Set();
        for (const m of replaced) { if (!seen.has(m._id)) { uniq.push(m); seen.add(m._id); } }
        return uniq;
      });
      setConnections(prev => prev.map(p => p.chat === activeChat ? { ...p, lastMessage: saved } : p));
    } catch (e) {
      console.error('send failed', e);
      setMessages(prev => prev.filter(m => m._id !== temp._id));
      setConnections(prev => prev.map(p => p.chat === activeChat ? { ...p, lastMessage: null } : p));
    }
  };

  const activeConn = connections.find(x => x.chat === activeChat);

  return (
    <div style={{ height: '100vh', display: 'flex', overflow: 'hidden', borderRadius: 14, border: '1px solid #E5E7EB', fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: 0 }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', background: '#ffffff', borderRight: '1px solid #F3F4F6' }}>

        {/* My profile strip */}
        <div style={{ padding: '14px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#0F1F3D 0%,#162848 100%)', flexShrink: 0 }}>
          <InitialAvatar name={user?.name} style={{ width: 36, height: 36, borderRadius: 9, border: '1.5px solid #C9963A', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{isLawyer ? 'Lawyer' : 'Helpseeker'}</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #F9FAFB', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              placeholder="Search or start new chat"
              style={{ width: '100%', padding: '7px 10px 7px 28px', borderRadius: 7, border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: 12, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#C9963A'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
            />
          </div>
        </div>

        {/* Connection list */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {connections.length === 0 && (
            <div style={{ padding: '32px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>No conversations yet.</div>
            </div>
          )}
          {connections.map(c => {
            const lm = extractLastMessage(c.lastMessage);
            const timeStr = lm && lm.created ? (() => { try { return new Date(lm.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } })() : '';
            const preview = lm && lm.content ? lm.content : 'No messages yet';
            const isActive = c.chat === activeChat;
            return (
              <div
                key={c.id}
                onClick={() => openChat(c.chat)}
                style={{
                  padding: '10px 12px', borderBottom: '1px solid #F9FAFB',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  background: isActive ? 'rgba(201,150,58,0.06)' : '#ffffff',
                  borderLeft: isActive ? '3px solid #C9963A' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#FAFAFA'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#ffffff'; }}
              >
                <InitialAvatar name={c.peer?.name} style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid #E5E7EB', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1F3D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.peer?.name}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 6, flexShrink: 0 }}>{timeStr}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{preview}</div>
                    {c.unread > 0 && (
                      <div style={{ marginLeft: 8, minWidth: 20, height: 20, borderRadius: 99, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>{c.unread}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main chat pane ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', height: '100%', background: '#F8F9FB' }}>

        {/* Chat header */}
        <div style={{ flexShrink: 0, padding: '13px 20px', borderBottom: '1px solid #F3F4F6', background: '#ffffff', display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeChat ? (
            <>
              <InitialAvatar name={activeConn?.peer?.name} style={{ width: 36, height: 36, borderRadius: 9, border: '1.5px solid #E5E7EB', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1F3D', letterSpacing: '-0.01em' }}>{activeConn?.peer?.name}</div>
                {activeConn?.peer?.specialties && (
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{activeConn.peer.specialties}</div>
                )}
                <div style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>● Active</div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>Select a conversation</div>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'none' }}>
          {activeChat ? (
            messages.map(m => (
              <div key={m._id} style={{ display: 'flex', justifyContent: m.user === user?._id ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%', padding: '10px 14px',
                  borderRadius: m.user === user?._id ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: m.user === user?._id ? 'linear-gradient(135deg,#0F1F3D 0%,#162848 100%)' : '#ffffff',
                  color: m.user === user?._id ? '#E8B96A' : '#0F1F3D',
                  border: m.user === user?._id ? 'none' : '1px solid #E5E7EB',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ fontSize: 13, lineHeight: 1.55, wordBreak: 'break-words' }}>{m.content}</div>
                  <div style={{ fontSize: 10, marginTop: 4, textAlign: 'right', color: m.user === user?._id ? 'rgba(232,185,106,0.6)' : '#9CA3AF' }}>
                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ fontSize: 36 }}>💬</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>No chat selected</div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid #F3F4F6', background: '#ffffff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message"
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: 13, color: '#0F1F3D', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit' }}
            onFocus={e => { e.target.style.borderColor = '#C9963A'; e.target.style.boxShadow = '0 0 0 3px rgba(201,150,58,0.1)'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
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
              background: 'linear-gradient(135deg,#C9963A,#A67820)',
              color: '#ffffff', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;