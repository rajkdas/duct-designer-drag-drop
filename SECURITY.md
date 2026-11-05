# Security Policy

## Reporting a vulnerability

Please use GitHub's **Private vulnerability reporting**: open the repo's
**Security** tab → **Report a vulnerability**. Do **not** open a public issue
for anything you believe is exploitable.

- Acknowledgement within **48 hours**.
- Fix or mitigation target for critical issues: **7 days**.

## Scope

In scope:

- The admin API (`src/app/api/admin/`) — session cookie signing (`ADMIN_SECRET`),
  password handling (`ADMIN_PASSWORD`), privilege escalation into
  admin-only endpoints (`/api/settings`, product sync, quote status changes).
- The public REST API (`src/app/api/designs/`, `/api/quotes/`, `/api/dealers/`) —
  input validation, injection, and abuse of the anonymous save/submit endpoints.
- The dealer embed path (`/?embed=1&dealer=…`, `public/embed.js`) —
  cross-tenant data leaks between dealer slugs, XSS through dealer branding.
- The sub-domain routing in `src/middleware.ts` (`ROOT_DOMAIN`).

Out of scope:

- Demo-mode database resets (the `/tmp` SQLite file is ephemeral by design).
- Client-side tampering with the plan state or BOM in a user's own browser.
- The self-service demo deployments made from this repository (they contain no
  real customer data by definition).

## Supported versions

| Version | Supported |
| --- | --- |
| 0.2.x | ✅ |
| < 0.2.0 | ❌ |

## Deployment hardening checklist

- Set `ADMIN_PASSWORD` and `ADMIN_SECRET` before sharing a public demo link —
  the `admin123` fallback exists only for first-boot convenience.
- Keep the admin URL (`/?admin=1`) out of customer-facing material.
- When using dealer sub-domains, scope wildcard DNS carefully — every
  `*.your-domain.com` host resolves to the same app.
