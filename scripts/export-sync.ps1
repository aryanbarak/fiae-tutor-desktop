Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
  Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$suiteRoot = Split-Path -Parent $repoRoot
$coreRoot = Join-Path $suiteRoot 'fiae-tutor-core'
$exportRoot = Join-Path $repoRoot 'build\export\tutor'
$targetRoot = Join-Path $repoRoot 'src-tauri\resources\tutor'

Write-Step 'Validate paths'
if (-not (Test-Path $coreRoot)) {
  throw "Missing sibling core repo: $coreRoot"
}

$venvPython = Join-Path $coreRoot '.venv\Scripts\python.exe'
$pythonCmd = if (Test-Path $venvPython) { $venvPython } else { 'python' }
Write-Host "Core path: $coreRoot"
Write-Host "Python command: $pythonCmd"

Write-Step 'Export tutor static from core'
if (Test-Path $exportRoot) {
  Remove-Item -Recurse -Force $exportRoot
}
New-Item -ItemType Directory -Path $exportRoot -Force | Out-Null

Push-Location $coreRoot
try {
  & $pythonCmd -m fiae_tutor.export.tutor_static --out $exportRoot
} finally {
  Pop-Location
}

Write-Step 'Verify exported content'
$manifest = Join-Path $exportRoot 'manifest.json'
$index = Join-Path $exportRoot 'index.json'
$topics = Join-Path $exportRoot 'topics'
if (-not (Test-Path $manifest)) { throw "Missing export file: $manifest" }
if (-not (Test-Path $index)) { throw "Missing export file: $index" }
if (-not (Test-Path $topics)) { throw "Missing export directory: $topics" }
if (-not (Get-ChildItem $topics -Directory | Select-Object -First 1)) {
  throw "Exported topics directory is empty: $topics"
}

Write-Step 'Sync export into desktop resources'
if (Test-Path $targetRoot) {
  Remove-Item -Recurse -Force $targetRoot
}
New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
Copy-Item (Join-Path $exportRoot '*') $targetRoot -Recurse -Force

Write-Step 'Verify synced resources'
if (-not (Test-Path (Join-Path $targetRoot 'manifest.json'))) { throw 'Sync failed: manifest.json missing' }
if (-not (Test-Path (Join-Path $targetRoot 'index.json'))) { throw 'Sync failed: index.json missing' }
if (-not (Get-ChildItem (Join-Path $targetRoot 'topics') -Directory | Select-Object -First 1)) {
  throw 'Sync failed: topics/* missing'
}

Write-Step 'Export sync complete'
Write-Host "Synced to: $targetRoot"
