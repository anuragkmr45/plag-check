# User Guide

This guide covers the MVP user submission flow.

## Sign In

Open the application and sign in with the account provided by your institution. If sign-in fails, contact an institution admin or support contact.

## Create A Submission

Open `/submissions`, then create a new submission.

Provide a clear title and upload an accepted document type:

- PDF
- DOC
- DOCX
- TXT

Uploads are stored in tenant-scoped object storage. File size and monthly usage limits are controlled by the institution.

## Extraction And Preprocessing

After upload, run extraction where the action is available. The system stores extracted text and word count.

After extraction, run preprocessing where the action is available. Preprocessing applies bibliography, quote, small-match, and whitespace handling before scan work.

## Scan

After preprocessing, start a scan where the action is available. The local MVP queues scan work and processes it with a mock provider.

When the scan is complete, the submission shows similarity and AI summary information.

## Report

Open the report page to review:

- Similarity percentage.
- Source-wise matches and highlighted matched text.
- AI probability and AI assessments.
- Grammar and spelling findings.
- Exclusion and provider metadata.

Similarity and AI scores are indicators only. Final academic or administrative action must be based on human review and institutional policy.

## PDF Report

When available, generate or download the PDF report from the report flow. The generated PDF is stored as an immutable report snapshot.

## Support

Open `/support` to create a support ticket or add a comment to an existing ticket.

## Consent And Data Use

Submitted content is not eligible for repository reuse without submission-level consent metadata. The MVP stores consent and retention metadata but does not implement repository matching.
