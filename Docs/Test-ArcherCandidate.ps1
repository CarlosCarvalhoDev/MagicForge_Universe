# Structural/containment checks do not replace visual acceptance of animation.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$revision=Join-Path $root 'Docs/Art/Isometric/Animations/Heroes/Arqueiro/Revisoes/basico_v1'
function Assert-Candidate([bool]$condition,[string]$message) { if(-not $condition){throw $message} }
$baseline=Get-Content -LiteralPath "$revision/baseline-hashes.json" -Raw | ConvertFrom-Json
$receiptPath="$revision/integration-approved.json"
$receipt=if(Test-Path $receiptPath){Get-Content $receiptPath -Raw | ConvertFrom-Json}else{$null}
foreach($entry in $baseline){
  $path=Join-Path $root $entry.Path
  if($receipt -and $entry.Path -eq 'MagicForgeClient/Assets/Arqueiro.asset'){
    Assert-Candidate ((Get-FileHash $path).Hash -eq $receipt.ClassAssetSHA256) 'Approved class asset changed'
    $rest=[regex]::Replace([IO.File]::ReadAllText($path),'(?ms)^  idleFrames:.*?(?=^  mainStat:)','')
    $original=[IO.File]::ReadAllText("$revision/Arqueiro.asset-original.txt")
    Assert-Candidate ($rest.Replace("`r`n","`n").TrimEnd() -eq $original.Replace("`r`n","`n").TrimEnd()) 'Class changes outside animation arrays'
  }else{Assert-Candidate ((Get-FileHash $path).Hash -eq $entry.SHA256) "Existing asset changed: $($entry.Path)"}
}
$actions=Get-Content -LiteralPath "$revision/ANIMACOES_MANIFEST.json" -Raw | ConvertFrom-Json
Assert-Candidate ($actions.Count -eq 5) 'Five basic actions required'
$total=0
foreach($action in $actions){
  $folder=Join-Path $revision $action.Action
  $manifest=Get-Content -LiteralPath "$folder/packing-manifest.json" -Raw | ConvertFrom-Json
  Assert-Candidate ($manifest.CellSize -eq 512 -and $manifest.Frames.Count -eq $action.Frames) 'Grid/count mismatch'
  Assert-Candidate (@($manifest.Frames.FrameSHA256 | Select-Object -Unique).Count -eq $action.Frames) "Repeated frame: $($action.Action)"
  $sheet=Join-Path $folder $manifest.Sheet
  Assert-Candidate ((Get-FileHash -LiteralPath $sheet).Hash -eq $action.SHA256) 'Sheet hash mismatch'
  Assert-Candidate ((Get-FileHash -LiteralPath "$root/client/public/assets/isometric/review/arqueiro_basico_v1/$($manifest.Sheet)").Hash -eq $action.SHA256) 'Web review differs'
  $image=[Drawing.Bitmap]::new($sheet)
  try {Assert-Candidate ($image.Width -eq 512*$action.Columns -and $image.Height -eq 512*$action.Rows) 'Sheet size mismatch'} finally {$image.Dispose()}
  foreach($frame in $manifest.Frames){
    $path=Join-Path $folder $frame.File
    Assert-Candidate ((Get-FileHash -LiteralPath $path).Hash -eq $frame.FrameSHA256) 'Frame hash mismatch'
    $image=[Drawing.Bitmap]::new($path)
    try {
      Assert-Candidate ($image.Width -eq 512 -and $image.Height -eq 512) 'Frame size mismatch'
      for($p=0;$p -lt 512;$p++){
        # GDI+ bicubic sampling may leave alpha1/255 rounding at empty edges.
        Assert-Candidate ($image.GetPixel($p,0).A -le 1 -and $image.GetPixel($p,511).A -le 1 -and $image.GetPixel(0,$p).A -le 1 -and $image.GetPixel(511,$p).A -le 1) "Artwork touches cell border: $($frame.File)"
      }
    } finally {$image.Dispose()}
    $total++
  }
}
Assert-Candidate ($total -eq 22) 'Expected22 frames'
if($receipt){
  $classText=Get-Content "$root/MagicForgeClient/Assets/Arqueiro.asset" -Raw
  foreach($action in $receipt.Actions){
    foreach($destination in @('client/public/assets/isometric/animations/heroes/arqueiro','MagicForgeClient/Assets/Textures/Sprites/Animations/Heroes/Arqueiro','Docs/Art/Isometric/Animations/Heroes/Arqueiro')){
      Assert-Candidate ((Get-FileHash "$root/$destination/$($action.Sheet)").Hash -eq $action.SHA256) 'Promoted sheet differs'
    }
    $meta=(Get-Content "$root/MagicForgeClient/Assets/Textures/Sprites/Animations/Heroes/Arqueiro/$($action.Sheet).meta" -Raw).Replace("`r`n","`n")
    Assert-Candidate ($meta -match "(?m)^guid: $($action.GUID)$") 'Unity GUID mismatch'
    Assert-Candidate ([regex]::Matches($meta,'(?m)^        width: 512$').Count -eq $action.FileIDs.Count) 'Unity slice widths mismatch'
    Assert-Candidate ([regex]::Matches($meta,'(?m)^        height: 512$').Count -eq $action.FileIDs.Count) 'Unity slice heights mismatch'
    foreach($id in $action.FileIDs){
      Assert-Candidate ($meta -match "(?m)^      internalID: $id$") 'Missing Unity slice ID'
      Assert-Candidate ($classText.Contains("{fileID: $id, guid: $($action.GUID), type: 3}")) 'Missing Unity frame reference'
    }
    $matches=@(Get-ChildItem "$root/MagicForgeClient/Assets" -Filter '*.meta' -Recurse | Select-String -Pattern "^guid: $($action.GUID)$")
    Assert-Candidate ($matches.Count -eq 1) 'Duplicate Unity asset GUID'
  }
}
Write-Output 'PASS: five actions,22 distinct frames,512px cells,edge alpha<=1/255,matching sheets; existing references preserved,approved animation arrays allowed. Promoted copies and Unity references checked when present. ART QUALITY NOT CERTIFIED.'
