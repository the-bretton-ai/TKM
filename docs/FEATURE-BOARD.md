# Feature board

This board is deliberately sized for a **75-minute build sprint**, followed by tests and UI cleanup. Anything that does not improve the first flex, the rotating daily joke, or safe delivery has moved out of the MVP.

## Status rules

- **DONE** — merged and verified.
- **IN PROGRESS** — actively being implemented; only one or two items at once.
- **READY** — unblocked and part of the 75-minute sprint.
- **STRETCH** — pull only if every P0 item passes.
- **LATER** — useful after the deployed proof is working.

Priority is `P0` launch-blocking, `P1` impactful, `P2` later. Size is a sprint timebox, not an estimate.

## 75-minute MVP board

| ID | Status | Pri | Timebox | Feature | Branch | Acceptance signal |
|---|---|---:|---:|---|---|---|
| TF-001 | DONE | P0 | 5m | GitHub-ready product contract | `main` | TKM has product, adversarial, architecture, delivery, issue, and PR docs. |
| TF-002 | IN PROGRESS | P0 | 15m | Premium responsive Flex Lab | `feat/TF-002-flex-lab` | Token entry, 4 modes, dramatic reveal, mobile layout, and reduced motion work. |
| TF-003 | READY | P0 | 7m | Tested deterministic Flex Engine | `feat/TF-003-flex-engine` | Parsing, rank boundaries, multiplier, aura, and streak formula pass unit tests. |
| TF-004 | READY | P0 | 10m | Rotating meme deck and PNG receipt | `feat/TF-004-meme-deck` | At least 3 original pictures rotate by day; exact slogan and counts export to PNG. |
| TF-005 | DONE | P0 | 5m | Last Place Engine and rigged board | `feat/TF-005-last-place` | Entrant always finishes sixth below the five fixed names; determinism, tie, name-collision, and reading-list tests pass. |
| TF-006 | READY | P0 | 10m | Dynamic daily email comedy pack | `feat/TF-006-email-comedy` | 7 curated subject/body jokes and 3 images rotate deterministically by date/recipient. |
| TF-007 | READY | P0 | 10m | Safe manual + daily delivery | `feat/TF-007-safe-delivery` | Alias allowlist, send key, consent, unsubscribe, one/day cap, and variable send window gate every send. |
| TF-008 | READY | P0 | 5m | Adversarial and behavior tests | `test/TF-008-adversarial-tests` | Unknown alias, replay, suppression, bad input, and daily-rotation tests fail closed. |
| TF-009 | READY | P0 | 5m | UI/accessibility cleanup | `fix/TF-009-ui-cleanup` | 390px and desktop have no overflow; keyboard, focus, contrast, and reduced motion pass. |
| TF-010 | READY | P0 | 3m | Netlify deploy and smoke check | `chore/TF-010-deploy` | Production build deploys; demo works without credentials; live-send setup is documented. |

The timeboxes total 75 minutes. TF-001 is already complete, so its five minutes become contingency for tests or deploy friction.

## Dependency spine

```text
TF-002 Flex Lab ─┬─ TF-003 Flex Engine ─┬─ TF-004 meme deck
                 │                      └─ TF-005 last place
                 └─ TF-006 comedy pack ─── TF-007 safe delivery

All paths ─ TF-008 adversarial tests ─ TF-009 cleanup ─ TF-010 deploy
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
