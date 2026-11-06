Add-Type -AssemblyName System.Drawing

$srcMaster = Resolve-Path 'resources\themis-master-icon.jpg'
Write-Host "Master Source Icon: $srcMaster"

function Resize-Image {
    param (
        [string]$SourcePath,
        [string]$DestPath,
        [int]$Width,
        [int]$Height
    )
    $parent = Split-Path -Parent $DestPath
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

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
    
    if (Test-Path $DestPath) { Remove-Item $DestPath -Force }
    $dest.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Generated: $DestPath ($Width x $Height)"
}

function Generate-RoundIcon {
    param (
        [string]$SourcePath,
        [string]$DestPath,
        [int]$Size
    )
    $parent = Split-Path -Parent $DestPath
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    $img = [System.Drawing.Image]::FromFile($SourcePath)
    $dest = New-Object System.Drawing.Bitmap $Size, $Size
    $graphics = [System.Drawing.Graphics]::FromImage($dest)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $Size, $Size)
    $graphics.SetClip($path)
    $graphics.DrawImage($img, 0, 0, $Size, $Size)
    $path.Dispose()
    $graphics.Dispose()
    $img.Dispose()

    if (Test-Path $DestPath) { Remove-Item $DestPath -Force }
    $dest.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Generated Round Icon: $DestPath ($Size x $Size)"
}

function Generate-AdaptiveForeground {
    param (
        [string]$SourcePath,
        [string]$DestPath,
        [int]$Size
    )
    $parent = Split-Path -Parent $DestPath
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    # Android adaptive icon canvas is 108dp. Safe zone is inner 72dp (ratio = 72/108 = 0.666).
    # Since Themis and the golden halo occupy the center 65% of the 1024x1024 artwork,
    # drawing the full scene to 108dp keeps Themis safely inside the 72dp circular/squircle mask,
    # while the classical columns, roses, and sky gracefully bleed into the 108dp parallax canvas.
    $img = [System.Drawing.Image]::FromFile($SourcePath)
    $dest = New-Object System.Drawing.Bitmap $Size, $Size
    $graphics = [System.Drawing.Graphics]::FromImage($dest)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.DrawImage($img, 0, 0, $Size, $Size)
    $graphics.Dispose()
    $img.Dispose()

    if (Test-Path $DestPath) { Remove-Item $DestPath -Force }
    $dest.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Generated Adaptive Foreground: $DestPath ($Size x $Size)"
}

# 1. Update resources/ and build-assets/
Resize-Image -SourcePath $srcMaster -DestPath 'resources\icon.png' -Width 1024 -Height 1024
Resize-Image -SourcePath $srcMaster -DestPath 'resources\icon-foreground.png' -Width 1024 -Height 1024
Resize-Image -SourcePath $srcMaster -DestPath 'build-assets\ios-app-icon.png' -Width 1024 -Height 1024

# Create resources/icon-background.png (solid #160809 matching dark rose base)
$bgBmp = New-Object System.Drawing.Bitmap 1024, 1024
$bgG = [System.Drawing.Graphics]::FromImage($bgBmp)
$roseBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 22, 8, 9))
$bgG.FillRectangle($roseBrush, 0, 0, 1024, 1024)
$roseBrush.Dispose()
$bgG.Dispose()
if (Test-Path 'resources\icon-background.png') { Remove-Item 'resources\icon-background.png' -Force }
$bgBmp.Save('resources\icon-background.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bgBmp.Dispose()
Write-Host "Generated: resources\icon-background.png (1024 x 1024)"

# 2. Update iOS / Apple AppIcon (1024x1024 universal icon for Xcode 14+)
Resize-Image -SourcePath $srcMaster -DestPath 'ios\App\App\Assets.xcassets\AppIcon.appiconset\AppIcon-512@2x.png' -Width 1024 -Height 1024

# 3. Update Android Mipmaps
$densities = @(
    @{ Name = "mdpi"; Launcher = 48; Foreground = 108 },
    @{ Name = "hdpi"; Launcher = 72; Foreground = 162 },
    @{ Name = "xhdpi"; Launcher = 96; Foreground = 216 },
    @{ Name = "xxhdpi"; Launcher = 144; Foreground = 324 },
    @{ Name = "xxxhdpi"; Launcher = 192; Foreground = 432 }
)

foreach ($d in $densities) {
    $dir = "android\app\src\main\res\mipmap-$($d.Name)"
    Resize-Image -SourcePath $srcMaster -DestPath "$dir\ic_launcher.png" -Width $d.Launcher -Height $d.Launcher
    Generate-RoundIcon -SourcePath $srcMaster -DestPath "$dir\ic_launcher_round.png" -Size $d.Launcher
    Generate-AdaptiveForeground -SourcePath $srcMaster -DestPath "$dir\ic_launcher_foreground.png" -Size $d.Foreground
}

# 4. Update Web / PWA / Browser icons in public/
Resize-Image -SourcePath $srcMaster -DestPath 'public\icon-512.png' -Width 512 -Height 512
Resize-Image -SourcePath $srcMaster -DestPath 'public\icon-192.png' -Width 192 -Height 192
Resize-Image -SourcePath $srcMaster -DestPath 'public\apple-touch-icon.png' -Width 180 -Height 180
Resize-Image -SourcePath $srcMaster -DestPath 'public\favicon.png' -Width 512 -Height 512
Resize-Image -SourcePath $srcMaster -DestPath 'public\favicon-32x32.png' -Width 32 -Height 32
Resize-Image -SourcePath $srcMaster -DestPath 'public\favicon-16x16.png' -Width 16 -Height 16

# Generate favicon.ico from 32x32
$bmp32 = [System.Drawing.Bitmap]::FromFile((Resolve-Path 'public\favicon-32x32.png'))
$iconHandle = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$stream = New-Object System.IO.FileStream('public\favicon.ico', [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()
$stream.Dispose()
$bmp32.Dispose()
Write-Host "Generated: public\favicon.ico"

Write-Host "ALL NATIVE ANDROID, APPLE AND WEB ICONS SUCCESSFULLY GENERATED!"
