# Technical cropping/packing only: no pose synthesis, mirroring or deformation.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$revision = Join-Path $root 'Docs/Art/Isometric/Animations/Heroes/Arqueiro/Revisoes/basico_v1'
$web = Join-Path $root 'client/public/assets/isometric/review/arqueiro_basico_v1'
New-Item -ItemType Directory -Path $web -Force | Out-Null
$actions = @(
  @{Name='idle';Columns=2;Rows=2;FPS=5}, @{Name='walk';Columns=3;Rows=2;FPS=9},
  @{Name='attack';Columns=3;Rows=2;FPS=11}, @{Name='hit';Columns=2;Rows=1;FPS=10},
  @{Name='death';Columns=2;Rows=2;FPS=7}
)
$packed = @()
function Get-AlphaBounds([Drawing.Bitmap]$bitmap) {
  $left=$bitmap.Width; $top=$bitmap.Height; $right=0; $bottom=0
  # Sampling locates bounds only; the full-resolution drawing is retained.
  for ($y=0; $y -lt $bitmap.Height; $y+=4) {
    for ($x=0; $x -lt $bitmap.Width; $x+=4) {
      if ($bitmap.GetPixel($x,$y).A -gt 32) {
        $left=[Math]::Min($left,$x); $top=[Math]::Min($top,$y)
        $right=[Math]::Max($right,[Math]::Min($bitmap.Width,$x+4)); $bottom=[Math]::Max($bottom,[Math]::Min($bitmap.Height,$y+4))
      }
    }
  }
  if ($right -le $left -or $bottom -le $top) { throw 'Empty candidate frame' }
  return @{Left=$left;Top=$top;Right=$right;Bottom=$bottom}
}
foreach ($action in $actions) {
  $name = $action.Name
  $sourceDir = Join-Path $revision "sources/$name"
  if ($name -ne 'walk') {
    $source = [Drawing.Bitmap]::new((Join-Path $revision "sources/$name-generated.png"))
    try {
      if ($source.Width % $action.Columns -ne 0 -or $source.Height % $action.Rows -ne 0 -or $source.Width / $action.Columns -ne $source.Height / $action.Rows) { throw "Generated $name image is not the specified square-cell grid: $($source.Width)x$($source.Height)" }
      New-Item -ItemType Directory -Path $sourceDir -Force | Out-Null
      $cell = [int]($source.Width / $action.Columns)
      for ($index=0; $index -lt $action.Columns*$action.Rows; $index++) {
        $output = Join-Path $sourceDir ('source_{0:D2}.png' -f $index)
        if (Test-Path -LiteralPath $output) { throw "Refusing to overwrite $output" }
        $rectangle = [Drawing.Rectangle]::new(($index % $action.Columns)*$cell,[int][Math]::Floor($index/$action.Columns)*$cell,$cell,$cell)
        $frame = $source.Clone($rectangle,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try { $frame.Save($output,[Drawing.Imaging.ImageFormat]::Png) } finally { $frame.Dispose() }
      }
    } finally { $source.Dispose() }
  }
  $frames = @(0..($action.Columns*$action.Rows-1) | ForEach-Object { Join-Path $sourceDir ('source_{0:D2}.png' -f $_) })
  # One uniform scale/translation per ACTION, never per body part or gait phase.
  # This removes excess transparent padding without changing authored poses.
  $bitmaps = @(); $bounds = @()
  try {
    foreach ($framePath in $frames) { $bitmap=[Drawing.Bitmap]::new($framePath); $bitmaps+=$bitmap; $bounds+=(Get-AlphaBounds $bitmap) }
    $sourceSize=$bitmaps[0].Width
    foreach ($bitmap in $bitmaps) { if ($bitmap.Width -ne $sourceSize -or $bitmap.Height -ne $sourceSize) { throw 'Individual source sizes differ within action' } }
    $left=($bounds.Left | Measure-Object -Minimum).Minimum; $right=($bounds.Right | Measure-Object -Maximum).Maximum
    $top=($bounds.Top | Measure-Object -Minimum).Minimum; $bottom=($bounds.Bottom | Measure-Object -Maximum).Maximum
    $extent=[Math]::Max($sourceSize/2-$left,$right-$sourceSize/2)
    $scale=[Math]::Min(450.0/($bounds[0].Bottom-$bounds[0].Top),[Math]::Min(232.0/$extent,456.0/($bottom-$top)))
    $offsetX=256-$sourceSize/2*$scale; $offsetY=480-$bottom*$scale
    $normalizedDir=Join-Path $revision "normalized/$name"
    New-Item -ItemType Directory -Path $normalizedDir -Force | Out-Null
    $normalized=@()
    for ($index=0; $index -lt $bitmaps.Count; $index++) {
      $output=Join-Path $normalizedDir ('source_{0:D2}.png' -f $index)
      if (Test-Path -LiteralPath $output) { throw "Refusing to overwrite $output" }
      $canvas=[Drawing.Bitmap]::new(512,512,[Drawing.Imaging.PixelFormat]::Format32bppArgb); $graphics=[Drawing.Graphics]::FromImage($canvas)
      try {
        $graphics.Clear([Drawing.Color]::Transparent); $graphics.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $rectangle=[Drawing.RectangleF]::new($offsetX,$offsetY,$sourceSize*$scale,$sourceSize*$scale)
        $graphics.DrawImage($bitmaps[$index],$rectangle)
        $canvas.Save($output,[Drawing.Imaging.ImageFormat]::Png)
      } finally { $graphics.Dispose(); $canvas.Dispose() }
      $normalized+=$output
    }
    @{Scale=$scale;OffsetX=$offsetX;OffsetY=$offsetY;SourceSize=$sourceSize;Rule='Uniform transform shared by every frame of the action; no pose synthesis'} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $normalizedDir 'transform.json') -Encoding utf8
    $frames=$normalized
  } finally { foreach ($bitmap in $bitmaps) { $bitmap.Dispose() } }
  $destination = Join-Path $revision $name
  & "$PSScriptRoot/Build-SpriteSheet.ps1" -FrameFiles $frames -OutputFolder $destination -BaseName "iso_hero_arqueiro_$name" -Columns $action.Columns -Rows $action.Rows
  $manifest = Get-Content -LiteralPath (Join-Path $destination 'packing-manifest.json') -Raw | ConvertFrom-Json
  $webFile = Join-Path $web $manifest.Sheet
  if (Test-Path -LiteralPath $webFile) { throw "Refusing to overwrite $webFile" }
  Copy-Item -LiteralPath (Join-Path $destination $manifest.Sheet) -Destination $webFile
  $packed += @{Action=$name;Sheet=$manifest.Sheet;Columns=$action.Columns;Rows=$action.Rows;Frames=$manifest.Frames.Count;FPS=$action.FPS;SHA256=$manifest.SheetSHA256}
}
$packed | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $revision 'ANIMACOES_MANIFEST.json') -Encoding utf8
Write-Output 'Packed review-only archer package. No gameplay or Unity assets modified.'
