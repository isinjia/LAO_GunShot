@echo off
rem Orca Dungeon launcher: starts the local server and opens the game (logic in tools\launch.ps1)
cd /d "%~dp0"
set ARGS=
if not "%~1"=="" set ARGS=-Port %~1
if "%~2"=="1" set ARGS=%ARGS% -NoBrowser
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\launch.ps1" %ARGS%
if errorlevel 1 pause
