// ─── StatsBar.jsx ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const useCountUp = (target, duration = 2000, inView) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration, inView]);
    return count;
};

const Stat = ({ value, suffix, label, delay, inView }) => {
    const count = useCountUp(value, 2000, inView);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay, duration: 0.6 }}
            style={{ textAlign: 'center', padding: '0 32px' }}
        >
            <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #e8d5b7 0%, #c9a87c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
            }}>
                {count}{suffix}
            </div>
            <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.875rem',
                color: '#8892a4',
                marginTop: '8px',
                fontWeight: '300',
            }}>{label}</div>
        </motion.div>
    );
};

export function StatsBar() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });

    const stats = [
        { value: 333, suffix: '+', label: 'Requirements Analyzed', delay: 0 },
        { value: 95, suffix: '%', label: 'Detection Accuracy', delay: 0.1 },
        { value: 10, suffix: 'x', label: 'Faster than Manual Review', delay: 0.2 },
        { value: 3, suffix: 'min', label: 'Average Processing Time', delay: 0.3 },
    ];

    return (
        <section ref={ref} style={{
            padding: '64px 24px',
            background: 'rgba(255,255,255,0.015)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '24px',
            }} className="stats-grid">
                {stats.map((s, i) => (
                    <Stat key={i} {...s} inView={inView} />
                ))}
            </div>
            <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 32px !important; }
        }
      `}</style>
        </section>
    );
}


// ─── HowItWorks.jsx ───────────────────────────────────────────────────────────
import { Upload, ScanSearch, FileCheck } from 'lucide-react';

const steps = [
    {
        number: '01',
        icon: <Upload size={28} />,
        title: 'Upload Your SRS',
        desc: 'Drop your .docx SRS document. We support IEEE 830 format and extract all FR and NFR requirements automatically.',
        color: '#c9a87c',
        delay: 0.1,
    },
    {
        number: '02',
        icon: <ScanSearch size={28} />,
        title: 'AI Analyzes It',
        desc: 'Our transformer embedding model detects duplicates via cosine similarity, while spaCy NLP flags ambiguous requirements.',
        color: '#a8845a',
        delay: 0.25,
    },
    {
        number: '03',
        icon: <FileCheck size={28} />,
        title: 'Rewrite & Export',
        desc: 'Accept AI-generated rewrites, review each change, and export a clean, conflict-free SRS document instantly.',
        color: '#e8d5b7',
        delay: 0.4,
    },
];

export function HowItWorks() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <section id="how-it-works" ref={ref} style={{ padding: '112px 24px', background: '#0a0b0f' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    style={{ textAlign: 'center', marginBottom: '80px' }}
                >
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(201,168,124,0.08)',
                        border: '1px solid rgba(201,168,124,0.2)',
                        borderRadius: '100px',
                        padding: '6px 16px',
                        marginBottom: '20px',
                    }}>
                        <span style={{ fontSize: '0.8rem', color: '#c9a87c', fontFamily: "'DM Sans', sans-serif" }}>
                            ✦ How It Works
                        </span>
                    </div>
                    <h2 style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        fontWeight: '800',
                        color: '#fff',
                        letterSpacing: '-0.03em',
                        marginBottom: '16px',
                    }}>
                        From messy docs to clean requirements
                        <span style={{
                            display: 'block',
                            background: 'linear-gradient(135deg, #e8d5b7, #c9a87c)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            in 3 simple steps
                        </span>
                    </h2>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '1rem',
                        color: '#8892a4',
                        maxWidth: '520px',
                        margin: '0 auto',
                        fontWeight: '300',
                    }}>
                        No complex setup. Upload, analyze, and export — all in your browser.
                    </p>
                </motion.div>

                {/* Steps */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '32px',
                    position: 'relative',
                }} className="steps-grid">

                    {/* Connector line */}
                    <div style={{
                        position: 'absolute',
                        top: '52px',
                        left: '25%',
                        right: '25%',
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(201,168,124,0.3), rgba(201,168,124,0.3), transparent)',
                        pointerEvents: 'none',
                    }} className="connector-line" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: step.delay, duration: 0.6 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '20px',
                                padding: '36px 28px',
                                position: 'relative',
                                transition: 'all 0.3s ease',
                            }}
                            whileHover={{
                                borderColor: 'rgba(201,168,124,0.25)',
                                background: 'rgba(201,168,124,0.03)',
                                y: -4,
                            }}
                        >
                            {/* Step number */}
                            <div style={{
                                fontFamily: "'Syne', sans-serif",
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                color: 'rgba(201,168,124,0.4)',
                                letterSpacing: '0.15em',
                                marginBottom: '20px',
                            }}>STEP {step.number}</div>

                            {/* Icon */}
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '14px',
                                background: `rgba(${step.color === '#c9a87c' ? '201,168,124' : step.color === '#a8845a' ? '168,132,90' : '232,213,183'},0.1)`,
                                border: `1px solid rgba(${step.color === '#c9a87c' ? '201,168,124' : step.color === '#a8845a' ? '168,132,90' : '232,213,183'},0.2)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: step.color,
                                marginBottom: '20px',
                            }}>
                                {step.icon}
                            </div>

                            <h3 style={{
                                fontFamily: "'Syne', sans-serif",
                                fontSize: '1.125rem',
                                fontWeight: '700',
                                color: '#fff',
                                marginBottom: '12px',
                                letterSpacing: '-0.02em',
                            }}>{step.title}</h3>

                            <p style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.875rem',
                                color: '#8892a4',
                                lineHeight: 1.7,
                                fontWeight: '300',
                            }}>{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style>{`
        @media (max-width: 768px) {
          .steps-grid { grid-template-columns: 1fr !important; }
          .connector-line { display: none; }
        }
      `}</style>
        </section>
    );
}


// ─── Features.jsx ─────────────────────────────────────────────────────────────
import { Copy, AlertTriangle, Sparkles, Zap, Shield, BarChart2 } from 'lucide-react';

const features = [
    {
        icon: Copy,
        title: 'Duplicate Detection',
        desc: 'Identify duplicate requirements using sentence-transformer embeddings and cosine similarity at 0.85 threshold.',
        grad: 'from #c9a87c to #a8845a',
        c1: '#c9a87c', c2: '#a8845a',
        delay: 0.1,
    },
    {
        icon: AlertTriangle,
        title: 'Ambiguity Detection',
        desc: 'Flag vague words, weak modals, missing measurements, and multi-action requirements with severity scoring.',
        grad: 'from #e8d5b7 to #c9a87c',
        c1: '#e8d5b7', c2: '#c9a87c',
        delay: 0.2,
    },
    {
        icon: Sparkles,
        title: 'AI-Powered Rewriting',
        desc: 'LLM-based rewriting enforces IEEE 830 "The system SHALL" format, making every requirement atomic and testable.',
        grad: 'from #a8845a to #7a6040',
        c1: '#a8845a', c2: '#7a6040',
        delay: 0.3,
    },
    {
        icon: BarChart2,
        title: 'Conflict Analysis',
        desc: 'Detect contradicting requirements and highlight cross-requirement inconsistencies before they cause rework.',
        grad: 'from #c9a87c to #e8d5b7',
        c1: '#c9a87c', c2: '#e8d5b7',
        delay: 0.4,
    },
    {
        icon: Zap,
        title: 'Instant Processing',
        desc: 'Analyze 300+ requirements in under 3 minutes. Upload .docx files and get actionable results immediately.',
        grad: 'from #a8845a to #c9a87c',
        c1: '#a8845a', c2: '#c9a87c',
        delay: 0.5,
    },
    {
        icon: Shield,
        title: 'IEEE 830 Compliance',
        desc: 'Generate standardized SRS documents that follow IEEE 830 guidelines for professional software delivery.',
        grad: 'from #e8d5b7 to #a8845a',
        c1: '#e8d5b7', c2: '#a8845a',
        delay: 0.6,
    },
];

export function Features() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <section id="features" ref={ref} style={{
            padding: '112px 24px',
            background: 'linear-gradient(180deg, #0a0b0f 0%, #0d1018 100%)',
        }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    style={{ textAlign: 'center', marginBottom: '72px' }}
                >
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(201,168,124,0.08)',
                        border: '1px solid rgba(201,168,124,0.2)',
                        borderRadius: '100px',
                        padding: '6px 16px',
                        marginBottom: '20px',
                    }}>
                        <span style={{ fontSize: '0.8rem', color: '#c9a87c', fontFamily: "'DM Sans', sans-serif" }}>
                            ✦ Core Capabilities
                        </span>
                    </div>
                    <h2 style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        fontWeight: '800',
                        color: '#fff',
                        letterSpacing: '-0.03em',
                        marginBottom: '16px',
                    }}>
                        Everything you need to
                        <span style={{
                            display: 'block',
                            background: 'linear-gradient(135deg, #e8d5b7, #c9a87c)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            perfect your requirements
                        </span>
                    </h2>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '1rem',
                        color: '#8892a4',
                        maxWidth: '500px',
                        margin: '0 auto',
                        fontWeight: '300',
                    }}>
                        Powered by transformer embeddings and LLM for unmatched accuracy.
                    </p>
                </motion.div>

                {/* Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '20px',
                }} className="features-grid">
                    {features.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: f.delay, duration: 0.6 }}
                                whileHover={{ y: -5, borderColor: 'rgba(201,168,124,0.25)' }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '20px',
                                    padding: '32px 28px',
                                    cursor: 'default',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Subtle top gradient line */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0,
                                    height: '1px',
                                    background: `linear-gradient(90deg, transparent, ${f.c1}40, transparent)`,
                                }} />

                                {/* Icon */}
                                <div style={{
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '14px',
                                    background: `linear-gradient(135deg, ${f.c1}20, ${f.c2}10)`,
                                    border: `1px solid ${f.c1}30`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: f.c1,
                                    marginBottom: '20px',
                                }}>
                                    <Icon size={24} />
                                </div>

                                <h3 style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontSize: '1.0625rem',
                                    fontWeight: '700',
                                    color: '#fff',
                                    marginBottom: '10px',
                                    letterSpacing: '-0.02em',
                                }}>{f.title}</h3>

                                <p style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '0.875rem',
                                    color: '#8892a4',
                                    lineHeight: 1.7,
                                    fontWeight: '300',
                                }}>{f.desc}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <style>{`
        @media (max-width: 900px) {
          .features-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
        </section>
    );
}


// ─── TechCredibility.jsx ──────────────────────────────────────────────────────
export function TechCredibility() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    const techs = [
        { name: 'all-mpnet-base-v2', label: 'Semantic Embeddings', mono: true, color: '#c9a87c' },
        { name: 'spaCy NLP', label: 'Language Processing', mono: false, color: '#a8845a' },
        { name: 'LLM via LM Studio', label: 'Intelligent Rewriting', mono: false, color: '#e8d5b7' },
        { name: 'Cosine @ 0.85', label: 'Duplicate Threshold', mono: true, color: '#c9a87c' },
    ];

    const powered = ['Python', 'FastAPI', 'React', 'Supabase', 'Sentence Transformers', 'spaCy'];

    return (
        <section id="technology" ref={ref} style={{
            padding: '112px 24px',
            background: '#0a0b0f',
        }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    style={{ textAlign: 'center', marginBottom: '72px' }}
                >
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(201,168,124,0.08)',
                        border: '1px solid rgba(201,168,124,0.2)',
                        borderRadius: '100px',
                        padding: '6px 16px',
                        marginBottom: '20px',
                    }}>
                        <span style={{ fontSize: '0.8rem', color: '#c9a87c', fontFamily: "'DM Sans', sans-serif" }}>
                            ✦ Technology
                        </span>
                    </div>
                    <h2 style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        fontWeight: '800',
                        color: '#fff',
                        letterSpacing: '-0.03em',
                        marginBottom: '16px',
                    }}>
                        Built on cutting-edge
                        <span style={{
                            display: 'block',
                            background: 'linear-gradient(135deg, #e8d5b7, #c9a87c)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>NLP research</span>
                    </h2>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: '#8892a4',
                        maxWidth: '500px',
                        margin: '0 auto',
                        fontWeight: '300',
                    }}>
                        Combining state-of-the-art transformer models with rule-based NLP pipelines for unmatched accuracy.
                    </p>
                </motion.div>

                {/* Tech cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '20px',
                    marginBottom: '64px',
                }} className="tech-grid">
                    {techs.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: i * 0.1 + 0.2 }}
                            style={{
                                background: 'rgba(201,168,124,0.04)',
                                border: '1px solid rgba(201,168,124,0.12)',
                                borderRadius: '16px',
                                padding: '28px 24px',
                                textAlign: 'center',
                            }}
                        >
                            <div style={{
                                fontFamily: t.mono ? "'DM Mono', monospace" : "'Syne', sans-serif",
                                fontSize: t.mono ? '0.875rem' : '1rem',
                                fontWeight: '600',
                                color: t.color,
                                marginBottom: '8px',
                            }}>{t.name}</div>
                            <div style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.8125rem',
                                color: '#555f72',
                            }}>{t.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Powered by strip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.6 }}
                    style={{ textAlign: 'center' }}
                >
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.8125rem',
                        color: '#555f72',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: '24px',
                    }}>Powered by</p>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        {powered.map((p, i) => (
                            <span key={i} style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: '0.8125rem',
                                color: '#8892a4',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '8px',
                                padding: '6px 14px',
                            }}>{p}</span>
                        ))}
                    </div>
                </motion.div>
            </div>

            <style>{`
        @media (max-width: 900px) {
          .tech-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
        </section>
    );
}


// ─── CTABanner.jsx ────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function CTABanner() {
    const navigate = useNavigate();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <section ref={ref} style={{ padding: '80px 24px', background: '#0a0b0f' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                    animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ duration: 0.7 }}
                    style={{
                        position: 'relative',
                        background: 'linear-gradient(135deg, rgba(201,168,124,0.08) 0%, rgba(168,132,90,0.04) 100%)',
                        border: '1px solid rgba(201,168,124,0.2)',
                        borderRadius: '28px',
                        padding: 'clamp(48px, 6vw, 80px) clamp(32px, 6vw, 80px)',
                        textAlign: 'center',
                        overflow: 'hidden',
                    }}
                >
                    {/* Background radial */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,124,0.12) 0%, transparent 60%)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.2 }}
                        >
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(201,168,124,0.1)',
                                border: '1px solid rgba(201,168,124,0.25)',
                                borderRadius: '100px',
                                padding: '6px 16px',
                                marginBottom: '28px',
                            }}>
                                <span style={{ fontSize: '0.8rem', color: '#c9a87c', fontFamily: "'DM Sans', sans-serif" }}>
                                    ✦ Get started for free
                                </span>
                            </div>

                            <h2 style={{
                                fontFamily: "'Syne', sans-serif",
                                fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                                fontWeight: '800',
                                color: '#fff',
                                letterSpacing: '-0.03em',
                                marginBottom: '16px',
                            }}>
                                Ready to ship cleaner
                                <span style={{
                                    display: 'block',
                                    background: 'linear-gradient(135deg, #e8d5b7, #c9a87c)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}>requirements?</span>
                            </h2>

                            <p style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '1rem',
                                color: '#8892a4',
                                maxWidth: '460px',
                                margin: '0 auto 40px',
                                fontWeight: '300',
                                lineHeight: 1.7,
                            }}>
                                Join teams who trust Reqify to catch what humans miss.
                                No credit card required.
                            </p>

                            <motion.button
                                onClick={() => navigate('/register')}
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    background: 'linear-gradient(135deg, #c9a87c 0%, #a8845a 100%)',
                                    border: 'none',
                                    borderRadius: '14px',
                                    color: '#0a0b0f',
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    padding: '16px 36px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 8px 40px rgba(201,168,124,0.35)',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                Start Analyzing Free
                                <ArrowRight size={18} />
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}


// ─── Footer.jsx ───────────────────────────────────────────────────────────────
import logo from '../../assets/Logo.png';

export function Footer() {
    const links = {
        Product: ['Features', 'How It Works', 'Technology', 'Changelog'],
        Resources: ['Documentation', 'API Reference', 'Blog'],
        Company: ['About', 'Contact', 'Privacy Policy', 'Terms'],
    };

    return (
        <footer style={{
            background: '#0a0b0f',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            padding: '64px 24px 32px',
        }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

                {/* Top */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    gap: '48px',
                    marginBottom: '56px',
                }} className="footer-grid">

                    {/* Brand */}
                    <div>
                        <img src={logo} alt="Reqify" style={{ height: '28px', marginBottom: '16px' }} />
                        <p style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.875rem',
                            color: '#555f72',
                            lineHeight: 1.7,
                            fontWeight: '300',
                            maxWidth: '280px',
                        }}>
                            Smarter requirements. Faster delivery.
                            AI-powered SRS analysis for modern software teams.
                        </p>
                    </div>

                    {/* Link columns */}
                    {Object.entries(links).map(([title, items]) => (
                        <div key={title}>
                            <h4 style={{
                                fontFamily: "'Syne', sans-serif",
                                fontSize: '0.8125rem',
                                fontWeight: '700',
                                color: '#c8d0de',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                marginBottom: '16px',
                            }}>{title}</h4>
                            {items.map(item => (
                                <div key={item} style={{ marginBottom: '10px' }}>
                                    <a href="#" style={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: '0.875rem',
                                        color: '#555f72',
                                        fontWeight: '300',
                                        transition: 'color 0.2s ease',
                                        display: 'inline-block',
                                    }}
                                        onMouseEnter={e => e.target.style.color = '#c9a87c'}
                                        onMouseLeave={e => e.target.style.color = '#555f72'}
                                    >{item}</a>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '28px' }} />

                {/* Bottom */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.8125rem',
                        color: '#555f72',
                        fontWeight: '300',
                    }}>
                        © 2025 Reqify. All rights reserved.
                    </p>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.8125rem',
                        color: '#555f72',
                        fontWeight: '300',
                    }}>
                        Built with ♥ for software teams
                    </p>
                </div>
            </div>

            <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
        </footer>
    );
}
