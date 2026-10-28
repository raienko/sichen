[Docs](../index.md) › [Security plan](plan.md) › Exceptions

# Severity policy and exception register

> How fast a security finding has to be fixed, and the findings knowingly left open — each with an owner and an expiry.

## Severity policy

Applies to every source: the weekly vulnerability scan, CodeQL, dependency review, secret scanning, a pen test, a private report.

| Severity | Typical example                                                        | Fix by       | Blocks a release |
| -------- | ---------------------------------------------------------------------- | ------------ | ---------------- |
| Critical | CVSS 9.0+; exploitable remotely with no user action; leaked credential | 2 days       | Yes              |
| High     | CVSS 7.0–8.9; auth bypass, data exposure with user interaction         | 14 days      | Yes              |
| Medium   | CVSS 4.0–6.9; needs local access or an unlikely configuration          | 60 days      | No               |
| Low      | Below 4.0; defence in depth                                            | Next quarter | No               |

- **A leaked secret** is critical whatever its scope: rotate it first (see the [product guide](../product-guide.md#credentials-and-where-they-live)), then investigate.
- **Reachability lowers urgency, not severity.** A high finding in build-only tooling still needs an exception; the reason column is where "not in the app bundle" is recorded.
- **Past its fix-by date**, a finding needs an exception below, or the release it blocks doesn't ship.

## Exception register

Every finding knowingly left open past its fix-by date, or kept from failing a check. An entry needs an owner (a person, not a team), a reason, and an expiry no more than 90 days out. When it expires the check fails again, and the owner fixes the finding or renews the entry with a new reason.

The vulnerability scan reads its half from [`osv-scanner.toml`](../../osv-scanner.toml); keep the two in step.

| Id                  | Package / finding | Severity   | Reason                                                                                            | Owner          | Expires    |
| ------------------- | ----------------- | ---------- | ------------------------------------------------------------------------------------------------- | -------------- | ---------- |
| GHSA-vfj7-8cjw-p6xm | braces 3.0.3      | High (8.7) | Build tooling only: patch-package › find-yarn-workspace-root › micromatch. Not in the app bundle. | **unassigned** | 2026-11-19 |
| GHSA-86w9-cpqp-85rv | node-forge 1.4.0  | High (8.7) | Expo CLI only (`@expo/cli`, `@expo/code-signing-certificates`). Clears with an SDK patch bump.    | **unassigned** | 2026-11-19 |
| GHSA-w5hq-g745-h8pq | uuid 7.0.3        | High (7.5) | Prebuild only: `@expo/config-plugins` › xcode. Not in the app bundle.                             | **unassigned** | 2026-11-19 |

Medium findings from the first scan (2026-10-19), tracked under the policy rather than registered: decode-uri-component 0.2.2, sprintf-js 1.0.3, stream-json 1.9.1 (three advisories).

---

[Security plan](plan.md) · [Docs index](../index.md)
