import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../Axios/axios";
import papi from "../Axios/paxios";
import { useToast } from '../components/ToastProvider';

// Background — matches app's #F0F2F5 base, no blue tints
const ModernBackground = () => (
  <div style={{
    position: 'absolute', inset: 0, zIndex: -10,
    background: '#F0F2F5',
    pointerEvents: 'none',
  }}>
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '33%',
      background: 'linear-gradient(to bottom, rgba(15,31,61,0.03), transparent)',
    }} />
    <div style={{
      position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%',
      background: 'linear-gradient(to top, rgba(201,150,58,0.03), transparent)',
    }} />
  </div>
);

const StatusIcon = ({ status }) => {
  if (status === 'completed') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        style={{
          width: 24, height: 24, borderRadius: '50%',
          background: '#22C55E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}
      >✓</motion.div>
    );
  }
  if (status === 'in-progress') {
    return (
      <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg style={{ animation: 'spin 1s linear infinite', width: 20, height: 20, color: '#C9963A' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }
  return <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#E5E7EB', border: '2px dashed #9CA3AF', flexShrink: 0 }} />;
};

const IngestionLoader = ({ steps }) => {
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progress = (steps.length > 0) ? (completedSteps / steps.length) * 100 : 0;

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={{
          background: '#ffffff', borderRadius: 20, padding: '36px 40px',
          width: '100%', maxWidth: 560, margin: '0 16px',
          border: '1px solid #E5E7EB',
        }}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
              <line x1="10" y1="2" x2="10" y2="18" stroke="#C9963A" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="3" y1="5" x2="17" y2="5" stroke="#C9963A" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M3 5 L1 10 C1 12 5 12 5 10 L3 5Z" fill="#C9963A" opacity="0.9"/>
              <path d="M17 5 L15 10 C15 12 19 12 19 10 L17 5Z" fill="#C9963A" opacity="0.9"/>
              <line x1="7" y1="18" x2="13" y2="18" stroke="#C9963A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F1F3D', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Securing Your Legal Desk</h2>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            Your documents are being encrypted with military-grade security protocols
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderRadius: 10,
                background: step.status === 'in-progress' ? 'rgba(201,150,58,0.06)' : '#F9FAFB',
                border: step.status === 'in-progress' ? '1px solid rgba(201,150,58,0.25)' : '1px solid #F3F4F6',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatusIcon status={step.status} />
              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: 14, fontWeight: 500,
                  color: step.status === 'in-progress' ? '#A67820' : step.status === 'completed' ? '#0F1F3D' : '#9CA3AF',
                  transition: 'color 0.3s',
                }}>
                  {step.text}
                </span>
                {step.status === 'in-progress' && (
                  <motion.div
                    style={{ height: 3, background: 'rgba(201,150,58,0.2)', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div style={{ height: '100%', background: '#C9963A', borderRadius: 99 }} />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280' }}>
            <span>Processing...</span>
            <span style={{ fontWeight: 600, color: '#0F1F3D' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ width: '100%', background: '#E5E7EB', borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <motion.div
              style={{ height: 8, borderRadius: 99, background: 'linear-gradient(90deg, #C9963A 0%, #A67820 100%)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const LegalDesk = () => {
  const [chats, setChats] = useState([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: null, photo: "", id: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [ingestionStatus, setIngestionStatus] = useState([]);
  const toast = useToast();

  useEffect(() => {
    fetchChats();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data && res.data.user) {
        setUserProfile({
          id: res.data.user._id,
          name: res.data.user.name,
          photo: res.data.user.picture || `https://avatar.vercel.sh/${res.data.user.id}.png`,
        });
      }
    } catch (err) {
      setUserProfile({ name: "Guest User", photo: "https://avatar.vercel.sh/guest.png" });
    }
  };

  const fetchChats = async () => {
    try {
      const res = await api.get("/api/getallchats");
      setChats(res.data.chats || []);
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    }
  };

  const handleAddlegaldesk = async () => {
    if (!file || !title.trim()) {
      toast.error("Please provide both a title and a file.");
      return;
    }
    setUploading(true);
    try {
      const res1 = await api.post("/api/uploaddoc", { title });
      if (!res1.data?.chat) throw new Error("Failed to create legal desk entry.");
      const newChat = res1.data.chat;
      setChats(prev => [newChat, ...prev]);
      setAdding(false);
      setIsLoading(true);
      const steps = [
        { id: 1, text: "Uploading secure document...", status: 'pending' },
        { id: 2, text: "Parsing and segmenting legal clauses...", status: 'pending' },
        { id: 3, text: "Generating legal knowledge embeddings...", status: 'pending' },
        { id: 4, text: "Encrypting with AES-256 security...", status: 'pending' },
        { id: 5, text: "Indexing for rapid legal search...", status: 'pending' },
        { id: 6, text: "Finalizing your Legal Desk...", status: 'pending' }
      ];
      setIngestionStatus(steps);
      const updateProgress = async () => {
        for (let i = 0; i < steps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 800));
          setIngestionStatus(prev => prev.map((step, index) => ({
            ...step,
            status: index < i ? 'completed' : index === i ? 'in-progress' : 'pending'
          })));
        }
      };
      const formData = new FormData();
      formData.append("user_id", userProfile.id || "");
      formData.append("thread_id", newChat._id);
      formData.append("title", title);
      formData.append("file", file);
      const ingestPromise = papi.post("/api/ingest", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await Promise.all([ingestPromise, updateProgress()]);
      setIngestionStatus(prev => prev.map(step => ({ ...step, status: 'completed' })));
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      toast.error("Error creating legal desk. Please try again.");
      setChats(prev => prev.filter(c => c.title !== title));
    } finally {
      setUploading(false);
      setIsLoading(false);
      setTitle("");
      setFile(null);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Legal Desk? This action cannot be undone.")) {
      try {
        await api.delete(`/api/delete/${id}`);
        setChats(chats.filter((chat) => chat._id !== id));
      } catch (err) {
        toast.error("Failed to delete Legal Desk. Please try again.");
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) setFile(files[0]);
  };

  const filteredAndSortedChats = [...chats]
    .filter((chat) => chat.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "name") return a.title?.localeCompare(b.title);
      return 0;
    });

  // shared input style
  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #D1D5DB', background: '#F9FAFB',
    fontSize: 14, color: '#0F1F3D', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box',
  };
  const focusInput = e => { e.target.style.borderColor = '#C9963A'; e.target.style.boxShadow = '0 0 0 3px rgba(201,150,58,0.12)'; e.target.style.background = '#fff'; };
  const blurInput = e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', fontFamily: "'Inter','Segoe UI',sans-serif", position: 'relative' }}>
      <ModernBackground />

      <AnimatePresence>
        {isLoading && <IngestionLoader steps={ingestionStatus} />}
      </AnimatePresence>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px' }}>

        {/* ── Controls bar ── */}
        <motion.div
          style={{ marginBottom: 28 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 16,
            alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #E5E7EB',
          }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 220, maxWidth: 400, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search legal desks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ ...inputStyle, width: 'auto', paddingRight: 32, cursor: 'pointer' }}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Alphabetical</option>
              </select>

              <button
                onClick={() => setAdding(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)',
                  color: '#ffffff', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Legal Desk
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Grid ── */}
        <motion.div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Create new card */}
          <motion.div
            onClick={() => setAdding(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ cursor: 'pointer', minHeight: 280 }}
          >
            <div
              style={{
                height: '100%', minHeight: 280,
                border: '2px dashed #D1D5DB',
                borderRadius: 14,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: 32,
                background: '#ffffff',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9963A'; e.currentTarget.style.background = 'rgba(201,150,58,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#ffffff'; }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F1F3D', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Create New Legal Desk</h3>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                Securely upload and analyze your legal documents with AI-powered insights
              </p>
            </div>
          </motion.div>

          {/* Legal Desk cards */}
          {filteredAndSortedChats.map((chat, index) => (
            <motion.div
              key={chat._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -4 }}
              layout
            >
              <div style={{
                background: '#ffffff', borderRadius: 14,
                border: '1px solid #E5E7EB',
                overflow: 'hidden', height: '100%',
                display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9963A'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,150,58,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Card body */}
                <div style={{ padding: '20px 20px 16px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', letterSpacing: '0.08em' }}>SECURE</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F1F3D', margin: '0 0 12px', letterSpacing: '-0.01em', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {chat.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />, text: new Date(chat.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
                      { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />, text: new Date(chat.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <svg width="13" height="13" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">{item.icon}</svg>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card footer */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => navigate(`/legal-desk/${chat._id}`)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                      background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)',
                      color: '#ffffff', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Open Legal Desk
                  </button>

                  <motion.button
                    onClick={() => handleDelete(chat._id)}
                    title="Delete Legal Desk"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      padding: 9, borderRadius: 8, border: 'none',
                      background: 'transparent', color: '#9CA3AF', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,60,60,0.08)'; e.currentTarget.style.color = '#EF4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty state */}
        {filteredAndSortedChats.length === 0 && chats.length === 0 && (
          <motion.div
            style={{ textAlign: 'center', padding: '64px 16px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: 20, margin: '0 auto 20px',
              background: '#ffffff', border: '1px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="36" height="36" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0F1F3D', margin: '0 0 8px', letterSpacing: '-0.01em' }}>No Legal Desks Yet</h3>
            <p style={{ fontSize: 14, color: '#6B7280', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.6 }}>
              Create your first Legal Desk to start securely managing and analyzing your legal documents with AI-powered insights.
            </p>
            <button
              onClick={() => setAdding(true)}
              style={{
                padding: '11px 28px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)',
                color: '#ffffff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Create Your First Legal Desk
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {adding && (
          <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
              onClick={() => { setAdding(false); setFile(null); setTitle(""); }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal */}
            <motion.div
              style={{
                position: 'relative', background: '#ffffff',
                borderRadius: 16, width: '100%',
                maxWidth: file ? 480 : 560,
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
              }}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            >
              {/* Modal header */}
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid #F3F4F6',
                background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', margin: '0 0 3px', letterSpacing: '-0.01em' }}>Create New Legal Desk</h2>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Securely upload and analyze your legal documents</p>
                </div>
                <button
                  onClick={() => { setAdding(false); setFile(null); setTitle(""); }}
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8, padding: 6, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.7)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal body */}
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Title input */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Legal Desk Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 'NDA Review - Project Alpha'"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={inputStyle}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </div>

                  {/* File upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Legal Document *
                    </label>
                    <motion.div
                      style={{
                        border: `2px dashed ${file ? '#22C55E' : '#D1D5DB'}`,
                        borderRadius: 10,
                        padding: file ? '12px' : '28px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: file ? 'rgba(34,197,94,0.04)' : '#FAFAFA',
                        transition: 'all 0.2s',
                      }}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("file-upload").click()}
                      whileHover={file ? {} : { scale: 1.01 }}
                      whileTap={file ? {} : { scale: 0.99 }}
                    >
                      <motion.div
                        animate={file ? { y: 0 } : { y: [0, -6, 0] }}
                        transition={file ? { duration: 0 } : { repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      >
                        <svg style={{ width: file ? 24 : 40, height: file ? 24 : 40, margin: '0 auto', display: 'block', color: file ? '#22C55E' : '#C9963A', marginBottom: file ? 6 : 10 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </motion.div>
                      <p style={{ fontSize: file ? 13 : 15, fontWeight: 600, color: '#0F1F3D', margin: `0 0 ${file ? 2 : 4}px` }}>
                        {file ? "Document Ready" : "Upload Legal Document"}
                      </p>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: file ? 0 : '0 0 4px' }}>
                        {file ? "Ready to upload securely" : "Drag & drop or click to browse files"}
                      </p>
                      {!file && <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Maximum file size: 100MB • PDF, DOCX, TXT, Images</p>}
                      <input
                        id="file-upload"
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) => setFile(e.target.files[0])}
                      />
                    </motion.div>
                  </div>

                  {/* File preview */}
                  {file && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      style={{
                        padding: '10px 12px', borderRadius: 8,
                        background: 'rgba(34,197,94,0.06)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ fontWeight: 600, fontSize: 12, color: '#0F1F3D', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                          <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <span style={{ padding: '3px 8px', background: '#22C55E', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, flexShrink: 0 }}>SECURE</span>
                    </motion.div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 20, borderTop: '1px solid #F3F4F6' }}>
                  <button
                    onClick={() => { setAdding(false); setFile(null); setTitle(""); }}
                    style={{
                      padding: '10px 20px', borderRadius: 8,
                      border: '1px solid #D1D5DB', background: '#ffffff',
                      color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddlegaldesk}
                    disabled={!title.trim() || !file || uploading}
                    style={{
                      padding: '10px 22px', borderRadius: 8, border: 'none',
                      background: (!title.trim() || !file || uploading)
                        ? '#9CA3AF'
                        : 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)',
                      color: '#ffffff', fontWeight: 700, fontSize: 13,
                      cursor: (!title.trim() || !file || uploading) ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.15s',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                    onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.88'; }}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    {uploading ? (
                      <>
                        <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Securing Document...
                      </>
                    ) : "Create Secure Legal Desk"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LegalDesk;