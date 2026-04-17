// ─── Tab 5: Comparison ────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, RotateCcw, GitCompare } from 'lucide-react';
import { Chip } from '../../components/shared/Chip';  // assume shared

const ComparisonTab = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all | agree | disagree
    const [search, setSearch] = useState('');

    const run = async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/process-ml`, { method: 'POST' });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setData(json.comparison);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    const rows = useMemo(() => {
        if (!data) return [];
        let entries = Object.entries(data).map(([id, v]) => ({ id, ...v }));
        if (filter === 'agree') entries = entries.filter(r => r.agreement);
        if (filter === 'disagree') entries = entries.filter(r => !r.agreement);
        if (search.trim()) {
            const q = search.toLowerCase();
            entries = entries.filter(r => r.id.toLowerCase().includes(q) || r.text.toLowerCase().includes(q));
        }
        return entries;
    }, [data, filter, search]);

    const summary = useMemo(() => {
        if (!data) return null;
        const all = Object.values(data);
        return {
            total: all.length,
            agree: all.filter(r => r.agreement).length,
            disagree: all.filter(r => !r.agreement).length,
            ruleOnly: all.filter(r => r.rule_ambiguous && !r.svm_ambiguous).length,
            svmOnly: all.filter(r => !r.rule_ambiguous && r.svm_ambiguous).length,
            both: all.filter(r => r.rule_ambiguous && r.svm_ambiguous).length,
        };
    }, [data]);

    if (!data) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GitCompare size={28} color="#a78bfa" />
            </div>
            <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Model Comparison</h3>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.85rem', color: '#555f72', fontWeight: '300', maxWidth: '360px' }}>
                    Compare rule-based detection vs your trained SVM model — side by side.
                </p>
            </div>
            {error && <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.78rem', color: '#f87171' }}>{error}</p>}
            <motion.button onClick={run} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', border: 'none', borderRadius: '10px', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', fontWeight: '600', padding: '12px 28px', cursor: 'pointer' }}>
                <GitCompare size={15} /> Run Comparison
            </motion.button>
        </div>
    );

    // ... (rest of loaded state as in feedback)
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px' }}>
                {[
                    { val: summary.total, label: 'Total', color: '#e0bc6e' },
                    { val: summary.agree, label: 'Agree', color: '#4ade80' },
                    { val: summary.disagree, label: 'Disagree', color: '#f87171' },
                    { val: summary.ruleOnly, label: 'Rule Only', color: '#fbbf24' },
                    { val: summary.svmOnly, label: 'SVM Only', color: '#a78bfa' },
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        style={{ background: '#0d1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.6rem', fontWeight: '700', color: s.color, lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.7rem', color: '#555f72', marginTop: '4px' }}>{s.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Filters + search */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={13} color="#555f72" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requirements..."
                        style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', color: '#c8d0de', fontFamily: "'DM Sans',sans-serif", fontSize: '0.82rem', padding: '9px 12px 9px 30px', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.3)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                </div>
                {['all', 'agree', 'disagree'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{ background: filter === f ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === f ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '8px', color: filter === f ? '#a78bfa' : '#555f72', fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', padding: '8px 14px', cursor: 'pointer', textTransform: 'capitalize' }}>
                        {f}
                    </button>
                ))}
                <button onClick={run}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#555f72', fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', padding: '8px 12px', cursor: 'pointer' }}>
                    <RotateCcw size={12} /> Re-run
                </button>
            </div>

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 160px 160px 80px', gap: '10px', padding: '0 14px', marginBottom: '-4px' }}>
                {['ID', 'Requirement', 'Rule-Based', 'SVM Model', 'Match'].map(h => (
                    <span key={h} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.68rem', color: '#3a4252', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{h}</span>
                ))}
            </div>

            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {rows.map((r, i) => {
                    const agree = r.agreement;
                    const borderColor = agree ? 'rgba(255,255,255,0.05)' : 'rgba(248,113,113,0.2)';
                    return (
                        <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.008, 0.3) }}
                            style={{ background: '#0d1018', border: `1px solid ${borderColor}`, borderRadius: '11px', padding: '13px 14px', display: 'grid', gridTemplateColumns: '90px 1fr 160px 160px 80px', gap: '10px', alignItems: 'start' }}>

                            {/* ID */}
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', color: '#e0bc6e', background: 'rgba(224,188,110,0.1)', border: '1px solid rgba(224,188,110,0.2)', borderRadius: '5px', padding: '2px 7px', fontWeight: '700', display: 'inline-block', marginTop: '2px' }}>{r.id}</span>

                            {/* Text */}
                            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.82rem', color: '#8892a4', lineHeight: 1.55, margin: 0, fontWeight: '300' }}>{r.text}</p>

                            {/* Rule-based verdict */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.72rem', fontWeight: '600', color: r.rule_ambiguous ? '#f87171' : '#4ade80', background: r.rule_ambiguous ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.08)', border: `1px solid ${r.rule_ambiguous ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.2)'}`, borderRadius: '5px', padding: '3px 8px', display: 'inline-block' }}>
                                    {r.rule_ambiguous ? '⚠ Ambiguous' : '✓ Clear'}
                                </span>
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.68rem', color: '#555f72' }}>score: {Math.round(r.rule_score * 100)}%</span>
                                {r.rule_flags?.slice(0, 2).map((f, fi) => <Chip key={fi} flag={f} />)}
                                {r.rule_flags?.length > 2 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.65rem', color: '#3a4252' }}>+{r.rule_flags.length - 2} more</span>}
                            </div>

                            {/* SVM verdict */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.72rem', fontWeight: '600', color: r.svm_ambiguous ? '#a78bfa' : '#4ade80', background: r.svm_ambiguous ? 'rgba(167,139,250,0.1)' : 'rgba(74,222,128,0.08)', border: `1px solid ${r.svm_ambiguous ? 'rgba(167,139,250,0.25)' : 'rgba(74,222,128,0.2)'}`, borderRadius: '5px', padding: '3px 8px', display: 'inline-block' }}>
                                    {r.svm_ambiguous ? '⚠ Ambiguous' : '✓ Clear'}
                                </span>
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.68rem', color: '#555f72' }}>conf: {Math.round(r.svm_score * 100)}%</span>
                                {r.svm_reasons?.slice(0, 2).map((reason, ri) => (
                                    <span key={ri} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.65rem', color: '#a78bfa', background: 'rgba(167,139,250,0.07)', borderRadius: '4px', padding: '2px 6px' }}>{reason}</span>
                                ))}
                            </div>

                            {/* Match */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {agree
                                    ? <span style={{ fontSize: '1.1rem' }} title="Both agree">✅</span>
                                    : <span style={{ fontSize: '1.1rem' }} title="Disagreement">⚡</span>
                                }
                            </div>
                        </motion.div>
                    );
                })}
                {rows.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0' }}><p style={{ fontFamily: "'DM Sans',sans-serif", color: '#3a4252', fontSize: '0.85rem' }}>No results match</p></div>}
            </div>
        </div>
    );
};

export { ComparisonTab };
