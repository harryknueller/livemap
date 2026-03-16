@echo off
setlocal
cd /d "%~dp0"
set "APP_DIR=%~dp0app"

echo ========================================
echo Livemap Installation
echo ========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] npm wurde nicht gefunden.
  echo Bitte installiere Node.js inklusive npm und starte install.bat danach erneut.
  pause
  exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] Python wurde nicht gefunden.
  echo Bitte installiere Python und starte install.bat danach erneut.
  pause
  exit /b 1
)

echo [1/2] Node-Abhaengigkeiten werden installiert...
pushd "%APP_DIR%"
call npm install
set "NPM_RESULT=%ERRORLEVEL%"
popd
if not "%NPM_RESULT%"=="0" (
  echo.
  echo [FEHLER] npm install ist fehlgeschlagen.
  pause
  exit /b 1
)

echo.
echo [2/2] Python-Abhaengigkeiten werden installiert...
python -m pip install --upgrade pip
python -m pip install scapy
if errorlevel 1 (
  echo.
  echo [FEHLER] Python-Abhaengigkeiten konnten nicht installiert werden.
  pause
  exit /b 1
)

echo.
echo ========================================
echo Installation abgeschlossen
echo ========================================
echo.
reg query "HKLM\SOFTWARE\Npcap" >nul 2>nul
if errorlevel 1 (
  reg query "HKLM\SOFTWARE\WOW6432Node\Npcap" >nul 2>nul
)

if errorlevel 1 (
  echo Npcap wurde nicht gefunden.
  echo Die Download-Seite wird jetzt geoeffnet.
  echo.
  start "" "https://npcap.com/#download"
) else (
  echo Npcap wurde gefunden.
)

echo.
pause
