import type { S2CBossEventPayload, S2CCombatEventPayload } from '@magicforge/shared';
export function setupBossNarrative() {
  const banner = document.createElement('aside'); banner.className = 'boss-story-banner'; banner.hidden = true; banner.setAttribute('role', 'status'); banner.setAttribute('aria-live', 'polite');
  const image = document.createElement('img'); image.alt = ''; const body = document.createElement('div'); const title = document.createElement('strong'); const text = document.createElement('p'); body.append(title, text); banner.append(image, body); document.body.append(banner);
  let bossId = '', bossName = '', halfSpoken = false, timeout: number | undefined;
  const isGrimgor = () => /grimgor|chefe goblin/i.test(bossName);
  function show(message: string) {
    title.textContent = bossName; text.textContent = message;
    const key = /frostbite/i.test(bossName) ? 'frostbite' : /ignis/i.test(bossName) ? 'ignis' : /grimgor|chefe goblin/i.test(bossName) ? 'grimgor' : '';
    image.src = key ? '/assets/bosses/iso_boss_' + key + '.png' : '/assets/portraits/villain_malakor_portrait.jpg';
    banner.hidden = false; window.clearTimeout(timeout); timeout = window.setTimeout(() => { banner.hidden = true; }, 6500);
  }
  function checkHalf(hp?: number, maxHp?: number) {
    if (!halfSpoken && hp !== undefined && maxHp && hp > 0 && hp <= maxHp / 2) {
      halfSpoken = true; if (isGrimgor()) show('A coroa... ela queima meu crânio... mas o poder é meu!');
    }
  }
  return {
    onBossEvent(payload: S2CBossEventPayload) {
      if (payload.eventType === 'SPAWN') { bossId = payload.bossId || ''; bossName = payload.bossName || 'Chefe do Mundo'; halfSpoken = false; show(isGrimgor() ? 'EU SOU O REI DESTE BOSQUE! A COROA DE FOGO ME ESCOLHEU!' : payload.message || 'O Chefe do Mundo despertou!'); }
      else if (payload.eventType === 'TICK') checkHalf(payload.currentHp, payload.maxHp);
      else if (payload.eventType === 'VICTORY') { if (isGrimgor()) show('Ele... ele prometeu que bastava segurar o fogo... só segurar...'); bossId = ''; }
      else if (payload.eventType === 'TIMEOUT' || payload.eventType === 'DEFEAT') { banner.hidden = true; bossId = ''; }
    },
    onCombatEvent(payload: S2CCombatEventPayload) { if (bossId && payload.targetId === bossId) checkHalf(payload.targetRemainingHp, payload.targetMaxHp); },
    reset() { window.clearTimeout(timeout); banner.hidden = true; bossId = ''; bossName = ''; halfSpoken = false; },
  };
}
