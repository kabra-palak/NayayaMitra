import React from "react";
// framer-motion not used in this component
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../context/AuthContext";
import { formatDisplayName } from '../utils/name';
// icons: outline vs filled for selected state
import { MdOutlineHome, MdHome, MdOutlineDescription, MdDescription, MdOutlinePerson, MdPerson, MdOutlineAddCircle, MdAddCircle, MdOutlineNotifications, MdNotifications, MdChevronLeft, MdChevronRight, MdLightbulb, MdOutlineLightbulb } from 'react-icons/md';
import InitialAvatar from './InitialAvatar';
import formIcon from "../assets/formIcon.jpg";
import logoutIcon from "../assets/logoutIcon.jpg";

const Sidebar = ({ isOpen = true, toggleSidebar = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore((s) => s.user) || {};
  const logout = useAuthStore((s) => s.logout);

  // Sidebar is fixed-expanded for this project (no collapse)

  // derive selected state from location (path or ?feature)
  const qp = new URLSearchParams(location.search);
  const feature = qp.get('feature');
  const pathname = location.pathname || '';

  const isLawyer = authUser?.role === 'lawyer';
  // server-side authoritative onboarded flag preferred; fall back to profile heuristics
  const isOnboarded = Boolean(authUser?.onboarded) || Boolean((authUser?.bio && authUser.bio.length > 0) || (authUser?.specialties && authUser.specialties.length > 0));

  const go = (path, opts = {}) => {
    if (opts.feature) {
      navigate(`/home?feature=${opts.feature}`);
      return;
    }
    navigate(path);
  };

  const Button = ({ onClick, active, label, icon, labelText }) => {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        title={label}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isOpen ? 12 : 0,
          justifyContent: isOpen ? 'flex-start' : 'center',
          width: '100%',
          padding: isOpen ? '9px 14px' : '10px',
          borderRadius: 8,
          border: 'none',
          borderLeft: active ? '2.5px solid #C9963A' : '2.5px solid transparent',
          background: active
            ? 'linear-gradient(135deg, rgba(201,150,58,0.18) 0%, rgba(201,150,58,0.08) 100%)'
            : 'transparent',
          cursor: 'pointer',
          color: active ? '#E8B96A' : 'rgba(255,255,255,0.62)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ display: 'flex', alignItems: 'center', fontSize: 19, flexShrink: 0, color: active ? '#C9963A' : 'rgba(255,255,255,0.62)' }}>
          {icon}
        </span>
        {isOpen && (
          <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {labelText}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      style={{
        width: isOpen ? 256 : 64,
        position: 'relative',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        overflow: 'hidden',
        transition: 'width 0.2s cubic-bezier(.4,0,.2,1)',
        background: 'linear-gradient(180deg, #0F1F3D 0%, #162848 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* App brand at top */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isOpen ? 'space-between' : 'center',
        gap: 12,
        padding: isOpen ? '20px 14px 16px' : '20px 8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Scale-of-justice logomark */}
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #C9963A 0%, #A67820 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <line x1="10" y1="2" x2="10" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="3" y1="5" x2="17" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M3 5 L1 10 C1 12 5 12 5 10 L3 5Z" fill="white" opacity="0.9"/>
              <path d="M17 5 L15 10 C15 12 19 12 19 10 L17 5Z" fill="white" opacity="0.9"/>
              <line x1="7" y1="18" x2="13" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          {isOpen && (
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>Nyaya Mitra</div>
              <div style={{ padding: 5,fontSize: 10, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>AI Legal Assistant</div>
            </div>
          )}
        </div>
        <div>
          <button
            onClick={toggleSidebar}
            title={isOpen ? 'Collapse' : 'Expand'}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '4px 5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {isOpen ? <MdChevronLeft size={16} /> : <MdChevronRight size={16} />}
          </button>
        </div>
      </div>

      <nav style={{ padding: '8px 8px 0', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button onClick={() => go('/home')} active={feature === null && pathname.startsWith('/home')} label="Home" icon={feature === null && pathname.startsWith('/home') ? <MdHome size={20} /> : <MdOutlineHome size={20} />} labelText="Home" />

        <Button onClick={() => go('/legal-desk')} active={feature === 'chatpdf' || pathname.startsWith('/legal-desk')} label="Legal Desks" icon={feature === 'chatpdf' ? <MdDescription size={20} /> : <MdOutlineDescription size={20} />} labelText="Legal Desks" />

        {!isLawyer && (
          <Button onClick={() => go('/find-lawyer')} active={pathname.startsWith('/find-lawyer')} label="Find Lawyers" icon={pathname.startsWith('/find-lawyer') ? <MdPerson size={20} /> : <MdOutlinePerson size={20} />} labelText="Find Lawyers" />
        )}

        {/* Chat entries: show role-appropriate chat shortcuts */}
        {!isLawyer && (
          <Button onClick={() => go('/chats?target=lawyer')} active={pathname.startsWith('/chats')} label="Chat with Lawyer" icon={pathname.startsWith('/chats') ? <MdPerson size={20} /> : <MdOutlinePerson size={20} />} labelText="Chat with Lawyer" />
        )}

        {isLawyer && (
          <Button onClick={() => go('/chats?target=client')} active={pathname.startsWith('/chats')} label="Chat with Clients" icon={pathname.startsWith('/chats') ? <MdPerson size={20} /> : <MdOutlinePerson size={20} />} labelText="Chat with Clients" />
        )}

        {isLawyer && !isOnboarded && (
          <Button onClick={() => go('/onboard-lawyer')} active={pathname.startsWith('/onboard-lawyer')} label="Become a lawyer" icon={pathname.startsWith('/onboard-lawyer') ? <MdAddCircle size={20} /> : <MdOutlineAddCircle size={20} />} labelText="Become a Lawyer" />
        )}

        {isLawyer && (
          <Button onClick={() => go('/lawyer/requests')} active={pathname.startsWith('/lawyer/requests')} label="Requests" icon={pathname.startsWith('/lawyer/requests') ? <MdNotifications size={20} /> : <MdOutlineNotifications size={20} />} labelText="Requests" />
        )}
        {/* Auto-fill forms feature (use provided /form.png) */}
        <Button
          onClick={() => go('/forms/auto-fill')}
          active={pathname.startsWith('/forms/auto-fill')}
          label="AutoFill Forms"
          icon={<img src={formIcon} alt="Forms" style={{ width: 20, height: 20 }} />}
          labelText="AutoFill Forms"
        />
        {/* General Ask / Quick Guide feature */}
        <Button onClick={() => go('/general-ask')} active={pathname.startsWith('/general-ask')} label="Quick Guide" icon={pathname.startsWith('/general-ask') ? <MdLightbulb size={20} /> : <MdOutlineLightbulb size={20} />} labelText="Quick Guide" />
      </nav>

      <div style={{ flex: 1 }} />

      <div style={{ width: '100%', padding: 8, borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <div style={{ width: 40, borderTop: '1px dashed rgba(255,255,255,0.12)' }} />
        </div>

        {/* user profile moved to bottom */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: isOpen ? '10px' : '8px',
          justifyContent: isOpen ? 'flex-start' : 'center',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
        }}>
          <InitialAvatar name={authUser?.name} style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid #C9963A', flexShrink: 0 }} />
          {isOpen && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDisplayName(authUser?.name) || 'Guest'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', marginTop: 1 }}>{authUser?.role === 'lawyer' ? (isOnboarded ? 'Onboarded Lawyer' : 'Lawyer') : (authUser?.role ? 'Helpseeker' : 'Guest')}</div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 6 }}>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isOpen ? 'flex-start' : 'center',
              gap: isOpen ? 8 : 0,
              width: '100%',
              padding: isOpen ? '8px 10px' : '8px',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'rgba(255,255,255,0.42)',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,60,60,0.12)'; e.currentTarget.style.color = '#F08080'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.42)'; }}
          >
            <img style={{ width: 16, height: 16 }} src={logoutIcon} alt="Logout" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;