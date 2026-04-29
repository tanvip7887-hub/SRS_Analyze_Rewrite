import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, CheckCircle, AlertTriangle, Copy, Sparkles } from 'lucide-react';

// ── Cycling words for the headline ───────────────────────────────────────────
const WORDS = ['Clarified.', 'Simplified.', 'Verified.', 'Perfected.'];

// ── Mock requirement rows shown inside the product preview ───────────────────
const MOCK_REQS = [
    {
        id: 'FR-01',
        text: 'The system shall process user requests efficiently and in a fast manner.',
        badge: 'ambiguous',
        score: '0.92',
        delay: 0.7,
    },
    {
        id: 'FR-07',
        text: 'The application should manage data and handle all user operations.',
        badge: 'duplicate',
        match: 'FR-02',
        delay: 0.9,
    },
    {
        id: 'NFR-03',
        text: 'System response time shall be under 200ms for the 95th percentile.',
        badge: 'clean',
        delay: 1.1,
    },
    {
        id: 'FR-12',
        text: 'Users should be able to easily and quickly navigate the interface.',
        badge: 'ambiguous',
        score: '0.87',
        delay: 1.3,
    },
];

const BADGE = {
    ambiguous: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.28)', color: '#fbbf24', label: '⚠ Ambiguous' },
    duplicate:  { bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)', color: '#f87171', label: '⊘ Duplicate'  },
    clean:      { bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)',  color: '#4ade80', label: '✓ Clean'      },
};

// ── Floating metric cards ─────────────────────────────────────────────────────
const METRICS = [
    {
        icon: <AlertTriangle size={14} />,
        value: '41',
        label: 'Ambiguities found',
        color: '#fbbf24',
        pos: { top: '8%', right: '-48px' },
        floatY: [0, -7, 0],
        delay: 1.4,
    },
    {
        icon: <Copy size={14} />,
        value: '12',
        label: 'Duplicates detected',
        color: '#f87171',
        pos: { bottom: '18%', left: '-52px' },
        floatY: [0, -9, 0],
        delay: 1.6,
    },
    {
        icon: <Sparkles size={14} />,
        value: '3 min',
        label: 'Processing time',
        color: '#818cf8',
        pos: { bottom: '2%', right: '-44px' },
        floatY: [0, -6, 0],
        delay: 1.8,
    },
];

export default function Hero() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [wordIdx, setWordIdx] = useState(0);
    const [scanPos, setScanPos] = useState(0);

    // ── Particle canvas ───────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;

        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize();
        window.addEventListener('resize', resize);

        const particles = Array.from({ length: 40 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.0 + 0.3,
            dx: (Math.random() - 0.5) * 0.22,
            dy: (Math.random() - 0.5) * 0.22,
            o: Math.random() * 0.18 + 0.04,
        }));

        const shootingStars = Array.from({ length: 4 }, () => ({
            x: Math.random() * canvas.width * 0.7,
            y: Math.random() * canvas.height * 0.4,
            len: Math.random() * 120 + 60,
            speed: Math.random() * 6 + 4,
            opacity: 0, active: false,
            delay: Math.random() * 300, timer: 0,
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(224,188,110,${p.o})`;
                ctx.fill();
                p.x += p.dx; p.y += p.dy;
                if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
            });
            shootingStars.forEach(s => {
                s.timer++;
                if (s.timer < s.delay) return;
                if (!s.active) { s.active = true; s.opacity = 1; }
                s.x += s.speed; s.y += s.speed * 0.5; s.opacity -= 0.018;
                if (s.opacity <= 0) {
                    s.active = false; s.timer = 0;
                    s.delay = Math.random() * 400 + 100;
                    s.x = Math.random() * canvas.width * 0.7;
                    s.y = Math.random() * canvas.height * 0.4;
                }
                const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.len, s.y - s.len * 0.5);
                grad.addColorStop(0, `rgba(240,216,152,${s.opacity})`);
                grad.addColorStop(1, `rgba(224,188,110,0)`);
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.len, s.y - s.len * 0.5);
                ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.beginPath();
                ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,240,180,${s.opacity})`; ctx.fill();
            });
            animId = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
    }, []);

    // ── Cycling headline word ─────────────────────────────────────────────────
    useEffect(() => {
        const t = setInterval(() => setWordIdx(i => (i + 1) % WORDS.length), 2600);
        return () => clearInterval(t);
    }, []);

    // ── Scan-line animation loop ──────────────────────────────────────────────
    useEffect(() => {
        let frame;
        let pos = 0;
        const step = () => {
            pos = (pos + 0.4) % 100;
            setScanPos(pos);
            frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <section style={{
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: '#0a0b0f',
            paddingTop: '72px',
        }}>
            {/* Particles */}
            <canvas ref={canvasRef} style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', opacity: 0.4,
            }} />

            {/* Grid */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.006) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.006) 1px, transparent 1px)',
                backgroundSize: '48px 48px', pointerEvents: 'none',
            }} />

            {/* Glow */}
            <div style={{
                position: 'absolute', top: '15%', left: '50%',
                transform: 'translateX(-50%)',
                width: '900px', height: '600px',
                background: 'radial-gradient(ellipse, rgba(224,188,110,0.07) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />

            {/* ── Content ── */}
            <div style={{
                position: 'relative', zIndex: 2,
                maxWidth: '900px', width: '100%',
                margin: '0 auto', padding: '60px 24px 80px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', textAlign: 'center',
            }}>


                {/* Headline with cycling word */}
                <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
                        fontWeight: '800',
                        lineHeight: 1.06,
                        letterSpacing: '-0.035em',
                        marginBottom: '20px',
                        color: '#fff',
                    }}
                >
                    Your Requirements.
                    <br />
                    {/* Cycling animated word — block div avoids horizontal clipping */}
                    <div style={{
                        height: '1.18em',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={wordIdx}
                                initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
                                animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
                                exit={{    opacity: 0, y: -22, filter: 'blur(8px)' }}
                                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                style={{
                                    background: 'linear-gradient(135deg, #f0d898 0%, #e0bc6e 45%, #c49a3c 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    fontSize: '1.12em',
                                    fontFamily: "'Syne', sans-serif",
                                    fontWeight: '800',
                                    letterSpacing: '-0.035em',
                                    lineHeight: 1.06,
                                    whiteSpace: 'nowrap',
                                    filter: 'drop-shadow(0 0 32px rgba(224,188,110,0.35))',
                                }}
                            >
                                {WORDS[wordIdx]}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    style={{
                        fontSize: '1.0625rem', color: '#8892a4',
                        lineHeight: 1.75, marginBottom: '36px',
                        maxWidth: '520px',
                        fontFamily: "'DM Sans', sans-serif", fontWeight: '300',
                    }}
                >
                    Upload your SRS document and instantly detect duplicates,
                    ambiguities, and conflicts — then rewrite them with AI in
                    minutes. Ship better software, faster.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}
                >
                    <motion.button
                        onClick={() => navigate('/register')}
                        whileHover={{ scale: 1.04, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            background: 'linear-gradient(135deg, #e0bc6e 0%, #c49a3c 100%)',
                            border: 'none', borderRadius: '12px', color: '#0a0b0f',
                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem',
                            fontWeight: '600', padding: '14px 30px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 24px rgba(224,188,110,0.3)',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Start Analyzing Free <ArrowRight size={17} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -1, borderColor: 'rgba(224,188,110,0.3)' }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px', color: '#c8d0de',
                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem',
                            fontWeight: '400', padding: '14px 28px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            backdropFilter: 'blur(8px)', transition: 'border-color 0.2s',
                        }}
                    >
                        <div style={{
                            width: '27px', height: '27px',
                            background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)',
                            borderRadius: '50%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Play size={10} fill="#0a0b0f" color="#0a0b0f" />
                        </div>
                        Watch Demo
                    </motion.button>
                </motion.div>

                {/* Social proof row */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px',
                    }}
                >
                    {/* Avatars */}
                    <div style={{ display: 'flex' }}>
                        {['#7c8cf8', '#f472b6', '#34d399', '#fbbf24', '#818cf8'].map((c, i) => (
                            <div key={i} style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: `linear-gradient(135deg, ${c}80, ${c}40)`,
                                border: '2px solid #0a0b0f',
                                marginLeft: i === 0 ? 0 : '-8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6rem', color: '#fff', fontWeight: '700',
                                fontFamily: "'DM Sans', sans-serif",
                            }}>
                                {['S', 'A', 'R', 'M', 'K'][i]}
                            </div>
                        ))}
                    </div>
                    <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.8125rem', color: '#555f72',
                    }}>
                        Trusted by <span style={{ color: '#c8d0de', fontWeight: '500' }}>500+</span> engineers & analysts
                    </span>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '24px',
                        flexWrap: 'wrap', justifyContent: 'center', marginBottom: '64px',
                    }}
                >
                    {['No credit card required', 'IEEE 830 compliant', 'Free to start'].map((t, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            color: '#555f72', fontSize: '0.8rem',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>
                            <CheckCircle size={13} color="#e0bc6e" /> {t}
                        </div>
                    ))}
                </motion.div>

                {/* ── PRODUCT MOCKUP ───────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.0, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    style={{ position: 'relative', width: '100%', maxWidth: '820px' }}
                >
                    {/* Floating metric cards */}
                    {METRICS.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1, y: m.floatY }}
                            transition={{
                                opacity: { delay: m.delay, duration: 0.5 },
                                scale:   { delay: m.delay, duration: 0.5 },
                                y:       { delay: m.delay, duration: 4, repeat: Infinity, ease: 'easeInOut' },
                            }}
                            style={{
                                position: 'absolute', zIndex: 10,
                                ...m.pos,
                                background: 'rgba(14,16,24,0.92)',
                                border: `1px solid ${m.color}28`,
                                borderRadius: '14px',
                                padding: '12px 16px',
                                backdropFilter: 'blur(16px)',
                                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${m.color}18`,
                                whiteSpace: 'nowrap',
                                userSelect: 'none',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: m.color }}>
                                {m.icon}
                                <span style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontSize: '1.1rem', fontWeight: '700', color: '#fff',
                                }}>{m.value}</span>
                            </div>
                            <div style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.72rem', color: '#555f72',
                            }}>{m.label}</div>
                        </motion.div>
                    ))}

                    {/* Glow behind mockup */}
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '600px', height: '300px',
                        background: 'radial-gradient(ellipse, rgba(224,188,110,0.1) 0%, transparent 70%)',
                        pointerEvents: 'none', filter: 'blur(20px)',
                    }} />

                    {/* Browser chrome frame */}
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'relative',
                            background: 'rgba(14,16,24,0.9)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            backdropFilter: 'blur(24px)',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
                        }}
                    >
                        {/* top gold accent line */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                            background: 'linear-gradient(90deg, transparent 0%, rgba(224,188,110,0.7) 40%, rgba(196,154,60,0.5) 60%, transparent 100%)',
                        }} />

                        {/* Chrome bar */}
                        <div style={{
                            padding: '14px 18px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            background: 'rgba(255,255,255,0.018)',
                        }}>
                            {/* Traffic lights */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {['#f87171', '#fbbf24', '#4ade80'].map((c, i) => (
                                    <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.7 }} />
                                ))}
                            </div>
                            {/* URL bar */}
                            <div style={{
                                flex: 1, maxWidth: '340px', margin: '0 auto',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '7px', padding: '5px 12px',
                                display: 'flex', alignItems: 'center', gap: '7px',
                            }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', flexShrink: 0, boxShadow: '0 0 5px #4ade80' }} />
                                <span style={{
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: '0.72rem', color: '#555f72',
                                    letterSpacing: '0.02em',
                                }}>reqify.app / analysis</span>
                            </div>
                            {/* Tab labels */}
                            {['Analysis', 'Rewrites', 'Export'].map((tab, i) => (
                                <div key={i} style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '0.72rem',
                                    color: i === 0 ? '#e0bc6e' : '#555f72',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: i === 0 ? 'rgba(224,188,110,0.08)' : 'transparent',
                                    border: i === 0 ? '1px solid rgba(224,188,110,0.18)' : '1px solid transparent',
                                    cursor: 'default',
                                }}>{tab}</div>
                            ))}
                        </div>

                        {/* App content */}
                        <div style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>

                            {/* Scan line — AI processing effect */}
                            <div style={{
                                position: 'absolute', left: 0, right: 0,
                                top: `${scanPos}%`,
                                height: '1px',
                                background: 'linear-gradient(90deg, transparent 0%, rgba(224,188,110,0.4) 30%, rgba(224,188,110,0.7) 50%, rgba(224,188,110,0.4) 70%, transparent 100%)',
                                pointerEvents: 'none', zIndex: 5,
                                boxShadow: '0 0 12px rgba(224,188,110,0.25)',
                            }} />

                            {/* Section header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginBottom: '14px',
                            }}>
                                <div style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontSize: '0.8rem', fontWeight: '700',
                                    color: '#8892a4', letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                }}>Requirements</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[
                                        { label: '2 Ambiguous', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
                                        { label: '1 Duplicate', color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
                                        { label: '1 Clean', color: '#4ade80', bg: 'rgba(74,222,128,0.08)' },
                                    ].map((chip, i) => (
                                        <span key={i} style={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: '0.7rem', color: chip.color,
                                            background: chip.bg,
                                            border: `1px solid ${chip.color}28`,
                                            borderRadius: '100px', padding: '3px 10px',
                                        }}>{chip.label}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Requirement rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {MOCK_REQS.map((r, i) => {
                                    const b = BADGE[r.badge];
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: r.delay, duration: 0.5 }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                background: 'rgba(255,255,255,0.024)',
                                                border: `1px solid ${r.badge === 'clean' ? 'rgba(255,255,255,0.05)' : b.border}`,
                                                borderRadius: '10px', padding: '11px 14px',
                                                borderLeft: `3px solid ${b.color}60`,
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {/* ID chip */}
                                            <span style={{
                                                fontFamily: "'DM Mono', monospace",
                                                fontSize: '0.7rem', color: '#555f72',
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                borderRadius: '6px', padding: '2px 7px',
                                                flexShrink: 0,
                                            }}>{r.id}</span>

                                            {/* Text */}
                                            <span style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: '0.8rem', color: '#a0a8b8',
                                                flex: 1, textAlign: 'left',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>{r.text}</span>

                                            {/* Badge */}
                                            <motion.span
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: r.delay + 0.3, type: 'spring', stiffness: 300 }}
                                                style={{
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: '0.68rem', fontWeight: '600',
                                                    color: b.color,
                                                    background: b.bg,
                                                    border: `1px solid ${b.border}`,
                                                    borderRadius: '100px', padding: '3px 10px',
                                                    flexShrink: 0, whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {b.label}
                                                {r.score && <span style={{ opacity: 0.7, marginLeft: '4px' }}>· {r.score}</span>}
                                                {r.match && <span style={{ opacity: 0.7, marginLeft: '4px' }}>· {r.match}</span>}
                                            </motion.span>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Bottom progress bar */}
                            <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    flex: 1, height: '3px', borderRadius: '2px',
                                    background: 'rgba(255,255,255,0.05)',
                                    overflow: 'hidden',
                                }}>
                                    <motion.div
                                        initial={{ width: '0%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ delay: 1.5, duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
                                        style={{
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #c49a3c, #e0bc6e)',
                                            borderRadius: '2px',
                                        }}
                                    />
                                </div>
                                <span style={{
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: '0.68rem', color: '#555f72',
                                    flexShrink: 0,
                                }}>Analysis complete</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                style={{
                    position: 'absolute', bottom: '24px', left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                }}
            >
                <span style={{
                    fontSize: '0.65rem', color: '#555f72',
                    fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.14em',
                }}>SCROLL</span>
                <motion.div
                    animate={{ y: [0, 7, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: '1px', height: '28px', background: 'linear-gradient(to bottom, #555f72, transparent)' }}
                />
            </motion.div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                    h1 { font-size: clamp(2rem, 7vw, 2.8rem) !important; }
                }
            `}</style>
        </section>
    );
}
