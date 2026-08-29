# Decision log

Decisions stay here so the product does not quietly re-litigate its foundations in every branch.

| ID | Date | Status | Decision | Reason |
|---|---|---|---|---|
| ADR-001 | 2026-08-29 | Accepted | Ship a web app first. | Fastest shareable form with no install or store review. |
| ADR-002 | 2026-08-29 | Accepted | Use Vite + TypeScript for the client. | Small build, direct browser APIs, strong typing, simple Netlify output. |
| ADR-003 | 2026-08-29 | Accepted | Render final meme text in browser Canvas over original base art. | Exact text and numbers are more reliable than text baked into generated imagery. |
| ADR-004 | 2026-08-29 | Accepted | Use Netlify Functions and scheduled functions. | Matches the existing deployment ecosystem and avoids an always-on server/worker. |
| ADR-005 | 2026-08-29 | Accepted | Use Netlify Blobs for MVP state. | Adequate for one small private league without database administration. |
| ADR-006 | 2026-08-29 | Accepted | Treat the Flex Count as explicit satire. | The product can exaggerate dramatically without becoming deceptive. |
| ADR-007 | 2026-08-29 | Accepted | Address recipients by server alias, never arbitrary client email. | Prevents a public deployment from becoming a spam relay. |
| ADR-008 | 2026-08-29 | Accepted | Keep demo mode fully functional without credentials. | Allows immediate deployment and review before email/domain setup. |
| ADR-009 | 2026-08-29 | Accepted | Use trunk-based branches and deploy previews. | Keeps `main` releasable and avoids an unnecessary long-lived integration branch. |
| ADR-010 | 2026-08-29 | Proposed | Use Resend as the first transactional email provider. | Small HTTP API and straightforward templates; confirm when the owner chooses a sending domain. |
| ADR-011 | 2026-08-29 | Accepted | Cap the first implementation sprint at 75 minutes. | Forces the product to prove the reveal, rotating joke, safe send, tests, and deploy before infrastructure expansion. |
| ADR-012 | 2026-08-29 | Accepted | Rotate curated email variants deterministically rather than generate copy at send time. | Daily freshness stays funny, bounded, testable, fast, and resistant to hostile output. |
| ADR-013 | 2026-08-29 | Accepted | Cut the shared server scoreboard from the timed MVP. | Local persistence supplies enough product value; email safety matters more than public score writes. |

## Open decisions

| Question | Needed by | Default if unanswered |
|---|---|---|
| Which domain and sender name will deliver live email? | TF-014 | Keep live delivery disabled; demo preview remains available. |
| Which named recipients have explicitly agreed to receive the joke? | TF-013 | Empty allowlist. |
| Which weekday/time should the digest run? | TF-016 | Friday at 17:00 America/Puerto_Rico, translated to UTC in deployment config. |
| Should the dedicated GitHub repository be public or private? | TF-001 | Private. |
| Which open-source license, if any? | Before public release | All rights reserved. |
