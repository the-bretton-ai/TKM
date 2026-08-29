# Architecture

## Chosen shape

The MVP uses a small, boring architecture on purpose:

```text
Browser: Vite + TypeScript
  ├─ token input and Flex Engine
  ├─ animation and scoreboard UI
  ├─ Canvas meme renderer
  └─ local history cache
             │
             ▼
Netlify Functions
  ├─ scores: validated scoreboard reads/writes
  ├─ send-flex: authorized on-demand email
  ├─ unsubscribe: signed suppression action
  └─ weekly-digest: scheduled scoreboard email
             │
       ┌─────┴─────┐
       ▼           ▼
 Netlify Blobs   Email provider
 scores/config   transactional API
 suppression     verified sender domain
 audit log
```

This is intentionally not Next.js, a general database, or a multi-service deployment. Vite gives a fast componentized client; Netlify Functions keep credentials off the browser; Netlify Blobs is sufficient for a personal scoreboard and delivery state; a scheduled function supplies automation without a separate worker.

## Modes

### Demo mode

- No server credentials required.
- Token entry, Flex Engine, reveal, meme rendering, download, and local history work.
- Shared scores use seeded fixtures.
- Email opens a faithful preview and clearly says live delivery is disabled.

### Live mode

- Server validates an owner send key.
- Server reads allowed recipients from private configuration.
- Scoreboard, suppression, schedules, and audits persist in server storage.
- Email provider sends from a verified domain.

The UI must never pretend a demo action delivered an email.

## Client modules

| Module | Responsibility |
|---|---|
| `flex-engine` | Pure calculation, rank boundaries, formatting, and deterministic output. |
| `token-entry` | Input normalization, validation, presets, and submit flow. |
| `reveal` | Motion state machine with reduced-motion alternative. |
| `meme-renderer` | Composes base art and exact text to Canvas; exports PNG. |
| `score-history` | Local history, streaks, deltas, and storage migrations. |
| `scoreboard` | Fetches safe score projections and renders ranks/states. |
| `email-preview` | Uses the same versioned content model as the server template. |
| `admin-send` | Session-only send-key handling and approved-recipient selection. |

## API surface

### `GET /.netlify/functions/scores`

Returns a public-safe projection of the current private league.

```json
{
  "scores": [
    {
      "displayName": "Bretton",
      "actualTokens": 1250000,
      "flexCount": 126750000,
      "mode": "tokenmax",
      "rank": "Tokenmaxxer",
      "recordedAt": "2026-08-29T18:00:00.000Z"
    }
  ],
  "updatedAt": "2026-08-29T18:00:00.000Z"
}
```

No recipient address, send key, provider ID, IP address, or internal audit field is returned.

### `POST /.netlify/functions/scores`

Requires owner authorization. Recomputes `flexCount` on the server from `actualTokens` and `mode`; it never trusts a client-supplied inflated value.

### `POST /.netlify/functions/send-flex`

Requires owner authorization and an idempotency key. The client submits a recipient alias, not an arbitrary email address. The server resolves the alias from its private allowlist, checks suppression and cooldown state, rebuilds score content, sends the versioned template, and writes an audit row.

### `GET /.netlify/functions/unsubscribe?token=...`

Uses an expiring signed token that identifies one allowlisted recipient. The handler writes suppression state before showing confirmation. It does not disclose whether any other address exists.

### `weekly-digest`

A scheduled function with no public route. It reads the allowlist, skips suppressed recipients, composes one digest from server-side scores, sends, and audits. The schedule is UTC and is declared in `netlify.toml`.

## Storage keys

| Store | Key | Value |
|---|---|---|
| `token-flexer-scores` | `score/<uuid>` | Validated score record; no email. |
| `token-flexer-config` | `recipient/<alias>` | Display label, encrypted/private email, consent state. |
| `token-flexer-config` | `suppression/<recipient-hash>` | Timestamp and reason. |
| `token-flexer-audit` | `delivery/<timestamp>-<request-id>` | Recipient hash, template version, outcome, provider ID. |
| `token-flexer-idempotency` | `send/<idempotency-key>` | Prior result and expiry. |

Retention defaults:

- Score history: 90 days
- Delivery audit: 90 days
- Idempotency records: 7 days
- Suppression: retained until the recipient explicitly opts back in

## Environment contract

| Variable | Required | Purpose |
|---|---|---|
| `TOKEN_FLEXER_SEND_KEY` | Live sends | Owner authorization; never exposed in built assets. |
| `TOKEN_FLEXER_RECIPIENTS` | Live sends | JSON allowlist of aliases, emails, display names, and consent. |
| `TOKEN_FLEXER_SIGNING_SECRET` | Unsubscribe | Signs recipient-scoped action tokens. |
| `EMAIL_API_KEY` | Live sends | Transactional provider credential. |
| `EMAIL_FROM` | Live sends | Verified sender identity. |
| `APP_ORIGIN` | Live sends | Canonical HTTPS origin for safe links. |
| `TOKEN_FLEXER_DEMO` | Optional | Forces no-send demo behavior when `true`. |

## Trust boundaries

- The browser is untrusted, including every number it submits.
- Flex calculations used for shared scores and emails run again on the server.
- Recipient aliases are public-safe; addresses exist only in server configuration/storage.
- Meme text is selected from versioned templates, not raw HTML.
- All state-changing endpoints require authorization, schema validation, size limits, rate limits, and same-origin checks.
- Logs contain hashed recipient identifiers and request IDs, not message bodies or keys.

## Why this is easy to deploy

- One repository and one Netlify project
- One front-end build command
- No always-on server
- No separate cron service
- No database migration for the first personal league
- Demo mode deploys before any email/provider setup
- Production behavior is activated by environment variables, not a second codebase

If usage grows beyond a small private league, storage moves behind a relational database without changing the pure Flex Engine, meme renderer, or email content model.
