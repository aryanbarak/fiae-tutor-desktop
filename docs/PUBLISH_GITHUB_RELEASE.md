# Publish GitHub Release

## 1) Ensure tag exists on remote
```powershell
git fetch --tags
git tag --list v1.0.0
git push origin v1.0.0
```

## 2) Open GitHub release page
- Go to: `https://github.com/aryanbarak/fiae-tutor-desktop/releases/new`
- Select tag: `v1.0.0`
- Release title: `CodeZertifikat v1.0.0`

## 3) Release notes
- Copy content from `docs/RELEASE_NOTES_v1.0.0.md`
- Paste into release description field.

## 4) Upload assets
Upload exactly:
- `src-tauri/target/release/bundle/nsis/CodeZertifikat_1.0.0_x64-setup.exe`
- `src-tauri/target/release/bundle/msi/CodeZertifikat_1.0.0_x64_en-US.msi`

## 5) Publish and verify
- Click **Publish release**.
- Verify both assets are downloadable.
- Verify SHA256 values against `docs/ARTIFACTS_v1.0.0.md`.
