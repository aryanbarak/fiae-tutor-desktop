# Release Notes v1.0.0

## What is CodeZertifikat
CodeZertifikat is the first public desktop release of the algorithm learning and exam-practice tool previously developed as FIAE Tutor.

## Main features
- Tutor execution flow for supported algorithm topics.
- Exam Bank AP2 content integration.
- WISO topic support.
- Export capabilities for tutor content and PDF workflows.

## Offline / online behavior
- Core tutor execution is local (desktop invokes local Python core CLI).
- Static tutor resources are bundled into desktop package when export-sync is run before build.
- No external cloud backend is required for basic tutor run and bundled content usage.

## Minimum system requirements
- Windows 10/11 x64
- Node.js LTS (for local build workflows)
- Rust stable toolchain (for local build workflows)
- Python 3.11+ (for export-sync from core)

## Known limitations
1. Runtime depends on valid local Python/core setup (`FIAE_TUTOR_CORE_DIR`, `FIAE_TUTOR_PYTHON`) for live tutor execution.
2. Exported content can become stale if `scripts/export-sync.ps1` is skipped before packaging.
3. Current frontend build may report chunk size warnings in production build output.

## Install on Windows
1. Download one installer from GitHub Release assets:
   - NSIS: `CodeZertifikat_1.0.0_x64-setup.exe`
   - MSI: `CodeZertifikat_1.0.0_x64_en-US.msi`
2. Run installer and complete setup wizard.
3. Launch `CodeZertifikat` from Start Menu or desktop shortcut.
