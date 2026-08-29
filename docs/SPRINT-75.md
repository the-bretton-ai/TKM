# The 75-minute build

## Goal

Ship one memorable loop:

> real tokens → absurd reveal → rotating meme receipt → safe dynamic email

Everything else is secondary.

## Clock

| Minute | Work | Output |
|---:|---|---|
| 0–15 | Flex Lab UI | Responsive input, mode selector, reveal, result actions. |
| 15–22 | Flex Engine | Deterministic formula and boundary tests. |
| 22–32 | Meme deck | Three original pictures, daily rotation, PNG export. |
| 32–37 | Scoreboard | Local ranked history and refresh persistence. |
| 37–47 | Comedy pack | Seven curated daily variants and matching image selection. |
| 47–57 | Safe delivery | Allowlist, consent, variable window, suppression, one/day gate. |
| 57–62 | Adversarial tests | Denial, replay, suppression, injection, rotation. |
| 62–67 | UI cleanup | Mobile, keyboard, focus, reduced motion, copy polish. |
| 67–75 | Build and deploy | Production build, smoke check, demo/live runbook. |

## Cut line

If a phase runs long, cut in this order:

1. Native share API; keep PNG download.
2. Server scoreboard; keep local scores.
3. Audit-log UI; keep server records.
4. Fancy animation layers; keep one strong reveal.

Never cut recipient allowlisting, consent, suppression, daily caps, send authorization, disclosures, or tests for those controls.

## Release proof

- A new visitor can produce a receipt in under 30 seconds.
- The same day and recipient choose the same joke/image/hour; a different day changes them.
- A bad alias, missing key, suppressed recipient, duplicate date, or out-of-window schedule produces no provider call.
- The app is still honest and useful with email credentials absent.
- The production build works at 390px and desktop width.
