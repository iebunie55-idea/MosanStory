@echo off
setlocal

echo Stopping Buyeo AI Story servers on ports 3000 and 3001...
powershell -NoProfile -ExecutionPolicy Bypass -Command "3000,3001 | ForEach-Object { Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }"

echo Done.
endlocal
