# The Last Place Engine

## Premise

You enter your real daily token count. Four friends appear above you. You are last.

You are always last. Not usually, not on average — always, for every input, on every day, including the day you enter a number specifically to stop being last. The other four had a bigger day too. They always did.

This replaces the shared scoreboard as the second beat of the product. The card still inflates you; the board then puts you at the bottom of it. Setup, then the rug.

## Participants

```text
Nick    Matty    Bretton    Mike    G
```

Five names, fixed in code. The entry field is a select with exactly these five options and no "other" — if you are not one of them, you cannot use the app. Each of the five sees themselves in last place, which means all five are in last place, which is not a bug and is never mentioned in the UI.

`G` is never seated below second. This is not explained anywhere. When `G` is the one entering, `G` is last like everyone else and the board notes the anomaly:

> G is in last place. This has been logged.

## Why "anonymous"

The board calls itself anonymous and prints everyone's name. The footer resolves the contradiction without acknowledging it, and discloses the thing that actually matters:

> This scoreboard is anonymous. Participants are identified only by name. The other four counts are generated; yours is the only real number here.

That second sentence is load-bearing. Fabricated daily counts are attributed to four named real people, so the fabrication is labeled on the same screen, every time, and the board stays inside a private league. It satisfies `PRODUCT.md` principle 2 ("Absurd, not deceptive") and it is also the funnier line.

## Algorithm

Deterministic. The same person, day, and count always produce the same defeat.

```text
seed  = fnv1a(you | YYYY-MM-DD | actualTokens)   →  mulberry32
order = fnv1a(order | YYYY-MM-DD)                →  mulberry32
```

Two seeds, on purpose:

- **Standings** are seeded by the date alone. Re-entering a different number never reshuffles the people — they simply all had a bigger day. The race above you is real, ongoing, and none of your business.
- **Counts** are seeded by your number, so the ladder scales with whatever you enter.

```text
tie     = random() < 0.06
gap     = tie ? 0 : max(1, round(random()^2.5 × 40))
fourth  = actualTokens + gap
third   = fourth × (1.05 + r×0.12)
second  = third  × (1.15 + r×0.40)
first   = second × (1.80 + r×1.90)      × 3 on a 8% "someone had a day"
```

The cubic skew on `gap` keeps most margins in single digits. **Losing by four is worse than losing by four million**, and the engine is tuned for the former.

The three above fourth place are forced strictly apart after rounding. Fourth place is *not* — it is allowed to land exactly on your count, because a tie you then lose is funnier than a tie the engine quietly avoids. The whole ladder is scaled to stay inside the safe-integer range for absurd inputs.

### Tiebreaks

On a tie, a rule is named and applied. Every rule resolves against you.

```text
alphabetical    reverse alphabetical    earlier submission    later submission    coin toss
```

The rule changes day to day. It is stated plainly. Nobody comments on it.

> Tied for fourth. Tiebreak: reverse alphabetical. You lose.

## Copy

| Condition | Line |
|---|---|
| `gap === 1` | You were one token away. |
| `gap <= 12` | `{gap}` tokens. |
| `gap > 12` | Last place by `{gap}`. |
| tie | Tied for fourth. Tiebreak: `{rule}`. You lose. |
| you are `G` | G is in last place. This has been logged. |
| today ≥ 3× your last entry | You had a big day. So did `{fourth place}`. |
| always | Consecutive days in last place: `{n}`. Best finish: last. |

The escalation line is the renewable joke: it acknowledges you are trying, and then does not care.

## Sample output

```text
Last place by 29.  //  You had a big day. So did Mike.
01  Matty       4,433,464   +3,228,583
02  G           1,798,657     +593,776
03  Nick        1,379,520     +174,639
04  Mike        1,204,910          +29
05  Bretton     1,204,881      <- YOU
Consecutive days in last place: 47. Best finish: last.
```

## What this changes

| Doc | Change |
|---|---|
| `PRODUCT.md` | Signature experience gains a daily entry and a fixed defeat. The scoreboard is no longer "ranked by the flex." |
| `ARCHITECTURE.md` | `GET/POST /scores` is no longer required for the core loop. The board is computed client-side from one real number. |
| `ADVERSARIAL.md` | **Score tampering** and **privacy leakage** largely dissolve: there is no shared score store to tamper with and no other person's real data on the board. Tampering with your own number only changes how far ahead everyone else was. |
| `FEATURE-BOARD.md` | TF-010 and TF-011 shrink from "shared scoreboard API + UI" to "render the rigged board." |
| `DECISIONS.md` | Needs an ADR: the scoreboard is generated, not collected. |

The funny change is also the smaller and safer one. The core product now needs no server at all.

## Implementation

| File | Contents |
|---|---|
| `src/last-place.ts` | `PARTICIPANTS`, `buildBoard`, `dayKey`, `isParticipant`, `DISCLOSURE`. Pure and deterministic; no DOM, no storage. |
| `src/last-place.test.ts` | Invariants below, plus determinism, tiebreak, and copy tests. |
| `src/main.ts` | Participant select, board render, re-render on identity change. |

### Invariants under test

Checked across all five participants × four dates × eleven counts from `1` to `999,999,999,999,999`:

- You are in position five, exactly once, always.
- No generated count is ever below yours.
- The four above you are strictly ordered; fourth may tie you but never trail you.
- All five names appear exactly once.
- Every count is a safe integer.
- Changing your number never reshuffles the standings.
- `G` is never below second unless `G` is you.
