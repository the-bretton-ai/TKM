# Adversarial review

The app is a joke delivery system with email capability. That combination deserves a threat model before it deserves a send button.

The timeboxed implementation review and dynamic-daily-email findings live in [ADVERSARIAL-REVIEW-75.md](ADVERSARIAL-REVIEW-75.md). Its P0 gate overrides schedule pressure.

## Abuse cases and controls

| Threat | What could go wrong | Launch control | Verification |
|---|---|---|---|
| Arbitrary-recipient spam | A public visitor submits any email address. | Client sends a recipient alias; server resolves only an environment allowlist. | Unknown aliases never invoke the provider. |
| Harassment loop | An approved recipient receives repeated taunts. | Per-recipient cooldown, weekly automation cap, unsubscribe, and suppression checked before every send. | Burst/replay tests produce no duplicate delivery. |
| Sender spoofing | Message appears anonymous or from the recipient. | Fixed verified `From`, explicit owner identity, non-editable template. | Snapshot delivered headers in provider sandbox. |
| Misleading usage claim | Inflated score is presented as real consumption. | “Satirical Flex Count,” multiplier, actual count, and self-reported footer. | Content test asserts disclosures exist in UI and email. |
| Score tampering | Client posts an impossible flex score. | Server accepts actual tokens and mode only, then recalculates. | Modified payload cannot alter computed score. |
| Secret extraction | Send credential ships in JavaScript or logs. | Server-only environment variables, secret scan, log redaction. | Built `dist/` contains no configured secret fragments. |
| Cross-site send | Another page causes the browser to call the send endpoint. | Bearer send key, same-origin validation, JSON-only POST, no credential cookies. | Cross-origin request is denied. |
| Replay/duplicate send | Retry or double-click sends the same email many times. | Required idempotency key persisted before/with delivery result. | Same key returns first result without provider call. |
| Address enumeration | Error responses reveal who is allowlisted. | Generic denial and unsubscribe responses; hashes in audit log. | Known and unknown aliases have equivalent public errors. |
| HTML injection | Display name or score adds scripts to email/UI. | Schema limits, escaping, fixed template, no raw HTML inputs. | Injection corpus renders inert text. |
| Storage flood | Automated requests fill score/audit stores. | Body-size cap, authorization on writes, rate limit, retention cleanup. | Oversized/high-rate requests fail closed. |
| Meme abuse | User changes the card into targeted slurs. | v1 uses fixed slogan and curated labels; no arbitrary overlay copy. | Client and server reject unsupported template IDs. |
| Privacy leakage | Public score response exposes recipient addresses. | Score records contain display names only; recipient data is separate and private. | API contract test scans forbidden fields. |
| Scheduled-send surprise | Automation starts before consent/config is ready. | Disabled in demo and deploy previews; published production only; recipient consent required. | Preview has no scheduled send; manual production invocation logs skips. |

## Consent model

A recipient is eligible only when all are true:

1. Their alias exists in the server allowlist.
2. Their allowlist record has `consent: true`.
3. No suppression record exists.
4. Their cooldown has elapsed.
5. The sender is authorized.

An unsubscribe takes precedence over every other state. Re-adding a recipient requires a deliberate server-side configuration change and fresh consent; deleting the suppression record from the UI is not supported.

## Content boundaries

Launch content is limited to a friendly private rivalry. It may tease AI usage; it may not target protected traits, threaten, impersonate, shame job performance, or expose private usage records. The exact core line is:

> DO YOU EVEN TOKENMAX, BRO?

Additional labels are curated in code and reviewed like product copy. Free-form outbound email or meme text is a non-goal.

## Release security gate

- No arbitrary email parameter reaches the provider call.
- No state-changing endpoint succeeds without authorization.
- Same idempotency key cannot generate a second provider call.
- Suppression prevents both manual and scheduled sends.
- Production secrets are absent from source, build output, fixtures, and logs.
- Security headers and restrictive content policy are active.
- Dependency and secret scans pass.
- The operator can disable all sends with `TOKEN_FLEXER_DEMO=true` without redeploying code.
