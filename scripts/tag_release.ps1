Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

param(
  [string]$Tag = 'v1.0.0',
  [switch]$Push
)

function Write-Step([string]$Message) {
  Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Step 'Validate clean git status'
$status = git status --porcelain
if ($status) {
  throw "Working tree is not clean. Commit/stash changes before tagging."
}

Write-Step "Create annotated tag $Tag"
$existingTag = git tag --list $Tag
if ($existingTag) {
  throw "Tag already exists: $Tag"
}
git tag -a $Tag -m "Release $Tag"

$pushCmd = "git push origin $Tag"
Write-Step 'Next command'
Write-Host $pushCmd

if ($Push) {
  Write-Step 'Pushing tag'
  git push origin $Tag
}
