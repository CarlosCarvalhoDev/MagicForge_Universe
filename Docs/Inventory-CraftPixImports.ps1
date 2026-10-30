# Read ZIP metadata/images only. Does not execute or import vendor files.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing
$folder=Join-Path (Split-Path $PSScriptRoot -Parent) 'Imports/CraftPix'
$catalog=@(
  @{File='swordsman-1-3.zip';Slug='free-swordsman-1-3-level-pixel-top-down-sprite-character-pack';Category='hero';DownloadId=87606},
  @{File='rocks-stones.zip';Slug='free-rocks-and-stones-top-down-pixel-art';Category='props';DownloadId=48282},
  @{File='slime-mobs.zip';Slug='free-slime-mobs-pixel-art-top-down-sprite-pack';Category='monster';DownloadId=74911},
  @{File='trees.zip';Slug='free-top-down-trees-pixel-art';Category='props';DownloadId=48287},
  @{File='paths-roads.zip';Slug='free-path-and-road-top-down-pixel-tileset';Category='tiles';DownloadId=107599},
  @{File='orc.zip';Slug='free-top-down-orc-game-character-pixel-art';Category='monster';DownloadId=70521},
  @{File='dungeon.zip';Slug='free-2d-top-down-pixel-dungeon-asset-pack';Category='tiles';DownloadId=80859},
  @{File='crystals.zip';Slug='top-down-crystals-pixel-art';Category='props';DownloadId=48838},
  @{File='basic-ui.zip';Slug='free-basic-pixel-art-ui-for-rpg';Category='ui';DownloadId=91858},
  @{File='pixel-magic-effects.zip';Slug='free-pixel-magic-sprite-effects-pack';Category='vfx';DownloadId=47125}
)
$result=@()
foreach($pack in $catalog){
  $path=Join-Path $folder $pack.File
  if(-not (Test-Path -LiteralPath $path)){continue}
  $zip=[IO.Compression.ZipFile]::OpenRead($path)
  try{
    $pngs=@(); $files=@(); $uncompressed=0L
    foreach($entry in $zip.Entries){
      if(-not $entry.Name -or $entry.FullName -match '(^|/)(__MACOSX|\.DS_Store|\._)'){continue}
      # Reject absolute/traversal paths before any future extraction.
      if($entry.FullName -match '(^[/\\]|^[A-Za-z]:|(^|[/\\])\.\.([/\\]|$))'){throw "Unsafe archive path: $($pack.File)"}
      $files+=$entry.FullName
      $uncompressed+=$entry.Length
      if($entry.Name -match '\.png$'){
        $stream=$entry.Open()
        try{
          $image=[Drawing.Image]::FromStream($stream)
          try{$pngs+=@{Path=$entry.FullName;Width=$image.Width;Height=$image.Height}}finally{$image.Dispose()}
        }finally{$stream.Dispose()}
      }
    }
    $result+=@{
      File=$pack.File;Source="https://craftpix.net/freebies/$($pack.Slug)/";Category=$pack.Category
      SHA256=(Get-FileHash -LiteralPath $path).Hash;Bytes=(Get-Item -LiteralPath $path).Length
      DownloadDate='2026-10-28';License='https://craftpix.net/file-licenses/';LicenseSection='Freebie Products'
      UncompressedBytes=$uncompressed;Files=$files;PNGCount=$pngs.Count;Images=$pngs
      Status='Acquired; not integrated';DownloadId=$pack.DownloadId
    }
  }finally{$zip.Dispose()}
}
$result | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath (Join-Path $folder 'inventory.json') -Encoding utf8
$result | Select-Object File,Bytes,PNGCount,Category | Format-Table -AutoSize
Write-Output "Validated $($result.Count) ZIPs, readable PNG dimensions and safe archive paths. No gameplay changes."
