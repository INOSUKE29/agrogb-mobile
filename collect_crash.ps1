
# ================================================
# AgroGB - Script de Coleta Automática de Crash
# Conecte o celular via USB com Depuração USB ativa
# e execute: .\collect_crash.ps1
# ================================================

$ADB = "C:\Users\Bruno\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$APK = "$PSScriptRoot\android\app\build\outputs\apk\debug\app-debug.apk"
$LOG = "$PSScriptRoot\crash_log.txt"
$PKG = "com.agrogb.mobile"

if (-not (Test-Path $ADB)) {
    Write-Host "❌ ADB nao encontrado em: $ADB" -ForegroundColor Red
    exit 1
}

# 1) Aguardar dispositivo
Write-Host "⏳ Aguardando dispositivo USB..." -ForegroundColor Yellow
$timeout = 60
$elapsed = 0
do {
    $devices = & $ADB devices | Select-String -Pattern "\tdevice$"
    if ($devices) { break }
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host "   Aguardando... ($elapsed s)" -ForegroundColor Gray
} while ($elapsed -lt $timeout)

if (-not $devices) {
    Write-Host "❌ Nenhum dispositivo detectado em $timeout segundos." -ForegroundColor Red
    Write-Host "Certifique-se de: (1) USB conectado, (2) Depuracao USB ativa nas Opcoes do Desenvolvedor"
    exit 1
}

Write-Host "✅ Dispositivo conectado!" -ForegroundColor Green
& $ADB devices

# 2) Instalar APK
Write-Host "`n📦 Instalando APK debug..." -ForegroundColor Cyan
& $ADB install -r $APK
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha ao instalar APK" -ForegroundColor Red; exit 1
}
Write-Host "✅ APK instalado!" -ForegroundColor Green

# 3) Limpar logcat anterior
& $ADB logcat -c
Write-Host "`n🔍 Iniciando captura do logcat..." -ForegroundColor Cyan

# 4) Iniciar o app
Write-Host "🚀 Abrindo o app..." -ForegroundColor Cyan
& $ADB shell am start -n "$PKG/.MainActivity" | Out-Null

# 5) Capturar log por 15 segundos (tempo suficiente para crashar)
Write-Host "⏱️  Capturando por 15 segundos (aguarde o crash)..." -ForegroundColor Yellow
$job = Start-Job -ScriptBlock {
    param($adb, $log)
    & $adb logcat > $log
} -ArgumentList $ADB, $LOG

Start-Sleep -Seconds 15
Stop-Job $job
Remove-Job $job

# 6) Filtrar linhas relevantes
Write-Host "`n📋 RESULTADO — LINHAS CRÍTICAS DO CRASH:`n" -ForegroundColor Magenta
$relevant = Get-Content $LOG | Select-String -Pattern "FATAL|AndroidRuntime|ReactNative|hermes|agrogb|com\.agrogb|Error:|Exception:|Process.*died"
if ($relevant) {
    $relevant | Select-Object -First 60 | ForEach-Object { Write-Host $_.Line -ForegroundColor Red }
} else {
    Write-Host "Nenhuma linha fatal encontrada. Mostrando ultimas 30 linhas:" -ForegroundColor Yellow
    Get-Content $LOG | Select-Object -Last 30
}

Write-Host "`n✅ Log completo salvo em: $LOG" -ForegroundColor Green
Write-Host "Cole o conteudo acima no chat para eu analisar!" -ForegroundColor Cyan
