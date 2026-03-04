# Icon Pipeline

Source icon:
- `assets/icon.png`

Generation command:
```powershell
npx tauri icon assets/icon.png
```

Generated outputs (under `src-tauri/icons/`):
- `icon.ico`
- `icon.png`
- `icon.icns`
- Platform variants (Windows Store, Android, iOS)

Tauri config icon references:
- `icons/32x32.png`
- `icons/128x128.png`
- `icons/128x128@2x.png`
- `icons/icon.icns`
- `icons/icon.ico`

Notes:
- Keep `assets/icon.png` as single source of truth.
- Regenerate icons after any brand icon update.
