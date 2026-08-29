# The Token Flexer

> Enter a real token count. Inflate it beyond reason. Send the scoreboard.
>
> **Do you even tokenmax, bro?**

The Token Flexer is a playful, self-aware flex generator for people who spend too much time talking to models. It turns a real token count into an obviously satirical **Flex Count**, renders a shareable hater-meme card, and can send a consent-based scoreboard by email on demand or on a schedule.

**GitHub home:** [the-bretton-ai/TKM](https://github.com/the-bretton-ai/TKM)

## Project status

**Phase:** 75-minute implementation sprint  
**Target:** deployable, tested MVP on Netlify  
**Source of truth:** [Feature Board](docs/FEATURE-BOARD.md)

## What ships in v1

- Manual token entry with saved presets
- A deterministic, dramatically inflated Flex Count
- An animated results reveal with shareable meme output
- A small local leaderboard with history and streaks
- A rotating deck of original meme pictures
- Seven deterministic daily email jokes with variable send windows
- Email preview and one-click send to approved recipients
- Daily automated flex drop with one-send-per-day protection
- Delivery log, unsubscribe handling, and rate limits
- Responsive, accessible, install-free web experience

The inflated number is always labeled as parody/self-reported. The email system is deliberately limited to approved recipients so the joke cannot be turned into an anonymous spam tool.

## Product documents

- [Product brief](docs/PRODUCT.md) — audience, promise, flows, scope, and success measures
- [Feature board](docs/FEATURE-BOARD.md) — GitHub-ready backlog with branches and acceptance criteria
- [Architecture](docs/ARCHITECTURE.md) — stack, data flow, API surface, and deployment shape
- [Adversarial review](docs/ADVERSARIAL.md) — abuse cases, privacy risks, and controls
- [Delivery plan](docs/DELIVERY-PLAN.md) — milestones, branch strategy, release gates, and deployment checklist
- [75-minute sprint](docs/SPRINT-75.md) — the build clock, cut line, and release proof
- [Decision log](docs/DECISIONS.md) — durable product and engineering decisions

## Repository conventions

- `main` is always releasable.
- Work happens in short-lived `feat/TF-###-slug`, `fix/TF-###-slug`, or `chore/TF-###-slug` branches.
- Every pull request names its Token Flexer issue and includes verification evidence.
- No real recipient emails, API keys, or delivery logs are committed.

## Deployment shape

The app is designed as a Vite/TypeScript front end with Netlify Functions, Netlify Blobs for lightweight state, and a transactional email provider. It remains fully demoable without credentials; live sending and automation activate only when server-side environment variables are configured.

## License

No open-source license has been selected. All rights are reserved until the owner chooses one.
