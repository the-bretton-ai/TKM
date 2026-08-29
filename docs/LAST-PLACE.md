# The Last Place Engine

## Premise

Five names hold the board. You type your name and your real daily token count into the blank. You finish sixth.

Always sixth. Not usually, not on average — every input, every day, including the day you enter a number specifically to stop being sixth. They all had a bigger day. They always did.

This replaces the shared scoreboard as the second beat of the product. The card still inflates you; the board then puts you underneath five people who were not competing with you. Setup, then the rug.

## The board

```text
Nick    Matty    Bretton    Mike    G
```

Five fixed names, in code, permanently above the blank. They are not opponents. They are the conditions.

`G` is never seated below second. This is not explained anywhere.

## The blank

A plain text field. Anyone may type anything — the five are the board, not an allowlist. Names are trimmed, capped at 24 characters, and an empty field enters as `Anonymous`.

You may type a name that is already on the board. It does not get you onto the board:

> There is already a Bretton on this board. This one is last.

And, for the one name that gets its own line:

> G is in last place. This has been logged.

## Why "anonymous"

The board calls itself anonymous and prints everyone's name, including the one you just typed in yourself. The footer resolves the contradiction without acknowledging it, and discloses the thing that actually matters:

> This scoreboard is anonymous. Participants are identified only by name. The five counts above are generated; yours is the only real number here.

That second sentence is load-bearing. Fabricated daily counts sit next to five named real people, so the fabrication is labeled on the same screen, every time. It satisfies `PRODUCT.md` principle 2 ("Absurd, not deceptive") and it is also the funnier line.

## Algorithm

Deterministic. The same name, day, and count always produce the same defeat.

```text
counts    = fnv1a(name | YYYY-MM-DD | actualTokens)  →  mulberry32
standings = fnv1a(order | YYYY-MM-DD)                →  mulberry32
```

Two seeds, on purpose:

- **Standings** are seeded by the date alone. Your number never reshuffles the five — they simply all had a bigger day. The race above you is real, ongoing, and none of your business.
- **Counts** are seeded by your number, so the ladder scales with whatever you enter.

```text
tie     = random() < 0.06
gap     = tie ? 0 : max(1, round(random()^2.5 × 40))
fifth   = actualTokens + gap
fourth  = fifth  × (1.04 + r×0.10)
third   = fourth × (1.05 + r×0.12)
second  = third  × (1.15 + r×0.40)
first   = second × (1.80 + r×1.90)      × 3 on an 8% "someone had a day"
```

The cubic skew on `gap` keeps most margins in single digits. **Losing by four is worse than losing by four million**, and the engine is tuned for the former.

The four above fifth place are forced strictly apart after rounding. Fifth place is *not* — it may land exactly on your count, because a tie you then lose is funnier than a tie the engine quietly avoids. The ladder is scaled to stay inside the safe-integer range for absurd inputs.

### Tiebreaks

On a tie, a rule is named and applied. Every rule resolves against you.

```text
alphabetical    reverse alphabetical    earlier submission    later submission    coin toss
```

The rule changes day to day. It is stated plainly. Nobody comments on it.

> Tied for fifth. Tiebreak: reverse alphabetical. You lose.

## Recommended reading

Three links, offered sincerely, under the heading **Recommended for you** and the subtitle *Selected for you, based on your performance.*

The suggestions are banded by your actual count, and the condescension changes shape rather than degree. There is no band in which the board thinks you are fine.

| Band | Read as | Sample |
|---|---|---|
| < 1,000 | inexperience | Claude for Dummies · Touch typing · Shopping list · How to use a keyboard |
| < 100,000 | inexperience | Claude for Dummies · Prompt engineering · What is a language model? |
| < 1,000,000 | mediocrity | Participation trophy · How to be more productive · Claude for Dummies |
| < 10,000,000 | a problem | Sunk cost fallacy · Diminishing returns · Time management |
| ≥ 10,000,000 | a bigger problem | Sunk cost fallacy · Going outside · Hobby |

Every destination is a real page — Wikipedia articles and plain search links — so the joke never lands on a 404. Three distinct pointers are drawn without replacement per board, deterministically.

## Copy

| Condition | Line |
|---|---|
| `gap === 1` | You were one token away. |
| `gap <= 12` | `{gap}` tokens. |
| `gap > 12` | Last place by `{gap}`. |
| tie | Tied for fifth. Tiebreak: `{rule}`. You lose. |
| you typed `G` | G is in last place. This has been logged. |
| you typed another board name | There is already a `{name}` on this board. This one is last. |
| today ≥ 3× your last entry | You had a big day. So did `{fifth place}`. |
| always | Consecutive days in last place: `{n}`. Best finish: last. |

The escalation line is the renewable joke: it notices you are trying, and then does not care.

## Sample output

```text
You were one token away.  //  There is already a Bretton on this board. This one is last.
01  G           171,274,978   +130,274,978
02  Matty        60,152,282    +19,152,282
03  Bretton      47,768,580     +6,768,580
04  Mike         44,721,193     +3,721,193
05  Nick         41,000,001             +1
06  Bretton      41,000,000        <- YOU
Consecutive days in last place: 47. Best finish: last.
Recommended for you: Going outside · Sunk cost fallacy · Diminishing returns
```

## What this changes

| Doc | Change |
|---|---|
| `PRODUCT.md` | Signature experience gains a daily entry and a fixed defeat. The scoreboard is no longer "ranked by the flex." |
| `ARCHITECTURE.md` | `GET/POST /scores` is no longer required for the core loop. The board is computed from one real number. |
| `ADVERSARIAL.md` | **Score tampering** and **privacy leakage** largely dissolve: there is no shared score store to tamper with and no other person's real data on the board. Tampering with your own number only changes how far ahead everyone else was. |
| `FEATURE-BOARD.md` | TF-010 and TF-011 shrink from "shared scoreboard API + UI" to "render the rigged board." |
| `DECISIONS.md` | Needs an ADR: the scoreboard is generated, not collected. |

The funny change is also the smaller and safer one. The core product now needs no server at all.

## Implementation

| File | Contents |
|---|---|
| `src/last-place.ts` | `PARTICIPANTS`, `buildBoard`, `normalizeName`, `dayKey`, `isParticipant`, `DISCLOSURE`. Pure and deterministic; no DOM, no storage. |
| `src/last-place.test.ts` | Invariants below, plus determinism, names, tiebreak, reading list, and copy tests. |
| `src/main.ts` | Name field, board render, reading list, re-render on name change. |

### Invariants under test

Checked across five entrant names × four dates × eleven counts from `1` to `999,999,999,999,999`:

- The entrant is in position six, exactly once, always.
- All five board names occupy positions one to five.
- No generated count is ever below the entrant's.
- The five are strictly ordered; fifth may tie the entrant but never trail them.
- Every count is a safe integer.
- Changing your number never reshuffles the standings.
- `G` is never below second.
- Every board offers three distinct `https` pointers.
