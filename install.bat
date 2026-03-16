@echo off
setlocal
cd /d "%~dp0"
set "APP_DIR=%~dp0app"
set "PYTHON_CMD="

set "NODE_MISSING=0"
echo ========================================
echo Livemap Installation
echo ========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  set "NODE_MISSING=1"
)

where py >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=py"
) else (
  where python >nul 2>nul
  if not errorlevel 1 (
    set "PYTHON_CMD=python"
  )
)

if "%NODE_MISSING%"=="1" (
  echo [INFO] Node.js inklusive npm wurde nicht gefunden.
  where winget >nul 2>nul
  if errorlevel 1 (
    echo [HINWEIS] winget wurde nicht gefunden. Die Node.js-Download-Seite wird geoeffnet.
    start "" "https://nodejs.org/en/download"
    echo Bitte installiere Node.js LTS und starte install.bat danach erneut.
    pause
    exit /b 1
  )

  echo [INFO] Node.js LTS wird ueber winget installiert...
  winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
  if exist "%ProgramFiles%\nodejs\npm.cmd" set "PATH=%ProgramFiles%\nodejs;%PATH%"
  if exist "%LocalAppData%\Programs\nodejs\npm.cmd" set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
  where npm >nul 2>nul
  if errorlevel 1 (
    echo [FEHLER] Node.js konnte nicht automatisch installiert werden.
    echo Die Node.js-Download-Seite wird geoeffnet.
    start "" "https://nodejs.org/en/download"
    pause
    exit /b 1
  )
)

where winget >nul 2>nul
if errorlevel 1 (
  echo [HINWEIS] winget wurde nicht gefunden. Die Python-Download-Seite wird geoeffnet.
  start "" "https://www.python.org/downloads/windows/"
  echo Bitte installiere Python und starte install.bat danach erneut.
  pause
  exit /b 1
)

echo [INFO] Python wird jetzt ueber winget installiert oder aktualisiert...
winget install --id Python.Python.3.12 -e --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  winget upgrade --id Python.Python.3.12 -e --accept-package-agreements --accept-source-agreements
)

if exist "%LocalAppData%\Programs\Python\Python312\python.exe" set "PATH=%LocalAppData%\Programs\Python\Python312;%LocalAppData%\Programs\Python\Python312\Scripts;%PATH%"
if exist "%ProgramFiles%\Python312\python.exe" set "PATH=%ProgramFiles%\Python312;%ProgramFiles%\Python312\Scripts;%PATH%"

set "PYTHON_CMD="
where py >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=py"
) else (
  where python >nul 2>nul
  if not errorlevel 1 set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
  echo [FEHLER] Python konnte nicht automatisch installiert werden.
  echo Die Python-Download-Seite wird geoeffnet.
  start "" "https://www.python.org/downloads/windows/"
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
call %PYTHON_CMD% -m pip install --upgrade pip
call %PYTHON_CMD% -m pip install scapy
if errorlevel 1 (
  echo.
  echo [FEHLER] Python-Abhaengigkeiten konnten nicht installiert werden.
  echo Falls Windows den Store-Hinweis fuer Python zeigt, installiere bitte Python direkt von python.org.
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
