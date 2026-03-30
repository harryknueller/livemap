@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"
title Quinfall Livemap Installer
color 07

set "APP_DIR=%CD%\app"
set "SCRIPTS_DIR=%CD%\scripts"
set "VENV_DIR=%CD%\.venv"
set "NPCAP_URL=https://npcap.com/dist/npcap-1.87.exe"
set "NPCAP_INSTALLER=%TEMP%\npcap-1.87.exe"
set "PYTHON_VERSION=3.12.10"
set "PYTHON_SERIES=3.12"
set "PYTHON_INSTALLER_URL=https://www.python.org/ftp/python/%PYTHON_VERSION%/python-%PYTHON_VERSION%-amd64.exe"
set "PYTHON_INSTALLER=%TEMP%\python-%PYTHON_VERSION%-amd64.exe"
set "NODE_VERSION_TARGET=24.14.0"
set "NODE_INSTALLER_URL=https://nodejs.org/dist/v24.14.0/node-v24.14.0-x64.msi"
set "NODE_INSTALLER=%TEMP%\node-v24.14.0-x64.msi"
set "PYTHON_CMD="
set "NODE_CMD="
set "NPM_CMD="
set "NODE_BIN_DIR="
set "NODE_VERSION="
set "NPM_VERSION="
set "NPM_INSTALL_RESULT="
set "INSTALL_STEP=Initialization"
set "ERROR_MESSAGE="

set "CHECK_PROJECT=[ ] Project structure"
set "CHECK_NPCAP=[ ] Npcap"
set "CHECK_PYTHON=[ ] Python"
set "CHECK_NODE=[ ] Node.js and npm"
set "CHECK_VENV=[ ] Python virtual environment"
set "CHECK_PY_REQ=[ ] Python dependencies"
set "CHECK_NODE_REQ=[ ] Node dependencies"
set "CHECK_VERIFY=[ ] Final verification"

echo ============================================================
echo   QUINFALL LIVEMAP INSTALLER
echo ============================================================
echo   Installation and validation
echo ============================================================
echo [INFO] Project directory: %CD%
echo.

set "INSTALL_STEP=Checking project files"
echo ------------------------------------------------------------
echo [STEP] %INSTALL_STEP%
echo ------------------------------------------------------------
if not exist "%APP_DIR%\" set "ERROR_MESSAGE=The app directory is missing." & goto :fail
if not exist "%SCRIPTS_DIR%\" set "ERROR_MESSAGE=The scripts directory is missing." & goto :fail
if not exist "%APP_DIR%\package.json" set "ERROR_MESSAGE=app\package.json is missing." & goto :fail
if not exist "%APP_DIR%\main.js" set "ERROR_MESSAGE=app\main.js is missing." & goto :fail
if not exist "%APP_DIR%\start-hidden.ps1" set "ERROR_MESSAGE=app\start-hidden.ps1 is missing." & goto :fail
if not exist "%SCRIPTS_DIR%\playerposition.py" set "ERROR_MESSAGE=scripts\playerposition.py is missing." & goto :fail
if not exist "%SCRIPTS_DIR%\livemap_overlay.py" set "ERROR_MESSAGE=scripts\livemap_overlay.py is missing." & goto :fail
set "CHECK_PROJECT=[OK] Project structure"
echo [OK] Project structure looks good.

set "INSTALL_STEP=Checking Npcap"
echo ------------------------------------------------------------
echo [STEP] %INSTALL_STEP%
echo ------------------------------------------------------------
sc query npcap >nul 2>nul
if errorlevel 1 (
  echo [WARNING] Npcap was not found.
  echo [INFO] Downloading Npcap...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%NPCAP_URL%' -OutFile '%NPCAP_INSTALLER%'"
  if errorlevel 1 set "ERROR_MESSAGE=Npcap could not be downloaded." & goto :fail
  if not exist "%NPCAP_INSTALLER%" set "ERROR_MESSAGE=Npcap installer is missing after download." & goto :fail
  echo [INFO] Launching Npcap installer...
  start /wait "" "%NPCAP_INSTALLER%"
  if errorlevel 1 set "ERROR_MESSAGE=Npcap installation was cancelled or failed." & goto :fail
  sc query npcap >nul 2>nul
  if errorlevel 1 set "ERROR_MESSAGE=Npcap is still not available after installation." & goto :fail
  echo [OK] Npcap was installed successfully.
) else (
  echo [OK] Npcap is already installed.
)
set "CHECK_NPCAP=[OK] Npcap"

set "INSTALL_STEP=Checking Python"
echo ------------------------------------------------------------
echo [STEP] %INSTALL_STEP%
echo ------------------------------------------------------------
call :detect_python
if not defined PYTHON_CMD (
  echo [WARNING] Python 3 was not found.
  echo [INFO] Trying to install Python %PYTHON_VERSION%...
  where winget >nul 2>nul
  if not errorlevel 1 (
    echo [INFO] Installing Python via winget...
    winget install --exact --id Python.Python.%PYTHON_SERIES% --accept-package-agreements --accept-source-agreements --disable-interactivity
  ) else (
    echo [INFO] winget was not found. Falling back to the official Python installer...
  )
  call :detect_python
  if not defined PYTHON_CMD (
    echo [INFO] Downloading Python installer...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%PYTHON_INSTALLER_URL%' -OutFile '%PYTHON_INSTALLER%'"
    if errorlevel 1 set "ERROR_MESSAGE=Python installer could not be downloaded." & goto :fail
    if not exist "%PYTHON_INSTALLER%" set "ERROR_MESSAGE=Python installer is missing after download." & goto :fail
    echo [INFO] Launching Python installer...
    start /wait "" "%PYTHON_INSTALLER%" /quiet InstallAllUsers=0 PrependPath=1 Include_pip=1 Include_test=0 Include_launcher=1
    if errorlevel 1 set "ERROR_MESSAGE=Python installation was cancelled or failed." & goto :fail
  )
  call :detect_python
)
if not defined PYTHON_CMD set "ERROR_MESSAGE=Python 3 was not found." & goto :fail
set "CHECK_PYTHON=[OK] Python"
echo [OK] Python detected: !PYTHON_CMD!

set "INSTALL_STEP=Checking Node.js and npm"
echo ------------------------------------------------------------
echo [STEP] %INSTALL_STEP%
echo ------------------------------------------------------------
call :detect_node
if not defined NODE_CMD (
  echo [WARNING] Node.js and npm were not found.
  echo [INFO] Trying to install Node.js LTS %NODE_VERSION_TARGET%...
  where winget >nul 2>nul
  if not errorlevel 1 (
    echo [INFO] Installing Node.js LTS via winget...
    winget install --exact --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --disable-interactivity
  ) else (
    echo [INFO] winget was not found. Falling back to the official Node.js installer...
  )
  call :detect_node
  if not defined NODE_CMD (
    echo [INFO] Downloading Node.js installer...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%NODE_INSTALLER_URL%' -OutFile '%NODE_INSTALLER%'"
    if errorlevel 1 set "ERROR_MESSAGE=Node.js installer could not be downloaded." & goto :fail
    if not exist "%NODE_INSTALLER%" set "ERROR_MESSAGE=Node.js installer is missing after download." & goto :fail
    echo [INFO] Launching Node.js installer...
    msiexec /i "%NODE_INSTALLER%" /qn /norestart
    if errorlevel 1 set "ERROR_MESSAGE=Node.js installation failed." & goto :fail
  )
  call :detect_node
)
if not defined NODE_CMD set "ERROR_MESSAGE=Node.js was not found." & goto :fail
if not defined NPM_CMD set "ERROR_MESSAGE=npm was not found." & goto :fail
call :configure_node_path
if not defined NODE_BIN_DIR set "ERROR_MESSAGE=The Node.js installation path could not be prepared." & goto :fail
for /f "delims=" %%i in ('!NODE_CMD! -v 2^>nul') do set "NODE_VERSION=%%i"
for /f "delims=" %%i in ('!NPM_CMD! -v 2^>nul') do set "NPM_VERSION=%%i"
set "CHECK_NODE=[OK] Node.js and npm"
echo [OK] Node.js !NODE_VERSION! / npm !NPM_VERSION!
echo [INFO] Using Node.js from !NODE_BIN_DIR!

set "INSTALL_STEP=Preparing Python virtual environment"
echo ------------------------------------------------------------
echo [STEP] %INSTALL_STEP%
echo ------------------------------------------------------------
if exist "%VENV_DIR%\Scripts\python.exe" (
  echo [OK] Virtual environment already exists.
) else (
  echo [INFO] Creating virtual environment...
  call !PYTHON_CMD! -m venv "%VENV_DIR%"
  if errorlevel 1 set "ERROR_MESSAGE=The Python virtual environment could not be created." & goto :fail
)
if not exist "%VENV_DIR%\Scripts\python.exe" set "ERROR_MESSAGE=The Python virtual environment is incomplete." & goto :fail
set "CHECK_VENV=[OK] Python virtual environment"

set "INSTALL_STEP=Installing Python dependencies"
echo ------------------------------------------------------------
echo [STEP] %INSTALL_STEP%
echo ------------------------------------------------------------
call "%VENV_DIR%\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 set "ERROR_MESSAGE=pip could not be updated." & goto :fail
call "%VENV_DIR%\Scripts\python.exe" -m pip install scapy
if errorlevel 1 set "ERROR_MESSAGE=Python dependencies could not be installed." & goto :fail
set "CHECK_PY_REQ=[OK] Python dependencies"
echo [OK] Python dependencies installed.

set "INSTALL_STEP=Installing Node dependencies"
echo ------------------------------------------------------------
echo [STEP] %INSTALL_STEP%
echo ------------------------------------------------------------
pushd "%APP_DIR%"
call :install_node_dependencies
popd
if not "!NPM_INSTALL_RESULT!"=="0" set "ERROR_MESSAGE=npm install failed." & goto :fail
if not exist "%APP_DIR%\node_modules\" set "ERROR_MESSAGE=app\node_modules was not created." & goto :fail
if not exist "%APP_DIR%\node_modules\electron\dist\electron.exe" set "ERROR_MESSAGE=Electron was not installed correctly." & goto :fail
set "CHECK_NODE_REQ=[OK] Node dependencies"
echo [OK] Node dependencies installed.

set "INSTALL_STEP=Running final verification"
echo ------------------------------------------------------------
echo [STEP] %INSTALL_STEP%
echo ------------------------------------------------------------
if not exist "%VENV_DIR%\Scripts\python.exe" set "ERROR_MESSAGE=Python environment is missing after installation." & goto :fail
if not exist "%APP_DIR%\node_modules\electron\dist\electron.exe" set "ERROR_MESSAGE=Electron is missing after installation." & goto :fail
if not exist "%SCRIPTS_DIR%\playerposition.py" set "ERROR_MESSAGE=Python scripts are missing after installation." & goto :fail
set "CHECK_VERIFY=[OK] Final verification"
echo [OK] All core components were verified successfully.

echo.
echo ============================================================
echo   INSTALLATION COMPLETED
echo ============================================================
echo.
echo Summary:
echo   !CHECK_PROJECT!
echo   !CHECK_NPCAP!
echo   !CHECK_PYTHON!
echo   !CHECK_NODE!
echo   !CHECK_VENV!
echo   !CHECK_PY_REQ!
echo   !CHECK_NODE_REQ!
echo   !CHECK_VERIFY!
echo.
echo Launch:
echo   start.bat
echo.
echo Alternative:
echo   cd app ^&^& npm start
echo.
echo Press any key to close this window.
pause >nul
exit /b 0

:detect_python
set "PYTHON_CMD="
where py >nul 2>nul
if not errorlevel 1 (
  py -3 --version >nul 2>nul
  if not errorlevel 1 (
    set "PYTHON_CMD=py -3"
    exit /b 0
  )
)
where python >nul 2>nul
if not errorlevel 1 (
  python --version >nul 2>nul
  if not errorlevel 1 (
    set "PYTHON_CMD=python"
    exit /b 0
  )
)
if exist "%LocalAppData%\Programs\Python\Python312\python.exe" (
  set "PYTHON_CMD="%LocalAppData%\Programs\Python\Python312\python.exe""
  exit /b 0
)
if exist "%ProgramFiles%\Python312\python.exe" (
  set "PYTHON_CMD="%ProgramFiles%\Python312\python.exe""
  exit /b 0
)
exit /b 1

:detect_node
set "NODE_CMD="
set "NPM_CMD="
set "NODE_BIN_DIR="
where node >nul 2>nul
if not errorlevel 1 (
  node -v >nul 2>nul
  if not errorlevel 1 (
    set "NODE_CMD=node"
    for /f "delims=" %%i in ('where node 2^>nul') do if not defined NODE_BIN_DIR set "NODE_BIN_DIR=%%~dpi"
  )
)
where npm.cmd >nul 2>nul
if not errorlevel 1 (
  npm.cmd -v >nul 2>nul
  if not errorlevel 1 set "NPM_CMD=npm.cmd"
)
if defined NODE_CMD if defined NPM_CMD exit /b 0
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_CMD="%ProgramFiles%\nodejs\node.exe""
if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD="%ProgramFiles%\nodejs\npm.cmd""
if exist "%ProgramFiles%\nodejs\" set "NODE_BIN_DIR=%ProgramFiles%\nodejs"
if defined NODE_CMD if defined NPM_CMD exit /b 0
if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_CMD="%LocalAppData%\Programs\nodejs\node.exe""
if exist "%LocalAppData%\Programs\nodejs\npm.cmd" set "NPM_CMD="%LocalAppData%\Programs\nodejs\npm.cmd""
if exist "%LocalAppData%\Programs\nodejs\" set "NODE_BIN_DIR=%LocalAppData%\Programs\nodejs"
if defined NODE_CMD if defined NPM_CMD exit /b 0
exit /b 1

:configure_node_path
if defined NODE_BIN_DIR goto :append_node_path
for %%i in (!NODE_CMD!) do set "NODE_BIN_DIR=%%~dpi"
if not defined NODE_BIN_DIR exit /b 1
if "!NODE_BIN_DIR:~-1!"=="\" set "NODE_BIN_DIR=!NODE_BIN_DIR:~0,-1!"
:append_node_path
echo ;!PATH!; | find /I ";!NODE_BIN_DIR!;" >nul
if errorlevel 1 set "PATH=!NODE_BIN_DIR!;!PATH!"
exit /b 0

:install_node_dependencies
set "NPM_INSTALL_RESULT=1"
set "NPM_ATTEMPT=1"
:npm_install_attempt
echo [INFO] npm install attempt !NPM_ATTEMPT! of 3...
call !NPM_CMD! install --no-audit --prefer-offline --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
set "NPM_INSTALL_RESULT=!ERRORLEVEL!"
if "!NPM_INSTALL_RESULT!"=="0" exit /b 0
if "!NPM_ATTEMPT!"=="3" exit /b 0
echo [WARNING] npm install failed with exit code !NPM_INSTALL_RESULT!.
echo [INFO] Verifying npm cache before retry...
call !NPM_CMD! cache verify
set /a NPM_ATTEMPT+=1
echo [INFO] Waiting a moment before retry...
timeout /t 3 /nobreak >nul
goto :npm_install_attempt

:fail
echo.
echo ============================================================
echo   INSTALLATION FAILED
echo ============================================================
echo Last step: %INSTALL_STEP%
if defined ERROR_MESSAGE echo [ERROR] %ERROR_MESSAGE%
echo.
echo Current summary:
echo   !CHECK_PROJECT!
echo   !CHECK_NPCAP!
echo   !CHECK_PYTHON!
echo   !CHECK_NODE!
echo   !CHECK_VENV!
echo   !CHECK_PY_REQ!
echo   !CHECK_NODE_REQ!
echo   !CHECK_VERIFY!
echo.
echo Press any key to close this window.
pause >nul
exit /b 1
