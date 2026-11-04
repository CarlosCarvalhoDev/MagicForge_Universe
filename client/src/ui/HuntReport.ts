import type { S2CHuntReportPayload } from '@magicforge/shared';

interface HuntReportTransport {
  isReady(): boolean;
  request(): void;
  reset(): void;
}

export function formatHuntDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 3600)}h ${Math.floor(total % 3600 / 60)}min ${total % 60}s`;
}

export function formatHuntReport(report: S2CHuntReportPayload): Record<string, string> {
  const number = (value: number) => value.toLocaleString('pt-BR');
  return {
    context: `${report.characterName} · Nv. ${report.level} · Mundo ${report.world}, fase ${report.stage} · Canal ${report.channel}`,
    duration: formatHuntDuration(report.elapsedSeconds),
    kills: number(report.kills), exp: number(report.combatExp), gold: number(report.lootGold),
    expRate: report.expPerHour === null ? 'Aguardando 1 min' : `${number(report.expPerHour)}/h`,
    goldRate: report.goldPerHour === null ? 'Aguardando 1 min' : `${number(report.goldPerHour)}/h`,
    dust: number(report.arcaneDustLoot ?? 0),
    dustRate: report.arcaneDustPerHour == null ? 'Aguardando 1 min' : `${number(report.arcaneDustPerHour)}/h`,
    hp: number(report.hpPotionsUsed), resource: number(report.resourcePotionsUsed), deaths: number(report.deaths),
    autoSales: number(report.autoSaleGold), manualSales: number(report.manualSaleGold),
  };
}

export function setupHuntReport(transport: HuntReportTransport) {
  const container = document.querySelector('#farm-helper-modal .modal-content');
  if (!container) throw new Error('Painel Farm não encontrado para o relatório de caçada.');
  const root = document.createElement('section');
  root.className = 'hunt-report';
  root.setAttribute('aria-label', 'Relatório de caçada');
  root.innerHTML = `
    <h3>Relatório de caçada</h3>
    <p data-hunt="context">Entre com um herói para iniciar a medição.</p>
    <dl>
      <div><dt>Tempo online</dt><dd data-hunt="duration">—</dd></div>
      <div><dt>Abates próprios</dt><dd data-hunt="kills">—</dd></div>
      <div><dt>EXP de combate</dt><dd data-hunt="exp">—</dd></div>
      <div><dt>Ouro coletado</dt><dd data-hunt="gold">—</dd></div>
      <div><dt>EXP por hora</dt><dd data-hunt="expRate">—</dd></div>
      <div><dt>Ouro por hora</dt><dd data-hunt="goldRate">—</dd></div>
      <div><dt>Pó Arcano coletado</dt><dd data-hunt="dust">—</dd></div>
      <div><dt>Pó Arcano por hora</dt><dd data-hunt="dustRate">—</dd></div>
      <div><dt>Poções de HP usadas</dt><dd data-hunt="hp">—</dd></div>
      <div><dt>Poções de recurso usadas</dt><dd data-hunt="resource">—</dd></div>
      <div><dt>Mortes</dt><dd data-hunt="deaths">—</dd></div>
      <div><dt>Ouro de auto-venda</dt><dd data-hunt="autoSales">—</dd></div>
      <div><dt>Ouro de venda/reciclagem</dt><dd data-hunt="manualSales">—</dd></div>
    </dl>
    <p>Taxas incluem combate online e chefes. Baú, prêmios e vendas ficam fora das taxas.
      EXP inclui sua parte do grupo; abates próprios contam o golpe final.</p>
    <p>Atualização a cada 5s. Reconectar inicia outra sessão. Para comparar builds, zere após trocar o equipamento.</p>
    <button type="button" class="btn-action-primary" data-hunt-reset disabled>Zerar medição</button>
    <p data-hunt-status role="status" aria-live="polite"></p>`;
  container.appendChild(root);
  const button = root.querySelector('[data-hunt-reset]') as HTMLButtonElement;
  const status = root.querySelector('[data-hunt-status]') as HTMLElement;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let awaitingReset = false;

  function clearWait() {
    clearTimeout(timeout);
    timeout = undefined;
    awaitingReset = false;
  }
  function clear() {
    clearWait();
    for (const element of root.querySelectorAll<HTMLElement>('[data-hunt]')) element.textContent = '—';
    root.querySelector('[data-hunt="context"]')!.textContent = 'Entre com um herói para iniciar a medição.';
    button.disabled = true;
    status.textContent = '';
  }
  button.addEventListener('click', () => {
    if (!transport.isReady() || awaitingReset) return;
    awaitingReset = true;
    button.disabled = true;
    status.textContent = 'Zerando medição no servidor…';
    timeout = setTimeout(() => {
      clearWait();
      button.disabled = !transport.isReady();
      status.textContent = 'Sem resposta. Abra o painel novamente para atualizar.';
    }, 6000);
    transport.reset();
  });
  return {
    onOpen() { if (transport.isReady()) transport.request(); },
    onCharacterLogin() { clear(); status.textContent = 'Carregando medição do servidor…'; if (transport.isReady()) transport.request(); },
    onDisconnected: clear,
    onReport(report: S2CHuntReportPayload) {
      if (!transport.isReady()) return;
      clearWait();
      const formatted = formatHuntReport(report);
      for (const element of root.querySelectorAll<HTMLElement>('[data-hunt]')) {
        element.textContent = formatted[element.dataset.hunt!] ?? '—';
      }
      button.disabled = false;
      status.textContent = report.elapsedSeconds < 60 ? 'Coletando amostra: taxas disponíveis após 1 minuto.' : 'Medição confirmada pelo servidor.';
    },
  };
}
