Add-Type -AssemblyName System.Drawing

$srcTransparent = 'C:\Users\ext_wpereira\.gemini\antigravity-ide\brain\40b2fe2b-fe10-4513-a17e-0b047c5609ef\.user_uploaded\media_1792636004403.png'
$srcRed = 'C:\Users\ext_wpereira\.gemini\antigravity-ide\brain\40b2fe2b-fe10-4513-a17e-0b047c5609ef\.user_uploaded\media_1792636283251.jpg'

# 1. Copiar coruja transparente para src/assets e public
Copy-Item -Path $srcTransparent -Destination 'src\assets\logo-coruja.png' -Force
Copy-Item -Path $srcTransparent -Destination 'public\logo-coruja.png' -Force
Write-Host 'Copied logo-coruja.png (transparent)'

# 2. Redimensionar coruja com fundo vermelho para os ícones de instalação
function Resize-Image {
    param (
        [string]$SourcePath,
        [string]$DestPath,
        [int]$Width,
        [int]$Height
    )
    $img = [System.Drawing.Image]::FromFile($SourcePath)
    $dest = New-Object System.Drawing.Bitmap $Width, $Height
    $graphics = [System.Drawing.Graphics]::FromImage($dest)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.DrawImage($img, 0, 0, $Width, $Height)
    $graphics.Dispose()
    $img.Dispose()
    $dest.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Saved: $DestPath ($Width x $Height)"
}

Resize-Image -SourcePath $srcRed -DestPath 'public\icon-512.png' -Width 512 -Height 512
Resize-Image -SourcePath $srcRed -DestPath 'public\icon-192.png' -Width 192 -Height 192
Resize-Image -SourcePath $srcRed -DestPath 'public\apple-touch-icon.png' -Width 180 -Height 180
Resize-Image -SourcePath $srcRed -DestPath 'public\favicon.png' -Width 512 -Height 512
Resize-Image -SourcePath $srcRed -DestPath 'public\favicon-32x32.png' -Width 32 -Height 32
Resize-Image -SourcePath $srcRed -DestPath 'public\favicon-16x16.png' -Width 16 -Height 16

# Copiar red original para referências
Copy-Item -Path $srcRed -Destination 'public\logo-coruja-red.jpg' -Force
Copy-Item -Path $srcRed -Destination 'src\assets\logo-coruja-red.jpg' -Force

# Gerar favicon.ico a partir do 32x32
$bmp32 = [System.Drawing.Bitmap]::FromFile((Resolve-Path 'public\favicon-32x32.png'))
$iconHandle = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$stream = New-Object System.IO.FileStream('public\favicon.ico', [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()
$stream.Dispose()
$bmp32.Dispose()
Write-Host 'Generated public\favicon.ico'
