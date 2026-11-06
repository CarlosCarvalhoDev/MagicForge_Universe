import {PixelVfxPlayer} from '../src/renderer/PixelVfxPlayer';
import type {CombatStatusStatePayload} from '@magicforge/shared';

document.body.innerHTML=`<main><h1>Áreas do Clérigo</h1><p>Prévia isolada dos indicadores reais do renderer. Dados simulados, sem conta ou banco.</p><button>Mover herói para fora do Santuário</button><p role="status"></p><canvas aria-label="Guardiões acompanha o herói; Santuário permanece no local de conjuração"></canvas><p>Dourado: Guardiões (5m) · Verde: Santuário fixo (6m)</p></main>`;
const style=document.createElement('style');style.textContent='body{margin:0;background:#111b1a;color:#eee5c9;font:15px system-ui}main{max-width:760px;margin:24px auto;padding:0 18px}h1{font:28px Georgia;color:#e5c37b}p{line-height:1.5}button{padding:12px;background:#243a32;color:#eee5c9;border:1px solid #a0844b;border-radius:5px}canvas{display:block;max-width:100%;border:1px solid #6d6644}';document.head.append(style);
const canvas=document.querySelector('canvas')!,ctx=canvas.getContext('2d')!,vfx=new PixelVfxPlayer();
const hero={id:'hero',position:{x:0,y:0,z:0},currentHp:100};
const enemy={id:'enemy',position:{x:2,y:0,z:1},currentHp:100};
let moved=false;
function status(type:CombatStatusStatePayload['type'],target='hero'):CombatStatusStatePayload{return {statusId:type,type,skillId:'clerigo_nv2_1',sourceEntityId:'hero',targetEntityId:target,durationSec:6,remainingSec:6,expiresAtTick:120,magnitude:0};}
function draw(){
  canvas.width=Math.min(720,Math.max(300,innerWidth-38));canvas.height=360;ctx.fillStyle='#17251f';ctx.fillRect(0,0,canvas.width,canvas.height);
  const camera={x:moved?4:0,y:0},zoom=18;
  ctx.strokeStyle='#ffffff09';for(let x=0;x<canvas.width;x+=18){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,360);ctx.stroke();}for(let y=0;y<360;y+=18){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
  const statuses:CombatStatusStatePayload[]=[{...status('GUARDIANS_AURA'),radius:5},{...status('SANCTUARY'),radius:6,areaCenter:{x:0,y:0,z:0}},status('SPIRITUAL_WEAPON')];
  if(!moved)statuses.push(status('SANCTUARY_WARD'),{...status('SLOW','enemy'),magnitude:.4});
  vfx.drawStatuses(ctx,statuses,[hero,enemy],camera,zoom,performance.now());
  for(const [entity,label,color] of [[hero,'Clérigo','#f2d492'],[enemy,'Alvo','#c98e83']] as const){const x=canvas.width/2+(entity.position.x-camera.x)*zoom,y=180+entity.position.z*zoom;ctx.fillStyle=color;ctx.fillRect(x-6,y-6,12,12);ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText(label,x,y+25);}
  document.querySelector('[role=status]')!.textContent=moved?'Fora do círculo fixo: sem proteção do Santuário. A aura acompanha o herói.':'Dentro do Santuário: proteção ativa. Alvo dentro da aura: lentidão.';
}
document.querySelector('button')!.onclick=()=>{moved=!moved;hero.position.x=moved?8:0;document.querySelector('button')!.textContent=moved?'Voltar para o Santuário':'Mover herói para fora do Santuário';draw();};
addEventListener('resize',draw);draw();
vfx.ready.catch(error=>{document.querySelector('[role=status]')!.textContent=String(error);});
