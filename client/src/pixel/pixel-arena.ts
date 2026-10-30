import { GameRenderer } from '../renderer/GameRenderer';
import { PracticeArena } from './PracticeArena';
import type { FxKind } from '../renderer/PixelVfx';
import { CharacterClass, getSkillsForClass, type CombatStatusType } from '@magicforge/shared';
import type { WarriorCastFx } from '../renderer/PixelVfx';
import { planWarriorCastFx } from '../renderer/PixelVfx';

const canvas = document.querySelector<HTMLCanvasElement>('#pixel-arena')!;
const renderer = new GameRenderer(canvas), arena = new PracticeArena();
const previewWorld = document.querySelector<HTMLSelectElement>('#preview-world')!;
const previewPortal = document.querySelector<HTMLInputElement>('#preview-portal')!;
function updatePreviewWorld(): void {
  const world = Number(previewWorld.value);
  renderer.setStagePresentation({ world, portalOpen: previewPortal.checked, portalPosition: { x: 0, y: 0, z: -7 } });
  document.querySelector('.location small')!.textContent = `MUNDO 0${world} · PRÉVIA PIXEL ART`;
  document.querySelector('.location h1')!.textContent = world === 2 ? 'Picos de Jotunheim' : 'Clareira dos Forjados';
}
previewWorld.addEventListener('change', updatePreviewWorld);
previewPortal.addEventListener('change', updatePreviewWorld);
renderer.showRawGhost = false;
const keys = new Set<string>(), touches = new Set<string>();
let auto = false, attackUntil = 0, previous = performance.now(), loaded = false;
let destination: { x: number; z: number } | null = null;
let selectedFx: FxKind | null = null, nextFx = 0;
let selectedSkillPreview = false;
const fxStatus = document.querySelector<HTMLOutputElement>('#vfx-status')!;
const fxLoop = document.querySelector<HTMLInputElement>('#vfx-loop')!;
function previewFx(kind: FxKind): void {
  selectedSkillPreview = false;
  selectedFx = kind;
  const hero = arena.hero;
  if (kind === 'shield') previewShield(false);
  else renderer.vfx.queue.spawn({ kind, position: hero.position, followId: ['heal', 'levelUp'].includes(kind) ? hero.id : undefined, yaw: hero.headingYaw, radius: kind === 'avatar' ? 7 : 5 }, performance.now());
  nextFx = performance.now() + 1400;
  const labels: Record<FxKind, string> = { slash: 'Corte V2 · aprovado provisoriamente', heal: 'Cura', whirlwind: 'Redemoinho', avatar: 'Avatar', impact: 'Impacto', shield: 'Escudo', levelUp: 'Subida de nível', line: 'Golpe Colossal', judgment: 'Lâmina do Julgamento' };
  fxStatus.textContent = `Prévia visual: ${labels[kind]}. A vida e os atributos não são alterados.`;
}
document.querySelectorAll<HTMLButtonElement>('[data-fx]').forEach(button => button.addEventListener('click', () => previewFx(button.dataset.fx as FxKind)));
const skillSelect = document.querySelector<HTMLSelectElement>('#warrior-preview-skill')!;
const warriorSkills = [...new Map(getSkillsForClass(CharacterClass.GUERREIRO).map(skill => [skill.skillId, skill])).values()];
for (const skill of warriorSkills) { const option = document.createElement('option'); option.value = skill.skillId; option.textContent = skill.name; skillSelect.append(option); }
function previewWarriorSkill(): void {
  const skill = warriorSkills.find(s => s.skillId === skillSelect.value); if (!skill) return;
  selectedFx = null; selectedSkillPreview = true; renderer.resetNarrative();
  nextFx = performance.now() + 1400;
  const hero = arena.hero, now = performance.now(), previewTarget = arena.nearest(50);
  const target = previewTarget?.position ?? { ...hero.position, x: hero.position.x + 3 };
  const yaw = Math.atan2(target.x - hero.position.x, target.z - hero.position.z) * 180 / Math.PI;
  const self = ['guerreiro_nv1_1', 'guerreiro_nv2_2', 'guerreiro_nv3_3'].includes(skill.skillId);
  const event: WarriorCastFx = { skillId: skill.skillId, casterId: hero.id, affectedEntityIds: self ? [hero.id] : ['preview-target'], isHeal: skill.isHeal,
    originPosition: hero.position, headingYaw: yaw, targetPosition: target, geometry: ['guerreiro_nv2_1', 'guerreiro_nv3_1'].includes(skill.skillId) ? 'CIRCLE_SELF' : 'CIRCLE_TARGET', radius: skill.aoeRadius,
    lineLength: 4.5, lineWidth: 3, targetResults: [{ targetId: self ? hero.id : 'preview-target', impactPosition: self ? hero.position : target, effectiveDamage: self ? 0 : 1, effectiveHeal: skill.isHeal ? 1 : 0 }] };
  if (skill.skillId === 'guerreiro_nv3_3') event.targetResults!.push({ targetId: 'preview-target', impactPosition: target, effectiveDamage: 1, effectiveHeal: 0 });
  for (const fx of planWarriorCastFx(event, arena.entities)) renderer.vfx.queue.spawn(fx, now);
  const types: Record<string, CombatStatusType> = { guerreiro_truque_2: 'BLEED', guerreiro_truque_3: 'ARMOR_BREAK', guerreiro_nv1_2: 'ATTACK_SPEED_BUFF', guerreiro_nv1_3: 'STUN', guerreiro_nv2_2: 'SHIELD', guerreiro_nv3_1: 'DAMAGE_BUFF', guerreiro_nv3_3: 'DEATH_IMMUNITY' };
  const type = types[skill.skillId];
  // Decorative status sample is attached to a living practice entity, never to multiplayer.
  const recipient = ['BLEED', 'ARMOR_BREAK', 'STUN'].includes(type) ? arena.nearest(50) : hero;
  if (type && recipient) { const tick = Math.floor(now / 50); renderer.applyCombatStatus({ event: 'APPLIED', serverTick: tick, status: { statusId: 'practice-skill-status', type, skillId: skill.skillId, sourceEntityId: hero.id, targetEntityId: recipient.id, durationSec: 4, remainingSec: 4, expiresAtTick: tick + 80, magnitude: 1, ...(type === 'SHIELD' ? { remainingAbsorption: 48, maxAbsorption: 48 } : {}) } }, arena.entities); }
  fxStatus.textContent = `${skill.name}: prévia visual com evento de exemplo. Sem dano, cura, custo ou progressão; ${type ? 'status decorativo por 4 s' : 'efeito de conjuração'}.`;
}
document.querySelector('#preview-warrior-skill')!.addEventListener('click', previewWarriorSkill);
function previewShield(broken: boolean): void {
  const tick = Math.floor(performance.now() / 50);
  renderer.applyCombatStatus({ event: broken ? 'BROKEN' : 'REFRESHED', serverTick: tick, status: {
    statusId: 'practice-shield-preview', type: 'SHIELD', skillId: 'guerreiro_nv2_2', sourceEntityId: arena.hero.id,
    targetEntityId: arena.hero.id, durationSec: 6, remainingSec: broken ? 0 : 6, expiresAtTick: tick + 120,
    magnitude: .3, remainingAbsorption: broken ? 0 : 48, maxAbsorption: 48,
  } }, arena.entities);
}
document.querySelector('#break-preview-shield')!.addEventListener('click', () => {
  fxLoop.checked = false; selectedFx = null; selectedSkillPreview = false;
  const tick = Math.floor(performance.now() / 50);
  renderer.applyCombatStatus({ event: 'BROKEN', serverTick: tick, status: { statusId: 'practice-skill-status', type: 'SHIELD', skillId: 'guerreiro_nv2_2', sourceEntityId: arena.hero.id, targetEntityId: arena.hero.id, durationSec: 4, remainingSec: 0, expiresAtTick: tick, magnitude: 0 } }, arena.entities);
  previewShield(true); fxStatus.textContent = 'Prévia: escudo removido pelo evento de quebra. A vida não foi alterada.';
});
const hp = document.querySelector<HTMLOutputElement>('#hp')!, kills = document.querySelector<HTMLOutputElement>('#kills')!;
const result = document.querySelector<HTMLDivElement>('#result')!;
const autoButton = document.querySelector<HTMLButtonElement>('#auto')!;
const resize = () => { const box = canvas.getBoundingClientRect(); renderer.resize(Math.round(box.width), Math.round(box.height)); };
new ResizeObserver(resize).observe(canvas.parentElement!); resize();
const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '];
window.addEventListener('keydown', event => { if (!movementKeys.includes(event.key.toLowerCase()) || event.target instanceof HTMLButtonElement) return; event.preventDefault(); keys.add(event.key.toLowerCase()); });
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); touches.clear(); });
document.addEventListener('visibilitychange', () => { keys.clear(); touches.clear(); previous = performance.now(); });
document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(button => {
  button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); touches.add(button.dataset.direction!); });
  const release = () => touches.delete(button.dataset.direction!);
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
});
document.querySelector('#attack')!.addEventListener('click', () => { attackUntil = performance.now() + 180; canvas.focus({ preventScroll: true }); });
autoButton.addEventListener('click', () => { auto = !auto; autoButton.textContent = `Auto: ${auto ? 'ligado' : 'desligado'}`; autoButton.setAttribute('aria-pressed', String(auto)); canvas.focus({ preventScroll: true }); });
function reset() { arena.reset(); renderer.pixelWorld.clock.retain(new Set()); renderer.clearDrops(); renderer.resetNarrative(); fxLoop.checked = false; selectedFx = null; selectedSkillPreview = false; fxStatus.textContent = 'Selecione um efeito para conferir.'; result.hidden = true; destination = null; auto = false; attackUntil = 0; autoButton.textContent = 'Auto: desligado'; autoButton.setAttribute('aria-pressed', 'false'); keys.clear(); touches.clear(); canvas.focus({ preventScroll: true }); }
document.querySelector('#restart')!.addEventListener('click', reset); document.querySelector('#restart-result')!.addEventListener('click', reset);
canvas.addEventListener('pointerdown', event => { const point = renderer.screenToWorld(event.clientX, event.clientY); destination = { x: point.x, z: point.z }; canvas.focus({ preventScroll: true }); });
Promise.all([renderer.pixelWorld.ready, renderer.vfx.ready]).then(() => { loaded = true; document.querySelector<HTMLElement>('#loading')!.hidden = true; }).catch(() => { document.querySelector('#loading')!.textContent = 'Falha ao carregar a arte. Recarregue a página para tentar novamente.'; });
function frame(now: number) {
  const dt = (now - previous) / 1000; previous = now;
  if (loaded && !document.hidden) {
    let x = Number(keys.has('d') || keys.has('arrowright') || touches.has('right')) - Number(keys.has('a') || keys.has('arrowleft') || touches.has('left'));
    let z = Number(keys.has('s') || keys.has('arrowdown') || touches.has('down')) - Number(keys.has('w') || keys.has('arrowup') || touches.has('up'));
    if (x || z) destination = null;
    if (destination) {
      const dx = destination.x - arena.hero.position.x, dz = destination.z - arena.hero.position.z;
      if (Math.hypot(dx, dz) < .25) destination = null; else { x = dx; z = dz; }
    }
    const events = arena.step(document.hidden ? 0 : dt, now, {
      x, z,
      attack: keys.has(' ') || now < attackUntil, auto,
    });
    for (const event of events) { renderer.triggerEntityAnimation(event.id, event.action); if (event.action === 'attack' && event.id === arena.hero.id) { const target = arena.nearest(2.4); if (target) renderer.vfx.queue.spawn({ kind: 'slash', position: target.position, yaw: arena.hero.headingYaw }, now); } if (event.damage) { const e = arena.entities.find(entity => entity.id === event.id)!; renderer.addDamageText(e.position, event.damage, false, false); } }
    if (fxLoop.checked && selectedFx && now >= nextFx && arena.hero.currentHp > 0) previewFx(selectedFx);
    if (fxLoop.checked && selectedSkillPreview && now >= nextFx && arena.hero.currentHp > 0) previewWarriorSkill();
    const target = arena.nearest(8); renderer.selectedTargetId = target?.id ?? null;
    renderer.render(arena.entities, arena.hero.id);
    canvas.dataset.playerX = arena.hero.position.x.toFixed(2); canvas.dataset.playerZ = arena.hero.position.z.toFixed(2);
    hp.textContent = `${arena.hero.currentHp} / ${arena.hero.maxHp}`;
    document.querySelector<HTMLElement>('#health-fill')!.style.width = `${arena.hero.currentHp / arena.hero.maxHp * 100}%`;
    kills.textContent = `${arena.defeated} / 6 alvos derrotados`;
    const ended = arena.hero.currentHp <= 0 || arena.defeated === 6;
    if (ended && result.hidden) { result.hidden = false; document.querySelector('#result-title')!.textContent = arena.hero.currentHp ? 'Clareira protegida' : 'A forja espera por você'; document.querySelector('#result-message')!.textContent = 'Este treino é local. Entre na sua conta para jogar com seu progresso salvo.'; }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
