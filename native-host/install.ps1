# Registers the Nubit native messaging host for Chrome / Edge / Brave / Chromium (current user only).
# Usage:  install.bat <EXTENSION_ID>     (or run install.bat and paste the ID when asked)
param([string]$ExtensionId)
$ErrorActionPreference = 'Stop'

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ExtensionId) {
  $ExtensionId = Read-Host 'Extension ID (open chrome://extensions, enable Developer mode, copy the ID under Nubit)'
}
$ExtensionId = $ExtensionId.Trim()
if ($ExtensionId -notmatch '^[a-p]{32}$') { throw "Invalid extension ID: '$ExtensionId' (expected 32 letters a-p)" }

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw 'Node.js was not found. Install it from https://nodejs.org (LTS) and run this script again.' }

$hostBat = Join-Path $here 'host.bat'
if (-not (Test-Path $hostBat)) { throw "host.bat not found next to this script ($hostBat)" }

$manifest = [ordered]@{
  name            = 'com.nubit.host'
  description     = 'Nubit native host: runs local programs (yt-dlp, ffmpeg, ...) for the Nubit extension'
  path            = $hostBat
  type            = 'stdio'
  allowed_origins = @("chrome-extension://$ExtensionId/")
}
$manifestPath = Join-Path $here 'com.nubit.host.json'
$json = $manifest | ConvertTo-Json
[System.IO.File]::WriteAllText($manifestPath, $json, (New-Object System.Text.UTF8Encoding $false))

$keys = @(
  'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.nubit.host',
  'HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.nubit.host',
  'HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.nubit.host',
  'HKCU:\Software\Chromium\NativeMessagingHosts\com.nubit.host'
)
foreach ($k in $keys) {
  New-Item -Path $k -Force | Out-Null
  Set-ItemProperty -Path $k -Name '(default)' -Value $manifestPath
}

Write-Host ''
Write-Host "Nubit native host installed." -ForegroundColor Green
Write-Host "  Manifest : $manifestPath"
Write-Host "  Node.js  : $($node.Source)"
Write-Host "  Extension: $ExtensionId"
Write-Host ''
Write-Host 'Now open the extension settings and press "Check helper". If the extension is already open, reload it first.'
