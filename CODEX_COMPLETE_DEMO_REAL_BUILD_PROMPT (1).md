# CODEX COMPLETE DEMO-REAL UI + PROVIDER BUILD PROMPT

Copy-paste this entire prompt into Codex from the repository root.

---

You are Codex working on the Plagcheck anti-plagiarism and AI-detection SaaS.

The backend MVP may be verified, but the current UI is not demo-ready and the current scan provider is still mock-only. Your job is to fix the demo experience end-to-end while keeping existing working backend functionality.

## 0. First read these files

Read these files from the repository root before changing code:

- `AGENTS.md`
- `IMPLEMENTATION_TRACKER.md`
- `CODEX_UI_FLOW_FIX_PROMPT.md` if present
- `CODEX_REAL_DEMO_APIS_AND_UI_PROMPT.md` if present
- `docs/mvp-release-notes.md` if present
- `docs/uat-results.md` if present
- `docs/deployment.md` if present

If any of the optional prompt/docs files are missing, continue using this prompt as the source of truth and document that they were missing.

## 1. Human inputs available now

Only these external demo APIs are currently available or intended:

- Tavily API key for web-source plagiarism/source matching.
- Gemini API key for AI-content likelihood analysis.
- OpenAlex API key or email/mailto for academic metadata matching.
- LanguageTool public API for grammar/spell checking; no key required.

Do not require or implement these for this sprint:

- Brave Search
- Google Custom Search / Google CSE
- Semantic Scholar
- paid Copyleaks/Winston/Turnitin provider

## 2. Environment variables to support

Update env validation and examples to support exactly this demo setup.

Do not hard-code real secrets.
Do not commit a real `.env` file with actual keys.
If `.env` already exists locally, add missing variable names only if safe, and never overwrite existing values.
Always update `.env.example` and create/update `.env.demo.example`.

Use this sample env structure:

```env
# =========================
# CORE APP
# =========================
NODE_ENV=development
APP_URL=http://localhost:3000
PORT=3000

# =========================
# AUTH / SECURITY
# =========================
SESSION_SECRET=change-this-local-dev-secret-min-32-chars

# =========================
# DATABASE
# =========================
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/plagcheck

# =========================
# MINIO LOCAL STORAGE
# =========================
MINIO_ENDPOINT=http://localhost:9000
MINIO_REGION=us-east-1
MINIO_BUCKET=plagcheck
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# =========================
# DEMO SCAN PROVIDER
# options: mock | demo-real | certified
# certified is reserved for future paid/OEM provider integration.
# =========================
SCAN_PROVIDER=demo-real
DEMO_MODE=true
SHOW_PROVIDER_LABEL=true
ALLOW_FALLBACK=true

# =========================
# PLAGIARISM / WEB MATCHING
# Tavily only for this sprint.
# =========================
DEMO_WEB_SEARCH_PROVIDER=tavily
TAVILY_API_KEY=PASTE_YOUR_TAVILY_KEY_HERE
TAVILY_SEARCH_DEPTH=basic
TAVILY_MAX_RESULTS=5
TAVILY_MAX_CHUNKS=6

# Explicitly disabled for this sprint
GOOGLE_CSE_API_KEY=
GOOGLE_CSE_CX=
BRAVE_SEARCH_API_KEY=

# =========================
# ACADEMIC SOURCE DEMO
# Prefer free OpenAlex API key if available.
# Use OPENALEX_MAILTO as non-secret contact identifier / fallback.
# =========================
DEMO_ACADEMIC_PROVIDER=openalex
OPENALEX_API_KEY=PASTE_OPENALEX_KEY_OR_LEAVE_EMPTY
OPENALEX_MAILTO=your-email@example.com
OPENALEX_MAX_RESULTS=5

# Explicitly disabled for this sprint
SEMANTIC_SCHOLAR_API_KEY=
CROSSREF_MAILTO=

# =========================
# AI CONTENT DETECTION
# Gemini only for this sprint.
# =========================
DEMO_AI_PROVIDER=gemini
DEMO_AI_DETECTION_MODE=llm
GEMINI_API_KEY=PASTE_YOUR_GEMINI_KEY_HERE
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_MAX_OUTPUT_TOKENS=4096

# =========================
# GRAMMAR / SPELL CHECK
# =========================
DEMO_GRAMMAR_PROVIDER=languagetool-public
LANGUAGETOOL_URL=https://api.languagetool.org/v2/check
LANGUAGETOOL_LANGUAGE=en-US
LANGUAGETOOL_MAX_CHARS=18000

# =========================
# LIMITS
# =========================
MAX_FILE_MB=25
MAX_WORDS_PER_DOCUMENT=50000
MONTHLY_WORD_LIMIT=1000000
ACCEPTED_FILES=pdf,doc,docx,txt
```

## 3. Product requirements to satisfy visually and functionally

The demo must look and behave like an anti-plagiarism and AI-detection SaaS, not a generic CRUD admin app.

Required visible feature areas:

1. Browser-based SaaS dashboard.
2. New Check flow.
3. Plagiarism Checker page.
4. AI Detector page.
5. Grammar Check page.
6. Submission upload/history.
7. Report page.
8. Reviewer queue and reviewer case page.
9. User/admin/settings/audit/support pages remain available.
10. PDF/DOC/DOCX/TXT upload support must remain intact.
11. Exclusion controls for bibliography, quotes, and small matches.
12. Similarity percentage.
13. Source-wise matches with URLs/titles/snippets.
14. Highlighted matched content.
15. Academic metadata matches from OpenAlex when available.
16. AI probability/indicator.
17. Writing-pattern notes / sentence-level AI assessments.
18. Grammar/spell findings.
19. PDF report export.
20. Audit logs and role protection.
21. Demo seed data so dashboard and reviewer queue are not blank.
22. Provider badge: `Mock`, `Demo Real`, or `Certified`.
23. Disclaimer that Demo Real is not certified plagiarism proof.

## 4. UI remediation requirements

Add or update these routes/pages:

- `/dashboard`
- `/scan/new`
- `/plagiarism-checker`
- `/ai-detector`
- `/grammar-checker`
- `/submissions`
- `/submissions/[id]`
- `/submissions/[id]/report`
- `/reports` if not present
- `/reviewer/queue`
- `/reviewer/cases/[id]`

Update sidebar/navigation to include:

- Dashboard
- New Check
- Plagiarism Checker
- AI Detector
- Grammar Check
- Submissions
- Reports
- Reviewer Queue
- Users
- Settings
- Audit
- Support

The main demo flow should be:

Dashboard → New Check → choose Full Report / Plagiarism / AI / Grammar → upload or paste text → choose exclusions → start scan → processing timeline → report → reviewer workflow → PDF export.

The reviewer queue must not be a useless empty page for super admin/demo users. Add either:

- real seeded review cases, or
- a strong CTA: “Create demo submission and scan now”, plus empty-state explanation.

Prefer seeded demo cases.

## 5. Demo-real provider implementation

Keep existing mock provider as fallback. Do not remove it.

Add provider mode:

```txt
SCAN_PROVIDER=mock | demo-real | certified
```

`certified` must remain a future placeholder only. Do not invent paid provider behavior.

Implement a new `demo-real` provider that uses these sub-providers:

- Tavily for web-source matching.
- Gemini for AI-content likelihood.
- OpenAlex for academic metadata/source discovery.
- LanguageTool public API for grammar/spell checking.

If any API key or network call is missing/failing, the scan must not fail. Use local fallback and set `provider_metadata.fallback=true` or a per-service fallback flag.

### 5A. Web plagiarism/source matching with Tavily

Implement a Tavily client module.

Behavior:

1. Take sanitized scan text.
2. Split into meaningful sentence/paragraph chunks.
3. Select 3 to 8 strongest chunks:
   - avoid very short chunks
   - avoid bibliography/quote text already excluded
   - prefer chunks with distinctive terms
4. For each chunk, call Tavily search if `TAVILY_API_KEY` exists.
5. Use `search_depth=basic` by default to keep cost low.
6. Use `max_results` from env, default 5.
7. For each result, use title, URL, and content/snippet.
8. Compare submitted chunk against returned content using local similarity:
   - normalized token overlap
   - 3-gram Jaccard overlap
   - exact phrase overlap where possible
9. Store source matches with:
   - source title
   - source URL
   - source type = `web`
   - matched submitted text/chunk
   - matched snippet/content
   - start/end character range if available
   - similarity score
   - provider metadata
10. Calculate overall demo similarity score from top source matches.

If Tavily fails:

- fall back to local demo-corpus matching or deterministic heuristic
- mark web provider fallback in metadata
- still produce a report

### 5B. AI-content likelihood with Gemini

Implement a Gemini client module using `GEMINI_API_KEY` and `GEMINI_MODEL`.

Prompt Gemini with strict JSON output only.

Expected response shape:

```json
{
  "aiProbability": 0.0,
  "confidenceBand": "low",
  "writingPatternNotes": ["string"],
  "sentenceAssessments": [
    {
      "text": "string",
      "probability": 0.0,
      "reason": "string"
    }
  ]
}
```

Rules:

- Validate Gemini output with Zod.
- Clamp probabilities to 0-100 or 0-1 consistently with existing schema.
- Do not treat AI score as proof of misconduct.
- If Gemini fails or key is missing, use heuristic AI detector.

Heuristic AI detector fallback should use:

- sentence length consistency
- lexical diversity
- repeated generic transition phrases
- overly polished/template-like phrasing
- low burstiness approximation
- repeated conclusion-like wording

### 5C. Academic metadata matching with OpenAlex

Implement OpenAlex client module.

Behavior:

1. Use `OPENALEX_API_KEY` if provided.
2. Use `OPENALEX_MAILTO` in requests where useful.
3. Query OpenAlex Works using title-like phrases or distinctive keyphrase chunks.
4. Return academic metadata matches:
   - title
   - authors if available
   - publication year if available
   - source/venue if available
   - DOI or OpenAlex URL if available
   - abstract/snippet if available
5. Store as `source_matches` with source type `academic`, or store in report metadata if existing DB schema does not support source type.

If OpenAlex fails:

- continue without failing scan
- mark academic provider fallback/unavailable in metadata

### 5D. Grammar/spell check with LanguageTool

Implement LanguageTool public API client.

Behavior:

1. Send POST request to `LANGUAGETOOL_URL`.
2. Use `language=en-US` or env value.
3. Keep text length under public API limits using truncation/chunking.
4. Map matches to existing `grammar_findings`:
   - message
   - offset
   - length
   - replacement suggestions
   - rule ID/category in metadata if possible

If LanguageTool fails:

- use local fallback:
  - repeated word detection
  - common misspellings dictionary
  - very long sentence warning
  - double spaces / punctuation spacing
- mark grammar provider fallback in metadata

## 6. Database/schema handling

Inspect existing schema first.

If existing `source_matches`, `scan_results`, `ai_assessments`, and `grammar_findings` already support required fields, reuse them.

If required fields are missing, add minimal migrations only. Suggested additions if needed:

- `source_matches.source_type` text or enum: `web | academic | local | demo`
- `source_matches.provider` text nullable
- `source_matches.snippet` text nullable
- `source_matches.metadata` JSON nullable
- `scan_results.provider_metadata` JSON must include provider, subproviders, fallback flags, API usage summary, disclaimer type

Do not break existing migrations.

Run migrations only if schema changed.

## 7. Report page requirements

The report page must clearly show:

- provider badge: Mock / Demo Real / Certified
- disclaimer:
  “Demo Real uses Tavily, Gemini, OpenAlex, and LanguageTool/free APIs. Results are for demonstration and review support only, not certified plagiarism proof.”
- overall similarity score
- web similarity/source matches
- academic metadata matches
- AI probability
- confidence band
- sentence-level AI assessments
- grammar/spell findings
- highlighted submitted chunks
- bibliography/quote/small-match exclusion summary
- scan timeline/status
- PDF export button
- reviewer notes and decision status if available
- fallback indicators if any provider failed

Do not combine similarity and AI into one misconduct score.

## 8. Dedicated checker pages

Implement these pages as demo-friendly entry points:

### `/plagiarism-checker`

- Focused plagiarism/web-source checker.
- Upload or paste text.
- Shows source matching explanation.
- Starts scan with mode `plagiarism` or full scan if existing pipeline requires full scan.

### `/ai-detector`

- Focused AI-content likelihood checker.
- Upload or paste text.
- Shows AI probability, confidence band, writing pattern notes.
- Uses Gemini if available, heuristic fallback if not.

### `/grammar-checker`

- Focused grammar/spell checker.
- Paste text or upload.
- Shows grammar/spell findings and suggestions.
- Uses LanguageTool public API if available.

### `/scan/new`

- Unified New Check wizard.
- Step 1: choose check type: Full Originality Report / Plagiarism / AI Detector / Grammar.
- Step 2: paste or upload file.
- Step 3: choose exclusions.
- Step 4: start scan.
- Step 5: redirect to submission detail/report.

## 9. Demo seed data

Add a demo seed script if not already present:

```txt
npm run db:seed:demo
```

Seed data should include:

- demo tenant
- super admin/admin/reviewer/user if needed
- at least 3 demo submissions:
  1. high similarity demo
  2. likely AI-written demo
  3. grammar issues demo
- at least 1 completed scan result
- at least 1 review case in reviewer queue
- source matches and AI assessments so UI is not blank if APIs are unavailable

Demo seed must not delete existing user data unless explicitly requested.

## 10. Documentation updates

Update or create:

- `.env.example`
- `.env.demo.example`
- `docs/demo-real-provider.md`
- `docs/demo-ui-flow.md`
- `docs/uat-results.md`
- `docs/mvp-release-notes.md`
- `AGENTS.md`
- `IMPLEMENTATION_TRACKER.md`

Docs must explain:

- what Demo Real does
- which APIs it uses
- what works without API keys
- what is fallback/heuristic
- what is not certified
- how to set `.env`
- how to run demo seed
- how to run scan worker
- how to test UI pages
- how to later replace with certified provider

## 11. Verification commands

Run as many as applicable:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run db:migrate
npm run db:seed:demo
npm run worker
```

If app can be started locally, smoke-test:

- `/dashboard`
- `/scan/new`
- `/plagiarism-checker`
- `/ai-detector`
- `/grammar-checker`
- `/submissions`
- `/submissions/[id]`
- `/submissions/[id]/report`
- `/reviewer/queue`
- `/reviewer/cases/[id]`
- `/api/health`

If Playwright or browser automation exists, use it. Otherwise document manual smoke checks in `docs/uat-results.md`.

## 12. Final output required

At the end, output:

1. UI remediation status: complete/partial/failed.
2. Demo-real provider status: complete/partial/failed.
3. Tavily integration status.
4. Gemini integration status.
5. OpenAlex integration status.
6. LanguageTool integration status.
7. Fallback behavior status.
8. `.env.example` / `.env.demo.example` status.
9. Demo seed status.
10. Pages added/changed.
11. Pages smoke-tested.
12. Commands run with pass/fail.
13. Bugs fixed.
14. Remaining blockers.
15. Human input still needed.
16. Whether UI now satisfies BoQ/SOW/Tech Spec demo expectations.
17. Explicit limitation statement:
    “Demo Real is suitable for product demonstration but is not certified plagiarism detection or full academic database coverage.”

## 13. Stop conditions

Stop and ask only if:

- repository does not build at all and root cause is unclear
- database migration conflict cannot be safely resolved
- existing schema is incompatible with required fields and needs architectural decision
- actual API keys are required to proceed with code compilation, which should not happen because fallback must work

Do not stop for missing Tavily/Gemini/OpenAlex keys. Use fallbacks.

