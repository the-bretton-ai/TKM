# Feature board

This file is the portable source of truth until the issues are created in a dedicated GitHub repository. Each item already has an issue ID, proposed branch, priority, size, dependency, and acceptance signal.

## Board rules

- **NOW** — required for the first deploy; work may start when dependencies are clear.
- **NEXT** — first follow-up milestone after the MVP is live.
- **LATER** — valuable, deliberately outside current scope.
- **DONE** — merged to `main` and verified in production or a deploy preview.
- **BLOCKED** — cannot advance without a named external decision or credential.

Priority is `P0` launch-blocking, `P1` important, `P2` enhancement. Size is `S` (hours), `M` (roughly a day), or `L` (multi-day and should be split before implementation).

## Launch board

| ID | Status | Pri | Size | Area | Feature | Proposed branch | Depends on | Acceptance signal |
|---|---|---:|---:|---|---|---|---|---|
| TF-001 | NOW | P0 | S | Repo | Standalone project scaffold | `chore/TF-001-scaffold` | — | Clean install, dev, test, and build commands are documented and pass. |
| TF-002 | NOW | P0 | M | Design | Visual system and responsive shell | `feat/TF-002-visual-system` | TF-001 | Desktop and 390px layouts match the product direction with no overflow. |
| TF-003 | NOW | P0 | M | Core | Token input and saved presets | `feat/TF-003-token-input` | TF-001 | Valid counts accept separators; invalid, negative, and oversized values have clear errors. |
| TF-004 | NOW | P0 | S | Core | Deterministic Flex Engine | `feat/TF-004-flex-engine` | TF-003 | Formula, modes, rounding, and rank boundaries have unit tests. |
| TF-005 | NOW | P1 | M | Experience | Animated reveal sequence | `feat/TF-005-flex-reveal` | TF-002, TF-004 | Reveal completes under 2.5s and has a reduced-motion path. |
| TF-006 | NOW | P0 | M | Meme | Original hater-meme base art | `feat/TF-006-meme-art` | TF-002 | Original licensed-for-project image exists in the repo with a text-safe composition. |
| TF-007 | NOW | P0 | M | Meme | Browser meme compositor | `feat/TF-007-meme-compositor` | TF-004, TF-006 | Exact slogan, counts, and rank render sharply to downloadable PNG. |
| TF-008 | NOW | P1 | S | Sharing | Download, copy, and native share | `feat/TF-008-share-actions` | TF-007 | PNG download works; supported devices receive a share payload; fallbacks are visible. |
| TF-009 | NOW | P0 | M | Scores | Local history, deltas, and streaks | `feat/TF-009-local-history` | TF-004 | Refresh preserves history; newest run, previous delta, and streak are correct. |
| TF-010 | NOW | P0 | M | Scores | Shared scoreboard API | `feat/TF-010-scoreboard-api` | TF-001, TF-004 | Valid entries persist; reads expose no emails or secrets; malformed writes fail closed. |
| TF-011 | NOW | P1 | M | Scores | Scoreboard interface | `feat/TF-011-scoreboard-ui` | TF-002, TF-010 | Ranking, current-user highlight, empty state, loading, and failure states are complete. |
| TF-012 | NOW | P0 | M | Email | Email preview and template | `feat/TF-012-email-preview` | TF-007 | Preview matches delivered structure and visibly labels satire/self-reported data. |
| TF-013 | NOW | P0 | M | Safety | Recipient allowlist and send authorization | `feat/TF-013-send-guard` | TF-001 | Requests without the send key or approved recipient fail without provider invocation. |
| TF-014 | NOW | P0 | M | Email | On-demand email function | `feat/TF-014-send-email` | TF-012, TF-013 | Approved test email sends once; failures are actionable; secrets never reach the client. |
| TF-015 | NOW | P0 | M | Safety | Suppression and unsubscribe flow | `feat/TF-015-unsubscribe` | TF-013, TF-014 | Suppressed recipient cannot be sent another message; link requires no account. |
| TF-016 | NOW | P0 | M | Automation | Weekly scoreboard digest | `feat/TF-016-weekly-digest` | TF-010, TF-014, TF-015 | Published scheduled function sends at most one digest per recipient per period. |
| TF-017 | NOW | P0 | S | Safety | Rate limits and idempotency | `feat/TF-017-rate-limits` | TF-014, TF-016 | Replays do not duplicate sends; burst requests receive a clear 429 response. |
| TF-018 | NOW | P1 | M | Observability | Delivery audit log | `feat/TF-018-delivery-audit` | TF-014 | Every attempt records timestamp, hashed recipient, template version, outcome, and request ID. |
| TF-019 | NOW | P0 | M | Quality | Accessibility and keyboard pass | `fix/TF-019-accessibility` | TF-002–TF-018 | Full flow works by keyboard and screen reader; contrast and focus states pass automated checks. |
| TF-020 | NOW | P0 | M | Quality | Unit and integration test suite | `test/TF-020-test-suite` | TF-004, TF-010, TF-014 | Formula boundaries and API denial/success paths run in CI without live email. |
| TF-021 | NOW | P0 | S | Delivery | GitHub Actions CI | `chore/TF-021-ci` | TF-001, TF-020 | Every PR runs typecheck, tests, build, and secret scan. |
| TF-022 | NOW | P0 | M | Delivery | Netlify production configuration | `chore/TF-022-netlify` | TF-010, TF-014, TF-016 | Deploy preview works; production env checklist is complete; scheduled function is visible. |
| TF-023 | NOW | P0 | S | Docs | Operator runbook and environment guide | `docs/TF-023-runbook` | TF-022 | A new owner can configure demo mode and live email from the README. |
| TF-024 | NOW | P0 | S | Release | v1 adversarial and release review | `chore/TF-024-release-review` | TF-001–TF-023 | All P0 gates pass and residual risks are recorded before the production alias moves. |

## Next board

| ID | Status | Pri | Size | Area | Feature | Proposed branch | Acceptance signal |
|---|---|---:|---:|---|---|---|---|
| TF-101 | NEXT | P1 | L | Import | OpenAI/Codex usage import | `feat/TF-101-openai-import` | User-approved export maps into actual-token history with provenance and no write-back. |
| TF-102 | NEXT | P1 | L | Import | Anthropic usage import | `feat/TF-102-anthropic-import` | Same normalized import contract as TF-101; unknown fields fail visibly. |
| TF-103 | NEXT | P1 | M | Groups | Private invite-only leagues | `feat/TF-103-private-leagues` | Invite token grants only the named league; scores are not globally discoverable. |
| TF-104 | NEXT | P2 | M | Meme | Meme backdrop selector | `feat/TF-104-meme-backdrops` | At least three original accessible variants preserve exact text readability. |
| TF-105 | NEXT | P2 | S | Sharing | Signed rematch links | `feat/TF-105-rematch-links` | Link opens a safe challenge state without exposing sender or recipient data. |
| TF-106 | NEXT | P2 | M | Insight | Actual-token trend report | `feat/TF-106-token-trends` | Weekly/monthly views use actual counts and distinguish missing days from zero. |
| TF-107 | NEXT | P2 | M | Platform | Installable PWA | `feat/TF-107-pwa` | Install prompt, offline shell, and update behavior pass mobile checks. |

## Later board

| ID | Status | Pri | Size | Area | Feature | Why later |
|---|---|---:|---:|---|---|---|
| TF-201 | LATER | P2 | L | Identity | Account sign-in | The owner-key model is enough for v1; auth adds major surface area. |
| TF-202 | LATER | P2 | L | Social | Reactions and comments | Moderation and notification burden outweigh launch value. |
| TF-203 | LATER | P2 | L | Platform | Multi-tenant admin | The first version is a personal/friends product, not SaaS. |
| TF-204 | LATER | P2 | L | Monetization | Paid leagues | Validate repeat usage before adding billing or entitlement logic. |

## Dependency spine

```text
TF-001 scaffold
  ├─ TF-002 visual system ─ TF-005 reveal
  ├─ TF-003 token input ─ TF-004 flex engine ─ TF-007 meme ─ TF-008 sharing
  │                                      └─ TF-009 history
  ├─ TF-010 scoreboard API ─ TF-011 scoreboard UI
  └─ TF-013 send guard ─ TF-014 email ─ TF-015 suppression ─ TF-016 automation
                                                └─ TF-017 limits

All product paths ─ TF-019 accessibility ─ TF-020 tests ─ TF-021 CI
Server paths ──────────────────────────────────────── TF-022 deploy ─ TF-024 release
```

## GitHub Project setup

Create one GitHub Project named **Token Flexer — Build Board** with these fields:

| Field | Type | Values |
|---|---|---|
| Status | Single select | Backlog, Ready, In progress, In review, Blocked, Done |
| Priority | Single select | P0, P1, P2 |
| Size | Single select | S, M, L |
| Area | Single select | Core, Design, Meme, Scores, Email, Automation, Safety, Quality, Delivery, Docs |
| Milestone | Single select | MVP, Next, Later |
| Target date | Date | Set only when work is pulled into Ready |

Recommended views:

1. **Launch board** — board grouped by Status, filtered to Milestone = MVP.
2. **Dependency table** — table sorted by ID with Status, Priority, Size, and blocked-by links.
3. **Release roadmap** — roadmap grouped by Milestone.
4. **Safety gate** — table filtered to Area = Safety or P0.

The repository includes structured issue forms and a pull request template under `.github/`. They become active when this folder is promoted to its own repository and merged to the default branch.
