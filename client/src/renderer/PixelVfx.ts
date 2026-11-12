export type WarriorWorldFxKind = 'warriorTrail' | 'warriorWave' | 'warriorBlade' | 'warriorContact' | 'warriorAura' | 'warriorSigil' | 'warriorAftermath';
export type FxKind = 'slash' | 'heal' | 'whirlwind' | 'avatar' | 'impact' | 'shield' | 'levelUp' | 'line' | 'judgment' | 'cone' | 'barbarianBurst' | 'warlockFlight' | 'warlockImpact' | 'warlockContact' | WarriorWorldFxKind;
export type FxPosition = { x: number; y: number; z: number };
export type FxEntity = { id: string; position: FxPosition; headingYaw: number; currentHp: number };
export type SlashVariant = 'bleed' | 'rupture' | 'haste' | 'stun';
export type FxRequest = { kind: FxKind; position: FxPosition; yaw?: number; followId?: string; radius?: number; lineLength?: number; lineWidth?: number; coneRange?:number;coneAngleDeg?:number;delayMs?:number;variant?: SlashVariant; destination?: FxPosition; tone?: string; artwork?: number; barbarianRow?: number; spellIndex?: number; durationMs?: number; targetId?: string };
export type FxInstance = FxRequest & { startedAt: number; duration: number };
export const FX_DURATION: Record<FxKind, number> = { slash: 330, heal: 800, whirlwind: 650, avatar: 1000, impact: 400, shield: 900, levelUp: 1100, line: 650, judgment: 850, cone:600,
  warriorTrail: 400, warriorWave: 560, warriorBlade: 680, warriorContact: 350, warriorAura: 760, warriorSigil: 430, warriorAftermath: 900, barbarianBurst: 600, warlockFlight: 300, warlockImpact: 700, warlockContact: 300 };
export const FX_SHEETS = {
  heal: { file: '/assets/pixel/craftpix/vfx/heal.png', cell: 72, frames: 8, fps: 10 },
  impact: { file: '/assets/pixel/craftpix/vfx/impact.png', cell: 72, frames: 4, fps: 10 },
};
export function finitePosition(position: FxPosition | undefined): position is FxPosition {
  return !!position && Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.z);
}

export function planMageCometPulseFx(event:{event:string;status:{type:string;areaCenter?:FxPosition;radius?:number}}):FxRequest[]{
  if(event.event!=='TICK'||event.status.type!=='COMET_RAIN'||!finitePosition(event.status.areaCenter))return [];
  return [{kind:'impact',position:event.status.areaCenter},{kind:'whirlwind',position:event.status.areaCenter,radius:event.status.radius??6.5}];
}

export function planBarbarianPackPulseFx(
  event: { event: string; status: { type: string; targetEntityId: string; radius?: number } },
  entities: readonly FxEntity[],
): FxRequest[] {
  if (event.event !== 'TICK' || event.status.type !== 'SPECTRAL_PACK') return [];
  const caster = entities.find(entity => entity.id === event.status.targetEntityId);
  if (!caster || caster.currentHp <= 0) return [];
  return [{ kind: 'barbarianBurst', barbarianRow: 11, position: caster.position, radius: event.status.radius }];
}
/** Bounded, disposable presentation state. No damage, healing or persistent statuses. */
export class PixelVfxQueue {
  private effects: FxInstance[] = [];
  spawn(request: FxRequest, now: number): void {
    if (!finitePosition(request.position) || !Number.isFinite(now) || !Object.hasOwn(FX_DURATION, request.kind)) return;
    const delay=Number.isFinite(request.delayMs)?Math.max(0,Math.min(600,request.delayMs!)):0;
    this.effects.push({ ...request, position: { ...request.position }, yaw: Number.isFinite(request.yaw) ? request.yaw : 0, radius: Number.isFinite(request.radius) ? Math.max(1, Math.min(30, request.radius!)) : undefined, startedAt: now+delay, duration: request.durationMs ?? FX_DURATION[request.kind] });
    if (this.effects.length > 64) this.effects.splice(0, this.effects.length - 64);
  }
  clear(): void { this.effects = []; }
  sample(now: number, entities: readonly FxEntity[]): FxInstance[] {
    const byId = new Map(entities.map(e => [e.id, e]));
    this.effects = this.effects.filter(effect => now - effect.startedAt < effect.duration && (!effect.followId || (byId.has(effect.followId) && byId.get(effect.followId)!.currentHp > 0)));
    return this.effects.filter(effect=>now>=effect.startedAt).map(effect => ({ ...effect, position: effect.followId ? { ...byId.get(effect.followId)!.position } : { ...effect.position } }));
  }
}
export type WarriorCastFx = {
  coneRange?:number;coneAngleDeg?:number;
  skillId: string; casterId: string; targetPosition?: FxPosition; targetId?: string;
  affectedEntityIds: string[]; isHeal: boolean;
  originPosition?: FxPosition; headingYaw?: number; geometry?: string; radius?: number;
  lineLength?: number; lineWidth?: number;
  targetResults?: Array<{ targetId: string; impactPosition: FxPosition; effectiveDamage: number; effectiveHeal: number }>;
};
export function planBarbarianCastFx(event: WarriorCastFx, entities: readonly FxEntity[]): FxRequest[] {
  const match = /^barbaro_(truque|nv1|nv2|nv3)_([123])$/.exec(event.skillId);
  if (!match) return [];
  const row = ['truque', 'nv1', 'nv2', 'nv3'].indexOf(match[1]) * 3 + Number(match[2]) - 1;
  const caster = entities.find(entity => entity.id === event.casterId);
  const origin = event.originPosition ?? caster?.position;
  const hit = event.targetResults?.find(result => result.effectiveDamage > 0 && finitePosition(result.impactPosition));
  const target = hit?.impactPosition ?? event.targetPosition;
  const position = [1, 3, 4, 5, 6, 7, 9, 11].includes(row) ? origin : target ?? origin;
  if (!finitePosition(position)) return [];
  const effects: FxRequest[] = [{
    kind: 'barbarianBurst', barbarianRow: row, position, radius: event.radius,
    followId: caster && [3, 7, 11].includes(row) ? caster.id : undefined,
    delayMs: row === 10 ? 180 : 80,
    destination: row === 5 && finitePosition(target) ? target : undefined,
  }];
  for (const result of event.targetResults ?? []) {
    if (result.effectiveDamage > 0 && finitePosition(result.impactPosition)) {
      effects.push({ kind: 'impact', position: result.impactPosition, targetId: result.targetId, delayMs: row === 10 ? 320 : 200 });
    }
  }
  if (caster && event.targetResults?.some(result => result.targetId === caster.id && result.effectiveHeal > 0)) {
    effects.push({ kind: 'heal', position: caster.position, followId: caster.id });
  }
  return effects;
}

/** Short cast/impact visuals only; persistent statuses use their own authoritative lifecycle. */
export function planWarriorCastFx(event: WarriorCastFx, entities: readonly FxEntity[], radius?: number): FxRequest[] {
  if (!event.affectedEntityIds.length) return [];
  const caster = entities.find(e => e.id === event.casterId);
  if(event.skillId==='barbaro_truque_3'){
    const effects:FxRequest[]=[];const hit=event.targetResults?.find(result=>result.effectiveDamage>0);
    if(hit)effects.push({kind:'slash',position:hit.impactPosition,yaw:event.headingYaw});
    if(caster&&event.targetResults?.some(result=>result.targetId===caster.id&&result.effectiveHeal>0))effects.push({kind:'heal',position:caster.position,followId:caster.id});
    return effects;
  }
  if(event.skillId==='barbaro_nv2_2')return caster?[{kind:'shield',position:caster.position,followId:caster.id},...(event.targetResults?.some(result=>result.effectiveHeal>0)?[{kind:'heal' as const,position:caster.position,followId:caster.id}]:[])]:[];
  if(event.skillId==='mago_nv3_2')return []; // Actual impacts arrive as authoritative status ticks.
  if(['mago_nv3_1','mago_nv3_3'].includes(event.skillId)&&finitePosition(event.targetPosition))return [{kind:'impact',position:event.targetPosition},{kind:'whirlwind',position:event.targetPosition,radius:event.radius}];
  if(event.skillId==='mago_nv2_3')return caster?[{kind:'avatar',position:caster.position,followId:caster.id}]:[];
  if(event.skillId==='mago_nv2_1'&&finitePosition(event.targetPosition))return [{kind:'whirlwind',position:event.targetPosition,radius:event.radius??5.5}];
  if(event.skillId==='mago_nv2_2')return (event.targetResults??[]).filter(result=>result.effectiveDamage>0&&finitePosition(result.impactPosition)).map((result,index)=>({kind:'impact' as const,position:result.impactPosition,delayMs:index*80}));
  if(event.skillId==='mago_nv1_2')return caster&&event.affectedEntityIds.includes(caster.id)?[{kind:'shield',position:caster.position,followId:caster.id}]:[];
  if(event.skillId==='mago_nv1_3'&&finitePosition(event.originPosition))return [{kind:'cone',position:event.originPosition,yaw:event.headingYaw,coneRange:event.coneRange??6,coneAngleDeg:event.coneAngleDeg??60}];
  if(['mago_truque_1','mago_truque_2','mago_truque_3','mago_nv1_1'].includes(event.skillId))return (event.targetResults??[]).filter(result=>result.effectiveDamage>0&&finitePosition(result.impactPosition)).map((result,index)=>({kind:'impact' as const,position:result.impactPosition,delayMs:event.skillId==='mago_nv1_1'?index*100:0}));
  if(event.skillId==='clerigo_nv3_2'){
    if(!caster)return [];
    const effects:FxRequest[]=[];
    if(event.targetResults?.some(result=>result.targetId===caster.id&&result.effectiveHeal>0))effects.push({kind:'heal',position:caster.position,followId:caster.id});
    if(event.targetResults?.some(result=>result.effectiveDamage>0))effects.push({kind:'judgment',position:event.originPosition??caster.position,radius:event.radius??8});
    return effects;
  }
  if (event.skillId === 'guerreiro_nv3_3') {
    if (!caster || !event.affectedEntityIds.includes(caster.id)) return [];
    // Mixed heal/damage cast: the heal flag must not hide its confirmed martial wave.
    const effects: FxRequest[] = [{ kind: 'heal', position: caster.position, followId: caster.id }];
    if (event.targetResults?.some(r => r.effectiveDamage > 0)) effects.push({ kind: 'avatar', position: caster.position, radius: event.radius ?? 4 });
    return effects;
  }
  if (event.skillId === 'guerreiro_nv1_1') {
    return event.isHeal && caster && event.affectedEntityIds.includes(caster.id) ? [{ kind: 'heal', position: caster.position, followId: caster.id }] : [];
  }
  if (event.isHeal) return [];
  const target = entities.find(e => event.affectedEntityIds.includes(e.id));
  const result = event.targetResults?.find(r => r.effectiveDamage > 0 && finitePosition(r.impactPosition));
  const impact = result?.impactPosition ?? (finitePosition(event.targetPosition) ? event.targetPosition : target?.position);
  const origin = finitePosition(event.originPosition) ? event.originPosition : caster?.position;
  if(event.skillId==='clerigo_nv3_1' && impact)return [{kind:'judgment',position:finitePosition(event.targetPosition)?event.targetPosition:impact,radius:event.radius??7.5}];
  if(event.skillId==='clerigo_nv3_3' && impact)return [{kind:'impact',position:impact}];
  const yaw = Number.isFinite(event.headingYaw) ? event.headingYaw! : origin && impact ? Math.atan2(impact.x - origin.x, impact.z - origin.z) * 180 / Math.PI : caster?.headingYaw ?? 0;
  if (['guerreiro_truque_1', 'guerreiro_truque_2', 'guerreiro_truque_3', 'guerreiro_nv1_2', 'guerreiro_nv1_3', 'barbaro_truque_1', 'barbaro_truque_2', 'barbaro_truque_3', 'barbaro_nv1_3'].includes(event.skillId) && impact) {
    const variants: Record<string, SlashVariant> = {
      guerreiro_truque_2: 'bleed', guerreiro_truque_3: 'rupture', guerreiro_nv1_2: 'haste', guerreiro_nv1_3: 'stun',
      barbaro_truque_2: 'rupture', barbaro_nv1_3: 'stun',
    };
    return [{ kind: 'slash', position: impact, yaw, variant: variants[event.skillId] }];
  }
  const center = event.geometry === 'CIRCLE_SELF' ? origin : finitePosition(event.targetPosition) ? event.targetPosition : origin;
  radius = event.radius ?? radius;
  if (['guerreiro_nv2_1', 'barbaro_nv2_1', 'barbaro_nv3_3'].includes(event.skillId) && center) return [{ kind: 'whirlwind', position: center, radius }];
  if (['guerreiro_nv3_1', 'barbaro_nv1_1', 'barbaro_nv1_2', 'barbaro_nv3_1'].includes(event.skillId) && center) return [{ kind: 'avatar', position: center, radius }];
  if (event.skillId === 'barbaro_nv2_2' && center) return [{ kind: 'shield', position: center, radius }];
  if (event.skillId === 'guerreiro_nv2_3' && origin) return [{ kind: 'line', position: origin, yaw, lineLength: event.lineLength, lineWidth: event.lineWidth }];
  if (['guerreiro_nv3_2', 'barbaro_nv2_3', 'barbaro_nv3_2'].includes(event.skillId) && center) return [{ kind: 'judgment', position: center, radius }];
  return [];
}
