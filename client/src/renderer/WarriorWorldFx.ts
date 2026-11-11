import { finitePosition, FX_DURATION, type FxEntity, type FxRequest, type WarriorCastFx } from './PixelVfx.ts';

const contactTones: Record<string, string> = {
  guerreiro_truque_1: '#ffca69',
  guerreiro_truque_2: '#ff5158',
  guerreiro_truque_3: '#d098ff',
  guerreiro_nv1_2: '#ff873e',
  guerreiro_nv1_3: '#fff1aa',
};
const groups = ['truque', 'nv1', 'nv2', 'nv3'];

const distance = (a: FxRequest['position'], b: FxRequest['position']) =>
  Math.hypot(a.x - b.x, a.z - b.z);

/** Plan visuals from confirmed geometry. The renderer never finds extra combat targets. */
export function planWarriorWorldFx(event: WarriorCastFx, entities: readonly FxEntity[]): FxRequest[] {
  const match = /^guerreiro_(truque|nv1|nv2|nv3)_([123])$/.exec(event.skillId);
  if (!match) return [];
  const artwork = groups.indexOf(match[1]) * 3 + Number(match[2]) - 1;
  const caster = entities.find(entity => entity.id === event.casterId);
  const origin = finitePosition(event.originPosition) ? event.originPosition : caster?.position;
  if (!finitePosition(origin)) return [];
  const hits = (event.targetResults ?? []).filter(result => result.effectiveDamage > 0 && finitePosition(result.impactPosition));
  const target = hits[0]?.impactPosition ?? event.targetPosition;
  const effects: FxRequest[] = [];
  const { skillId } = event;
  const warm = '#ffba52';
  const contact = (tone: string, delay: (position: FxRequest['position']) => number) => {
    for (const { impactPosition, targetId } of hits.slice(0, 24)) {
      effects.push({ kind: 'warriorContact', position: impactPosition, targetId, tone, delayMs: delay(impactPosition) });
    }
  };
  const wave = (position: FxRequest['position'], radius: number, tone: string, delayMs: number) =>
    effects.push({ kind: 'warriorWave', position, radius, tone, delayMs });
  const aura = (tone: string) =>
    effects.push({ kind: 'warriorAura', position: origin, followId: caster?.id, tone });

  if (contactTones[skillId]) {
    const tone = contactTones[skillId];
    if (finitePosition(target)) effects.push({ kind: 'warriorTrail', position: origin, destination: target, tone, delayMs: 100 });
    contact(tone, () => 260);
    if (skillId === 'guerreiro_nv1_2') aura(tone);
    return effects.map(effect => ({ ...effect, artwork }));
  }

  switch (skillId) {
    case 'guerreiro_nv1_1':
      aura('#90ed9c');
      effects.push({ kind: 'heal', position: origin, followId: caster?.id, delayMs: 130 });
      break;
    case 'guerreiro_nv2_2':
      aura('#ffe19a');
      effects.push({ kind: 'shield', position: origin, followId: caster?.id, delayMs: 130 });
      break;
    case 'guerreiro_nv2_1': {
      const radius = event.radius || 5;
      wave(origin, radius, '#bceeff', 100);
      contact('#bceeff', position => 100 + Math.min(1, distance(origin, position) / radius) * FX_DURATION.warriorWave * .75);
      break;
    }
    case 'guerreiro_nv3_1': {
      const radius = event.radius || 7;
      effects.push({ kind: 'warriorSigil', position: origin, radius });
      wave(origin, radius, '#ffd366', 185);
      effects.push({ kind: 'warriorAftermath', position: origin, followId: caster?.id, radius, delayMs: 330 });
      contact('#ffd366', position => 185 + Math.min(1, distance(origin, position) / radius) * 410);
      break;
    }
    case 'guerreiro_nv3_3': {
      const radius = event.radius || 4;
      effects.push({ kind: 'warriorSigil', position: origin, radius });
      wave(origin, radius, '#ff722d', 100);
      wave(origin, radius, '#ff9b37', 245);
      wave(origin, radius, '#ff522b', 420);
      effects.push({ kind: 'warriorAftermath', position: origin, radius, delayMs: 530 });
      if (event.targetResults?.some(result => result.targetId === event.casterId && result.effectiveHeal > 0)) {
        effects.push({ kind: 'heal', position: origin, followId: caster?.id, delayMs: 110 });
      }
      contact('#ff722d', position => 100 + Math.min(1, distance(origin, position) / radius) * 410);
      break;
    }
    case 'guerreiro_nv2_3': {
      const length = event.lineLength ?? 4.5;
      effects.push({ kind: 'line', position: origin, yaw: event.headingYaw, lineLength: length, lineWidth: event.lineWidth, tone: '#ffc16f', delayMs: 100 });
      contact(warm, position => 100 + Math.min(1, distance(origin, position) / length) * FX_DURATION.line * .8);
      break;
    }
    case 'guerreiro_nv3_2': {
      const center = finitePosition(event.targetPosition) ? event.targetPosition : target;
      if (!center) break;
      const radius = event.radius || 5;
      effects.push({ kind: 'warriorSigil', position: center, radius });
      effects.push({ kind: 'warriorBlade', position: center, tone: '#fff3bb', delayMs: 140 });
      wave(center, radius, '#ffe38a', 420);
      effects.push({ kind: 'warriorAftermath', position: center, radius, delayMs: 470 });
      contact('#fff3bb', position => 420 + Math.min(180, distance(center, position) / radius * 180));
      break;
    }
  }
  return effects.map(effect => ({ ...effect, artwork }));
}
