import React from 'react';
import { motion } from 'framer-motion';

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #D1D5DB',
  background: '#F9FAFB',
  fontSize: 13,
  color: '#0F1F3D',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
};

const onFocus = e => {
  e.target.style.borderColor = '#C9963A';
  e.target.style.boxShadow = '0 0 0 3px rgba(201,150,58,0.12)';
  e.target.style.background = '#fff';
};

const onBlur = e => {
  e.target.style.borderColor = '#D1D5DB';
  e.target.style.boxShadow = 'none';
  e.target.style.background = '#F9FAFB';
};

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: '#6B7280',
  marginBottom: 5,
  letterSpacing: '0.03em',
};

// Pure, memoized filters container. Parent should pass stable callbacks (useCallback)
const FilterSection = React.memo(({ title, children }) => (
  <motion.div
    style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 16, marginBottom: 16 }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#0F1F3D', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {title}
    </h3>
    {children}
  </motion.div>
));

const FiltersContainer = ({ filters, onFilterChange, onReset, show = true, onClose, counts = {} }) => {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ width: 272, flexShrink: 0, display: show ? 'block' : 'none' }}
      className="lg:block"
    >
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #E5E7EB',
        padding: '20px 18px',
        position: 'sticky',
        top: 24,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F1F3D', margin: 0, letterSpacing: '-0.01em' }}>Filters</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden"
                style={{
                  padding: '5px 10px', borderRadius: 6,
                  border: '1px solid #E5E7EB', background: '#fff',
                  fontSize: 12, color: '#374151', cursor: 'pointer',
                }}
              >
                Close
              </button>
            )}
            <button
              onClick={onReset}
              style={{
                fontSize: 12, fontWeight: 600, color: '#C9963A',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#A67820'}
              onMouseLeave={e => e.currentTarget.style.color = '#C9963A'}
            >
              Reset All
            </button>
          </div>
        </div>

        <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', scrollbarWidth: 'none' }}>
          <FilterSection title="Search">
            <input
              value={filters.query}
              onChange={e => onFilterChange('query', e.target.value)}
              placeholder="Search by name, specialty..."
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </FilterSection>

          <FilterSection title="Location & Specialization">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={filters.city}
                onChange={e => onFilterChange('city', e.target.value)}
                placeholder="City e.g. Mumbai"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
                list="city-list"
              />
              <input
                value={filters.specialization}
                onChange={e => onFilterChange('specialization', e.target.value)}
                placeholder="Specialization e.g. Criminal"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          </FilterSection>

          <FilterSection title="Experience & Rating">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={labelStyle}>Min Experience</label>
                <input
                  value={filters.minExp}
                  onChange={e => onFilterChange('minExp', e.target.value)}
                  type="number"
                  min="0"
                  placeholder="Years"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label style={labelStyle}>Min Rating</label>
                <input
                  value={filters.minRating}
                  onChange={e => onFilterChange('minRating', e.target.value)}
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="0–5"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>
          </FilterSection>

          <FilterSection title="Fee Range">
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={filters.feeMin}
                onChange={e => onFilterChange('feeMin', e.target.value)}
                placeholder="Min ₹"
                style={{ ...inputStyle, width: '50%' }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <input
                value={filters.feeMax}
                onChange={e => onFilterChange('feeMax', e.target.value)}
                placeholder="Max ₹"
                style={{ ...inputStyle, width: '50%' }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          </FilterSection>

          <FilterSection title="Additional Filters">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={labelStyle}>Consultation Mode</label>
                <select
                  value={filters.modeFilter}
                  onChange={e => onFilterChange('modeFilter', e.target.value)}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                >
                  <option value="">Any Mode</option>
                  <option value="in-person">In-person</option>
                  <option value="video">Video Call</option>
                  <option value="chat">Chat</option>
                  <option value="phone">Phone</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <input
                  type="checkbox"
                  checked={!!filters.verifiedOnly}
                  onChange={e => onFilterChange('verifiedOnly', e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: '#C9963A', cursor: 'pointer' }}
                />
                <label style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>Verified Lawyers Only</label>
              </div>
            </div>
          </FilterSection>

          {/* Quick stats */}
          <div style={{ paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{
                textAlign: 'center', padding: '14px 8px',
                background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)',
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#E8B96A', lineHeight: 1 }}>{counts.available ?? '-'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Available</div>
              </div>
              <div style={{
                textAlign: 'center', padding: '14px 8px',
                background: 'rgba(34,197,94,0.07)',
                border: '1px solid rgba(34,197,94,0.18)',
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#15803D', lineHeight: 1 }}>{counts.avgRating ?? '-'}</div>
                <div style={{ fontSize: 10, color: '#16A34A', marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default React.memo(FiltersContainer);