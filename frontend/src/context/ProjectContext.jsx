import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
    parseDuplicates,
    parseAmbiguity,
    parseRewrites,
    parseStats,
} from '../lib/api';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(null);
    const [currentRun, setCurrentRun] = useState(null);
    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ── 1. Fetch all projects ─────────────────────────────────────────────────
    const fetchProjects = useCallback(async (userId) => {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
            .from('projects')
            .select(`
        *,
        srs_files ( id, file_name, version, is_active ),
        analysis_runs (
          id, status, total_requirements,
          duplicate_groups, ambiguous_count, clean_count,
          completed_at
        )
      `)
            .eq('owner_id', userId)
            .is('archived_at', null)
            .order('created_at', { ascending: false });

        if (error) setError(error.message);
        else setProjects(data || []);
        setLoading(false);
    }, []);

    // ── 2. Fetch single project ───────────────────────────────────────────────
    const fetchProject = useCallback(async (projectId) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('projects')
            .select(`
        *,
        srs_files(*),
        analysis_runs(*),
        project_members(*, profiles(full_name, avatar_url))
      `)
            .eq('id', projectId)
            .single();

        if (error) setError(error.message);
        else setCurrentProject(data);
        setLoading(false);
        return { data, error };
    }, []);

    // ── 3. Create project ─────────────────────────────────────────────────────
    const createProject = useCallback(async ({ userId, name, description = '' }) => {
        const { data, error } = await supabase
            .from('projects')
            .insert({ owner_id: userId, name, description, status: 'created' })
            .select()
            .single();

        if (!error) {
            setProjects(prev => [data, ...prev]);
            setCurrentProject(data);
        }
        return { data, error };
    }, []);

    // ── 4. Update project status ──────────────────────────────────────────────
    const updateProjectStatus = useCallback(async (projectId, status) => {
        const { error } = await supabase
            .from('projects')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', projectId);

        if (!error) {
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status } : p));
            setCurrentProject(prev => prev?.id === projectId ? { ...prev, status } : prev);
        }
        return { error };
    }, []);

    // ── 5. Soft-delete (archive) project ─────────────────────────────────────
    const archiveProject = useCallback(async (projectId) => {
        const { error } = await supabase
            .from('projects')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', projectId);

        if (!error) setProjects(prev => prev.filter(p => p.id !== projectId));
        return { error };
    }, []);

    // ── 6. Upload SRS file to Supabase Storage ────────────────────────────────
    const uploadSRSFile = useCallback(async ({ userId, projectId, file, version = 1 }) => {
        const ext = file.name.split('.').pop();
        const filePath = `${userId}/${projectId}/v${version}_${Date.now()}.${ext}`;

        const { error: storageError } = await supabase.storage
            .from('srs-files')
            .upload(filePath, file, { upsert: false });

        if (storageError) return { data: null, error: storageError };

        // Mark previous versions inactive
        await supabase
            .from('srs_files')
            .update({ is_active: false })
            .eq('project_id', projectId);

        const { data, error } = await supabase
            .from('srs_files')
            .insert({
                project_id: projectId,
                uploaded_by: userId,
                version,
                file_name: file.name,
                file_path: filePath,
                file_size_bytes: file.size,
                is_active: true,
            })
            .select()
            .single();

        return { data, error };
    }, []);

    // ── 7. Create analysis run ────────────────────────────────────────────────
    const createAnalysisRun = useCallback(async ({ projectId, srsFileId, userId }) => {
        const { data, error } = await supabase
            .from('analysis_runs')
            .insert({ project_id: projectId, srs_file_id: srsFileId, triggered_by: userId, status: 'pending' })
            .select()
            .single();

        if (!error) setCurrentRun(data);
        return { data, error };
    }, []);

    // ── 8. Update analysis run ────────────────────────────────────────────────
    const updateAnalysisRun = useCallback(async (runId, updates) => {
        const { data, error } = await supabase
            .from('analysis_runs')
            .update(updates)
            .eq('id', runId)
            .select()
            .single();

        if (!error) setCurrentRun(data);
        return { data, error };
    }, []);

    // ── 9. Save extracted requirements ───────────────────────────────────────
    //  reqList = [{ req_id, text, req_type }]  from parseRequirements()
    const saveRequirements = useCallback(async ({ projectId, runId, reqList }) => {
        const rows = reqList.map(r => ({
            project_id: projectId,
            analysis_run_id: runId,
            req_id: r.req_id,
            req_type: r.req_type,
            original_text: r.text,
            current_text: r.text,
        }));

        const { data, error } = await supabase
            .from('requirements')
            .insert(rows)
            .select();

        if (!error) setRequirements(data || []);
        return { data, error };
    }, []);

    // ── 10. Save duplicate + ambiguity results onto saved requirements ─────────
    //  dupMap    = parseDuplicates(processResult)
    //  ambigMap  = parseAmbiguity(processResult)
    //  savedReqs = the rows returned from saveRequirements
    const saveAnalysisResults = useCallback(async ({ projectId, runId, savedReqs, processResult }) => {
        const dupMap = parseDuplicates(processResult);
        const ambigMap = parseAmbiguity(processResult);

        // UPDATE each requirement row individually (avoids upsert column mismatch)
        const updatePromises = savedReqs.map(req => {
            const dup = dupMap[req.req_id] || {};
            const ambig = ambigMap[req.req_id] || {};
            return supabase
                .from('requirements')
                .update({
                    is_duplicate: dup.is_duplicate || false,
                    duplicate_group: dup.duplicate_group || null,
                    similarity_score: dup.similarity_score || null,
                    is_ambiguous: ambig.is_ambiguous || false,
                    ambiguity_score: ambig.ambiguity_score || 0,
                    ambiguity_flags: ambig.ambiguity_flags || [],
                })
                .eq('id', req.id);
        });

        // Run in parallel batches of 20 to avoid rate limits
        const batchSize = 20;
        for (let i = 0; i < updatePromises.length; i += batchSize) {
            await Promise.all(updatePromises.slice(i, i + batchSize));
        }
        const error = null;

        // Save duplicate_groups table
        const pairs = processResult?.duplicates?.duplicates || [];
        if (pairs.length > 0) {
            const groupRows = pairs.map((pair, i) => ({
                project_id: projectId,
                analysis_run_id: runId,
                group_number: i + 1,
                representative_req_id: pair[0]?.id,
                member_count: pair.length,
            }));
            await supabase.from('duplicate_groups').insert(groupRows);
        }

        return { error };
    }, []);

    // ── 11. Save rewrites ─────────────────────────────────────────────────────
    //  savedReqs    = rows from saveRequirements (have .id UUID)
    //  rewriteResult = raw /rewrite response
    const saveRewrites = useCallback(async ({ projectId, runId, savedReqs, rewriteResult }) => {
        const rewriteMap = parseRewrites(rewriteResult);  // { "FR-01": { original, rewritten } }

        const rows = [];
        savedReqs.forEach(req => {
            const rw = rewriteMap[req.req_id];
            if (rw?.rewritten) {
                rows.push({
                    requirement_id: req.id,
                    project_id: projectId,
                    analysis_run_id: runId,
                    ai_rewritten_text: rw.rewritten,
                    model_used: 'qwen2.5-coder-1.5b-instruct',
                    action: 'pending',
                });
            }
        });

        const { data, error } = await supabase
            .from('rewrites')
            .insert(rows)
            .select();

        return { data, error };
    }, []);

    // ── 12. Fetch requirements for a run ─────────────────────────────────────
    const fetchRequirements = useCallback(async ({ projectId, runId }) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('requirements')
            .select('*, rewrites(*)')
            .eq('project_id', projectId)
            .eq('analysis_run_id', runId)
            .order('req_id');

        if (!error) setRequirements(data || []);
        setLoading(false);
        return { data, error };
    }, []);

    // ── 13. Accept / reject / edit a rewrite ─────────────────────────────────
    const updateRewrite = useCallback(async ({ rewriteId, requirementId, action, finalText, userId }) => {
        const { data, error } = await supabase
            .from('rewrites')
            .update({ action, final_text: finalText, edited_by: userId, decided_at: new Date().toISOString() })
            .eq('id', rewriteId)
            .select()
            .single();

        if (!error && (action === 'accepted' || action === 'edited')) {
            await supabase
                .from('requirements')
                .update({ current_text: finalText, review_status: action })
                .eq('id', requirementId);
        }

        return { data, error };
    }, []);

    // ── 14. Log export ────────────────────────────────────────────────────────
    const logExport = useCallback(async ({ projectId, runId, userId, format, fileName }) => {
        const { data, error } = await supabase
            .from('exports')
            .insert({ project_id: projectId, analysis_run_id: runId, exported_by: userId, format, file_name: fileName })
            .select()
            .single();
        return { data, error };
    }, []);

    // ── 15. Add comment ───────────────────────────────────────────────────────
    const addComment = useCallback(async ({ requirementId, projectId, userId, body }) => {
        const { data, error } = await supabase
            .from('comments')
            .insert({ requirement_id: requirementId, project_id: projectId, author_id: userId, body })
            .select('*, profiles(full_name, avatar_url)')
            .single();
        return { data, error };
    }, []);

    const value = {
        projects, currentProject, currentRun, requirements, loading, error,
        setError, setCurrentProject, setCurrentRun, setRequirements,
        fetchProjects, fetchProject,
        createProject, updateProjectStatus, archiveProject,
        uploadSRSFile,
        createAnalysisRun, updateAnalysisRun,
        saveRequirements, saveAnalysisResults, saveRewrites,
        fetchRequirements,
        updateRewrite, logExport, addComment,
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const ctx = useContext(ProjectContext);
    if (!ctx) throw new Error('useProject must be used within ProjectProvider');
    return ctx;
};