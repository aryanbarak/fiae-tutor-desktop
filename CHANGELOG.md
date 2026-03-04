# Changelog

All notable changes to this project are documented in this file.

## [1.0.0] - 2026-03-04

### Added
- Release docs and release checklist for first public release.
- Windows-first local release scripts (`setup`, `export-sync`, `build`, `release`).
- CI workflows for validation and tagged release packaging.
- Tauri-generated icon set from `assets/icon.png`.

### Changed
- Brand renamed to **CodeZertifikat** in Tauri product/window title and visible UI labels.
- Application identifiers updated for new brand.
- Release version aligned to `1.0.0` across package, cargo, and Tauri config.

### Notes
- Core API contracts and request/response shapes remain unchanged.
- Existing tutor, exam bank, WISO, and export behaviors are preserved.
