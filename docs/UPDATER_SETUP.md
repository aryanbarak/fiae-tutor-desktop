# Updater Setup (Tauri v2)

This project is configured to use Tauri updater against GitHub Releases.

## Current updater endpoint
- `https://github.com/aryanbarak/fiae-tutor-desktop/releases/latest/download/latest.json`

## Public key location
- Updater public key is embedded in:
  - `src-tauri/tauri.conf.json` at `plugins.updater.pubkey`
- Local generated key files (developer machine only, never commit):
  - Private key: `C:\Users\aryan\.tauri\codezertifikat.key`
  - Public key file: `C:\Users\aryan\.tauri\codezertifikat.key.pub`
  - Local password file: `C:\Users\aryan\.tauri\codezertifikat.key.password.txt`

## Required GitHub Secrets
Add these repository secrets before running release workflow:

1. `TAURI_SIGNING_PRIVATE_KEY`
- Purpose: Private key used by Tauri bundler to sign updater artifacts.
- Value: Full private key text (or key path if your runner supports it; recommended: key text).

2. `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- Purpose: Password to decrypt signing private key.
- Value: Password used when generating the private key.

3. `GITHUB_TOKEN` (provided automatically by Actions)
- Purpose: Upload release assets to GitHub Release.

## Release workflow behavior
`.github/workflows/release.yml` now:
- triggers on tags `v*.*.*`
- builds NSIS + MSI
- generates updater metadata (`latest.json`) and signature files (`*.sig`) via signed build
- validates:
  - `latest.json` exists
  - `latest.json` version matches tag version
  - signature files exist
- uploads to GitHub Release:
  - NSIS installer
  - MSI installer
  - `latest.json`
  - `signatures/*.sig`
  - `SHA256SUMS.txt`

## How to test updater end-to-end
1. Install released `v1.0.0` build.
2. Bump app version to `1.0.1`, build/release with same signing key and workflow.
3. Publish tag `v1.0.1` so workflow uploads signed updater artifacts.
4. Start installed `v1.0.0` app and verify updater prompt appears.
5. Accept update and verify app relaunches as `1.0.1`.

## Security notes
- Never commit private key files to git.
- Rotate keys only with a migration plan because updater trust chain depends on public key continuity.
