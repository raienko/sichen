[Docs](../index.md) › [Roadmap](../../Roadmap.md) › Plans

# GitHub Actions and EAS

> The workflows to add, when, and the rules every one of them follows. Referenced by roadmap steps 03, 15 and 18.

| Workflow                              | Add at step            | Trigger                                                                  | Credential boundary                                                 | Required result                                                                                                                 |
| ------------------------------------- | ---------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `code-quality.yml` ✓ (manual for now) | 03                     | Pull requests, pushes to `main`, manual dispatch                         | None                                                                | Frozen install; quality, tests/coverage, web export, Storybook, dependency/config health; artifacts and stable required checks. |
| `scheduled-health.yml`                | 05/20                  | Weekly and manual                                                        | None unless an explicitly reviewed remote check requires it         | Dependency/native duplicate, patch, security/license, and bundle trend report.                                                  |
| `native-build.yml`                    | 15                     | Manual validated platform/profile input; optional selected `main` pushes | Preview GitHub environment and preview Expo identity                | Development/preview EAS build IDs and URLs with authoritative status ownership.                                                 |
| `preview.yml`                         | 15                     | Manual or trusted same-repository label/comment after CI                 | Preview environment                                                 | One updated PR summary/comment; EAS Update only for runtime-compatible JS/assets, native build otherwise.                       |
| `release.yml`                         | 18                     | Protected `v*` tag or protected manual dispatch from `main`              | Production environment, reviewer approval, production Expo identity | Re-run gates, serialize, verify version/config, build and submit, wait for results, record provenance.                          |
| `web-deploy.yml`                      | After hosting decision | Protected deployment trigger                                             | Hosting environment                                                 | Deploy already-validated web artifact independently of mobile store submission.                                                 |

| Workflow rule           | Policy                                                                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Working directory/cache | Run app commands from the repository root and key caches from `yarn.lock`; do not restore `node_modules` as truth.                                                         |
| Fork safety             | Fork PRs run secret-free checks only. Never check out untrusted PR heads in a privileged `pull_request_target` job.                                                        |
| Permissions             | Default `GITHUB_TOKEN` to `contents: read`; grant narrow job-level write permissions only when required.                                                                   |
| Credentials             | Separate preview/production Expo tokens; keep Apple/Google signing and submit credentials in EAS; prefer short-lived/OIDC access where supported.                          |
| Actions                 | Pin third-party actions to full commit SHAs and let Dependabot propose reviewed updates.                                                                                   |
| Concurrency             | Cancel superseded PR/preview runs; serialize and never auto-cancel production releases.                                                                                    |
| Artifacts               | Short retention; never upload env files, signing material, service-account JSON, App Store keys, SecureStore dumps, EAS local state, or Atlas transformed source publicly. |
| Promotion               | Start with TestFlight and Play internal testing; production promotion remains an explicit human approval until a reviewed automation policy says otherwise.                |
