import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import logo from '../../assets/Logo.png';

const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Technology', href: '#technology' },
    { label: 'About', href: '#about' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (href) => {
        setMobileOpen(false);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <>
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0,
                    zIndex: 100,
                    padding: '0 24px',
                    transition: 'all 0.4s ease',
                    background: scrolled ? 'rgba(10,11,15,0.88)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(20px)' : 'none',
                    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
            >
                <div style={{
                    maxWidth: '1280px', margin: '0 auto',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', height: '72px',
                }}>

                    {/* ── Logo — increased to 44px ── */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                        <img src={logo} alt="Reqify" style={{ height: '55px', width: 'auto', objectFit: 'contain' }} />
                    </Link>

                    {/* ── Desktop Nav ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="desktop-nav">
                        {navLinks.map((link) => (
                            <button key={link.label} onClick={() => scrollTo(link.href)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#8892a4', fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.9rem', fontWeight: '400',
                                padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s ease',
                            }}
                                onMouseEnter={e => { e.target.style.color = '#f0d898'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                                onMouseLeave={e => { e.target.style.color = '#8892a4'; e.target.style.background = 'none'; }}
                            >{link.label}</button>
                        ))}
                    </div>

                    {/* ── CTA Buttons ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="desktop-nav">
                        <button onClick={() => navigate('/login')} style={{
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '10px', color: '#c8d0de',
                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                            fontWeight: '500', padding: '9px 22px', cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                            onMouseEnter={e => { e.target.style.borderColor = 'rgba(240,216,152,0.5)'; e.target.style.color = '#f0d898'; }}
                            onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.color = '#c8d0de'; }}
                        >Log In</button>

                        <motion.button
                            onClick={() => navigate('/register')}
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                background: 'linear-gradient(135deg, #e0bc6e 0%, #c49a3c 100%)',
                                border: 'none', borderRadius: '10px', color: '#0a0b0f',
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                                fontWeight: '600', padding: '9px 22px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                boxShadow: '0 4px 20px rgba(224,188,110,0.35)',
                            }}
                        >Get Started <ArrowRight size={15} /></motion.button>
                    </div>

                    {/* ── Mobile Button ── */}
                    <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#c8d0de', padding: '8px', display: 'none',
                    }}>
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </motion.nav>

            {/* ── Mobile Menu ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed', top: '72px', left: 0, right: 0, zIndex: 99,
                            background: 'rgba(10,11,15,0.97)', backdropFilter: 'blur(20px)',
                            borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px 24px',
                        }}
                    >
                        {navLinks.map((link, i) => (
                            <motion.button key={link.label}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                onClick={() => scrollTo(link.href)}
                                style={{
                                    display: 'block', width: '100%', background: 'none', border: 'none',
                                    cursor: 'pointer', color: '#c8d0de', fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '1rem', padding: '14px 0', textAlign: 'left',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >{link.label}</motion.button>
                        ))}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => { navigate('/login'); setMobileOpen(false); }} style={{
                                flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '10px', color: '#c8d0de', fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.9rem', fontWeight: '500', padding: '12px', cursor: 'pointer',
                            }}>Log In</button>
                            <button onClick={() => { navigate('/register'); setMobileOpen(false); }} style={{
                                flex: 1, background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)',
                                border: 'none', borderRadius: '10px', color: '#0a0b0f',
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                                fontWeight: '600', padding: '12px', cursor: 'pointer',
                            }}>Get Started</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        @media (max-width: 768px) {
          .desktop-nav     { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
        </>
    );
}
