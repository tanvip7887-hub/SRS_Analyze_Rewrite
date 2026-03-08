import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, CheckCircle } from 'lucide-react';
import Lottie from 'lottie-react';
import lottieAnim from '../../assets/ai paper generator.json';

export default function Hero() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);

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

        // Regular particles
        const particles = Array.from({ length: 40 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.0 + 0.3,
            dx: (Math.random() - 0.5) * 0.22,
            dy: (Math.random() - 0.5) * 0.22,
            o: Math.random() * 0.2 + 0.05,
        }));

        // Shooting stars
        const shootingStars = Array.from({ length: 4 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.5,
            len: Math.random() * 120 + 60,
            speed: Math.random() * 6 + 4,
            opacity: 0,
            active: false,
            delay: Math.random() * 300,
            timer: 0,
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw particles
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(224,188,110,${p.o})`;
                ctx.fill();
                p.x += p.dx; p.y += p.dy;
                if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
            });

            // Draw shooting stars
            shootingStars.forEach(s => {
                s.timer++;
                if (s.timer < s.delay) return;

                if (!s.active) {
                    s.active = true;
                    s.x = Math.random() * canvas.width * 0.7;
                    s.y = Math.random() * canvas.height * 0.4;
                    s.opacity = 1;
                }

                s.x += s.speed;
                s.y += s.speed * 0.5;
                s.opacity -= 0.018;

                if (s.opacity <= 0) {
                    s.active = false;
                    s.timer = 0;
                    s.delay = Math.random() * 400 + 100;
                    s.x = Math.random() * canvas.width * 0.7;
                    s.y = Math.random() * canvas.height * 0.4;
                    s.opacity = 1;
                }

                // Trail
                const grad = ctx.createLinearGradient(
                    s.x, s.y,
                    s.x - s.len, s.y - s.len * 0.5
                );
                grad.addColorStop(0, `rgba(240,216,152,${s.opacity})`);
                grad.addColorStop(1, `rgba(224,188,110,0)`);

                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.len, s.y - s.len * 0.5);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Star head dot
                ctx.beginPath();
                ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,240,180,${s.opacity})`;
                ctx.fill();
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

            {/* Subtle grid */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.007) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.007) 1px, transparent 1px)',
                backgroundSize: '48px 48px', pointerEvents: 'none',
            }} />

            {/* Center radial glow */}
            <div style={{
                position: 'absolute', top: '20%', left: '50%',
                transform: 'translateX(-50%)',
                width: '800px', height: '600px',
                background: 'radial-gradient(ellipse, rgba(224,188,110,0.07) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />

            {/* Content — centered single column */}
            <div style={{
                position: 'relative', zIndex: 2,
                maxWidth: '860px', width: '100%',
                margin: '0 auto', padding: '60px 24px 80px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', textAlign: 'center',
            }}>
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
                        fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
                        fontWeight: '800',
                        lineHeight: 1.08,
                        letterSpacing: '-0.03em',
                        marginBottom: '20px',
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
                        fontSize: '1.12em',
                        filter: 'drop-shadow(0 0 28px rgba(224,188,110,0.3))',
                    }}>Clarified.</span>
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    style={{
                        fontSize: '1rem', color: '#8892a4',
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
                    style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '28px' }}
                >
                    <motion.button
                        onClick={() => navigate('/register')}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            background: 'linear-gradient(135deg, #e0bc6e 0%, #c49a3c 100%)',
                            border: 'none', borderRadius: '12px', color: '#0a0b0f',
                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem',
                            fontWeight: '600', padding: '13px 28px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 18px rgba(224,188,110,0.22)',
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
                            fontWeight: '400', padding: '13px 28px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <div style={{
                            width: '26px', height: '26px',
                            background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)',
                            borderRadius: '50%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Play size={10} fill="#0a0b0f" color="#0a0b0f" />
                        </div>
                        Watch Demo
                    </motion.button>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '56px' }}
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

                {/* Lottie — centered below, floating */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                    {/* Glow behind */}
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%,-50%)',
                        width: '500px', height: '300px',
                        background: 'radial-gradient(ellipse, rgba(224,188,110,0.09) 0%, transparent 70%)',
                        pointerEvents: 'none', filter: 'blur(12px)',
                    }} />

                    {/* Floating wrapper */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ position: 'relative', zIndex: 1 }}
                    >
                        <Lottie
                            animationData={lottieAnim}
                            loop={true}
                            autoplay={true}
                            style={{
                                width: '600px',
                                maxWidth: '90vw',
                                height: 'auto',
                                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.45))',
                            }}
                        />
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                style={{
                    position: 'absolute', bottom: '24px', left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                }}
            >
                <span style={{
                    fontSize: '0.68rem', color: '#555f72',
                    fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.12em',
                }}>SCROLL</span>
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: '1px', height: '26px', background: 'linear-gradient(to bottom, #555f72, transparent)' }}
                />
            </motion.div>
        </section>
    );
}