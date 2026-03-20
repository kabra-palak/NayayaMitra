import React, { useState, useEffect } from 'react';
import api from '../Axios/axios';
import useAuthStore from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LawyerOnboard = () => {
  const authUser = useAuthStore(s => s.user);
  const navigate = useNavigate();

  // require login
  useEffect(() => {
    if (!authUser) navigate('/login');
  }, [authUser, navigate]);

  const [bio, setBio] = useState(authUser?.bio || '');
  const [phone, setPhone] = useState(authUser?.phone || '');
  const [specialties, setSpecialties] = useState((authUser?.specialties || []).join(', '));
  const [location, setLocation] = useState(authUser?.location || '');
  const [city, setCity] = useState(authUser?.city || '');
  const [yearsExperience, setYearsExperience] = useState(authUser?.yearsExperience || 0);
  const [fee, setFee] = useState(authUser?.fee || '');
  const [modes, setModes] = useState((authUser?.modes || []).join(', '));
  const [languages, setLanguages] = useState((authUser?.languages || []).join(', '));
  const [courts, setCourts] = useState((authUser?.courts || []).join(', '));
  const [freeFirst, setFreeFirst] = useState(Boolean(authUser?.freeFirst));
  const [firmType, setFirmType] = useState(authUser?.firmType || 'independent');
  const [education, setEducation] = useState((authUser?.education || []).join(', '));
  const [successRate, setSuccessRate] = useState(authUser?.successRate || '');
  const [responseTimeHours, setResponseTimeHours] = useState(authUser?.responseTimeHours || 24);
  const [organization, setOrganization] = useState(authUser?.organization || '');

  const setUser = useAuthStore(s => s.setUser);

  const submit = async () => {
    try {
      const payload = {
        bio,
        phone,
        specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
        location,
        city,
        yearsExperience: Number(yearsExperience) || 0,
        fee: fee ? Number(fee) : 0,
        modes: modes.split(',').map(s => s.trim()).filter(Boolean),
        languages: languages.split(',').map(s => s.trim()).filter(Boolean),
        courts: courts.split(',').map(s => s.trim()).filter(Boolean),
        freeFirst: Boolean(freeFirst),
        firmType,
        education: education.split(',').map(s => s.trim()).filter(Boolean),
        successRate: successRate ? Number(successRate) : 0,
        responseTimeHours: responseTimeHours ? Number(responseTimeHours) : 24,
        organization,
      };
      await api.post('/api/lawyers/onboard', payload);
      const me = await api.get('/auth/me');
      setUser(me.data.user || me.data);
      alert('Onboarded as lawyer');
      navigate('/onboard-lawyer');
    } catch (err) { console.error(err); alert('Failed'); }
  };

  const isOnboarded = !!(authUser?.bio && authUser.bio.length > 0) || !!(authUser?.specialties && authUser.specialties.length > 0);

  // shared styles
  const field = {
    width: '100%', padding: '10px 13px', borderRadius: 8,
    border: '1px solid #D1D5DB', background: '#F9FAFB',
    fontSize: 13, color: '#0F1F3D', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const onFocus = e => { e.target.style.borderColor = '#C9963A'; e.target.style.boxShadow = '0 0 0 3px rgba(201,150,58,0.12)'; e.target.style.background = '#fff'; };
  const onBlur  = e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; };
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' };
  const card = { background: '#ffffff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '20px 22px' };
  const sectionTitle = { fontSize: 13, fontWeight: 700, color: '#0F1F3D', letterSpacing: '-0.01em', margin: '0 0 16px', paddingBottom: 10, borderBottom: '1px solid #F3F4F6' };

  if (authUser?.role === 'lawyer' && isOnboarded) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
        <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '40px 48px', maxWidth: 480, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#0F1F3D,#162848)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
              <line x1="10" y1="2" x2="10" y2="18" stroke="#C9963A" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="3" y1="5" x2="17" y2="5" stroke="#C9963A" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M3 5 L1 10 C1 12 5 12 5 10 L3 5Z" fill="#C9963A" opacity="0.9"/>
              <path d="M17 5 L15 10 C15 12 19 12 19 10 L17 5Z" fill="#C9963A" opacity="0.9"/>
              <line x1="7" y1="18" x2="13" y2="18" stroke="#C9963A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F1F3D', margin: '0 0 10px', letterSpacing: '-0.02em' }}>You're already a lawyer</h2>
          <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>Our records show you are already registered as a lawyer on the platform. If you need to update your profile, go to your account settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', fontFamily: "'Inter','Segoe UI',sans-serif", padding: '32px 32px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#C9963A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Lawyer Registration</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F1F3D', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Join as Lawyer</h2>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Complete your profile to start accepting client consultations.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* About */}
          <div style={card}>
            <p style={sectionTitle}>About You</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} style={{ ...field, resize: 'vertical' }} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} style={field} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={lbl}>City</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai" style={field} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>
              <div>
                <label style={lbl}>Organization / Law Firm</label>
                <input value={organization} onChange={e => setOrganization(e.target.value)} style={field} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
          </div>

          {/* Practice */}
          <div style={card}>
            <p style={sectionTitle}>Practice Details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Specialties (comma separated)</label>
                <input value={specialties} onChange={e => setSpecialties(e.target.value)} style={field} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={lbl}>Courts (comma separated)</label>
                <input value={courts} onChange={e => setCourts(e.target.value)} placeholder="District, High Court, Supreme Court" style={field} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={lbl}>Education (comma separated)</label>
                <input value={education} onChange={e => setEducation(e.target.value)} style={field} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Years Experience</label>
                  <input value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} type="number" min="0" style={field} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={lbl}>Fee per session (₹)</label>
                  <input value={fee} onChange={e => setFee(e.target.value)} type="number" min="0" style={field} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={lbl}>Firm Type</label>
                  <select value={firmType} onChange={e => setFirmType(e.target.value)} style={field} onFocus={onFocus} onBlur={onBlur}>
                    <option value="independent">Independent</option>
                    <option value="firm">Law Firm</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div style={card}>
            <p style={sectionTitle}>Availability & Languages</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Supported Modes (comma separated)</label>
                <input value={modes} onChange={e => setModes(e.target.value)} placeholder="in-person, video, chat, phone" style={field} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={lbl}>Languages (comma separated)</label>
                <input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Hindi" style={field} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Free First Consultation</label>
                  <select value={freeFirst ? 'yes' : 'no'} onChange={e => setFreeFirst(e.target.value === 'yes')} style={field} onFocus={onFocus} onBlur={onBlur}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Avg Success Rate (%)</label>
                  <input value={successRate} onChange={e => setSuccessRate(e.target.value)} type="number" min="0" max="100" style={field} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={lbl}>Response Time (hrs)</label>
                  <input value={responseTimeHours} onChange={e => setResponseTimeHours(e.target.value)} type="number" min="0" style={field} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 8 }}>
            <button
              onClick={submit}
              style={{
                padding: '12px 32px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)',
                color: '#ffffff', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', transition: 'opacity 0.15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <line x1="10" y1="2" x2="10" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="3" y1="5" x2="17" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M3 5 L1 10 C1 12 5 12 5 10 L3 5Z" fill="white" opacity="0.9"/>
                <path d="M17 5 L15 10 C15 12 19 12 19 10 L17 5Z" fill="white" opacity="0.9"/>
                <line x1="7" y1="18" x2="13" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Become a Lawyer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LawyerOnboard;