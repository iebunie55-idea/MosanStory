@echo off
setlocal

set "ROOT=%~dp0"
set "LOG_DIR=%ROOT%logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

cd /d "%ROOT%"

if exist "%ROOT%node_modules" goto after_npm_install
echo [%date% %time%] node_modules missing. Running npm install...>> "%LOG_DIR%\startup.log"
call npm.cmd install
:after_npm_install

if exist "%ROOT%out\index.html" goto after_build
echo [%date% %time%] out folder missing. Running npm run build...>> "%LOG_DIR%\startup.log"
call npm.cmd run build
:after_build

echo [%date% %time%] Starting Buyeo AI Story proxy...>> "%LOG_DIR%\startup.log"
start "Buyeo Story Proxy" /min /D "%ROOT%story-proxy" node server.js

powershell -NoProfile -Command "Start-Sleep -Seconds 3"

echo [%date% %time%] Starting Buyeo AI Story app...>> "%LOG_DIR%\startup.log"
start "Buyeo Story App" /min /D "%ROOT%" npm.cmd exec -- serve out -l tcp://127.0.0.1:3000

powershell -NoProfile -Command "Start-Sleep -Seconds 8"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if not exist "%CHROME%" goto chrome_missing
echo [%date% %time%] Opening Chrome kiosk mode...>> "%LOG_DIR%\startup.log"
start "" "%CHROME%" --kiosk --disable-pinch --overscroll-history-navigation=0 --no-first-run "http://127.0.0.1:3000/story"
goto end

:chrome_missing
echo Chrome not found. Open http://127.0.0.1:3000/story manually.
echo [%date% %time%] Chrome not found.>> "%LOG_DIR%\startup.log"

:end

endlocal
