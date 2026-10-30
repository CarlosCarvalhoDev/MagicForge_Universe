param([ValidateSet('walk_v2','walk_v3')][string]$Version = 'walk_v2')
# Artifact integrity only; animation quality requires visual review.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$repoRoot = Split-Path $PSScriptRoot -Parent
$doc = Join-Path $repoRoot 'Docs/Art/Isometric/Animations/Heroes/Guerreiro'
$baseline = Join-Path $doc 'Revisoes/2026-10-28_baseline'
$candidate = Join-Path $doc "Revisoes/$Version"
$unity = Join-Path $repoRoot 'MagicForgeClient/Assets/Textures/Sprites/Animations/Heroes/Guerreiro'
$web = Join-Path $repoRoot 'client/public/assets/isometric/animations/heroes/guerreiro'
function Assert-Review([bool]$Condition, [string]$Message) { if (-not $Condition) { throw $Message } }
$inventory = Get-Content -LiteralPath "$baseline/inventory.json" -Raw | ConvertFrom-Json
$activePath = Join-Path $doc 'Revisoes/active-walk.json'
$active = if (Test-Path -LiteralPath $activePath) { Get-Content -LiteralPath $activePath -Raw | ConvertFrom-Json } else { $null }
foreach ($entry in $inventory) {
    $expectedHash = if ($active -and $entry.File -eq 'iso_hero_guerreiro_walk_sheet.png') { $active.SheetSHA256 } else { $entry.WebSHA256 }
    foreach ($root in @($doc,$unity,$web)) {
        Assert-Review ((Get-FileHash -LiteralPath "$root/$($entry.File)").Hash -eq $expectedHash) "Canonical sheet differs from approved revision: $root/$($entry.File)"
    }
    Assert-Review ((Get-FileHash -LiteralPath "$unity/$($entry.File).meta").Hash -eq (Get-FileHash -LiteralPath "$baseline/$($entry.File).meta-original.txt").Hash) "Unity metadata changed: $($entry.File)"
}
Assert-Review ((Get-FileHash -LiteralPath "$repoRoot/MagicForgeClient/Assets/Guerreiro.asset").Hash -eq (Get-FileHash -LiteralPath "$baseline/Guerreiro.asset-original.txt").Hash) 'Guerreiro.asset changed.'
if ($active) {
    $activeManifest = Get-Content -LiteralPath (Join-Path $doc "Revisoes/$($active.Version)/packing-manifest.json") -Raw | ConvertFrom-Json
    Assert-Review ($activeManifest.SheetSHA256 -eq $active.SheetSHA256) 'Active revision differs from archived source.'
    foreach ($frame in $activeManifest.Frames) {
        foreach ($root in @($doc,$web)) {
            $frameName = 'iso_hero_guerreiro_walk_{0:D2}.png' -f ([int]$frame.Index + 1)
            Assert-Review ((Get-FileHash -LiteralPath "$root/frames_individuais/$frameName").Hash -eq $frame.FrameSHA256) "Active individual frame differs: $root/$frameName"
        }
    }
}
$manifest = Get-Content -LiteralPath "$candidate/packing-manifest.json" -Raw | ConvertFrom-Json
Assert-Review ($manifest.Columns -eq 3 -and $manifest.Rows -eq 2 -and $manifest.CellSize -eq 512 -and $manifest.Frames.Count -eq 6) 'Unexpected candidate grid.'
Assert-Review (@($manifest.Frames.SourceSHA256 | Select-Object -Unique).Count -eq 6) 'Duplicate source frames.'
Assert-Review (@($manifest.Frames.FrameSHA256 | Select-Object -Unique).Count -eq 6) 'Duplicate packed frames.'
foreach ($frame in $manifest.Frames) {
    $path = Join-Path $candidate $frame.File
    Assert-Review ((Get-FileHash -LiteralPath $path).Hash -eq $frame.FrameSHA256) "Frame changed: $path"
    $bitmap = [Drawing.Bitmap]::new($path)
    try {
        Assert-Review ($bitmap.Width -eq 512 -and $bitmap.Height -eq 512) "Wrong frame size: $path"
        Assert-Review ($bitmap.GetPixel(0,0).A -eq 0 -and $bitmap.GetPixel(511,511).A -eq 0) "Opaque frame corners: $path"
    } finally { $bitmap.Dispose() }
}
$sheetPath = Join-Path $candidate $manifest.Sheet
Assert-Review ((Get-FileHash -LiteralPath $sheetPath).Hash -eq $manifest.SheetSHA256) 'Candidate sheet hash mismatch.'
$bitmap = [Drawing.Bitmap]::new($sheetPath)
try { Assert-Review ($bitmap.Width -eq 1536 -and $bitmap.Height -eq 1024) 'Candidate sheet dimensions mismatch.' }
finally { $bitmap.Dispose() }
Assert-Review ((Get-FileHash -LiteralPath "$repoRoot/client/public/assets/isometric/review/guerreiro_${Version}_sheet.png").Hash -eq $manifest.SheetSHA256) 'Web review candidate differs.'
$walkBaseline = $inventory | Where-Object File -eq 'iso_hero_guerreiro_walk_sheet.png'
Assert-Review ((Get-FileHash -LiteralPath "$repoRoot/client/public/assets/isometric/review/guerreiro_walk_baseline_sheet.png").Hash -eq $walkBaseline.WebSHA256) 'Web review baseline differs.'
Write-Output 'PASS: six unique revision frames, 3x2 grid, 512px cells, alpha corners, matching review sheet; canonical sheets match approved revision/baseline, Unity metadata and class asset preserved. ART QUALITY REQUIRES USER APPROVAL.'
