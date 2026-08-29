# Delivery plan

## Milestones

### M0 — Product contract

**Outcome:** the scope, visual direction, architecture, adversarial boundaries, and feature board are reviewable.

Exit gate:

- Product brief names the launch experience and non-goals.
- Every MVP feature has an ID, branch, dependency, and acceptance signal.
- Email abuse cases have structural controls, not policy-only promises.

### M1 — Flexable demo

**Outcome:** a visitor can enter tokens, get the reveal, render the meme, download it, and see local history without credentials.

Includes TF-001 through TF-009.

Exit gate:

- Full happy path works at 390px and desktop widths.
- Flex calculation boundaries pass tests.
- Meme output contains exact text and remains sharp at share size.
- Demo never claims an email was sent.

### M2 — Connected scoreboard

**Outcome:** scores persist safely and render from the live server.

Includes TF-010 and TF-011.

Exit gate:

- Public API returns the documented safe projection only.
- Server recomputes every flex score.
- Empty, loading, retry, and offline states are complete.

### M3 — Safe send

**Outcome:** the owner can preview and send one approved email; the recipient can unsubscribe.

Includes TF-012 through TF-015 and TF-017 through TF-018.

Exit gate:

- Allowlist, send-key, suppression, cooldown, idempotency, and rate-limit tests pass.
- A provider sandbox/test address receives the expected email.
- Delivery logs contain no plaintext recipient address.

### M4 — Automation and release

**Outcome:** weekly digest is scheduled and the production deployment is operable.

Includes TF-016 and TF-019 through TF-024.

Exit gate:

- Scheduled function can be manually invoked in a deploy preview and is scheduled on the published deploy.
- CI, build, accessibility, and adversarial gates pass.
- Runbook covers setup, rollback, send disablement, and key rotation.
- Production URL is smoke-tested on desktop and mobile.

## Branch strategy

Use trunk-based development with short-lived branches:

```text
main                         always deployable
feat/TF-###-short-slug       user-visible behavior
fix/TF-###-short-slug        defect or security correction
chore/TF-###-short-slug      delivery/tooling/maintenance
docs/TF-###-short-slug       documentation-only change
test/TF-###-short-slug       test infrastructure or coverage
```

Rules:

- Branch from the latest `main`.
- Keep one primary board item per pull request.
- Link the issue with `Closes #…` only when all acceptance criteria are satisfied.
- Prefer a sequence of reviewable vertical slices over a long-lived `develop` branch.
- Deploy previews are the review environment; production follows `main`.
- Urgent fixes branch from `main`, receive a focused regression test, and merge back through a pull request.

## Pull request evidence

Each PR includes:

- What changed and which TF item it satisfies
- Desktop and mobile screenshots for visual work
- Test/build commands and results
- Accessibility notes for interactive work
- Security/privacy impact for server, email, or persistence work
- Environment changes with secret values omitted
- Rollback note if it changes data or delivery behavior

## Verification matrix

| Layer | Required checks |
|---|---|
| Pure logic | Unit tests for formula, ranks, formatters, streaks, signatures, and idempotency. |
| UI | Component/integration tests for token flow, reveal, share fallback, email preview, and error states. |
| API | Schema, authorization, origin, limits, safe projection, suppression, and provider-failure tests. |
| Browser | Chromium happy path at desktop and 390px; keyboard-only pass; reduced motion. |
| Build | Typecheck, lint, unit/integration tests, production build, secret scan. |
| Deploy preview | Demo smoke test, server test invocation, headers, and no production schedule side effect. |
| Production | URL/asset/API smoke test, one controlled email, audit record, scheduled-function visibility. |

## Deployment checklist

1. Create a dedicated GitHub repository for this folder.
2. Add the issue forms and pull request template to its default branch.
3. Create the GitHub Project fields and views defined in the feature board.
4. Connect the repository to a new Netlify project.
5. Deploy demo mode first with no email credentials.
6. Configure the send key, signing secret, approved recipients, verified sender, and canonical origin in Netlify environment variables.
7. Use a provider sandbox or controlled address for the first live send.
8. Invoke the weekly function manually from a deploy preview and verify all non-consenting recipients are skipped.
9. Publish to production, verify the scheduled badge/next run, then smoke-test the site.
10. Record the production URL and release commit in the decision log.

## Rollback and kill switches

- Set `TOKEN_FLEXER_DEMO=true` to disable all provider sends while leaving the app usable.
- Roll back the site to the prior successful Netlify deploy for client or function regressions.
- Rotate `TOKEN_FLEXER_SEND_KEY` after any suspected disclosure.
- Rotate the email provider key independently from the app send key.
- Preserve suppression records across rollback and deploy changes.
- If delivery state is uncertain, fail closed and require a manual review before retrying.
