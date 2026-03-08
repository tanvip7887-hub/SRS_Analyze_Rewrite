import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle, ArrowRight,
  X, File, Cpu, ScanSearch, Sparkles, ChevronLeft, AlertTriangle, Copy
} from 'lucide-react';
import { useAuth }    from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { uploadSRS, processSRS, rewriteSRS, parseRequirements, parseStats } from '../lib/api';
import logo from '../assets/logo.png';

const STEPS = [
  { id: 'upload',  icon: Upload,     label: 'Uploading File',          desc: 'Sending your .docx to the analysis engine'    },
  { id: 'extract', icon: FileText,   label: 'Extracting Requirements', desc: 'Parsing FR, NFR, SR, DR, IR identifiers'      },
  { id: 'analyze', icon: ScanSearch, label: 'Detecting Issues',        desc: 'Running duplicate + ambiguity detection'      },
  { id: 'rewrite', icon: Sparkles,   label: 'Generating Rewrites',     desc: 'AI rewriting all ambiguous requirements'      },
  { id: 'saving',  icon: Cpu,        label: 'Saving Results',          desc: 'Persisting everything to your workspace'      },
];

export default function UploadPage() {
  const navigate                = useNavigate();
  const [searchParams]          = useSearchParams();
  const { user }                = useAuth();
  const {
    uploadSRSFile, createAnalysisRun, updateAnalysisRun,
    saveRequirements, saveAnalysisResults, saveRewrites, updateProjectStatus,
  } = useProject();

  const projectId   = searchParams.get('project');
  const projectName = searchParams.get('name') || 'Untitled Project';

  const [file,           setFile]         = useState(null);
  const [dragOver,       setDragOver]     = useState(false);
  const [phase,          setPhase]        = useState('idle');   // idle|processing|done|error
  const [currentStep,    setCurrentStep]  = useState(null);
  const [completedSteps, setCompleted]    = useState([]);
  const [error,          setError]        = useState('');
  const [results,        setResults]      = useState(null);
  const [preview,        setPreview]      = useState([]);
  const [showPreview,    setShowPreview]  = useState(false);

  const inputRef = useRef(null);

  const validateFile = (f) => {
    if (!f) return 'No file selected.';
    if (!f.name.toLowerCase().endsWith('.docx')) return 'Only .docx files are supported.';
    if (f.size > 50 * 1024 * 1024) return 'File must be under 50MB.';
    return null;
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError(''); setFile(f);
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError(''); setFile(f);
  };

  const markStep     = (id) => setCurrentStep(id);
  const completeStep = (id) => setCompleted(prev => [...new Set([...prev, id])]);

  // ── MAIN PIPELINE ────────────────────────────────────────────────────────
  const runPipeline = async () => {
    if (!file || !projectId || !user) return;
    setPhase('processing'); setCompleted([]); setError('');
    let runId = null;

    try {
      // ── STEP 1: Upload to Supabase Storage ──────────────────────────────
      markStep('upload');
      await updateProjectStatus(projectId, 'uploaded');

      const { data: fileRecord, error: fileErr } = await uploadSRSFile({
        userId: user.id, projectId, file, version: 1,
      });
      if (fileErr) throw new Error('Storage upload failed: ' + fileErr.message);
      completeStep('upload');

      // ── STEP 2: POST /upload-srs → extract requirements ─────────────────
      markStep('extract');
      await updateProjectStatus(projectId, 'extracting');

      // Response: { requirements: { "FR-01": "text", ... } }
      const uploadResult = await uploadSRS(file);

      // Create analysis run record in DB
      const { data: run, error: runErr } = await createAnalysisRun({
        projectId, srsFileId: fileRecord.id, userId: user.id,
      });
      if (runErr) throw new Error('Could not create analysis run: ' + runErr.message);
      runId = run.id;

      await updateAnalysisRun(runId, {
        status:           'running',
        raw_extract_json: uploadResult,
      });

      // Parse into flat array [{ req_id, text, req_type }]
      const reqList = parseRequirements(uploadResult);
      setPreview(reqList.slice(0, 20));
      completeStep('extract');
      await updateProjectStatus(projectId, 'extracted');

      // ── STEP 3: POST /process → duplicates + ambiguity ──────────────────
      markStep('analyze');
      await updateProjectStatus(projectId, 'analyzing');

      // Response: { requirements, duplicates: { summary, duplicates: [[...],[...]] }, ambiguity: {...} }
      const processResult = await processSRS();

      await updateAnalysisRun(runId, { raw_analysis_json: processResult });
      completeStep('analyze');
      await updateProjectStatus(projectId, 'analyzed');

      // ── STEP 4: POST /rewrite → AI rewrites ─────────────────────────────
      markStep('rewrite');
      await updateProjectStatus(projectId, 'rewriting');

      // Response: { total_ambiguous: 82, rewritten: [{ id, original, rewritten }] }
      const rewriteResult = await rewriteSRS();
      completeStep('rewrite');
      await updateProjectStatus(projectId, 'rewritten');

      // ── STEP 5: Save everything to Supabase ─────────────────────────────
      markStep('saving');

      // 5a. Save requirements rows
      const { data: savedReqs, error: reqErr } = await saveRequirements({
        projectId, runId, reqList,
      });
      if (reqErr) throw new Error('Failed to save requirements: ' + reqErr.message);

      // 5b. Update requirements with duplicate + ambiguity data
      await saveAnalysisResults({ projectId, runId, savedReqs, processResult });

      // 5c. Save rewrites linked to requirement UUIDs
      await saveRewrites({ projectId, runId, savedReqs, rewriteResult });

      // 5d. Finalise the analysis run with computed stats
      const stats = parseStats(processResult, rewriteResult);
      await updateAnalysisRun(runId, {
        status:             'completed',
        total_requirements: stats.total_requirements,
        duplicate_groups:   stats.duplicate_groups,
        ambiguous_count:    stats.ambiguous_count,
        clean_count:        stats.clean_count,
        completed_at:       new Date().toISOString(),
      });

      await updateProjectStatus(projectId, 'complete');
      completeStep('saving');

      setResults({ ...stats, runId });
      setPhase('done');

    } catch (err) {
      console.error('Pipeline error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setPhase('error');
      if (runId) {
        await updateAnalysisRun(runId, { status: 'failed', error_message: err.message });
      }
      await updateProjectStatus(projectId, 'uploaded');
    }
  };

  const stepIndex = (id) => STEPS.findIndex(s => s.id === id);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0f', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: '#0d1018',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#555f72', fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.85rem', padding: 0, transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#c8d0de'}
            onMouseLeave={e => e.currentTarget.style.color = '#555f72'}
          >
            <ChevronLeft size={16} /> Dashboard
          </button>
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#8892a4', fontWeight: '300' }}>
            <span style={{ color: '#e0bc6e' }}>{projectName}</span> — New Analysis
          </span>
        </div>
        <img src={logo} alt="Reqify" style={{ height: '28px' }} />
      </header>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '720px' }}>

          {/* ═══ IDLE ═══ */}
          {phase === 'idle' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(224,188,110,0.08)', border: '1px solid rgba(224,188,110,0.18)',
                  borderRadius: '100px', padding: '5px 14px', marginBottom: '16px',
                }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#e0bc6e' }}>
                    ✦ Upload & Analyze
                  </span>
                </div>
                <h1 style={{
                  fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.75rem,3vw,2.25rem)',
                  fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px',
                }}>Upload your SRS document</h1>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#555f72', fontWeight: '300' }}>
                  IEEE 830 .docx format · Max 50MB
                </p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
                onDrop={onDrop}
                onClick={() => !file && inputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'rgba(224,188,110,0.6)' : file ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '20px', padding: '56px 32px', textAlign: 'center',
                  cursor: file ? 'default' : 'pointer',
                  background: dragOver ? 'rgba(224,188,110,0.04)' : file ? 'rgba(74,222,128,0.03)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
                }}
              >
                <input ref={inputRef} type="file" accept=".docx" onChange={onFileChange} style={{ display: 'none' }} />

                <AnimatePresence mode="wait">
                  {!file ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div style={{
                        width: '64px', height: '64px', borderRadius: '16px',
                        background: dragOver ? 'rgba(224,188,110,0.12)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${dragOver ? 'rgba(224,188,110,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px', transition: 'all 0.3s',
                      }}>
                        <Upload size={28} color={dragOver ? '#e0bc6e' : '#555f72'} />
                      </div>
                      <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                        {dragOver ? 'Drop it here' : 'Drag & drop your .docx file'}
                      </h3>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#555f72', marginBottom: '20px', fontWeight: '300' }}>or</p>
                      <motion.button
                        onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        style={{
                          background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)', border: 'none',
                          borderRadius: '10px', color: '#0a0b0f', fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.875rem', fontWeight: '600', padding: '11px 24px',
                          cursor: 'pointer', boxShadow: '0 4px 16px rgba(224,188,110,0.25)',
                        }}
                      >Browse Files</motion.button>
                    </motion.div>
                  ) : (
                    <motion.div key="file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '12px' }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '12px',
                          background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <File size={22} color="#4ade80" />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', fontWeight: '500', color: '#fff', marginBottom: '3px' }}>{file.name}</div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#555f72' }}>{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setFile(null); setError(''); }} style={{
                          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                          borderRadius: '8px', color: '#f87171', cursor: 'pointer', padding: '6px', display: 'flex',
                        }}><X size={14} /></button>
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                        borderRadius: '100px', padding: '4px 12px',
                      }}>
                        <CheckCircle size={12} color="#4ade80" />
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#4ade80' }}>Ready to analyze</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                  borderRadius: '10px', padding: '12px 14px', marginTop: '14px',
                }}>
                  <AlertCircle size={15} color="#f87171" />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#f87171' }}>{error}</span>
                </motion.div>
              )}

              {/* Info cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginTop: '28px' }}>
                {[
                  { icon: FileText,   color: '#e0bc6e', label: 'Extraction', desc: 'All FR, NFR requirements parsed from your doc' },
                  { icon: ScanSearch, color: '#60a5fa', label: 'Analysis',   desc: 'Duplicate pairs and ambiguity scores detected'  },
                  { icon: Sparkles,   color: '#a78bfa', label: 'Rewriting',  desc: 'Ambiguous requirements rewritten to IEEE 830'  },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '14px', padding: '18px 16px', textAlign: 'center',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: `${s.color}15`, border: `1px solid ${s.color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                    }}>
                      <s.icon size={17} color={s.color} />
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.875rem', fontWeight: '700', color: '#fff', marginBottom: '5px' }}>{s.label}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.76rem', color: '#555f72', lineHeight: 1.5, fontWeight: '300' }}>{s.desc}</div>
                  </div>
                ))}
              </div>

              {/* Start button */}
              <div style={{ marginTop: '28px', textAlign: 'center' }}>
                <motion.button
                  onClick={runPipeline} disabled={!file}
                  whileHover={{ scale: file ? 1.03 : 1, y: file ? -2 : 0 }}
                  whileTap={{ scale: file ? 0.97 : 1 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    background: file ? 'linear-gradient(135deg, #e0bc6e, #c49a3c)' : 'rgba(255,255,255,0.05)',
                    border: 'none', borderRadius: '14px',
                    color: file ? '#0a0b0f' : '#555f72',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: '600',
                    padding: '15px 36px', cursor: file ? 'pointer' : 'not-allowed',
                    boxShadow: file ? '0 8px 28px rgba(224,188,110,0.3)' : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  Start Full Analysis <ArrowRight size={18} />
                </motion.button>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.76rem', color: '#555f72', marginTop: '10px', fontWeight: '300' }}>
                  Extraction → Duplicate Detection → Ambiguity Detection → AI Rewriting
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══ PROCESSING ═══ */}
          {phase === 'processing' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.75rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                Analyzing your SRS
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#555f72', fontWeight: '300', marginBottom: '32px' }}>
                This usually takes 1–3 minutes. Don't close this tab.
              </p>

              {/* File strip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px', padding: '14px 18px', marginBottom: '28px', textAlign: 'left',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(224,188,110,0.1)', border: '1px solid rgba(224,188,110,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <File size={18} color="#e0bc6e" />
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#fff', fontWeight: '500' }}>{file?.name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: '#555f72' }}>{(file?.size / 1024).toFixed(1)} KB · {projectName}</div>
                </div>
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                {STEPS.map((step, i) => {
                  const Icon    = step.icon;
                  const done    = completedSteps.includes(step.id);
                  const active  = currentStep === step.id;
                  const curIdx  = stepIndex(currentStep);
                  const pending = i > curIdx;

                  return (
                    <motion.div key={step.id}
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '16px',
                        background:   active ? 'rgba(224,188,110,0.06)' : done ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
                        border:       `1px solid ${active ? 'rgba(224,188,110,0.2)' : done ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: '14px', padding: '16px 18px', transition: 'all 0.4s',
                      }}
                    >
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
                        background:   active ? 'rgba(224,188,110,0.12)' : done ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                        border:       `1px solid ${active ? 'rgba(224,188,110,0.3)' : done ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}`,
                        display:      'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s',
                      }}>
                        {done
                          ? <CheckCircle size={19} color="#4ade80" />
                          : active
                          ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                              <Icon size={19} color="#e0bc6e" />
                            </motion.div>
                          : <Icon size={19} color="#555f72" />
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: "'Syne', sans-serif", fontSize: '0.9375rem', fontWeight: '600',
                          color: done ? '#4ade80' : active ? '#fff' : '#555f72',
                          marginBottom: '2px', transition: 'color 0.3s',
                        }}>{step.label}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: active ? '#8892a4' : '#555f72', fontWeight: '300' }}>
                          {step.desc}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {done && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#4ade80', fontWeight: '500' }}>Done</span>}
                        {active && (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {[0,1,2].map(d => (
                              <motion.div key={d}
                                animate={{ opacity: [0.3,1,0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }}
                                style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#e0bc6e' }}
                              />
                            ))}
                          </div>
                        )}
                        {pending && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#555f72' }}>Waiting</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══ DONE ═══ */}
          {phase === 'done' && results && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                }}
              >
                <CheckCircle size={36} color="#4ade80" />
              </motion.div>

              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                Analysis Complete!
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', color: '#8892a4', fontWeight: '300', marginBottom: '36px' }}>
                Your SRS has been fully processed. Here's what we found:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '36px' }} className="result-grid">
                {[
                  { icon: FileText,      val: results.total_requirements, label: 'Requirements',  color: '#e0bc6e', bg: 'rgba(224,188,110,0.08)' },
                  { icon: Copy,          val: results.duplicate_groups,   label: 'Dup. Groups',   color: '#fbbf24', bg: 'rgba(251,191,36,0.08)'  },
                  { icon: AlertTriangle, val: results.ambiguous_count,    label: 'Ambiguous',     color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
                  { icon: CheckCircle,   val: results.clean_count,        label: 'Clean',         color: '#4ade80', bg: 'rgba(74,222,128,0.08)'  },
                ].map((s, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    style={{ background: '#0d1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px 12px' }}
                  >
                    <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <s.icon size={16} color={s.color} />
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.875rem', fontWeight: '700', color: '#fff', lineHeight: 1, marginBottom: '4px' }}>{s.val}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#555f72' }}>{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div style={{ marginBottom: '28px', textAlign: 'left' }}>
                  <button onClick={() => setShowPreview(v => !v)} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#e0bc6e', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', padding: 0, marginBottom: '10px',
                  }}>
                    <FileText size={14} />
                    {showPreview ? 'Hide' : 'Preview'} extracted requirements ({preview.length} shown)
                  </button>
                  {showPreview && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ background: '#0d1018', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', maxHeight: '280px', overflowY: 'auto' }}
                    >
                      {preview.map((r, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: '12px', padding: '11px 16px',
                          borderBottom: i < preview.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#e0bc6e', fontWeight: '500', flexShrink: 0, marginTop: '2px' }}>{r.req_id}</span>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#8892a4', lineHeight: 1.55, fontWeight: '300' }}>{r.text}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <motion.button
                  onClick={() => navigate(`/analysis/${projectId}`)}
                  whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)',
                    border: 'none', borderRadius: '12px', color: '#0a0b0f',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', fontWeight: '600',
                    padding: '13px 30px', cursor: 'pointer', boxShadow: '0 8px 28px rgba(224,188,110,0.3)',
                  }}
                >View Full Analysis <ArrowRight size={17} /></motion.button>
                <motion.button onClick={() => navigate('/dashboard')} whileHover={{ scale: 1.02 }} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: '#8892a4', fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.9375rem', padding: '13px 24px', cursor: 'pointer',
                }}>Back to Dashboard</motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══ ERROR ═══ */}
          {phase === 'error' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(248,113,113,0.1)', border: '2px solid rgba(248,113,113,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
              }}><AlertCircle size={32} color="#f87171" /></div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.75rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }}>
                Analysis Failed
              </h2>
              <div style={{
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: '12px', padding: '16px 20px', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px',
              }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8125rem', color: '#f87171', lineHeight: 1.6 }}>{error}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <motion.button
                  onClick={() => { setPhase('idle'); setError(''); setCompleted([]); setCurrentStep(null); }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{
                    background: 'linear-gradient(135deg, #e0bc6e, #c49a3c)', border: 'none',
                    borderRadius: '12px', color: '#0a0b0f', fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.9rem', fontWeight: '600', padding: '13px 28px', cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(224,188,110,0.25)',
                  }}
                >Try Again</motion.button>
                <motion.button onClick={() => navigate('/dashboard')} whileHover={{ scale: 1.02 }} style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: '#8892a4', fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.9rem', padding: '13px 24px', cursor: 'pointer',
                }}>Back to Dashboard</motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <style>{`@media(max-width:580px){.result-grid{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </div>
  );
}