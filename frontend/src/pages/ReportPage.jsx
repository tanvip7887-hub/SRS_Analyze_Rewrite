import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Download, FileText, AlertTriangle, Copy,
  CheckCircle, Sparkles, Shield, Layers, BarChart2,
  File, FileSpreadsheet, BookOpen, Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.png';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const pad = n => String(n).padStart(2, '0');
const timestamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

// ─── Export functions ─────────────────────────────────────────────────────────

// 1. CSV export
const exportCSV = (reqs, projectName) => {
  const header = ['req_id', 'req_type', 'is_duplicate', 'duplicate_group', 'is_ambiguous', 'ambiguity_score', 'ambiguity_flags', 'review_status', 'original_text', 'current_text'];
  const rows   = reqs.map(r => [
    r.req_id,
    r.req_type,
    r.is_duplicate ? 'Yes' : 'No',
    r.duplicate_group || '',
    r.is_ambiguous ? 'Yes' : 'No',
    r.ambiguity_score || 0,
    (r.ambiguity_flags || []).join('; '),
    r.review_status || 'pending',
    `"${(r.original_text || '').replace(/"/g, '""')}"`,
    `"${(r.current_text || r.original_text || '').replace(/"/g, '""')}"`,
  ]);
  const csv  = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `${projectName}_requirements_${timestamp()}.csv`);
};

// 2. Ambiguity report — plain text (no PDF lib needed)
const exportAmbiguityReport = (reqs, projectName) => {
  const ambiguous = reqs.filter(r => r.is_ambiguous).sort((a, b) => (b.ambiguity_score || 0) - (a.ambiguity_score || 0));

  let txt = `AMBIGUITY REPORT\n`;
  txt += `Project: ${projectName}\n`;
  txt += `Generated: ${new Date().toLocaleString()}\n`;
  txt += `${'─'.repeat(70)}\n\n`;
  txt += `SUMMARY\n`;
  txt += `Total Ambiguous Requirements: ${ambiguous.length}\n`;
  txt += `Average Ambiguity Score: ${ambiguous.length ? (ambiguous.reduce((s, r) => s + (r.ambiguity_score || 0), 0) / ambiguous.length * 100).toFixed(1) : 0}%\n\n`;
  txt += `${'─'.repeat(70)}\n\n`;
  txt += `AMBIGUOUS REQUIREMENTS\n\n`;

  ambiguous.forEach((r, i) => {
    txt += `${i + 1}. [${r.req_id}] — Score: ${Math.round((r.ambiguity_score || 0) * 100)}%\n`;
    txt += `   Flags: ${(r.ambiguity_flags || []).join(', ') || 'none'}\n`;
    txt += `   Original: ${r.original_text}\n`;
    const rw = r.rewrites?.find(rw => rw.action && rw.action !== 'pending');
    if (rw) {
      txt += `   Rewritten (${rw.action}): ${rw.final_text || rw.ai_rewritten_text}\n`;
    } else if (r.rewrites?.length) {
      txt += `   AI Suggested: ${r.rewrites[0].ai_rewritten_text}\n`;
      txt += `   Status: Pending review\n`;
    }
    txt += `\n`;
  });

  const blob = new Blob([txt], { type: 'text/plain' });
  downloadBlob(blob, `${projectName}_ambiguity_report_${timestamp()}.txt`);
};

// 3. Duplicate pairs report
const exportDuplicateReport = (reqs, projectName) => {
  const dupMap = {};
  reqs.filter(r => r.is_duplicate && r.duplicate_group).forEach(r => {
    const g = r.duplicate_group;
    if (!dupMap[g]) dupMap[g] = [];
    dupMap[g].push(r);
  });

  let txt = `DUPLICATE REQUIREMENTS REPORT\n`;
  txt += `Project: ${projectName}\n`;
  txt += `Generated: ${new Date().toLocaleString()}\n`;
  txt += `${'─'.repeat(70)}\n\n`;
  txt += `SUMMARY\n`;
  txt += `Total Duplicate Groups: ${Object.keys(dupMap).length}\n`;
  txt += `Total Duplicate Requirements: ${reqs.filter(r => r.is_duplicate).length}\n\n`;
  txt += `${'─'.repeat(70)}\n\n`;
  txt += `DUPLICATE GROUPS\n\n`;

  Object.entries(dupMap).forEach(([groupNum, members]) => {
    txt += `Group #${groupNum} — ${members.length} requirements\n`;
    members.forEach((r, i) => {
      txt += `  ${i === 0 ? '→ [Representative]' : '  [Duplicate]'} ${r.req_id}: ${r.original_text}\n`;
    });
    txt += `\n`;
  });

  const blob = new Blob([txt], { type: 'text/plain' });
  downloadBlob(blob, `${projectName}_duplicate_report_${timestamp()}.txt`);
};

// 4. Annotated SRS — structured text with rewrites applied
const exportAnnotatedSRS = (reqs, projectName) => {
  const frReqs  = reqs.filter(r => r.req_type === 'FR');
  const nfrReqs = reqs.filter(r => r.req_type === 'NFR');
  const others  = reqs.filter(r => r.req_type !== 'FR' && r.req_type !== 'NFR');

  const stats = {
    total:    reqs.length,
    clean:    reqs.filter(r => !r.is_ambiguous && !r.is_duplicate).length,
    ambig:    reqs.filter(r => r.is_ambiguous).length,
    dups:     reqs.filter(r => r.is_duplicate).length,
    reviewed: reqs.filter(r => r.rewrites?.some(rw => rw.action && rw.action !== 'pending')).length,
  };

  let txt = `ANNOTATED SOFTWARE REQUIREMENTS SPECIFICATION\n`;
  txt += `Project: ${projectName}\n`;
  txt += `Generated by REQIFY — ${new Date().toLocaleString()}\n`;
  txt += `${'═'.repeat(70)}\n\n`;

  txt += `QUALITY SUMMARY\n`;
  txt += `  Total Requirements : ${stats.total}\n`;
  txt += `  Clean              : ${stats.clean} (${Math.round(stats.clean / stats.total * 100)}%)\n`;
  txt += `  Ambiguous          : ${stats.ambig}\n`;
  txt += `  Duplicate Groups   : ${reqs.filter(r => r.is_duplicate).length > 0 ? new Set(reqs.filter(r => r.is_duplicate).map(r => r.duplicate_group)).size : 0}\n`;
  txt += `  Rewrites Reviewed  : ${stats.reviewed}\n\n`;
  txt += `${'═'.repeat(70)}\n\n`;

  const writeSection = (title, list) => {
    if (!list.length) return;
    txt += `${title}\n${'─'.repeat(title.length)}\n\n`;
    list.forEach(r => {
      const accepted = r.rewrites?.find(rw => rw.action === 'accepted' || rw.action === 'edited');
      const status   = r.is_duplicate ? '[DUP]' : r.is_ambiguous ? '[AMB]' : '[OK] ';
      txt += `${status} ${r.req_id}\n`;
      if (accepted) {
        txt += `  ${accepted.final_text || accepted.ai_rewritten_text}\n`;
        txt += `  [^ Rewritten from original: ${r.original_text}]\n`;
      } else {
        txt += `  ${r.current_text || r.original_text}\n`;
        if (r.is_ambiguous && r.rewrites?.length) {
          txt += `  [! AI suggested: ${r.rewrites[0].ai_rewritten_text}]\n`;
        }
      }
      txt += `\n`;
    });
  };

  writeSection('FUNCTIONAL REQUIREMENTS', frReqs);
  writeSection('NON-FUNCTIONAL REQUIREMENTS', nfrReqs);
  if (others.length) writeSection('OTHER REQUIREMENTS', others);

  const blob = new Blob([txt], { type: 'text/plain' });
  downloadBlob(blob, `${projectName}_annotated_SRS_${timestamp()}.txt`);
};

// ─── Export Card ──────────────────────────────────────────────────────────────
const ExportCard = ({ icon: Icon, title, description, badge, color, bg, onExport, loading, done, highlight }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    style={{ background: '#0d1018', border: `1px solid ${done ? 'rgba(74,222,128,0.2)' : highlight ? 'rgba(224,188,110,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'border-color 0.3s' }}>

    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: bg, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={19} color={color} />
        </div>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.975rem', fontWeight: '700', color: '#fff', marginBottom: '3px' }}>{title}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#555f72', fontWeight: '300' }}>{description}</div>
        </div>
      </div>
      {badge && (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', color, background: bg, border: `1px solid ${color}25`, borderRadius: '5px', padding: '3px 8px', flexShrink: 0, fontWeight: '500' }}>{badge}</span>
      )}
    </div>

    <motion.button
      onClick={onExport} disabled={loading}
      whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        background: done ? 'rgba(74,222,128,0.1)' : `${color}14`,
        border: `1px solid ${done ? 'rgba(74,222,128,0.3)' : `${color}30`}`,
        borderRadius: '10px',
        color: done ? '#4ade80' : color,
        fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '600',
        padding: '11px', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
      }}
    >
      {done ? <><CheckCircle size={15} /> Downloaded</> : loading ? <>Generating...</> : <><Download size={15} /> Download</>}
    </motion.button>
  </motion.div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const { id: projectId } = useParams();
  const navigate      = useNavigate();

  const [project,  setProject]  = useState(null);
  const [reqs,     setReqs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState({});   // tracks which exports completed
  const [exporting, setExporting] = useState({}); // tracks which is in progress

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        setLoading(true);
        const { data: proj } = await supabase.from('projects').select('id, name').eq('id', projectId).single();
        setProject(proj);

        const { data: runs } = await supabase
          .from('analysis_runs').select('id').eq('project_id', projectId)
          .order('created_at', { ascending: false }).limit(1);

        if (!runs?.length) { setError('No analysis found.'); return; }

        const { data: requirements } = await supabase
          .from('requirements').select('*, rewrites(*)')
          .eq('project_id', projectId).eq('analysis_run_id', runs[0].id)
          .order('req_id');

        setReqs(requirements || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const stats = useMemo(() => ({
    total:     reqs.length,
    ambig:     reqs.filter(r => r.is_ambiguous).length,
    dups:      reqs.filter(r => r.is_duplicate).length,
    dupGroups: new Set(reqs.filter(r => r.is_duplicate).map(r => r.duplicate_group)).size,
    clean:     reqs.filter(r => !r.is_ambiguous && !r.is_duplicate).length,
    reviewed:  reqs.filter(r => r.rewrites?.some(rw => rw.action && rw.action !== 'pending')).length,
    accepted:  reqs.filter(r => r.rewrites?.some(rw => rw.action === 'accepted' || rw.action === 'edited')).length,
  }), [reqs]);

  const runExport = async (key, fn) => {
    setExporting(p => ({ ...p, [key]: true }));
    await new Promise(r => setTimeout(r, 400)); // brief delay for UX
    fn(reqs, project?.name || 'project');
    setExporting(p => ({ ...p, [key]: false }));
    setDone(p => ({ ...p, [key]: true }));
  };

  const exportDocx = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const res = await fetch(`${apiUrl}/export/docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const blob = await res.blob();
    const safeName = (project?.name || 'SRS').replace(/[^a-zA-Z0-9._-]/g, '_');
    downloadBlob(blob, `${safeName}_SRS_Analysis_Report.docx`);
  };

  const EXPORTS = [
    {
      key:         'docx',
      icon:        FileText,
      title:       'Full Analysis Report (.docx)',
      description: 'Professional Word document with all sections — duplicates, ambiguous rewrites, clean requirements, and executive summary',
      badge:       'Recommended',
      color:       '#e0bc6e',
      bg:          'rgba(224,188,110,0.12)',
      fn:          exportDocx,
      highlight:   true,
    },
    {
      key:         'srs',
      icon:        BookOpen,
      title:       'Annotated SRS',
      description: 'Full SRS with AI rewrites applied where accepted, flagged issues inline',
      badge:       `${stats.accepted} rewrites applied`,
      color:       '#e0bc6e',
      bg:          'rgba(224,188,110,0.1)',
      fn:          exportAnnotatedSRS,
    },
    {
      key:         'ambiguity',
      icon:        AlertTriangle,
      title:       'Ambiguity Report',
      description: 'All ambiguous requirements with flags, scores and suggested rewrites',
      badge:       `${stats.ambig} requirements`,
      color:       '#f87171',
      bg:          'rgba(248,113,113,0.1)',
      fn:          exportAmbiguityReport,
    },
    {
      key:         'duplicates',
      icon:        Copy,
      title:       'Duplicate Pairs Report',
      description: 'All duplicate groups with representative and member requirements listed',
      badge:       `${stats.dupGroups} groups`,
      color:       '#fbbf24',
      bg:          'rgba(251,191,36,0.1)',
      fn:          exportDuplicateReport,
    },
    {
      key:         'csv',
      icon:        FileSpreadsheet,
      title:       'Full CSV Export',
      description: 'All requirements with scores, flags, types and review status as spreadsheet',
      badge:       `${stats.total} rows`,
      color:       '#4ade80',
      bg:          'rgba(74,222,128,0.1)',
      fn:          exportCSV,
    },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0b0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        style={{ width: '36px', height: '36px', border: '2px solid rgba(224,188,110,0.12)', borderTopColor: '#e0bc6e', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0f', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0d1018', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(`/analysis/${projectId}`)}
            onMouseEnter={e => e.currentTarget.style.color = '#c8d0de'}
            onMouseLeave={e => e.currentTarget.style.color = '#555f72'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#555f72', fontFamily: "'DM Sans',sans-serif", fontSize: '0.85rem', padding: 0, transition: 'color 0.2s' }}>
            <ChevronLeft size={16} /> Analysis
          </button>
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', color: '#8892a4', fontWeight: '300' }}>
            <span style={{ color: '#e0bc6e' }}>{project?.name}</span> — Export Report
          </span>
        </div>
        <img src={logo} alt="Reqify" style={{ height: '26px' }} />
      </header>

      <div style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Page title */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(224,188,110,0.08)', border: '1px solid rgba(224,188,110,0.18)', borderRadius: '100px', padding: '5px 14px', marginBottom: '16px' }}>
            <Download size={12} color="#e0bc6e" />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: '#e0bc6e' }}>Export Center</span>
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.75rem,3vw,2.25rem)', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', margin: '0 0 8px' }}>
            Download Your Reports
          </h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9rem', color: '#555f72', fontWeight: '300', margin: 0 }}>
            Export the annotated SRS with rewrites applied, or individual analysis reports.
          </p>
        </div>

        {/* Quality overview */}
        <div style={{ background: '#0d1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '24px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.875rem', fontWeight: '700', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={16} color="#e0bc6e" /> Quality Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '12px' }}>
            {[
              { val: stats.total,    label: 'Total',    color: '#e0bc6e' },
              { val: stats.clean,    label: 'Clean',    color: '#4ade80' },
              { val: stats.ambig,    label: 'Ambiguous',color: '#f87171' },
              { val: stats.dups,     label: 'Duplicate',color: '#fbbf24' },
              { val: stats.reviewed, label: 'Reviewed', color: '#a78bfa' },
              { val: stats.accepted, label: 'Accepted', color: '#34d399' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px 8px' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.6rem', fontWeight: '700', color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.val}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.68rem', color: '#555f72' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Progress bar: reviewed */}
          {stats.ambig > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', color: '#555f72' }}>Rewrite Review Progress</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.75rem', color: '#a78bfa' }}>{stats.reviewed} / {stats.ambig}</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.ambig ? (stats.reviewed / stats.ambig * 100) : 0}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg,#a78bfa,#7c3aed)', borderRadius: '99px' }} />
              </div>
            </div>
          )}
        </div>

        {/* Pending reviews warning */}
        {stats.ambig - stats.reviewed > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '12px', padding: '14px 18px' }}>
            <AlertTriangle size={16} color="#fbbf24" />
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.85rem', color: '#fbbf24', fontWeight: '500' }}>
                {stats.ambig - stats.reviewed} rewrites still pending review
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: '#8892a4', marginTop: '2px', fontWeight: '300' }}>
                The annotated SRS will include AI suggestions for unreviewed requirements. Go back to Analysis to review them.
              </div>
            </div>
            <motion.button onClick={() => navigate(`/analysis/${projectId}`)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ flexShrink: 0, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '8px', color: '#fbbf24', fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', fontWeight: '500', padding: '7px 14px', cursor: 'pointer' }}>
              Review Now
            </motion.button>
          </motion.div>
        )}

        {/* Export cards */}
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.875rem', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={15} color="#e0bc6e" /> Available Exports
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {EXPORTS.map((exp, i) => (
              <motion.div key={exp.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <ExportCard
                  icon={exp.icon}
                  title={exp.title}
                  description={exp.description}
                  badge={exp.badge}
                  color={exp.color}
                  bg={exp.bg}
                  loading={exporting[exp.key]}
                  done={done[exp.key]}
                  onExport={() => runExport(exp.key, exp.fn)}
                  highlight={exp.highlight}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Export all */}
        <div style={{ textAlign: 'center', paddingBottom: '24px' }}>
          <motion.button
            onClick={() => EXPORTS.forEach(exp => !done[exp.key] && runExport(exp.key, exp.fn))}
            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg,#e0bc6e,#c49a3c)', border: 'none', borderRadius: '14px', color: '#0a0b0f', fontFamily: "'DM Sans',sans-serif", fontSize: '1rem', fontWeight: '700', padding: '15px 36px', cursor: 'pointer', boxShadow: '0 8px 28px rgba(224,188,110,0.25)' }}>
            <Download size={18} /> Download All Reports
          </motion.button>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', color: '#555f72', marginTop: '10px', fontWeight: '300' }}>
            All 4 files will download simultaneously
          </p>
        </div>
      </div>
    </div>
  );
}