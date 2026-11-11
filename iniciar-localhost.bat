@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"
title MagicForge Universe - Inicializador local
if /i "%~1"=="--run-server" goto :run_server
if /i "%~1"=="--run-client" goto :run_client

set "MAGICFORGE_CLIENT_URL=https://localhost:5173/"
set "MAGICFORGE_SERVER_URL=http://127.0.0.1:3000/health"
set "COREPACK_ENABLE_PROJECT_SPEC=0"

echo.
echo ============================================================
echo   MAGICFORGE: UNIVERSE - AMBIENTE LOCAL
echo ============================================================
echo.

call :ensure_node
if errorlevel 1 goto :failed

echo [OK] Node.js %MAGICFORGE_NODE_VERSION%

call :ensure_dependencies
if errorlevel 1 goto :failed
echo [OK] Dependencias prontas.

call :check_port 3000 "servidor"
if errorlevel 1 goto :failed
call :check_port 5173 "cliente Web"
if errorlevel 1 goto :failed

if /i "%~1"=="--check" (
  echo [OK] Ambiente pronto para iniciar.
  exit /b 0
)

echo [INFO] Iniciando servidor autoritativo em localhost:3000...
start "MagicForge - Servidor" "%ComSpec%" /d /k call "%~f0" --run-server

echo [INFO] Aguardando o servidor responder...
call :wait_for_url "%MAGICFORGE_SERVER_URL%" 20
if errorlevel 1 (
  echo [ERRO] O servidor nao respondeu em 20 segundos.
  echo        Consulte a janela "MagicForge - Servidor".
  goto :failed
)
echo [OK] Servidor online.

echo [INFO] Iniciando cliente Web em localhost:5173...
start "MagicForge - Cliente Web" "%ComSpec%" /d /k call "%~f0" --run-client

echo [INFO] Aguardando o cliente Web responder...
call :wait_for_url "%MAGICFORGE_CLIENT_URL%" 30
if errorlevel 1 (
  echo [ERRO] O cliente Web nao respondeu em 30 segundos.
  echo        Consulte a janela "MagicForge - Cliente Web".
  goto :failed
)

echo.
echo [OK] MagicForge esta pronto.
echo      Cliente:  %MAGICFORGE_CLIENT_URL%
echo      Servidor: %MAGICFORGE_SERVER_URL%
echo.
echo Para encerrar, pressione Ctrl+C nas janelas do servidor e do cliente.
if /i not "%~1"=="--no-browser" start "" "%MAGICFORGE_CLIENT_URL%"
exit /b 0

:run_server
title MagicForge - Servidor
set "PORT=3000"
cd /d "%~dp0server" || exit /b 1
node ..\node_modules\tsx\dist\cli.mjs watch src/index.ts
exit /b %errorlevel%

:run_client
title MagicForge - Cliente Web
set "VITE_SERVER_URL=ws://127.0.0.1:3000"
cd /d "%~dp0client" || exit /b 1
node ..\node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173 --strictPort
exit /b %errorlevel%

:ensure_dependencies
call :has_dependencies
if not errorlevel 1 exit /b 0

set "MAGICFORGE_NPM="
where npm.cmd >nul 2>nul && set "MAGICFORGE_NPM=npm.cmd"
if not defined MAGICFORGE_NPM where npm.exe >nul 2>nul && set "MAGICFORGE_NPM=npm.exe"
if not defined MAGICFORGE_NPM (
  echo [ERRO] As dependencias estao incompletas e o npm nao foi encontrado no PATH.
  echo        Restaure o npm da instalacao do Node.js e execute este arquivo novamente.
  exit /b 1
)

echo [INFO] Instalando dependencias do projeto...
call "%MAGICFORGE_NPM%" install --no-audit --no-fund
if errorlevel 1 (
  echo [ERRO] O npm nao conseguiu instalar as dependencias. Consulte a mensagem acima.
  exit /b 1
)
call :has_dependencies
if not errorlevel 1 exit /b 0
echo [ERRO] O tsx ou o Vite continua ausente apos a instalacao.
exit /b 1

:has_dependencies
if not exist "node_modules\tsx\dist\cli.mjs" exit /b 1
if not exist "node_modules\vite\bin\vite.js" exit /b 1
exit /b 0

:ensure_node
set "MAGICFORGE_NODE_VERSION="
set "MAGICFORGE_NODE_MAJOR="
for /f "delims=" %%V in ('node -p "process.versions.node" 2^>nul') do set "MAGICFORGE_NODE_VERSION=%%V"
if defined MAGICFORGE_NODE_VERSION (
  for /f "tokens=1 delims=." %%M in ("!MAGICFORGE_NODE_VERSION!") do set "MAGICFORGE_NODE_MAJOR=%%M"
  if !MAGICFORGE_NODE_MAJOR! GEQ 16 exit /b 0
  echo [INFO] Node.js !MAGICFORGE_NODE_VERSION! detectado; tentando ativar a versao 22.16.0...
) else (
  echo [INFO] Node.js nao esta ativo; procurando o NVM instalado...
)

set "MAGICFORGE_NVM="
if exist "%LOCALAPPDATA%\Author Software\nvm\nvm.exe" set "MAGICFORGE_NVM=%LOCALAPPDATA%\Author Software\nvm\nvm.exe"
if not defined MAGICFORGE_NVM if exist "%APPDATA%\nvm\nvm.exe" set "MAGICFORGE_NVM=%APPDATA%\nvm\nvm.exe"
if not defined MAGICFORGE_NVM for /f "delims=" %%N in ('where nvm.exe 2^>nul') do if not defined MAGICFORGE_NVM set "MAGICFORGE_NVM=%%N"

if not defined MAGICFORGE_NVM (
  echo [ERRO] Node.js nao esta ativo e o NVM nao foi localizado.
  echo        Instale o Node.js 16+ ou ative-o no NVM e tente novamente.
  exit /b 1
)

call "%MAGICFORGE_NVM%" use 22.16.0 >nul 2>nul
if errorlevel 1 (
  echo [INFO] Node.js 22.16.0 ainda nao esta instalado. Instalando pelo NVM...
  call "%MAGICFORGE_NVM%" install 22.16.0
  if errorlevel 1 (
    echo [ERRO] O NVM nao conseguiu instalar o Node.js 22.16.0.
    exit /b 1
  )
  call "%MAGICFORGE_NVM%" use 22.16.0
  if errorlevel 1 (
    echo [ERRO] O NVM instalou, mas nao conseguiu ativar o Node.js 22.16.0.
    exit /b 1
  )
)

if exist "%LOCALAPPDATA%\Author Software\nvm\.nodejs\node.exe" set "PATH=%LOCALAPPDATA%\Author Software\nvm\.nodejs;%PATH%"
if exist "%APPDATA%\nvm\.nodejs\node.exe" set "PATH=%APPDATA%\nvm\.nodejs;%PATH%"
set "MAGICFORGE_NODE_VERSION="
for /f "delims=" %%V in ('node -p "process.versions.node" 2^>nul') do set "MAGICFORGE_NODE_VERSION=%%V"
if not defined MAGICFORGE_NODE_VERSION (
  echo [ERRO] O NVM foi executado, mas o Node.js continua indisponivel nesta sessao.
  exit /b 1
)
for /f "tokens=1 delims=." %%M in ("!MAGICFORGE_NODE_VERSION!") do set "MAGICFORGE_NODE_MAJOR=%%M"
if !MAGICFORGE_NODE_MAJOR! LSS 16 (
  echo [ERRO] Node.js !MAGICFORGE_NODE_VERSION! permaneceu ativo; a versao 16 ou superior e obrigatoria.
  exit /b 1
)
exit /b 0

:check_port
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -State Listen -LocalPort %~1 -ErrorAction SilentlyContinue) { exit 1 }"
if errorlevel 1 (
  echo [ERRO] A porta %~1 ja esta em uso. Encerre o %~2 anterior e tente novamente.
  exit /b 1
)
exit /b 0

:wait_for_url
powershell.exe -NoProfile -Command "$clock = [Diagnostics.Stopwatch]::StartNew(); $reportAt = 5; do { $detail = & curl.exe -q -4 -k -f -sS --noproxy '*' --max-time 1 --output NUL '%~1' 2>&1; if ($LASTEXITCODE -eq 0) { exit 0 }; if ($clock.Elapsed.TotalSeconds -ge $reportAt) { Write-Host ('[INFO] Ainda aguardando resposta: {0}s' -f [int]$clock.Elapsed.TotalSeconds); $reportAt += 5 }; Start-Sleep -Milliseconds 300 } while ($clock.Elapsed.TotalSeconds -lt %~2); Write-Host ('[ERRO] Ultima tentativa: ' + ($detail -join ' ')); exit 1"
exit /b %errorlevel%

:failed
echo.
echo Inicializacao interrompida. Corrija o item acima e execute este arquivo novamente.
echo.
pause
exit /b 1
