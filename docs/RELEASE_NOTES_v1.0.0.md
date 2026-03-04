CodeZertifikat 1.0.0

## Highlights
- First public CodeZertifikat desktop release with production packaging workflow.
- Brand migration completed from FIAE Tutor to CodeZertifikat in app metadata and UI labels.
- Tutor execution, Exam Bank AP2, WISO, and export workflows preserved.
- Deterministic Windows release helpers for setup, export-sync, build, hash, and tag preparation.
- CI release workflow hardening for tag-based MSI/NSIS artifact generation.

## System Requirements (Windows x64)
- Windows 10 or Windows 11 (x64)
- For local rebuilds: Node.js, Rust toolchain, and Python 3.11+

## What's Included
- NSIS installer: `CodeZertifikat_1.0.0_x64-setup.exe`
- MSI installer: `CodeZertifikat_1.0.0_x64_en-US.msi`

## Verification (SHA256)
1. Open PowerShell in the folder containing artifacts.
2. Run: `Get-FileHash .\CodeZertifikat_1.0.0_x64-setup.exe -Algorithm SHA256`
3. Run: `Get-FileHash .\CodeZertifikat_1.0.0_x64_en-US.msi -Algorithm SHA256`
4. Compare with `SHA256SUMS.txt` values.

## Known Issues
- Build output may show a frontend chunk-size warning; this does not block packaging.

## Binary Signing Note
- Current release artifacts are not code-signed. Windows SmartScreen prompts may appear depending on host policy and reputation.
