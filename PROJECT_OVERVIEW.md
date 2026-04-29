# Reqify — Detailed Project Overview

## What this project is

**Reqify** is an AI-powered platform for **Software Requirements Specification (SRS) analysis and refinement**. It is designed to help software teams, researchers, and reviewers process SRS documents, find quality issues, and improve requirement clarity before implementation begins.

The system takes an uploaded `.docx` SRS document, extracts individual requirements, analyzes them for **duplicates** and **ambiguity**, and then generates **AI rewrites** for ambiguous statements. The platform also stores results in a project-based workspace, supports authentication, and can export a final report.

In short, Reqify automates the early-stage review of requirements so teams can catch problems like:

- duplicated requirements
- vague or ambiguous language
- missing measurable criteria
- poorly structured statements
- inconsistent wording across the SRS

---

## Core purpose

The project appears to serve **two major goals**:

1. **Product goal** — provide a practical workflow for reviewing and improving software requirements.
2. **Research goal** — compare ambiguity-detection approaches and generate analysis outputs that can be used for evaluation, reporting, and academic work.

This makes Reqify a mix of:

- requirements engineering tool
- NLP/ML analysis pipeline
- AI-assisted rewriting system
- project tracking dashboard
- report generator

---

## End-to-end workflow

### 1. User authentication

Reqify uses **Supabase Auth** to handle sign-in and sign-up. Users can:

- register with email and password
- log in with email/password
- log in with Google OAuth
- log in with GitHub OAuth

Once authenticated, the user gains access to protected routes such as the dashboard, upload page, analysis page, rewrite page, and report page.

### 2. Project creation

The user creates a project in the dashboard. Each project represents a single SRS analysis workspace.

A project stores information such as:

- project name
- description
- owner
- status
- timestamps
- related uploads
- analysis runs

This allows the app to keep multiple SRS reviews organized instead of treating everything as one-off file uploads.

### 3. SRS upload

The user uploads an SRS document in `.docx` format.

The upload flow includes:

- local validation of file type and size
- upload to Supabase Storage
- backend processing of the document
- extraction of requirement statements

The frontend currently expects the file to be:

- `.docx`
- under 50 MB

### 4. Requirement extraction

The backend reads the Word document and extracts requirement statements from:

- paragraphs
- tables

It scans for requirement identifiers such as:

- `FR-01`
- `NFR-02`
- `SR-03`
- `DR-04`
- `IR-05`

These are cleaned and stored as structured data so the rest of the pipeline can operate on them.

### 5. Duplicate detection

Reqify detects semantically similar requirement statements using transformer embeddings and cosine similarity.

The duplicate pipeline:

- converts each requirement into embeddings
- compares every requirement against the others
- groups requirements above a similarity threshold
- saves the duplicate groups for review

This is meant to catch requirements that say nearly the same thing but are phrased differently.

### 6. Ambiguity detection

The app includes ambiguity detection through machine learning and linguistic rules.

There are two models in the repository:

#### Model A — Baseline
- SVM classifier
- MiniLM embeddings
- rule-based linguistic features
- used as the baseline ambiguity detector

#### Model B — Proposed model
- RoBERTa/DeBERTa NLI zero-shot style classification
- used as the primary pipeline in `/process`
- also compared against Model A in `/process-ml`

The ambiguity system flags requirements that may be vague, underspecified, or hard to test.

### 7. Requirement rewriting

Ambiguous requirements are passed to a rewrite engine powered by **Groq** and **Llama 3.3 70B Versatile**.

The rewrite engine tries to:

- make the requirement clear
- make it atomic
- make it testable
- normalize modal verbs to `SHALL`
- preserve original intent
- keep the output in a standardized requirement format

If the model fails, a fallback mechanism still produces a standardized rewrite.

### 8. Saving results

After analysis and rewriting, Reqify stores the outputs in Supabase tables, linking everything to:

- the project
- the uploaded file
- the analysis run
- the individual requirements

This means the app can support history, review, and export across multiple runs.

### 9. Review and export

Users can inspect results in the UI, resolve duplicate groups, review AI rewrites, and generate a final report.

The export flow supports a DOCX report that summarizes:

- requirements analyzed
- duplicate groups found
- ambiguous requirements found
- cleaned requirements
- review status
- AI rewrite output

---

## Main product features

### Duplicate detection

Reqify identifies requirements that are likely redundant.

Implementation details:

- transformer embeddings
- `sentence-transformers/all-mpnet-base-v2`
- cosine similarity threshold of about `0.85`
- duplicate groups returned as paired sets

### Ambiguity detection

Reqify flags vague requirements using a combination of language patterns and ML outputs.

Signals include:

- vague adjectives like `fast`, `easy`, `efficient`
- vague quantities like `many`, `few`, `multiple`
- weak modal language
- passive voice patterns
- missing measurable values in NFRs
- incomplete sentence patterns
- `and/or` ambiguity

### AI rewriting

For ambiguous requirements, Reqify generates clearer alternatives.

Rewrite output aims to:

- start with `The system SHALL`
- preserve the original meaning
- keep the sentence one line / one requirement
- eliminate vague language
- produce a more IEEE-style requirement

### Project tracking

The system supports a multi-project workflow. Each analysis run is tied to a project, making it possible to track history, file versions, and generated outputs.

### Export and reporting

Reqify can generate a structured report document that includes statistics and summaries of the analysis.

---

## Frontend structure

The frontend is a **React + Vite** application.

### Main pages

- **Landing Page** — marketing and overview page
- **Login Page** — authentication entry
- **Register Page** — user sign-up
- **Dashboard Page** — project list and stats
- **Upload Page** — upload and process SRS files
- **Analysis Page** — view duplicate/ambiguity analysis
- **Rewrite Page** — review AI rewrite suggestions
- **Report Page** — export and download report outputs

### Frontend architecture

The frontend uses:

- **React 19**
- **React Router** for navigation
- **Framer Motion** for animation and transitions
- **Lucide React** for icons
- **Recharts** for charts
- **Supabase JS** for auth and data access

### Frontend state management

The app uses React context for shared state:

- `AuthContext` — manages session and user state
- `ProjectContext` — manages projects, runs, requirements, rewrites, and exports

### Important frontend behavior

The frontend handles the complete user journey:

1. authenticate
2. create project
3. upload SRS
4. run analysis
5. review findings
6. save results
7. export report

---

## Backend structure

The backend is a **FastAPI** application.

### Main backend responsibilities

- accept uploaded SRS files
- extract requirement statements from Word documents
- detect duplicates
- detect ambiguity
- rewrite ambiguous requirements
- export DOCX reports
- interact with Supabase for stored data

### API routes

#### `POST /upload-srs`
Uploads and extracts requirements from a `.docx` file.

#### `POST /process`
Runs the main analysis pipeline:

- duplicate detection
- primary ambiguity detection using the proposed model

#### `POST /process-ml`
Runs both ambiguity models and returns comparison data.

#### `POST /rewrite`
Rewrites ambiguous requirements and stores the output.

#### `POST /export/docx`
Generates a downloadable DOCX report.

---

## Backend services

### 1. Extractor

The extractor reads `.docx` files using `python-docx`.

It:

- loads paragraphs
- loads tables
- combines text blocks
- detects requirement IDs
- cleans extracted requirement text
- filters out invalid or too-short candidates
- saves extracted requirements as JSON

### 2. Duplicate detection service

This service uses:

- `SentenceTransformer`
- `all-mpnet-base-v2`
- cosine similarity

It builds duplicate groups by comparing requirement embeddings and grouping those above threshold.

### 3. Baseline ambiguity model

The baseline ambiguity detector uses:

- `all-MiniLM-L6-v2` embeddings
- SVM classifier loaded with `joblib`
- scaling using a saved scaler
- rule-based features and linguistic checks

### 4. Proposed ambiguity model

The proposed ambiguity detector uses:

- `cross-encoder/nli-deberta-v3-small`
- zero-shot / NLI-style classification
- rule-based reason extraction for explainability

### 5. Rewrite engine

The rewrite engine:

- batches ambiguous requirements
- sends prompts to Groq
- uses `llama-3.3-70b-versatile`
- parses response into requirement rewrites
- falls back to a deterministic rewrite if needed

### 6. Report generator

The export flow uses a Node.js script with the `docx` package.

This script builds a structured DOCX report with:

- cover page
- executive summary
- duplicate section
- ambiguity section
- styled tables and headings

---

## Data flow and storage model

### File and analysis flow

1. user uploads document
2. file is stored in Supabase Storage
3. backend extracts requirements
4. analysis run record is created
5. requirements are inserted into Supabase
6. analysis metadata is updated
7. duplicate and ambiguity results are saved
8. rewrite suggestions are saved
9. export history is tracked

### Likely database entities

From the frontend/backend code, the system uses tables like:

- `projects`
- `srs_files`
- `analysis_runs`
- `requirements`
- `duplicate_groups`
- `rewrites`
- `exports`
- `comments`

### Requirement record fields

A requirement row may store:

- requirement ID
- requirement type (`FR`, `NFR`, etc.)
- original text
- current text
- duplicate flag
- duplicate group number
- ambiguity flag
- ambiguity score
- ambiguity flags
- review status
- related rewrites

---

## Research/comparison mode

The repository also contains a research-oriented comparison workflow.

### Comparison endpoint

`/process-ml` compares:

- **Model A**: SVM + MiniLM baseline
- **Model B**: RoBERTa/DeBERTa proposed model

It returns:

- per-requirement results
- scores from both models
- agreement / disagreement status
- summary statistics

This suggests the project may be used for:

- academic benchmarking
- model evaluation
- precision/recall/F1 analysis
- research paper experiments

---

## Technology stack

### Frontend

- React 19
- Vite
- React Router DOM
- Framer Motion
- Lucide React
- Recharts
- Supabase JS

### Backend

- FastAPI
- Uvicorn
- Pydantic
- Python dotenv
- python-multipart
- Supabase Python client
- Groq SDK
- scikit-learn
- joblib
- NumPy
- Pandas
- spaCy
- SentenceTransformers
- python-docx
- Jinja2
- python-jose
- passlib
- gunicorn

### AI / ML

- `sentence-transformers/all-mpnet-base-v2`
- `sentence-transformers/all-MiniLM-L6-v2`
- SVM classifier
- `cross-encoder/nli-deberta-v3-small`
- Groq-hosted Llama 3.3 70B

### Infrastructure

- Supabase Auth
- Supabase Storage
- Supabase Postgres
- Node.js for DOCX generation
- Docker for backend containerization

---

## Deployment notes

The backend Dockerfile shows:

- Python 3.11 slim base image
- Node.js installation for report generation
- spaCy model download during build
- Python dependencies from `requirements.txt`
- FastAPI served with Uvicorn

This indicates the app is intended to run as a containerized backend with a separate frontend development/build pipeline.

---

## Environment variables used

From the code, the project expects environment variables such as:

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `GROQ_API_KEY`

These are needed for:

- frontend API access
- Supabase auth and storage
- backend export functionality
- Groq rewrite generation

---

## Why this project is useful

Reqify helps reduce manual review effort in requirements engineering by automatically identifying issues that are usually expensive to fix later.

It is useful for:

- business analysts
- software engineers
- QA teams
- requirements engineers
- researchers evaluating NLP models for SRS quality

---

## One-line summary

**Reqify is an AI-assisted SRS analysis platform that extracts requirements from Word documents, detects duplicates and ambiguity, rewrites unclear statements, tracks analysis runs in Supabase, and exports detailed reports.**
