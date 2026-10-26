param(
    [Parameter(Mandatory=$true)]
    [string]$SourceFolder
)

Add-Type -AssemblyName System.Drawing

$repoRoot = "e:\MagicForge_Universe"
$unityBase = "$repoRoot\MagicForgeClient\Assets\Textures\Sprites\Animations"
$webBase   = "$repoRoot\client\public\assets\isometric\animations"
$docsBase  = "$repoRoot\Docs\Art\Isometric\Animations"

$heroMap = @{
    "guerreiro" = @{ pascal = "Guerreiro"; lower = "guerreiro" }
    "clerigo"   = @{ pascal = "Clerigo";   lower = "clerigo" }
    "barbaro"   = @{ pascal = "Barbaro";   lower = "barbaro" }
    "monge"     = @{ pascal = "Monge";     lower = "monge" }
    "bruxo"     = @{ pascal = "Bruxo";     lower = "bruxo" }
    "mago"      = @{ pascal = "Mago";      lower = "mago" }
    "arqueiro"  = @{ pascal = "Arqueiro";  lower = "arqueiro" }
}

$mobMap = @{
    "goblin_lanceiro" = @{ pascal = "GoblinLanceiro"; lower = "goblin_lanceiro" }
    "goblin_arqueiro" = @{ pascal = "GoblinArqueiro"; lower = "goblin_arqueiro" }
    "slime_floresta"  = @{ pascal = "SlimeFloresta";  lower = "slime_floresta" }
    "lobo_selvagem"   = @{ pascal = "LoboSelvagem";   lower = "lobo_selvagem" }
}

$bossMap = @{
    "chefe_goblin" = @{ pascal = "ChefeGoblin"; lower = "chefe_goblin" }
    "malakor"      = @{ pascal = "Malakor";     lower = "malakor" }
}

function Get-GridSpec([string]$fileName, [int]$width, [int]$height) {
    $lower = $fileName.ToLower()
    $cols = 2
    $rows = 2

    if ($lower -match "_hit_sheet") {
        $cols = 2; $rows = 1
    } elseif ($lower -match "iso_hero_.*_(walk|attack|cast)_sheet") {
        $cols = 3; $rows = 2
    } elseif ($lower -match "iso_boss_.*_(attack|cast|death)_sheet") {
        $cols = 3; $rows = 2
    } elseif ($lower -match "_(idle|walk|attack|death)_sheet") {
        $cols = 2; $rows = 2
    } else {
        # Fallback by aspect ratio
        $ratio = [double]$width / [double]$height
        if ([Math]::Abs($ratio - 2.0) -lt 0.15) { $cols = 2; $rows = 1 }
        elseif ([Math]::Abs($ratio - 1.5) -lt 0.15) { $cols = 3; $rows = 2 }
        else { $cols = 2; $rows = 2 }
    }

    return @{ Cols = $cols; Rows = $rows; TotalFrames = ($cols * $rows) }
}

function New-UnityMultiSpriteMeta([string]$baseName, [int]$width, [int]$height, [int]$cols, [int]$rows, [string]$existingGuid) {
    $guid = if ($existingGuid) { $existingGuid } else { [Guid]::NewGuid().ToString("N") }
    $cellW = [Math]::Floor($width / $cols)
    $cellH = [Math]::Floor($height / $rows)

    $spritesYaml = ""
    $nameTableYaml = ""
    $frameIdx = 0

    # Reading order: left -> right, top row -> bottom row
    # Note: In Unity Texture space, Y=0 is at the bottom row, so top row has Y = ($rows - 1 - $r) * $cellH
    for ($r = 0; $r -lt $rows; $r++) {
        for ($c = 0; $c -lt $cols; $c++) {
            $x = $c * $cellW
            $y = ($rows - 1 - $r) * $cellH
            $sliceName = "${baseName}_${frameIdx}"
            $internalId = 21300000 + ($frameIdx * 2)
            $spriteGuid = [Guid]::NewGuid().ToString("N")

            $nameTableYaml += @"
  - first:
      213: $internalId
    second: $sliceName

"@

            $spritesYaml += @"
    - serializedVersion: 2
      name: $sliceName
      rect:
        serializedVersion: 2
        x: $x
        y: $y
        width: $cellW
        height: $cellH
      alignment: 9
      pivot: {x: 0.5, y: 0.15}
      border: {x: 0, y: 0, z: 0, w: 0}
      outline: []
      physicsShape: []
      tessellationDetail: 0
      bones: []
      spriteID: $spriteGuid
      internalID: $internalId
      vertices: []
      indices: 
      edges: []
      weights: []
      secondaryTextures: []

"@
            $frameIdx++
        }
    }

    return @"
fileFormatVersion: 2
guid: $guid
TextureImporter:
  internalIDToNameTable:
$nameTableYaml  externalObjects: {}
  serializedVersion: 11
  mipmaps:
    mipMapMode: 0
    enableMipMap: 0
    sRGBTexture: 1
    linearTexture: 0
    fadeOut: 0
    borderMipMap: 0
    mipMapsPreserveCoverage: 0
    alphaTestReferenceValue: 0.5
    mipMapFadeDistanceStart: 1
    mipMapFadeDistanceEnd: 3
  bumpmap:
    convertToNormalMap: 0
    externalNormalMap: 0
    heightScale: 0.25
    normalMapFilter: 0
  isReadable: 1
  streamingMipmaps: 0
  streamingMipmapsPriority: 0
  grayScaleToAlpha: 0
  generateCubemap: 6
  cubemapConvolution: 0
  seamlessCubemap: 0
  textureFormat: 1
  maxTextureSize: 2048
  textureSettings:
    serializedVersion: 2
    filterMode: 1
    aniso: 1
    mipBias: 0
    wrapU: 1
    wrapV: 1
    wrapW: 1
  nPOTScale: 0
  lightmap: 0
  compressionQuality: 50
  spriteMode: 2
  spriteExtrude: 1
  spriteMeshType: 1
  alignment: 9
  spritePivot: {x: 0.5, y: 0.15}
  spritePixelsToUnits: 100
  spriteBorder: {x: 0, y: 0, z: 0, w: 0}
  spriteGenerateFallbackPhysicsShape: 1
  alphaUsage: 1
  alphaIsTransparency: 1
  spriteTessellationDetail: -1
  textureType: 8
  textureShape: 1
  singleChannelComponent: 0
  maxTextureSizeSet: 0
  compressionQualitySet: 0
  textureFormatSet: 0
  applyGammaDecoding: 0
  platformSettings:
  - serializedVersion: 3
    buildTarget: DefaultTexturePlatform
    maxTextureSize: 2048
    resizeAlgorithm: 0
    textureFormat: -1
    textureCompression: 0
    compressionQuality: 50
    crunchedCompression: 0
    allowsAlphaSplitting: 0
    overridden: 0
    androidETC2FallbackOverride: 0
    forceMaximumCompressionQuality_BC6H_BC7: 0
  spriteSheet:
    serializedVersion: 2
    sprites:
$spritesYaml    outline: []
    physicsShape: []
    bones: []
    spriteID: 5e97eb03825dee720800000000000000
    internalID: 0
    vertices: []
    indices: 
    edges: []
    weights: []
    secondaryTextures: []
  spritePackingTag: 
  pSDRemoveMatte: 0
  pSDShowRemoveMatteOption: 0
  userData: 
  assetBundleName: 
  assetBundleVariant: 
"@
}

$files = Get-ChildItem -Path $SourceFolder -Recurse -Include *.png, *.jpg | Where-Object { $_.Name -match "_sheet\." -or $_.Name -match "^vfx_" }

if ($files.Count -eq 0) {
    Write-Warning "Nenhuma sprite sheet (*_sheet.png/jpg ou vfx_*) encontrada em: $SourceFolder"
    exit 0
}

foreach ($f in $files) {
    $name = $f.Name
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($name)
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    $w = $img.Width
    $h = $img.Height
    $img.Dispose()

    $grid = Get-GridSpec -fileName $name -width $w -height $h
    $cols = $grid.Cols
    $rows = $grid.Rows

    $dstUnity = "$unityBase\VFX\$name"
    $dstWeb   = "$webBase\vfx\$name"
    $dstDocs  = "$docsBase\VFX\$name"

    foreach ($k in $heroMap.Keys) {
        if ($name.ToLower() -match "iso_hero_${k}_") {
            $p = $heroMap[$k].pascal
            $l = $heroMap[$k].lower
            $dstUnity = "$unityBase\Heroes\$p\$name"
            $dstWeb   = "$webBase\heroes\$l\$name"
            $dstDocs  = "$docsBase\Heroes\$p\$name"
            break
        }
    }

    foreach ($k in $mobMap.Keys) {
        if ($name.ToLower() -match "iso_mob_${k}_") {
            $p = $mobMap[$k].pascal
            $l = $mobMap[$k].lower
            $dstUnity = "$unityBase\Monsters\$p\$name"
            $dstWeb   = "$webBase\monsters\$l\$name"
            $dstDocs  = "$docsBase\Monsters\$p\$name"
            break
        }
    }

    foreach ($k in $bossMap.Keys) {
        if ($name.ToLower() -match "iso_boss_${k}_") {
            $p = $bossMap[$k].pascal
            $l = $bossMap[$k].lower
            $dstUnity = "$unityBase\Bosses\$p\$name"
            $dstWeb   = "$webBase\bosses\$l\$name"
            $dstDocs  = "$docsBase\Bosses\$p\$name"
            break
        }
    }

    Copy-Item -Path $f.FullName -Destination $dstUnity -Force
    Copy-Item -Path $f.FullName -Destination $dstWeb -Force
    Copy-Item -Path $f.FullName -Destination $dstDocs -Force

    # Preserve existing GUID if .meta already exists in Unity
    $metaPath = "${dstUnity}.meta"
    $existingGuid = $null
    if (Test-Path $metaPath) {
        $guidMatch = Select-String -Path $metaPath -Pattern "^guid:\s*([0-9a-fA-F]{32})" | Select-Object -First 1
        if ($guidMatch) { $existingGuid = $guidMatch.Matches[0].Groups[1].Value }
    }

    $metaContent = New-UnityMultiSpriteMeta -baseName $baseName -width $w -height $h -cols $cols -rows $rows -existingGuid $existingGuid
    Set-Content -Path $metaPath -Value $metaContent -Encoding UTF8

    Write-Output "[OK] $name (${w}x${h} px | Grade ${cols}x${rows} = $($grid.TotalFrames) frames) -> $dstUnity"
}
