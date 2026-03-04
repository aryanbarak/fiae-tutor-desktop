Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
  Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Step 'Build Tauri release bundles'
npm run tauri build

Write-Step 'Locate installer artifacts'
$bundleRoot = Join-Path $repoRoot 'src-tauri\target\release\bundle'
$nsis = Get-ChildItem (Join-Path $bundleRoot 'nsis') -Filter *.exe -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
$msi = Get-ChildItem (Join-Path $bundleRoot 'msi') -Filter *.msi -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending

if (-not $nsis -or -not $msi) {
  throw "Expected bundle artifacts not found under: $bundleRoot"
}

Write-Host "NSIS: $($nsis[0].FullName)"
Write-Host "MSI : $($msi[0].FullName)"
Write-Step 'Build complete'
