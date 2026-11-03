@echo off
title MagicForge: Universe - Game Server (20Hz)
echo [1/2] Verificando e liberando porta 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
echo [2/2] Iniciando servidor autoritativo MagicForge: Universe (20Hz)...
cd /d "%~dp0server"
npm.cmd run dev
pause
