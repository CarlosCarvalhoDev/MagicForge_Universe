import { getInventoryExpansion, INVENTORY_EXPANSIONS, INVENTORY_MAX_SLOTS, type S2CExpandInventoryResultPayload, type InventoryExpansionPayment } from '@magicforge/shared';

export const EXPANSION_PREVIEW = INVENTORY_EXPANSIONS;
type Context = { maxSlots: number; gold: number; level: number; reborn: number; cash?: number; seals?: number };
export function setupInventoryExpansion(transport: { isReady(): boolean; send(expectedMaxSlots: number, payment: InventoryExpansionPayment, quotedCost: number): void; apply(result: S2CExpandInventoryResultPayload): void }) {
  const button = document.getElementById('btn-expand-inventory') as HTMLButtonElement;
  const cost = document.getElementById('expand-cost-label')!;
  const label = document.getElementById('expand-slots-label')!;
  const status = document.getElementById('inventory-expansion-status')!;
  const panel = document.getElementById('inventory-expansion-confirm')!;
  const summary = document.getElementById('inventory-expansion-summary')!;
  const requirements = document.getElementById('inventory-expansion-requirements')!;
  const confirm = document.getElementById('btn-confirm-expansion') as HTMLButtonElement;
  const cancel = document.getElementById('btn-cancel-expansion') as HTMLButtonElement;
  const payments = document.getElementById('inventory-expansion-payments')!;
  const cashButton = document.getElementById('btn-expansion-cash') as HTMLButtonElement;
  const itemButton = document.getElementById('btn-expansion-gold-item') as HTMLButtonElement;
  let context: Context = { maxSlots: 20, gold: 0, level: 1, reborn: 0 };
  let quote: { cost: number; cashCost?: number } | undefined;
  let payment: InventoryExpansionPayment = 'gold';
  let pending = false, reviewing = false, timeout: number | undefined;
  const money = (value: number) => value.toLocaleString('pt-BR');
  function tier() { const next = getInventoryExpansion(context.maxSlots); return next && { ...next, ...quote }; }
  function blocked() {
    const next = tier();
    if (!transport.isReady()) return 'Conecte ao servidor para expandir.';
    if (!next) return context.maxSlots >= INVENTORY_MAX_SLOTS ? 'Capacidade máxima atingida.' : 'Reconecte para sincronizar a capacidade.';
    if (next.premium && payment === 'cash') {
      if (!next.cashCost) return 'Compra com Cash indisponível.';
      if ((context.cash ?? 0) < next.cashCost) return `Faltam ${money(next.cashCost - (context.cash ?? 0))} Cash. Saldo: ${money(context.cash ?? 0)} Cash.`;
      return '';
    }
    if (context.gold < next.cost) return `Faltam ${money(next.cost - context.gold)} ouro. Custo: ${money(next.cost)} ouro.`;
    if (next.premium && (context.seals ?? 0) < 1) return 'Requer 1 Selo de Expansão Astral livre, além do ouro. Selos protegidos não são consumidos.';
    return '';
  }
  function render() {
    const next = tier(), reason = blocked();
    button.disabled = pending || !transport.isReady() || !next;
    label.textContent = next ? `+${next.slotsAdded} espaços` : 'Mochila completa';
    cost.textContent = pending ? 'Aguardando…' : next ? next.premium ? 'Cash ou Ouro + Selo' : `${money(next.cost)} G` : `${context.maxSlots} espaços`;
    button.title = next ? `Expandir ${context.maxSlots} → ${next.newMaxSlots} espaços · ${reason || 'Compra disponível'}` : 'Capacidade máxima';
    panel.hidden = !reviewing;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    confirm.disabled = pending || !!reason;
    cancel.disabled = pending;
    payments.hidden = !next?.premium;
    cashButton.disabled = pending || !next?.cashCost;
    itemButton.disabled = pending;
    cashButton.setAttribute('aria-pressed', String(payment === 'cash'));
    itemButton.setAttribute('aria-pressed', String(payment === 'gold_item'));
    cashButton.textContent = next?.cashCost ? `${money(next.cashCost)} Cash · saldo ${money(context.cash ?? 0)}` : 'Cash indisponível';
    itemButton.textContent = next ? `${money(next.cost)} G + 1 Selo · livres ${money(context.seals ?? 0)}` : 'Ouro + Selo';
    confirm.textContent = pending ? 'Expandindo…' : next ? payment === 'cash' ? `Comprar por ${money(next.cashCost ?? 0)} Cash` : `Comprar por ${money(next.cost)} G${next.premium ? ' + 1 Selo' : ''}` : 'Indisponível';
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
  cashButton.addEventListener('click', () => { if (!pending) { payment = 'cash'; render(); } });
  itemButton.addEventListener('click', () => { if (!pending) { payment = 'gold_item'; render(); } });
  confirm.addEventListener('click', () => {
    if (!reviewing || pending || blocked()) return;
    pending = true; render(); status.textContent = '';
    timeout = window.setTimeout(() => { pending = false; reviewing = false; render(); status.textContent = 'Sem confirmação. Confira a capacidade e o saldo antes de tentar novamente.'; }, 12000);
    transport.send(context.maxSlots, payment, payment === 'cash' ? tier()!.cashCost! : tier()!.cost);
  });
  render();
  return {
    requestConfirmation,
    setContext(next: Context) {
      if (context.maxSlots !== next.maxSlots) { quote = undefined; reviewing = false; payment = getInventoryExpansion(next.maxSlots)?.premium ? 'gold_item' : 'gold'; }
      context = { ...next }; render();
    },
    onResult(result: S2CExpandInventoryResultPayload) {
      window.clearTimeout(timeout); pending = false; reviewing = false;
      context.maxSlots = result.newMaxSlots; context.gold = result.remainingGold;
      if (result.cashBalance !== undefined) context.cash = result.cashBalance;
      if (result.sealsAvailable !== undefined) context.seals = result.sealsAvailable;
      payment = getInventoryExpansion(result.newMaxSlots)?.premium ? 'gold_item' : 'gold';
      quote = result.nextExpansionCost !== undefined
        ? { cost: result.nextExpansionCost, cashCost: result.nextExpansionCashCost ?? getInventoryExpansion(result.newMaxSlots)?.cashCost } : undefined;
      render(); status.textContent = result.message; status.dataset.state = result.success ? 'success' : 'error';
      transport.apply(result);
    },
    onDisconnected() { window.clearTimeout(timeout); pending = false; reviewing = false; quote = undefined; payment = 'gold'; context = { maxSlots: 20, gold: 0, level: 1, reborn: 0, cash: 0, seals: 0 }; render(); status.textContent = ''; },
  };
}
