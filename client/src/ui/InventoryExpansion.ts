import { getInventoryExpansion, INVENTORY_EXPANSIONS, INVENTORY_MAX_SLOTS, type S2CExpandInventoryResultPayload } from '@magicforge/shared';

export const EXPANSION_PREVIEW = INVENTORY_EXPANSIONS;
type Context = { maxSlots: number; gold: number; level: number; reborn: number };
export function setupInventoryExpansion(transport: { isReady(): boolean; send(expectedMaxSlots: number): void; apply(result: S2CExpandInventoryResultPayload): void }) {
  const button = document.getElementById('btn-expand-inventory') as HTMLButtonElement;
  const cost = document.getElementById('expand-cost-label')!;
  const label = document.getElementById('expand-slots-label')!;
  const status = document.getElementById('inventory-expansion-status')!;
  const panel = document.getElementById('inventory-expansion-confirm')!;
  const summary = document.getElementById('inventory-expansion-summary')!;
  const requirements = document.getElementById('inventory-expansion-requirements')!;
  const confirm = document.getElementById('btn-confirm-expansion') as HTMLButtonElement;
  const cancel = document.getElementById('btn-cancel-expansion') as HTMLButtonElement;
  let context: Context = { maxSlots: 20, gold: 0, level: 1, reborn: 0 };
  let quote: { cost: number; minLevel: number; minReborn?: number } | undefined;
  let pending = false, reviewing = false, timeout: number | undefined;
  const money = (value: number) => value.toLocaleString('pt-BR');
  function tier() { const next = getInventoryExpansion(context.maxSlots); return next && { ...next, ...quote }; }
  function blocked() {
    const next = tier();
    if (!transport.isReady()) return 'Conecte ao servidor para expandir.';
    if (!next) return context.maxSlots >= INVENTORY_MAX_SLOTS ? 'Capacidade máxima atingida.' : 'Reconecte para sincronizar a capacidade.';
    if (next.minReborn && context.reborn < next.minReborn) return `Requer Reborn ${next.minReborn}+.`;
    if (context.reborn === 0 && context.level < next.minLevel) return `Requer nível ${next.minLevel} ou Reborn. Seu nível: ${context.level}.`;
    if (context.gold < next.cost) return `Faltam ${money(next.cost - context.gold)} ouro. Custo: ${money(next.cost)} ouro.`;
    return '';
  }
  function render() {
    const next = tier(), reason = blocked();
    button.disabled = pending || !transport.isReady() || !next;
    label.textContent = next ? `+${next.slotsAdded} espaços` : 'Mochila completa';
    cost.textContent = pending ? 'Aguardando…' : next ? `${money(next.cost)} G` : `${context.maxSlots} espaços`;
    button.title = next ? `Expandir ${context.maxSlots} → ${next.newMaxSlots} espaços · ${reason || 'Compra disponível'}` : 'Capacidade máxima';
    panel.hidden = !reviewing;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    confirm.disabled = pending || !!reason;
    cancel.disabled = pending;
    confirm.textContent = pending ? 'Expandindo…' : next ? `Comprar por ${money(next.cost)} G` : 'Indisponível';
    summary.textContent = next ? `${context.maxSlots} → ${next.newMaxSlots} espaços na mochila (+${next.slotsAdded})` : 'Capacidade máxima';
    requirements.textContent = pending ? 'Aguardando o servidor. Não é necessário clicar novamente.' : reason || 'Equipamentos vestidos continuam fora da mochila.';
    requirements.dataset.state = reason ? 'error' : 'ready';
  }
  function requestConfirmation() {
    if (pending || !transport.isReady()) return;
    if (!tier()) { status.textContent = blocked(); return; }
    reviewing = true; status.textContent = ''; render();
    panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    (confirm.disabled ? cancel : confirm).focus({ preventScroll: true });
  }
  button.addEventListener('click', requestConfirmation);
  cancel.addEventListener('click', () => { reviewing = false; render(); button.focus(); });
  confirm.addEventListener('click', () => {
    if (!reviewing || pending || blocked()) return;
    pending = true; render(); status.textContent = '';
    timeout = window.setTimeout(() => { pending = false; reviewing = false; render(); status.textContent = 'Sem confirmação. Confira a capacidade e o saldo antes de tentar novamente.'; }, 12000);
    transport.send(context.maxSlots);
  });
  render();
  return {
    requestConfirmation,
    setContext(next: Context) {
      if (context.maxSlots !== next.maxSlots) { quote = undefined; reviewing = false; }
      context = { ...next }; render();
    },
    onResult(result: S2CExpandInventoryResultPayload) {
      window.clearTimeout(timeout); pending = false; reviewing = false;
      context.maxSlots = result.newMaxSlots; context.gold = result.remainingGold;
      quote = result.nextExpansionCost !== undefined && result.nextExpansionMinLevel !== undefined
        ? { cost: result.nextExpansionCost, minLevel: result.nextExpansionMinLevel, minReborn: getInventoryExpansion(result.newMaxSlots)?.minReborn } : undefined;
      render(); status.textContent = result.message; status.dataset.state = result.success ? 'success' : 'error';
      transport.apply(result);
    },
    onDisconnected() { window.clearTimeout(timeout); pending = false; reviewing = false; quote = undefined; context = { maxSlots: 20, gold: 0, level: 1, reborn: 0 }; render(); status.textContent = ''; },
  };
}
