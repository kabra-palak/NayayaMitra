import { motion, AnimatePresence } from "framer-motion";
import { useState, useNavigate } from 'react';
import api from '../Axios/axios';
import useAuthStore from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';

const backendUrl = import.meta.env.VITE_BACKEND_URL;;
// const navigate = useNavigate();

const Login = () => {
  const setToken = useAuthStore(s => s.setToken);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(null);
  const [signupStep, setSignupStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const submit = async () => {
    setIsLoading(true);
    try {
      let res;
      if (mode === 'signup') {
        res = await api.post('/auth/signup', { email, password, name, role });
      } else {
        res = await api.post('/auth/login', { email, password });
      }
      if (res.data?.token) {
        setToken(res.data.token);
        await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${res.data.token}` },
        });
        navigate('/home');
      }
    } catch (e) {
      console.error(e);
      toast.error('Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    background: '#F9FAFB',
    fontSize: 14,
    color: '#0F1F3D',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  };

  const RoleCard = ({ title, description, icon, selected, onClick }) => (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      style={{
        cursor: 'pointer',
        padding: '18px 20px',
        borderRadius: 10,
        border: selected ? '2px solid #C9963A' : '1.5px solid #E5E7EB',
        background: selected ? 'rgba(201,150,58,0.06)' : '#ffffff',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: selected
          ? 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)'
          : 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F1F3D' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3, lineHeight: 1.5 }}>{description}</div>
      </div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            width: 22, height: 22, borderRadius: '50%',
            background: '#C9963A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <svg width="11" height="11" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );

  const isDisabled = (mode === 'signup' && signupStep === 1 && !role) || isLoading;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F0F2F5',
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Subtle background blobs — same logic, new colors */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div
          style={{ position: 'absolute', top: '20%', left: '15%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(201,150,58,0.07)', filter: 'blur(60px)' }}
          animate={{ scale: [1, 1.2, 1], x: [0, 80, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{ position: 'absolute', top: '60%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(15,31,61,0.06)', filter: 'blur(80px)' }}
          animate={{ scale: [1.2, 1, 1.2], x: [0, -80, 0], y: [0, 40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div style={{
        maxWidth: 960,
        width: '100%',
        background: '#ffffff',
        borderRadius: 20,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        border: '1px solid #E5E7EB',
        boxShadow: '0 24px 64px rgba(15,31,61,0.12)',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* ── Left Panel ── */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(160deg, #0F1F3D 0%, #162848 55%, #1a3260 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative ring */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(201,150,58,0.15)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', border: '1px solid rgba(201,150,58,0.1)', pointerEvents: 'none' }} />

          {/* Brand */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <line x1="10" y1="2" x2="10" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="3" y1="5" x2="17" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 5 L1 10 C1 12 5 12 5 10 L3 5Z" fill="white" opacity="0.9"/>
                  <path d="M17 5 L15 10 C15 12 19 12 19 10 L17 5Z" fill="white" opacity="0.9"/>
                  <line x1="7" y1="18" x2="13" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>Legal SahAI</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your Trusted Legal Companion</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {[
                { color: '#22C55E', label: 'AI-Powered Legal Assistance', sub: 'Smart document analysis', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> },
                { color: '#3B82F6', label: 'End-to-end Encryption', sub: 'Documents and messages are encrypted for your privacy', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> },
                { color: '#A855F7', label: 'Expert Network', sub: 'Connect with legal professionals', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
              ].map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24">{f.icon}</svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.48)', marginTop: 2 }}>{f.sub}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Mode toggle */}
          <motion.div
            style={{ position: 'relative', zIndex: 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 4,
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'inline-flex',
              marginTop: 40,
            }}>
              {['login', 'signup'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 9,
                    fontWeight: 600,
                    fontSize: 13,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: mode === m ? '#ffffff' : 'transparent',
                    color: mode === m ? '#0F1F3D' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Right Panel ── */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#ffffff' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${signupStep}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C9963A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {mode === 'signup' ? 'Create account' : 'Welcome back'}
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F1F3D', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  {mode === 'signup'
                    ? (signupStep === 1 ? 'Join Legal SahAI' : 'Create Your Account')
                    : 'Welcome Back to Legal SahAI'
                  }
                </h2>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                  {mode === 'signup'
                    ? (signupStep === 1 ? 'Choose how you want to use our platform' : 'Complete your profile to get started')
                    : 'Sign in to access your legal dashboard'
                  }
                </p>
              </div>

              {/* Role Selection */}
              {mode === 'signup' && signupStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <RoleCard
                    title="Help Seeker"
                    description="I need legal assistance or advice"
                    icon="⚖️"
                    selected={role === 'helpseeker'}
                    onClick={() => { setRole('helpseeker'); setSignupStep(3); }}
                  />
                  <RoleCard
                    title="Legal Professional"
                    description="I provide legal services"
                    icon="👨‍⚖️"
                    selected={role === 'lawyer'}
                    onClick={() => { setRole('lawyer'); setSignupStep(3); }}
                  />
                </div>
              )}

              {/* Registration Form */}
              {mode === 'signup' && signupStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(201,150,58,0.08)',
                      borderRadius: 8,
                      border: '1px solid rgba(201,150,58,0.25)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#C9963A,#A67820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      {role === 'helpseeker' ? '⚖️' : '👨‍⚖️'}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#7A5A1A' }}>
                      Registering as {role === 'helpseeker' ? 'Help Seeker' : 'Legal Professional'}
                    </div>
                  </motion.div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { label: 'Full Name', placeholder: 'Enter your full name', value: name, onChange: e => setName(e.target.value), type: 'text' },
                      { label: 'Email Address', placeholder: 'Enter your email', value: email, onChange: e => setEmail(e.target.value), type: 'text' },
                      { label: 'Password', placeholder: 'Create a secure password', value: password, onChange: e => setPassword(e.target.value), type: 'password' },
                    ].map(f => (
                      <div key={f.label}>
                        <label style={labelStyle}>{f.label}</label>
                        <input
                          placeholder={f.placeholder}
                          value={f.value}
                          onChange={f.onChange}
                          type={f.type}
                          style={inputStyle}
                          onFocus={e => { e.target.style.borderColor = '#C9963A'; e.target.style.boxShadow = '0 0 0 3px rgba(201,150,58,0.12)'; e.target.style.background = '#fff'; }}
                          onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      style={{
                        padding: '10px 20px',
                        border: '1px solid #D1D5DB',
                        borderRadius: 8,
                        background: '#ffffff',
                        color: '#374151',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {/* Login Form */}
              {mode === 'login' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Email Address', placeholder: 'Enter your email', value: email, onChange: e => setEmail(e.target.value), type: 'text' },
                    { label: 'Password', placeholder: 'Enter your password', value: password, onChange: e => setPassword(e.target.value), type: 'password' },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={labelStyle}>{f.label}</label>
                      <input
                        placeholder={f.placeholder}
                        value={f.value}
                        onChange={f.onChange}
                        type={f.type}
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = '#C9963A'; e.target.style.boxShadow = '0 0 0 3px rgba(201,150,58,0.12)'; e.target.style.background = '#fff'; }}
                        onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
                <motion.button
                  onClick={submit}
                  disabled={isDisabled}
                  whileHover={!isDisabled ? { scale: 1.02 } : {}}
                  whileTap={!isDisabled ? { scale: 0.98 } : {}}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#ffffff',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    background: isDisabled
                      ? '#9CA3AF'
                      : 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}
                      />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    mode === 'signup' ? 'Create Account' : 'Sign In to Legal SahAI'
                  )}
                </motion.button>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                  <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>Or continue with</span>
                  <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                </div>

                <motion.a
                  href={mode === 'signup' && role ? `${backendUrl}/auth/google?role=${encodeURIComponent(role)}` : `${backendUrl}/auth/google`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '11px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    background: '#ffffff',
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#374151',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </motion.a>
              </div>

              {/* Footer */}
              <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>
                  {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                </span>
                <button
                  onClick={() => {
                    setMode(mode === 'signup' ? 'login' : 'signup');
                    setSignupStep(1);
                    setRole(null);
                  }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, color: '#C9963A',
                    padding: 0,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#A67820'}
                  onMouseLeave={e => e.currentTarget.style.color = '#C9963A'}
                >
                  {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;