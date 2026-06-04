@echo off
setlocal

set "ROOT=%~dp0"
set "LOG_DIR=%ROOT%logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

cd /d "%ROOT%"

echo Installing Buyeo AI Story...
echo [%date% %time%] Install started.> "%LOG_DIR%\install.log"

echo.
echo [1/4] Installing Next app packages...
call npm install >> "%LOG_DIR%\install.log" 2>&1
if errorlevel 1 goto fail

echo.
echo [2/4] Installing story proxy packages...
cd /d "%ROOT%story-proxy"
call npm install >> "%LOG_DIR%\install.log" 2>&1
if errorlevel 1 goto fail

echo.
echo [3/4] Building Next app...
cd /d "%ROOT%"
call npm run build >> "%LOG_DIR%\install.log" 2>&1
if errorlevel 1 goto fail

echo.
echo [4/4] Registering Windows startup shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$startup=[Environment]::GetFolderPath('Startup'); $shortcut=Join-Path $startup 'Buyeo AI Story.lnk'; $shell=New-Object -ComObject WScript.Shell; $link=$shell.CreateShortcut($shortcut); $link.TargetPath=(Join-Path '%ROOT%' 'start-buyeo-story.bat'); $link.WorkingDirectory='%ROOT%'; $link.WindowStyle=7; $link.Save()" >> "%LOG_DIR%\install.log" 2>&1
if errorlevel 1 goto fail

echo.
echo Install complete.
echo Restart this PC, or run start-buyeo-story.bat now.
echo [%date% %time%] Install complete.>> "%LOG_DIR%\install.log"
goto end

:fail
echo.
echo Install failed. Check logs\install.log.
echo [%date% %time%] Install failed.>> "%LOG_DIR%\install.log"

:end
endlocal
