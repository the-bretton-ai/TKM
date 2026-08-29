# Product brief

## One-line promise

The Token Flexer turns a real token count into an absurdly impressive, obviously satirical flex that is fun to reveal, rank, download, and send to friends.

## The idea

Token counts are usually invisible infrastructure metrics. The Token Flexer makes them social theater: part arcade score, part gym-bro parody, part bragging-rights generator. The experience must feel premium enough to share while staying transparent enough that nobody mistakes the inflated number for a factual usage claim.

## Audience

### Primary: the tokenmaxxer

A heavy AI user who enjoys the joke, wants a dramatic visual payoff, and has a few friends or colleagues who will appreciate a recurring scoreboard.

### Secondary: the hater

An invited recipient who wants to see the score, laugh at the meme, opt out easily, and never wonder why an anonymous system has their address.

## Product principles

1. **The reveal is the product.** Entering a number takes seconds; the visual transformation supplies the delight.
2. **Absurd, not deceptive.** Show the real count in context and label the Flex Count as satire/self-reported.
3. **Share artifacts, not screenshots of forms.** Every successful session ends with a polished card.
4. **Consent beats virality.** Approved recipients, visible sender identity, rate limits, and one-click unsubscribe are launch requirements.
5. **Useful underneath the joke.** History, streaks, and actual-token trends should make the app worth revisiting.
6. **One-click demo, small production backend.** The experience works without accounts; email and automation are optional server capabilities.

## Signature experience

1. The user enters a real token count or chooses a saved count.
2. The **Flex Reactor** spins up and applies a selected ridiculous multiplier.
3. The screen reveals:
   - Real tokens
   - Flex multiplier
   - Flex Count
   - Tokenmaxxer rank
   - Change from the last session
4. A generated meme card appears with the exact line: **“DO YOU EVEN TOKENMAX, BRO?”**
5. The user downloads, copies a share link, previews an email, or sends it to an approved recipient.
6. The run joins the scoreboard and contributes to the weekly digest.

## The Flex Engine

The calculation is deterministic so a given input and mode always produce the same output.

```text
base       = max(actual_tokens, 1)
multiplier = 10 | 50 | 100 | 500
aura       = round(log10(base + 10) * 250_000)
streak     = consecutive_days * 100_000
flex_count = round_to_1000(base * multiplier + aura + streak)
```

The four presentation modes are:

| Mode | Multiplier | Label |
|---|---:|---|
| Warm-up | 10x | Casual context enjoyer |
| Unhinged | 50x | Token athlete |
| Tokenmax | 100x | Context window colonizer |
| Final form | 500x | Compute has left the chat |

The app always displays the multiplier and a `SATIRICAL FLEX COUNT` label. “Actual tokens” can be visually subordinate on the meme, but not removed from the detail view or email footer.

## Feature scope

### Launch MVP

- Token entry, formatting, presets, and validation
- Flex Engine with four modes
- Animated reveal and rank system
- Browser-rendered meme card using original base art
- PNG download and native share where available
- Local score history and streak calculation
- Shared scoreboard backed by server storage
- Recipient allowlist and consent state
- Email preview, test send, and live send
- Weekly scheduled digest
- Delivery audit log and suppression list
- Mobile, reduced-motion, keyboard, and screen-reader support
- Production deployment, CI, and environment documentation

### Next release

- Read-only importers for OpenAI/Codex and Anthropic usage exports
- Multiple meme backdrops and seasonal drops
- Private groups and invitation links
- Score reactions and rematch links
- Monthly actual-token trend report
- Installable PWA support

### Explicit non-goals for v1

- Scraping private usage dashboards
- Anonymous email sends
- Arbitrary recipient entry on a public deployment
- Misrepresenting the Flex Count as measured usage
- User-generated email HTML or subject lines
- A social network, chat system, or public global leaderboard
- Billing, subscriptions, or multi-tenant administration

## Rank ladder

Ranks are based on the actual token count, not the inflated number.

| Actual tokens | Rank |
|---:|---|
| 0–9,999 | Prompt Tourist |
| 10,000–99,999 | Context Enjoyer |
| 100,000–999,999 | Token Athlete |
| 1,000,000–9,999,999 | Tokenmaxxer |
| 10,000,000+ | Context Window Colonizer |

## Success measures

- A first-time user reaches the reveal in under 30 seconds.
- At least 60% of completed reveals result in a download, share, or preview.
- Zero emails can be sent to a recipient outside the server allowlist.
- Every delivery has sender, recipient hash, result, and timestamp in the audit log.
- A recipient can unsubscribe without signing in.
- The app earns a 90+ Lighthouse score in performance, accessibility, best practices, and SEO on the production target.

## Tone and visual direction

**Tone:** premium sports broadcast meets absurd gym culture. Confident, concise, and visibly in on the joke.

**Visual system:** near-black background, electric chartreuse, hot coral, icy white, oversized condensed type, numerical tabular figures, arena lights, subtle grain, hard-edged cards, and restrained chrome. Avoid generic purple SaaS gradients, glassmorphism overload, and crypto styling.

**Motion:** a short charge-up, rolling digits, impact flash, and settled scoreboard. Respect `prefers-reduced-motion` with a clean crossfade alternative.
