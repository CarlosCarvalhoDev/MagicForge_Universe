import { ITEMS_DATABASE, ItemType, type EquipmentAdvicePayload, type InventoryItemPayload } from '@magicforge/shared';

export function setupEquipmentAdvice(transport: { isReady(): boolean; request(): void; inspect(slot: number): void }) {
  const root = document.getElementById('equipment-advice-list')!;
  const status = document.getElementById('equipment-advice-status')!;
  const button = document.getElementById('btn-equipment-advice') as HTMLButtonElement;
  let signature = '', pending = false, timer: number | undefined;
  const clear = () => { window.clearTimeout(timer); pending = false; button.disabled = false; button.textContent = 'Ver melhorias'; };
  button.addEventListener('click', () => {
    if (pending || !transport.isReady()) return;
    pending = true; button.disabled = true; button.textContent = 'Consultando…';
    status.textContent = ''; root.replaceChildren();
    timer = window.setTimeout(() => { clear(); status.textContent = 'Sem resposta. Tente consultar novamente.'; }, 8000);
    transport.request();
  });
  return {
    sync(items: readonly InventoryItemPayload[]) {
      const next = JSON.stringify(items.filter(item => ITEMS_DATABASE[item.itemId]?.type === ItemType.EQUIPAMENTO));
      if (signature && signature !== next) { clear(); root.replaceChildren(); status.textContent = 'Equipamentos atualizados. Consulte as melhorias novamente.'; }
      signature = next;
    },
    onResult(payload: EquipmentAdvicePayload) {
      // A response invalidated by a newer inventory snapshot is not actionable.
      if (!pending) return;
      clear(); root.replaceChildren();
      status.textContent = payload.suggestions.length ? 'Ganhos sem perder bônus. Itens protegidos ficam fora das sugestões. Inspecione antes de equipar.' : 'Nenhuma melhoria sem perda de bônus disponível. Você ainda pode comparar outras trocas manualmente.';
      const labels: Record<string, string> = { forca: 'FOR', destreza: 'DES', constituicao: 'CON', inteligencia: 'INT', sabedoria: 'SAB', carisma: 'CAR', maxHp: 'Vida do item', maxResource: 'Recurso do item' };
      for (const suggestion of payload.suggestions) {
        const row = document.createElement('article'); row.className = 'equipment-advice-row';
        const title = document.createElement('strong'); title.textContent = ITEMS_DATABASE[suggestion.candidate.itemId].name + (suggestion.candidate.refineLevel ? ` +${suggestion.candidate.refineLevel}` : '');
        const previous = document.createElement('small'); previous.textContent = `Equipado: ${suggestion.equipped ? ITEMS_DATABASE[suggestion.equipped.itemId].name + (suggestion.equipped.refineLevel ? ` +${suggestion.equipped.refineLevel}` : '') : 'slot vazio'}`;
        const gains = document.createElement('span'); gains.textContent = Object.entries(suggestion.delta).filter(([, value]) => value! > 0).map(([key, value]) => `+${value} ${labels[key]}`).join(' · ');
        const inspect = document.createElement('button'); inspect.type = 'button'; inspect.textContent = 'Inspecionar';
        inspect.addEventListener('click', () => transport.inspect(suggestion.candidate.slotIndex));
        row.append(title, previous, gains, inspect); root.appendChild(row);
      }
    },
    reset() { clear(); signature = ''; root.replaceChildren(); status.textContent = ''; },
  };
}
