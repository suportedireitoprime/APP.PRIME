Add-Type -AssemblyName System.Drawing

$srcRed = Resolve-Path 'public\logo-coruja-red.jpg'
$srcTransparent = Resolve-Path 'public\logo-coruja.png'

Write-Host "Source Red: $srcRed"
Write-Host "Source Transparent: $srcTransparent"

function Resize-Image {
    param (
        [string]$SourcePath,
        [string]$DestPath,
        [int]$Width,
        [int]$Height,
        [System.Drawing.Color]$BgColor = [System.Drawing.Color]::Transparent
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
    
    if ($BgColor -ne [System.Drawing.Color]::Transparent) {
        $brush = New-Object System.Drawing.SolidBrush $BgColor
        $graphics.FillRectangle($brush, 0, 0, $Width, $Height)
        $brush.Dispose()
    }
    
    $graphics.DrawImage($img, 0, 0, $Width, $Height)
    $graphics.Dispose()
    $img.Dispose()
    
    if (Test-Path $DestPath) { Remove-Item $DestPath -Force }
    $dest.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Generated: $DestPath ($Width x $Height)"
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
    # We draw the source logo centered at ~70% size with #B30B25 background so it blends seamlessly.
    $img = [System.Drawing.Image]::FromFile($SourcePath)
    $dest = New-Object System.Drawing.Bitmap $Size, $Size
    $graphics = [System.Drawing.Graphics]::FromImage($dest)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $redBg = [System.Drawing.Color]::FromArgb(255, 179, 11, 37) # #B30B25
    $brush = New-Object System.Drawing.SolidBrush $redBg
    $graphics.FillRectangle($brush, 0, 0, $Size, $Size)
    $brush.Dispose()

    $targetW = [int]($Size * 0.72)
    $targetH = [int]($Size * 0.72)
    $targetX = [int](($Size - $targetW) / 2)
    $targetY = [int](($Size - $targetH) / 2)

    $graphics.DrawImage($img, $targetX, $targetY, $targetW, $targetH)
    $graphics.Dispose()
    $img.Dispose()

    if (Test-Path $DestPath) { Remove-Item $DestPath -Force }
    $dest.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Generated Adaptive Foreground: $DestPath ($Size x $Size)"
}

# 1. Update resources/ and build-assets/
Resize-Image -SourcePath $srcRed -DestPath 'resources\icon.png' -Width 1024 -Height 1024
Resize-Image -SourcePath $srcRed -DestPath 'resources\icon-foreground.png' -Width 1024 -Height 1024
Resize-Image -SourcePath $srcRed -DestPath 'build-assets\ios-app-icon.png' -Width 1024 -Height 1024

# Create resources/icon-background.png (solid #B30B25)
$bgBmp = New-Object System.Drawing.Bitmap 1024, 1024
$bgG = [System.Drawing.Graphics]::FromImage($bgBmp)
$redBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 179, 11, 37))
$bgG.FillRectangle($redBrush, 0, 0, 1024, 1024)
$redBrush.Dispose()
$bgG.Dispose()
if (Test-Path 'resources\icon-background.png') { Remove-Item 'resources\icon-background.png' -Force }
$bgBmp.Save('resources\icon-background.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bgBmp.Dispose()
Write-Host "Generated: resources\icon-background.png (1024 x 1024)"

# 2. Update iOS AppIcon
Resize-Image -SourcePath $srcRed -DestPath 'ios\App\App\Assets.xcassets\AppIcon.appiconset\AppIcon-512@2x.png' -Width 1024 -Height 1024

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
    Resize-Image -SourcePath $srcRed -DestPath "$dir\ic_launcher.png" -Width $d.Launcher -Height $d.Launcher
    Resize-Image -SourcePath $srcRed -DestPath "$dir\ic_launcher_round.png" -Width $d.Launcher -Height $d.Launcher
    Generate-AdaptiveForeground -SourcePath $srcRed -DestPath "$dir\ic_launcher_foreground.png" -Size $d.Foreground
}

# 4. Update Web / PWA icons in public/
Resize-Image -SourcePath $srcRed -DestPath 'public\icon-512.png' -Width 512 -Height 512
Resize-Image -SourcePath $srcRed -DestPath 'public\icon-192.png' -Width 192 -Height 192
Resize-Image -SourcePath $srcRed -DestPath 'public\apple-touch-icon.png' -Width 180 -Height 180
Resize-Image -SourcePath $srcRed -DestPath 'public\favicon.png' -Width 512 -Height 512
Resize-Image -SourcePath $srcRed -DestPath 'public\favicon-32x32.png' -Width 32 -Height 32
Resize-Image -SourcePath $srcRed -DestPath 'public\favicon-16x16.png' -Width 16 -Height 16

# Generate favicon.ico
$bmp32 = [System.Drawing.Bitmap]::FromFile((Resolve-Path 'public\favicon-32x32.png'))
$iconHandle = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$stream = New-Object System.IO.FileStream('public\favicon.ico', [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()
$stream.Dispose()
$bmp32.Dispose()
Write-Host "Generated: public\favicon.ico"

Write-Host "ALL ICONS SUCCESSFULLY GENERATED!"
