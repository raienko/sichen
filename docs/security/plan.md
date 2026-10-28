[Docs](../index.md) › [Roadmap](../../Roadmap.md) › Security plan

# Security and encryption controls

> What each control requires and how it is verified, where the codebase stands against them, and the ordered work to close the gaps. Referenced by roadmap steps 05, 07, 09, 18 and 19.

## Controls

| Control                        | Priority / step                 | Required implementation                                                                                                                                                            | Verification                                                                                      |
| ------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Data classification            | P0 / 05                         | Record owner, purpose, source, storage, transmission, telemetry exposure, retention, deletion, backup, and privacy requirements for every field.                                   | Reviewed inventory changes with each new data class.                                              |
| Non-sensitive preferences      | P0 / 07                         | `LocalValue` only; registered keys, validation, schema migration, corruption recovery, and owned deletion.                                                                         | Corrupt/old/unavailable-storage tests.                                                            |
| Credentials and small secrets  | Before first auth feature / 07  | App-owned `SecureValue` with awaited deletion in secure storage; no ordinary files, preference store, Redux persistence, URLs, logs, or web local storage fallback.                | Device lock, logout, uninstall/reinstall, backup/restore, biometric-change, and recovery tests.   |
| Larger sensitive local payload | Product-triggered               | Minimize first; if unavoidable, use audited authenticated/envelope encryption with a per-install data key protected by Keychain/Keystore and a versioned rotation/recovery design. | Key never ships in source or sits beside ciphertext; rotation and failure recovery are exercised. |
| Public/build configuration     | P0 / 04–05                      | Treat all `EXPO_PUBLIC_*` and app-bundle config as public; keep server/store/CI secrets in protected systems with separate preview/production identities.                          | Schema rejects secret-shaped public variables and missing required config.                        |
| Network/auth                   | With first API feature / 09, 14 | HTTPS/TLS, typed requests/responses, timeouts/cancellation, retry/idempotency, server-side authorization, coordinated refresh/revocation, redacted diagnostics.                    | Negative/schema/auth-race/offline-expiry tests.                                                   |
| Deep links/notifications       | P1 / 09                         | Validate scheme, verified host, route, redirect, shape, size, and decoding; never carry tokens/PII; use short-lived single-use auth codes if needed.                               | Hostile/malformed/encoded/repeated-param and signed-device cold/warm-link tests.                  |
| Media/files                    | P1 / 09                         | Minimize permissions and metadata; validate type/size/dimensions/decode; private temp storage and cleanup on cancel/upload/logout/expiry.                                          | Denial/revocation, malformed file, EXIF, cache cleanup, and upload failure tests.                 |
| Logs/telemetry                 | P0–P1 / 05, 09                  | Shared allowlist-first redaction; exclude authorization, raw links, image paths/metadata, notifications, form bodies, full request/response data, and arbitrary objects.           | Controlled preview events demonstrate useful diagnostics without sensitive fields.                |
| CI/supply chain                | P0 / 03, 05                     | Least permissions, no secrets for untrusted PR code, SHA-pinned actions, dependency review, Dependabot, CodeQL, secret scanning, license/SBOM and native duplication review.       | Required checks and time-bounded exception register.                                              |
| Release/incident               | P2 / 18–19                      | MASVS evidence, signed-device matrix, private reporting, token/key rotation, rollout halt, OTA/store rollback, user communication, and post-incident review.                       | Tabletop exercise and named human security/release sign-off.                                      |

Encryption decisions are classification-driven. Do not encrypt every preference, add certificate pinning, block rooted devices, or add obfuscation without a documented threat and operational recovery plan. Platform secure storage is not the sole backup for irreplaceable user data.

## Where things stand

Audited 2026-10-19 against OWASP MASVS v2 (the apps), OWASP ASVS (web and API routes) and the SDLC controls SOC 2 / ISO 27001 auditors ask for. Update this section when a work package below lands.

**In place**

| Area             | What exists                                                                                                                                                         | Where                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Transport        | HTTPS required for `EXPO_PUBLIC_API_URL` (plain http only to localhost / the Android emulator host); iOS App Transport Security on (`NSAllowsArbitraryLoads` false) | `src/constants/env`, generated `ios/*/Info.plist`           |
| Credentials      | `SecureValue` in Keychain / Keystore, memory-only on web, session-scoped values wiped on sign-out                                                                   | `src/features/storage`                                      |
| Logging          | The logger is compiled out of release builds (`createLogger(__DEV__)`)                                                                                              | `src/features/logger`                                       |
| Deep links       | Incoming links checked against `appLinkDomains`, then parsed and routed through one pipeline                                                                        | `src/features/deep-links`                                   |
| Input            | zod schemas for forms, with translated errors                                                                                                                       | `src/features/validation`, `src/features/forms`             |
| Supply chain     | Exact-pinned dependencies, Secretlint (hook + CI), dependency review with a copyleft denylist, SHA-pinned actions, read-only CI tokens, Expo Doctor                 | `package.json`, `.github/`                                  |
| Privacy manifest | iOS `PrivacyInfo.xcprivacy` generated at prebuild                                                                                                                   | `ios/` (generated)                                          |
| Data at rest     | Android backup off; every MMKV store AES-256 encrypted with a per-install key in device-only secure storage; query cache persisted by opt-in only                   | `app.config.ts`, `src/features/storage`, `src/features/api` |
| Web headers      | HSTS, nosniff, `X-Frame-Options: DENY`, Referrer- and Permissions-Policy on every server response; CSP in report-only                                               | `src/app/+middleware.ts`, `src/features/security-headers`   |
| WebView          | Exact-origin navigation allowlist (off-list http(s) opens in the system browser, other schemes refused); file access and new windows off                            | `src/components/web-view`                                   |
| Policy           | `SECURITY.md`, `CODEOWNERS`, severity policy and exception register, data inventory, threat model; weekly OSV scan; Maestro installed by checksum                   | `docs/security`, `.github/`                                 |

**Gaps** — each one is a work package below.

| Gap                                                                                                                   | Risk                                                | Package        |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------- |
| CSP is report-only; the production page reports one inline script and an `eval` (likely zod 4's JIT probe)            | No script-injection protection until enforced       | SEC-05         |
| Static files served by `expo serve` skip middleware, so they carry no security headers                                | nosniff / HSTS missing on assets                    | SEC-05         |
| Device checks for backup, restore and encrypted MMKV not yet recorded                                                 | Phase 1 "done when" evidence incomplete             | SEC-01, 02, 04 |
| No rate limiting for API routes                                                                                       | Abuse once real routes exist                        | SEC-08         |
| CodeQL default setup / schedule, SBOM, provenance                                                                     | Findings and releases aren't traceable for an audit | SEC-11, 13, 14 |
| GitHub settings: private reporting, secret scanning + push protection, branch protection, Dependabot security updates | Controls documented but not switched on             | SEC-12, SEC-16 |
| No incident runbook                                                                                                   | No rehearsed response                               | SEC-18         |

## Work plan

Ordered so each phase can ship on its own. **Effort** is for one person who knows the codebase. Each package lists the files it touches and what "done" means; check it off here and in the roadmap step it belongs to.

### Phase 1 — before a first public build

Small, mostly config, and the first things a pen test or store review flags.

**SEC-01 · Turn off Android backup of app data** — roadmap 07 · ½ day — **Done 2026-10-19** in code: `allowBackup: false`, and `expo config --type introspect` shows `android:allowBackup="false"` in the manifest. **Still open:** the device check below.

- `app.config.ts`: `android.allowBackup: false`. If backup of non-sensitive preferences is wanted later, use backup rules (`dataExtractionRules` / `fullBackupContent`) that exclude the MMKV directory and SecureStore instead.
- Done when: the generated manifest has `allowBackup="false"`; `adb backup` / a device-to-device restore yields no app data (checked once on a device and recorded here).

**SEC-02 · Encrypt MMKV at rest** — roadmap 07 · 1–2 days — **Done 2026-10-19** in code: `createEncryptedStore` (`src/features/storage/encrypted-store`) opens both stores with AES-256 under a per-install `expo-crypto` key in a `SecureValue` (`afterFirstUnlock`); migrates and deletes the plaintext store; a missing key starts empty, an unreadable one uses a throwaway store. Tests cover migration, missing, malformed and unreadable keys. **Still open:** checking the files on a device aren't readable as text, and an upgrade install keeping preferences. `expo-crypto` is a new native module, so dev clients need a rebuild.

- `src/features/storage/local-value/adapter.ts` (and the session-value and query-cache MMKV instances): create MMKV with `encryptionKey`. The key is generated once per install (cryptographically random, 16+ bytes), stored with `SecureValue`, never in source.
- Migration: on first run after the change, read the old unencrypted instance, write into the encrypted one, delete the old one. Corrupt or missing key → start empty, don't crash (same rule as today's corrupt-JSON handling).
- Web: MMKV's web build is `localStorage`, which can't be meaningfully encrypted client-side; document that web keeps only non-sensitive values there (already the rule for `LocalValue`).
- Done when: the MMKV files on a device aren't readable as text; upgrade from an unencrypted build keeps preferences; tests cover migration and a missing key.

**SEC-03 · Persist the query cache by opt-in** — roadmap 07/14 · ½ day — **Done 2026-10-19:** `meta: { persist: true }`; `persister.test.ts` covers marked, unmarked and failed queries across a relaunch.

- `src/features/api/provider.tsx`: flip `shouldPersist` from opt-out (`meta.persist === false`) to opt-in (`meta.persist === true`), so personal data never reaches disk unless a query is marked safe to keep. Document per-query in `src/features/api/index.md`.
- Done when: an unmarked query isn't in the persisted cache; a marked one survives a relaunch (test).

**SEC-04 · Device-only Keychain for credentials** — roadmap 07 · ½ day — **Done 2026-10-19** in code: every `SecureValue` is `*_THIS_DEVICE_ONLY`, with `access: "whenUnlocked"` (default) or `"afterFirstUnlock"`. **Still open:** the restore-onto-another-device check.

- `src/features/storage/secure-value/backend/index.ts`: pass `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY` (iOS). Android Keystore keys are already device-bound.
- Decide per value whether it should survive a restore (an install id may; tokens must not) — expose it as an option on `SecureValue` if both are needed.
- Done when: a token isn't present after restoring an encrypted backup onto another device (device check, recorded).

**SEC-05 · Web security headers** — roadmap 09 · 1 day — **Partly done 2026-10-19:** server middleware sends every header on pages and API routes (checked with `npx expo serve`); CSP in report-only. **Still open:** clear the two CSP reports (an inline script; an `eval`) and set `ENFORCE_CSP`; headers for static files at the host; a check in the E2E web job.

- `src/app/+middleware.ts` (Expo Router server middleware, with `expo-server`'s `setResponseHeaders`) or the hosting config, whichever deploys: `Content-Security-Policy` (start in report-only, then enforce; allow the API origin, map tile/glyph hosts, image hosts), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `frame-ancestors 'none'` (or `X-Frame-Options: DENY`), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` limited to what the app uses (geolocation, camera for the image picker).
- Done when: the production export served with `npx expo serve` returns every header (checked in the E2E web job), and the app still loads maps, images and the API under the enforced CSP.

**SEC-06 · Redact request logging** — roadmap 09 · ½ day — **Done 2026-10-19.** Also fixed with it: the token check now resolves the full URL as axios sends it and compares it to the configured API origin (a `//host` path or a per-call `baseURL` previously got the token), and refuses ambiguous URLs (`//`, backslashes, control characters, surrounding spaces). Redaction: `redact` / `redactUrl` in `src/features/logger`, applied to params, bodies, responses, failures and URLs in the API client; tests cover a sign-in body.

- `src/features/logger` + `src/features/api/client.ts`: an allowlist-first redactor applied to logged params and bodies — keys matching `password|token|secret|otp|code|authorization|cookie|card|cvv` become `"[redacted]"`; strings that look like JWTs are masked. Never log headers.
- Done when: unit tests show a sign-in body logged with `password` and `token` redacted.

**SEC-07 · Harden the WebView** — roadmap 09 · 1 day — **Done 2026-10-19:** `navigationDecision` (exact origins; off-list http(s) to the system browser; other schemes refused), file access and multiple windows off. `originWhitelist` is deliberately `*`: the library's matching is a prefix match and opens off-list schemes itself. On the web, outgoing bridge messages are addressed to each trusted origin (`postTargets`), never `"*"`, so a frame that navigated away receives nothing.

- `src/components/web-view`: `originWhitelist` from an allowlist prop (default: the page's own origin), `onShouldStartLoadWithRequest` that opens off-list links in the system browser, `allowFileAccess`/`allowUniversalAccessFromFileURLs` off, `setSupportMultipleWindows` off, and the bridge rejects messages whose origin isn't on the list.
- Done when: tests cover a blocked navigation and a bridge message from a foreign origin.

**SEC-08 · API route baseline** — roadmap 14 · ½ day now, more per route — **Done 2026-10-19:** `/api/health` returns `{ status }`; route rules in `src/app/api/index.md`. **Still open:** rate limiting with the first real route.

- `/api/health`: return `{ status }` only. Add `src/app/api/index.md` rules for every new route: authenticate (bearer token checked server-side), validate input with zod, rate-limit (hosting or middleware), return generic errors, never log bodies.
- Done when: the health route leaks no version; the route guide states the rules.

### Phase 2 — before handling real accounts

Designed together with the auth feature (roadmap 14).

**SEC-09 · Session lifecycle** — 3–5 days

- Short-lived access token + refresh token in `SecureValue` (`scope: "session"`); single-flight refresh in the API client; revoke on sign-out (server call + `StorageSession.end()`); `forceLogout` on refresh failure (the hook exists in `apiEvents`).
- Idle timeout and re-authentication (biometric via `expo-local-authentication`, with passcode fallback) before sensitive actions.
- Done when: refresh races, revoked tokens, offline expiry and biometric-change cases have tests or recorded device checks.

**SEC-10 · Screen privacy and data-handling review** — 1–2 days

- Blur / hide content in the app switcher; `FLAG_SECURE` (Android) and a screenshot notice (iOS) on screens marked sensitive; clear the clipboard after copying secrets.
- Crash reports and analytics (`expo-observe`): scrub personal data, ask for consent where required, document what's collected.
- Store disclosures: App Store privacy labels, Play Data safety form, iOS required-reason APIs (MMKV and file timestamps are on Apple's list), export compliance (`ITSAppUsesNonExemptEncryption`).
- Done when: the disclosures match the data inventory (SEC-17) and a sensitive screen doesn't appear in the app switcher.

### Phase 3 — pipeline and process

What SOC 2 / ISO 27001 auditors ask to see. Mostly roadmap 05, 18 and 20.

**SEC-11 · Static analysis** — ½ day — **Partly done 2026-10-19:** CodeQL (JavaScript/TypeScript and the workflows, `security-extended` queries) runs as jobs in the Code quality workflow. **Still open:** turn GitHub's CodeQL default setup off, enable the pull-request trigger and a weekly schedule, and triage findings under the severity policy (SEC-16).

**SEC-12 · Scheduled vulnerability scan** — ½ day — **Done 2026-10-19:** weekly `Vulnerability scan` workflow (OSV-Scanner, checksum-pinned) fails on CVSS 7.0+ outside `osv-scanner.toml`; three build-only highs registered until 2026-11-19 and need an owner. **Still open:** turn on Dependabot security updates (GitHub setting). Original: weekly OSV-Scanner (or `npm audit --omit=dev`) workflow over `yarn.lock`, failing on high/critical with an exception register (owner + expiry). Turn on Dependabot security updates (the version-update config exists, paused).

**SEC-13 · SBOM** — ½ day — CycloneDX SBOM generated for each release build and attached to the release; licence report from the same data.

**SEC-14 · Build provenance** — 1 day, with roadmap 18 — GitHub artifact attestations (SLSA build provenance) for the web export and the EAS build metadata; release notes record commit, version, build ids.

**SEC-15 · Pin the Maestro installer** — ½ day — **Done 2026-10-19:** `.github/actions/maestro` downloads the release and checks its SHA-256 (matches GitHub's digest). Original: download the release archive for `MAESTRO_VERSION` and verify its SHA-256 instead of `curl | bash`.

**SEC-16 · Repository controls and policy** — 1 day — **Partly done 2026-10-19:** `SECURITY.md`, severity policy and register (`docs/security/exceptions.md`), `.github/CODEOWNERS`. **Still open:** the GitHub settings below, which need a human.

- `SECURITY.md`: supported versions, private reporting (GitHub private vulnerability reporting), response times.
- Severity policy (critical/high/medium/low → fix-by times) and an exception register (`docs/security/exceptions.md`: owner, reason, expiry).
- GitHub settings (human, recorded here): secret scanning + push protection, branch protection on `main` (required reviews and the `Code quality / *` jobs), `CODEOWNERS` for `src/features/{api,storage,deep-links}`, `.github/`, `app.config.ts`.

**SEC-17 · Data inventory and threat model** — 2 days — **Done 2026-10-19:** [data inventory](../security/data-inventory.md) and [threat model](../security/threat-model.md); review with each trigger they list.

- `docs/security/data-inventory.md`: every persisted or transmitted field — owner, purpose, storage (`LocalValue` / `SessionValue` / `SecureValue` / query cache / server), retention, deletion, telemetry exposure. The classification column drives SEC-02/03/10.
- `docs/security/threat-model.md`: STRIDE over the app, web build, API routes, CI and release; each threat mapped to a control above or an accepted risk.

**SEC-18 · Incident and credential runbook** — 1 day

- `docs/security/incident-response.md`: contacts, severity triage, how to rotate each credential in the [product guide](../product-guide.md#credentials-and-where-they-live), how to halt a rollout (EAS Update channel, store phased release), user communication, post-incident review. A tabletop exercise before the first public release (roadmap 19).

### Phase 4 — only when the risk calls for it

Product-triggered (payments, health, finance, high-value accounts — MASVS L2). Each needs a documented threat first, as the controls note says.

| Package | Control                                                          | Trigger                                     |
| ------- | ---------------------------------------------------------------- | ------------------------------------------- |
| SEC-19  | Certificate pinning (with a pin-rotation plan and a kill switch) | Hostile-network threat to a high-value API  |
| SEC-20  | Root / jailbreak detection, with a degrade-don't-block policy    | Fraud or DRM requirement                    |
| SEC-21  | App attestation (Play Integrity, App Attest) checked server-side | API abuse by modified clients               |
| SEC-22  | Code obfuscation / Hermes bytecode hardening                     | Valuable client-side logic                  |
| SEC-23  | Envelope encryption for larger sensitive payloads (see Controls) | A feature must store sensitive data locally |

## Verification and cadence

- Each package ends with an automated check where one is possible; device-only checks are recorded in this file with the date and device.
- MASVS evidence for a release is the set of done-when results above, collected in roadmap step 19.
- Recurring work (dependency scans, exception expiry, credential rotation drills) runs on the roadmap 20.x cadence.
