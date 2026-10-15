param([int]$Port = 8771, [switch]$NoBrowser)
# Starts the local game server (tools/serve.py) and opens the game in the default browser.
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$url = "http://localhost:$Port/index.html"
$Host.UI.RawUI.WindowTitle = "오르카 던전 돌파 - 서버 (포트 $Port)"

# fast TCP probe (Invoke-WebRequest on Windows PowerShell 5.1 can stall for seconds on proxy detection)
function Test-Up {
  $c = New-Object System.Net.Sockets.TcpClient
  try { $ar = $c.BeginConnect('127.0.0.1', $Port, $null, $null); if (-not $ar.AsyncWaitHandle.WaitOne(300)) { return $false }; $c.EndConnect($ar); return $true }
  catch { return $false } finally { $c.Close() }
}
function Open-Game { if (-not $NoBrowser) { Start-Process $url } }

if (Test-Up) {
  Write-Host "서버가 이미 실행 중입니다. 브라우저에서 게임을 엽니다." -ForegroundColor Yellow
  Write-Host "  $url"
  Open-Game
  Start-Sleep -Seconds 3
  exit 0
}

# python, then the py launcher
$py = $null; $pyArgs = @()
if (Get-Command python -ErrorAction SilentlyContinue) { $py = 'python' }
elseif (Get-Command py -ErrorAction SilentlyContinue) { $py = 'py'; $pyArgs = @('-3') }
if (-not $py) {
  Write-Host "[오류] Python을 찾을 수 없습니다. https://www.python.org/downloads/ 에서 설치 후 다시 실행하세요." -ForegroundColor Red
  Read-Host "Enter 키를 누르면 닫힙니다"
  exit 1
}

Write-Host "서버를 시작합니다: $url" -ForegroundColor Cyan
Write-Host "이 창을 닫으면 서버가 꺼집니다."
$proc = Start-Process -FilePath $py -ArgumentList ($pyArgs + @('tools\serve.py', "$Port")) -NoNewWindow -PassThru

# wait until it answers, then open the browser
$ok = $false
for ($i = 0; $i -lt 60; $i++) {
  if ($proc.HasExited) { break }
  if (Test-Up) { $ok = $true; break }
  Start-Sleep -Milliseconds 250
}
if (-not $ok) {
  Write-Host "[오류] 서버가 시작되지 않았습니다. 포트 $Port 를 다른 프로그램이 쓰고 있는지 확인하세요." -ForegroundColor Red
  if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
  Read-Host "Enter 키를 누르면 닫힙니다"
  exit 1
}
Write-Host "준비 완료. 브라우저에서 게임을 엽니다." -ForegroundColor Green
Open-Game
Wait-Process -Id $proc.Id
