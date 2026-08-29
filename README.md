# The Token Flexer

> Enter your daily token count. Finish sixth.
>
> **Do you even tokenmax, bro?**

You type one real number into a blank. The app inflates it into an obviously satirical **Flex Count**,
then puts you on a scoreboard underneath five people who had a bigger day. Always underneath. Including
the day you enter a number specifically to stop being underneath.

**Live:** not yet deployed · **GitHub:** [the-bretton-ai/TKM](https://github.com/the-bretton-ai/TKM)

---

## Quick start

```bash
npm ci          # install
npm run dev     # http://localhost:5173
npm run check   # typecheck + tests, the same gate CI runs
```

No credentials are needed. The app is fully usable in demo mode — the reveal, the board, and the
downloadable receipt all work with an empty environment. Email is the only thing that needs configuring.

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | `tsc --noEmit` then a production build into `dist/` |
| `npm run test:run` | Vitest, once |
| `npm run test` | Vitest, watching |
| `npm run check` | Typecheck plus tests — run this before pushing |
| `node scripts/secret-scan.mjs` | Fails if a key, secret, or real address reached a tracked file |

## How it works

**One number in.** A name and today's real token count. Nothing else is on the first screen.

**Two beats out.** The receipt inflates you — `base × multiplier + aura + streak`, rounded to a thousand,
always labelled as satire next to your real count. Then the board puts you sixth. That is the joke: setup,
then the rug.

**The board is generated, not collected.** Five fixed names hold it — Nick, Matty, Bretton, Mike, G — and
their counts are computed from two seeds: the date alone decides the standings, so your number never
reshuffles them; your number decides the ladder, so the margins scale with whatever you enter. Nothing is
stored on a server, so there is no shared score store to tamper with and no one else's real data on screen.
Full specification in [The Last Place Engine](docs/LAST-PLACE.md).

The margins are tuned so most defeats are humiliating rather than vast. Losing by four is worse than losing
by four million.

## Environment

Every variable is server-side. Set them in the Netlify UI, never in the repository — CI fails the build if a
secret reaches a tracked file. Copy [`.env.example`](.env.example) for local work.

| Variable | Required for | Notes |
|---|---|---|
| `TOKEN_FLEXER_DEMO` | — | `true` disables every provider call while leaving the app usable. **The safe default.** |
| `TOKEN_FLEXER_SEND_KEY` | Live send | Owner authorization. Long and random; minimum 24 characters. |
| `TOKEN_FLEXER_RECIPIENTS` | Live send | JSON allowlist. Each entry needs `alias`, `email`, `displayName`, `consent: true`, `sendWindowUtc`. Empty means nothing sends. |
| `TOKEN_FLEXER_SIGNING_SECRET` | Unsubscribe | Signs the no-account unsubscribe tokens. |
| `EMAIL_API_KEY` | Live send | Transactional provider key. |
| `EMAIL_FROM` | Live send | Verified sender identity. |
| `APP_ORIGIN` | Live send | Canonical HTTPS origin, no trailing slash. Used to build unsubscribe links. |
| `TOKEN_FLEXER_SENDER_NAME` | Automation | Name the scheduled drop sends as. |
| `TOKEN_FLEXER_DAILY_ACTUAL_TOKENS` | Automation | Fallback count for the scheduled send. |
| `TOKEN_FLEXER_DAILY_MODE` | Automation | One of `warmup`, `unhinged`, `tokenmax`, `final-form`. |

### Turning live email on

1. Deploy with no variables set and confirm demo mode works.
2. Add the send key, signing secret, sender identity and origin.
3. Add exactly one recipient who has actually agreed, with `consent: true`.
4. Set `TOKEN_FLEXER_DEMO=false`.
5. Send one message to yourself and check the delivery record.

### Turning it off in a hurry

Set `TOKEN_FLEXER_DEMO=true`. Provider calls stop immediately and the app keeps working. Rotate
`TOKEN_FLEXER_SEND_KEY` and the provider key independently if either may have leaked. Suppression records
survive rollbacks and must never be swept.

## Safety model

The joke is only funny if it cannot be turned into a spam tool. Every send passes all of these before the
provider is contacted:

- the recipient alias exists in server configuration
- that recipient has explicit `consent: true`
- that recipient is not suppressed
- the request carries the owner send key, compared in constant time
- the request carries a well-formed idempotency key that has not been used
- no successful delivery exists for that alias today

Clients address recipients by **alias only** — a request carrying an email address is rejected outright.
Five tests assert the provider is never reached on any denial path.

## Documents

| | |
|---|---|
| [Product brief](docs/PRODUCT.md) | Audience, promise, flows, scope, success measures |
| [The Last Place Engine](docs/LAST-PLACE.md) | The algorithm, the copy, the invariants under test |
| [Feature board](docs/FEATURE-BOARD.md) | What shipped |
| [Remaining](docs/REMAINING.md) | What did not, with acceptance criteria |
| [Architecture](docs/ARCHITECTURE.md) | Stack, data flow, API surface, deployment shape |
| [Adversarial review](docs/ADVERSARIAL.md) | Abuse cases, privacy risks, controls |
| [Comedy adversarial review](docs/COMEDY-ADVERSARIAL.md) | Where the joke fails, and why |
| [Delivery plan](docs/DELIVERY-PLAN.md) | Milestones, branch strategy, release gates |
| [Decision log](docs/DECISIONS.md) | Durable product and engineering decisions |

There is also a live build board at `public/tracker.html`, served at `/tracker.html`.

## Conventions

`main` is always releasable. Work happens on short-lived branches and every pull request carries its
verification evidence.

> **Do not use bare `TF-###` numbers.** Two versions of the feature board once coexisted, and all seventeen
> ids they shared named different features on each — `TF-004` was the Flex Engine on one and the meme deck on
> the other. The board prints the full collision table. Say the tile number instead.

Anything in `netlify/functions/` is deployed as a function, so tests and helpers live in underscore-prefixed
directories (`_tests/`, `_lib/`) which Netlify skips. A test file sitting directly in that folder will fail
the deploy with a 422, because `send-flex.test` is not a legal function name.

## CI

Every pull request runs typecheck, the Vitest suite, a production build, and a self-contained secret scan —
each as its own step, so a red check names what broke. The scanner reads tracked files only and needs no
third-party action or token.

## Status

Six items shipped and merged, 39 tests green. The receipt export, the scheduled-send tests, the
accessibility pass and the release review are outstanding — see [Remaining](docs/REMAINING.md).

The eleven-item safety gate in [`ADVERSARIAL-REVIEW-75.md`](docs/ADVERSARIAL-REVIEW-75.md) has **not** been
walked. That is fine while demo mode holds and no credentials exist. Do it before setting `EMAIL_API_KEY`.

## License

No open-source license has been selected. All rights reserved until the owner chooses one.
