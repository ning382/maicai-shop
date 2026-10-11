# Generate Android launcher icons from icons/icon-512.png and icons/icon-maskable-512.png
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$res = Join-Path $root "android\app\src\main\res"
$icon = Join-Path $root "icons\icon-512.png"
$maskable = Join-Path $root "icons\icon-maskable-512.png"

function Resize([string]$src, [string]$dst, [int]$size, [double]$scale = 1.0) {
  $img = [System.Drawing.Image]::FromFile($src)
  try {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $inner = [int][math]::Round($size * $scale)
    $off = [int][math]::Round(($size - $inner) / 2.0)
    $g.DrawImage($img, $off, $off, $inner, $inner)
    $g.Dispose()
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dst) | Out-Null
    $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
  } finally { $img.Dispose() }
}

# sample corner pixel of icon-512 as adaptive icon background color
$sample = New-Object System.Drawing.Bitmap($icon)
$px = $sample.GetPixel(4, 4)
$sample.Dispose()
$hex = '#{0:X2}{1:X2}{2:X2}' -f $px.R, $px.G, $px.B

$dpi = @{ "mdpi" = 48; "hdpi" = 72; "xhdpi" = 96; "xxhdpi" = 144; "xxxhdpi" = 192 }
foreach ($k in $dpi.Keys) {
  Resize $icon (Join-Path $res "mipmap-$k\ic_launcher.png") $dpi[$k] 1.0
  Resize $icon (Join-Path $res "mipmap-$k\ic_launcher_round.png") $dpi[$k] 1.0
}
# adaptive foreground: icon occupies 72% of canvas
$fdpi = @{ "mdpi" = 108; "hdpi" = 162; "xhdpi" = 216; "xxhdpi" = 324; "xxxhdpi" = 432 }
foreach ($k in $fdpi.Keys) {
  Resize $maskable (Join-Path $res "mipmap-$k\ic_launcher_foreground.png") $fdpi[$k] 0.72
}
# background color resource
$colorXml = "<?xml version=`"1.0`" encoding=`"utf-8`"?>`r`n<resources>`r`n    <color name=`"ic_launcher_background`">$hex</color>`r`n</resources>`r`n"
New-Item -ItemType Directory -Force -Path (Join-Path $res "values") | Out-Null
Set-Content -Path (Join-Path $res "values\ic_launcher_background.xml") -Value $colorXml -Encoding UTF8
Write-Host "icons done, bg=$hex"
