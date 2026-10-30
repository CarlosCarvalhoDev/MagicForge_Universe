@echo off
title MagicForge: Universe - Starter
echo ========================================================
echo        ⚔️  MAGICFORGE: UNIVERSE - STARTER ⚔️        
echo ========================================================
echo Iniciando Servidor e Cliente Web em janelas dedicadas...

start "MagicForge Server" cmd /c "%~dp0start-server.bat"
start "MagicForge Client" cmd /c "%~dp0start-client.bat"

echo.
echo [OK] Servidor e Cliente iniciados!
echo Acesse no navegador: http://localhost:5173
echo Login Admin: admin / admin1234
echo.
timeout /t 5

