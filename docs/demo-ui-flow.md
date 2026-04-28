# Demo UI Flow

The live demo starts from `/dashboard` after login.

## Main Pages

- `/dashboard` shows admin analytics or the user dashboard.
- `/scan/new` starts a new check from pasted text or file upload.
- `/plagiarism-checker` focuses the demo around source matching.
- `/ai-detector` focuses the demo around AI-writing likelihood.
- `/grammar-checker` focuses the demo around grammar and spelling findings.
- `/submissions` lists submitted work.
- `/submissions/[id]` shows upload, extraction, preprocessing, and scan lifecycle state.
- `/submissions/[id]/report` shows the complete originality report.
- `/reports` lists completed reports.
- `/reviewer/queue` lists review cases.
- `/reviewer/cases/[id]` shows reviewer notes, assignment, and decision actions.

Super admins are global users, so create-submission forms show a tenant selector. Tenant admins, reviewers, and users create submissions inside their own tenant automatically.

## Report Demo Talking Points

The report separates:

- Similarity score and web-source matches.
- Academic metadata matches from OpenAlex.
- AI probability, confidence band, and sentence-level assessments.
- Grammar and spelling findings.
- Highlighted submitted chunks.
- Exclusion summary for bibliography, quotes, and small matches.
- Provider badge and fallback state.
- Reviewer notes and timeline.
- PDF export.

Use the disclaimer shown on Demo Real reports: results are for demonstration and review support only, not certified plagiarism proof.

## Seeded Demo Data

Run:

```bash
npm run db:seed:demo
```

The seed creates:

- A high-similarity report with a reviewer case.
- A likely AI-written report.
- A grammar-issues report.

Repeat runs replace only rows marked with the demo seed marker and do not delete arbitrary user data.
