import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Search, FileText, Copy, AlertTriangle,
  CheckCircle, Sparkles, ChevronDown, ChevronUp,
  Download, ArrowRight, X, Layers, Shield,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.png';

// ── Flag chips ─────────────────────────────────────────────────────────────────
const FLAG_META = {
  vague_verb:          { label: 'Vague Verb',         color: '#f87171', bg: 'rgba(248,113,113,0.1)'  },
  weak_modal:          { label: 'Weak Modal',          color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'   },
  vague_word:          { label: 'Vague Word',          color: '#fb923c', bg: 'rgba(251,146,60,0.1)'   },
  multiple_actions:    { label: 'Multiple Actions',    color: '#a78bfa', bg: 'rgba(167,139,250,0.1)'  },
  missing_measurement: { label: 'Missing Measurement', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'   },
  time_expression:     { label: 'Time Expression',     color: '#34d399', bg: 'rgba(52,211,153,0.1)'   },
  quantity_expression: { label: 'Qty Expression',      color: '#f472b6', bg: 'rgba(244,114,182,0.1)'  },
  too_short:           { label: 'Too Short',           color: '#94a3b8', bg: 'rgba(148,163,184,0.1)'  },
};
const getFlagMeta = (flag) => {
  const key = Object.keys(FLAG_META).find(k => flag.startsWith(k));
  return key ? FLAG_META[key] : { label: flag, color: '#8892a4', bg: 'rgba(136,146,164,0.1)' };
};

// ── Score bar ──────────────────────────────────────────────────────────────────
const ScoreBar = ({ score, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${(score || 0) * 100}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ height: '100%', background: color, borderRadius: '99px' }}
      />
    </div>
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color, minWidth: '32px', textAlign: 'right' }}>
      {Math.round((score || 0) * 100)}%
    </span>
  </div>
);

// ── Requirement Card ───────────────────────────────────────────────────────────
const ReqCard = ({ req, onViewRewrite }) => {
  const [expanded, setExpanded] = useState(false);

  const typeColor   = req.req_type === 'FR' ? '#e0bc6e' : req.req_type === 'NFR' ? '#60a5fa' : '#a78bfa';
  const statusColor = req.is_ambiguous ? '#f87171' : req.is_duplicate ? '#fbbf24' : '#4ade80';
  const statusLabel = req.is_ambiguous ? 'Ambiguous'  : req.is_duplicate ? 'Duplicate'  : 'Clean';
  const flags       = req.ambiguity_flags || [];
  const hasRewrite  = req.rewrites && req.rewrites.length > 0;
  const rewrite     = hasRewrite ? req.rewrites[0] : null;
  const decided     = rewrite && rewrite.action && rewrite.action !== 'pending';

  return (
    <div style={{
      background: '#0d1018',
      border: `1px solid ${expanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      {/* ── Row ── */}
      <div onClick={() => setExpanded(v => !v)}
        style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '15px 18px', cursor: 'pointer' }}>

        {/* ID */}
        <div style={{ flexShrink: 0, padding: '3px 9px', borderRadius: '6px', marginTop: '1px', background: `${typeColor}15`, border: `1px solid ${typeColor}30`, fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: typeColor, fontWeight: '600' }}>
          {req.req_id}
        </div>

        {/* Text + flags */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#c8d0de', lineHeight: 1.6, fontWeight: '300', margin: 0, display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2, WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden' }}>
            {req.current_text || req.original_text}
          </p>
          {flags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
              {flags.map((f, i) => {
                const m = getFlagMeta(f);
                return <span key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', fontWeight: '500', color: m.color, background: m.bg, border: `1px solid ${m.color}30`, borderRadius: '5px', padding: '2px 7px' }}>
                  {m.label}{f.includes(':') ? `: ${f.split(':')[1]}` : ''}
                </span>;
              })}
            </div>
          )}
        </div>

        {/* Badges + chevron */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {decided && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', padding: '2px 8px' }}>
              <CheckCircle size={10} color="#4ade80" />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', color: '#4ade80' }}>Reviewed</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: `${statusColor}10`, border: `1px solid ${statusColor}25`, borderRadius: '6px', padding: '3px 9px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusColor }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: statusColor, fontWeight: '500' }}>{statusLabel}</span>
          </div>
          {expanded ? <ChevronUp size={14} color="#555f72" /> : <ChevronDown size={14} color="#555f72" />}
        </div>
      </div>

      {/* ── Expanded ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Full original text */}
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#555f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Original Text</div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#8892a4', lineHeight: 1.65, margin: 0, fontWeight: '300' }}>{req.original_text}</p>
              </div>

              {/* Score bars */}
              {(req.is_ambiguous || req.is_duplicate) && (
                <div style={{ display: 'grid', gridTemplateColumns: req.is_ambiguous && req.is_duplicate ? '1fr 1fr' : '1fr', gap: '14px' }}>
                  {req.is_ambiguous && (
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#555f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Ambiguity Score</div>
                      <ScoreBar score={req.ambiguity_score} color="#f87171" />
                    </div>
                  )}
                  {req.is_duplicate && (
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#555f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Similarity Score</div>
                      <ScoreBar score={req.similarity_score} color="#fbbf24" />
                    </div>
                  )}
                </div>
              )}

              {/* Dup group */}
              {req.is_duplicate && req.duplicate_group && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '8px', padding: '8px 14px' }}>
                  <Layers size={13} color="#fbbf24" />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#fbbf24' }}>Duplicate Group #{req.duplicate_group}</span>
                </div>
              )}

              {/* Rewrite CTA */}
              {hasRewrite && (
                <motion.button onClick={() => onViewRewrite(req)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', background: decided ? 'rgba(74,222,128,0.08)' : 'rgba(224,188,110,0.1)', border: decided ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(224,188,110,0.25)', borderRadius: '9px', color: decided ? '#4ade80' : '#e0bc6e', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: '500', padding: '8px 16px', cursor: 'pointer' }}>
                  {decided ? <><CheckCircle size={13} /> Rewrite Reviewed</> : <><Sparkles size={13} /> View AI Rewrite <ArrowRight size={12} /></>}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Rewrite Modal ──────────────────────────────────────────────────────────────
const RewriteModal = ({ req, onClose, onSave }) => {
  const rewrite = req?.rewrites?.[0];
  const [action, setAction] = useState(rewrite?.action && rewrite.action !== 'pending' ? rewrite.action : null);
  const [edited, setEdited] = useState(rewrite?.ai_rewritten_text || '');
  const [saving, setSaving] = useState(false);
  if (!rewrite) return null;

  const handle = async (act) => {
    setSaving(true);
    const final = act === 'rejected' ? req.original_text : act === 'edited' ? edited : rewrite.ai_rewritten_text;
    await supabase.from('rewrites').update({ action: act, final_text: final, decided_at: new Date().toISOString() }).eq('id', rewrite.id);
    if (act !== 'rejected') await supabase.from('requirements').update({ current_text: final, review_status: act }).eq('id', req.id);
    setAction(act);
    setSaving(false);
    onSave(req.id, rewrite.id, act);
    setTimeout(onClose, 900);
  };

  const already = !!action;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <motion.div initial={{ scale: 0.94, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 24 }} onClick={e => e.stopPropagation()}
        style={{ background: '#0d1018', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', width: '100%', maxWidth: '700px', maxHeight: '88vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="#a78bfa" />
            </div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: '700', color: '#fff' }}>AI Rewrite</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#e0bc6e' }}>{req.req_id}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#555f72', cursor: 'pointer', padding: '7px', display: 'flex' }}><X size={15} /></button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Original */}
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#555f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Original</div>
            <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '10px', padding: '14px 16px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#c8d0de', lineHeight: 1.65, margin: 0, fontWeight: '300' }}>{req.original_text}</p>
            </div>
          </div>

          {/* AI Rewritten */}
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#555f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>AI Rewritten</div>
            <div style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: '10px', padding: '14px 16px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#c8d0de', lineHeight: 1.65, margin: 0, fontWeight: '300' }}>{rewrite.ai_rewritten_text}</p>
            </div>
          </div>

          {/* Edit textarea */}
          {!already && (
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#555f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Edit Before Accepting</div>
              <textarea value={edited} onChange={e => setEdited(e.target.value)} rows={4}
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#c8d0de', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', lineHeight: 1.65, padding: '14px 16px', resize: 'vertical', outline: 'none', fontWeight: '300', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'rgba(224,188,110,0.3)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          )}

          {/* Actions */}
          {!already ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.button onClick={() => handle('accepted')} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '10px', color: '#4ade80', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: '500', padding: '12px', cursor: 'pointer' }}>
                <CheckCircle size={15} /> Accept
              </motion.button>
              <motion.button onClick={() => handle('edited')} disabled={saving || edited === rewrite.ai_rewritten_text} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: 'rgba(224,188,110,0.1)', border: '1px solid rgba(224,188,110,0.25)', borderRadius: '10px', color: '#e0bc6e', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: '500', padding: '12px', cursor: 'pointer' }}>
                <Sparkles size={15} /> Accept Edited
              </motion.button>
              <motion.button onClick={() => handle('rejected')} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', color: '#f87171', padding: '12px 16px', cursor: 'pointer' }}>
                <X size={15} />
              </motion.button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px' }}>
              <CheckCircle size={16} color="#4ade80" />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#4ade80' }}>
                {action === 'accepted' ? 'Accepted!' : action === 'edited' ? 'Saved with edits!' : 'Rejected — keeping original'}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function AnalysisPage() {
  const { projectId } = useParams();
  const navigate      = useNavigate();

  const [project,    setProject]    = useState(null);
  const [reqs,       setReqs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [rewriteReq, setRewriteReq] = useState(null);
  const [tab,        setTab]        = useState('all');
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // ── Load data directly from Supabase ──────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        setLoading(true);
        setError('');

        // Project name
        const { data: proj } = await supabase
          .from('projects').select('id, name').eq('id', projectId).single();
        setProject(proj);

        // Latest run
        const { data: runs, error: runErr } = await supabase
          .from('analysis_runs')
          .select('id, status, total_requirements, duplicate_groups, ambiguous_count, clean_count')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (runErr) throw new Error(runErr.message);
        if (!runs?.length) {
          setError('No analysis runs found for this project. Please run a new analysis.');
          return;
        }

        // Requirements + rewrites
        const { data: requirements, error: reqErr } = await supabase
          .from('requirements')
          .select('*, rewrites(*)')
          .eq('project_id', projectId)
          .eq('analysis_run_id', runs[0].id)
          .order('req_id');

        if (reqErr) throw new Error(reqErr.message);
        setReqs(requirements || []);

      } catch (err) {
        setError('Failed to load: ' + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     reqs.length,
    dups:      reqs.filter(r => r.is_duplicate).length,
    dupGroups: new Set(reqs.filter(r => r.is_duplicate).map(r => r.duplicate_group)).size,
    ambig:     reqs.filter(r => r.is_ambiguous).length,
    clean:     reqs.filter(r => !r.is_duplicate && !r.is_ambiguous).length,
  }), [reqs]);

  const reqTypes = useMemo(() => [...new Set(reqs.map(r => r.req_type))].filter(Boolean), [reqs]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...reqs];
    if (tab === 'duplicates') list = list.filter(r => r.is_duplicate);
    if (tab === 'ambiguous')  list = list.filter(r => r.is_ambiguous);
    if (tab === 'clean')      list = list.filter(r => !r.is_duplicate && !r.is_ambiguous);
    if (typeFilter !== 'all') list = list.filter(r => r.req_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.req_id.toLowerCase().includes(q) ||
        (r.current_text || r.original_text || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [reqs, tab, typeFilter, search]);

  // ── Rewrite save callback ──────────────────────────────────────────────────
  const handleRewriteSave = (reqId, rewriteId, action) => {
    setReqs(prev => prev.map(r =>
      r.id === reqId
        ? { ...r, rewrites: r.rewrites.map(rw => rw.id === rewriteId ? { ...rw, action } : rw) }
        : r
    ));
  };

  const TABS = [
    { id: 'all',        label: 'All',        count: stats.total, color: '#8892a4' },
    { id: 'duplicates', label: 'Duplicates', count: stats.dups,  color: '#fbbf24' },
    { id: 'ambiguous',  label: 'Ambiguous',  count: stats.ambig, color: '#f87171' },
    { id: 'clean',      label: 'Clean',      count: stats.clean, color: '#4ade80' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0f', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0d1018', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/dashboard')}
            onMouseEnter={e => e.currentTarget.style.color = '#c8d0de'}
            onMouseLeave={e => e.currentTarget.style.color = '#555f72'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#555f72', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', padding: 0, transition: 'color 0.2s' }}>
            <ChevronLeft size={16} /> Dashboard
          </button>
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#8892a4', fontWeight: '300' }}>
            <span style={{ color: '#e0bc6e' }}>{project?.name || '...'}</span> — Analysis
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <motion.button onClick={() => navigate(`/report/${projectId}`)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)', border: 'none', borderRadius: '9px', color: '#0a0b0f', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: '600', padding: '8px 18px', cursor: 'pointer' }}>
            <Download size={14} /> Export Report
          </motion.button>
          <img src={logo} alt="Reqify" style={{ height: '26px' }} />
        </div>
      </header>

      {/* Loading */}
      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ width: '36px', height: '36px', border: '2px solid rgba(224,188,110,0.15)', borderTopColor: '#e0bc6e', borderRadius: '50%', margin: '0 auto 16px' }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#555f72', fontSize: '0.9rem', fontWeight: '300' }}>Loading analysis...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px', padding: '0 24px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={24} color="#f87171" />
            </div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', color: '#fff', marginBottom: '10px' }}>Couldn't load analysis</h3>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: '#f87171', lineHeight: 1.6, marginBottom: '24px' }}>{error}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <motion.button onClick={() => navigate(`/upload?project=${projectId}`)} whileHover={{ scale: 1.03 }}
                style={{ background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)', border: 'none', borderRadius: '10px', color: '#0a0b0f', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: '600', padding: '10px 22px', cursor: 'pointer' }}>
                Run New Analysis
              </motion.button>
              <motion.button onClick={() => navigate('/dashboard')} whileHover={{ scale: 1.02 }}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#8892a4', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', padding: '10px 22px', cursor: 'pointer' }}>
                Dashboard
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {!loading && !error && (
        <div style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {[
              { icon: FileText,      val: stats.total,     label: 'Total Reqs',  color: '#e0bc6e', bg: 'rgba(224,188,110,0.08)' },
              { icon: Copy,          val: stats.dups,      label: 'Duplicates',  color: '#fbbf24', bg: 'rgba(251,191,36,0.08)'  },
              { icon: Layers,        val: stats.dupGroups, label: 'Dup Groups',  color: '#fb923c', bg: 'rgba(251,146,60,0.08)'  },
              { icon: AlertTriangle, val: stats.ambig,     label: 'Ambiguous',   color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
              { icon: Shield,        val: stats.clean,     label: 'Clean',       color: '#4ade80', bg: 'rgba(74,222,128,0.08)'  },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                style={{ background: '#0d1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <s.icon size={15} color={s.color} />
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.75rem', fontWeight: '700', color: '#fff', lineHeight: 1, marginBottom: '4px' }}>{s.val}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#555f72' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Empty state — data exists but requirements table is empty */}
          {reqs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(224,188,110,0.08)', border: '1px solid rgba(224,188,110,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FileText size={22} color="#e0bc6e" />
              </div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>No requirements saved yet</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#555f72', fontSize: '0.875rem', fontWeight: '300', marginBottom: '20px' }}>
                The analysis run completed but no requirements were saved to the database.<br />This can happen if the pipeline failed mid-way. Try running a fresh analysis.
              </p>
              <motion.button onClick={() => navigate(`/upload?project=${projectId}`)} whileHover={{ scale: 1.03 }}
                style={{ background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)', border: 'none', borderRadius: '10px', color: '#0a0b0f', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: '600', padding: '10px 24px', cursor: 'pointer' }}>
                Run New Analysis
              </motion.button>
            </div>
          )}

          {/* Tabs + Search — only show if we have data */}
          {reqs.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '4px' }}>
                  {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: tab === t.id ? 'rgba(255,255,255,0.07)' : 'transparent', border: 'none', borderRadius: '9px', cursor: 'pointer', padding: '7px 14px', transition: 'all 0.2s' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.825rem', color: tab === t.id ? '#fff' : '#555f72', fontWeight: tab === t.id ? '500' : '400' }}>{t.label}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', fontWeight: '600', color: tab === t.id ? t.color : '#555f72', background: tab === t.id ? `${t.color}15` : 'transparent', border: `1px solid ${tab === t.id ? `${t.color}25` : 'transparent'}`, borderRadius: '5px', padding: '1px 6px' }}>{t.count}</span>
                    </button>
                  ))}
                </div>

                {/* Search + type */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={13} color="#555f72" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requirements..."
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', color: '#c8d0de', fontFamily: "'DM Sans', sans-serif", fontSize: '0.825rem', padding: '8px 12px 8px 32px', outline: 'none', width: '220px', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(224,188,110,0.3)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                    />
                  </div>
                  <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    style={{ background: '#0d1018', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', color: '#8892a4', fontFamily: "'DM Sans', sans-serif", fontSize: '0.825rem', padding: '8px 12px', outline: 'none', cursor: 'pointer' }}>
                    <option value="all">All Types</option>
                    {reqTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Count bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#555f72', fontWeight: '300' }}>
                  Showing <span style={{ color: '#c8d0de' }}>{filtered.length}</span> of <span style={{ color: '#c8d0de' }}>{reqs.length}</span> requirements
                </span>
                {(search || typeFilter !== 'all') && (
                  <button onClick={() => { setSearch(''); setTypeFilter('all'); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#555f72', fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem' }}>
                    <X size={12} /> Clear filters
                  </button>
                )}
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '48px' }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '64px 0' }}>
                    <Search size={28} color="#555f72" style={{ margin: '0 auto 14px', display: 'block' }} />
                    <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#555f72', fontSize: '0.9rem', fontWeight: '300', margin: 0 }}>No requirements match your filters.</p>
                  </div>
                ) : filtered.map((req, i) => (
                  <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}>
                    <ReqCard req={req} onViewRewrite={setRewriteReq} />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Rewrite Modal */}
      <AnimatePresence>
        {rewriteReq && (
          <RewriteModal
            req={rewriteReq}
            onClose={() => setRewriteReq(null)}
            onSave={handleRewriteSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}