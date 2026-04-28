# Feature Budgets and Rate Limits

This local demo build protects external demo capacity with software feature budgets. User-facing UI must show feature names only, not internal vendor or API names.

## Feature Labels

- Full Checks
- Web Source Matching
- AI Writing Analysis
- Academic Source Lookup
- Grammar Review
- PDF Reports
- Fallback Scans
- Monthly Words Processed

## Default Monthly Budget

- Monthly Full Check limit: 300
- Monthly Word limit: 1,000,000
- Monthly Web Source Matching budget: 900 units
- Web Source Matching reserve: 100 units
- AI Writing Analysis monthly request budget: 300
- Academic Source Lookup monthly budget: 600 units
- Grammar Review monthly character budget: 5,400,000
- PDF report monthly limit: 500

## Default Rate Limits

- AI Writing Analysis: 10 requests per minute.
- Academic Source Lookup: 90 units per day.
- Grammar Review: 54,000 characters per minute.
- Grammar Review: 3 requests per minute.

## Standard Mode Calculation

- Standard mode uses 3 Web Source Matching units per scan.
- 300 standard scans/month use 900 Web Source Matching units.
- 100 units remain as reserve from the 1,000-unit free demo allowance.
- AI Writing Analysis uses 1 request per scan.
- 300 standard scans/month use 300 AI analysis requests.
- AI input is capped at 8,000 tokens and output at 1,024 tokens.
- Grammar Review uses up to 18,000 characters per standard scan.
- 300 standard scans/month use up to 5,400,000 grammar characters.
- Academic Source Lookup uses 2 units per standard scan.
- 300 standard scans/month use 600 academic lookup units.

## Deep Mode Calculation

- Deep Check counts as 2 Full Check units.
- Web Source Matching uses 6 units.
- AI Writing Analysis uses 1 request.
- Academic Source Lookup uses 3 units.
- Grammar Review uses up to 36,000 characters.

## Fallback Behavior

When one feature budget is exhausted, the scan continues with local fallback for that feature if fallback is enabled. The scan metadata records fallback state for review.

When all relevant external feature budgets are exhausted, the scan is blocked with a clear message unless the user selects Local Fallback Check.

## Enforcement Points

- Scan start checks Full Checks, Monthly Words Processed, deep-check capacity, and whether all external feature budgets are exhausted.
- The demo-real adapter checks feature budget before Web Source Matching, AI Writing Analysis, Academic Source Lookup, and Grammar Review calls.
- PDF export checks PDF Reports capacity before generating a PDF snapshot.
- Dashboard cards show used, remaining, reset time, low-budget warning, and critical state using feature labels only.

## Environment Controls

Use the `FEATURE_*`, `*_MONTHLY_*`, `*_DAILY_*`, `*_PER_MINUTE_*`, and scan-mode variables in `.env.example`, `.env.demo.example`, or `env.demo-ready.example`.
