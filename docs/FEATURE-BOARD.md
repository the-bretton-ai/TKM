# Feature board

The 75-minute sprint is complete. Every item below is merged on `main` and verified, with 39 tests green.

Work that did not land is not listed here — it is recorded with its acceptance criteria in [Remaining](REMAINING.md), so this board stays a record of what shipped rather than a mix of both.

## Status rules

- **DONE** — merged and verified.
- **STRETCH** — deliberately outside the shipped scope.
- **LATER** — valuable after the deployed proof is working.

Priority is `P0` launch-blocking, `P1` impactful, `P2` later. Size is a sprint timebox, not an estimate.

## Shipped

| ID | Status | Pri | Timebox | Feature | Branch | Acceptance signal |
|---|---|---:|---:|---|---|---|
| TF-001 | DONE | P0 | 5m | GitHub-ready product contract | `main` | TKM has product, adversarial, architecture, delivery, issue, and PR docs. |
| TF-002 | DONE | P0 | 15m | Premium responsive Flex Lab | `main` | Entry gates the reveal; board, analysis and aftercare render on submit. |
| TF-003 | DONE | P0 | 7m | Tested deterministic Flex Engine | `main` | Parsing, rank boundaries, multiplier, aura and streak formula pass unit tests. |
| TF-005 | DONE | P0 | 5m | Last Place Engine and rigged board | `main` | Entrant finishes sixth below the five fixed names; 22 tests cover determinism, ties, name collisions and the reading list. |
| TF-006 | DONE | P0 | 10m | Dynamic daily email comedy pack | `main` | 7 curated subject/body jokes and 3 images rotate deterministically by date and recipient. |
| TF-007 | DONE | P0 | 10m | Safe manual + daily delivery | `main` | Alias allowlist, send key, consent, suppression, idempotency and cooldown gate every send; 5 denial tests assert the provider is never reached. |

Six of six. `npx tsc --noEmit` clean, `npm run test:run` green at 39 tests across 4 files, production build and secret scan passing in CI on every pull request.

## Dependency spine

```text
TF-001 product contract
  └─ TF-002 Flex Lab ─┬─ TF-003 Flex Engine ─── TF-005 last place
                      └─ TF-006 comedy pack ─── TF-007 safe delivery

All paths ─ CI: typecheck, tests, build, secret scan
```

## Email rotation contract

The scheduled function may run hourly, but it sends only when all gates pass:

1. Recipient alias exists in server configuration.
2. Recipient has explicit `consent: true`.
3. Recipient is not suppressed.
4. The current UTC hour matches that recipient's deterministic daily send window.
5. No successful delivery record exists for that alias and date.

Daily variation is deterministic and testable:

```text
variant_index = stable_hash(recipient_alias + local_date) % 7
image_index   = stable_hash(local_date + recipient_alias + "image") % 3
send_hour     = window_start + stable_hash(local_date + alias + "hour") % window_length
```

This makes the subject, joke, picture, and time feel different without using an LLM inside the delivery path, inventing hostile copy, or making tests flaky.

## Last place contract

The scoreboard is generated, not collected. Five fixed names hold the board — Nick, Matty, Bretton, Mike, G — and whoever fills in the blank finishes sixth. Always.

```text
standings = stable_hash("order" + local_date)              // G never below second
gap       = tie ? 0 : max(1, round(random()^2.5 * 40))     // margins skew small on purpose
fifth     = actual_tokens + gap
fourth..first = each scaled above the last, strictly apart
reading   = 3 links drawn from the band for actual_tokens
```

Two seeds, on purpose. **Standings** come from the date alone, so the entrant's number never reshuffles the five — they simply all had a bigger day. **Counts** come from the entrant's number, so the ladder scales with whatever they enter.

Fifth place may land exactly on the entrant's count; a named tiebreak then resolves against them. Every board also carries three "Recommended for you" links, banded so a small count reads as inexperience and a large one reads as a problem.

Full specification: [The Last Place Engine](LAST-PLACE.md). Comedy findings behind it: [Comedy adversarial review](COMEDY-ADVERSARIAL.md).

Because the board is generated, there is no shared score store to tamper with and no other person's real data on it. **Score tampering** and **privacy leakage** in the adversarial review largely dissolve.

## Stretch only after the P0 gate

| ID | Status | Pri | Feature | Why it is not in the 75-minute path |
|---|---|---:|---|---|
| TF-101 | STRETCH | P2 | Native share sheet | PNG download already creates the core artifact. |
| TF-102 | STRETCH | P2 | Shared server scoreboard | Obviated, not deferred: the board is generated, so there is nothing to collect. |
| TF-103 | STRETCH | P2 | Email delivery audit viewer | Delivery records can be inspected in storage/logs for v1. |

## Later board

| ID | Status | Feature | Release test before promotion |
|---|---|---|---|
| TF-201 | LATER | OpenAI/Codex usage import | Read-only export provenance and schema-drift handling. |
| TF-202 | LATER | Anthropic usage import | Same normalized import contract as TF-201. |
| TF-203 | LATER | Private leagues | Invite-scoped access and non-discoverable scores. |
| TF-204 | LATER | Account sign-in | Only after the owner-key personal version proves repeat use. |
| TF-205 | LATER | Meme season packs | Original/licensed artwork with accessibility and email-client checks. |

## GitHub Project configuration

Project name: **Token Flexer — 75 Minute Build**

Fields:

| Field | Type | Values |
|---|---|---|
| Status | Single select | Backlog, Ready, In progress, In review, Blocked, Done |
| Priority | Single select | P0, P1, P2 |
| Timebox | Single select | 3m, 5m, 7m, 10m, 15m |
| Area | Single select | Product, UI, Core, Meme, Scores, Email, Safety, Quality, Deploy |
| Milestone | Single select | 75-minute MVP, Stretch, Later |

Views:

1. **Sprint board** — grouped by Status, filtered to 75-minute MVP.
2. **Safety gate** — table filtered to P0 or Area = Safety.
3. **After launch** — board filtered to Stretch or Later.

## Definition of done

An item is Done only when its acceptance signal is observable, the relevant test passes, mobile behavior is checked, and no real email address, key, or provider payload has entered git history.
