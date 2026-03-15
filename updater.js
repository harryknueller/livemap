const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const GITHUB_OWNER = 'harryknueller';
const GITHUB_REPO = 'livemap';
const GITHUB_BRANCH = 'main';

function getApiBase() {
  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
}

function getZipUrl(commitSha = GITHUB_BRANCH) {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/archive/${commitSha}.zip`;
}

function getCommitUrl() {
  return `${getApiBase()}/commits/${GITHUB_BRANCH}`;
}

function ensureDir(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function toErrorMessage(error) {
  if (!error) {
    return 'Unbekannter Fehler';
  }

  if (typeof error === 'string') {
    return error;
  }

  return error.message || String(error);
}

function getLocalGitCommit(appDirectory) {
  try {
    const result = spawnSync('git', ['rev-parse', 'HEAD'], {
      cwd: appDirectory,
      encoding: 'utf8',
      windowsHide: true,
    });
    if (result.status === 0) {
      return result.stdout.trim() || null;
    }
  } catch (_error) {
    return null;
  }

  return null;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'quinfall-livemap-updater',
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub Anfrage fehlgeschlagen (${response.status})`);
  }

  return response.json();
}

async function downloadFile(url, targetPath) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'quinfall-livemap-updater',
    },
  });

  if (!response.ok) {
    throw new Error(`Download fehlgeschlagen (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));
}

function runPowerShell(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command, ...args],
      {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `PowerShell Exit-Code ${code}`));
    });
  });
}

function escapePowerShellLiteral(value) {
  return String(value).replace(/'/g, "''");
}

async function extractZipWindows(zipPath, extractDirectory) {
  if (fs.existsSync(extractDirectory)) {
    fs.rmSync(extractDirectory, { recursive: true, force: true });
  }
  ensureDir(extractDirectory);

  await runPowerShell(
    `Expand-Archive -LiteralPath '${escapePowerShellLiteral(zipPath)}' -DestinationPath '${escapePowerShellLiteral(extractDirectory)}' -Force`,
    [],
  );
}

function findExtractedSourceRoot(extractDirectory) {
  const entries = fs.readdirSync(extractDirectory, { withFileTypes: true });
  const firstDirectory = entries.find((entry) => entry.isDirectory());
  if (!firstDirectory) {
    throw new Error('Das Update-Archiv konnte nicht entpackt werden');
  }

  return path.join(extractDirectory, firstDirectory.name);
}

function createApplyScript(scriptPath) {
  const script = String.raw`
param(
  [string]$SourceDir,
  [string]$TargetDir,
  [string]$ExecPath,
  [string]$AppPath,
  [string]$SettingsPath,
  [string]$CommitSha,
  [int]$WaitPid,
  [string]$IsPackaged
)

$logPath = Join-Path (Split-Path -Parent $SourceDir) 'apply-update.log'

function Write-UpdateLog([string]$Message) {
  $timestamp = (Get-Date).ToString('o')
  Add-Content -LiteralPath $logPath -Value "$timestamp $Message"
}

Write-UpdateLog "PowerShell Patcher wurde gestartet"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

function New-StatusForm {
  $form = New-Object System.Windows.Forms.Form
  $form.Text = 'Livemap Patcher'
  $form.StartPosition = 'CenterScreen'
  $form.Size = New-Object System.Drawing.Size(460, 220)
  $form.FormBorderStyle = 'FixedDialog'
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.TopMost = $true
  $form.BackColor = [System.Drawing.Color]::FromArgb(18, 24, 30)
  $form.ForeColor = [System.Drawing.Color]::FromArgb(237, 244, 247)

  $title = New-Object System.Windows.Forms.Label
  $title.Text = 'Livemap wird aktualisiert'
  $title.Font = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Bold)
  $title.Location = New-Object System.Drawing.Point(22, 18)
  $title.Size = New-Object System.Drawing.Size(400, 28)

  $status = New-Object System.Windows.Forms.Label
  $status.Text = 'Initialisierung'
  $status.Font = New-Object System.Drawing.Font('Segoe UI', 10)
  $status.Location = New-Object System.Drawing.Point(22, 64)
  $status.Size = New-Object System.Drawing.Size(400, 42)

  $progress = New-Object System.Windows.Forms.ProgressBar
  $progress.Location = New-Object System.Drawing.Point(22, 122)
  $progress.Size = New-Object System.Drawing.Size(400, 20)
  $progress.Style = 'Continuous'
  $progress.Minimum = 0
  $progress.Maximum = 100
  $progress.Value = 8

  $details = New-Object System.Windows.Forms.Label
  $details.Text = 'Bitte das Fenster offen lassen.'
  $details.Font = New-Object System.Drawing.Font('Segoe UI', 9)
  $details.ForeColor = [System.Drawing.Color]::FromArgb(157, 178, 188)
  $details.Location = New-Object System.Drawing.Point(22, 154)
  $details.Size = New-Object System.Drawing.Size(400, 24)

  $form.Controls.Add($title)
  $form.Controls.Add($status)
  $form.Controls.Add($progress)
  $form.Controls.Add($details)

  return @{
    Form = $form
    Status = $status
    Progress = $progress
    Details = $details
  }
}

$ui = New-StatusForm
$ui.Form.Show()
[System.Windows.Forms.Application]::DoEvents()

function Update-Status([string]$Message, [int]$ProgressValue, [string]$Detail = $null) {
  Write-UpdateLog $Message
  $ui.Status.Text = $Message
  if ($ProgressValue -ge 0 -and $ProgressValue -le 100) {
    $ui.Progress.Value = $ProgressValue
  }
  if ($Detail) {
    $ui.Details.Text = $Detail
  }
  [System.Windows.Forms.Application]::DoEvents()
}

Write-UpdateLog "Patchlauf gestartet"
Update-Status 'Patchlauf gestartet' 10 'Warte auf das Beenden der Livemap.'
Start-Sleep -Milliseconds 500

for ($i = 0; $i -lt 20; $i++) {
  $processStillRunning = Get-Process -Id $WaitPid -ErrorAction SilentlyContinue
  if (-not $processStillRunning) {
    Update-Status 'Livemap wurde beendet' 24 'Dateien werden gleich ersetzt.'
    break
  }
  Start-Sleep -Milliseconds 250
  [System.Windows.Forms.Application]::DoEvents()
}

$processStillRunning = Get-Process -Id $WaitPid -ErrorAction SilentlyContinue
if ($processStillRunning) {
  Update-Status 'Livemap wird zwangsweise beendet' 30 'Der alte Prozess reagiert nicht schnell genug.'
  Stop-Process -Id $WaitPid -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 600
}

$exclude = @('.git', 'node_modules', '__pycache__')

try {
  Update-Status 'Dateien werden ersetzt' 52 'Neue Dateien werden in die Livemap kopiert.'
  Get-ChildItem -LiteralPath $SourceDir -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
    $destination = Join-Path $TargetDir $_.Name
    if (Test-Path -LiteralPath $destination) {
      Remove-Item -LiteralPath $destination -Recurse -Force
    }
    Copy-Item -LiteralPath $_.FullName -Destination $destination -Recurse -Force
    [System.Windows.Forms.Application]::DoEvents()
  }

  if ($IsPackaged -eq 'true') {
    Update-Status 'Livemap wird neu gestartet' 90 'Die gepackte App wird gestartet.'
    Start-Process -FilePath $ExecPath -WorkingDirectory $TargetDir
  } else {
    Update-Status 'Livemap wird neu gestartet' 90 'Die Entwicklungs-App wird über npm start gestartet.'
    $npmPath = Join-Path $env:SystemRoot 'System32\cmd.exe'
    if (-not (Test-Path -LiteralPath $npmPath)) {
      throw 'cmd.exe wurde nicht gefunden.'
    }
    Start-Process -FilePath $npmPath -ArgumentList @('/d', '/c', 'npm.cmd start') -WorkingDirectory $TargetDir
  }

  Update-Status 'Patch erfolgreich abgeschlossen' 100 'Das Fenster schließt sich gleich automatisch.'
  Start-Sleep -Milliseconds 1800
} catch {
  $errorMessage = $_.Exception.Message
  Update-Status 'Patch fehlgeschlagen' 100 $errorMessage
  $messageBody = 'Patch fehlgeschlagen.' + [Environment]::NewLine + $errorMessage + [Environment]::NewLine + [Environment]::NewLine + 'Log: ' + $logPath
  [System.Windows.Forms.MessageBox]::Show($messageBody, 'Livemap Patcher', 'OK', 'Error') | Out-Null
  Start-Sleep -Milliseconds 2500
}

$ui.Form.Close()
`;

  fs.writeFileSync(scriptPath, script, 'utf8');
}

function createBootstrapScript(scriptPath, {
  powershellPath,
  applyScriptPath,
  sourceDir,
  targetDir,
  execPath,
  appPath,
  settingsPath,
  commitSha,
  waitPid,
  isPackaged,
}) {
  const escapeForBatch = (value) => String(value ?? '').replace(/"/g, '""');
  const lines = [
    '@echo off',
    'setlocal',
    `set "BOOTSTRAP_LOG=${escapeForBatch(path.join(path.dirname(scriptPath), 'bootstrap.log'))}"`,
    `set "POWERSHELL_STDOUT=${escapeForBatch(path.join(path.dirname(scriptPath), 'powershell-launch.log'))}"`,
    `set "PS_PATH=${escapeForBatch(powershellPath)}"`,
    `set "APPLY_SCRIPT=${escapeForBatch(applyScriptPath)}"`,
    `set "SOURCE_DIR=${escapeForBatch(sourceDir)}"`,
    `set "TARGET_DIR=${escapeForBatch(targetDir)}"`,
    `set "EXEC_PATH=${escapeForBatch(execPath)}"`,
    `set "APP_PATH=${escapeForBatch(appPath)}"`,
    `set "SETTINGS_PATH=${escapeForBatch(settingsPath)}"`,
    `set "COMMIT_SHA=${escapeForBatch(commitSha)}"`,
    `set "WAIT_PID=${escapeForBatch(String(waitPid))}"`,
    `set "IS_PACKAGED=${escapeForBatch(isPackaged)}"`,
    'echo [%date% %time%] Bootstrap gestartet > "%BOOTSTRAP_LOG%"',
    'echo PowerShell: "%PS_PATH%" >> "%BOOTSTRAP_LOG%"',
    'echo Apply: "%APPLY_SCRIPT%" >> "%BOOTSTRAP_LOG%"',
    'if not exist "%PS_PATH%" (',
    '  echo [%date% %time%] FEHLER PowerShell nicht gefunden >> "%BOOTSTRAP_LOG%"',
    '  exit /b 1',
    ')',
    'if not exist "%APPLY_SCRIPT%" (',
    '  echo [%date% %time%] FEHLER apply-update.ps1 nicht gefunden >> "%BOOTSTRAP_LOG%"',
    '  exit /b 1',
    ')',
    'echo [%date% %time%] Starte PowerShell-Patcher >> "%BOOTSTRAP_LOG%"',
    '"%PS_PATH%" -NoProfile -ExecutionPolicy Bypass -File "%APPLY_SCRIPT%" "%SOURCE_DIR%" "%TARGET_DIR%" "%EXEC_PATH%" "%APP_PATH%" "%SETTINGS_PATH%" "%COMMIT_SHA%" "%WAIT_PID%" "%IS_PACKAGED%" >> "%POWERSHELL_STDOUT%" 2>&1',
    'set "PATCH_EXIT=%ERRORLEVEL%"',
    'echo [%date% %time%] PowerShell beendet mit ExitCode %PATCH_EXIT% >> "%BOOTSTRAP_LOG%"',
    'exit /b %PATCH_EXIT%',
    '',
  ];

  fs.writeFileSync(scriptPath, lines.join('\r\n'), 'utf8');
}

function createUpdater({
  app,
  onStateChange,
}) {
  const DEFAULT_UPDATER_STATE = {
    currentCommit: null,
    latestCommit: null,
    lastCheckedAt: null,
    pendingUpdate: null,
  };
  let runtimeState = {
    status: 'idle',
    message: 'Updater bereit',
    currentCommit: null,
    latestCommit: null,
    latestMessage: null,
  };
  let installTriggered = false;

  function getUpdaterStatePath() {
    return path.join(app.getPath('userData'), 'updater-state.json');
  }

  function loadPersistedState() {
    try {
      const raw = fs.readFileSync(getUpdaterStatePath(), 'utf8').replace(/^\uFEFF/, '');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_UPDATER_STATE,
        ...(parsed || {}),
      };
    } catch (_error) {
      return { ...DEFAULT_UPDATER_STATE };
    }
  }

  let persistedState = loadPersistedState();

  function savePersistedState(patch = {}) {
    persistedState = {
      ...persistedState,
      ...patch,
    };
    fs.writeFileSync(getUpdaterStatePath(), JSON.stringify(persistedState, null, 2), 'utf8');
    return persistedState;
  }

  function emitState(patch) {
    runtimeState = {
      ...runtimeState,
      ...patch,
    };
    onStateChange(runtimeState);
  }

  function getPendingUpdateDirectory(commitSha) {
    return path.join(app.getPath('userData'), 'pending-updates', commitSha);
  }

  async function resolveCurrentCommit() {
    const fromSettings = persistedState.currentCommit;
    if (fromSettings) {
      return fromSettings;
    }

    const gitCommit = getLocalGitCommit(app.getAppPath());
    if (gitCommit) {
      savePersistedState({
        currentCommit: gitCommit,
      });
      return gitCommit;
    }

    return null;
  }

  async function fetchLatestCommit() {
    const payload = await fetchJson(getCommitUrl());
    return {
      sha: payload.sha,
      message: payload.commit?.message || 'Neuer Stand verfügbar',
      date: payload.commit?.author?.date || null,
    };
  }

  async function stageUpdate(latestCommit) {
    const pendingRoot = getPendingUpdateDirectory(latestCommit.sha);
    const zipPath = path.join(pendingRoot, 'update.zip');
    const extractDirectory = path.join(pendingRoot, 'extracted');

    ensureDir(pendingRoot);
    await downloadFile(getZipUrl(latestCommit.sha), zipPath);
    await extractZipWindows(zipPath, extractDirectory);
    const sourceRoot = findExtractedSourceRoot(extractDirectory);

    savePersistedState({
      pendingUpdate: {
        commit: latestCommit.sha,
        sourceRoot,
        preparedAt: new Date().toISOString(),
      },
      latestCommit: latestCommit.sha,
      lastCheckedAt: new Date().toISOString(),
    });

    return sourceRoot;
  }

  async function checkForUpdates() {
    try {
      persistedState = loadPersistedState();
      const currentCommit = await resolveCurrentCommit();
      emitState({
        status: 'checking',
        message: 'Prüfe GitHub auf Updates...',
        currentCommit,
      });

      const latestCommit = await fetchLatestCommit();
      const pendingCommit = persistedState.pendingUpdate?.commit;

      if (pendingCommit && pendingCommit === latestCommit.sha) {
        emitState({
          status: 'ready',
          currentCommit,
          latestCommit: latestCommit.sha,
          latestMessage: latestCommit.message,
          message: 'Update ist bereits vorbereitet und wird beim Schließen installiert.',
        });
        return runtimeState;
      }

      if (currentCommit && currentCommit === latestCommit.sha) {
        savePersistedState({
          currentCommit,
          latestCommit: latestCommit.sha,
          lastCheckedAt: new Date().toISOString(),
          pendingUpdate: null,
        });
        emitState({
          status: 'up-to-date',
          currentCommit,
          latestCommit: latestCommit.sha,
          latestMessage: latestCommit.message,
          message: 'Livemap ist aktuell.',
        });
        return runtimeState;
      }

      emitState({
        status: 'downloading',
        currentCommit,
        latestCommit: latestCommit.sha,
        latestMessage: latestCommit.message,
        message: 'Neues Update wird heruntergeladen und vorbereitet...',
      });

      await stageUpdate(latestCommit);
      emitState({
        status: 'ready',
        currentCommit,
        latestCommit: latestCommit.sha,
        latestMessage: latestCommit.message,
        message: 'Update bereit. Es wird beim Schließen installiert oder kann sofort gestartet werden.',
      });
      return runtimeState;
    } catch (error) {
      emitState({
        status: 'error',
        message: `Updater-Fehler: ${toErrorMessage(error)}`,
      });
      return runtimeState;
    }
  }

  function getState() {
    return {
      ...runtimeState,
      pendingUpdate: persistedState.pendingUpdate || null,
    };
  }

  async function applyPendingUpdateAndQuit() {
    if (installTriggered) {
      return false;
    }

    persistedState = loadPersistedState();
    const pendingUpdate = persistedState.pendingUpdate;
    if (!pendingUpdate?.sourceRoot || !fs.existsSync(pendingUpdate.sourceRoot)) {
      emitState({
        status: 'error',
        message: 'Kein vorbereitetes Update gefunden.',
      });
      return false;
    }

    installTriggered = true;
    const pendingRoot = path.dirname(path.dirname(pendingUpdate.sourceRoot));
    const scriptPath = path.join(pendingRoot, 'apply-update.ps1');
    const bootstrapPath = path.join(pendingRoot, 'launch-patcher.cmd');
    const launcherLogPath = path.join(pendingRoot, 'launcher.log');
    createApplyScript(scriptPath);

    const isPackaged = app.isPackaged ? 'true' : 'false';
    const relaunchAppPath = app.isPackaged ? '' : app.getAppPath();
    const powershellPath = path.join(
      process.env.SystemRoot || 'C:\\Windows',
      'System32',
      'WindowsPowerShell',
      'v1.0',
      'powershell.exe',
    );
    createBootstrapScript(bootstrapPath, {
      powershellPath,
      applyScriptPath: scriptPath,
      sourceDir: pendingUpdate.sourceRoot,
      targetDir: app.getAppPath(),
      execPath: process.execPath,
      appPath: relaunchAppPath,
      settingsPath: getUpdaterStatePath(),
      commitSha: pendingUpdate.commit,
      waitPid: String(process.pid),
      isPackaged,
    });

    fs.writeFileSync(
      launcherLogPath,
      [
        `[${new Date().toISOString()}] Launcher vorbereitet`,
        `PowerShell: ${powershellPath}`,
        `Bootstrap: ${bootstrapPath}`,
        `Script: ${scriptPath}`,
        `Target: ${app.getAppPath()}`,
        `Exec: ${process.execPath}`,
        `Commit: ${pendingUpdate.commit}`,
        '',
      ].join('\r\n'),
      'utf8',
    );

    const launcher = spawn(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/c', bootstrapPath],
      {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      },
    );

    fs.appendFileSync(
      launcherLogPath,
      `[${new Date().toISOString()}] Launcher PID: ${launcher.pid || 'unbekannt'}\r\n`,
      'utf8',
    );

    launcher.on('error', (error) => {
      fs.appendFileSync(
        launcherLogPath,
        `[${new Date().toISOString()}] Launcher-Fehler: ${toErrorMessage(error)}\r\n`,
        'utf8',
      );
    });

    launcher.unref();

    return true;
  }

  return {
    checkForUpdates,
    getState,
    applyPendingUpdateAndQuit,
  };
}

module.exports = {
  createUpdater,
};
