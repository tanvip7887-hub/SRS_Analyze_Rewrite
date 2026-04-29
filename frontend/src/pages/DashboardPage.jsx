import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Upload, Clock, Settings, LogOut,
    Plus, X, FolderOpen, Trash2, ChevronRight,
    FileText, Copy, AlertTriangle, Sparkles, Search,
    MoreVertical, ArrowUpRight, Inbox, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import logo from '../assets/Logo.png';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
});

const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// Get latest analysis run stats from a project
const getLatestRunStats = (project) => {
    const runs = project.analysis_runs || [];
    const latest = runs.filter(r => r.status === 'completed')
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
    return {
        total_requirements: latest?.total_requirements || 0,
        duplicate_groups: latest?.duplicate_groups || 0,
        ambiguous_count: latest?.ambiguous_count || 0,
    };
};

// Get active file name
const getActiveFile = (project) => {
    const files = project.srs_files || [];
    return files.find(f => f.is_active)?.file_name || '—';
};

// ─── Status config ─────────────────────────────────────────────────────────
const statusConfig = {
    created: { label: 'Created', color: '#8892a4', bg: 'rgba(136,146,164,0.1)', border: 'rgba(136,146,164,0.2)' },
    uploaded: { label: 'Uploaded', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
    extracting: { label: 'Extracting', color: '#e0bc6e', bg: 'rgba(224,188,110,0.1)', border: 'rgba(224,188,110,0.2)' },
    extracted: { label: 'Extracted', color: '#e0bc6e', bg: 'rgba(224,188,110,0.1)', border: 'rgba(224,188,110,0.2)' },
    analyzing: { label: 'Analyzing', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
    analyzed: { label: 'Analyzed', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
    rewriting: { label: 'Rewriting', color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)' },
    rewritten: { label: 'Rewritten', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
    complete: { label: 'Complete', color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' },
};

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Upload, label: 'New Analysis' },
    { icon: Clock, label: 'History' },
    { icon: Settings, label: 'Settings' },
];

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { projects, fetchProjects, createProject, archiveProject, loading } = useProject();

    const [activeNav, setActiveNav] = useState('Dashboard');
    const [showModal, setShowModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [search, setSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const userOrg = user?.user_metadata?.organization || 'Personal workspace';

    useEffect(() => {
        if (user) fetchProjects(user.id);
    }, [user]);

    // Close user menu on outside click
    useEffect(() => {
        const handler = () => setShowUserMenu(false);
        if (showUserMenu) document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [showUserMenu]);

    const filtered = projects.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        getActiveFile(p).toLowerCase().includes(search.toLowerCase())
    );

    // Aggregate stats across all projects
    const allRuns = projects.flatMap(p => p.analysis_runs || []).filter(r => r.status === 'completed');
    const stats = {
        total: projects.length,
        requirements: allRuns.reduce((a, r) => a + (r.total_requirements || 0), 0),
        duplicates: allRuns.reduce((a, r) => a + (r.duplicate_groups || 0), 0),
        ambiguous: allRuns.reduce((a, r) => a + (r.ambiguous_count || 0), 0),
    };

    const handleNewProject = async (name, description) => {
        if (!user) return;
        const { data, error } = await createProject({ userId: user.id, name, description });
        if (!error && data) {
            setShowModal(false);
            navigate(`/upload?project=${data.id}&name=${encodeURIComponent(name)}`);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await archiveProject(deleteTarget);
        setDeleteTarget(null);
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'morning';
        if (h < 17) return 'afternoon';
        return 'evening';
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#0a0b0f', overflow: 'hidden' }}>

            {/* ══════════════════ SIDEBAR ══════════════════ */}
            <aside style={{
                width: '236px', flexShrink: 0,
                background: '#0d1018',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', flexDirection: 'column',
                padding: '24px 0', position: 'relative', zIndex: 10,
            }}>
                {/* Logo */}
                <div style={{ padding: '0 20px', marginBottom: '36px' }}>
                    <img src={logo} alt="Reqify" style={{ height: '34px' }} />
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, padding: '0 10px' }}>
                    {navItems.map(({ icon: Icon, label }) => {
                        const active = activeNav === label;
                        return (
                            <motion.button key={label}
                                onClick={() => {
                                    setActiveNav(label);
                                    if (label === 'New Analysis') { setShowModal(true); return; }
                                }}
                                whileHover={{ x: active ? 0 : 2 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                                    border: 'none', cursor: 'pointer',
                                    background: active ? 'rgba(224,188,110,0.09)' : 'transparent',
                                    color: active ? '#e0bc6e' : '#555f72',
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '0.875rem', fontWeight: active ? '500' : '400',
                                    transition: 'all 0.2s', marginBottom: '2px',
                                    textAlign: 'left', position: 'relative',
                                }}
                                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#c8d0de'; } }}
                                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555f72'; } }}
                            >
                                {active && <div style={{
                                    position: 'absolute', left: 0, width: '3px', height: '18px',
                                    background: 'linear-gradient(180deg, #e0bc6e, #c49a3c)',
                                    borderRadius: '0 3px 3px 0',
                                }} />}
                                <Icon size={16} />
                                {label}
                                {label === 'New Analysis' && (
                                    <div style={{
                                        marginLeft: 'auto', width: '18px', height: '18px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Plus size={11} color="#0a0b0f" />
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />

                {/* User section */}
                <div style={{ padding: '0 10px', position: 'relative' }}>
                    <button
                        onClick={e => { e.stopPropagation(); setShowUserMenu(v => !v); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            width: '100%', padding: '10px 14px', borderRadius: '10px',
                            border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: "'Syne', sans-serif", fontSize: '0.72rem',
                            fontWeight: '700', color: '#0a0b0f',
                        }}>{getInitials(userName)}</div>
                        <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left' }}>
                            <div style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem',
                                fontWeight: '500', color: '#c8d0de',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{userName}</div>
                            <div style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#555f72',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{userOrg}</div>
                        </div>
                        <MoreVertical size={14} color="#555f72" />
                    </button>

                    <AnimatePresence>
                        {showUserMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'absolute', bottom: 'calc(100% + 8px)',
                                    left: '10px', right: '10px',
                                    background: '#161b26',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '12px', padding: '6px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                    zIndex: 20,
                                }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div style={{
                                    padding: '10px 12px 8px',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    marginBottom: '6px',
                                }}>
                                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#c8d0de', fontWeight: '500' }}>{userName}</div>
                                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#555f72', marginTop: '2px' }}>{user?.email}</div>
                                </div>
                                <button onClick={async () => { await signOut(); navigate('/'); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        width: '100%', padding: '9px 12px', borderRadius: '8px',
                                        border: 'none', background: 'transparent', cursor: 'pointer',
                                        color: '#f87171', fontFamily: "'DM Sans', sans-serif",
                                        fontSize: '0.8125rem', transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <LogOut size={14} /> Sign Out
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            {/* ══════════════════ MAIN ══════════════════ */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: '#0a0b0f' }}>

                {/* Top bar */}
                <div style={{
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', marginBottom: '32px',
                }}>
                    <div>
                        <h1 style={{
                            fontFamily: "'Syne', sans-serif", fontSize: '1.625rem',
                            fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '6px',
                        }}>
                            Good {getGreeting()},{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #f0d898, #e0bc6e)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            }}>{userName.split(' ')[0]}</span> 👋
                        </h1>
                        <p style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
                            color: '#555f72', fontWeight: '300',
                        }}>
                            {projects.length === 0
                                ? "Upload your first SRS document to get started."
                                : `${projects.length} project${projects.length !== 1 ? 's' : ''} in your workspace.`}
                        </p>
                    </div>

                    <motion.button
                        onClick={() => setShowModal(true)}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)',
                            border: 'none', borderRadius: '12px', color: '#0a0b0f',
                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                            fontWeight: '600', padding: '12px 22px', cursor: 'pointer',
                            boxShadow: '0 8px 24px rgba(224,188,110,0.28)',
                            whiteSpace: 'nowrap',
                        }}
                    ><Plus size={16} /> New Analysis</motion.button>
                </div>

                {/* Stat cards */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                    gap: '14px', marginBottom: '36px',
                }} className="dash-stats">
                    {[
                        { icon: FolderOpen, label: 'Total Projects', value: stats.total, color: '#e0bc6e', bg: 'rgba(224,188,110,0.08)' },
                        { icon: FileText, label: 'Requirements Analyzed', value: stats.requirements, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
                        { icon: Copy, label: 'Duplicate Groups', value: stats.duplicates, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
                        { icon: AlertTriangle, label: 'Ambiguous Found', value: stats.ambiguous, color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
                    ].map((s, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            style={{
                                background: '#0d1018',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '14px', padding: '20px',
                            }}
                        >
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: s.bg, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', marginBottom: '14px',
                            }}>
                                <s.icon size={17} color={s.color} />
                            </div>
                            <div style={{
                                fontFamily: "'Syne', sans-serif", fontSize: '1.75rem',
                                fontWeight: '700', color: '#fff', lineHeight: 1, marginBottom: '4px',
                            }}>{s.value.toLocaleString()}</div>
                            <div style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.76rem', color: '#555f72',
                            }}>{s.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Projects header */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: '16px',
                }}>
                    <h2 style={{
                        fontFamily: "'Syne', sans-serif", fontSize: '1rem',
                        fontWeight: '700', color: '#fff', letterSpacing: '-0.02em',
                    }}>Recent Projects</h2>

                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{
                            position: 'absolute', left: '12px', top: '50%',
                            transform: 'translateY(-50%)', color: '#555f72', pointerEvents: 'none',
                        }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search projects..."
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '10px', padding: '9px 14px 9px 34px',
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                                color: '#c8d0de', outline: 'none', width: '210px',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(224,188,110,0.4)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                        />
                    </div>
                </div>

                {/* Loading skeletons */}
                {loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{
                                background: '#0d1018', border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '14px', padding: '22px',
                            }}>
                                {[80, 50, 100].map((w, j) => (
                                    <div key={j} style={{
                                        height: j === 0 ? '14px' : '10px',
                                        width: `${w}%`,
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '6px',
                                        marginBottom: j < 2 ? '10px' : '20px',
                                        animation: 'pulse 1.8s ease infinite',
                                    }} />
                                ))}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[1, 2, 3].map(j => (
                                        <div key={j} style={{ flex: 1, height: '36px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '80px 24px', textAlign: 'center',
                            background: '#0d1018',
                            border: '1px dashed rgba(255,255,255,0.07)',
                            borderRadius: '20px',
                        }}
                    >
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '16px',
                            background: 'rgba(224,188,110,0.07)',
                            border: '1px solid rgba(224,188,110,0.14)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '18px',
                        }}>
                            <Inbox size={26} color="#e0bc6e" />
                        </div>
                        <h3 style={{
                            fontFamily: "'Syne', sans-serif", fontSize: '1.125rem',
                            fontWeight: '700', color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em',
                        }}>
                            {search ? 'No matching projects' : 'No projects yet'}
                        </h3>
                        <p style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
                            color: '#555f72', maxWidth: '300px', lineHeight: 1.6,
                            fontWeight: '300', marginBottom: '24px',
                        }}>
                            {search
                                ? 'Try a different search term.'
                                : 'Upload your first SRS document and let AI do the heavy lifting.'}
                        </p>
                        {!search && (
                            <motion.button onClick={() => setShowModal(true)}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)',
                                    border: 'none', borderRadius: '10px', color: '#0a0b0f',
                                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
                                    fontWeight: '600', padding: '12px 22px', cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(224,188,110,0.25)',
                                }}
                            ><Plus size={15} /> Start First Analysis</motion.button>
                        )}
                    </motion.div>
                )}

                {/* Project cards */}
                {!loading && filtered.length > 0 && (
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                        gap: '14px',
                    }} className="dash-projects">
                        {filtered.map((project, i) => {
                            const sc = statusConfig[project.status] || statusConfig.created;
                            const runS = getLatestRunStats(project);
                            const fname = getActiveFile(project);
                            const runs = project.analysis_runs || [];
                            const hasRun = runs.some(r => r.status === 'completed');

                            return (
                                <motion.div key={project.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ y: -3, borderColor: 'rgba(224,188,110,0.18)' }}
                                    style={{
                                        background: '#0d1018',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '16px', padding: '22px',
                                        transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden',
                                    }}
                                >
                                    {/* Shine line */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
                                        background: 'linear-gradient(90deg, transparent, rgba(224,188,110,0.25), transparent)',
                                    }} />

                                    {/* Header */}
                                    <div style={{
                                        display: 'flex', alignItems: 'flex-start',
                                        justifyContent: 'space-between', gap: '10px', marginBottom: '14px',
                                    }}>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <h3 style={{
                                                fontFamily: "'Syne', sans-serif", fontSize: '0.9375rem',
                                                fontWeight: '700', color: '#fff', letterSpacing: '-0.02em',
                                                marginBottom: '4px',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>{project.name}</h3>
                                            <p style={{
                                                fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#555f72',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>{fname}</p>
                                        </div>
                                        <span style={{
                                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem',
                                            fontWeight: '600', padding: '3px 9px', borderRadius: '6px',
                                            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                                            flexShrink: 0, whiteSpace: 'nowrap',
                                        }}>{sc.label}</span>
                                    </div>

                                    {/* Stats */}
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                                        gap: '8px', marginBottom: '16px',
                                    }}>
                                        {[
                                            { icon: FileText, val: runS.total_requirements, label: 'Reqs', color: '#e0bc6e' },
                                            { icon: Copy, val: runS.duplicate_groups, label: 'Dup Grp', color: '#fbbf24' },
                                            { icon: AlertTriangle, val: runS.ambiguous_count, label: 'Ambig', color: '#f87171' },
                                        ].map((s, j) => (
                                            <div key={j} style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '10px', padding: '10px 8px', textAlign: 'center',
                                            }}>
                                                <s.icon size={11} color={s.color} style={{ marginBottom: '4px' }} />
                                                <div style={{
                                                    fontFamily: "'Syne', sans-serif", fontSize: '1rem',
                                                    fontWeight: '700', color: hasRun ? '#fff' : '#555f72', lineHeight: 1,
                                                }}>{hasRun ? s.val : '—'}</div>
                                                <div style={{
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: '0.6rem', color: '#555f72', marginTop: '2px',
                                                }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Date + run count */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        marginBottom: '14px',
                                    }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.73rem', color: '#555f72',
                                        }}>
                                            <Clock size={11} /> {formatDate(project.created_at)}
                                        </div>
                                        {runs.length > 0 && (
                                            <div style={{
                                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem',
                                                color: '#555f72', display: 'flex', alignItems: 'center', gap: '4px',
                                            }}>
                                                <Users size={10} /> {runs.length} run{runs.length !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <motion.button
                                            onClick={() => navigate(hasRun
                                                ? `/analysis/${project.id}`
                                                : `/upload?project=${project.id}&name=${encodeURIComponent(project.name)}`
                                            )}
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            style={{
                                                flex: 1, display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', gap: '6px',
                                                background: 'rgba(224,188,110,0.08)',
                                                border: '1px solid rgba(224,188,110,0.18)',
                                                borderRadius: '9px', color: '#e0bc6e',
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: '0.8125rem', fontWeight: '500',
                                                padding: '9px', cursor: 'pointer', transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,188,110,0.14)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(224,188,110,0.08)'}
                                        >
                                            <ArrowUpRight size={14} />
                                            {hasRun ? 'Open Analysis' : 'Upload File'}
                                        </motion.button>

                                        <motion.button
                                            onClick={() => setDeleteTarget(project.id)}
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            style={{
                                                width: '36px', height: '36px', flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'rgba(248,113,113,0.06)',
                                                border: '1px solid rgba(248,113,113,0.14)',
                                                borderRadius: '9px', color: '#f87171', cursor: 'pointer',
                                                transition: 'all 0.2s', padding: 0,
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.13)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
                                        >
                                            <Trash2 size={14} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ══════ MODALS ══════ */}
            <AnimatePresence>
                {showModal && <NewProjectModal onClose={() => setShowModal(false)} onConfirm={handleNewProject} />}
                {deleteTarget && <DeleteModal onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
            </AnimatePresence>

            <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 1100px) { .dash-projects { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 900px)  { .dash-stats    { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 640px)  { .dash-projects { grid-template-columns: 1fr !important; } }
      `}</style>
        </div>
    );
}

// ─── New Project Modal ────────────────────────────────────────────────────────
function NewProjectModal({ onClose, onConfirm }) {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError('Project name is required.'); return; }
        setLoading(true);
        await onConfirm(name.trim(), desc.trim());
        setLoading(false);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    position: 'fixed', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)', zIndex: 51,
                    width: '100%', maxWidth: '440px',
                    background: '#0d1018',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px', padding: '32px',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                }}
            >
                <div style={{
                    position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(224,188,110,0.4), transparent)',
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{
                            fontFamily: "'Syne', sans-serif", fontSize: '1.25rem',
                            fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '4px',
                        }}>New Analysis Project</h2>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#555f72', fontWeight: '300' }}>
                            Name your project before uploading
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px', color: '#8892a4', cursor: 'pointer', padding: '7px',
                        display: 'flex', transition: 'all 0.2s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = '#8892a4'}
                    ><X size={15} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#8892a4', display: 'block', marginBottom: '7px', fontWeight: '500' }}>
                            Project Name <span style={{ color: '#f87171' }}>*</span>
                        </label>
                        <input autoFocus value={name}
                            onChange={e => { setName(e.target.value); setError(''); }}
                            placeholder="e.g. Job Portal SRS v2.1"
                            style={{
                                width: '100%', background: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${error ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: '10px', padding: '12px 14px',
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                                color: '#fff', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                            }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(224,188,110,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(224,188,110,0.07)'; }}
                            onBlur={e => { e.target.style.borderColor = error ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                        />
                        {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#f87171', marginTop: '6px' }}>{error}</p>}
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#8892a4', display: 'block', marginBottom: '7px', fontWeight: '500' }}>
                            Description <span style={{ color: '#555f72', fontWeight: '300' }}>(optional)</span>
                        </label>
                        <textarea value={desc} onChange={e => setDesc(e.target.value)}
                            placeholder="Brief description of the SRS document..."
                            rows={3}
                            style={{
                                width: '100%', background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                                padding: '12px 14px', fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.875rem', color: '#fff', outline: 'none',
                                resize: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                            }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(224,188,110,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(224,188,110,0.07)'; }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={{
                            flex: 1, background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                            color: '#8892a4', fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.875rem', padding: '12px', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                        >Cancel</button>

                        <motion.button type="submit" disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.97 }}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)',
                                border: 'none', borderRadius: '10px', color: '#0a0b0f',
                                fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
                                fontWeight: '600', padding: '12px', cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1, boxShadow: '0 4px 20px rgba(224,188,110,0.25)',
                            }}
                        >
                            {loading
                                ? <span style={{ width: '15px', height: '15px', border: '2px solid #0a0b0f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                : <><ChevronRight size={15} /> Continue to Upload</>
                            }
                        </motion.button>
                    </div>
                </form>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </motion.div>
        </>
    );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ onClose, onConfirm }) {
    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.18 }}
                style={{
                    position: 'fixed', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)', zIndex: 51,
                    width: '100%', maxWidth: '380px',
                    background: '#0d1018', border: '1px solid rgba(248,113,113,0.2)',
                    borderRadius: '20px', padding: '28px',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                }}
            >
                <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                }}><Trash2 size={20} color="#f87171" /></div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.125rem', fontWeight: '700', color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em' }}>Delete Project?</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#8892a4', lineHeight: 1.6, fontWeight: '300', marginBottom: '24px' }}>
                    This will permanently archive the project and all its analysis data. This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{
                        flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px', color: '#8892a4', fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.875rem', padding: '11px', cursor: 'pointer',
                    }}>Cancel</button>
                    <button onClick={onConfirm} style={{
                        flex: 1, background: 'linear-gradient(135deg, #f87171, #dc2626)',
                        border: 'none', borderRadius: '10px', color: '#fff',
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
                        fontWeight: '600', padding: '11px', cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(248,113,113,0.25)',
                    }}>Delete Project</button>
                </div>
            </motion.div>
        </>
    );
}
