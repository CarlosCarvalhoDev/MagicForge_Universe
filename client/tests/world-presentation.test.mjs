import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { WorldPresentation, worldAppearance } from '../src/renderer/WorldPresentation.ts';

test('server world selects frost while unknown worlds are explicitly unfinished',()=>{
  assert.equal(worldAppearance(1).theme,'forest');
  assert.equal(worldAppearance(2).theme,'frost');
  assert.equal(worldAppearance(2).placeholder,false);
  assert.equal(worldAppearance(3).placeholder,true);
});
test('portal needs authoritative open flag and finite position, including world origin',()=>{
  const p=new WorldPresentation(), position={x:0,y:0,z:0};
  p.setStage({world:1,portalOpen:true,portalPosition:position});
  position.x=100; assert.deepEqual(p.portal,{x:0,y:0,z:0});
  p.setStage({world:2,portalOpen:false,portalPosition:position});
  assert.equal(p.world,2); assert.equal(p.portal,null);
  p.setStage({world:2,portalOpen:true}); assert.equal(p.portal,null);
  p.setStage({world:2,portalOpen:true,portalPosition:{x:NaN,y:0,z:0}}); assert.equal(p.portal,null);
});
test('invalid world updates cannot replace the current visual state; switching clears previous portal',()=>{
  const p=new WorldPresentation();p.setStage({world:2,portalOpen:true,portalPosition:{x:0,y:0,z:8}});
  for(const world of [0,-1,NaN,Infinity,1.5])p.setStage({world});
  assert.equal(p.world,2); assert.equal(p.portal.z,8);
  p.setStage({world:1}); assert.equal(p.portal,null); assert.equal(p.appearance.theme,'forest');
});
test('four winter PNGs retain native dimensions and recorded archive hashes',()=>{
  const base=new URL('../public/assets/pixel/craftpix/',import.meta.url);
  const manifest=JSON.parse(readFileSync(new URL('winter/provenance.json',base),'utf8').replace(/^\uFEFF/,''));
  assert.equal(manifest.length,4);
  for(const entry of manifest){
    const bytes=readFileSync(new URL(entry.Output,base));
    assert.equal(createHash('sha256').update(bytes).digest('hex').toUpperCase(),entry.SHA256);
    assert.ok(bytes.readUInt32BE(16)>0 && bytes.readUInt32BE(20)>0);
    assert.ok(entry.Archive==='trees.zip'||entry.Archive==='rocks-stones.zip');
  }
});
