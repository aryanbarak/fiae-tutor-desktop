# Local Release

## One-command release build
From repository root:

```powershell
.\scripts\release.ps1
```

## What it does
1. Validates toolchain and installs npm dependencies.
2. Exports tutor static content from sibling `fiae-tutor-core` and syncs to `src-tauri/resources/tutor/`.
3. Builds Tauri release bundles.

## Output artifacts
- `src-tauri/target/release/bundle/nsis/*.exe`
- `src-tauri/target/release/bundle/msi/*.msi`
