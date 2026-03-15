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

Write-UpdateLog "Patchlauf gestartet"
Start-Sleep -Milliseconds 500

for ($i = 0; $i -lt 20; $i++) {
  $processStillRunning = Get-Process -Id $WaitPid -ErrorAction SilentlyContinue
  if (-not $processStillRunning) {
    Write-UpdateLog "Alter Prozess wurde beendet"
    break
  }
  Start-Sleep -Milliseconds 250
}

$processStillRunning = Get-Process -Id $WaitPid -ErrorAction SilentlyContinue
if ($processStillRunning) {
  Write-UpdateLog "Alter Prozess läuft noch, Stop-Process wird ausgeführt"
  Stop-Process -Id $WaitPid -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 600
}

$exclude = @('.git', 'node_modules', '__pycache__')

Write-UpdateLog "Dateien werden kopiert"
Get-ChildItem -LiteralPath $SourceDir -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
  $destination = Join-Path $TargetDir $_.Name
  if (Test-Path -LiteralPath $destination) {
    Remove-Item -LiteralPath $destination -Recurse -Force
  }
  Copy-Item -LiteralPath $_.FullName -Destination $destination -Recurse -Force
}

if (Test-Path -LiteralPath $SettingsPath) {
  Write-UpdateLog "Settings werden aktualisiert"
  try {
    $settings = Get-Content -LiteralPath $SettingsPath -Raw | ConvertFrom-Json
  } catch {
    $settings = [pscustomobject]@{}
  }

  if (-not $settings.updater) {
    $settings | Add-Member -MemberType NoteProperty -Name updater -Value ([pscustomobject]@{})
  }

  $settings.updater.currentCommit = $CommitSha
  $settings.updater.pendingUpdate = $null
  $settings.updater.lastCheckedAt = (Get-Date).ToString('o')

  $settings | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $SettingsPath -Encoding UTF8
}

if ($IsPackaged -eq 'true') {
  Write-UpdateLog "Gepackte App wird neu gestartet"
  Start-Process -FilePath $ExecPath -WorkingDirectory $TargetDir
} else {
  Write-UpdateLog "Entwicklungs-App wird neu gestartet"
  Start-Process -FilePath $ExecPath -ArgumentList @($AppPath) -WorkingDirectory $TargetDir
}

Write-UpdateLog "Patchlauf abgeschlossen"
`;

  fs.writeFileSync(scriptPath, script, 'utf8');
}

function createUpdater({
  app,
  getSettings,
  updateSettings,
  onStateChange,
}) {
  let runtimeState = {
    status: 'idle',
    message: 'Updater bereit',
    currentCommit: null,
    latestCommit: null,
    latestMessage: null,
  };
  let installTriggered = false;

  function emitState(patch) {
    runtimeState = {
      ...runtimeState,
      ...patch,
    };
    onStateChange(runtimeState);
  }

  function getSettingsPath() {
    return path.join(app.getPath('userData'), 'livemap-settings.json');
  }

  function getPendingUpdateDirectory(commitSha) {
    return path.join(app.getPath('userData'), 'pending-updates', commitSha);
  }

  async function resolveCurrentCommit() {
    const settings = getSettings();
    const fromSettings = settings?.updater?.currentCommit;
    if (fromSettings) {
      return fromSettings;
    }

    const gitCommit = getLocalGitCommit(app.getAppPath());
    if (gitCommit) {
      updateSettings({
        updater: {
          ...(settings?.updater || {}),
          currentCommit: gitCommit,
        },
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

    const settings = getSettings();
    updateSettings({
      updater: {
        ...(settings?.updater || {}),
        pendingUpdate: {
          commit: latestCommit.sha,
          sourceRoot,
          preparedAt: new Date().toISOString(),
        },
        latestCommit: latestCommit.sha,
        lastCheckedAt: new Date().toISOString(),
      },
    });

    return sourceRoot;
  }

  async function checkForUpdates() {
    try {
      const settings = getSettings();
      const currentCommit = await resolveCurrentCommit();
      emitState({
        status: 'checking',
        message: 'Prüfe GitHub auf Updates...',
        currentCommit,
      });

      const latestCommit = await fetchLatestCommit();
      const pendingCommit = settings?.updater?.pendingUpdate?.commit;

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
        updateSettings({
          updater: {
            ...(settings?.updater || {}),
            latestCommit: latestCommit.sha,
            lastCheckedAt: new Date().toISOString(),
          },
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
      pendingUpdate: getSettings()?.updater?.pendingUpdate || null,
    };
  }

  async function applyPendingUpdateAndQuit() {
    if (installTriggered) {
      return false;
    }

    const pendingUpdate = getSettings()?.updater?.pendingUpdate;
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
    createApplyScript(scriptPath);

    const isPackaged = app.isPackaged ? 'true' : 'false';
    const relaunchAppPath = app.isPackaged ? '' : app.getAppPath();

    spawn(
      'powershell',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        scriptPath,
        pendingUpdate.sourceRoot,
        app.getAppPath(),
        process.execPath,
        relaunchAppPath,
        getSettingsPath(),
        pendingUpdate.commit,
        String(process.pid),
        isPackaged,
      ],
      {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      },
    ).unref();

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
