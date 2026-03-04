# Release Audit

Date: 2026-03-04
Repository: `fiae-tutor-desktop`

## Current state snapshot
- Product name (`src-tauri/tauri.conf.json`): `CodeZertifikat`
- Bundle identifier (`src-tauri/tauri.conf.json`): `cloud.barakzai.codezertifikat`
- Frontend package version (`package.json`): `0.1.0`
- Tauri config version (`src-tauri/tauri.conf.json`): `0.1.0`
- Rust package version (`src-tauri/Cargo.toml`): `0.1.0`

## Tool versions
- Node: `v25.2.1`
- npm: `11.6.2`
- rustc: `1.92.0 (ded5c06cf 2025-12-08)`
- cargo: `1.92.0 (344c4567c 2025-10-21)`
- tauri-cli: `2.9.6`

## Icon configuration
- Tauri icon references in config:
  - `icons/32x32.png`
  - `icons/128x128.png`
  - `icons/128x128@2x.png`
  - `icons/icon.icns`
  - `icons/icon.ico`
- Expected icon source file: `assets/icon.png`

## Tutor data loading paths (current)
- Runtime tutor execution uses Python core CLI from external core path via environment variables:
  - `FIAE_TUTOR_CORE_DIR` (default in `src-tauri/src/lib.rs`)
  - `FIAE_TUTOR_PYTHON` (default `python`)
- Frontend export route is served at `/export/...` (`src/views/PracticePage.tsx`, `src/App.tsx`).
- Bundled resources path exists at `src-tauri/resources/tutor/` and is used for packaged static tutor content distribution.

## Current build outputs
- `src-tauri/target/release/bundle/msi/CodeZertifikat_0.1.0_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/CodeZertifikat_0.1.0_x64-setup.exe`
- Legacy-named artifacts still present from prior builds:
  - `src-tauri/target/release/bundle/msi/fiae-app_0.1.0_x64_en-US.msi`
  - `src-tauri/target/release/bundle/nsis/fiae-app_0.1.0_x64-setup.exe`

## Top 5 risks
1. Local Node/npm versions are ahead of common LTS baselines; CI may resolve dependency trees differently.
2. Runtime depends on external Python core path; packaged app can fail if `FIAE_TUTOR_CORE_DIR` is not set correctly.
3. Export-sync content can drift from core if not regenerated before packaging.
4. Existing legacy artifacts in `target/release/bundle` can cause operator confusion during release pickup.
5. No existing release workflow in repo yet, so manual packaging can become non-deterministic.
