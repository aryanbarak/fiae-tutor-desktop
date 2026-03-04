Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
  Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$setupScript = Join-Path $PSScriptRoot 'setup.ps1'
$syncScript = Join-Path $PSScriptRoot 'export-sync.ps1'
$buildScript = Join-Path $PSScriptRoot 'build.ps1'

Write-Step 'Release pipeline start'

& $setupScript
& $syncScript
& $buildScript

$bundleRoot = Join-Path $repoRoot 'src-tauri\target\release\bundle'
$nsis = Get-ChildItem (Join-Path $bundleRoot 'nsis') -Filter *.exe -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$msi = Get-ChildItem (Join-Path $bundleRoot 'msi') -Filter *.msi -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1

Write-Step 'SUCCESS'
Write-Host "NSIS: $($nsis.FullName)"
Write-Host "MSI : $($msi.FullName)"
