Add-Type -AssemblyName System.Drawing
function Resize-Image($inFile, $outFile, $w, $h) {
    $img = [System.Drawing.Image]::FromFile($inFile)
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $w, $h)
    $bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
}
Resize-Image "C:\Users\ext_wpereira\OneDrive - Vitamina Work Life S.A\Documentos\APP.PRIME\android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png" "C:\Users\ext_wpereira\OneDrive - Vitamina Work Life S.A\Documentos\APP.PRIME\build-assets\ios-app-icon.png" 1024 1024
Resize-Image "C:\Users\ext_wpereira\OneDrive - Vitamina Work Life S.A\Documentos\APP.PRIME\android\app\src\main\res\drawable-port-xxxhdpi\splash.png" "C:\Users\ext_wpereira\OneDrive - Vitamina Work Life S.A\Documentos\APP.PRIME\build-assets\ios-splash.png" 2732 2732
