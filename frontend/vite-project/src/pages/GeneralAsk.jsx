import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../Axios/axios';
import { useToast } from '../components/ToastProvider';
import papi from '../Axios/paxios';

const makeId = () => `gch-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

const GeneralAsk = () => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const listRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const ACTIVE_CHAT_KEY = 'generalAsk:activeChatId';
  const toast = useToast();

  const setActive = useCallback((id) => {
    setActiveChatId(id);
    try {
      if (id) localStorage.setItem(ACTIVE_CHAT_KEY, id);
      else localStorage.removeItem(ACTIVE_CHAT_KEY);
    } catch (e) {}
  }, []);

  const openChat = useCallback((id) => {
    setActive(id);
    (async () => {
      try {
        const res = await api.get(`/api/messages/${id}?_=${Date.now()}`);
        const msgs = (res && res.data && res.data.messages) ? res.data.messages : [];
        const mapped = msgs.map(m => ({ role: (m.role === 'ai' || m.role === 'response') ? 'assistant' : 'user', text: m.content, createdAt: m.createdAt || m.createdAt }));
        setChats(prev => prev.map(c => c.id === id ? { ...c, messages: mapped, updated: Date.now(), preview: mapped.length ? mapped[mapped.length-1].text : (c.preview || '') } : c));
      } catch (e) {}
    })();
  }, [setActive]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/general-ask/list?_=' + Date.now());
        const backendChats = (res && res.data && res.data.chats) ? res.data.chats : [];
        if (backendChats && backendChats.length) {
          const mapped = backendChats.map(c => ({ id: c._id, title: c.title || 'Quick Guide', messages: [], updated: c.updatedAt || c.createdAt, preview: c.lastMessageText || '' }));
          setChats(mapped);
          const stored = (() => { try { return localStorage.getItem(ACTIVE_CHAT_KEY); } catch(e){ return null; } })();
          const pick = stored && mapped.find(m => String(m.id) === String(stored)) ? stored : mapped[0].id;
          setActive(pick);
          try { openChat(pick); } catch(e) {}
          return;
        }
      } catch (e) { console.warn('list general chats failed', e); }
    })();
  }, [openChat, setActive]);

  const createNew = () => {
    (async () => {
      try {
        const res = await api.post('/api/general-ask/create', { title: 'Quick Guide' });
        const chat = res.data && res.data.chat ? res.data.chat : null;
        if (chat && chat._id) {
          const c = { id: chat._id, title: chat.title || 'Quick Guide', messages: [], updated: Date.now(), isNew: true };
          setChats(prev => [c, ...prev]);
          setActive(chat._id);
          setTimeout(() => { try { inputRef.current?.focus(); } catch(e) {} }, 50);
          return;
        }
      } catch (e) {
        console.error('create backend chat failed', e);
        toast.error('Failed to create a new conversation on the server. Please try again.');
        return;
      }
    })();
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  const escapeHtml = (unsafe) => String(unsafe).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const formatMessageToHtml = (text) => {
    if (!text && text !== 0) return '';
    const escaped = escapeHtml(text);
    const bolded = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return bolded.replace(/\n/g, '<br/>');
  };

  useEffect(() => {
    try { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); } catch (e) {}
  }, [chats, isAiThinking]);

  const sendQuery = async () => {
    const txt = (query || '').trim();
    if (!txt) return;
    setQuery('');
    setLoading(true);
    try {
      let chatId = activeChatId;
      let createdNewChatLocal = null;
      if (!chatId) {
        try {
          const resCreate = await api.post('/api/general-ask/create', { title: 'Quick Guide' });
          const chat = resCreate && resCreate.data && resCreate.data.chat ? resCreate.data.chat : null;
          if (chat && chat._id) {
            chatId = chat._id;
            const newChat = { id: chatId, title: chat.title || 'Quick Guide', messages: [], updated: Date.now(), preview: '' };
            setChats(prev => [newChat, ...prev]);
            setActive(chatId);
            createdNewChatLocal = newChat;
          }
        } catch (e) {
          const id = makeId(); chatId = id;
          const newChat = { id, title: 'New Conversation', messages: [], updated: Date.now(), preview: '', isNew: true };
          setChats(prev => [newChat, ...prev]);
          setActive(id);
          createdNewChatLocal = newChat;
          setTimeout(() => { try { inputRef.current?.focus(); } catch(e) {} }, 50);
        }
      }
      const chatObj = createdNewChatLocal || chats.find(c => c.id === chatId) || null;
      const prevMessageCount = (chatObj && Array.isArray(chatObj.messages)) ? chatObj.messages.length : 0;
      const shouldRenameOnFirstMessage = !!(chatObj && chatObj.isNew && prevMessageCount === 0);
      const userMsg = { role: 'user', text: txt, createdAt: new Date().toISOString(), _id: `optimistic-${Date.now()}` };
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, userMsg], updated: Date.now(), preview: txt } : c));
      setIsAiThinking(true);
      const payload = { query: txt, output_language: 'en', chatId };
      const papiRes = await papi.post('/api/general-ask', payload);
      let answerText = '';
      try {
        if (papiRes && papiRes.data) {
          if (typeof papiRes.data.answer === 'string') answerText = papiRes.data.answer;
          else if (papiRes.data.data && typeof papiRes.data.data.answer === 'string') answerText = papiRes.data.data.answer;
          else if (papiRes.data.data && typeof papiRes.data.data.response === 'string') answerText = papiRes.data.data.response;
          else if (typeof papiRes.data === 'string') answerText = String(papiRes.data);
          else if (papiRes.data && papiRes.data.data && typeof papiRes.data.data === 'string') answerText = papiRes.data.data;
        }
      } catch (e) { console.warn('failed to parse papi response', e); }
      try { await api.post('/api/general-ask/save', { chatId, messages: [{ role: 'user', text: txt }, { role: 'assistant', text: answerText }] }); } catch (saveErr) { console.warn('failed to save messages via api', saveErr); }
      const returnedChatId = null;
      if (returnedChatId && returnedChatId !== chatId) { setChats(prev => prev.map(c => c.id === chatId ? { ...c, id: returnedChatId } : c)); chatId = returnedChatId; setActive(returnedChatId); }
      try {
        const msgsRes = await api.get(`/api/messages/${chatId}?_=${Date.now()}`);
        const msgs = (msgsRes && msgsRes.data && msgsRes.data.messages) ? msgsRes.data.messages : [];
        if (!msgs || msgs.length === 0) {
          const assistantMsg = { role: 'assistant', text: String(answerText || ''), createdAt: new Date().toISOString() };
          setChats(prev => { const updated = prev.map(c => c.id === chatId ? { ...c, messages: [...(c.messages || []), assistantMsg], updated: Date.now(), preview: assistantMsg.text } : c); const picked = updated.find(c => c.id === chatId); const others = updated.filter(c => c.id !== chatId); return [picked, ...others]; });
          setFollowUps((papiRes && papiRes.data && (papiRes.data.followups || papiRes.data.follow_up_questions)) ? (papiRes.data.followups || papiRes.data.follow_up_questions) : []);
        } else {
          const mapped = msgs.map(m => ({ role: (m.role === 'ai' || m.role === 'response') ? 'assistant' : 'user', text: m.content, createdAt: m.createdAt || m.createdAt }));
          setChats(prev => {
            const updated = prev.map(c => c.id === chatId ? { ...c, messages: mapped, updated: Date.now(), preview: mapped.length ? mapped[mapped.length-1].text : (c.preview || '') } : c);
            const picked = updated.find(c => c.id === chatId); const others = updated.filter(c => c.id !== chatId);
            setFollowUps((papiRes && papiRes.data && (papiRes.data.followups || papiRes.data.follow_up_questions)) ? (papiRes.data.followups || papiRes.data.follow_up_questions) : []);
            const firstQuestion = txt;
            setTimeout(async () => {
              try {
                setChats(prev2 => prev2.map(ch => ch.id === chatId ? { ...ch, isNew: false, title: (ch.isNew && shouldRenameOnFirstMessage) ? firstQuestion : ch.title } : ch));
                if (shouldRenameOnFirstMessage) { await api.post('/api/general-ask/rename', { chatId, title: firstQuestion }); }
              } catch (renameErr) { console.warn('rename chat failed', renameErr); }
            }, 100);
            return picked ? [picked, ...others] : updated;
          });
        }
      } catch (e) {
        const assistantMsg = { role: 'assistant', text: String(answerText || ''), createdAt: new Date().toISOString() };
        setChats(prev => { const updated = prev.map(c => c.id === chatId ? { ...c, messages: [...(c.messages || []), assistantMsg], updated: Date.now(), preview: assistantMsg.text } : c); const picked = updated.find(c => c.id === chatId); const others = updated.filter(c => c.id !== chatId); return [picked, ...others]; });
        setFollowUps((papiRes && papiRes.data && (papiRes.data.followups || papiRes.data.follow_up_questions)) ? (papiRes.data.followups || papiRes.data.follow_up_questions) : []);
      }
    } catch (err) {
      console.error('general ask failed', err);
      const errMsg = { role: 'assistant', text: 'Error: failed to get an answer. Please try again.', createdAt: new Date().toISOString() };
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, errMsg], updated: Date.now() } : c));
    } finally {
      setLoading(false);
      setIsAiThinking(false);
    }
  };

  const deleteChat = async (id) => {
    try { await api.delete(`/api/delete/${id}`); } catch (e) {}
    setChats(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (activeChatId === id) { const next = updated.length ? updated[0].id : null; setActive(next); }
      return updated;
    });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', overflow: 'hidden', borderRadius: 14, border: '1px solid #E5E7EB', fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: 0 }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', background: '#ffffff', borderRight: '1px solid #F3F4F6' }}>

        {/* Sidebar header */}
        <div style={{ padding: '14px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#C9963A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>AI Legal</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Quick Guide</div>
          </div>
          <button
            onClick={createNew}
            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#C9963A,#A67820)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >+ New</button>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #F9FAFB', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              placeholder="Search conversations"
              style={{ width: '100%', padding: '7px 10px 7px 28px', borderRadius: 7, border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: 12, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#C9963A'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
            />
          </div>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }} ref={listRef}>
          {chats.length === 0 && (
            <div style={{ padding: '24px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>No saved guides yet.<br />Click New to start.</div>
            </div>
          )}
          {chats.map(c => {
            const last = c.preview || (c.messages && c.messages.length ? c.messages[c.messages.length - 1].text : 'No messages yet');
            const normalized = (last || '').replace(/\s+/g, ' ').trim();
            const previewShort = normalized.length > 30 ? normalized.slice(0, 27) + '...' : normalized;
            const isActive = c.id === activeChatId;
            return (
              <div
                key={c.id}
                onClick={() => openChat(c.id)}
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1F3D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.title}>{c.title || 'Untitled'}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }} title={normalized}>{previewShort}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 4 }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>{new Date(c.updated || Date.now()).toLocaleDateString()}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                    style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                    onMouseLeave={e => e.currentTarget.style.color = '#EF4444'}
                  >Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main chat pane ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', height: '100%', background: '#F8F9FB' }}>

        {/* Chat header */}
        <div style={{ flexShrink: 0, padding: '14px 20px', borderBottom: '1px solid #F3F4F6', background: '#ffffff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#0F1F3D,#162848)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <line x1="10" y1="2" x2="10" y2="18" stroke="#C9963A" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="3" y1="5" x2="17" y2="5" stroke="#C9963A" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M3 5 L1 10 C1 12 5 12 5 10 L3 5Z" fill="#C9963A" opacity="0.9"/>
              <path d="M17 5 L15 10 C15 12 19 12 19 10 L17 5Z" fill="#C9963A" opacity="0.9"/>
              <line x1="7" y1="18" x2="13" y2="18" stroke="#C9963A" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1F3D', letterSpacing: '-0.01em' }}>{activeChat ? (activeChat.title || 'Conversation') : 'Quick Guide'}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>AI-powered legal Q&A</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'none' }}>
          {!activeChat && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#0F1F3D,#162848)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
                  <line x1="10" y1="2" x2="10" y2="18" stroke="#C9963A" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="3" y1="5" x2="17" y2="5" stroke="#C9963A" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 5 L1 10 C1 12 5 12 5 10 L3 5Z" fill="#C9963A" opacity="0.9"/>
                  <path d="M17 5 L15 10 C15 12 19 12 19 10 L17 5Z" fill="#C9963A" opacity="0.9"/>
                  <line x1="7" y1="18" x2="13" y2="18" stroke="#C9963A" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F1F3D', marginBottom: 6 }}>Ask a legal question</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>Select a conversation or create a new one to get started.</div>
            </div>
          )}

          {activeChat && (activeChat.messages || []).map((m, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '72%', padding: '10px 14px',
                borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: m.role === 'user' ? 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)' : '#ffffff',
                color: m.role === 'user' ? '#E8B96A' : '#0F1F3D',
                border: m.role === 'user' ? 'none' : '1px solid #E5E7EB',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                fontSize: 13, lineHeight: 1.6,
              }}>
                <div style={{ wordBreak: 'break-words', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: formatMessageToHtml(m.text) }} />
              </div>
            </div>
          ))}

          <div ref={chatEndRef} />

          {/* AI thinking */}
          {activeChat && isAiThinking && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '10px 16px', borderRadius: '12px 12px 12px 4px', background: '#ffffff', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9963A', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
                <span style={{ fontSize: 12, color: '#6B7280' }}>Thinking…</span>
              </div>
            </div>
          )}
        </div>

        {/* Follow-ups */}
        {followUps && followUps.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid #F3F4F6', background: '#ffffff', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Follow-up suggestions</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {followUps.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(f)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: 12, color: '#374151', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9963A'; e.currentTarget.style.background = 'rgba(201,150,58,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; }}
                >{f}</button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid #F3F4F6', background: '#ffffff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask a legal question…"
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: 13, color: '#0F1F3D', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit' }}
            onFocus={e => { e.target.style.borderColor = '#C9963A'; e.target.style.boxShadow = '0 0 0 3px rgba(201,150,58,0.1)'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!loading) sendQuery();
              }
            }}
          />
          <button
            onClick={sendQuery}
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: loading ? '#9CA3AF' : 'linear-gradient(135deg,#C9963A,#A67820)',
              color: '#ffffff', fontWeight: 700, fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {loading ? (
              <><svg style={{ animation: 'spin 1s linear infinite', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>Asking…</>
            ) : (
              <><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>Ask</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralAsk;