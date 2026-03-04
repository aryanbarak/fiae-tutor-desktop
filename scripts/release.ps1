Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
  Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$setupScript = Join-Path $PSScriptRoot 'setup.ps1'
$syncScript = Join-Path $PSScriptRoot 'export-sync.ps1'
$buildScript = Join-Path $PSScriptRoot 'build.ps1'
$hashScript = Join-Path $PSScriptRoot 'hash.ps1'

Write-Step 'Release pipeline start'

& $setupScript
& $syncScript
& $buildScript

$bundleRoot = Join-Path $repoRoot 'src-tauri\target\release\bundle'
$nsis = Get-ChildItem (Join-Path $bundleRoot 'nsis') -Filter *.exe -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$msi = Get-ChildItem (Join-Path $bundleRoot 'msi') -Filter *.msi -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$packageVersion = (Get-Content (Join-Path $repoRoot 'package.json') | ConvertFrom-Json).version
$commitSha = (git -C $repoRoot rev-parse HEAD).Trim()
$buildDate = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz')
$artifactsDoc = Join-Path $repoRoot ("docs\ARTIFACTS_v{0}.md" -f $packageVersion)

Write-Step 'Compute artifact hashes'
$nsisHashLine = & $hashScript $nsis.FullName
$msiHashLine = & $hashScript $msi.FullName
$nsisHash = ($nsisHashLine -split '\s{2,}')[0]
$msiHash = ($msiHashLine -split '\s{2,}')[0]

Write-Step 'Write artifacts report'
$lines = @(
  "# Artifacts v$packageVersion",
  "",
  "Commit SHA: $commitSha",
  "Build Date: $buildDate",
  "",
  "## Artifacts",
  "- NSIS: $($nsis.FullName)",
  "  - SHA256: $nsisHash",
  "- MSI: $($msi.FullName)",
  "  - SHA256: $msiHash"
)
Set-Content -Path $artifactsDoc -Value $lines

Write-Step 'SUCCESS'
Write-Host "NSIS: $($nsis.FullName)"
Write-Host "MSI : $($msi.FullName)"
Write-Host "DOC : $artifactsDoc"
