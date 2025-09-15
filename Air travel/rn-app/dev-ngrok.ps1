# dev-ngrok.ps1
# 사용법: powershell -NoProfile -ExecutionPolicy Bypass -File .\dev-ngrok.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "🚀 ngrok + Expo 자동화 시작..." -ForegroundColor Green

# 1) 기존 ngrok 종료
Write-Host "📱 기존 ngrok 프로세스 종료 중..." -ForegroundColor Yellow
try { Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force } catch {}
Start-Sleep -Seconds 2

# 2) ngrok 시작 (백그라운드)
Write-Host "🌐 ngrok 실행 중 (http 8001)..." -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList @("http","8001") -WindowStyle Hidden

# 3) ngrok 터널 준비 대기 (최대 10초)
Write-Host "⏳ ngrok 시작 대기 중..." -ForegroundColor Yellow
$tunnels = $null
for ($i=0; $i -lt 20; $i++) {
  try {
    $resp = Invoke-RestMethod "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
    if ($resp.tunnels -and $resp.tunnels.Count -gt 0) {
      $tunnels = $resp.tunnels
      break
    }
  } catch {}
  Start-Sleep -Milliseconds 500
}

if (-not $tunnels) {
  Write-Host "❌ ngrok URL 가져오기 실패: API가 응답하지 않습니다." -ForegroundColor Red
  Write-Host "🔧 수동으로 ngrok을 실행하고 URL을 확인해주세요." -ForegroundColor Yellow
  exit 1
}

# 4) 터널 URL 선택 (첫 번째 http/https 우선)
$ngrokUrl = ($tunnels | Where-Object { $_.public_url -match '^https?://' } | Select-Object -First 1).public_url
if (-not $ngrokUrl) {
  Write-Host "❌ ngrok URL 파싱 실패" -ForegroundColor Red
  exit 1
}
Write-Host "✅ ngrok URL 획득: $ngrokUrl" -ForegroundColor Green

# 5) 로컬 IP 탐지 (사설망 대역 우선)
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object {
    $_.IPAddress -match '^192\.168\.' -or
    $_.IPAddress -match '^10\.' -or
    $_.IPAddress -match '^172\.(1[6-9]|2[0-9]|3[01])\.'
  } | Select-Object -ExpandProperty IPAddress -First 1)

if (-not $localIP) { $localIP = "192.168.1.100" } # fallback
Write-Host "🏠 Local IP: $localIP" -ForegroundColor Yellow

# 6) 환경변수 설정 (동 프로세스, 이후 npx에 전달됨)
$env:EXPO_PUBLIC_IOS_API_BASE_URL = $ngrokUrl
$env:EXPO_PUBLIC_ANDROID_API_BASE_URL = "http://${localIP}:8001"
Write-Host "🔧 iOS/Web: EXPO_PUBLIC_IOS_API_BASE_URL = $($env:EXPO_PUBLIC_IOS_API_BASE_URL)" -ForegroundColor Green
Write-Host "🔧 Android: EXPO_PUBLIC_ANDROID_API_BASE_URL = $($env:EXPO_PUBLIC_ANDROID_API_BASE_URL)" -ForegroundColor Green

# 7) lib/api.ts 자동 업데이트 (스크립트 위치 기준)
$apiFile = Join-Path $PSScriptRoot "lib\api.ts"
if (Test-Path $apiFile) {
  $content = Get-Content $apiFile -Raw

  # ngrok URL 패턴 치환 (좀 더 관대한 도메인 정규식)
  $patternNgrok = 'https://[a-zA-Z0-9\-]+\.ngrok(?:-free)?\.app'
  # 치환문자열에 $가 들어갈 경우 대비 (여기선 없지만 안전하게)
  $replacementNgrok = $ngrokUrl -replace '\$', '$$'
  $content = [regex]::Replace($content, $patternNgrok, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $replacementNgrok })

  # Android 로컬 IP 패턴 치환
  $patternLocal = 'http://192\.168\.\d+\.\d+:8001'
  $replacementLocal = "http://${localIP}:8001"
  $content = [regex]::Replace($content, $patternLocal, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $replacementLocal })

  Set-Content -Path $apiFile -Value $content -Encoding UTF8
  Write-Host "📝 lib/api.ts 파일 자동 업데이트 완료" -ForegroundColor Green
} else {
  Write-Host "ℹ️ lib/api.ts 파일이 없어 자동 업데이트를 건너뜁니다. (경로: $apiFile)" -ForegroundColor Yellow
}

# 8) Expo 앱 실행
Write-Host "📱 Expo 앱 시작 준비 완료" -ForegroundColor Green
Write-Host "🔗 API Base URL: $ngrokUrl" -ForegroundColor Cyan
Write-Host "💡 Ctrl+C로 중지할 수 있습니다." -ForegroundColor Yellow
Write-Host "📱 Expo 앱 시작 중..." -ForegroundColor Green

# StrictMode가 npx.ps1과 충돌하므로 Off로 전환 후 .cmd 실행
Set-StrictMode -Off
& (Join-Path $Env:ProgramFiles "nodejs\npx.cmd") expo start --clear


# 동일 프로세스 환경변수 전달을 위해 별도 프로세스 생성 대신 직접 호출

