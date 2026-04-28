# Security Hardening Notes

## P7-T1 MVP Controls

- Security headers are set globally from `next.config.ts`.
- Login is rate-limited by client IP with a short fixed window.
- Upload is rate-limited by client IP before multipart parsing.
- Cookie-authenticated state-changing API routes use a same-origin CSRF check based on `Origin` or `Referer`.
- The PDF report route also uses the same-origin check because it creates a report snapshot even though it is a `GET` endpoint.
- Server Actions rely on Next.js same-origin action handling plus `sameSite=lax` httpOnly session cookies; P7-T1 API helpers document the same strategy for route handlers.
- Upload validation checks MIME type, filename safety, expected extension, non-empty size, byte-size consistency, and basic file signatures.
- API routes use centralized JSON error helpers for safe client-facing errors.

## Deferred Hardening

- Distributed rate limiting should move from the MVP in-memory limiter to PostgreSQL or a dedicated edge/cache layer before horizontal production scaling.
- Formal CSP tightening should be revisited after production asset domains are known.
