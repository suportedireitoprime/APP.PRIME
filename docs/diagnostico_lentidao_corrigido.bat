@echo off
setlocal EnableExtensions
title Diagnostico de Lentidao - Windows
color 0A
set "RELATORIO=%USERPROFILE%\Desktop\diagnostico_pc.txt"

echo ==================================================
echo     DIAGNOSTICO DE LENTIDAO DO COMPUTADOR
echo ==================================================
echo.
echo Data: %date% %time% > "%RELATORIO%"

echo [1/6] Ativando plano de energia Equilibrado...
powercfg /setactive SCHEME_BALANCED >nul 2>&1

echo [2/6] Coletando CPU e memoria...
echo ===== CPU E MEMORIA ===== >> "%RELATORIO%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$os=Get-CimInstance Win32_OperatingSystem; $cpu=(Get-CimInstance Win32_Processor | Measure-Object LoadPercentage -Average).Average; $total=[math]::Round($os.TotalVisibleMemorySize/1MB,2); $free=[math]::Round($os.FreePhysicalMemory/1MB,2); 'CPU agora: '+$cpu+'%%'; 'RAM total: '+$total+' GB'; 'RAM usada: '+[math]::Round($total-$free,2)+' GB'; 'RAM livre: '+$free+' GB'" >> "%RELATORIO%" 2>&1

echo [3/6] Verificando processos...
echo. >> "%RELATORIO%"
echo ===== TOP 20 POR RAM ===== >> "%RELATORIO%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 20 ProcessName,Id,@{N='RAM_MB';E={[math]::Round($_.WorkingSet64/1MB,1)}} | Format-Table -AutoSize | Out-String -Width 220" >> "%RELATORIO%" 2>&1

echo. >> "%RELATORIO%"
echo ===== CPU POR PROCESSO - AMOSTRA 2 SEGUNDOS ===== >> "%RELATORIO%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$a=@{}; Get-Process | ForEach-Object {$a[$_.Id]=$_.TotalProcessorTime.TotalSeconds}; Start-Sleep 2; $cores=[Environment]::ProcessorCount; Get-Process | ForEach-Object {if($a.ContainsKey($_.Id)){[pscustomobject]@{Processo=$_.ProcessName;PID=$_.Id;CPU_Pct=[math]::Round((($_.TotalProcessorTime.TotalSeconds-$a[$_.Id])/2)*100/$cores,1);RAM_MB=[math]::Round($_.WorkingSet64/1MB,1)}}} | Sort-Object CPU_Pct -Descending | Select-Object -First 20 | Format-Table -AutoSize | Out-String -Width 220" >> "%RELATORIO%" 2>&1

echo [4/6] Verificando discos...
echo. >> "%RELATORIO%"
echo ===== DISCOS ===== >> "%RELATORIO%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,@{N='Total_GB';E={[math]::Round($_.Size/1GB,1)}},@{N='Livre_GB';E={[math]::Round($_.FreeSpace/1GB,1)}} | Format-Table -AutoSize | Out-String -Width 220" >> "%RELATORIO%" 2>&1

echo [5/6] Verificando Brave, Node, Gemini e Antigravity...
echo. >> "%RELATORIO%"
echo ===== DESENVOLVIMENTO ===== >> "%RELATORIO%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-Process | Where-Object {$_.ProcessName -match 'brave|node|gemini|antigravity|code'} | Sort-Object WorkingSet64 -Descending | Select-Object ProcessName,Id,@{N='RAM_MB';E={[math]::Round($_.WorkingSet64/1MB,1)}} | Format-Table -AutoSize | Out-String -Width 220" >> "%RELATORIO%" 2>&1

echo [6/6] Finalizado.
echo.
echo Relatorio: %RELATORIO%
echo Execute este BAT quando o computador estiver travando.
echo Depois envie o diagnostico_pc.txt para analise.
start "" notepad.exe "%RELATORIO%"
pause
endlocal
