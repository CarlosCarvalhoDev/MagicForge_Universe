// Disposable, loopback-only QA fixture. Never opens the project's persistent SQLite.
import http from 'node:http';
import { DatabaseManager } from '../../server/src/database/DatabaseManager';
import { World } from '../../server/src/game/World';
import { ServerNetwork } from '../../server/src/network/ServerNetwork';
import { GameLoop } from '../../server/src/game/GameLoop';
import { Monster } from '../../server/src/entities/Monster';
import { Opcode, createVector3 } from '@magicforge/shared';

const db = new DatabaseManager(':memory:'), world = new World(db);
const packets: { op: number; data: unknown }[] = [];
const register = world.registerConnection.bind(world);
world.registerConnection = connection => {
  const send = connection.send.bind(connection);
  connection.send = (op, data) => { if ([0x02,0x24,0x31,0x34,0x36,0x38,0x3D,0x3E,0x42,0x50,0x51].includes(op)) { packets.push({ op, data: structuredClone(data) }); if (packets.length > 600) packets.shift(); } send(op, data); };
  register(connection);
};
const loop = new GameLoop(delta => world.update(delta));
function clearMonsters() { for (const m of world.entityManager.getAllMonsters()) { world.entityManager.removeMonster(m.id); world.spatialGrid.removeEntity(m.id); world.broadcast(Opcode.S2C_ENTITY_DESPAWN,{entityId:m.id,reason:'QA_SETUP'}); } }
clearMonsters();
const server = http.createServer(async (request, response) => {
  response.setHeader('Content-Type','application/json');
  if (request.url === '/health') { response.end(JSON.stringify({testFixture:true,database:'memory',players:world.entityManager.getAllPlayers().length})); return; }
  if (request.headers['x-magicforge-qa'] !== '1') { response.writeHead(403); response.end('{}'); return; }
  const p = world.entityManager.getAllPlayers()[0];
  if (request.url === '/qa/state') {
    response.end(JSON.stringify({testFixture:true,player:p?{id:p.id,level:p.level,hp:p.currentHp,resource:p.currentResource,gold:p.gold,position:p.position,skills:p.equippedSkills,stage:p.currentStage,world:p.currentWorld,inventory:db.getInventory(p.dbCharacterId),statuses:[...p.activeStatuses.values()]}:null,monsters:world.entityManager.getAllMonsters().map(m=>({id:m.id,name:m.name,hp:m.currentHp,position:m.position})),stage:world.currentStage,bossActive:world.isBossActive,bossAvailable:world.isBossAvailable,portalOpen:world.isPortalOpen,packets})); return;
  }
  if (request.method !== 'POST') { response.writeHead(405); response.end('{}'); return; }
  let body=''; for await (const chunk of request) { body+=chunk; if(body.length>2048){response.writeHead(413);response.end('{}');return;} }
  try {
    const options=body?JSON.parse(body):{};
    if(request.url==='/qa/shutdown'){response.end('{"stopped":true}');setTimeout(stop,100);return;}
    if(!p) throw new Error('Enter a fixture hero through the actual client first');
    if(request.url==='/qa/prepare'){
      clearMonsters(); p.clearAllStatuses(); p.isDead=false; p.level=[1,10,25,50].includes(options.level)?options.level:p.level;
      p.currentHp=options.hurt?Math.max(1,p.maxHp-120):p.maxHp; p.currentResource=p.maxResource;
      p.position=createVector3(0,0,0);p.targetDestination=null;p.moveDirection=null;p.targetId=null;p.skillCooldowns.clear();
      world.currentStage=options.stage===10?10:1; p.currentStage=world.currentStage;world.currentWorld=1;p.currentWorld=1;world.stageKills=0;world.isBossActive=false;world.activeBossId=null;world.isBossAvailable=options.stage===10;world.isPortalOpen=false;
      if(!options.empty){ const monster=new Monster('qa-dummy','Slime QA',createVector3(1.8,0,0),options.killable?1:50000,0);monster.speed=0;monster.respawnDelaySec=3600;monster.lootTable=[{itemId:'gold',dropChance:1,minQty:10,maxQty:10},{itemId:'potion_hp_minor',dropChance:1,minQty:1,maxQty:1}];world.entityManager.addMonster(monster);world.spatialGrid.updateEntity(monster);world.broadcast(Opcode.S2C_ENTITY_SPAWN,{entity:monster.toSnapshotState()}); }
      world.broadcast(Opcode.S2C_PLAYER_LEVEL_UP,{playerId:p.id,newLevel:p.level,newAttributes:p.attributes,newMaxHp:p.maxHp,newMaxResource:p.maxResource,totalCombatPower:p.CombatPower});
      world.broadcast(Opcode.S2C_STAGE_UPDATE,{world:1,stage:world.currentStage,worldName:world.getWorldName(1),stageKills:0,killsRequired:world.currentStage===10?1:10,isBossStage:world.currentStage===10,bossAvailable:world.isBossAvailable,portalOpen:false});
      world.saveAllPlayers(); packets.length=0;
    } else if(request.url==='/qa/boss-outcome'){
      const boss=world.activeBossId?world.entityManager.getMonster(world.activeBossId):undefined;if(!boss)throw new Error('No boss spawned by client challenge');
      boss.position=createVector3(p.position.x+1.5,0,p.position.z);boss.speed=0;world.spatialGrid.updateEntity(boss);
      if(options.defeat){p.currentHp=1;boss.attackCooldown=0;boss.attackDamage=10000;boss.targetPlayer=p;}else{boss.currentHp=1;boss.attackDamage=0;p.currentHp=p.maxHp;p.currentResource=p.maxResource;p.skillCooldowns.clear();}
      packets.length=0;
    } else if(request.url==='/qa/portal-position'){p.position=createVector3(world.portalPosition.x,0,world.portalPosition.z);p.moveDirection=null;p.targetDestination=null;}
    else throw new Error('Unknown QA endpoint');
    response.end('{"prepared":true,"database":"memory"}');
  }catch(error){response.writeHead(400);response.end(JSON.stringify({error:String(error)}));}
});
const network=new ServerNetwork(server,world);
let stopping=false;
function stop(){if(stopping)return;stopping=true;loop.stop();network.close();server.close(()=>{db.close();process.exit(0);});setTimeout(()=>{db.close();process.exit(0);},1500).unref();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);setTimeout(stop,1200000).unref();
server.listen(0,'127.0.0.1',()=>{const address=server.address();if(address&&typeof address!=='string'){console.log('WARRIOR_QA_PORT='+address.port);loop.start();}});
