import {PixelVfxPlayer} from '../src/renderer/PixelVfxPlayer';
import {isInMageCone,createVector3} from '@magicforge/shared';
document.body.innerHTML=`<main><h1>Orbe de Chamas</h1><p>Prévia isolada: renderer e geometria reais, com alvos simulados. Sem conta ou banco.</p><button>Virar cone para cima</button><p role="status"></p><canvas aria-label="Cone frontal de 6m e 60 graus"></canvas></main>`;
const style=document.createElement('style');style.textContent='body{margin:0;background:#111b1a;color:#eee5c9;font:15px system-ui}main{max-width:760px;margin:24px auto;padding:0 18px}h1{font:28px Georgia;color:#e5c37b}p{line-height:1.5}button{padding:12px;background:#243a32;color:#eee5c9;border:1px solid #a0844b;border-radius:5px}canvas{display:block;max-width:100%;border:1px solid #6d6644}';document.head.append(style);
const canvas=document.querySelector('canvas')!,ctx=canvas.getContext('2d')!,vfx=new PixelVfxPlayer();
const hero={id:'hero',position:createVector3(),headingYaw:90,currentHp:100};
const targets=[createVector3(4,0,0),createVector3(3,0,3),createVector3(0,0,-4),createVector3(-3,0,0)];
let yaw=90;
function draw(){
  canvas.width=Math.min(720,Math.max(300,innerWidth-38));canvas.height=360;ctx.fillStyle='#17251f';ctx.fillRect(0,0,canvas.width,360);
  const zoom=20,now=1000;vfx.queue.clear();vfx.queue.spawn({kind:'cone',position:hero.position,yaw,coneRange:6,coneAngleDeg:60},now);vfx.draw(ctx,[hero],{x:0,y:0},zoom,now);
  ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillStyle='#f2d492';ctx.fillRect(canvas.width/2-5,175,10,10);ctx.fillText('Mago',canvas.width/2,205);
  for(const point of targets){const hit=isInMageCone(hero.position,point,yaw);const x=canvas.width/2+point.x*zoom,y=180+point.z*zoom;ctx.fillStyle=hit?'#ffb56d':'#92aaa0';ctx.fillRect(x-5,y-5,10,10);ctx.fillText(hit?'Atingido':'Fora do cone',x,y+20);}
  document.querySelector('[role=status]')!.textContent=`Alcance: 6m · Abertura: 60° · Direção: ${yaw===90?'direita':'cima'}`;
}
document.querySelector('button')!.onclick=()=>{yaw=yaw===90?180:90;document.querySelector('button')!.textContent=yaw===90?'Virar cone para cima':'Virar cone para direita';draw();};addEventListener('resize',draw);draw();vfx.ready.catch(error=>{document.querySelector('[role=status]')!.textContent=String(error);});
