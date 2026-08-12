@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul

if "%~1"=="" (
    echo.
    echo Arraste um atalho ^(.lnk^) ou executavel ^(.exe^) para cima deste arquivo BAT.
    echo.
    pause
    exit /b 1
)

set "ITEM=%~f1"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
"$ErrorActionPreference='Stop'; ^
$p=$env:ITEM; ^
if(-not (Test-Path -LiteralPath $p)){ throw 'Arquivo informado nao existe.' }; ^
if([IO.Path]::GetExtension($p) -ieq '.lnk'){ ^
  $ws=New-Object -ComObject WScript.Shell; ^
  $sc=$ws.CreateShortcut($p); ^
  $target=$sc.TargetPath; ^
  if([string]::IsNullOrWhiteSpace($target)){ throw 'Nao foi possivel descobrir o destino do atalho.' } ^
} else { $target=$p }; ^
$target=[IO.Path]::GetFullPath($target); ^
if(-not (Test-Path -LiteralPath $target)){ throw ('Destino nao encontrado: '+$target) }; ^
$targetDir=Split-Path -LiteralPath $target -Parent; ^
$targetName=[IO.Path]::GetFileName($target); ^
Write-Host ''; Write-Host ('Destino: '+$target) -ForegroundColor Cyan; ^
$roots=@( ^
 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*', ^
 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*', ^
 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*' ^
); ^
$items=foreach($r in $roots){ Get-ItemProperty $r -ErrorAction SilentlyContinue }; ^
$candidates=foreach($x in $items){ ^
  if([string]::IsNullOrWhiteSpace($x.DisplayName)){ continue }; ^
  $score=0; ^
  $install=[string]$x.InstallLocation; ^
  $icon=[string]$x.DisplayIcon; ^
  $un=[string]$x.UninstallString; ^
  $qu=[string]$x.QuietUninstallString; ^
  if($install){ ^
    try { $install=[IO.Path]::GetFullPath($install.Trim('"').TrimEnd('\')); } catch {} ^
    if($targetDir.StartsWith($install,[StringComparison]::OrdinalIgnoreCase)){ $score+=100 } ^
  }; ^
  if($icon){ ^
    $iconPath=($icon -split ',')[0].Trim('"'); ^
    if($iconPath -and ($iconPath -ieq $target)){ $score+=80 } ^
    elseif($iconPath -and ([IO.Path]::GetFileName($iconPath) -ieq $targetName)){ $score+=20 } ^
  }; ^
  if($un -and $un.IndexOf($targetName,[StringComparison]::OrdinalIgnoreCase) -ge 0){ $score+=15 }; ^
  if($score -gt 0){ [pscustomobject]@{Name=$x.DisplayName; Score=$score; Uninstall=$un; Quiet=$qu; Install=$install} } ^
}; ^
$best=$candidates | Sort-Object Score -Descending | Select-Object -First 1; ^
$cmd=$null; ^
if($best -and $best.Score -ge 80){ ^
  Write-Host ('Programa identificado: '+$best.Name) -ForegroundColor Green; ^
  $cmd=$best.Uninstall; ^
  if([string]::IsNullOrWhiteSpace($cmd)){ $cmd=$best.Quiet }; ^
}; ^
if(-not $cmd){ ^
  $patterns=@('uninstall.exe','uninstaller.exe','unins000.exe','unins001.exe','unins*.exe','uninstall*.exe'); ^
  $found=foreach($pat in $patterns){ Get-ChildItem -LiteralPath $targetDir -Filter $pat -File -ErrorAction SilentlyContinue } | Select-Object -Unique FullName; ^
  $u=$found | Select-Object -First 1; ^
  if($u){ ^
    Write-Host ('Desinstalador encontrado na pasta: '+$u.FullName) -ForegroundColor Yellow; ^
    $cmd='"'+$u.FullName+'"'; ^
  } ^
}; ^
if(-not $cmd){ ^
  Write-Host ''; ^
  Write-Host 'Nao encontrei um desinstalador confiavel para esse item.' -ForegroundColor Red; ^
  Write-Host 'Tente usar o atalho/executavel principal do programa.'; ^
  exit 2 ^
}; ^
if($cmd -match '(?i)msiexec(\.exe)?\s+.*\s/I\s*({[0-9A-F-]+})'){ $cmd=$cmd -replace '(?i)(\s)/I(?=\s*{)', '$1/X' }; ^
Write-Host ''; Write-Host ('Comando de desinstalacao: '+$cmd) -ForegroundColor DarkGray; ^
$ans=Read-Host 'Deseja abrir o desinstalador agora? (S/N)'; ^
if($ans -notmatch '^(s|sim|y|yes)$'){ Write-Host 'Cancelado.'; exit 0 }; ^
Start-Process -FilePath 'cmd.exe' -ArgumentList '/d','/s','/c',('"'+$cmd+'"') -Verb RunAs; ^
Write-Host 'Desinstalador iniciado.' -ForegroundColor Green" 

set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" (
    echo.
    echo O processo terminou com codigo %RC%.
    pause
)
exit /b %RC%
