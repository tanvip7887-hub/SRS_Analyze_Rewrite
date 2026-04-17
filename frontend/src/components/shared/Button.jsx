import { motion } from 'framer-motion';

const variants = {
    primary: {
        background: 'linear-gradient(135deg, #c9a87c 0%, #a8845a 100%)',
        color: '#0a0b0f',
        border: 'none',
        fontWeight: '600',
    },
    secondary: {
        background: 'transparent',
        color: '#c9a87c',
        border: '1px solid rgba(201,168,124,0.4)',
        fontWeight: '500',
    },
    ghost: {
        background: 'transparent',
        color: '#c8d0de',
        border: '1px solid rgba(255,255,255,0.08)',
        fontWeight: '400',
    },
    danger: {
        background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: '600',
    },
    success: {
        background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
        color: '#0a0b0f',
        border: 'none',
        fontWeight: '600',
    },
};

const sizes = {
    sm: { padding: '8px 16px', fontSize: '0.8125rem', borderRadius: '8px' },
    md: { padding: '11px 24px', fontSize: '0.9375rem', borderRadius: '10px' },
    lg: { padding: '14px 32px', fontSize: '1rem', borderRadius: '12px' },
    xl: { padding: '16px 40px', fontSize: '1.0625rem', borderRadius: '14px' },
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    loading = false,
    disabled = false,
    fullWidth = false,
    onClick,
    type = 'button',
    className = '',
    ...props
}) {
    const v = variants[variant] || variants.primary;
    const s = sizes[size] || sizes.md;

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            whileHover={{ scale: disabled || loading ? 1 : 1.02, y: disabled || loading ? 0 : -1 }}
            whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '-0.01em',
                transition: 'box-shadow 0.2s ease',
                width: fullWidth ? '100%' : 'auto',
                whiteSpace: 'nowrap',
                position: 'relative',
                overflow: 'hidden',
                ...v,
                ...s,
            }}
            className={className}
            {...props}
        >
            {/* Gold shimmer on hover for primary */}
            {variant === 'primary' && (
                <span style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                    transform: 'translateX(-100%)',
                    transition: 'transform 0.5s ease',
                }} className="btn-shimmer" />
            )}

            {loading ? (
                <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                }} />
            ) : icon ? (
                <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
            ) : null}

            {children}

            {iconRight && !loading && (
                <span style={{ display: 'flex', alignItems: 'center' }}>{iconRight}</span>
            )}

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover .btn-shimmer { transform: translateX(100%); }
      `}</style>
        </motion.button>
    );
}
