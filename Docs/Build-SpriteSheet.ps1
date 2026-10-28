param(
    [Parameter(Mandatory=$true)][string[]]$FrameFiles,
    [Parameter(Mandatory=$true)][string]$OutputFolder,
    [string]$BaseName = 'iso_hero_clerigo_walk',
    [int]$Columns = 4,
    [int]$Rows = 2,
    [int]$CellSize = 512
)

# Technical packing of already drawn frames: uniform scaling, no pose synthesis.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
if ($Columns -lt 1 -or $Rows -lt 1 -or $CellSize -lt 1 -or $FrameFiles.Count -ne $Columns * $Rows) {
    throw 'Frame count must match a positive grid and cell size.'
}
if ($BaseName -notmatch '^[a-z0-9_]+$') { throw 'Invalid base name.' }
$outputPath = [IO.Path]::GetFullPath($OutputFolder)
$repoRoot = [IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
if (-not $outputPath.StartsWith($repoRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Output must be inside the repository.'
}
$sheetPath = Join-Path $outputPath ($BaseName + '_sheet.png')
$manifestPath = Join-Path $outputPath 'packing-manifest.json'
$destinations = @($sheetPath, $manifestPath)
for ($i=0; $i -lt $FrameFiles.Count; $i++) { $destinations += Join-Path $outputPath ('{0}_{1:D2}.png' -f $BaseName,$i) }
foreach ($destination in $destinations) { if (Test-Path -LiteralPath $destination) { throw "Refusing to overwrite: $destination" } }
$sourceHashes = @()
foreach ($file in $FrameFiles) {
    $image = [Drawing.Bitmap]::new([IO.Path]::GetFullPath($file))
    try { if ($image.Width -ne $image.Height) { throw "Source is not square: $file" } }
    finally { $image.Dispose() }
    $sourceHashes += (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash
}
if (@($sourceHashes | Select-Object -Unique).Count -ne $FrameFiles.Count) { throw 'Exact duplicate source frames are not allowed.' }
[IO.Directory]::CreateDirectory($outputPath) | Out-Null
$sheet = [Drawing.Bitmap]::new($Columns*$CellSize, $Rows*$CellSize, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
$sheetGraphics = [Drawing.Graphics]::FromImage($sheet)
$sheetGraphics.Clear([Drawing.Color]::Transparent)
$sheetGraphics.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
$records = @()
try {
    for ($i=0; $i -lt $FrameFiles.Count; $i++) {
        $source = [Drawing.Bitmap]::new([IO.Path]::GetFullPath($FrameFiles[$i]))
        $frame = [Drawing.Bitmap]::new($CellSize,$CellSize,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [Drawing.Graphics]::FromImage($frame)
        $attributes = [Drawing.Imaging.ImageAttributes]::new()
        try {
            $graphics.Clear([Drawing.Color]::Transparent)
            $graphics.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $attributes.SetWrapMode([Drawing.Drawing2D.WrapMode]::TileFlipXY)
            $rect = [Drawing.Rectangle]::new(0,0,$CellSize,$CellSize)
            $graphics.DrawImage($source,$rect,0,0,$source.Width,$source.Height,[Drawing.GraphicsUnit]::Pixel,$attributes)
            $framePath = Join-Path $outputPath ('{0}_{1:D2}.png' -f $BaseName,$i)
            $frame.Save($framePath,[Drawing.Imaging.ImageFormat]::Png)
            $x = ($i % $Columns) * $CellSize
            $y = [int][Math]::Floor($i / $Columns) * $CellSize
            $sheetGraphics.DrawImageUnscaled($frame,$x,$y)
            $records += [PSCustomObject]@{Index=$i;File=[IO.Path]::GetFileName($framePath);Source=[IO.Path]::GetFileName($FrameFiles[$i]);SourceSHA256=$sourceHashes[$i];FrameSHA256=(Get-FileHash -LiteralPath $framePath).Hash;X=$x;Y=$y;Size=$CellSize}
        }
        finally { $attributes.Dispose(); $graphics.Dispose(); $frame.Dispose(); $source.Dispose() }
    }
    $sheet.Save($sheetPath,[Drawing.Imaging.ImageFormat]::Png)
    [PSCustomObject]@{Sheet=[IO.Path]::GetFileName($sheetPath);Columns=$Columns;Rows=$Rows;CellSize=$CellSize;SheetSHA256=(Get-FileHash -LiteralPath $sheetPath).Hash;Frames=$records} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding utf8
}
finally { $sheetGraphics.Dispose(); $sheet.Dispose() }
Write-Output "Packed $($FrameFiles.Count) distinct frames: $sheetPath"
