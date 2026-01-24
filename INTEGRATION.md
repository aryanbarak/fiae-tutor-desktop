# FIAE Tutor Desktop - Setup Guide

This Tauri desktop app connects to the Python CLI core via child process communication.

## Prerequisites

1. **Python Core**: The `fiae-tutor` repository must be set up and working
2. **Python**: Python 3.8+ installed and accessible
3. **Node.js**: Node.js 18+ for the Tauri frontend

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and configure paths:
   ```
   FIAE_TUTOR_CORE_DIR=C:\Projects\fiae-workspace\fiae-tutor
   FIAE_TUTOR_PYTHON=python
   ```

   **Important:**
   - `FIAE_TUTOR_CORE_DIR` must point to your local `fiae-tutor` repository
   - `FIAE_TUTOR_PYTHON` should be `python` (Windows) or `python3` (Linux/Mac)
   - Both variables are **REQUIRED** - the app will fail with clear errors if missing

## Running the App

```bash
npm install
npm run tauri dev
```

## Testing the Connection

1. Click the **"Test Core اتصال"** button in the UI
2. Expected result: JSON output with `result.sorted == [1,2,3]`
3. If errors occur, they will be displayed in the output panel

## Architecture

- **Rust Backend** (`src-tauri/src/lib.rs`): Spawns Python CLI as child process
- **TypeScript Client** (`src/api/coreClient.ts`): Type-safe wrapper for Tauri commands
- **React UI** (`src/App.tsx`): Test interface for core communication

## Error Handling

All errors are surfaced to the UI with descriptive messages:
- Missing environment variables
- Python not found
- Core directory not found
- JSON parsing errors
- Process timeout (10s)

No silent failures - every error is logged and displayed.

## Workspace Structure

```
C:\Projects\fiae-workspace\
├── fiae-tutor\              # Python core (separate repo)
│   └── src/fiae_tutor/
└── fiae-tutor-desktop\      # This Tauri app (separate repo)
    ├── .env                 # Local config (gitignored)
    ├── .env.example         # Template
    ├── src/
    │   ├── api/coreClient.ts
    │   └── App.tsx
    └── src-tauri/
        └── src/lib.rs
```

Both projects remain **separate repositories** - integration is via environment configuration only.
