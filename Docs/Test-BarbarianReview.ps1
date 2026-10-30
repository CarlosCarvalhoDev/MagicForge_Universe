param([ValidateSet('walk_v2','walk_v3')][string]$Version = 'walk_v2')
# Integrity check only. Gait and identity require visual acceptance.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$repoRoot = Split-Path $PSScriptRoot -Parent
$doc = Join-Path $repoRoot 'Docs/Art/Isometric/Animations/Heroes/Barbaro'
$review = Join-Path $doc "Revisoes/$Version"
function Assert-Artifact([bool]$condition,[string]$message) { if (-not $condition) { throw $message } }
$inventory = Get-Content -LiteralPath "$doc/Revisoes/2026-10-28_baseline/inventory.json" -Raw | ConvertFrom-Json
$activePath = Join-Path $doc 'Revisoes/active-walk.json'
$active = if (Test-Path -LiteralPath $activePath) { Get-Content -LiteralPath $activePath -Raw | ConvertFrom-Json } else { $null }
foreach ($entry in $inventory) {
  $path = Join-Path $repoRoot $entry.RelativePath
  $expected = $entry.SHA256
  if ($active -and [IO.Path]::GetFileName($path) -eq 'iso_hero_barbaro_walk_sheet.png') { $expected = $active.SheetSHA256 }
  if ($active -and $path -match '[\\/]frames_individuais[\\/]iso_hero_barbaro_walk_01\.png$') { $expected = $active.RepairedFrameSHA256 }
  Assert-Artifact ((Get-FileHash -LiteralPath $path).Hash -eq $expected) "Canonical Barbarian file differs from approved revision/baseline: $path"
}
if ($active) {
  $approved = Get-Content -LiteralPath "$doc/Revisoes/$($active.Version)/packing-manifest.json" -Raw | ConvertFrom-Json
  Assert-Artifact ($active.SheetSHA256 -eq $approved.SheetSHA256 -and $active.RepairedFrameSHA256 -eq $approved.Frames[1].FrameSHA256) 'Active approval differs from archived source'
}
$manifest = Get-Content -LiteralPath "$review/packing-manifest.json" -Raw | ConvertFrom-Json
Assert-Artifact ($manifest.Columns -eq 3 -and $manifest.Rows -eq 2 -and $manifest.CellSize -eq 512 -and $manifest.Frames.Count -eq 6) 'Candidate grid mismatch'
Assert-Artifact (@($manifest.Frames.SourceSHA256 | Select-Object -Unique).Count -eq 6) 'Repeated source image'
Assert-Artifact (@($manifest.Frames.FrameSHA256 | Select-Object -Unique).Count -eq 6) 'Repeated packed frame'
foreach ($frame in $manifest.Frames) {
  $path = Join-Path $review $frame.File
  Assert-Artifact ((Get-FileHash -LiteralPath $path).Hash -eq $frame.FrameSHA256) "Frame hash mismatch: $path"
  $bitmap = [Drawing.Bitmap]::new($path)
  $expectedAlpha = if ($Version -eq 'walk_v3') { 255 } else { 0 }
  try { Assert-Artifact ($bitmap.Width -eq 512 -and $bitmap.Height -eq 512 -and $bitmap.GetPixel(0,0).A -eq $expectedAlpha -and $bitmap.GetPixel(511,511).A -eq $expectedAlpha) "Frame size/alpha mismatch: $path" }
  finally { $bitmap.Dispose() }
}
$sheet = Join-Path $review $manifest.Sheet
Assert-Artifact ((Get-FileHash -LiteralPath $sheet).Hash -eq $manifest.SheetSHA256) 'Sheet hash mismatch'
$bitmap = [Drawing.Bitmap]::new($sheet)
try { Assert-Artifact ($bitmap.Width -eq 1536 -and $bitmap.Height -eq 1024) 'Sheet dimensions mismatch' }
finally { $bitmap.Dispose() }
Assert-Artifact ((Get-FileHash -LiteralPath "$repoRoot/client/public/assets/isometric/review/barbaro_${Version}_sheet.png").Hash -eq $manifest.SheetSHA256) 'Web candidate differs'
$baselineSheet = Join-Path $doc 'Revisoes/2026-10-28_baseline/iso_hero_barbaro_walk_sheet.png'
Assert-Artifact ((Get-FileHash -LiteralPath "$repoRoot/client/public/assets/isometric/review/barbaro_walk_baseline_sheet.png").Hash -eq (Get-FileHash -LiteralPath $baselineSheet).Hash) 'Web baseline differs'
if ($Version -eq 'walk_v3') {
  function Get-PixelHash([string]$path) {
    $b = [Drawing.Bitmap]::new($path)
    $bits = $b.LockBits([Drawing.Rectangle]::new(0,0,$b.Width,$b.Height),[Drawing.Imaging.ImageLockMode]::ReadOnly,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try { $bytes = [byte[]]::new([Math]::Abs($bits.Stride) * $bits.Height); [Runtime.InteropServices.Marshal]::Copy($bits.Scan0,$bytes,0,$bytes.Length); return [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)) }
    finally { $b.UnlockBits($bits); $b.Dispose() }
  }
  for ($i=0; $i -lt 6; $i++) {
    $name = 'iso_hero_barbaro_walk_{0:D2}.png' -f $i
    # Original individual files were not all pixel-identical to the old atlas slices.
    # Compare against archived individual sources, authenticated by pre-edit hashes.
    $original = if ($i -eq 1 -and $active) { "$review/pre-integration-frames/docs-walk_01.png" } elseif ($i -eq 1) { "$doc/frames_individuais/$name" } else { "$review/sources/$name" }
    $originalRecord = $inventory | Where-Object { $_.RelativePath -like 'Docs*' -and [IO.Path]::GetFileName($_.Path) -eq $name }
    Assert-Artifact ($originalRecord.Count -eq 1 -and (Get-FileHash -LiteralPath $original).Hash -eq $originalRecord.SHA256) "Original frame archive mismatch: $name"
    $same = (Get-PixelHash "$review/$name") -eq (Get-PixelHash $original)
    Assert-Artifact ($same -eq ($i -ne 1)) "Unexpected changed frame: $i (only frame 2 may differ)"
  }
  Write-Output 'PASS: five original frames are pixel-identical; only the repaired second frame differs.'
}
Write-Output "PASS: $($inventory.Count) canonical files match approved revision/baseline; six distinct frames, 512px cells, expected background, 3x2 sheet and Web copies match. ART QUALITY REQUIRES USER APPROVAL."
