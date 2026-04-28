# Reviewer Guide

This guide covers the MVP reviewer workflow.

## Access

Sign in with a `REVIEWER` account and open `/reviewer/queue`.

Reviewers can see tenant-scoped review cases assigned to them or available within their tenant. Institution admins may have broader tenant review visibility where implemented.

## Review Queue

The queue lists cases that are ready for review. Open a case to see:

- Submission title and status.
- Report link when a report is available.
- Current review status.
- Notes and timeline events.

## Reviewing A Case

From the case page, a reviewer can:

- Assign the case where the action is available.
- Add review notes.
- Move the case through allowed statuses.
- Open the report page for similarity, AI, source-match, and grammar evidence.

Invalid status transitions are rejected by the service layer.

## Report Use

The report separates:

- Similarity score and source matches.
- AI probability and AI assessments.
- Grammar and spelling findings.
- Preprocessing exclusions.
- Provider metadata.

The MVP uses a mock scan provider. Scores and findings are indicators for workflow validation and must not be treated as final academic decisions without human review and institutional policy.

## Audit Trail

Review notes and status changes create review events and audit events. Use clear, factual notes that explain the review action taken.

## Limits

The MVP does not include LMS integration, Google Docs import, institutional repository matching, or a real external scan provider.
