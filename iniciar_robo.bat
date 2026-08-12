@echo off
echo ====================================================
echo     ROBO DE AUDIO AULAS - INICIALIZANDO AMBIENTE
echo ====================================================

REM Cria o diretorio para o perfil limpo do robo se nao existir
mkdir "C:\chrome-robo-audioaulas" 2>nul

echo.
echo Iniciando o Chrome com porta de depuracao aberta...
start chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\chrome-robo-audioaulas" --no-first-run --no-default-browser-check

echo.
echo Aguardando o Chrome iniciar na porta 9222...
timeout /t 5 /nobreak >nul

echo.
echo Iniciando o script do Robo...
cd bot-audioaulas
node index.cjs

echo.
pause
