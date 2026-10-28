import type { FarmHelperSettingsPayload, S2CFarmSettingsUpdatePayload, S2CAutoSalvageResultPayload } from '@magicforge/shared';

interface FarmTransport {
  isReady(): boolean;
  save(settings: FarmHelperSettingsPayload): void;
  salvage(includeRare: boolean): void;
}

/** Preferences are drafts until acknowledged; inventory/gold remain server-owned. */
export function setupFarmHelper(transport: FarmTransport) {
  const root = document.getElementById('farm-helper-modal')!;
  const input = (id: string) => document.getElementById(id) as HTMLInputElement;
  const hp = input('slider-auto-hp'), mp = input('slider-auto-mp');
  const hpEnabled = input('chk-auto-hp-enabled'), mpEnabled = input('chk-auto-mp-enabled');
  const common = input('chk-auto-sell-common'), uncommon = input('chk-auto-sell-uncommon'), rare = input('chk-auto-sell-rare');
  const loot = input('chk-auto-loot-enabled'), includeRare = input('chk-salvage-rare');
  const save = document.getElementById('btn-save-farm-helper') as HTMLButtonElement;
  const sell = document.getElementById('btn-auto-salvage') as HTMLButtonElement;
  const confirm = document.getElementById('btn-confirm-salvage') as HTMLButtonElement;
  const cancel = document.getElementById('btn-cancel-salvage') as HTMLButtonElement;
  const confirmation = document.getElementById('farm-salvage-confirm')!;
  const status = document.getElementById('farm-settings-status')!;
  const saleStatus = document.getElementById('farm-salvage-status')!;
  const controls = [hp, mp, hpEnabled, mpEnabled, common, uncommon, rare, loot, includeRare, save, sell, confirm, cancel];
  let confirmed: FarmHelperSettingsPayload | null = null;
  let pending: 'save' | 'sale' | null = null;
  let reviewingSale = false;
  let saleIncludesRare = false;
  let timeout: number | undefined;

  function labels() {
    document.getElementById('label-auto-hp')!.textContent = 'Usar se HP ≤ ' + hp.value + '%';
    document.getElementById('label-auto-mp')!.textContent = 'Usar se recurso ≤ ' + mp.value + '%';
  }
  function render(applyConfirmed = false) {
    if (applyConfirmed && confirmed) {
      hp.value = String(confirmed.autoHpPotionThreshold); mp.value = String(confirmed.autoMpPotionThreshold);
      hpEnabled.checked = confirmed.autoHpPotionEnabled; mpEnabled.checked = confirmed.autoMpPotionEnabled;
      common.checked = confirmed.autoSellCommon; uncommon.checked = confirmed.autoSellUncommon; rare.checked = confirmed.autoSellRare;
      loot.checked = confirmed.autoLootEnabled;
    }
    const disabled = !confirmed || !transport.isReady() || Boolean(pending);
    controls.forEach(control => { control.disabled = disabled; });
    hp.disabled = disabled || !hpEnabled.checked; mp.disabled = disabled || !mpEnabled.checked;
    includeRare.disabled = disabled || reviewingSale;
    sell.disabled = disabled || reviewingSale;
    confirmation.hidden = !reviewingSale || disabled;
    sell.setAttribute('aria-expanded', String(!confirmation.hidden));
    save.textContent = pending === 'save' ? 'Salvando…' : 'Salvar preferências';
    sell.textContent = pending === 'sale' ? 'Aguardando venda…' : 'Vender lixo';
    labels();
  }
  function finish() { window.clearTimeout(timeout); timeout = undefined; pending = null; render(); }
  function begin(action: 'save' | 'sale') {
    pending = action;
    reviewingSale = false;
    render();
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      finish();
      if (action === 'save') {
        render(true);
        status.textContent = 'Sem confirmação. Estes são os últimos valores confirmados; tente salvar novamente.';
      } else saleStatus.textContent = 'Venda sem confirmação. Confira a mochila antes de tentar novamente.';
    }, 12000);
  }
  hp.addEventListener('input', labels); mp.addEventListener('input', labels);
  hpEnabled.addEventListener('change', () => render()); mpEnabled.addEventListener('change', () => render());
  save.addEventListener('click', () => {
    if (!confirmed || pending || !transport.isReady()) return;
    const settings: FarmHelperSettingsPayload = {
      autoHpPotionEnabled: hpEnabled.checked, autoHpPotionThreshold: Math.min(90, Math.max(20, Number(hp.value))),
      autoMpPotionEnabled: mpEnabled.checked, autoMpPotionThreshold: Math.min(80, Math.max(20, Number(mp.value))),
      autoSellCommon: common.checked, autoSellUncommon: uncommon.checked, autoSellRare: rare.checked, autoLootEnabled: loot.checked,
    };
    begin('save'); status.textContent = 'Aguardando confirmação das preferências…';
    transport.save(settings);
  });
  sell.addEventListener('click', () => {
    if (!confirmed || pending || !transport.isReady()) return;
    reviewingSale = true; saleIncludesRare = includeRare.checked;
    document.getElementById('farm-salvage-summary')!.textContent = 'Confirmar venda de todos os itens ' +
      (saleIncludesRare ? 'comuns, incomuns e raros' : 'comuns e incomuns') + ' não equipados? Inclui consumíveis e materiais dessas raridades.';
    render(); cancel.focus();
  });
  cancel.addEventListener('click', () => { reviewingSale = false; render(); sell.focus(); });
  confirm.addEventListener('click', () => {
    if (!reviewingSale || !confirmed || pending || !transport.isReady()) return;
    begin('sale'); saleStatus.textContent = 'Aguardando resultado da venda…';
    transport.salvage(saleIncludesRare);
  });
  render();
  return {
    onOpen() { reviewingSale = false; render(!pending); },
    onCharacterLogin() {
      confirmed = null; reviewingSale = false; includeRare.checked = false;
      finish(); status.textContent = 'Carregando preferências deste herói…'; saleStatus.textContent = '';
    },
    onDisconnected() {
      confirmed = null; reviewingSale = false; includeRare.checked = false;
      finish(); status.textContent = 'Entre com um herói para carregar as preferências.'; saleStatus.textContent = '';
    },
    onSettingsUpdate(payload: S2CFarmSettingsUpdatePayload) {
      if (!transport.isReady()) return;
      confirmed = { ...payload.settings };
      if (pending === 'save') finish();
      render(true);
      status.textContent = payload.message || 'Preferências confirmadas pelo servidor.';
    },
    onSalvageResult(payload: S2CAutoSalvageResultPayload) {
      if (!transport.isReady()) return;
      if (pending === 'sale') finish();
      saleStatus.textContent = payload.itemsSold > 0 ? payload.itemsSold.toLocaleString('pt-BR') + ' itens vendidos · +' +
        payload.goldEarned.toLocaleString('pt-BR') + ' ouro · saldo ' + payload.newGoldTotal.toLocaleString('pt-BR') : payload.message;
    },
    onError(message: string) {
      if (!pending) return;
      const action = pending; finish();
      (action === 'save' ? status : saleStatus).textContent = message || 'Não foi possível concluir a ação.';
    },
  };
}
