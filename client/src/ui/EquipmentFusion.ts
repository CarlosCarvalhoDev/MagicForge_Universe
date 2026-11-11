import { CharacterClass, FUSION_RECIPES, ITEMS_DATABASE, getFusionPreview, isFusionIngredient, type FusionRequest, type FusionResult, type InventoryItemPayload } from '@magicforge/shared';
import { renderEquipmentComparison } from './InventoryView';
import { createItemIcon } from './ItemIcon';

export function setupEquipmentFusion(transport: { isReady(): boolean; send(request: FusionRequest): void; inspect(instanceId: string): void; openFarm(): void }) {
  const select = document.getElementById('fusion-recipe') as HTMLSelectElement;
  const status = document.getElementById('fusion-status')!;
  const prepare = document.getElementById('fusion-prepare') as HTMLButtonElement;
  const confirm = document.getElementById('fusion-confirm') as HTMLButtonElement;
  const cancel = document.getElementById('fusion-cancel') as HTMLButtonElement;
  const inspection = document.getElementById('fusion-inspect-result') as HTMLButtonElement;
  let context = { items: [] as readonly InventoryItemPayload[], gold: 0, level: 1, classType: CharacterClass.GUERREIRO };
  let lastClass: CharacterClass | undefined, operation: FusionRequest | undefined, timer: number | undefined;
  let pending = false, uncertain = false, outputInstanceId: string | undefined;
  const recipe = () => FUSION_RECIPES[select.value];
  const text = (tag: string, value: string, parent: HTMLElement) => { const el = document.createElement(tag); el.textContent = value; parent.appendChild(el); return el; };
  function render() {
    if (lastClass !== context.classType) {
      select.replaceChildren();
      for (const value of Object.values(FUSION_RECIPES).filter(value => value.classes.includes(context.classType))) {
        const option = document.createElement('option'); option.value = value.id; option.textContent = value.name; select.appendChild(option);
      }
      lastClass = context.classType;
    }
    const current = recipe(); if (!current) return;
    const preview = getFusionPreview(current, context.items, context);
    const frozen = operation?.inputInstanceIds.map(id => context.items.find(item => item.instanceId === id));
    if (operation && !pending && !uncertain && (preview.reason || frozen?.some(item => !item || !isFusionIngredient(item, current)))) {
      operation = undefined; status.textContent = 'Os ingredientes ou requisitos mudaram. Revise a prévia novamente.';
    }
    const output = ITEMS_DATABASE[current.outputItemId];
    const outputLabel = document.getElementById('fusion-output')!;
    outputLabel.textContent = ` ${output.name} · ${output.rarity} · nível ${output.minLevel}`;
    outputLabel.prepend(createItemIcon(output.itemId));
    document.getElementById('fusion-cost')!.textContent = `${current.goldCost.toLocaleString('pt-BR')} ouro · saldo ${context.gold.toLocaleString('pt-BR')} · ${preview.eligible.length}/${current.inputCount} cópias livres`;
    const ingredients = document.getElementById('fusion-ingredients')!; ingredients.replaceChildren();
    const selected = operation ? operation.inputInstanceIds.map(id => context.items.find(item => item.instanceId === id)).filter((item): item is InventoryItemPayload => !!item) : preview.selected;
    for (const item of selected) text('li', ` ${ITEMS_DATABASE[item.itemId].name} · posição ${item.slotIndex + 1}`, ingredients).prepend(createItemIcon(item.itemId));
    for (const material of preview.materials) text('li', ` ${material.quantity}× ${ITEMS_DATABASE[material.itemId].name} · disponíveis ${material.available}`, ingredients).prepend(createItemIcon(material.itemId));
    document.getElementById('fusion-requirements')!.textContent = pending ? 'Aguardando confirmação do servidor…' : uncertain ? 'Resposta não recebida. Verifique o mesmo pedido antes de preparar outra fusão.' : preview.reason || 'Receita disponível. Confira as cópias e os materiais.';
    renderEquipmentComparison(document.getElementById('fusion-comparison')!, { itemId:current.outputItemId, slotIndex:0, quantity:1, isEquipped:false, refineLevel:0 }, context.items);
    document.getElementById('fusion-confirmation-summary')!.textContent = `Criar ${output.name}: ${current.inputCount} cópias listadas + ${current.goldCost.toLocaleString('pt-BR')} ouro + ${current.materials.map(material => `${material.quantity}× ${ITEMS_DATABASE[material.itemId].name}`).join(' + ')}. Esses ingredientes serão consumidos.`;
    select.disabled = !!operation;
    prepare.hidden = !!operation; prepare.disabled = !!preview.reason || !transport.isReady();
    document.getElementById('fusion-confirmation')!.hidden = !operation;
    confirm.disabled = pending || !transport.isReady();
    confirm.textContent = pending ? 'Reforjando…' : uncertain ? 'Verificar resultado' : `Consumir ${current.inputCount} cópias e reforjar`;
    cancel.disabled = pending || uncertain;
    inspection.hidden = !outputInstanceId;
  }
  select.addEventListener('change', () => { status.textContent = ''; outputInstanceId = undefined; render(); });
  prepare.addEventListener('click', () => {
    const current = recipe(); if (!current || !transport.isReady() || operation) return;
    const preview = getFusionPreview(current, context.items, context);
    if (preview.reason) return;
    operation = { requestId: crypto.randomUUID(), recipeId:current.id, recipeVersion:current.version, inputInstanceIds:preview.selected.map(item=>item.instanceId!) };
    status.textContent = 'Confira as cópias e os custos. Os ingredientes serão consumidos ao confirmar.'; render();
  });
  cancel.addEventListener('click', () => { if (!pending && !uncertain) { operation = undefined; status.textContent = ''; render(); } });
  confirm.addEventListener('click', () => {
    if (!operation || pending || !transport.isReady()) return;
    render(); if (!operation) return;
    pending = true; render();
    timer = window.setTimeout(() => { pending = false; uncertain = true; render(); }, 10000);
    transport.send({ ...operation, inputInstanceIds:[...operation.inputInstanceIds] });
  });
  inspection.addEventListener('click', () => { if (outputInstanceId) transport.inspect(outputInstanceId); });
  document.getElementById('fusion-open-farm')!.addEventListener('click', () => transport.openFarm());
  return {
    setContext(next: typeof context) { context = next; render(); },
    onOpen() { render(); },
    onResult(result: FusionResult) {
      if (result.requestId !== operation?.requestId) return;
      window.clearTimeout(timer); pending = false; uncertain = false; operation = undefined;
      outputInstanceId = result.success ? result.outputInstanceId : undefined;
      status.textContent = result.message; status.dataset.state = result.success ? 'success' : 'error'; render();
    },
    onDisconnected() { window.clearTimeout(timer); const unknown = pending || uncertain; pending = false; uncertain = false; operation = undefined; outputInstanceId = undefined; status.textContent = unknown ? 'Reconecte e confira a mochila: o último pedido pode ter sido concluído.' : ''; render(); },
  };
}
