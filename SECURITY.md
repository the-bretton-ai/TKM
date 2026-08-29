# Security policy

Do not open a public issue containing a send key, email-provider credential, recipient address, unsubscribe token, delivery payload, or an exploit that could turn the deployment into a mail relay.

When this project moves to its dedicated GitHub repository, use a private security advisory for vulnerability reports. Until the repository owner configures that destination, report issues directly to the owner through a private channel.

Security-sensitive behavior includes:

- sending to a recipient outside the allowlist
- bypassing suppression, cooldown, authorization, or idempotency
- extracting server environment variables
- exposing plaintext recipient information through APIs or logs
- changing a shared score without authorization
- causing a scheduled function to send more than once per period

Supported versions will be listed here after the first tagged release.
