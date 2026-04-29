// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', size = 'md', dot = false }) {
  const variants = {
    default: { bg: 'rgba(255,255,255,0.06)', color: '#c8d0de', border: 'rgba(255,255,255,0.08)' },
    gold:    { bg: 'rgba(201,168,124,0.12)', color: '#c9a87c', border: 'rgba(201,168,124,0.25)' },
    success: { bg: 'rgba(74,222,128,0.10)',  color: '#4ade80', border: 'rgba(74,222,128,0.20)'  },
    warning: { bg: 'rgba(251,191,36,0.10)',  color: '#fbbf24', border: 'rgba(251,191,36,0.20)'  },
    error:   { bg: 'rgba(248,113,113,0.10)', color: '#f87171', border: 'rgba(248,113,113,0.20)' },
    info:    { bg: 'rgba(96,165,250,0.10)',  color: '#60a5fa', border: 'rgba(96,165,250,0.20)'  },
  };
  const sizes = {
    sm: { padding: '3px 8px',   fontSize: '0.70rem',   borderRadius: '6px'  },
    md: { padding: '4px 10px',  fontSize: '0.75rem',   borderRadius: '6px'  },
    lg: { padding: '6px 14px',  fontSize: '0.8125rem', borderRadius: '8px'  },
  };

  const v = variants[variant] || variants.default;
  const s = sizes[size]       || sizes.md;

  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      gap:            '5px',
      background:     v.bg,
      color:          v.color,
      border:         `1px solid ${v.border}`,
      fontFamily:     "'DM Sans', sans-serif",
      fontWeight:     '500',
      letterSpacing:  '0.01em',
      whiteSpace:     'nowrap',
      ...s,
    }}>
      {dot && (
        <span style={{
          width:        '6px',
          height:       '6px',
          borderRadius: '50%',
          background:   v.color,
          flexShrink:   0,
        }} />
      )}
      {children}
    </span>
  );
}


// ─── Toast ────────────────────────────────────────────────────────────────────
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, opts) => addToast({ message: msg, type: 'success', ...opts }),
    error:   (msg, opts) => addToast({ message: msg, type: 'error',   ...opts }),
    warning: (msg, opts) => addToast({ message: msg, type: 'warning', ...opts }),
    info:    (msg, opts) => addToast({ message: msg, type: 'info',    ...opts }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};

const icons = {
  success: <CheckCircle size={16} />,
  error:   <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info size={16} />,
};

const colors = {
  success: { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  color: '#4ade80' },
  error:   { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', color: '#f87171' },
  warning: { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  color: '#fbbf24' },
  info:    { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  color: '#60a5fa' },
};

const ToastContainer = ({ toasts, onRemove }) => (
  <div style={{
    position:   'fixed',
    bottom:     '24px',
    right:      '24px',
    zIndex:     9999,
    display:    'flex',
    flexDirection: 'column',
    gap:        '10px',
    maxWidth:   '380px',
  }}>
    <AnimatePresence>
      {toasts.map(t => {
        const c = colors[t.type] || colors.info;
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0,  scale: 1    }}
            exit={{    opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{
              display:       'flex',
              alignItems:    'flex-start',
              gap:           '10px',
              padding:       '14px 16px',
              background:    'rgba(16,20,28,0.95)',
              backdropFilter:'blur(16px)',
              border:        `1px solid ${c.border}`,
              borderRadius:  '12px',
              boxShadow:     '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ color: c.color, flexShrink: 0, marginTop: '1px' }}>
              {icons[t.type]}
            </span>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   '0.875rem',
              color:      '#c8d0de',
              lineHeight: '1.5',
              flex:       1,
              margin:     0,
            }}>
              {t.message}
            </p>
            <button
              onClick={() => onRemove(t.id)}
              style={{
                background: 'none',
                border:     'none',
                cursor:     'pointer',
                color:      '#555f72',
                padding:    '0',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
);
