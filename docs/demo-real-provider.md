# Demo Real Provider

`SCAN_PROVIDER=demo-real` enables a live-demo scan adapter. It is suitable for product demonstration, but it is not certified plagiarism detection or full academic database coverage.

## APIs Used

- Tavily Search API for web-source discovery: `https://api.tavily.com/search`
- Gemini API for AI-writing likelihood JSON analysis: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- OpenAlex Works API for academic metadata discovery: `https://api.openalex.org/works`
- LanguageTool public API for grammar/spell checks: `https://api.languagetool.org/v2/check`

Brave Search, Google CSE, and Semantic Scholar are not used.

## Environment

Use `.env.demo.example` or `env.demo-ready.example` as the local template.

Required local infrastructure variables remain PostgreSQL and MinIO. Demo API keys are optional because fallback remains enabled:

```txt
SCAN_PROVIDER=demo-real
ALLOW_FALLBACK=true
DEMO_WEB_SEARCH_PROVIDER=tavily
TAVILY_API_KEY=optional-for-live-web-results
DEMO_AI_PROVIDER=gemini
DEMO_AI_DETECTION_MODE=llm
GEMINI_API_KEY=optional-for-live-ai-results
DEMO_ACADEMIC_PROVIDER=openalex
OPENALEX_MAILTO=your-email@example.com
DEMO_GRAMMAR_PROVIDER=languagetool-public
LANGUAGETOOL_URL=https://api.languagetool.org/v2/check
```

## Fallback Behavior

If a key is missing, a request fails, or a public API is unavailable, the scan continues. The scan result stores `provider_metadata.fallback=true` and per-subprovider status under `provider_metadata.subproviders`.

Fallbacks are deterministic:

- Web similarity uses a local demo phrase corpus.
- AI likelihood uses a heuristic based on sentence consistency, lexical diversity, repeated transition phrases, and low burstiness.
- Academic metadata returns empty or seeded demo metadata.
- Grammar checks use repeated-word, common-misspelling, whitespace, and long-sentence rules.

## Running Locally

```bash
docker compose up -d
npm run db:migrate
npm run db:seed:demo
npm run dev
npm run worker
```

The worker processes queued scans. Demo seed creates completed reports so the UI is not blank even before a live API scan is run.

## Replacement Path

Certified provider work remains outside the demo-real scope. Replace this adapter later with a contract-backed provider adapter, provider-specific response validation, cost controls, legal approval, and UAT evidence.
