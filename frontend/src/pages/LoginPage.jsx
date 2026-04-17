import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

export default function LoginPage() {
    const navigate = useNavigate();
    const { signIn, signInWithGoogle, signInWithGitHub } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setError('');
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
        setLoading(true);
        const { error } = await signIn({ email: form.email, password: form.password });
        setLoading(false);
        if (error) { setError(error.message); return; }
        navigate('/dashboard');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#0a0b0f',
            overflow: 'hidden',
        }} className="auth-grid">

            {/* ══════════════════════════════════════════
          LEFT PANEL — Branding
      ══════════════════════════════════════════ */}
            <div style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '40px 48px',
                overflow: 'hidden',
                background: 'linear-gradient(160deg, #0f1218 0%, #0a0b0f 60%, #0d1018 100%)',
                borderRight: '1px solid rgba(255,255,255,0.05)',
            }}>

                {/* Background geometric layers */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at 30% 50%, rgba(224,188,110,0.06) 0%, transparent 60%)',
                    pointerEvents: 'none',
                }} />

                {/* Animated layered lines — architectural feel like your reference */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            transition={{ delay: i * 0.08, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                            style={{
                                position: 'absolute',
                                bottom: `-${i * 40}px`,
                                left: `${20 + i * 6}%`,
                                right: `${20 + i * 6}%`,
                                height: `${55 + i * 7}%`,
                                border: `1px solid rgba(224,188,110,${0.04 + i * 0.012})`,
                                borderBottom: 'none',
                                borderRadius: `${32 - i * 2}px ${32 - i * 2}px 0 0`,
                                transformOrigin: 'bottom center',
                            }}
                        />
                    ))}
                </div>

                {/* Grid dots */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(rgba(224,188,110,0.06) 1px, transparent 1px)',
                    backgroundSize: '28px 28px', pointerEvents: 'none',
                }} />

                {/* Logo */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <Link to="/">
                        <img src={logo} alt="Reqify" style={{ height: '55px', width: 'auto' }} />
                    </Link>
                </div>

                {/* Center content */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    style={{ position: 'relative', zIndex: 2 }}
                >
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(224,188,110,0.08)',
                        border: '1px solid rgba(224,188,110,0.18)',
                        borderRadius: '100px', padding: '5px 14px', marginBottom: '24px',
                    }}>
                        <div style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: '#e0bc6e', animation: 'pulse 2s ease-in-out infinite',
                        }} />
                        <span style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem',
                            color: '#e0bc6e',
                        }}>AI-Powered Analysis</span>
                    </div>

                    <h2 style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                        fontWeight: '800',
                        color: '#fff',
                        lineHeight: 1.12,
                        letterSpacing: '-0.03em',
                        marginBottom: '16px',
                    }}>
                        Smarter requirements.
                        <br />
                        <span style={{
                            background: 'linear-gradient(135deg, #f0d898 0%, #e0bc6e 50%, #c49a3c 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>Faster delivery.</span>
                    </h2>

                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.9375rem',
                        color: '#555f72',
                        lineHeight: 1.7,
                        fontWeight: '300',
                        maxWidth: '340px',
                    }}>
                        Detect duplicates, flag ambiguities, and rewrite requirements
                        with AI — in minutes, not days.
                    </p>
                </motion.div>

                {/* Bottom stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    style={{
                        position: 'relative', zIndex: 2,
                        display: 'flex', gap: '32px',
                    }}
                >
                    {[
                        { val: '333+', label: 'Requirements' },
                        { val: '95%', label: 'Accuracy' },
                        { val: '3min', label: 'Processing' },
                    ].map((s, i) => (
                        <div key={i}>
                            <div style={{
                                fontFamily: "'Syne', sans-serif", fontSize: '1.25rem',
                                fontWeight: '700', color: '#e0bc6e',
                            }}>{s.val}</div>
                            <div style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                                color: '#555f72', marginTop: '2px',
                            }}>{s.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* ══════════════════════════════════════════
          RIGHT PANEL — Login Form
      ══════════════════════════════════════════ */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 48px',
                position: 'relative',
                background: '#0a0b0f',
            }}>

                {/* Top right nav */}
                <div style={{
                    position: 'absolute', top: '32px', right: '40px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                    <span style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#555f72',
                    }}>Don't have an account?</span>
                    <Link to="/register">
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            style={{
                                background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)',
                                borderRadius: '8px', color: '#0a0b0f',
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                                fontWeight: '600', padding: '8px 18px', cursor: 'pointer',
                            }}
                        >Create profile</motion.div>
                    </Link>
                </div>

                {/* Form container */}
                <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    style={{ width: '100%', maxWidth: '400px' }}
                >
                    <h1 style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: '1.875rem',
                        fontWeight: '700',
                        color: '#fff',
                        letterSpacing: '-0.03em',
                        marginBottom: '8px',
                    }}>Welcome back</h1>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                        color: '#555f72', fontWeight: '300', marginBottom: '36px',
                    }}>Sign in to your Reqify account to continue</p>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: 'rgba(248,113,113,0.08)',
                                border: '1px solid rgba(248,113,113,0.2)',
                                borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
                            }}
                        >
                            <AlertCircle size={15} color="#f87171" />
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#f87171' }}>
                                {error}
                            </span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem',
                                fontWeight: '500', color: '#8892a4', display: 'block', marginBottom: '8px',
                            }}>Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={15} style={{
                                    position: 'absolute', left: '14px', top: '50%',
                                    transform: 'translateY(-50%)', color: '#555f72', pointerEvents: 'none',
                                }} />
                                <input
                                    type="email" name="email" value={form.email}
                                    onChange={handleChange} placeholder="you@company.com"
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '10px',
                                        padding: '13px 14px 13px 42px',
                                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                                        color: '#fff', outline: 'none',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = 'rgba(224,188,110,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(224,188,110,0.07)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem',
                                fontWeight: '500', color: '#8892a4', display: 'block', marginBottom: '8px',
                            }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={15} style={{
                                    position: 'absolute', left: '14px', top: '50%',
                                    transform: 'translateY(-50%)', color: '#555f72', pointerEvents: 'none',
                                }} />
                                <input
                                    type={show ? 'text' : 'password'}
                                    name="password" value={form.password}
                                    onChange={handleChange} placeholder="Your password"
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                                        padding: '13px 42px 13px 42px',
                                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                                        color: '#fff', outline: 'none',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = 'rgba(224,188,110,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(224,188,110,0.07)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                                />
                                <button type="button" onClick={() => setShow(!show)} style={{
                                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#555f72',
                                    padding: 0, display: 'flex',
                                }}>
                                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot */}
                        <div style={{ textAlign: 'right', marginBottom: '28px' }}>
                            <Link to="/forgot-password" style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: '#555f72',
                                transition: 'color 0.2s',
                            }}
                                onMouseEnter={e => e.target.style.color = '#e0bc6e'}
                                onMouseLeave={e => e.target.style.color = '#555f72'}
                            >Forgot password?</Link>
                        </div>

                        {/* Submit */}
                        <motion.button
                            type="submit" disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #e0bc6e 0%, #c49a3c 100%)',
                                border: 'none', borderRadius: '12px', color: '#0a0b0f',
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem',
                                fontWeight: '600', padding: '14px',
                                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: '0 8px 28px rgba(224,188,110,0.28)',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {loading ? (
                                <><span style={{
                                    width: '16px', height: '16px', border: '2px solid #0a0b0f',
                                    borderTopColor: 'transparent', borderRadius: '50%',
                                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                                }} /> Signing in...</>
                            ) : <> Sign In <ArrowRight size={16} /></>}
                        </motion.button>
                    </form>

                    {/* Divider */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0',
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                        <span style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#555f72',
                        }}>or continue with</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                    </div>

                    {/* Social login buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <motion.button 
                            onClick={() => signInWithGoogle()}
                            whileHover={{ borderColor: 'rgba(224,188,110,0.3)', y: -1 }}
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '10px', padding: '12px',
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
                                color: '#8892a4', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.26 9.77A7.2 7.2 0 0 1 12 4.8c1.73 0 3.29.62 4.51 1.64l3.36-3.36A12 12 0 0 0 0 12c0 2 .5 3.87 1.38 5.51l3.88-3.02A7.2 7.2 0 0 1 4.8 12c0-.77.16-1.51.46-2.23z" /><path fill="#FBBC05" d="M12 19.2c-2.16 0-4.09-.96-5.41-2.48L2.71 19.7A12 12 0 0 0 12 24c2.93 0 5.63-1.05 7.7-2.78l-3.7-2.87A7.2 7.2 0 0 1 12 19.2z" /><path fill="#4285F4" d="M23.76 12.27c0-.84-.08-1.65-.22-2.43H12v4.6h6.6a5.63 5.63 0 0 1-2.44 3.7l3.7 2.87C22.1 19.14 23.76 15.9 23.76 12.27z" /><path fill="#34A853" d="M5.26 14.23A7.2 7.2 0 0 1 4.8 12c0-.77.16-1.51.46-2.23L1.38 6.49A11.93 11.93 0 0 0 0 12c0 1.93.46 3.75 1.28 5.36l3.98-3.13z" /></svg>
                            Google
                        </motion.button>

                        <motion.button 
                            onClick={() => signInWithGitHub()}
                            whileHover={{ borderColor: 'rgba(224,188,110,0.3)', y: -1 }}
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '10px', padding: '12px',
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
                                color: '#8892a4', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#c8d0de"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z" /></svg>
                            GitHub
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        @media (max-width: 768px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-grid > div:first-child { display: none !important; }
        }
      `}</style>
        </div>
    );
}