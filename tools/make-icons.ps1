# 生成买菜清单 PWA 所需的 PNG 图标（离线，使用 System.Drawing）
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path (Join-Path $PSScriptRoot '..') 'icons'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
$outDir = (Resolve-Path $outDir).Path

function New-RoundedRectPath {
    param($x, $y, $w, $h, $r)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-Icon {
    param([int]$size, [double]$glyphScale, [string]$path)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $scale = $size / 512.0 * $glyphScale
    # 背景：番茄红
    $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#E0533D'))
    $g.FillRectangle($bg, 0, 0, $size, $size)
    # 以 512 设计稿为基准缩放，居中
    $base = 512.0 * (1.0 - $glyphScale) / 2.0
    $g.TranslateTransform($base, $base)
    $g.ScaleTransform($scale, $scale)
    $white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
    $wb = New-Object System.Drawing.SolidBrush($white)
    # 购物车篮筐（梯形）
    $basket = New-Object System.Drawing.Drawing2D.GraphicsPath
    $basket.AddPolygon(@(
        (New-Object System.Drawing.PointF(150, 150)),
        (New-Object System.Drawing.PointF(364, 150)),
        (New-Object System.Drawing.PointF(330, 310)),
        (New-Object System.Drawing.PointF(184, 310))
    ))
    $g.FillPath($wb, $basket)
    # 购物车推杆
    $pen = New-Object System.Drawing.Pen($white, 24)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($pen, 96, 150, 150, 150)
    # 两个车轮
    $g.FillEllipse($wb, 166, 322, 56, 56)
    $g.FillEllipse($wb, 290, 322, 56, 56)
    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "saved $path ($size x $size)"
}

Draw-Icon 512 1.00 (Join-Path $outDir 'icon-512.png')
Draw-Icon 192 1.00 (Join-Path $outDir 'icon-192.png')
Draw-Icon 512 0.84 (Join-Path $outDir 'icon-maskable-512.png')
Draw-Icon 192 0.84 (Join-Path $outDir 'icon-maskable-192.png')
Draw-Icon 180 0.90 (Join-Path $outDir 'apple-touch-icon.png')
Draw-Icon 32  1.00 (Join-Path $outDir 'favicon-32.png')
