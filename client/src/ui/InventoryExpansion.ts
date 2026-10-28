import type { S2CExpandInventoryResultPayload } from '@magicforge/shared';

// Display-only preview verified against World.INVENTORY_EXPANSIONS on 28/10/2026.
// The server still validates/debits; subsequent result quotes replace this preview.
export const EXPANSION_PREVIEW: Record<number, { cost: number; minLevel: number; minReborn?: number }> = {
  20: { cost: 10000, minLevel: 15 }, 25: { cost: 50000, minLevel: 25 },
  30: { cost: 250000, minLevel: 35 }, 35: { cost: 1000000, minLevel: 45 },
  40: { cost: 3500000, minLevel: 50 }, 45: { cost: 10000000, minLevel: 50, minReborn: 1 },
};
type Context = { maxSlots: number; gold: number; level: number; reborn: number };
export function setupInventoryExpansion(transport: { isReady(): boolean; send(): void; apply(result: S2CExpandInventoryResultPayload): void }) {
  const button = document.getElementById('btn-expand-inventory') as HTMLButtonElement;
  const cost = document.getElementById('expand-cost-label')!;
  const status = document.getElementById('inventory-expansion-status')!;
  const panel = document.getElementById('inventory-expansion-confirm')!;
  const confirm = document.getElementById('btn-confirm-expansion') as HTMLButtonElement;
  const cancel = document.getElementById('btn-cancel-expansion') as HTMLButtonElement;
  let context: Context = { maxSlots: 20, gold: 0, level: 1, reborn: 0 };
  let quote: { cost: number; minLevel: number; minReborn?: number } | undefined;
  let pending = false, reviewing = false, timeout: number | undefined;
  const money = (value: number) => value.toLocaleString('pt-BR');
  function tier() { return quote || EXPANSION_PREVIEW[context.maxSlots]; }
  function render() {
    const next = tier();
    button.disabled = pending || !transport.isReady() || context.maxSlots >= 50 || !next;
    cost.textContent = pending ? 'Aguardando…' : context.maxSlots >= 50 ? 'Máximo: 50' : next ? money(next.cost) + ' G' : 'Indisponível';
    panel.hidden = !reviewing || pending;
    confirm.disabled = pending || !transport.isReady(); cancel.disabled = pending;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    button.title = next ? 'Prévia: ' + money(next.cost) + ' ouro · Nv. ' + next.minLevel + ' ou Reborn' + (next.minReborn ? ' · Reborn ' + next.minReborn + '+ obrigatório' : '') : 'Capacidade máxima';
  }
  function requestConfirmation() {
    if (pending || !transport.isReady()) return;
    const next = tier();
    if (context.maxSlots >= 50 || !next) { status.textContent = 'Sua mochila já possui 50 slots.'; return; }
    if ((next.minReborn && context.reborn < next.minReborn) || (context.reborn === 0 && context.level < next.minLevel)) {
      status.textContent = next.minReborn ? 'Esta expansão requer Reborn ' + next.minReborn + '+.' : 'Esta expansão requer nível ' + next.minLevel + ' ou Reborn.'; return;
    }
    if (context.gold < next.cost) { status.textContent = 'São necessários ' + money(next.cost) + ' ouro para esta expansão.'; return; }
    reviewing = true;
    document.getElementById('inventory-expansion-summary')!.textContent = 'Comprar +5 slots (' + context.maxSlots + ' → ' + Math.min(50, context.maxSlots + 5) + ') por ' + money(next.cost) + ' ouro?';
    render(); cancel.focus();
  }
  button.addEventListener('click', requestConfirmation);
  cancel.addEventListener('click', () => { reviewing = false; render(); button.focus(); });
  confirm.addEventListener('click', () => {
    if (!reviewing || pending || !transport.isReady()) return;
    pending = true; reviewing = false; render(); status.textContent = 'Aguardando confirmação da expansão…';
    timeout = window.setTimeout(() => { pending = false; render(); status.textContent = 'Sem confirmação. Confira a capacidade e o saldo antes de tentar novamente.'; }, 12000);
    transport.send();
  });
  render();
  return {
    requestConfirmation,
    setContext(next: Context) {
      if (context.maxSlots !== next.maxSlots) quote = undefined;
      if (context.maxSlots !== next.maxSlots || context.gold !== next.gold || context.level !== next.level || context.reborn !== next.reborn) reviewing = false;
      context = { ...next }; render();
    },
    onResult(result: S2CExpandInventoryResultPayload) {
      window.clearTimeout(timeout); pending = false; reviewing = false;
      context.maxSlots = result.newMaxSlots; context.gold = result.remainingGold;
      quote = result.nextExpansionCost !== undefined && result.nextExpansionMinLevel !== undefined
        ? { cost: result.nextExpansionCost, minLevel: result.nextExpansionMinLevel, minReborn: EXPANSION_PREVIEW[result.newMaxSlots]?.minReborn } : undefined;
      render(); status.textContent = result.message; status.dataset.state = result.success ? 'success' : 'error';
      transport.apply(result);
    },
    onDisconnected() { window.clearTimeout(timeout); pending = false; reviewing = false; quote = undefined; context = { maxSlots: 20, gold: 0, level: 1, reborn: 0 }; render(); status.textContent = ''; },
  };
}
