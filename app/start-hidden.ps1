[Environment]::SetEnvironmentVariable('ELECTRON_RUN_AS_NODE', $null, 'Process')
Start-Process -FilePath (Join-Path $PSScriptRoot 'node_modules\electron\dist\electron.exe') -ArgumentList '.' -WorkingDirectory $PSScriptRoot
