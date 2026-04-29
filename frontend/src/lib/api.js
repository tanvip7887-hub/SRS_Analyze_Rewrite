const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ─── 1. POST /upload-srs ──────────────────────────────────────────────────────
// Response: { requirements: { "FR-01": "text...", "NFR-01": "text..." } }
export const uploadSRS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/upload-srs`, {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type — browser sets multipart boundary automatically
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`/upload-srs failed (${res.status}): ${err}`);
    }

    return await res.json();
};


// ─── 2. POST /process ────────────────────────────────────────────────────────
// Response: {
//   requirements: { "FR-01": "...", ... },
//   duplicates: {
//     summary: { total_requirements: 333, duplicate_groups: 12, similarity_threshold: 0.85 },
//     duplicates: [                              ← ARRAY OF PAIRS (not object)
//       [ { id: "FR-12", text: "..." }, { id: "FR-21", text: "..." } ],
//       [ ... ],
//     ]
//   },
//   ambiguity: {
//     "FR-01": { flags: ["vague_verb:process"], ambiguity_score: 0.33 },
//     "FR-02": { flags: [], ambiguity_score: 0 },
//   }
// }
export const processSRS = async () => {
    const res = await fetch(`${API_BASE}/process`, {
        method: 'POST',
        headers: { 'accept': 'application/json' },
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`/process failed (${res.status}): ${err}`);
    }

    return await res.json();
};


// ─── 3. POST /rewrite ────────────────────────────────────────────────────────
// Response: {
//   total_ambiguous: 82,
//   rewritten: [                               ← ARRAY (not object)
//     { id: "FR-01", original: "...", rewritten: "..." },
//     { id: "FR-22", original: "...", rewritten: "..." },
//   ]
// }
export const rewriteSRS = async () => {
    const res = await fetch(`${API_BASE}/rewrite`, {
        method: 'POST',
        headers: { 'accept': 'application/json' },
        body: '',
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`/rewrite failed (${res.status}): ${err}`);
    }

    return await res.json();
};


// ══════════════════════════════════════════════════════════════════════════════
//  PARSERS — transform backend responses into clean frontend/DB shapes
// ══════════════════════════════════════════════════════════════════════════════

// /upload-srs → flat array [{ req_id, text, req_type }]
export const parseRequirements = (uploadResult) => {
    const reqMap = uploadResult?.requirements || {};
    return Object.entries(reqMap).map(([req_id, text]) => ({
        req_id,
        text: typeof text === 'string' ? text : '',
        req_type: req_id.split('-')[0],   // 'FR', 'NFR', 'SR', etc.
    }));
};

// /process → map { [req_id]: { is_duplicate, duplicate_group, is_representative } }
export const parseDuplicates = (processResult) => {
    const pairs = processResult?.duplicates?.duplicates || [];
    const result = {};

    pairs.forEach((pair, groupIndex) => {
        pair.forEach((member, memberIndex) => {
            result[member.id] = {
                is_duplicate: true,
                duplicate_group: groupIndex + 1,
                is_representative: memberIndex === 0,
                duplicate_partner: pair.filter(m => m.id !== member.id).map(m => m.id),
            };
        });
    });

    return result;
};

// /process → map { [req_id]: { is_ambiguous, ambiguity_score, ambiguity_flags } }
export const parseAmbiguity = (processResult) => {
    const ambigMap = processResult?.ambiguity || {};
    const result = {};

    Object.entries(ambigMap).forEach(([req_id, info]) => {
        result[req_id] = {
            is_ambiguous:    info.is_ambiguous === true,
            ambiguity_score: info.ambiguity_score ?? 0,
            ambiguity_flags: info.flags ?? [],
        };
    });

    return result;
};

// /rewrite → map { [req_id]: { original, rewritten } }
export const parseRewrites = (rewriteResult) => {
    const list = rewriteResult?.rewritten || [];
    const result = {};

    list.forEach(item => {
        result[item.id] = {
            original: item.original || '',
            rewritten: item.rewritten || '',
        };
    });

    return result;
};

// Combined stats summary
export const parseStats = (processResult, rewriteResult) => {
    const summary = processResult?.duplicates?.summary || {};
    const ambigMap = processResult?.ambiguity || {};
    const ambigCount = rewriteResult?.total_ambiguous
        ?? Object.values(ambigMap).filter(a => a.is_ambiguous === true).length;

    return {
        total_requirements: summary.total_requirements || 0,
        duplicate_groups: summary.duplicate_groups || 0,
        similarity_threshold: summary.similarity_threshold || 0.85,
        ambiguous_count: ambigCount,
        clean_count: Math.max(0, (summary.total_requirements || 0) - ambigCount),
    };
};