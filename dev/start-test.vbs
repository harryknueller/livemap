Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c ""cd /d """"c:\Users\patri\Desktop\Quinfall\Livemap\app"""" & set ELECTRON_RUN_AS_NODE= & .\node_modules\electron\dist\electron.exe .""", 0, False
