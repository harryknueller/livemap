@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0\.."

if not exist "dev" mkdir "dev" >nul 2>nul
if not exist "scripts\playerposition.py" (
  echo scripts\playerposition.py nicht gefunden.
  exit /b 1
)

for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%I"
if not defined STAMP set "STAMP=%DATE:~6,4%%DATE:~3,2%%DATE:~0,2%-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
set "STAMP=%STAMP: =0%"
set "REPORT=dev\playerposition-diagnostic-%COMPUTERNAME%-%STAMP%.txt"
set "STDOUT_LOG=dev\playerposition-stdout-%STAMP%.txt"
set "STDERR_LOG=dev\playerposition-stderr-%STAMP%.txt"

> "%REPORT%" echo Playerposition Diagnose
>> "%REPORT%" echo Zeit: %DATE% %TIME%
>> "%REPORT%" echo Computer: %COMPUTERNAME%
>> "%REPORT%" echo Projekt: %CD%
>> "%REPORT%" echo(

>> "%REPORT%" echo ==== Python ====
where python >> "%REPORT%" 2>&1
python --version >> "%REPORT%" 2>&1
python -c "import sys; print(sys.executable)" >> "%REPORT%" 2>&1
>> "%REPORT%" echo(

>> "%REPORT%" echo ==== Scapy ====
python -c "import scapy; print('scapy=' + scapy.__version__)" >> "%REPORT%" 2>&1
python -c "from scapy.all import sniff, TCP, IP; print('scapy-import-ok')" >> "%REPORT%" 2>&1
>> "%REPORT%" echo(

>> "%REPORT%" echo ==== Npcap ====
sc query npcap >> "%REPORT%" 2>&1
sc query npf >> "%REPORT%" 2>&1
>> "%REPORT%" echo(

>> "%REPORT%" echo ==== Logdatei ====
python -c "from pathlib import Path; p=Path(r'scripts/playerposition.log'); p.open('a', encoding='utf-8').write('DIAG write test\n'); print(p.resolve()); print('write-ok')" >> "%REPORT%" 2>&1
>> "%REPORT%" echo(

>> "%REPORT%" echo ==== Netzwerkadapter ====
powershell -NoProfile -Command "Get-NetAdapter | Select-Object Name, Status, InterfaceDescription | Format-Table -AutoSize" >> "%REPORT%" 2>&1
>> "%REPORT%" echo(

>> "%REPORT%" echo ==== Aktive Verbindungen Port 6061-6064 ====
netstat -ano | findstr /r ":6061 :6062 :6063 :6064" >> "%REPORT%" 2>&1
>> "%REPORT%" echo(

>> "%REPORT%" echo ==== Kurzstart playerposition.py ====
if exist "%STDOUT_LOG%" del "%STDOUT_LOG%" >nul 2>nul
if exist "%STDERR_LOG%" del "%STDERR_LOG%" >nul 2>nul

powershell -NoProfile -Command ^
  "try { " ^
  "  $p = Start-Process python -ArgumentList @('scripts/playerposition.py','--json') -PassThru -RedirectStandardOutput '%CD%\%STDOUT_LOG%' -RedirectStandardError '%CD%\%STDERR_LOG%' -WindowStyle Hidden; " ^
  "  Write-Output ('started pid=' + $p.Id); " ^
  "  Start-Sleep -Seconds 8; " ^
  "  $p.Refresh(); " ^
  "  if ($p.HasExited) { " ^
  "    Write-Output 'status=exited-early'; " ^
  "    Write-Output ('exit-code=' + $p.ExitCode); " ^
  "  } else { " ^
  "    Stop-Process -Id $p.Id -Force; " ^
  "    Write-Output 'status=running-after-8s'; " ^
  "    Write-Output ('killed pid=' + $p.Id); " ^
  "  } " ^
  "} catch { " ^
  "  Write-Output ('start-failed=' + $_.Exception.Message); " ^
  "  exit 1; " ^
  "}" >> "%REPORT%" 2>&1

>> "%REPORT%" echo -- stdout --
if exist "%STDOUT_LOG%" (
  powershell -NoProfile -Command "Get-Content -Path '%CD%\%STDOUT_LOG%' -Tail 40" >> "%REPORT%" 2>&1
) else (
  >> "%REPORT%" echo keine stdout-datei
)

>> "%REPORT%" echo(
>> "%REPORT%" echo -- stderr --
if exist "%STDERR_LOG%" (
  powershell -NoProfile -Command "Get-Content -Path '%CD%\%STDERR_LOG%' -Tail 40" >> "%REPORT%" 2>&1
) else (
  >> "%REPORT%" echo keine stderr-datei
)

>> "%REPORT%" echo(
>> "%REPORT%" echo ==== Letzte Logzeilen ====
powershell -NoProfile -Command "Get-Content -Path '%CD%\scripts\playerposition.log' -Tail 40" >> "%REPORT%" 2>&1
>> "%REPORT%" echo(

echo.
echo Diagnose fertig.
echo Report: %REPORT%
echo Stdout: %STDOUT_LOG%
echo Stderr: %STDERR_LOG%
echo.
echo Bitte diese 3 Dateien schicken, falls weiterhin keine Koordinaten gefunden werden.
exit /b 0
