import os
import json
import subprocess
import tempfile
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from supabase import create_client

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # needs service key to bypass RLS


class ExportRequest(BaseModel):
    project_id: str
    run_id: Optional[str] = None   # if None, use latest


@router.post("/export/docx")
async def export_docx(req: ExportRequest):
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    # ── 1. Get project ───────────────────────────────────────────────────────
    proj = sb.from_("projects").select("id,name").eq("id", req.project_id).single().execute()
    if not proj.data:
        raise HTTPException(404, "Project not found")
    project_name = proj.data["name"]

    # ── 2. Get run ───────────────────────────────────────────────────────────
    if req.run_id:
        run_res = sb.from_("analysis_runs").select("id").eq("id", req.run_id).single().execute()
    else:
        run_res = sb.from_("analysis_runs").select("id") \
            .eq("project_id", req.project_id) \
            .order("started_at", desc=True).limit(1).execute()
        run_res.data = run_res.data[0] if run_res.data else None

    if not run_res.data:
        raise HTTPException(404, "No analysis run found")

    run_id = run_res.data["id"] if isinstance(run_res.data, dict) else run_res.data["id"]

    # ── 3. Load all requirements + rewrites ──────────────────────────────────
    reqs_res = sb.from_("requirements") \
        .select("*,rewrites(*)") \
        .eq("project_id", req.project_id) \
        .eq("analysis_run_id", run_id) \
        .order("req_id") \
        .execute()

    reqs = reqs_res.data or []

    # ── 4. Organise data for generator ───────────────────────────────────────
    duplicate_map = {}
    for r in reqs:
        if r.get("is_duplicate") and r.get("duplicate_group") is not None:
            g = r["duplicate_group"]
            if g not in duplicate_map:
                duplicate_map[g] = []
            duplicate_map[g].append(r)

    duplicate_groups = [
        {"num": num, "members": members}
        for num, members in sorted(duplicate_map.items())
    ]

    ambiguous_reqs = [r for r in reqs if r.get("is_ambiguous")]
    ambiguous_reqs.sort(key=lambda x: x.get("ambiguity_score") or 0, reverse=True)

    clean_reqs = [r for r in reqs if not r.get("is_ambiguous") and not r.get("is_duplicate")]

    reviewed = sum(
        1 for r in ambiguous_reqs
        if any(rw.get("action") and rw["action"] != "pending" for rw in (r.get("rewrites") or []))
    )

    stats = {
        "total":     len(reqs),
        "dupGroups": len(duplicate_groups),
        "dups":      sum(len(g["members"]) for g in duplicate_groups),
        "ambig":     len(ambiguous_reqs),
        "clean":     len(clean_reqs),
        "reviewed":  reviewed,
    }

    payload = {
        "projectName": project_name,
        "generatedAt": __import__("datetime").datetime.utcnow().isoformat(),
        "stats":           stats,
        "duplicateGroups": duplicate_groups,
        "ambiguousReqs":   ambiguous_reqs,
        "cleanReqs":       clean_reqs,
    }

    # ── 5. Call Node.js generator ─────────────────────────────────────────────
    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
        out_path = tmp.name

    script_path = os.path.join(os.path.dirname(__file__), "generate_report.js")

    try:
        result = subprocess.run(
            ["node", script_path, json.dumps(payload), out_path],
            capture_output=True, text=True, timeout=60,
        )
        if result.returncode != 0:
            raise HTTPException(500, f"Report generation failed: {result.stderr}")
    except subprocess.TimeoutExpired:
        raise HTTPException(500, "Report generation timed out")

    safe_name = "".join(c if c.isalnum() or c in "._- " else "_" for c in project_name)
    filename = f"{safe_name}_SRS_Analysis_Report.docx"

    return FileResponse(
        out_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename,
        background=None,
    )