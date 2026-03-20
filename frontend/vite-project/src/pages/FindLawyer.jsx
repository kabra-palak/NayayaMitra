import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FiltersContainer from '../components/FiltersContainer';
import { useNavigate } from 'react-router-dom';
import api from '../Axios/axios';
import useAuthStore from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import InitialAvatar from '../components/InitialAvatar';

const FindLawyer = () => {
  const [lawyers, setLawyers] = useState([]);
  const [filters, setFilters] = useState({
    query: '',
    city: '',
    specialization: '',
    minExp: '',
    feeMin: '',
    feeMax: '',
    modeFilter: '',
    languageFilter: '',
    courtFilter: '',
    verifiedOnly: false,
    minRating: '',
    freeFirst: '',
    firmType: '',
  });
  const [myLawyers, setMyLawyers] = useState([]);
  const [selectedTab, setSelectedTab] = useState('your');
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const user = useAuthStore(s => s.user);
  const isLawyer = user?.role === 'lawyer';
  const navigate = useNavigate();
  const toast = useToast();

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      query: '',
      city: '',
      specialization: '',
      minExp: '',
      feeMin: '',
      feeMax: '',
      modeFilter: '',
      languageFilter: '',
      courtFilter: '',
      verifiedOnly: false,
      minRating: '',
      freeFirst: '',
      firmType: '',
    });
  }, []);

  useEffect(() => {
    if (isLawyer) navigate('/lawyer/requests');
  }, [isLawyer, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/lawyers/list');
        setLawyers(res.data.lawyers || []);
        const my = await api.get('/api/lawyers/connections/me');
        const normalizedMy = (my.data.connections || []).map(c => {
          const chatId = c.chat && typeof c.chat === 'object' ? c.chat._id : c.chat;
          let toObj = c.to;
          if (!toObj || typeof toObj !== 'object') {
            toObj = (res.data.lawyers || []).find(l => l._id === (c.to || c.to?._id)) || { _id: c.to };
          }
          return { ...c, chat: chatId, to: toObj };
        });
        setMyLawyers(normalizedMy);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const requestLawyer = async (lawyerId) => {
    setRequesting(lawyerId);
    try {
      await api.post('/api/lawyers/request', {
        to: lawyerId,
        message: 'I would like to request a consultation with you.'
      });
      setTimeout(() => { setRequesting(null); }, 2000);
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 400) {
        toast.info('You already have an active request to this lawyer.');
      } else {
        toast.error('Failed to send request. Please try again.');
      }
      setRequesting(null);
    }
  };

  const filteredLawyers = useMemo(() => {
    const connectedIds = new Set(myLawyers.map(c => c.to?._id || c.to));
    return lawyers.filter(lawyer => {
      const isConnected = connectedIds.has(lawyer._id);
      if (isConnected) return selectedTab === 'your';
      if (selectedTab === 'find') {
        const { query, city, specialization, minExp, feeMin, feeMax, modeFilter, languageFilter, courtFilter, verifiedOnly, minRating, freeFirst, firmType } = debouncedFilters;
        if (query && !`${lawyer.name} ${lawyer.specialties?.join(' ')} ${lawyer.bio}`.toLowerCase().includes(query.toLowerCase())) return false;
        if (city && lawyer.city && !lawyer.city.toLowerCase().includes(city.toLowerCase())) return false;
        if (specialization && !(lawyer.specialties || []).some(s => s.toLowerCase().includes(specialization.toLowerCase()))) return false;
        if (minExp && (!lawyer.yearsExperience || lawyer.yearsExperience < Number(minExp))) return false;
        if (feeMin && (!lawyer.fee || lawyer.fee < Number(feeMin))) return false;
        if (feeMax && (!lawyer.fee || lawyer.fee > Number(feeMax))) return false;
        if (modeFilter && !(lawyer.modes || []).includes(modeFilter)) return false;
        if (languageFilter && !(lawyer.languages || []).some(lang => lang.toLowerCase().includes(languageFilter.toLowerCase()))) return false;
        if (courtFilter && !(lawyer.courts || []).some(court => court.toLowerCase().includes(courtFilter.toLowerCase()))) return false;
        if (verifiedOnly && !lawyer.verified) return false;
        if (minRating && (!lawyer.rating || lawyer.rating < Number(minRating))) return false;
        if (freeFirst === 'yes' && !lawyer.freeFirst) return false;
        if (freeFirst === 'no' && lawyer.freeFirst) return false;
        if (firmType && lawyer.firmType !== firmType) return false;
      }
      return true;
    });
  }, [lawyers, myLawyers, selectedTab, debouncedFilters]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(t);
  }, [filters]);

  const counts = useMemo(() => {
    const available = filteredLawyers.length;
    const ratings = filteredLawyers.map(l => Number(l.rating || 0));
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '-';
    return { available, avgRating };
  }, [filteredLawyers]);

  const DetailRow = React.memo(({ icon, title, items }) => (
    items && items.length > 0 && (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0' }}>
        <div style={{ width: 16, height: 16, color: '#9CA3AF', marginTop: 2, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', marginBottom: 5 }}>{title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {items.slice(0, 3).map((item, index) => (
              <span key={index} style={{ padding: '3px 8px', background: '#F3F4F6', color: '#374151', fontSize: 11, borderRadius: 5, border: '1px solid #E5E7EB' }}>
                {item}
              </span>
            ))}
            {items.length > 3 && (
              <span style={{ padding: '3px 8px', background: '#F9FAFB', color: '#6B7280', fontSize: 11, borderRadius: 5 }}>
                +{items.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    )
  ));

  const LawyerCard = React.memo(({ lawyer, isConnected = false, chatId, onRequest, requestingId }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9963A'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,150,58,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Verified badge */}
      {lawyer.verified && (
        <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 10 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              padding: '3px 10px',
              background: '#22C55E',
              color: '#fff', fontSize: 11, fontWeight: 700,
              borderRadius: 20,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Verified
          </motion.div>
        </div>
      )}

      <div style={{ padding: '20px 20px 16px', flex: 1 }}>
        {/* Avatar + name row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <motion.div style={{ position: 'relative', flexShrink: 0 }} whileHover={{ scale: 1.08 }} transition={{ type: "spring", stiffness: 300 }}>
            <InitialAvatar name={lawyer.name} style={{ width: 56, height: 56, borderRadius: 12, border: '2px solid #E5E7EB' }} />
            {lawyer.online && (
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, background: '#22C55E', border: '2px solid #fff', borderRadius: '50%' }} />
            )}
          </motion.div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0F1F3D', margin: '0 0 2px', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lawyer.name}
            </h3>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 6px' }}>{lawyer.organization || 'Independent Lawyer'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{(lawyer.city || lawyer.location) || 'Location N/A'}</span>
              </div>
              <span style={{ padding: '2px 8px', background: 'rgba(34,197,94,0.1)', color: '#16A34A', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                {lawyer.successRate !== undefined ? `${lawyer.successRate}% success` : 'Success N/A'}
              </span>
              <span style={{ padding: '2px 8px', background: '#F3F4F6', color: '#374151', borderRadius: 20, fontSize: 11 }}>
                {lawyer.yearsExperience ? `${lawyer.yearsExperience} yrs` : 'Exp N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', marginBottom: 6 }}>SPECIALTIES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {(lawyer.specialties || []).slice(0, 4).map((specialty, index) => (
              <motion.span
                key={specialty}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.07 }}
                style={{
                  padding: '4px 10px',
                  background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)',
                  color: '#E8B96A',
                  fontSize: 11, fontWeight: 600, borderRadius: 20,
                }}
              >
                {specialty}
              </motion.span>
            ))}
            {(lawyer.specialties || []).length > 4 && (
              <span style={{ padding: '4px 10px', background: '#F3F4F6', color: '#6B7280', fontSize: 11, fontWeight: 500, borderRadius: 20 }}>
                +{(lawyer.specialties || []).length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Detail rows */}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 8 }}>
          <DetailRow icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>} title="LANGUAGES" items={lawyer.languages} />
          <DetailRow icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v6l9-5-9-5-9 5 9 5z" /></svg>} title="EDUCATION" items={lawyer.education} />
          <DetailRow icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} title="COURTS" items={lawyer.courts} />
          <DetailRow icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} title="CONSULTATION MODES" items={lawyer.modes} />
        </div>
      </div>

      {/* Action button */}
      <div style={{ padding: '12px 20px 18px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        {isConnected ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => chatId ? navigate(`/chat/${chatId}`) : null}
              disabled={!chatId}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                background: chatId ? 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)' : '#D1D5DB',
                color: '#ffffff', fontWeight: 700, fontSize: 13,
                cursor: chatId ? 'pointer' : 'not-allowed',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { if (chatId) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {chatId ? 'Open Chat' : 'Chat Unavailable'}
            </button>
          </div>
        ) : (
          <motion.button
            onClick={() => onRequest(lawyer._id)}
            disabled={requestingId === lawyer._id}
            whileHover={requestingId !== lawyer._id ? { scale: 1.02 } : {}}
            whileTap={requestingId !== lawyer._id ? { scale: 0.98 } : {}}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
              background: requestingId === lawyer._id
                ? '#9CA3AF'
                : 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)',
              color: '#ffffff', fontWeight: 700, fontSize: 13,
              cursor: requestingId === lawyer._id ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { if (requestingId !== lawyer._id) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {requestingId === lawyer._id ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}
                />
                <span>Sending Request...</span>
              </div>
            ) : 'Request Consultation'}
          </motion.button>
        )}
      </div>
    </motion.div>
  ));

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', padding: '32px 32px', fontFamily: "'Inter','Segoe UI',sans-serif", position: 'relative' }}>

      {/* Subtle background blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div
          style={{ position: 'absolute', top: '20%', left: '10%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(201,150,58,0.06)', filter: 'blur(60px)' }}
          animate={{ scale: [1, 1.2, 1], x: [0, 80, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{ position: 'absolute', bottom: '20%', right: '10%', width: 360, height: 360, borderRadius: '50%', background: 'rgba(15,31,61,0.05)', filter: 'blur(80px)' }}
          animate={{ scale: [1.2, 1, 1.2], x: [0, -80, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 28 }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#C9963A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Legal Network
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0F1F3D', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Find Your Legal Expert
          </h1>
          <p style={{ fontSize: 15, color: '#6B7280', maxWidth: 480, margin: '0 auto' }}>
            Connect with verified legal professionals tailored to your specific needs
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}
        >
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: 4,
            border: '1px solid #E5E7EB',
            display: 'inline-flex',
          }}>
            {[
              { key: 'your', label: 'Your Lawyers' },
              { key: 'find', label: 'Find Lawyers' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                style={{
                  padding: '10px 28px',
                  borderRadius: 9,
                  fontWeight: 700,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: selectedTab === tab.key
                    ? 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)'
                    : 'transparent',
                  color: selectedTab === tab.key ? '#E8B96A' : '#6B7280',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: '#C9963A', borderRadius: '50%' }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            {/* Filters sidebar */}
            {selectedTab === 'find' && (
              <FiltersContainer
                filters={filters}
                onFilterChange={updateFilter}
                onReset={resetFilters}
                show={showFilters}
                onClose={() => setShowFilters(false)}
                counts={counts}
              />
            )}

            {/* Main content */}
            <motion.main layout style={{ flex: 1, minWidth: 0 }}>

              {/* Mobile filter toggle */}
              {selectedTab === 'find' && (
                <div style={{ marginBottom: 14 }} className="lg:hidden">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                      width: '100%', padding: '11px 0',
                      background: '#ffffff', borderRadius: 8,
                      border: '1px solid #E5E7EB',
                      fontWeight: 600, fontSize: 13, color: '#374151',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                    </svg>
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}
                >
                  {selectedTab === 'your' ? (
                    myLawyers.length === 0 ? (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px 16px' }}>
                        <div style={{ width: 72, height: 72, background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                          <svg width="32" height="32" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F1F3D', margin: '0 0 8px', letterSpacing: '-0.01em' }}>No Lawyers Connected</h3>
                        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>Start by finding and connecting with legal experts</p>
                        <button
                          onClick={() => setSelectedTab('find')}
                          style={{
                            padding: '10px 24px', borderRadius: 8, border: 'none',
                            background: 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)',
                            color: '#ffffff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                          }}
                        >
                          Find Lawyers
                        </button>
                      </div>
                    ) : (
                      myLawyers.map(connection => {
                        const lawyer = connection.to || {};
                        const lastMsg = connection.lastMessage || connection.last_message || null;
                        const lastText = lastMsg?.text || lastMsg?.content || '';
                        const lastAt = lastMsg?.createdAt || lastMsg?.created_at || connection.updatedAt || connection.lastUpdated || null;
                        const unread = connection.unread || connection.unreadCount || 0;

                        return (
                          <motion.div
                            key={connection._id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => connection.chat ? navigate(`/chat/${connection.chat}`) : toast.info('Chat not available')}
                            style={{
                              background: '#ffffff',
                              borderRadius: 12,
                              border: '1px solid #E5E7EB',
                              padding: '14px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              transition: 'border-color 0.15s, box-shadow 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9963A'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,150,58,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                              <InitialAvatar name={lawyer.name} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #E5E7EB', flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontWeight: 600, fontSize: 14, color: '#0F1F3D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lawyer.name || 'Unknown'}</span>
                                  <span style={{ color: '#D1D5DB', fontSize: 10 }}>•</span>
                                  <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lawyer.organization || 'Independent'}</span>
                                </div>
                                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '32ch' }}>
                                  {lastText || <span style={{ color: '#D1D5DB' }}>No messages yet</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 12, flexShrink: 0 }}>
                              {lastAt && <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{new Date(lastAt).toLocaleString()}</div>}
                              {unread > 0 ? (
                                <div style={{ background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{unread}</div>
                              ) : (
                                <div style={{ width: 1 }}>&nbsp;</div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    )
                  ) : (
                    filteredLawyers.length === 0 ? (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px 16px' }}>
                        <div style={{ width: 72, height: 72, background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                          <svg width="32" height="32" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F1F3D', margin: '0 0 8px', letterSpacing: '-0.01em' }}>No Lawyers Found</h3>
                        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>Try adjusting your filters to find more results</p>
                        <button
                          onClick={resetFilters}
                          style={{
                            padding: '10px 24px', borderRadius: 8,
                            border: '1px solid #D1D5DB', background: '#ffffff',
                            color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                        >
                          Clear All Filters
                        </button>
                      </div>
                    ) : (
                      filteredLawyers.map(lawyer => (
                        <LawyerCard
                          key={lawyer._id}
                          lawyer={lawyer}
                          isConnected={false}
                          onRequest={requestLawyer}
                          requestingId={requesting}
                        />
                      ))
                    )
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.main>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindLawyer;