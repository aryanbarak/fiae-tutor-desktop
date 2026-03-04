param(
  [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)]
  [string[]]$Paths
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

foreach ($path in $Paths) {
  if (-not (Test-Path $path)) {
    throw "Path not found: $path"
  }

  $resolved = (Resolve-Path $path).Path
  $hash = (Get-FileHash -Path $resolved -Algorithm SHA256).Hash
  Write-Output "$hash  $resolved"
}
