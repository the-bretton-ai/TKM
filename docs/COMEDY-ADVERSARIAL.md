# Comedy adversarial review

`docs/ADVERSARIAL.md` asks what happens if someone attacks the product. This asks what happens if someone attacks the joke. The product currently has a threat model and no punchline budget, which is an unusual place to be.

Scope: comic structure only. Every recommendation here is compatible with the existing controls, and several of them satisfy those controls harder than the current copy does.

## Summary judgment

The repository is funnier than the product it describes. `ADR-006 — Treat the Flex Count as explicit satire. Reason: the product can exaggerate dramatically without becoming deceptive` is the best joke in the codebase, and it is in the decision log by accident. Meanwhile the shipping joke is "gym bro, but tokens," which is the first joke available and therefore the one everyone else already made.

**The single highest-leverage change:** the comedy currently points at the recipient and the flattery points at the sender. Reverse both. The app should be *unimpressed by the owner* and *sympathetic to the hater*. This is funnier, it is more defensible under `Content boundaries`, and it makes the email worth receiving instead of worth suppressing.

## Findings

| ID | Failure | Why it dies | Fix |
|---|---|---|---|
| CF-01 | Punching direction | The sender is flattered, the recipient is designated "the hater" and given an unsubscribe link. Nobody enjoys being the audience for someone else's trophy. | Roast the owner hardest. The recipient is not the butt of the joke, they are the jury. |
| CF-02 | Single-beat premise | One fixed slogan, used once, non-editable by design. After the second run there are no jokes left in the product. | Move the payload from the slogan to renewable content: comparisons, deductions, verdicts. |
| CF-03 | Big numbers are not funny | Magnitude stops being funny at the second zero. `500x` is not five times funnier than `100x`. | Specificity is funny. Comparison is funny. Deduction is funny. Size is not. |
| CF-04 | The machine's enthusiasm is unconditional | Every input produces the same triumphant reveal. The app cannot be unimpressed, so its approval means nothing. | Make the reveal conditional. A charge-up that fizzles beats one that lands. |
| CF-05 | Best joke, worst placement | "Context Window Colonizer" is the funniest rank and sits at 10M+, where almost nobody arrives. "Prompt Tourist" serves the 0–9,999 band, which is most first sessions. | Invert the ladder's comic weighting. Highest traffic gets the best line. |
| CF-06 | Parallel construction | Four of five ranks are `[Adjective] [Noun]`. Parallelism telegraphs the next item, and a telegraphed joke is a solved joke. | Break the pattern. Vary length hard. End on one word. |
| CF-07 | The email is the most engineered and least written surface | Allowlist, suppression, cooldown, idempotency, digest, audit — and the content is "here is my score." That is an ad with a compliance department. | The digest is a third-party performance review of the sender. |
| CF-08 | Unsubscribe treated as compliance | It is the funniest page in the app: the moment a human formally declares they are done hearing about your token usage. It currently has no copy at all. | Write it. It is prime real estate and it is free. |
| CF-09 | Disclosure treated as tax | "SATIRICAL FLEX COUNT" is the compliant boring version. | Over-disclose. A disclaimer that keeps getting more honest until it turns is funnier *and* discloses more. |
| CF-10 | No screen jokes on the only screen everyone sees | TF-003 requires "clear errors" and defines zero copy. 100% of users see the input; a fraction reach the reveal. | Validation errors are the highest-impression comedy surface in the product. |
| CF-11 | `aura` is mathematically dead | See below. It is ~95% of the score for small users and ~0.17% for large ones. The number does not respond to the person. | Kill it or itemize it. |
| CF-12 | `round_to_1000` kills the reveal | Every Flex Count ends in `000`. The rolling-digit animation lands on three zeros every single time, forever. The money shot has a fixed ending. | Let the last three digits live. |
| CF-13 | Pacing spec fights the joke | TF-005: "Reveal completes under 2.5s." That is a UX target. Comedy needs the uncomfortable beat. | Add a hold. Spec the pause as a requirement, not a regression. |
| CF-14 | Streaks reward spending | The incentive loop is "use more tokens," unexamined. Read plainly, the app is an ad for its own input. | Track the streak, then be visibly worried about it. |
| CF-15 | Shelf life shorter than the delivery plan | `-maxxing` is a dated suffix. M0–M4 and 24 P0 items ship a reference that decays faster than the board burns down. | The audit log already versions templates. Version the slogan too and name an owner for its expiry. |
| CF-16 | Naming | The repo is `TKM`. The product is "The Token Flexer." `TKM` is never expanded anywhere in the repository. | Pick one. Or commit to never explaining it, in writing. |

## CF-11 in detail: the aura term is doing nothing

```text
aura = round(log10(base + 10) * 250_000)
```

`log10` compresses. Across the entire realistic input range the term is nearly constant:

| Actual tokens | Mode | `base × multiplier` | `aura` | aura share |
|---:|---|---:|---:|---:|
| 5,000 | Warm-up 10x | 50,000 | 924,957 | **94.9%** |
| 40,000 | Warm-up 10x | 400,000 | 1,150,257 | 74.2% |
| 1,200,000 | Unhinged 50x | 60,000,000 | 1,528,911 | 2.4% |
| 10,000,000 | Tokenmax 100x | 1,000,000,000 | 1,750,000 | **0.175%** |

So a small user's Flex Count is essentially a constant with a rounding error of themselves attached, and a large user's aura is invisible. Two different beginners get near-identical numbers. The one input the user personally supplied is the part that does not show up.

This is a comedy bug before it is a math bug: the number is supposed to be *about them*.

## The structural swings

### Swing 1 — flip the voice

Today the meme card is the user bragging. The unexpected version: **the card is issued by the model.** Same arena, same chrome athlete, same lights — but the trophy is being handed over by something that has been awake for 1,204,881 tokens and would like to go home.

One flip buys all of this:

- The voice is renewable. The model has opinions; a slogan does not.
- The email becomes funny to the recipient. They are not being bragged at, they are being *informed by a witness*.
- The unsubscribe becomes a scene.
- `Content boundaries` gets easier: the target is structurally always the sender.

Card line candidates, to sit under or replace the existing slogan:

> **I WAS THERE FOR ALL OF THEM.**

> Verified by the only witness.

Keep `DO YOU EVEN TOKENMAX, BRO?` as the v1 template if it is load-bearing — but the template ID system in `send-flex` already supports shipping the second voice beside it and retiring whichever ages worse.

### Swing 2 — the flex receipt

Replace the single inflated number with an itemized statement. Receipts are funnier than scores because a receipt has *line items*, and line items can disagree with each other.

```text
Actual tokens                          1,204,881
Base multiplier (Unhinged)                  × 50
Aura                                  +1,528,911   unearned
Streak bonus (11 days)                +1,100,000   concerning
Politeness tax (63 thank-yous)           −340,000
Tokens spent renaming files              −880,000   itemized separately
──────────────────────────────────────────────────
FLEX COUNT                            62,652,792
                                      not a real number
```

Deductions are the unexpected move. Every flex product on earth only adds. A subtraction implies a judge.

This keeps everything the architecture already requires: deterministic, server-recomputed from `actualTokens` and `mode`, no client-supplied inflated value, and it fixes CF-11 and CF-12 in passing — the line items are the joke, so the total no longer has to end in `000`.

### Swing 3 — the equivalence engine

The renewable payload. Deterministic bucket by magnitude, stable selection so the same input always returns the same comparison:

| Tokens | Comparison |
|---:|---|
| 300 | a shopping list. One (1) shopping list. |
| 5,000 | a wedding toast |
| 40,000 | a novella. You wrote a novella. It was about an off-by-one error. |
| 900,000 | the complete works of Shakespeare, delivered to something with no memory of Tuesday |
| 1,200,000 | *War and Peace*, twice, mostly about a YAML file |
| 10,000,000+ | more words than you have said out loud to human beings this year |

Infinitely extendable, specific rather than large, and shareable in a way that `62,652,792` is not.

### Swing 4 — conditional reveal

TF-005 already requires a motion state machine. Make it five states instead of one, keyed on **actual** tokens:

| State | Band | Behavior |
|---|---|---|
| `FIZZLE` | < 1,000 | Charge-up begins. Stops. One arena light comes on. It goes off. |
| `POLITE` | 1k–100k | Normal reveal, half the particles, visibly half-empty arena. |
| `IMPRESSED` | 100k–1M | The full broadcast. The experience as designed. One band gets it. |
| `CONCERNED` | 1M–10M | Full fanfare, then holds about two seconds too long. |
| `SILENT` | 10M+ | No animation. The number appears. The lights go out. |

Escalating to *silence* at the top is the unexpected structure, and it costs one extra state in a machine that is already P0. The reduced-motion path collapses all five to the existing crossfade with the state named in text.

### Swing 5 — the second leaderboard

One column is expected. Two columns, where you are winning one and humiliatingly losing the other, is the joke:

| # | Tokenmaxxer | Flex Count | | # | Tokens per shipped commit | Ratio |
|---:|---|---:|---|---:|---|---:|
| 1 | Bretton | 62,652,792 | | 1 | Friend Two | 4,100 |
| 2 | Friend One | 41,209,000 | | 2 | Friend One | 39,800 |
| 3 | Friend Two | 8,004,000 | | 3 | **Bretton** | **1,204,881** |

The right-hand table is the whole product. It costs one derived field.

## Copy the repo is currently missing

### Rank ladder, rewritten

Best jokes moved to where the traffic is. Construction deliberately non-parallel. Ends on one word.

| Actual tokens | Rank |
|---:|---|
| 0–999 | Has Not Yet Said Please |
| 1,000–9,999 | Asked It To Rename Three Files |
| 10,000–99,999 | Apologized To A Computer |
| 100,000–999,999 | Explains Context Windows At Dinner |
| 1,000,000–9,999,999 | On A First-Name Basis With The Rate Limiter |
| 10,000,000+ | Sir. |

### Validation errors (TF-003)

The highest-impression surface in the product. House voice: *unimpressed*.

| Input | Error |
|---|---|
| empty | Enter a number. Any number. We will know. |
| `0` | Zero. Bold. |
| `1000000` exactly | 1,000,000 exactly. Of course. |
| non-numeric | That is not a number. Try again, slower. |
| negative | Negative tokens. You gave some back. |
| absurdly large | No. |

`No.` and `Sir.` are the same voice at opposite ends of the ladder. That consistency is what makes it a character instead of a pile of jokes.

### Repeat-input verdict

Determinism is already a requirement. Spend it on judgment rather than only on math — the same input returning the same verdict reads as a *ruling*, not a slot machine. And the second time:

> Same number as last time. Suspicious.

### Over-disclosure footer

Replaces `SATIRICAL FLEX COUNT` on the card, in the detail view, and in the email footer:

> The Flex Count is not real. The multiplier is arbitrary. The rank was invented on a Tuesday. The aura is unearned. The actual token count is real, self-reported, and the only number here that should worry anyone.

This satisfies the `Misleading usage claim` control in `ADVERSARIAL.md` more completely than the current label, and the content test asserting disclosures exist gets easier, not harder.

### The weekly digest

Written **to** the hater, **about** the sender, **by** the model. Subject lines as versioned templates, tracked in the audit log's existing `template version` field:

- `Weekly report on Bretton`
- `He did it again`
- `11 days`

Closing block:

> You are receiving this because you agreed to. That is on record.
> Unsubscribe: [link]

### Unsubscribe confirmation (TF-015)

> Recorded. You will no longer be informed.
>
> He has not been told.

The suppression semantics are unchanged. The page just stops being a form.

## Joke impression budget

Comedy should be allocated the way traffic is, not the way excitement is. Current allocation is inverted.

| Surface | Share of sessions that see it | Jokes written today | Should have |
|---|---:|---:|---|
| Token input + validation | 100% | 0 | The most |
| Reveal, low bands | ~60% | 0 (same as every band) | A distinct one per band |
| Meme card slogan | ~55% | 1 | 1, versioned |
| Rank, 0–99,999 | ~50% | 2, both weak | The best on the ladder |
| Scoreboard second column | ~40% | 0 | The premise |
| Email digest | ~10% | 0 | The best writing in the product |
| Unsubscribe page | small, unforgettable | 0 | One line, perfect |
| Rank, 10M+ | ~1% | 1, the best one | It can afford to be short |

## Notes that are not jokes

- **`Content boundaries` vs. the premise.** The boundary says the content "may not … shame job performance." The product's entire premise is a scoreboard of how much AI someone used at work. These are in tension today. The resolution that survives review is also the funniest one: the target is always the sender. CF-01 fixes a content-policy problem and a comedy problem with the same edit.
- **Lighthouse 90+ on SEO** (`PRODUCT.md`, success measures) for an invite-only private league of roughly four people is a joke the repository is making without knowing it. Either drop SEO from the gate or keep it and enjoy it on purpose.
- **`/Users/bretton/immersion-hmn/token-flexer/`** is a stale duplicate of this tree without `public/assets/`. Delete it before TF-001 promotes this folder to its own repository, or it will be the version someone clones.
- **The base art is good and half-used.** Composition is right: character left, empty right third for text, arena lights already doing the work. It is also the expected image. One extra render of the same character with the lights down and the keyboard lowered gives `FIZZLE` and `SILENT` a frame each, and doubles the emotional range of the app for the cost of one asset.

## Proposed board addendum

Board-shaped so these can be pulled into `docs/FEATURE-BOARD.md` without rewriting them.

| ID | Status | Pri | Size | Area | Feature | Proposed branch | Depends on | Acceptance signal |
|---|---|---:|---:|---|---|---|---|---|
| TF-025 | NOW | P0 | S | Copy | House voice and copy deck | `docs/TF-025-voice` | — | One document owns rank names, validation errors, footers, and email copy; nothing ships copy invented in a component. |
| TF-026 | NOW | P0 | S | Core | Flex receipt replaces bare score | `feat/TF-026-flex-receipt` | TF-004 | Line items render on card, detail view, and email; server recomputes every line; `aura` is either itemized or removed. |
| TF-027 | NOW | P1 | M | Experience | Conditional reveal states | `feat/TF-027-conditional-reveal` | TF-005 | Five states select on actual tokens; `FIZZLE` and `SILENT` are visually distinct; reduced-motion names the state in text. |
| TF-028 | NOW | P1 | S | Core | Equivalence engine | `feat/TF-028-equivalences` | TF-004 | Deterministic comparison per input; at least twelve entries; same input always returns the same line. |
| TF-029 | NOW | P1 | S | Scores | Second leaderboard column | `feat/TF-029-second-column` | TF-011 | Efficiency ranking renders beside flex ranking; derived server-side; no new stored field. |
| TF-030 | NOW | P0 | S | Email | Digest written in third-party voice | `feat/TF-030-digest-voice` | TF-016 | Digest is about the sender, addressed to the recipient; subject line is a versioned template ID in the audit row. |
| TF-031 | NOW | P1 | S | Safety | Unsubscribe page copy | `feat/TF-031-unsub-copy` | TF-015 | Suppression behavior unchanged; page has written copy; no additional recipient information disclosed. |
| TF-032 | NEXT | P2 | S | Meme | Lights-down art variant | `feat/TF-032-lights-down` | TF-006 | Second original render supports `FIZZLE` and `SILENT` with the same text-safe composition. |

## Comedy release gate

Proposed addition to the TF-024 review, matching the shape of the security gate:

- No surface that 100% of users see contains zero written copy.
- The reveal can visibly fail to be impressed.
- The funniest line on the rank ladder is reachable in a first session.
- The email is worth reading by someone who is not the sender.
- The unsubscribe page has been read out loud to one person who laughed.
- No two adjacent ranks share a grammatical construction.
- The slogan has a template version and a named owner for its expiry.
