import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, FileText, Copy, AlertTriangle, CheckCircle, Sparkles, X, Layers, Shield, Download, ArrowRight, ArrowLeft, Search, BarChart2, ChevronRight, RotateCcw, Check, GitCompare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.png';

// â”€â”€â”€ Shared helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FLAG_META = {
    vague_verb: { label: 'Vague Verb', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    weak_modal: { label: 'Weak Modal', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    vague_word: { label: 'Vague Word', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
    multiple_actions: { label: 'Multi-Action', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    missing_measurement: { label: 'No Measurement', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    time_expression: { label: 'Time Expression', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    quantity_expression: { label: 'Qty Expression', color: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
    too_short: { label: 'Too Short', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};
const getFlagMeta = f => {
    const k = Object.keys(FLAG_META).find(k => f.startsWith(k));
    return k ? FLAG_META[k] : { label: f, color: '#8892a4', bg: 'rgba(136,146,164,0.1)' };
};
const Chip = ({ flag }) => {
    const m = getFlagMeta(flag);
    const detail = flag.includes(':') ? `: ${flag.split(':')[1]}` : '';
    return <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.72rem', fontWeight: '500', color: m.color, background: m.bg, border: `1px solid ${m.color}25`, borderRadius: '5px', padding: '3px 8px' }}>{m.label}{detail}</span>;
};
const ScoreBar = ({ score, color, label }) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.7rem', color: '#555f72', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', color }}>{Math.round((score || 0) * 100)}%</span>
        </div>
        <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(score || 0) * 100}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} style={{ height: '100%', background: color, borderRadius: '99px' }} />
        </div>
    </div>
);
const ProgressRing = ({ value, max, color, size = 80 }) => {
    const pct = max ? value / max : 0;
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
            <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
                strokeLinecap="round" strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - pct) }}
                transition={{ duration: 1.2, ease: 'easeOut' }} />
        </svg>
    );
};

// â”€â”€â”€ Tab 1: Overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const OverviewTab = ({ reqs, onGoTo }) => {
    const stats = useMemo(() => {
        const dupGroups = new Set(reqs.filter(r => r.is_duplicate && r.duplicate_group).map(r => r.duplicate_group));
        const resolvedGroups = new Set(
            reqs.filter(r => r.is_duplicate && r.review_status === 'removed' && r.duplicate_group).map(r => r.duplicate_group)
        );
        return {
            total: reqs.length,
            ambig: reqs.filter(r => r.is_ambiguous).length,
            dups: reqs.filter(r => r.is_duplicate).length,
            dupGroups: dupGroups.size,
            dupGroupsResolved: resolvedGroups.size,
            clean: reqs.filter(r => !r.is_ambiguous && !r.is_duplicate).length,
            reviewed: reqs.filter(r => r.rewrites?.some(rw => rw.action && rw.action !== 'pending')).length,
        };
    }, [reqs]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
                {[
                    { val: stats.total, label: 'Total Requirements', color: '#e0bc6e', bg: 'rgba(224,188,110,0.08)', icon: FileText },
                    { val: stats.dupGroups, label: 'Duplicate Groups', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', icon: Copy },
                    { val: stats.ambig, label: 'Ambiguous', color: '#f87171', bg: 'rgba(248,113,113,0.08)', icon: AlertTriangle },
                    { val: stats.clean, label: 'Clean', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', icon: Shield },
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        style={{ background: '#0d1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <s.icon size={17} color={s.color} />
                        </div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '2rem', fontWeight: '700', color: '#fff', lineHeight: 1, marginBottom: '5px' }}>{s.val}</div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', color: '#555f72' }}>{s.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Progress panels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Ambiguity */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                    style={{ background: '#0d1018', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '16px', padding: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                        <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.95rem', fontWeight: '700', color: '#fff', marginBottom: '3px' }}>Ambiguity Review</div>
                            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: '#555f72', fontWeight: '300' }}>Accept or reject AI rewrites</div>
                        </div>
                        <ProgressRing value={stats.reviewed} max={stats.ambig} color="#f87171" size={68} />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.74rem', color: '#555f72' }}>Reviewed</span>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.74rem', color: '#f87171' }}>{stats.reviewed} / {stats.ambig}</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.ambig ? stats.reviewed / stats.ambig * 100 : 0}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: '#f87171', borderRadius: '99px' }} />
                        </div>
                    </div>
                    <motion.button onClick={() => onGoTo('ambiguous')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '10px', color: '#f87171', fontFamily: "'DM Sans',sans-serif", fontSize: '0.85rem', fontWeight: '500', padding: '10px', cursor: 'pointer' }}>
                        <Sparkles size={14} /> Review Ambiguous <ArrowRight size={14} />
                    </motion.button>
                </motion.div>

                {/* Duplicates */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
                    style={{ background: '#0d1018', border: '1px solid rgba(251,191,36,0.18)', borderRadius: '16px', padding: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                        <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.95rem', fontWeight: '700', color: '#fff', marginBottom: '3px' }}>Duplicate Resolution</div>
                            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: '#555f72', fontWeight: '300' }}>Pick which to keep</div>
                        </div>
                        <ProgressRing value={stats.dupGroupsResolved} max={stats.dupGroups} color="#fbbf24" size={68} />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.74rem', color: '#555f72' }}>Groups Resolved</span>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.74rem', color: '#fbbf24' }}>{stats.dupGroupsResolved} / {stats.dupGroups}</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.dupGroups ? stats.dupGroupsResolved / stats.dupGroups * 100 : 0}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: '#fbbf24', borderRadius: '99px' }} />
                        </div>
                    </div>
                    <motion.button onClick={() => onGoTo('duplicates')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '10px', color: '#fbbf24', fontFamily: "'DM Sans',sans-serif", fontSize: '0.85rem', fontWeight: '500', padding: '10px', cursor: 'pointer' }}>
                        <Layers size={14} /> Resolve Duplicates <ArrowRight size={14} />
                    </motion.button>
                </motion.div>
            </div>

            {/* Quality bar */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
                style={{ background: '#0d1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '22px' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={15} color="#e0bc6e" /> SRS Quality Breakdown
                </div>
                <div style={{ display: 'flex', height: '10px', borderRadius: '99px', overflow: 'hidden', gap: '2px', marginBottom: '14px' }}>
                    {[
                        { val: stats.clean, color: '#4ade80' },
                        { val: stats.ambig - stats.reviewed, color: '#f87171' },
                        { val: stats.reviewed, color: '#a78bfa' },
                        { val: stats.dups, color: '#fbbf24' },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ flex: 0 }} animate={{ flex: s.val }} transition={{ duration: 1, ease: 'easeOut', delay: 0.6 + i * 0.1 }}
                            style={{ background: s.color, minWidth: s.val > 0 ? '4px' : 0 }} />
                    ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {[
                        { color: '#4ade80', label: 'Clean', val: stats.clean },
                        { color: '#f87171', label: 'Ambiguous (unreviewed)', val: stats.ambig - stats.reviewed },
                        { color: '#a78bfa', label: 'Ambiguous (reviewed)', val: stats.reviewed },
                        { color: '#fbbf24', label: 'Duplicate', val: stats.dups },
                    ].map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', color: '#8892a4' }}>{s.label}</span>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.75rem', color: s.color }}>{s.val}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

// â”€â”€â”€ Tab 2: Duplicates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DuplicatesTab = ({ reqs, onUpdate }) => {
    const groups = useMemo(() => {
        const map = {};
        reqs.filter(r => r.is_duplicate && r.duplicate_group).forEach(r => {
            if (!map[r.duplicate_group]) map[r.duplicate_group] = [];
            map[r.duplicate_group].push(r);
        });
        return Object.entries(map).map(([num, members]) => ({ num: parseInt(num), members }));
    }, [reqs]);

    const [saving, setSaving] = useState(null);

    const resolved = groups.filter(g => g.members.some(m => m.review_status === 'removed')).length;

    const keepThis = async (keepReq, removeReqs) => {
        setSaving(keepReq.id);
        await Promise.all(removeReqs.map(r => supabase.from('requirements').update({ review_status: 'removed' }).eq('id', r.id)));
        await supabase.from('requirements').update({ review_status: 'kept' }).eq('id', keepReq.id);
        removeReqs.forEach(r => onUpdate(r.id, { review_status: 'removed' }));
        onUpdate(keepReq.id, { review_status: 'kept' });
        setSaving(null);
    };

    const undoGroup = async (group) => {
        await Promise.all(group.members.map(r => supabase.from('requirements').update({ review_status: null }).eq('id', r.id)));
        group.members.forEach(r => onUpdate(r.id, { review_status: null }));
    };

    if (!groups.length) return (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Shield size={32} color="#4ade80" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontFamily: "'Syne',sans-serif", color: '#4ade80', fontSize: '1rem', fontWeight: '600' }}>No duplicates found</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.82rem', color: '#555f72' }}>
                    <span style={{ color: '#fbbf24', fontWeight: '600' }}>{resolved}</span> of <span style={{ color: '#fff' }}>{groups.length}</span> groups resolved
                </span>
            </div>

            {groups.map((group, gi) => {
                const isResolved = group.members.some(m => m.review_status === 'removed');
                return (
                    <motion.div key={group.num} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.04 }}
                        style={{ background: '#0d1018', border: `1px solid ${isResolved ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.15)'}`, borderRadius: '16px', overflow: 'hidden' }}>

                        {/* Group header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isResolved ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)', border: `1px solid ${isResolved ? 'rgba(74,222,128,0.25)' : 'rgba(251,191,36,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {isResolved ? <CheckCircle size={13} color="#4ade80" /> : <Layers size={13} color="#fbbf24" />}
                                </div>
                                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.875rem', fontWeight: '700', color: '#fff' }}>Group #{group.num}</span>
                                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', color: '#555f72' }}>{group.members.length} requirements</span>
                                {isResolved && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.7rem', color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '5px', padding: '2px 8px' }}>Resolved</span>}
                            </div>
                            {isResolved && (
                                <button onClick={() => undoGroup(group)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: '#555f72', fontFamily: "'DM Sans',sans-serif", fontSize: '0.72rem', padding: '5px 10px', cursor: 'pointer' }}>
                                    <RotateCcw size={11} /> Undo
                                </button>
                            )}
                        </div>

                        {/* Side by side */}
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(group.members.length, 2)},1fr)`, gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
                            {group.members.map((req) => {
                                const typeColor = req.req_type === 'FR' ? '#e0bc6e' : '#60a5fa';
                                const isKept = req.review_status === 'kept';
                                const isRemoved = req.review_status === 'removed';
                                const isSaving = saving === req.id;
                                return (
                                    <div key={req.id} style={{ background: isKept ? 'rgba(74,222,128,0.04)' : isRemoved ? 'rgba(248,113,113,0.03)' : '#0d1018', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', opacity: isRemoved ? 0.5 : 1, transition: 'all 0.3s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', color: typeColor, background: `${typeColor}12`, border: `1px solid ${typeColor}25`, borderRadius: '5px', padding: '2px 8px', fontWeight: '700' }}>{req.req_id}</span>
                                            {isKept && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.68rem', color: '#4ade80', background: 'rgba(74,222,128,0.1)', borderRadius: '4px', padding: '2px 7px' }}>âœ“ Kept</span>}
                                            {isRemoved && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.68rem', color: '#f87171', background: 'rgba(248,113,113,0.1)', borderRadius: '4px', padding: '2px 7px' }}>âœ• Removed</span>}
                                            {req.similarity_score && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', color: '#fbbf24', marginLeft: 'auto' }}>{Math.round(req.similarity_score * 100)}% similar</span>}
                                        </div>
                                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.855rem', color: isRemoved ? '#555f72' : '#c8d0de', lineHeight: 1.65, margin: 0, fontWeight: '300', textDecoration: isRemoved ? 'line-through' : 'none' }}>
                                            {req.original_text}
                                        </p>
                                        {!isResolved && (
                                            <motion.button onClick={() => keepThis(req, group.members.filter(m => m.id !== req.id))} disabled={!!saving}
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.22)', borderRadius: '9px', color: '#4ade80', fontFamily: "'DM Sans',sans-serif", fontSize: '0.8rem', fontWeight: '500', padding: '9px', cursor: 'pointer', opacity: saving && !isSaving ? 0.5 : 1 }}>
                                                {isSaving ? 'Saving...' : <><Check size={13} /> Keep This One</>}
                                            </motion.button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

// â”€â”€â”€ Tab 3: Ambiguous â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AmbiguousTab = ({ reqs, onUpdate }) => {
    const ambiguous = useMemo(() =>
        reqs.filter(r => r.is_ambiguous).sort((a, b) => (b.ambiguity_score || 0) - (a.ambiguity_score || 0)),
        [reqs]
    );
    const [idx, setIdx] = useState(0);
    const [edited, setEdited] = useState('');
    const [saving, setSaving] = useState(false);
    const [allDone, setAllDone] = useState(false);

    const current = ambiguous[idx];
    const rw = current?.rewrites?.[0];
    const decided = rw?.action && rw.action !== 'pending';
    const reviewed = ambiguous.filter(r => r.rewrites?.some(rw => rw.action && rw.action !== 'pending')).length;

    useEffect(() => { if (current) setEdited(rw?.ai_rewritten_text || ''); }, [idx, current?.id]);

    const handle = async (action) => {
        if (!rw || !current) return;
        setSaving(true);
        const finalText = action === 'rejected' ? current.original_text : action === 'edited' ? edited : rw.ai_rewritten_text;
        await supabase.from('rewrites').update({ action, final_text: finalText, decided_at: new Date().toISOString() }).eq('id', rw.id);
        if (action !== 'rejected') await supabase.from('requirements').update({ current_text: finalText, review_status: action }).eq('id', current.id);
        onUpdate(current.id, {
            review_status: action,
            current_text: action !== 'rejected' ? finalText : current.current_text,
            rewrites: current.rewrites.map(r2 => r2.id === rw.id ? { ...r2, action, final_text: finalText } : r2),
        });
        setSaving(false);
        if (idx < ambiguous.length - 1) setTimeout(() => setIdx(i => i + 1), 300);
        else setAllDone(true);
    };

    if (!ambiguous.length) return (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Shield size={32} color="#4ade80" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontFamily: "'Syne',sans-serif", color: '#4ade80', fontSize: '1rem', fontWeight: '600' }}>No ambiguous requirements</p>
        </div>
    );

    if (allDone || idx >= ambiguous.length) return (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '64px 0' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={32} color="#4ade80" />
            </motion.div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.3rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>All Reviewed!</h3>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', color: '#555f72', fontWeight: '300', marginBottom: '24px' }}>{reviewed} of {ambiguous.length} reviewed</p>
            <button onClick={() => { setIdx(0); setAllDone(false); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#8892a4', fontFamily: "'DM Sans',sans-serif", fontSize: '0.85rem', padding: '10px 18px', cursor: 'pointer' }}>
                <RotateCcw size={13} /> Review Again
            </button>
        </motion.div>
    );

    const typeColor = current.req_type === 'FR' ? '#e0bc6e' : '#60a5fa';
    const flags = current.ambiguity_flags || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${(idx + 1) / ambiguous.length * 100}%` }} transition={{ duration: 0.35 }}
                        style={{ height: '100%', background: 'linear-gradient(90deg,#f87171,#a78bfa)', borderRadius: '99px' }} />
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.75rem', color: '#555f72', flexShrink: 0 }}>{idx + 1} / {ambiguous.length}</span>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={current.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                    style={{ background: '#0d1018', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', overflow: 'hidden' }}>

                    {/* Card header */}
                    <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.8rem', color: typeColor, background: `${typeColor}12`, border: `1px solid ${typeColor}25`, borderRadius: '6px', padding: '3px 10px', fontWeight: '700' }}>{current.req_id}</span>
                        {decided && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.7rem', color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '5px', padding: '2px 8px' }}>âœ“ Reviewed</span>}
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.72rem', color: '#555f72' }}>Score</span>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.8rem', color: '#f87171', fontWeight: '700' }}>{Math.round((current.ambiguity_score || 0) * 100)}%</span>
                        </div>
                    </div>

                    <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Original */}
                        <div>
                            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.68rem', color: '#555f72', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '9px' }}>Original Requirement</div>
                            <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '12px', padding: '15px' }}>
                                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.7, margin: 0, fontWeight: '300' }}>{current.original_text}</p>
                            </div>
                        </div>

                        {/* Flags */}
                        {flags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.7rem', color: '#555f72', marginRight: '2px' }}>Issues:</span>
                                {flags.map((f, i) => <Chip key={i} flag={f} />)}
                            </div>
                        )}

                        {rw ? (
                            <>
                                {/* AI rewrite */}
                                <div>
                                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.68rem', color: '#555f72', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '9px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Sparkles size={11} color="#a78bfa" /> AI Rewritten
                                    </div>
                                    <div style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: '12px', padding: '15px' }}>
                                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.7, margin: 0, fontWeight: '300' }}>{rw.ai_rewritten_text}</p>
                                    </div>
                                </div>

                                {/* Edit */}
                                {!decided && (
                                    <div>
                                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.68rem', color: '#555f72', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '9px' }}>Edit Before Accepting</div>
                                        <textarea value={edited} onChange={e => setEdited(e.target.value)} rows={3}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '11px', color: '#c8d0de', fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', lineHeight: 1.65, padding: '13px 15px', resize: 'vertical', outline: 'none', fontWeight: '300', boxSizing: 'border-box' }}
                                            onFocus={e => e.target.style.borderColor = 'rgba(224,188,110,0.3)'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                                    </div>
                                )}

                                {/* Actions */}
                                {!decided ? (
                                    <div style={{ display: 'flex', gap: '9px' }}>
                                        <motion.button onClick={() => handle('accepted')} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.28)', borderRadius: '11px', color: '#4ade80', fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', fontWeight: '500', padding: '12px', cursor: 'pointer' }}>
                                            <CheckCircle size={15} /> Accept
                                        </motion.button>
                                        <motion.button onClick={() => handle('edited')} disabled={saving || edited === rw.ai_rewritten_text} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: 'rgba(224,188,110,0.1)', border: '1px solid rgba(224,188,110,0.28)', borderRadius: '11px', color: '#e0bc6e', fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', fontWeight: '500', padding: '12px', cursor: 'pointer', opacity: edited === rw.ai_rewritten_text ? 0.4 : 1 }}>
                                            <Sparkles size={15} /> Accept Edited
                                        </motion.button>
                                        <motion.button onClick={() => handle('rejected')} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)', borderRadius: '11px', color: '#f87171', fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', fontWeight: '500', padding: '12px 16px', cursor: 'pointer' }}>
                                            <X size={15} /> Reject
                                        </motion.button>
                                        <button onClick={() => setIdx(i => i + 1)} disabled={idx >= ambiguous.length - 1}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '11px', color: '#555f72', padding: '12px 13px', cursor: 'pointer', opacity: idx >= ambiguous.length - 1 ? 0.3 : 1 }}>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '9px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: '11px', padding: '11px 15px' }}>
                                            <CheckCircle size={15} color="#4ade80" />
                                            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', color: '#4ade80' }}>
                                                {rw.action === 'accepted' ? 'Accepted' : rw.action === 'edited' ? 'Accepted with edits' : 'Rejected â€” keeping original'}
                                            </span>
                                        </div>
                                        <button onClick={() => setIdx(i => i + 1)} disabled={idx >= ambiguous.length - 1}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '11px', color: '#8892a4', fontFamily: "'DM Sans',sans-serif", fontSize: '0.85rem', fontWeight: '500', padding: '11px 16px', cursor: 'pointer', opacity: idx >= ambiguous.length - 1 ? 0.3 : 1 }}>
                                            Next <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', textAlign: 'center' }}>
                                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.85rem', color: '#555f72', fontWeight: '300', margin: 0 }}>No AI rewrite available for this requirement</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Prev / dot nav / next */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: '#555f72', fontFamily: "'DM Sans',sans-serif", fontSize: '0.8rem', padding: '8px 14px', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}>
                    <ArrowLeft size={14} /> Previous
                </button>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {ambiguous.slice(Math.max(0, idx - 4), idx + 5).map((r, i) => {
                        const ai = Math.max(0, idx - 4) + i;
                        const isRev = r.rewrites?.some(rw => rw.action && rw.action !== 'pending');
                        return <button key={r.id} onClick={() => setIdx(ai)} style={{ width: '8px', height: '8px', borderRadius: '50%', background: ai === idx ? '#e0bc6e' : isRev ? '#4ade80' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />;
                    })}
                </div>
                <button onClick={() => setIdx(i => Math.min(ambiguous.length - 1, i + 1))} disabled={idx >= ambiguous.length - 1}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: '#555f72', fontFamily: "'DM Sans',sans-serif", fontSize: '0.8rem', padding: '8px 14px', cursor: idx >= ambiguous.length - 1 ? 'not-allowed' : 'pointer', opacity: idx >= ambiguous.length - 1 ? 0.3 : 1 }}>
                    Next <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

// â”€â”€â”€ Tab 4: Clean â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CleanTab = ({ reqs }) => {
    const clean = useMemo(() => reqs.filter(r => !r.is_ambiguous && !r.is_duplicate), [reqs]);
    const [search, setSearch] = useState('');
    const filtered = useMemo(() => {
        if (!search.trim()) return clean;
        const q = search.toLowerCase();
        return clean.filter(r => r.req_id.toLowerCase().includes(q) || (r.current_text || r.original_text || '').toLowerCase().includes(q));
    }, [clean, search]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={13} color="#555f72" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clean requirements..."
                        style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', color: '#c8d0de', fontFamily: "'DM Sans',sans-serif", fontSize: '0.82rem', padding: '9px 12px 9px 30px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.3)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.75rem', color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', padding: '6px 11px', flexShrink: 0 }}>{filtered.length}</span>
            </div>
            {filtered.map((req, i) => {
                const typeColor = req.req_type === 'FR' ? '#e0bc6e' : req.req_type === 'NFR' ? '#60a5fa' : '#a78bfa';
                return (
                    <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.012, 0.4) }}
                        style={{ background: '#0d1018', border: '1px solid rgba(74,222,128,0.07)', borderRadius: '11px', padding: '13px 18px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', color: typeColor, background: `${typeColor}12`, border: `1px solid ${typeColor}25`, borderRadius: '5px', padding: '2px 8px', fontWeight: '700', flexShrink: 0, marginTop: '2px' }}>{req.req_id}</span>
                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.85rem', color: '#8892a4', lineHeight: 1.6, margin: 0, fontWeight: '300' }}>{req.current_text || req.original_text}</p>
                        <Shield size={13} color="rgba(74,222,128,0.3)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    </motion.div>
                );
            })}
            {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0' }}><p style={{ fontFamily: "'DM Sans',sans-serif", color: '#3a4252', fontSize: '0.85rem', fontWeight: '300' }}>No requirements match</p></div>}
        </div>
    );
};

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// ─── Tab 5: Comparison ───────────────────────────────────────────────────────



// ─── Tab 5: Insights ─────────────────────────────────────────────────────────
const AnalyticsTab = ({ reqs }) => {
    const stats = useMemo(() => {
        const total = reqs.length;
        const ambig = reqs.filter(r => r.is_ambiguous);
        const dups  = reqs.filter(r => r.is_duplicate);
        const clean = reqs.filter(r => !r.is_ambiguous && !r.is_duplicate);

        // Type breakdown
        const typeMap = {};
        reqs.forEach(r => { typeMap[r.req_type || 'OTHER'] = (typeMap[r.req_type || 'OTHER'] || 0) + 1; });
        const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

        // Donut data
        const donutData = [
            { name: 'Clean',     value: clean.length,  color: '#4ade80' },
            { name: 'Ambiguous', value: ambig.length,  color: '#f87171' },
            { name: 'Duplicate', value: dups.length,   color: '#fbbf24' },
        ].filter(d => d.value > 0);

        // Issue frequency
        const issueMap = {};
        ambig.forEach(r => {
            (r.ambiguity_flags || []).forEach(f => {
                const key = f.includes(':') ? f.split(':')[0].trim() : f;
                issueMap[key] = (issueMap[key] || 0) + 1;
            });
        });
        const issueData = Object.entries(issueMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        // Score histogram
        const buckets = [0,0,0,0,0,0,0,0,0,0];
        reqs.forEach(r => {
            const s = r.ambiguity_score || 0;
            const i = Math.min(Math.floor(s * 10), 9);
            buckets[i]++;
        });
        const histData = buckets.map((count, i) => ({
            range: (i * 10) + '-' + ((i + 1) * 10) + '%',
            count,
        }));

        // Top 10 most ambiguous
        const top10 = [...ambig]
            .sort((a, b) => (b.ambiguity_score || 0) - (a.ambiguity_score || 0))
            .slice(0, 10)
            .map(r => ({
                id: r.req_id,
                score: Math.round((r.ambiguity_score || 0) * 100),
                text: (r.original_text || '').slice(0, 60) + '...',
            }));

        return { total, ambig: ambig.length, dups: dups.length, clean: clean.length, typeData, donutData, issueData, histData, top10 };
    }, [reqs]);

    const card = (extra = {}) => ({
        background: '#0d1018',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '20px',
        ...extra,
    });

    const sectionTitle = (title, subtitle, icon) => (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.9rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                <span style={{ fontSize: '0.9rem' }}>{icon}</span> {title}
            </div>
            {subtitle && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.72rem', color: '#555f72', fontWeight: '300' }}>{subtitle}</div>}
        </div>
    );

    // Simple custom donut using SVG
    const DonutChart = ({ data, size = 160 }) => {
        const total = data.reduce((s, d) => s + d.value, 0);
        let cumulative = 0;
        const cx = size / 2, cy = size / 2, r = size * 0.38, inner = size * 0.25;
        const slices = data.map(d => {
            const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
            cumulative += d.value;
            const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
            const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
            const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle);
            const ix1 = cx + inner * Math.cos(startAngle), iy1 = cy + inner * Math.sin(startAngle);
            const ix2 = cx + inner * Math.cos(endAngle),   iy2 = cy + inner * Math.sin(endAngle);
            const large = endAngle - startAngle > Math.PI ? 1 : 0;
            return { ...d, path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z` };
        });
        return (
            <svg width={size} height={size}>
                {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.9} />)}
                <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize={size * 0.14} fontFamily="Syne,sans-serif" fontWeight="700">{stats.total}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="#555f72" fontSize={size * 0.08} fontFamily="DM Sans,sans-serif">total</text>
            </svg>
        );
    };

    // Bar chart using divs
    const BarChart = ({ data, valueKey, labelKey, color, maxWidth = '100%' }) => {
        const max = Math.max(...data.map(d => d[valueKey]), 1);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.68rem', color: '#555f72', width: '80px', flexShrink: 0, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d[labelKey]}</span>
                        <div style={{ flex: 1, height: '22px', background: 'rgba(255,255,255,0.04)', borderRadius: '5px', overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: (d[valueKey] / max * 100) + '%' }}
                                transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                                style={{ height: '100%', background: color, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '6px' }}
                            >
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', color: '#000', fontWeight: '700' }}>{d[valueKey]}</span>
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };



    // Quality score 0-100
    const qualityScore = stats.total > 0 ? Math.round(stats.clean / stats.total * 100) : 0;
    const scoreColor = qualityScore >= 80 ? '#4ade80' : qualityScore >= 60 ? '#fbbf24' : '#f87171';
    const scoreLabel = qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Needs Work' : 'Critical';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Row 1 — Quality gauge + KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '14px' }}>

                {/* Quality Score Gauge */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    style={{ ...card(), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {(() => {
                        const size = 130, cx = 65, cy = 70, r = 52;
                        const circ = Math.PI * r; // half circle
                        const dash = circ * (qualityScore / 100);
                        return (
                            <svg width={size} height={80} style={{ overflow: 'visible' }}>
                                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                                    fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} strokeLinecap="round" />
                                <motion.path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                                    fill="none" stroke={scoreColor} strokeWidth={10} strokeLinecap="round"
                                    strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
                                    animate={{ strokeDashoffset: circ - dash }}
                                    transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }} />
                                <text x={cx} y={cy - 4} textAnchor="middle" fill="#fff"
                                    fontSize="22" fontFamily="Syne,sans-serif" fontWeight="700">{qualityScore}</text>
                                <text x={cx} y={cy + 13} textAnchor="middle" fill={scoreColor}
                                    fontSize="9" fontFamily="DM Sans,sans-serif">{scoreLabel}</text>
                            </svg>
                        );
                    })()}
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.7rem', color: '#555f72', textAlign: 'center' }}>SRS Quality Score</div>
                </motion.div>

                {/* KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                    {[
                        { val: stats.total, label: 'Total Requirements', color: '#e0bc6e', icon: '📄', sub: '100% of document' },
                        { val: stats.clean, label: 'Verified / Clean', color: '#4ade80', icon: '✅', sub: `${stats.total > 0 ? Math.round(stats.clean/stats.total*100) : 0}% of total` },
                        { val: stats.ambig, label: 'Issues Flagged', color: '#f87171', icon: '⚠️', sub: `${stats.total > 0 ? Math.round(stats.ambig/stats.total*100) : 0}% of total` },
                        { val: stats.dups, label: 'Duplicate Groups', color: '#fbbf24', icon: '🔁', sub: 'Needs conflict resolution' },
                        { val: reqs.filter(r => r.rewrites?.some(w => w.action && w.action !== 'pending')).length, label: 'Reviewed', color: '#a78bfa', icon: '👁', sub: 'Human reviewed' },
                        { val: stats.ambig > 0 ? Math.round((stats.ambig - reqs.filter(r => r.rewrites?.some(w => w.action && w.action !== 'pending')).length) / stats.ambig * 100) + '%' : '—', label: 'Pending Review', color: '#60a5fa', icon: '⏳', sub: 'Awaiting action' },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                            style={card({ padding: '14px 16px' })}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.4rem', fontWeight: '700', color: s.color, lineHeight: 1 }}>{s.val}</div>
                            </div>
                            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.72rem', color: '#c8d0de', fontWeight: '500', marginBottom: '2px' }}>{s.label}</div>
                            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.65rem', color: '#3a4252' }}>{s.sub}</div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Requirement Ambiguity Heatmap */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={card()}>
                {sectionTitle('Requirement Risk Heatmap', 'Each cell = one requirement, color = ambiguity severity', '🗺️')}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                    {reqs.map((r, i) => {
                        const score = r.ambiguity_score || 0;
                        const color = r.is_ambiguous
                            ? score > 0.8 ? '#f87171' : score > 0.6 ? '#fb923c' : score > 0.4 ? '#fbbf24' : '#facc15'
                            : r.is_duplicate ? '#60a5fa' : '#4ade80';
                        const opacity = r.is_ambiguous ? 0.5 + score * 0.5 : 0.5;
                        return (
                            <div key={i} title={`${r.req_id}: ${Math.round(score * 100)}%`}
                                style={{ width: '16px', height: '16px', borderRadius: '3px', background: color, opacity, cursor: 'default', transition: 'opacity 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={e => e.currentTarget.style.opacity = String(opacity)} />
                        );
                    })}
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {[
                        { color: '#4ade80', label: 'Verified' },
                        { color: '#60a5fa', label: 'Duplicate' },
                        { color: '#facc15', label: 'Low Risk' },
                        { color: '#fbbf24', label: 'Medium Risk' },
                        { color: '#fb923c', label: 'High Risk' },
                        { color: '#f87171', label: 'Critical' },
                    ].map((l, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: l.color }} />
                            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.7rem', color: '#8892a4' }}>{l.label}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Row 2 — Donut + Type Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

                {/* Donut */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={card()}>
                    {sectionTitle('SRS Composition', 'Overall quality breakdown', '🍩')}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <DonutChart data={stats.donutData} size={150} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {stats.donutData.map((d, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: '#8892a4' }}>{d.name}</span>
                                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.78rem', color: d.color, marginLeft: 'auto' }}>{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Type breakdown */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} style={card()}>
                    {sectionTitle('Requirement Types', 'Distribution by category', '📋')}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {stats.typeData.map((d, i) => {
                            const colors = ['#e0bc6e','#60a5fa','#a78bfa','#34d399','#fb923c'];
                            const pct = Math.round(d.value / stats.total * 100);
                            return (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', color: colors[i % colors.length], fontWeight: '700' }}>{d.name}</span>
                                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', color: '#555f72' }}>{d.value} ({pct}%)</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={{ duration: 0.9, delay: 0.4 + i * 0.08, ease: 'easeOut' }}
                                            style={{ height: '100%', background: colors[i % colors.length], borderRadius: '99px' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Row 3 — Issue frequency + Score histogram */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

                {/* Issue frequency */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={card()}>
                    {sectionTitle('Issue Type Frequency', 'What kinds of ambiguity were found', '🔍')}
                    {stats.issueData.length > 0
                        ? <BarChart data={stats.issueData} valueKey="count" labelKey="name" color="linear-gradient(90deg,#f87171,#fb923c)" />
                        : <p style={{ fontFamily: "'DM Sans',sans-serif", color: '#3a4252', fontSize: '0.82rem', textAlign: 'center', padding: '20px 0' }}>No issues detected</p>
                    }
                </motion.div>

                {/* Score histogram */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }} style={card()}>
                    {sectionTitle('Ambiguity Score Distribution', 'How many requirements fall in each score range', '📊')}
                    <BarChart data={stats.histData} valueKey="count" labelKey="range" color="linear-gradient(90deg,#a78bfa,#60a5fa)" />
                </motion.div>
            </div>

            {/* Row 4 — Top 10 most ambiguous */}
            {stats.top10.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }} style={card()}>
                    {sectionTitle('Top 10 Most Ambiguous Requirements', 'Sorted by SVM confidence score', '🔴')}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {stats.top10.map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.1)', borderRadius: '10px' }}>
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', color: '#555f72', width: '18px', flexShrink: 0 }}>#{i + 1}</span>
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', color: '#e0bc6e', background: 'rgba(224,188,110,0.1)', border: '1px solid rgba(224,188,110,0.2)', borderRadius: '4px', padding: '2px 7px', flexShrink: 0 }}>{r.id}</span>
                                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.8rem', color: '#8892a4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '300' }}>{r.text}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    <div style={{ width: '60px', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{ width: r.score + '%', height: '100%', background: r.score > 80 ? '#f87171' : r.score > 60 ? '#fb923c' : '#fbbf24', borderRadius: '99px' }} />
                                    </div>
                                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', color: r.score > 80 ? '#f87171' : r.score > 60 ? '#fb923c' : '#fbbf24', fontWeight: '700' }}>{r.score}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

// ── Tab 6: Intelligence ───────────────────────────────────────────────────────
const ComparisonTab = () => {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [filter, setFilter]   = useState('all');
    const [search, setSearch]   = useState('');

    const run = async () => {
        setLoading(true); setError('');
        try {
            const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            const res  = await fetch(base + '/process-ml', { method: 'POST' });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setData(json.comparison);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    const rows = useMemo(() => {
        if (!data) return [];
        let entries = Object.entries(data).map(([id, v]) => ({ id, ...v }));
        if (filter === 'agree')     entries = entries.filter(r => r.agreement);
        if (filter === 'disagree')  entries = entries.filter(r => !r.agreement);
        if (filter === 'rule_only') entries = entries.filter(r => r.rule_ambiguous && !r.svm_ambiguous);
        if (filter === 'svm_only')  entries = entries.filter(r => !r.rule_ambiguous && r.svm_ambiguous);
        if (search.trim()) {
            const q = search.toLowerCase();
            entries = entries.filter(r => r.id.toLowerCase().includes(q) || r.text.toLowerCase().includes(q));
        }
        return entries;
    }, [data, filter, search]);

    const metrics = useMemo(() => {
        if (!data) return null;
        const all       = Object.values(data);
        const total     = all.length;
        const agree     = all.filter(r => r.agreement).length;
        const disagree  = all.filter(r => !r.agreement).length;
        const aOnly    = all.filter(r => r.model_a?.ambiguous && !r.model_b?.ambiguous).length;
        const bOnly    = all.filter(r => !r.model_a?.ambiguous && r.model_b?.ambiguous).length;
        const both      = all.filter(r => r.model_a?.ambiguous && r.model_b?.ambiguous).length;
        const neitherA  = all.filter(r => !r.model_a?.ambiguous && !r.model_b?.ambiguous).length;
        const tp = both, tn = neitherA, fp = aOnly, fn = bOnly;
        const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
        const recall    = tp + fn > 0 ? tp / (tp + fn) : 0;
        const f1        = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
        const accuracy  = total > 0 ? (tp + tn) / total : 0;
        const aBuckets = Array(10).fill(0);
        const bBuckets = Array(10).fill(0);
        all.forEach(r => {
            aBuckets[Math.min(Math.floor((r.model_a?.score || 0) * 10), 9)]++;
            bBuckets[Math.min(Math.floor((r.model_b?.score || 0) * 10), 9)]++;
        });
        const histData = aBuckets.map((rc, i) => ({ range: (i*10)+'-'+((i+1)*10), rule: rc, svm: bBuckets[i] }));
        return { total, agree, disagree, ruleOnly: aOnly, svmOnly: bOnly, both, neitherA, tp, tn, fp, fn, precision, recall, f1, accuracy, histData };
    }, [data]);

    if (!data) return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:'20px' }}>
            <div style={{ width:'64px', height:'64px', borderRadius:'16px', background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <GitCompare size={28} color="#a78bfa" />
            </div>
            <div style={{ textAlign:'center' }}>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.1rem', fontWeight:'700', color:'#fff', marginBottom:'6px' }}>Detector Intelligence</h3>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.85rem', color:'#555f72', fontWeight:'300', maxWidth:'400px', lineHeight:1.6 }}>
                    Run a side-by-side comparison of <span style={{ color:'#fbbf24' }}>Detector A — SVM + MiniLM</span> vs <span style={{ color:'#a78bfa' }}>Detector B — DeBERTa NLI</span>. Identify where models agree, conflict, and get full precision/recall metrics to evaluate detection quality.
                </p>
            </div>
            {error && <p style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.78rem', color:'#f87171' }}>{error}</p>}
            <motion.button onClick={run} disabled={loading} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                style={{ display:'flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,#a78bfa,#7c3aed)', border:'none', borderRadius:'10px', color:'#fff', fontFamily:"'DM Sans',sans-serif", fontSize:'0.875rem', fontWeight:'600', padding:'12px 28px', cursor:'pointer', opacity: loading ? 0.6 : 1 }}>
                <GitCompare size={15} /> {loading ? 'Running both models...' : 'Run Comparison'}
            </motion.button>
        </div>
    );

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Metric cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px' }}>
                {[
                    { val: metrics.total,    label:'Total',          color:'#e0bc6e' },
                    { val: metrics.agree,    label:'Agree',          color:'#4ade80', sub:'Both same verdict'        },
                    { val: metrics.disagree, label:'Disagree',       color:'#f87171', sub:'Different verdict'        },
                    { val: metrics.ruleOnly, label:'Model A Only',   color:'#fbbf24', sub:'SVM+MiniLM flagged only'  },
                    { val: metrics.svmOnly,  label:'Model B Only',   color:'#a78bfa', sub:'RoBERTa flagged only'     },
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }}
                        style={{ background:'#0d1018', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'16px', textAlign:'center' }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.7rem', fontWeight:'700', color:s.color, lineHeight:1, marginBottom:'4px' }}>{s.val}</div>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.72rem', color:'#8892a4', marginBottom: s.sub ? '3px' : 0 }}>{s.label}</div>
                        {s.sub && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.62rem', color:'#3a4252' }}>{s.sub}</div>}
                    </motion.div>
                ))}
            </div>

            {/* Charts row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>

                {/* Agreement donut (SVG) */}
                <div style={{ background:'#0d1018', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px' }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'0.9rem', fontWeight:'700', color:'#fff', marginBottom:'16px' }}>Agreement Overview</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
                        <svg width={140} height={140}>
                            {(() => {
                                const pct = metrics.total > 0 ? metrics.agree / metrics.total : 0;
                                const cx=70,cy=70,r=52,inner=34;
                                const a1 = pct * 2 * Math.PI;
                                const x1=cx+r*Math.cos(-Math.PI/2), y1=cy+r*Math.sin(-Math.PI/2);
                                const x2=cx+r*Math.cos(a1-Math.PI/2), y2=cy+r*Math.sin(a1-Math.PI/2);
                                const ix1=cx+inner*Math.cos(-Math.PI/2), iy1=cy+inner*Math.sin(-Math.PI/2);
                                const ix2=cx+inner*Math.cos(a1-Math.PI/2), iy2=cy+inner*Math.sin(a1-Math.PI/2);
                                const lg = a1 > Math.PI ? 1 : 0;
                                const lg2 = a1 < Math.PI ? 1 : 0;
                                return (<>
                                    <path d={"M "+x1+" "+y1+" A "+r+" "+r+" 0 "+lg+" 1 "+x2+" "+y2+" L "+ix2+" "+iy2+" A "+inner+" "+inner+" 0 "+lg+" 0 "+ix1+" "+iy1+" Z"} fill="#4ade80" opacity={0.9} />
                                    <path d={"M "+x2+" "+y2+" A "+r+" "+r+" 0 "+lg2+" 1 "+x1+" "+y1+" L "+ix1+" "+iy1+" A "+inner+" "+inner+" 0 "+lg2+" 0 "+ix2+" "+iy2+" Z"} fill="#f87171" opacity={0.9} />
                                    <text x={cx} y={cy-6} textAnchor="middle" fill="#fff" fontSize="16" fontFamily="Syne,sans-serif" fontWeight="700">{Math.round(pct*100)}%</text>
                                    <text x={cx} y={cy+10} textAnchor="middle" fill="#555f72" fontSize="9" fontFamily="DM Sans,sans-serif">agreement</text>
                                </>);
                            })()}
                        </svg>
                        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                            {[
                                { color:'#4ade80', label:'Both Agree',    val: metrics.agree    },
                                { color:'#f87171', label:'Disagree',      val: metrics.disagree },
                                { color:'#fbbf24', label:'Model A Only',  val: metrics.ruleOnly },
                                { color:'#a78bfa', label:'Model B Only',  val: metrics.svmOnly  },
                            ].map((d,i) => (
                                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:d.color }} />
                                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.75rem', color:'#8892a4' }}>{d.label}</span>
                                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.75rem', color:d.color, marginLeft:'auto' }}>{d.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Confusion matrix */}
                <div style={{ background:'#0d1018', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px' }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'0.9rem', fontWeight:'700', color:'#fff', marginBottom:'4px' }}>Confusion Matrix</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.68rem', color:'#555f72', marginBottom:'14px' }}>RoBERTa (Model B) treated as ground truth</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'10px' }}>
                        {[
                            { label:'True Positive',  val: metrics.tp, color:'#4ade80', bg:'rgba(74,222,128,0.08)',   desc:'Both flagged ambiguous'            },
                            { label:'False Positive', val: metrics.fp, color:'#fbbf24', bg:'rgba(251,191,36,0.08)',   desc:'Model A flagged, Model B clear'    },
                            { label:'False Negative', val: metrics.fn, color:'#f87171', bg:'rgba(248,113,113,0.08)',  desc:'Model B flagged, Model A clear'    },
                            { label:'True Negative',  val: metrics.tn, color:'#60a5fa', bg:'rgba(96,165,250,0.08)',   desc:'Both said clear'                   },
                        ].map((c,i) => (
                            <div key={i} style={{ background:c.bg, border:"1px solid "+c.color+"25", borderRadius:'10px', padding:'10px', textAlign:'center' }}>
                                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.4rem', fontWeight:'700', color:c.color, lineHeight:1, marginBottom:'3px' }}>{c.val}</div>
                                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.68rem', color:'#8892a4', fontWeight:'600', marginBottom:'2px' }}>{c.label}</div>
                                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.62rem', color:'#3a4252' }}>{c.desc}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display:'flex', gap:'6px' }}>
                        {[
                            { label:'Accuracy',  val: Math.round(metrics.accuracy  * 100)+'%', color:'#e0bc6e' },
                            { label:'Precision', val: Math.round(metrics.precision * 100)+'%', color:'#a78bfa' },
                            { label:'Recall',    val: Math.round(metrics.recall    * 100)+'%', color:'#60a5fa' },
                            { label:'F1',        val: Math.round(metrics.f1        * 100)+'%', color:'#34d399' },
                        ].map((m,i) => (
                            <div key={i} style={{ flex:1, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px', padding:'8px', textAlign:'center' }}>
                                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'1rem', fontWeight:'700', color:m.color }}>{m.val}</div>
                                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.62rem', color:'#555f72' }}>{m.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Score histogram */}
            <div style={{ background:'#0d1018', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px' }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'0.9rem', fontWeight:'700', color:'#fff', marginBottom:'6px' }}>Score Distribution</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.72rem', color:'#555f72', marginBottom:'14px' }}>How confidence scores spread across both detectors</div>
                <div style={{ display:'flex', gap:'14px', marginBottom:'10px' }}>
                    {[{ color:'#fbbf24', label:'Model A — SVM + MiniLM (Baseline)' },{ color:'#a78bfa', label:'Model B — RoBERTa NLI (Proposed)' }].map((l,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                            <div style={{ width:'10px', height:'10px', borderRadius:'2px', background:l.color }} />
                            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.72rem', color:'#8892a4' }}>{l.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    {metrics.histData.map((d,i) => {
                        const max = Math.max(...metrics.histData.flatMap(x => [x.rule, x.svm]), 1);
                        return (
                            <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.62rem', color:'#555f72', width:'44px', flexShrink:0 }}>{d.range}%</span>
                                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'2px' }}>
                                    <div style={{ height:'7px', background:'rgba(255,255,255,0.04)', borderRadius:'3px', overflow:'hidden' }}>
                                        <motion.div initial={{ width:0 }} animate={{ width:(d.rule/max*100)+'%' }} transition={{ duration:0.7, delay:i*0.04 }}
                                            style={{ height:'100%', background:'#fbbf24', borderRadius:'3px' }} />
                                    </div>
                                    <div style={{ height:'7px', background:'rgba(255,255,255,0.04)', borderRadius:'3px', overflow:'hidden' }}>
                                        <motion.div initial={{ width:0 }} animate={{ width:(d.svm/max*100)+'%' }} transition={{ duration:0.7, delay:i*0.04+0.03 }}
                                            style={{ height:'100%', background:'#a78bfa', borderRadius:'3px' }} />
                                    </div>
                                </div>
                                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.6rem', color:'#3a4252', width:'36px', flexShrink:0 }}>{d.rule}/{d.svm}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filter + search */}
            <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
                <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
                    <Search size={13} color="#555f72" style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requirements..."
                        style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'9px', color:'#c8d0de', fontFamily:"'DM Sans',sans-serif", fontSize:'0.82rem', padding:'9px 12px 9px 30px', outline:'none', boxSizing:'border-box' }}
                        onFocus={e => e.target.style.borderColor='rgba(167,139,250,0.3)'}
                        onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.07)'} />
                </div>
                {['all','agree','disagree','rule_only','svm_only'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{ background: filter===f ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)', border:'1px solid '+(filter===f ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'), borderRadius:'8px', color: filter===f ? '#a78bfa' : '#555f72', fontFamily:"'DM Sans',sans-serif", fontSize:'0.72rem', padding:'7px 11px', cursor:'pointer', whiteSpace:'nowrap' }}>
                        {f.replace('_',' ')}
                    </button>
                ))}
                <button onClick={run} style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', color:'#555f72', fontFamily:"'DM Sans',sans-serif", fontSize:'0.72rem', padding:'7px 11px', cursor:'pointer' }}>
                    <RotateCcw size={11} /> Re-run
                </button>
            </div>

            {/* Column headers */}
            <div style={{ display:'grid', gridTemplateColumns:'90px 1fr 160px 160px 70px', gap:'10px', padding:'0 14px' }}>
                {['ID','Requirement','Model A (SVM)','Model B (RoBERTa)','Match'].map(h => (
                    <span key={h} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.65rem', color:'#3a4252', textTransform:'uppercase', letterSpacing:'0.09em' }}>{h}</span>
                ))}
            </div>

            {/* Rows */}
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {rows.map((r,i) => (
                    <motion.div key={r.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: Math.min(i*0.006, 0.25) }}
                        style={{ background:'#0d1018', border:'1px solid '+(r.agreement ? 'rgba(255,255,255,0.05)' : 'rgba(248,113,113,0.18)'), borderRadius:'11px', padding:'12px 14px', display:'grid', gridTemplateColumns:'90px 1fr 160px 160px 70px', gap:'10px', alignItems:'start' }}>
                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.7rem', color:'#e0bc6e', background:'rgba(224,188,110,0.1)', border:'1px solid rgba(224,188,110,0.18)', borderRadius:'4px', padding:'2px 7px', fontWeight:'700', display:'inline-block', marginTop:'2px' }}>{r.id}</span>
                        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.8rem', color:'#8892a4', lineHeight:1.55, margin:0, fontWeight:'300' }}>{r.text}</p>
                        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.7rem', fontWeight:'600', color: r.model_a?.ambiguous ? '#fbbf24' : '#4ade80', background: r.model_a?.ambiguous ? 'rgba(251,191,36,0.1)' : 'rgba(74,222,128,0.08)', border:'1px solid '+(r.model_a?.ambiguous ? 'rgba(251,191,36,0.22)' : 'rgba(74,222,128,0.18)'), borderRadius:'5px', padding:'2px 7px', display:'inline-block' }}>
                                {r.model_a?.ambiguous ? '⚠ Ambiguous' : '✓ Clear'}
                            </span>
                            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.65rem', color:'#555f72' }}>conf: {Math.round((r.model_a?.score||0)*100)}%</span>
                            {(r.model_a?.reasons||[]).slice(0,1).map((f,fi) => <Chip key={fi} flag={f} />)}
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.7rem', fontWeight:'600', color: r.model_b?.ambiguous ? '#a78bfa' : '#4ade80', background: r.model_b?.ambiguous ? 'rgba(167,139,250,0.1)' : 'rgba(74,222,128,0.08)', border:'1px solid '+(r.model_b?.ambiguous ? 'rgba(167,139,250,0.22)' : 'rgba(74,222,128,0.18)'), borderRadius:'5px', padding:'2px 7px', display:'inline-block' }}>
                                {r.model_b?.ambiguous ? '⚠ Ambiguous' : '✓ Clear'}
                            </span>
                            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.65rem', color:'#555f72' }}>conf: {Math.round((r.model_b?.score||0)*100)}%</span>
                            {(r.model_b?.reasons||[]).slice(0,1).map((reason,ri) => (
                                <span key={ri} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.62rem', color:'#a78bfa', background:'rgba(167,139,250,0.07)', borderRadius:'3px', padding:'2px 5px' }}>{reason}</span>
                            ))}
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', paddingTop:'2px' }}>
                            <span style={{ fontSize:'1rem' }}>{r.agreement ? 'Y' : 'N'}</span>
                            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.6rem', color: r.agreement ? '#4ade80' : '#f87171' }}>{r.agreement ? 'Match' : 'Diff'}</span>
                        </div>
                    </motion.div>
                ))}
                {rows.length === 0 && (
                    <div style={{ textAlign:'center', padding:'40px 0' }}>
                        <p style={{ fontFamily:"'DM Sans',sans-serif", color:'#3a4252', fontSize:'0.85rem' }}>No results match your filter</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default function AnalysisPage() {
    const { id: projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [reqs, setReqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('overview');

    useEffect(() => {
        if (!projectId) return;
        (async () => {
            try {
                setLoading(true);
                const { data: proj } = await supabase.from('projects').select('id,name').eq('id', projectId).single();
                setProject(proj);
                const { data: runs, error: runErr } = await supabase.from('analysis_runs').select('id').eq('project_id', projectId).order('started_at', { ascending: false }).limit(1);
                if (runErr || !runs?.length) { setError('No analysis found. Please run a new analysis.'); return; }
                const { data: requirements, error: reqErr } = await supabase.from('requirements').select('*,rewrites(*)').eq('project_id', projectId).eq('analysis_run_id', runs[0].id).order('req_id');
                if (reqErr) throw new Error(reqErr.message);
                setReqs(requirements || []);
            } catch (err) { setError(err.message); }
            finally { setLoading(false); }
        })();
    }, [projectId]);

    const handleUpdate = useCallback((reqId, patch) => {
        setReqs(prev => prev.map(r => r.id === reqId ? { ...r, ...patch } : r));
    }, []);

    const counts = useMemo(() => ({
        dups: reqs.filter(r => r.is_duplicate).length,
        ambig: reqs.filter(r => r.is_ambiguous).length,
        clean: reqs.filter(r => !r.is_duplicate && !r.is_ambiguous).length,
    }), [reqs]);

    const TABS = [
        { id: 'overview', label: 'Overview', icon: BarChart2, color: '#e0bc6e' },
        { id: 'duplicates', label: 'Duplicates', icon: Copy, color: '#fbbf24', count: counts.dups },
        { id: 'ambiguous', label: 'Ambiguous', icon: AlertTriangle, color: '#f87171', count: counts.ambig },
        { id: 'clean', label: 'Clean', icon: Shield, color: '#4ade80', count: counts.clean },
        { id: 'analytics', label: 'Analytics', icon: BarChart2, color: '#34d399' },
        { id: 'comparison', label: 'Comparison', icon: GitCompare, color: '#a78bfa' },
    ];

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0a0b0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }} style={{ width: '38px', height: '38px', border: '2px solid rgba(224,188,110,0.12)', borderTopColor: '#e0bc6e', borderRadius: '50%', margin: '0 auto 16px' }} />
                <p style={{ fontFamily: "'DM Sans',sans-serif", color: '#555f72', fontSize: '0.9rem', fontWeight: '300' }}>Loading analysis...</p>
            </div>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: '100vh', background: '#0a0b0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '460px', padding: '0 24px' }}>
                <AlertTriangle size={32} color="#f87171" style={{ margin: '0 auto 16px', display: 'block' }} />
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.1rem', color: '#fff', marginBottom: '10px' }}>Couldn't load analysis</h3>
                <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.8rem', color: '#f87171', lineHeight: 1.6, marginBottom: '24px' }}>{error}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={() => navigate(`/upload?project=${projectId}`)} style={{ background: 'linear-gradient(135deg,#e0bc6e,#c49a3c)', border: 'none', borderRadius: '10px', color: '#0a0b0f', fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', fontWeight: '600', padding: '10px 22px', cursor: 'pointer' }}>Run New Analysis</button>
                    <button onClick={() => navigate('/dashboard')} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#8892a4', fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', padding: '10px 22px', cursor: 'pointer' }}>Dashboard</button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0a0b0f', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: '56px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0d1018', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate('/dashboard')}
                        onMouseEnter={e => e.currentTarget.style.color = '#c8d0de'}
                        onMouseLeave={e => e.currentTarget.style.color = '#555f72'}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#555f72', fontFamily: "'DM Sans',sans-serif", fontSize: '0.825rem', padding: 0, transition: 'color 0.2s' }}>
                        <ChevronLeft size={15} /> Dashboard
                    </button>
                    <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.825rem', color: '#8892a4', fontWeight: '300' }}>
                        <span style={{ color: '#e0bc6e' }}>{project?.name}</span> â€” Analysis
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <motion.button onClick={() => navigate(`/report/${projectId}`)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg,#e0bc6e,#c49a3c)', border: 'none', borderRadius: '8px', color: '#0a0b0f', fontFamily: "'DM Sans',sans-serif", fontSize: '0.8rem', fontWeight: '700', padding: '8px 18px', cursor: 'pointer' }}>
                        <Download size={13} /> Export Report
                    </motion.button>
                    <img src={logo} alt="Reqify" style={{ height: '25px' }} />
                </div>
            </header>

            {/* Tab bar */}
            <div style={{ background: '#0d1018', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 28px', display: 'flex', gap: '2px', position: 'sticky', top: '56px', zIndex: 40 }}>
                {TABS.map(t => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', borderBottom: `2px solid ${active ? t.color : 'transparent'}`, cursor: 'pointer', padding: '14px 18px', transition: 'all 0.2s', marginBottom: '-1px' }}>
                            <Icon size={14} color={active ? t.color : '#555f72'} />
                            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.85rem', fontWeight: active ? '600' : '400', color: active ? '#fff' : '#555f72', transition: 'color 0.2s' }}>{t.label}</span>
                            {t.count !== undefined && (
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', fontWeight: '700', color: active ? t.color : '#3a4252', background: active ? `${t.color}15` : 'transparent', border: `1px solid ${active ? `${t.color}25` : 'transparent'}`, borderRadius: '5px', padding: '1px 6px', transition: 'all 0.2s' }}>{t.count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div style={{ flex: 1, maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '28px 24px 56px' }}>
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                        {tab === 'overview'    && <OverviewTab   reqs={reqs} onGoTo={setTab} />}
                        {tab === 'duplicates'  && <DuplicatesTab reqs={reqs} onUpdate={handleUpdate} />}
                        {tab === 'ambiguous'   && <AmbiguousTab  reqs={reqs} onUpdate={handleUpdate} />}
                        {tab === 'clean'       && <CleanTab      reqs={reqs} />}
                        {tab === 'analytics'   && <AnalyticsTab  reqs={reqs} />}
                        {tab === 'comparison'  && <ComparisonTab />}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

