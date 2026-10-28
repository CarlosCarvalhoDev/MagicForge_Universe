import type { LeaderboardCategory, LeaderboardEntryPayload, S2CLeaderboardUpdatePayload } from '@magicforge/shared';

const categories: Record<LeaderboardCategory, string> = { COMBAT_POWER: 'Poder de Combate', LEVEL: 'Nível e Prestígio', STAGE: 'Mundos e Fases', GOLD: 'Ouro' };
export function leaderboardScore(entry: LeaderboardEntryPayload, category: LeaderboardCategory): string {
  switch (category) {
    case 'COMBAT_POWER': return entry.combatPower.toLocaleString('pt-BR') + ' CP';
    case 'LEVEL': return 'Reborn ' + entry.rebornCount + ' · Nv. ' + entry.level;
    case 'STAGE': return 'Mundo ' + entry.currentWorld + ' · Fase ' + entry.currentStage;
    case 'GOLD': return entry.gold.toLocaleString('pt-BR') + ' ouro';
  }
}
export function setupLeaderboard(transport: { isReady(): boolean; request(category: LeaderboardCategory, limit: number): void }) {
  const dialog = document.getElementById('leaderboard-dialog') as HTMLDialogElement;
  const list = document.getElementById('leaderboard-entries')!;
  const personal = document.getElementById('leaderboard-personal')!;
  const status = document.getElementById('leaderboard-status')!;
  const refresh = document.getElementById('leaderboard-refresh') as HTMLButtonElement;
  const tabs = Array.from(dialog.querySelectorAll<HTMLButtonElement>('[data-ranking]'));
  let selected: LeaderboardCategory = 'COMBAT_POWER';
  let pending = false, timeout: number | undefined;
  function request(category: LeaderboardCategory) {
    if (!transport.isReady()) return;
    selected = category; pending = true; list.replaceChildren(); personal.textContent = 'Sua posição será atualizada com a resposta.';
    tabs.forEach(tab => { tab.setAttribute('aria-selected', String(tab.dataset.ranking === selected)); tab.disabled = tab.dataset.ranking === selected; });
    refresh.disabled = true; status.textContent = 'Carregando ' + categories[selected] + '…'; list.setAttribute('aria-busy', 'true');
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => { pending = false; refresh.disabled = false; tabs.forEach(tab => { tab.disabled = false; }); list.setAttribute('aria-busy', 'false'); status.textContent = 'Não foi possível atualizar. Tente novamente.'; }, 12000);
    transport.request(selected, 20);
  }
  tabs.forEach(tab => tab.addEventListener('click', () => request(tab.dataset.ranking as LeaderboardCategory)));
  refresh.addEventListener('click', () => { if (!pending) request(selected); });
  document.getElementById('leaderboard-close')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { window.clearTimeout(timeout); pending = false; });
  return {
    open() { if (!transport.isReady()) return; if (!dialog.open) dialog.showModal(); request(selected); },
    isOpen: () => dialog.open,
    onUpdate(data: S2CLeaderboardUpdatePayload) {
      if (!dialog.open || data.category !== selected || !transport.isReady()) return;
      window.clearTimeout(timeout); pending = false; refresh.disabled = false; tabs.forEach(tab => { tab.disabled = false; }); list.setAttribute('aria-busy', 'false');
      list.replaceChildren();
      // Preserve server order; LEVEL is ordered by Reborn before level.
      for (const entry of data.entries) {
        const row = document.createElement('tr');
        if (entry.characterId === data.myEntry?.characterId) row.classList.add('ranking-me');
        for (const text of ['#' + entry.rank, entry.name, entry.classType, 'Nv. ' + entry.level + ' · R' + entry.rebornCount, leaderboardScore(entry, selected), entry.honorTitle || '—']) {
          const cell = document.createElement('td'); cell.textContent = text; row.append(cell);
        }
        list.append(row);
      }
      personal.textContent = data.myRank !== undefined ? 'Sua posição: #' + data.myRank + (data.myEntry ? ' · ' + data.myEntry.name + ' · ' + leaderboardScore(data.myEntry, selected) + (data.myEntry.honorTitle ? ' · ' + data.myEntry.honorTitle : '') : '') : 'Sua posição ainda não está disponível nesta categoria.';
      status.textContent = data.entries.length ? data.entries.length + ' heróis no ranking' : 'Nenhum herói neste ranking.';
    },
    onDisconnected() { window.clearTimeout(timeout); pending = false; if (dialog.open) dialog.close(); list.replaceChildren(); personal.textContent = ''; },
  };
}
