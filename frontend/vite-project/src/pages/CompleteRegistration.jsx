import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/AuthContext';
import api from '../Axios/axios';
import { useToast } from '../components/ToastProvider';

const RoleCard = ({ role, title, description, selected, onClick }) => (
  <div
    onClick={() => onClick(role)}
    style={{
      cursor: 'pointer',
      padding: '22px 24px',
      borderRadius: 12,
      border: selected ? '2px solid #C9963A' : '1.5px solid #E5E7EB',
      background: selected ? 'rgba(201,150,58,0.06)' : '#ffffff',
      minWidth: 220,
      flex: 1,
      transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
      boxShadow: selected ? '0 4px 20px rgba(201,150,58,0.12)' : 'none',
      position: 'relative',
    }}
    onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = '#C9963A'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,150,58,0.08)'; } }}
    onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; } }}
  >
    {selected && (
      <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: '50%', background: '#C9963A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="10" height="10" fill="none" stroke="white" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )}
    <div style={{ width: 40, height: 40, borderRadius: 10, background: selected ? 'linear-gradient(135deg,#C9963A,#A67820)' : 'linear-gradient(135deg,#0F1F3D,#162848)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
      {role === 'helpseeker' ? (
        <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <line x1="10" y1="2" x2="10" y2="18" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="3" y1="5" x2="17" y2="5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M3 5 L1 10 C1 12 5 12 5 10 L3 5Z" fill="white" opacity="0.9"/>
          <path d="M17 5 L15 10 C15 12 19 12 19 10 L17 5Z" fill="white" opacity="0.9"/>
          <line x1="7" y1="18" x2="13" y2="18" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      )}
    </div>
    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F1F3D', margin: '0 0 5px', letterSpacing: '-0.01em' }}>{title}</h3>
    <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{description}</p>
  </div>
);

const CompleteRegistration = () => {
  const authUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [name, setName] = useState(authUser?.name || '');
  const [email, setEmail] = useState(authUser?.email || authUser?.username || '');
  const [loading, setLoading] = useState(false);

  const benefits = {
    helpseeker: [
      'Ask clear legal questions and get fast AI summaries',
      'Secure document uploads and private Legal Desks',
      'Connect with vetted lawyers for paid help',
    ],
    lawyer: [
      'Receive client requests and manage cases',
      'Showcase expertise and onboard clients',
      'Access advanced lawyer-only tools and billing',
    ],
  };

  const handleRolePick = (role) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleContinueToForm = () => {
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) { toast.error('Please choose a role'); return; }
    setLoading(true);
    try {
      await api.post(
        '/auth/set-role',
        { role: selectedRole, name, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setUser(me.data.user || me.data);
      navigate('/home');
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const btnPrimary = {
    padding: '10px 24px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)',
    color: '#ffffff', fontWeight: 700, fontSize: 13,
    cursor: 'pointer', transition: 'opacity 0.15s',
  };
  const btnGhost = {
    padding: '10px 20px', borderRadius: 8,
    border: '1px solid #D1D5DB', background: '#ffffff',
    color: '#374151', fontWeight: 600, fontSize: 13,
    cursor: 'pointer', transition: 'background 0.15s',
  };

  // Step indicator dots
  const StepDot = ({ n }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {[1, 2, 3].map(i => (
        <React.Fragment key={i}>
          <div style={{
            width: i === step ? 20 : 8, height: 8, borderRadius: 99,
            background: i <= step ? '#C9963A' : '#E5E7EB',
            transition: 'all 0.2s ease',
          }} />
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 600, background: '#ffffff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>

        {/* Header bar */}
        <div style={{ background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#C9963A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Account Setup</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>Finish creating your account</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>A couple of quick steps to tailor your experience.</p>
          </div>
          <StepDot n={step} />
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px' }}>

          {/* Step 1 — Role picker */}
          {step === 1 && (
            <div style={{ display: 'flex', gap: 14 }}>
              <RoleCard
                role="helpseeker"
                title="Helpseeker"
                description="I need legal help or advice"
                selected={selectedRole === 'helpseeker'}
                onClick={handleRolePick}
              />
              <RoleCard
                role="lawyer"
                title="Lawyer"
                description="I provide legal services"
                selected={selectedRole === 'lawyer'}
                onClick={handleRolePick}
              />
            </div>
          )}

          {/* Step 2 — Benefits */}
          {step === 2 && selectedRole && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F1F3D', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
                Why {selectedRole === 'lawyer' ? 'Lawyers' : 'Helpseekers'} love Legal SahAI
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {benefits[selectedRole].map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#0F1F3D,#162848)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <svg width="10" height="10" fill="none" stroke="#C9963A" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{b}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btnPrimary} onClick={handleContinueToForm}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >Continue</button>
                <button style={btnGhost} onClick={() => setStep(1)}
                  onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                >Back</button>
              </div>
            </div>
          )}

          {/* Step 3 — Form */}
          {step === 3 && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Full name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} style={field} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} style={field} onFocus={onFocus} onBlur={onBlur} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>Selected role</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1F3D', textTransform: 'capitalize' }}>{selectedRole}</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" style={btnGhost} onClick={() => setStep(2)}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                  >Back</button>
                  <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
                    onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = '1'; }}
                  >{loading ? 'Saving...' : 'Finish'}</button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default CompleteRegistration;