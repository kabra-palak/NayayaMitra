import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DailyLegalDose from '../components/DailyLegalDose';
import useAuthStore from '../context/AuthContext';
import { formatDisplayName } from '../utils/name';

const QuickCard = ({ title, desc, emoji, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#ffffff',
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      padding: '18px 20px',
      cursor: 'pointer',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = '#C9963A';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,150,58,0.12)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = '#E5E7EB';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: 'linear-gradient(135deg, #0F1F3D 0%, #1a3260 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, flexShrink: 0,
    }}>
      {emoji}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1F3D', letterSpacing: '-0.01em' }}>{title}</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();

  const authUser = useAuthStore(s => s.user) || {};
  const isLawyer = authUser?.role === 'lawyer';
  const isOnboarded = Boolean(authUser?.onboarded) || Boolean((authUser?.bio && authUser.bio.length > 0) || (authUser?.specialties && authUser.specialties.length > 0));

  // role-aware quick action sets
  let quickActions = [];
  if (isLawyer) {
    quickActions = [
      { title: 'Requests', desc: 'View incoming client requests', emoji: '🔔', route: '/lawyer/requests' },
      { title: 'My Clients', desc: 'Manage your clients and cases', emoji: '👥', route: '/mylawyers' },
      { title: 'Chat with Clients', desc: 'Chat with clients and discuss cases', emoji: '💬', route: '/chats?target=client' },
      { title: 'AutoFill Forms', desc: 'Upload & auto-fill client PDFs', emoji: '📝', route: '/forms/auto-fill' },
      { title: 'Legal Desks', desc: 'Organize matters and documents', emoji: '📁', route: '/legal-desk' },
      { title: isOnboarded ? 'Profile' : 'Complete Onboarding', desc: isOnboarded ? 'View your profile' : 'Finish onboarding to accept clients', emoji: '⚙️', route: isOnboarded ? '/profile' : '/onboard-lawyer' }
    ];
  } else {
    quickActions = [
      { title: 'Find Lawyer', desc: 'Search and connect with lawyers nearby', emoji: '🔍', route: '/find-lawyer' },
      { title: 'Chat a Lawyer', desc: 'Get quick legal help via chat', emoji: '💬', route: '/chats?target=lawyer' },
      { title: 'AutoFill Forms', desc: 'Upload & auto-fill PDFs quickly', emoji: '📝', route: '/forms/auto-fill' },
      { title: 'Legal Desks', desc: 'Organize your documents', emoji: '📁', route: '/legal-desk' },
      // { title: 'Notebook', desc: 'Save notes and AI summaries', emoji: '📒', route: '/notebook' },
      // { title: 'Support', desc: 'Get help from our team', emoji: '🆘', route: '/support' }
    ];
  }

  return (
<div
  style={{
    width: "100%",
    padding: "32px 36px",
    boxSizing: "border-box",
    background: "#F0F2F5",
    marginTop: 0
  }}
>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* ── Hero banner ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 60%, #1a3260 100%)',
              borderRadius: 16,
              padding: '32px 36px',
              marginBottom: 24,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(201,150,58,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -60, right: 80, width: 160, height: 160, borderRadius: '50%', background: 'rgba(201,150,58,0.05)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, position: 'relative' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#C9963A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {isLawyer ? 'Lawyer Dashboard' : 'Help Seeker Dashboard'}
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                  Welcome back, {formatDisplayName(authUser.name) || 'Guest'}
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 8, margin: '8px 0 0' }}>
                  Quick access to common features and your daily legal insight.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <button
                  onClick={() => navigate('/legal-desk')}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >
                  Go to Legal Desks
                </button>
                <button
                  onClick={() => navigate('/forms/auto-fill')}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Upload a Form
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Main grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>

            {/* Left col */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Quick actions — first 4 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {quickActions.slice(0, 4).map(a => (
                  <QuickCard key={a.title} title={a.title} desc={a.desc} emoji={a.emoji} onClick={() => navigate(a.route)} />
                ))}
              </div>

              {/* Quick actions — rest */}
              {quickActions.slice(4).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {quickActions.slice(4).map(a => (
                    <QuickCard key={a.title} title={a.title} desc={a.desc} emoji={a.emoji} onClick={() => navigate(a.route)} />
                  ))}
                </div>
              )}

              {/* Recent activity */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: '20px 24px',
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F1F3D', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
                  Recent activity
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: '#F8F9FB',
                  borderRadius: 8,
                  border: '1px dashed #D1D5DB',
                }}>
                  <div style={{ fontSize: 20 }}>📂</div>
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                    No recent activity — start by uploading a document or creating a Legal Desk.
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right sidebar */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <DailyLegalDose />
              <div style={{
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: '18px 20px',
              }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#0F1F3D', margin: '0 0 12px', letterSpacing: '-0.005em' }}>
                  Quick tips
                </h4>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Upload PDFs to AutoFill and let the assistant detect fields.',
                    'Use Legal Desks to keep documents organized per case.',
                    'Chat for quick legal clarifications before contacting a lawyer.',
                  ].map((tip, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: 'linear-gradient(135deg, #0F1F3D, #1a3260)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1,
                      }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="#C9963A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.6 }}>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>

        </div>
    </div>
  );
};

export default Home;