[Docs](../index.md) › [Security plan](plan.md) › Data inventory

# Data inventory

> Every field the app keeps on the device or sends off it, and how it's classified. The classification decides where a field may be stored, whether it may reach logs or telemetry, and what the store privacy answers say.

Last reviewed 2026-10-19, against the code at that date. **Update it in the same change that adds, moves or starts sending a field** — a new `LocalValue`, `SecureValue`, persisted query (`meta: { persist: true }`), request header, log line or telemetry event. CODEOWNERS routes this folder to review.

## Classes

| Class        | Means                                                             | May be stored in                                     | In logs / telemetry |
| ------------ | ----------------------------------------------------------------- | ---------------------------------------------------- | ------------------- |
| **Public**   | Anyone may see it; it's in the app bundle or on a public page     | anywhere                                             | yes                 |
| **Internal** | Not personal, not secret: settings, ids that identify an install  | `LocalValue` (encrypted MMKV on native)              | yes                 |
| **Personal** | About an identifiable person: account, profile, location, content | memory; query cache only after review                | no — redacted       |
| **Secret**   | Grants access: tokens, keys, passwords, one-time codes            | `SecureValue` only; never a URL, log, or web storage | never               |

## On the device

| Field                     | Where                             | Class     | Owner / purpose                                           | Retention, deletion                                     | Backup                                                |
| ------------------------- | --------------------------------- | --------- | --------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| `storage-encryption-key`  | `SecureValue`, `afterFirstUnlock` | Secret    | storage — encrypts every MMKV store on native             | until uninstall (iOS Keychain may outlive it)           | device-only; never                                    |
| `theme-preference`        | `LocalValue`                      | Internal  | theme — light / dark / system                             | until changed or uninstall                              | off (Android); iOS: file, but its key doesn't restore |
| `locale-preference`       | `LocalValue`                      | Internal  | localization — chosen language                            | same                                                    | same                                                  |
| `os-locale`               | `LocalValue`                      | Internal  | localization — last OS language, to notice a change       | same                                                    | same                                                  |
| `haptics-enabled`         | `LocalValue`                      | Internal  | haptics — user setting                                    | same                                                    | same                                                  |
| `permission-<name>`       | `LocalValue`                      | Internal  | permissions — last-known status snapshot                  | refreshed from the OS on use                            | same                                                  |
| `device-install-id`       | `LocalValue`                      | Internal  | device — random per-install id sent as `X-Install-Id`     | until uninstall; not linked to an account by the app    | same                                                  |
| Query cache               | encrypted MMKV `query-cache`      | per query | api — only queries marked `persist: true`; none today     | 24 h, cleared on version change and sign-out            | same                                                  |
| `showcase-*`              | `LocalValue` / `SecureValue`      | Internal  | showcase demo only; leaves with the showcase (roadmap 14) | until uninstall                                         | same                                                  |
| Picked images / documents | OS temp / cache directories       | Personal  | image-picker, document-picker — attachments               | OS-managed; upload and cleanup policy open (roadmap 09) | not app-controlled                                    |

On the web, `LocalValue` is plain `localStorage` and `SecureValue` is memory only; the web keeps only Internal values.

## Sent off the device

| Data                                                                                         | To                                                  | Class               | Purpose                    | Notes                                                                   |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------- | -------------------------- | ----------------------------------------------------------------------- |
| `Authorization: Bearer …`                                                                    | own API origin only                                 | Secret              | session (once auth exists) | never to a third-party origin, never logged                             |
| `X-App-Version`, `X-App-Build`, `X-Platform`, `X-Device-Model`, `X-OS-Version`, `User-Agent` | own API and absolute URLs                           | Internal            | support and compatibility  | every request                                                           |
| `X-Timezone`                                                                                 | same                                                | Internal            | server-side date handling  | coarse location signal — disclose in privacy labels                     |
| `X-Install-Id`                                                                               | same                                                | Internal            | rate-limiting, support     | an identifier under App Store / Play rules: disclose as a device id     |
| Request bodies and params                                                                    | own API                                             | varies              | the feature using them     | dev logs redacted (`redact`); production logging off                    |
| Location (foreground)                                                                        | map tiles provider (implicitly, via viewport tiles) | Personal            | maps — centre the map      | not persisted; the device position itself isn't sent by the app         |
| Map tile and glyph requests                                                                  | OpenFreeMap (or `EXPO_PUBLIC_MAP_*`)                | Internal            | maps                       | IP address and viewed area visible to the provider                      |
| Crash and performance data                                                                   | EAS Observe (`expo-observe`)                        | Internal / Personal | stability                  | only in builds with an EAS project id; scrubbing and consent are SEC-10 |
| Push token                                                                                   | Expo push service (when enabled)                    | Internal            | notifications              | not sent to the app's own server yet                                    |

## Not collected

No advertising id, contacts, background location, microphone audio, health data or payment details. Adding any of these is a new class of data: update this file, the threat model and the store disclosures first.

---

[Security plan](plan.md) · [Threat model](threat-model.md) · [Docs index](../index.md)
