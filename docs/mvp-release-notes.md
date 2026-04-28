# MVP Release Notes

Date: 2026-04-28

## Demo Build

This build adds a demo-ready provider and UI layer on top of the verified MVP.

Included:

- Demo Real scan provider selected by `SCAN_PROVIDER=demo-real`.
- Tavily web-source matching when `TAVILY_API_KEY` is present.
- Gemini AI-writing likelihood when `GEMINI_API_KEY` is present.
- OpenAlex academic metadata discovery.
- LanguageTool public grammar/spell checking.
- Mock and heuristic fallbacks with `provider_metadata.fallback=true`.
- Feature budgets and rate limits for Full Checks, Web Source Matching, AI Writing Analysis, Academic Source Lookup, Grammar Review, PDF Reports, Fallback Scans, and Monthly Words Processed.
- Dashboard feature-capacity cards that use feature labels only and do not expose internal vendor/API names.
- Scan mode selection for Standard Check, Deep Check, and Local Fallback Check with scan-cost previews.
- Demo seed script for non-empty dashboards, reports, and reviewer queue.
- Dedicated checker pages for plagiarism, AI detection, grammar, reports, and new scans.
- Report UI with provider badge, fallback status, source matches, academic metadata, AI sections, grammar findings, highlighted chunks, exclusions, PDF export, reviewer notes, and demo disclaimer.

## Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run db:migrate
npm run db:seed:demo
npm run worker
```

## Not Included

- Certified plagiarism detection.
- Paid academic database coverage.
- Brave Search, Google CSE, or Semantic Scholar integration.
- Google Docs import, LMS/LTI, institutional repository matching, fact-checking, or advanced analytics.

## Production Gates

Production release still needs hosting, domain/SSL, production secrets, backup destination, legal/privacy approval, security review, UAT sign-off, and certified provider decisions if certification is required.
