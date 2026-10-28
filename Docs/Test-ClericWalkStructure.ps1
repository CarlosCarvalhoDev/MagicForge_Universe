# Structural verification only. Passing does not approve animation/art quality.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$repoRoot = Split-Path $PSScriptRoot -Parent
function Assert-Walk([bool]$Condition,[string]$Message) { if (-not $Condition) { throw $Message } }
function Read-Repo([string]$Path) { [IO.File]::ReadAllText((Join-Path $repoRoot $Path)) }
$docRoot = 'Docs/Art/Isometric/Animations/Heroes/Clerigo'
$unityRoot = 'MagicForgeClient/Assets/Textures/Sprites/Animations/Heroes/Clerigo'
$webRoot = 'client/public/assets/isometric/animations/heroes/clerigo'
$name = 'iso_hero_clerigo_walk_sheet.png'
$activeHash = (Get-FileHash -LiteralPath (Join-Path $repoRoot "$docRoot/$name")).Hash
$version = $null
foreach ($candidate in @('walk_v2','walk_v3','walk_v4','walk_v4_1')) {
    $manifestPath = Join-Path $repoRoot "$docRoot/Revisoes/$candidate/packing-manifest.json"
    if (Test-Path -LiteralPath $manifestPath) {
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
        $candidateSheetPath = Join-Path (Split-Path $manifestPath -Parent) $manifest.Sheet
        Assert-Walk ((Get-FileHash -LiteralPath $candidateSheetPath).Hash -eq $manifest.SheetSHA256) "Sheet changed: $candidate"
        $candidateBitmap = [Drawing.Bitmap]::new($candidateSheetPath)
        try { Assert-Walk ($candidateBitmap.Width -eq 2048 -and $candidateBitmap.Height -eq 1024) "Wrong sheet dimensions: $candidate" }
        finally { $candidateBitmap.Dispose() }
        Assert-Walk ($manifest.Frames.Count -eq 8) "Expected eight frames in $candidate"
        Assert-Walk (@($manifest.Frames.SourceSHA256 | Select-Object -Unique).Count -eq 8) "Duplicate source frames in $candidate"
        Assert-Walk (@($manifest.Frames.FrameSHA256 | Select-Object -Unique).Count -eq 8) "Duplicate packed frames in $candidate"
        foreach ($frame in $manifest.Frames) {
            $framePath = Join-Path $repoRoot "$docRoot/Revisoes/$candidate/$($frame.File)"
            Assert-Walk ((Get-FileHash -LiteralPath $framePath).Hash -eq $frame.FrameSHA256) "Frame changed: $framePath"
            $bitmap = [Drawing.Bitmap]::new($framePath)
            try {
                Assert-Walk ($bitmap.Width -eq 512 -and $bitmap.Height -eq 512) "Wrong frame size: $framePath"
                Assert-Walk ($bitmap.GetPixel(0,0).A -eq 0 -and $bitmap.GetPixel(511,511).A -eq 0) "Opaque frame corners: $framePath"
            } finally { $bitmap.Dispose() }
        }
        if ($manifest.SheetSHA256 -eq $activeHash) { $version = $candidate; $activeManifest = $manifest }
    }
}
Assert-Walk ($null -ne $version) 'Active sheet does not match a packed revision.'
foreach ($root in @($docRoot,$unityRoot,$webRoot)) {
    $path = Join-Path $repoRoot "$root/$name"
    Assert-Walk ((Get-FileHash -LiteralPath $path).Hash -eq $activeHash) "Active sheet copy differs: $root"
    $bitmap = [Drawing.Bitmap]::new($path)
    try { Assert-Walk ($bitmap.Width -eq 2048 -and $bitmap.Height -eq 1024) "Wrong active sheet dimensions: $root" }
    finally { $bitmap.Dispose() }
    foreach ($frame in $activeManifest.Frames) {
        $path = Join-Path $repoRoot "$root/frames_individuais/$($frame.File)"
        Assert-Walk ((Get-FileHash -LiteralPath $path).Hash -eq $frame.FrameSHA256) "Individual frame copy differs: $path"
    }
}
$meta = Read-Repo "$unityRoot/$name.meta"
$oldMeta = Read-Repo "$docRoot/Revisoes/walk_v1/unity-meta-original.txt"
$guid = ([regex]::Match($meta,'(?m)^guid: (\w+)')).Groups[1].Value
Assert-Walk ($guid -eq ([regex]::Match($oldMeta,'(?m)^guid: (\w+)')).Groups[1].Value) 'Texture GUID changed.'
$slicePattern = '(?ms)^    - serializedVersion: 2\r?\n      name: iso_hero_clerigo_walk_sheet_\d+\r?\n.*?(?=^    - serializedVersion: 2|^    outline: \[\])'
$slices = [regex]::Matches($meta,$slicePattern)
$oldSlices = [regex]::Matches($oldMeta,$slicePattern)
Assert-Walk ($slices.Count -eq 8 -and $oldSlices.Count -eq 6) 'Unexpected Unity slice counts.'
$spriteIds = @()
for ($i=0; $i -lt 8; $i++) {
    $slice = $slices[$i].Value
    $expectedY = if ($i -lt 4) { 512 } else { 0 }
    Assert-Walk ($slice -match ('(?m)^        x: '+(($i%4)*512)+'\r?$')) "Wrong X at frame $i"
    Assert-Walk ($slice -match ('(?m)^        y: '+$expectedY+'\r?$')) "Wrong Y at frame $i"
    Assert-Walk ($slice -match ('(?m)^      internalID: '+(21300000+$i*2)+'\r?$')) "Wrong fileID at frame $i"
    $spriteId = ([regex]::Match($slice,'(?m)^      spriteID: (\w+)')).Groups[1].Value
    $spriteIds += $spriteId
    if ($i -lt 6) {
        Assert-Walk ($spriteId -eq ([regex]::Match($oldSlices[$i].Value,'(?m)^      spriteID: (\w+)')).Groups[1].Value) "Existing spriteID changed at frame $i"
    }
}
Assert-Walk (@($spriteIds | Select-Object -Unique).Count -eq 8) 'Duplicate slice spriteIDs.'
$asset = Read-Repo 'MagicForgeClient/Assets/Clerigo.asset'
$walkBlockPattern = '(?ms)^  walkFrames:.*?(?=^  attackFrames:)'
$block = [regex]::Match($asset,$walkBlockPattern).Value
$refs = [regex]::Matches($block,'fileID: (\d+), guid: (\w+)')
Assert-Walk ($refs.Count -eq 8 -and $block -match 'walkFps: 12') 'Wrong walk references or FPS.'
for ($i=0; $i -lt 8; $i++) {
    Assert-Walk ($refs[$i].Groups[1].Value -eq (21300000+$i*2).ToString() -and $refs[$i].Groups[2].Value -eq $guid) "Wrong asset reference at frame $i"
}
$oldAsset = Read-Repo "$docRoot/Revisoes/walk_v1/Clerigo-asset-original.txt"
Assert-Walk ([regex]::Replace($asset,$walkBlockPattern,'') -eq [regex]::Replace($oldAsset,$walkBlockPattern,'')) 'Unrelated Clerigo.asset fields changed.'
$baseline = Read-Repo "$docRoot/Revisoes/walk_v1/individual-frame-baseline.json" | ConvertFrom-Json
foreach ($frame in $baseline) {
    $frameMeta = Read-Repo "$unityRoot/frames_individuais/$($frame.Name).meta"
    Assert-Walk (([regex]::Match($frameMeta,'(?m)^guid: (\w+)')).Groups[1].Value -eq $frame.UnityGUID) "Individual frame GUID changed: $($frame.Name)"
}
Write-Output "PASS: 8 frames, 4x2 grid, 512px cells, 3 identical destinations, preserved GUID/fileIDs. Active experimental revision: $version. ART QUALITY NOT CERTIFIED."
