# One-time promotion of the visually approved V1. Refuses existing output files.
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$revision=Join-Path $PSScriptRoot 'Art/Isometric/Animations/Heroes/Arqueiro/Revisoes/basico_v1'
$actions=Get-Content "$revision/ANIMACOES_MANIFEST.json" -Raw | ConvertFrom-Json
$destinations=@(
  "$root/client/public/assets/isometric/animations/heroes/arqueiro",
  "$root/MagicForgeClient/Assets/Textures/Sprites/Animations/Heroes/Arqueiro",
  "$PSScriptRoot/Art/Isometric/Animations/Heroes/Arqueiro"
)
$assetPath="$root/MagicForgeClient/Assets/Arqueiro.asset"
$original=[IO.File]::ReadAllText($assetPath)
$baseline=Get-Content "$revision/baseline-hashes.json" -Raw | ConvertFrom-Json
foreach($entry in $baseline){
  if((Get-FileHash (Join-Path $root $entry.Path)).Hash -ne $entry.SHA256){throw "Baseline changed: $($entry.Path)"}
}
foreach($destination in $destinations){
  foreach($action in $actions){
    foreach($suffix in @('', '.meta')){
      if(Test-Path "$destination/$($action.Sheet)$suffix"){throw "Output exists: $destination/$($action.Sheet)$suffix"}
    }
  }
  if(Test-Path "$destination/ANIMACOES_MANIFEST.json"){throw "Manifest exists: $destination"}
}
$receiptPath="$revision/integration-approved.json"
if(Test-Path $receiptPath){throw 'Already integrated'}
if($original -match '(?m)^  (idle|walk|attack|hit|death)Frames:'){throw 'Class already has frame references'}
# Same grids and import settings as the existing Warrior actions; assign NEW identities.
$prepared=@()
$references=''
foreach($action in $actions){
  $template="$root/MagicForgeClient/Assets/Textures/Sprites/Animations/Heroes/Guerreiro/iso_hero_guerreiro_$($action.Action)_sheet.png.meta"
  $meta=[IO.File]::ReadAllText($template).Replace('guerreiro','arqueiro')
  $meta=[regex]::Replace($meta,'(?m)^(guid:|\s+spriteID:) [0-9a-f]{32}',{
    param($match) $match.Groups[1].Value+' '+[guid]::NewGuid().ToString('N')
  })
  $guid=[regex]::Match($meta,'(?m)^guid: ([0-9a-f]{32})').Groups[1].Value
  $ids=@([regex]::Matches($meta,'(?m)^      internalID: (\d+)') | ForEach-Object {$_.Groups[1].Value})
  if($ids.Count -ne $action.Frames){throw "Wrong template slice count: $($action.Action)"}
  $references+="  $($action.Action)Frames:`r`n"
  foreach($id in $ids){$references+="  - {fileID: $id, guid: $guid, type: 3}`r`n"}
  $prepared+=@{Action=$action;Meta=$meta;GUID=$guid;IDs=$ids}
}
foreach($destination in $destinations){[IO.Directory]::CreateDirectory($destination) | Out-Null}
foreach($item in $prepared){
  $action=$item.Action
  $source="$revision/$($action.Action)/$($action.Sheet)"
  if((Get-FileHash $source).Hash -ne $action.SHA256){throw 'Source hash changed'}
  foreach($destination in $destinations){[IO.File]::Copy($source,"$destination/$($action.Sheet)",$false)}
  [IO.File]::WriteAllText("$($destinations[1])/$($action.Sheet).meta",$item.Meta)
}
foreach($destination in $destinations){[IO.File]::Copy("$revision/ANIMACOES_MANIFEST.json","$destination/ANIMACOES_MANIFEST.json",$false)}
$updated=$original.Replace('  mainStat:', $references+'  mainStat:')
[IO.File]::WriteAllText($assetPath,$updated)
@{
  Version='basico_v1';Approval='User: esta bom';Date='2026-10-28'
  ClassAssetSHA256=(Get-FileHash $assetPath).Hash
  Actions=@($prepared | ForEach-Object {@{Action=$_.Action.Action;Sheet=$_.Action.Sheet;SHA256=$_.Action.SHA256;GUID=$_.GUID;FileIDs=$_.IDs}})
} | ConvertTo-Json -Depth 8 | Set-Content $receiptPath -Encoding utf8
Write-Output 'Promoted five approved sheets to Web/Unity/Docs and linked 22 Unity frames; existing metadata preserved.'
