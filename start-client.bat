@echo off
title MagicForge: Universe - Web Client (Vite)
echo [1/2] Verificando e liberando porta 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
echo [2/2] Iniciando cliente web MagicForge: Universe (Vite)...
cd /d "%~dp0client"
npm.cmd run dev
pause
