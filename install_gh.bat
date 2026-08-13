@echo off
echo Instalando GitHub CLI (gh)...
winget install --id GitHub.cli -e --source winget --accept-package-agreements --accept-source-agreements
echo.
echo Instalacao concluida! Feche e abra o terminal novamente para usar o comando "gh".
pause
