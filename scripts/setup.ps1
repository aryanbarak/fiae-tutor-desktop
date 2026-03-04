Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
  Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Assert-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

Write-Step 'Toolchain checks'
Assert-Command node
Assert-Command npm
Assert-Command rustc
Assert-Command cargo

Write-Host "node: $(node -v)"
Write-Host "npm: $(npm -v)"
Write-Host "rustc: $(rustc -V)"
Write-Host "cargo: $(cargo -V)"

Write-Step 'Tauri CLI check'
$tauriVersion = npx --yes @tauri-apps/cli@2 --version
Write-Host "tauri: $tauriVersion"

Write-Step 'npm install'
npm install

Write-Step 'Setup complete'
