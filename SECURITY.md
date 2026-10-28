# Security policy

## Reporting a vulnerability

Report it privately through GitHub: **Security → Report a vulnerability** on this repository (private vulnerability reporting). Please don't open a public issue, pull request or discussion for it.

Include what you found, how to reproduce it, and what you think the impact is. You'll get:

| Step                          | Within                                                                 |
| ----------------------------- | ---------------------------------------------------------------------- |
| Acknowledgement               | 3 business days                                                        |
| First assessment and severity | 7 days                                                                 |
| Fix or mitigation             | per the [severity policy](docs/security/exceptions.md#severity-policy) |

We'll keep you updated, credit you in the release notes if you'd like, and ask that you hold disclosure until a fix has shipped or 90 days have passed, whichever is first.

## Supported versions

Only the latest release of the app (store builds and the web app) gets security fixes. Older store builds are moved forward with a required update when a fix needs it.

## Scope

The iOS, Android and web apps built from this repository, its API routes (`src/app/api`), and its CI/CD workflows. Third-party services the app talks to are out of scope — report those to their owners.

## How security is handled here

The controls, where the codebase stands against them and the open work are in [docs/security/plan.md](docs/security/plan.md). The [data inventory](docs/security/data-inventory.md), [threat model](docs/security/threat-model.md) and [exception register](docs/security/exceptions.md) are in `docs/security`.
