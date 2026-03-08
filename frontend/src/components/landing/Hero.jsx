import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, CheckCircle } from 'lucide-react';

export default function Hero() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    // Subtle particle background
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const particles = Array.from({ length: 50 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.2 + 0.3,
            dx: (Math.random() - 0.5) * 0.25,
            dy: (Math.random() - 0.5) * 0.25,
            o: Math.random() * 0.35 + 0.08,
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(224,188,110,${p.o})`;
                ctx.fill();
                p.x += p.dx;
                p.y += p.dy;
                if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
            });
            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
    }, []);

    return (
        <section style={{
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            background: '#0a0b0f',
            paddingTop: '72px',
        }}>

            {/* Canvas */}
            <canvas ref={canvasRef} style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', opacity: 0.5,
            }} />

            {/* Glow */}
            <div style={{
                position: 'absolute', top: '15%', left: '50%',
                transform: 'translateX(-50%)',
                width: '900px', height: '500px',
                background: 'radial-gradient(ellipse, rgba(224,188,110,0.07) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />

            {/* Grid */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
                backgroundSize: '48px 48px', pointerEvents: 'none',
            }} />

            {/* ── Main content: two columns ── */}
            <div style={{
                position: 'relative', zIndex: 2,
                maxWidth: '1280px', margin: '0 auto',
                padding: '80px 24px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '64px',
                alignItems: 'center',
                width: '100%',
            }} className="hero-grid">

                {/* ── LEFT: Text ── */}
                <div>
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(224,188,110,0.08)',
                            border: '1px solid rgba(224,188,110,0.22)',
                            borderRadius: '100px', padding: '6px 14px 6px 10px',
                            marginBottom: '28px',
                        }}
                    >
                        <span style={{
                            background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)',
                            borderRadius: '100px', padding: '3px 8px',
                            fontSize: '0.68rem', fontWeight: '700',
                            color: '#0a0b0f', fontFamily: "'Syne', sans-serif",
                            letterSpacing: '0.06em',
                        }}>NEW</span>
                        <span style={{
                            fontSize: '0.8125rem', color: '#e0bc6e',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>AI-Powered SRS Analysis Platform</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: 'clamp(2.8rem, 5vw, 4.4rem)',
                            fontWeight: '800',
                            lineHeight: 1.07,
                            letterSpacing: '-0.03em',
                            marginBottom: '24px',
                            color: '#fff',
                        }}
                    >
                        Your Requirements.
                        <br />
                        <span style={{
                            background: 'linear-gradient(135deg, #f0d898 0%, #e0bc6e 45%, #c49a3c 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>Clarified.</span>
                    </motion.h1>

                    {/* Subtext */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        style={{
                            fontSize: '1.0625rem', color: '#8892a4',
                            lineHeight: 1.75, marginBottom: '40px',
                            maxWidth: '480px',
                            fontFamily: "'DM Sans', sans-serif", fontWeight: '300',
                        }}
                    >
                        Upload your SRS document and instantly detect duplicates,
                        ambiguities, and conflicts — then rewrite them with AI in minutes.
                        Ship better software, faster.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}
                    >
                        <motion.button
                            onClick={() => navigate('/register')}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                background: 'linear-gradient(135deg, #e0bc6e 0%, #c49a3c 100%)',
                                border: 'none', borderRadius: '12px', color: '#0a0b0f',
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem',
                                fontWeight: '600', padding: '14px 28px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 8px 32px rgba(224,188,110,0.32)',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Start Analyzing Free <ArrowRight size={17} />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px', color: '#c8d0de',
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem',
                                fontWeight: '400', padding: '14px 28px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            <div style={{
                                width: '28px', height: '28px',
                                background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)',
                                borderRadius: '50%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Play size={11} fill="#0a0b0f" color="#0a0b0f" />
                            </div>
                            Watch Demo
                        </motion.button>
                    </motion.div>

                    {/* Trust badges */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}
                    >
                        {['No credit card required', 'IEEE 830 compliant', 'Free to start'].map((t, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                color: '#555f72', fontSize: '0.8125rem',
                                fontFamily: "'DM Sans', sans-serif",
                            }}>
                                <CheckCircle size={13} color="#e0bc6e" /> {t}
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* ── RIGHT: Mockup card ── */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.9, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                        background: 'rgba(16,20,28,0.85)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '20px',
                        padding: '28px',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
                        width: '100%',
                    }}
                >
                    {/* Window chrome */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {['#f87171', '#fbbf24', '#4ade80'].map((c, i) => (
                                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
                            ))}
                        </div>
                        <div style={{
                            flex: 1, background: 'rgba(255,255,255,0.04)',
                            borderRadius: '6px', padding: '5px 12px',
                            fontSize: '0.73rem', color: '#555f72',
                            fontFamily: "'DM Mono', monospace",
                        }}>SRS_v2.1_final.docx — Reqify Analysis</div>
                    </div>

                    {/* Summary row */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                        gap: '10px', marginBottom: '20px',
                    }}>
                        {[
                            { label: 'Requirements', value: '333', color: '#e0bc6e' },
                            { label: 'Duplicates', value: '12', color: '#fbbf24' },
                            { label: 'Ambiguous', value: '82', color: '#f87171' },
                        ].map((s, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '10px', padding: '12px',
                                textAlign: 'center',
                            }}>
                                <div style={{
                                    fontFamily: "'Syne', sans-serif", fontSize: '1.4rem',
                                    fontWeight: '700', color: s.color, lineHeight: 1,
                                }}>{s.value}</div>
                                <div style={{
                                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem',
                                    color: '#555f72', marginTop: '4px',
                                }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Requirement rows */}
                    {[
                        { id: 'FR-01', text: 'The system SHALL provide a self-registration process...', status: 'clean' },
                        { id: 'FR-12', text: 'The system SHALL allow upload of supplementary docs...', status: 'duplicate' },
                        { id: 'FR-55', text: 'The system SHALL provide a structured job posting form...', status: 'ambiguous' },
                        { id: 'FR-21', text: 'The system SHALL allow the employer to upload...', status: 'duplicate' },
                        { id: 'FR-70', text: 'The system SHALL implement AI-driven matching...', status: 'clean' },
                    ].map((req, i) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.55 + i * 0.08 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '9px 12px', borderRadius: '8px', marginBottom: '5px',
                                background: req.status === 'duplicate' ? 'rgba(251,191,36,0.05)' :
                                    req.status === 'ambiguous' ? 'rgba(248,113,113,0.05)' :
                                        'rgba(255,255,255,0.02)',
                                border: req.status === 'duplicate' ? '1px solid rgba(251,191,36,0.12)' :
                                    req.status === 'ambiguous' ? '1px solid rgba(248,113,113,0.12)' :
                                        '1px solid transparent',
                            }}
                        >
                            <span style={{
                                fontFamily: "'DM Mono', monospace", fontSize: '0.68rem',
                                color: '#e0bc6e', fontWeight: '500', flexShrink: 0,
                            }}>{req.id}</span>
                            <span style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.77rem',
                                color: '#8892a4', flex: 1, overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{req.text}</span>
                            <span style={{
                                fontSize: '0.63rem', fontFamily: "'DM Sans', sans-serif",
                                fontWeight: '600', padding: '2px 7px', borderRadius: '4px', flexShrink: 0,
                                background: req.status === 'duplicate' ? 'rgba(251,191,36,0.12)' :
                                    req.status === 'ambiguous' ? 'rgba(248,113,113,0.12)' :
                                        'rgba(74,222,128,0.12)',
                                color: req.status === 'duplicate' ? '#fbbf24' :
                                    req.status === 'ambiguous' ? '#f87171' : '#4ade80',
                            }}>
                                {req.status === 'clean' ? '✓ Clean' : req.status === 'duplicate' ? '⚠ Dup' : '⚑ Ambig'}
                            </span>
                        </motion.div>
                    ))}

                    {/* Progress */}
                    <div style={{ marginTop: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.73rem', color: '#555f72', fontFamily: "'DM Sans', sans-serif" }}>
                                Analysis complete
                            </span>
                            <span style={{ fontSize: '0.73rem', color: '#e0bc6e', fontFamily: "'DM Mono', monospace" }}>
                                94%
                            </span>
                        </div>
                        <div style={{
                            height: '4px', background: 'rgba(255,255,255,0.06)',
                            borderRadius: '4px', overflow: 'hidden',
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '94%' }}
                                transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}
                                style={{
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #e0bc6e, #f0d898)',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                style={{
                    position: 'absolute', bottom: '28px', left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                }}
            >
                <span style={{
                    fontSize: '0.7rem', color: '#555f72',
                    fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.12em',
                }}>SCROLL</span>
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: '1px', height: '28px', background: 'linear-gradient(to bottom, #555f72, transparent)' }}
                />
            </motion.div>

            <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
        }
      `}</style>
        </section>
    );
}