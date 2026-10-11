@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install a supported, security-patched Node.js LTS release. See README.md.
  pause
  exit /b 1
)
node server\index.mjs --open
if errorlevel 1 pause
