@echo off
title MagicForge: Universe - Starter
echo ========================================================
echo        MAGICFORGE: UNIVERSE - STARTER
echo ========================================================
echo Iniciando Servidor e Cliente Web em janelas dedicadas...

start "MagicForge Server" cmd /c "%~dp0start-server.bat"
start "MagicForge Client" cmd /c "%~dp0start-client.bat"

echo.
echo [OK] Servidor e Cliente iniciados com suporte HTTPS Mobile!
echo Acesse no PC: https://localhost:5173
echo Acesse no Celular: URL exibida na janela do Cliente (Vite Network)
echo Login Admin: admin / admin1234
echo.
timeout /t 5
