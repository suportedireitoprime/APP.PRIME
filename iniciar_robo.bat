@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ====================================================
echo     ROBO DE AUDIO AULAS - INICIALIZANDO AMBIENTE
echo ====================================================

set "ROBO_DIR=%~dp0"
set "BOT_DIR=%ROBO_DIR%bot-audioaulas"
set "CHROME_PROFILE=C:\chrome-robo-audioaulas"
set "DEBUG_PORT=9222"
set "CHROME_EXE="
if /i "%~1"=="--background" set "BACKGROUND=1"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERRO: Node.js nao foi encontrado no PATH.
  echo Instale o Node.js ou abra este script pelo terminal onde o node funciona.
  echo.
  pause
  exit /b 1
)

for %%C in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
) do (
  if exist "%%~C" set "CHROME_EXE=%%~C"
)

if not defined CHROME_EXE (
  for /f "delims=" %%C in ('where chrome.exe 2^>nul') do if not defined CHROME_EXE set "CHROME_EXE=%%C"
)

if not defined CHROME_EXE (
  echo.
  echo ERRO: chrome.exe nao foi encontrado no PATH.
  echo Abra o Google Chrome uma vez, ou ajuste o PATH/atalho do Chrome.
  echo.
  pause
  exit /b 1
)

if not exist "%BOT_DIR%\index.cjs" (
  echo.
  echo ERRO: nao encontrei "%BOT_DIR%\index.cjs".
  echo Execute este arquivo a partir da pasta APP.PRIME.
  echo.
  pause
  exit /b 1
)

REM Cria o diretorio para o perfil limpo do robo se nao existir.
mkdir "%CHROME_PROFILE%" 2>nul

echo.
echo Iniciando o Chrome com porta de depuracao %DEBUG_PORT% aberta...
if defined BACKGROUND (
  start "Chrome Robo Audioaulas" /min "%CHROME_EXE%" --remote-debugging-port=%DEBUG_PORT% --user-data-dir="%CHROME_PROFILE%" --no-first-run --no-default-browser-check
) else (
  start "Chrome Robo Audioaulas" "%CHROME_EXE%" --remote-debugging-port=%DEBUG_PORT% --user-data-dir="%CHROME_PROFILE%" --no-first-run --no-default-browser-check
)

echo.
echo Aguardando o Chrome responder na porta %DEBUG_PORT%...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=1; $i -le 30; $i++){ try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 -Uri 'http://127.0.0.1:%DEBUG_PORT%/json/version'; if($r.StatusCode -eq 200){ $ok=$true; break } } catch {}; Start-Sleep -Seconds 1 }; if(-not $ok){ exit 1 }"
if errorlevel 1 (
  echo.
  echo ERRO: o Chrome nao respondeu na porta %DEBUG_PORT%.
  echo Feche Chromes antigos do robo e tente novamente.
  echo.
  pause
  exit /b 1
)

echo.
echo Iniciando o script do Robo...
cd /d "%BOT_DIR%"
node index.cjs
set "ROBO_EXIT=%ERRORLEVEL%"

echo.
if not "%ROBO_EXIT%"=="0" (
  echo O robo terminou com erro. Codigo: %ROBO_EXIT%
)
pause
exit /b %ROBO_EXIT%
