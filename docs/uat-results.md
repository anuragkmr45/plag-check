# UAT Results

Date: 2026-04-28 10:55:07 IST

## Scope

This UAT record covers the local complete demo build, not production deployment or certified provider validation.

## Results

| Area | Status | Evidence |
|---|---|---|
| Environment validation | PASS | `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed with demo env validation tests. |
| Demo Real provider | PASS | Unit tests passed for fallback behavior; build includes `demo-real` adapter with Tavily, Gemini, OpenAlex, LanguageTool, and fallback metadata. |
| Demo seed | PASS | `npm run db:seed:demo` created three demo reports and one reviewer case. |
| Dashboard | PASS | Authenticated smoke returned 200 for `/dashboard`. |
| New scan | PASS | Authenticated smoke returned 200 for `/scan/new`. |
| Plagiarism checker | PASS | Authenticated smoke returned 200 for `/plagiarism-checker`. |
| AI detector | PASS | Authenticated smoke returned 200 for `/ai-detector`. |
| Grammar checker | PASS | Authenticated smoke returned 200 for `/grammar-checker`. |
| Submissions | PASS | Authenticated smoke returned 200 for `/submissions` and `/submissions/[id]`. |
| Reports | PASS | Authenticated smoke returned 200 for `/reports`, `/submissions/[id]/report`, and PDF export. |
| Reviewer queue | PASS | Authenticated smoke returned 200 for `/reviewer/queue` and `/reviewer/cases/[id]`. |
| Feature budgets | PASS | Added budget/rate-limit tests for scan estimates, caps, blocking logic, dashboard state, and vendor-free labels. |

## Command Evidence

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run test`: PASS, 30 files and 121 tests passed
- `npm run build`: PASS
- `npm run db:migrate`: PASS
- `npm run db:seed:demo`: PASS
- `npm run worker`: PASS, no queued scan jobs after seed
- Direct provider smoke: PASS, current `.env` returned live Tavily, Gemini, OpenAlex, and LanguageTool statuses without fallback.
- `/api/health`: PASS, 200
- Authenticated page smoke: PASS for all listed demo pages
- Feature budget unit tests: PASS, standard/deep estimates, one-feature fallback allowance, all-feature exhausted block logic, AI cap, grammar cap, and 300 standard scans x 3 Web Source Matching units = 900 units.

Notes:

- `npm run db:migrate` initially failed because `.env` pointed `DATABASE_URL` to `localhost:55432` while the running Docker Compose PostgreSQL service exposed `localhost:5432`. The local `.env` port was aligned and the command passed.
- The first smoke loop failed because a shell variable named `path` shadowed zsh command lookup. The smoke was rerun with a safe variable name and passed.

## Limitations

- Demo Real is suitable for product demonstration but is not certified plagiarism detection or full academic database coverage.
- Tavily and Gemini live behavior depends on valid API keys.
- OpenAlex and LanguageTool are public/free API integrations and may rate-limit.
- Production deployment still requires hosting, SSL, production secrets, backups, legal/privacy approval, security review, and UAT sign-off.
- Feature budgets are demo safeguards. They are not a production billing or certified provider contract system.
