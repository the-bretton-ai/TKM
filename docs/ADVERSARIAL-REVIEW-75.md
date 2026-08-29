# Adversarial review — 75-minute MVP

**Verdict:** **GO WITH CONDITIONS.** The joke is worth building, but “funny every day” raises the abuse risk more than any visual or formula feature. The MVP may ship only if the P0 controls below remain structural and tested.

## What we tried to break

We attacked the proposed loop from four positions:

1. A stranger discovers the public site and wants a free mail cannon.
2. An approved sender gets overenthusiastic and turns a friendly joke into daily harassment.
3. A recipient consented once but now wants the messages to stop immediately.
4. An attacker tampers with names, counts, dates, aliases, image IDs, or retries to produce hostile content or duplicate delivery.

## Findings

### P0 — Daily novelty can become daily harassment

**Attack:** enable automation for someone who never opted in, send at uncomfortable hours, or keep sending after the joke is no longer funny.

**Required control:**

- Automation defaults off.
- The server allowlist contains explicit `consent: true` and an approved UTC send window per alias.
- One successful automated message maximum per alias per calendar date.
- Unsubscribe requires no account and overrides every other state.
- Manual sends obey suppression and a cooldown too.
- The sender is named in every message; delivery is never anonymous.

**Test:** unknown, non-consenting, suppressed, out-of-window, and already-sent recipients produce zero provider calls.

### P0 — A public client cannot accept arbitrary email addresses

**Attack:** change the request payload in DevTools from `friendly-rival` to an arbitrary target address.

**Required control:** the browser sends an alias only. The server resolves that alias from private environment configuration and ignores/rejects any client email field.

**Test:** adding `email`, `to`, or an unknown alias cannot change the provider recipient.

### P0 — “Different every day” must not mean unbounded model output

**Attack:** inject a name that causes generated copy to insult, threaten, reveal private information, or break the email HTML.

**Required control:** v1 uses seven curated copy variants and three project-owned images. Rotation is deterministic; no LLM runs in the delivery path. Names are length-limited and HTML-escaped. Subjects cannot be supplied by the client.

**Test:** an injection corpus remains inert text, and unsupported variant/image IDs never render.

### P0 — Retries can multiply the joke

**Attack:** double-click, replay a captured request, or let the scheduled function retry after a timeout.

**Required control:** manual requests require an idempotency key. Automated sends use `alias + local-date` as the idempotency key. A successful or in-flight record blocks another provider call.

**Test:** 10 concurrent/replayed requests produce at most one provider invocation.

### P0 — The inflated score can be mistaken for real usage

**Attack:** forward or crop the meme/email so the huge number looks like measured usage.

**Required control:** every card and message uses “SATIRICAL FLEX COUNT,” shows the multiplier, and includes the self-reported actual count in the content—not only in metadata or alt text.

**Test:** UI, PNG compositor, and all seven email variants contain the disclosure fields.

### P1 — Variable delivery time can surprise the sender too

**Attack:** a “random” send drifts into the night, changes unpredictably during tests, or fires twice around a deployment.

**Required control:** time is pseudo-random only inside an explicit recipient UTC window. Selection is a stable hash of alias + date. The scheduled job may wake hourly, but the same inputs always choose the same hour.

**Test:** same alias/date always returns one hour inside the window; adjacent dates vary in the test sample; invalid or wrapping windows fail configuration validation.

### P1 — Remote pictures leak attention data

**Attack:** use recipient-specific image URLs as tracking pixels or expose secret variant data in query strings.

**Required control:** all recipients receive one of three public static asset URLs. No address, recipient ID, token, or unique query parameter appears in image URLs. Provider analytics are disabled where supported.

**Test:** email HTML contains only the canonical app origin plus an allowlisted static path.

### P1 — A send key in a public browser is a bearer credential

**Attack:** XSS, shared screenshots, browser extensions, or accidental persistence steal the key.

**Required control:** key is held in memory/session only, never local storage or URL. It is high entropy, compared in constant time, rate-limited by IP, and easy to rotate. A restrictive content policy reduces script injection exposure.

**Test:** source/build/storage contain no key; reload clears the field; brute requests hit 429 before meaningful guessing.

### P1 — Funny pictures can fail in email clients

**Attack:** background-image CSS is stripped, dark mode makes text unreadable, or image loading is disabled.

**Required control:** picture is a normal `<img>` with descriptive alt text. The joke, score, and disclosure remain complete as live HTML beneath it. No meaning depends on CSS backgrounds.

**Test:** plain-text version and image-disabled HTML still communicate the full message.

## Approved comedy boundaries

The humor targets token excess and the sender's own absurd confidence—not the recipient's identity, job, intelligence, body, finances, or protected traits. Launch subjects are selected from this bounded pack:

1. `{{name}} has entered a larger context window than your apartment.`
2. `The token economy has been notified.`
3. `Your prompt game has been placed on administrative leave.`
4. `BREAKING: context window visible from space.`
5. `A small model just called this excessive.`
6. `This email used fewer tokens than {{name}}'s hello.`
7. `Weekend audit: still not tokenmaxxing.`

All variants finish with the same invitation: **“Do you even tokenmax, bro?”** The recipient may unsubscribe permanently in one click.

## P0 release gate

- [ ] Alias-only addressing; no arbitrary recipient path
- [ ] Explicit consent and approved send window
- [ ] Suppression checked before manual and automated sends
- [ ] One automated delivery per alias/date
- [ ] Idempotency checked before provider call
- [ ] Seven curated variants; no runtime model generation
- [ ] Three static, non-tracking image paths
- [ ] Satire label, multiplier, and actual count in every output
- [ ] Server recomputes score from actual count and mode
- [ ] Demo mode makes zero provider calls
- [ ] Denial-path tests prove provider call count remains zero

If any box is red, automation stays disabled. The front-end reveal and PNG receipt may still deploy safely in demo mode.
