# Contributing

Start with the [feature board](docs/FEATURE-BOARD.md). Work should have a TF identifier before implementation begins.

## Workflow

1. Pull the latest `main`.
2. Create the proposed short-lived branch from the board.
3. Implement the smallest vertical slice that satisfies the item.
4. Add or update tests with the behavior.
5. Open a pull request using the repository template.
6. Use the deploy preview for interface and function verification.
7. Merge only when acceptance criteria and P0 gates pass.

Do not commit API keys, send keys, real recipient addresses, provider payloads, or delivery logs. Use redacted fixtures and `.env.example` names.

## Product boundaries

- Flex counts remain labeled as satire/self-reported.
- The outbound slogan and supporting copy stay curated; no arbitrary outbound content.
- The client never selects an arbitrary email address.
- Suppression and cooldown checks are mandatory for manual and scheduled delivery.
- Demo mode must remain honest and useful when live email is not configured.
