import type { S2COfflineRewardInfoPayload, S2COfflineRewardsClaimedPayload } from '@magicforge/shared';

export interface OfflineRewardTransport {
  isReady(): boolean;
  claim(multiplier?: number): void;
  openInventory?(): void;
}

export function formatOfflineDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  if (minutes > 0) {
    return `${minutes}min ${secs}s`;
  }
  return `${secs}s`;
}

export function formatOfflineLimit(payload: S2COfflineRewardInfoPayload): string {
  const limit = payload.maxOfflineSeconds ?? 8 * 3600;
  return `Limite: ${formatOfflineDuration(limit)} · Tempo recompensado: ${formatOfflineDuration(payload.cappedSeconds)}`;
}

export class OfflineRewardModal {
  private dialog: HTMLDialogElement;
  private transport: OfflineRewardTransport;
  private pendingPayload: S2COfflineRewardInfoPayload | null = null;
  private isClaiming: boolean = false;

  constructor(transport: OfflineRewardTransport) {
    this.transport = transport;
    this.dialog = this.createOrGetDialog();
  }

  private createOrGetDialog(): HTMLDialogElement {
    let existing = document.getElementById('offline-reward-dialog') as HTMLDialogElement | null;
    if (existing) return existing;

    const dialog = document.createElement('dialog');
    dialog.id = 'offline-reward-dialog';
    dialog.className = 'offline-reward-dialog modal-content';
    dialog.innerHTML = `
      <div class="offline-reward-container">
        <header class="offline-header">
          <div class="offline-icon-crest">⏳</div>
          <h2 class="offline-title">Baú do Tempo</h2>
          <span class="offline-subtitle">Progresso e Recompensas AFK</span>
        </header>

        <div class="offline-time-banner">
          <span class="offline-time-label">Tempo Ausente:</span>
          <span class="offline-time-value" id="offline-time-text">0min</span>
          <span class="offline-time-cap" id="offline-time-cap-text"></span>
        </div>

        <div class="offline-rewards-grid">
          <div class="offline-card reward-gold">
            <span class="reward-icon">🪙</span>
            <div class="reward-info">
              <span class="reward-label">Ouro Acumulado</span>
              <span class="reward-amount" id="offline-gold-text">+0</span>
            </div>
          </div>

          <div class="offline-card reward-exp">
            <span class="reward-icon">⭐</span>
            <div class="reward-info">
              <span class="reward-label">EXP Acumulada</span>
              <span class="reward-amount" id="offline-exp-text">+0</span>
            </div>
          </div>
        </div>

        <div class="offline-loot-section" id="offline-loot-container" style="display: none;">
          <h4 class="offline-loot-title">📦 Materiais & Suprimentos</h4>
          <div class="offline-loot-list" id="offline-loot-list"></div>
        </div>

        <footer class="offline-actions">
          <p id="offline-claim-status" role="status" aria-live="polite"></p>
          <button type="button" class="btn-rpg-runic btn-claim-offline" id="btn-claim-offline">
            ✨ Coletar Recompensas
          </button>
          <button type="button" class="btn-rpg-runic" id="btn-organize-offline">Organizar mochila</button>
        </footer>
      </div>
    `;

    document.body.appendChild(dialog);

    const claimBtn = dialog.querySelector('#btn-claim-offline') as HTMLButtonElement;
    claimBtn.addEventListener('click', () => this.handleClaim());
    dialog.querySelector('#btn-organize-offline')?.addEventListener('click', () => {
      if (this.isClaiming) return;
      this.close();
      this.transport.openInventory?.();
    });

    return dialog;
  }

  public show(payload: S2COfflineRewardInfoPayload): void {
    this.pendingPayload = payload;
    this.isClaiming = false;

    const timeText = this.dialog.querySelector('#offline-time-text') as HTMLElement;
    const capText = this.dialog.querySelector('#offline-time-cap-text') as HTMLElement;
    const statusText = this.dialog.querySelector('#offline-claim-status') as HTMLElement;
    const goldText = this.dialog.querySelector('#offline-gold-text') as HTMLElement;
    const expText = this.dialog.querySelector('#offline-exp-text') as HTMLElement;
    const lootContainer = this.dialog.querySelector('#offline-loot-container') as HTMLElement;
    const lootList = this.dialog.querySelector('#offline-loot-list') as HTMLElement;
    const claimBtn = this.dialog.querySelector('#btn-claim-offline') as HTMLButtonElement;

    if (timeText) {
      timeText.textContent = formatOfflineDuration(payload.offlineSeconds);
    }
    if (capText) capText.textContent = formatOfflineLimit(payload);
    if (statusText) statusText.textContent = '';

    if (goldText) {
      goldText.textContent = `+${payload.accumulatedGold.toLocaleString('pt-BR')} Ouro`;
    }

    if (expText) {
      expText.textContent = `+${payload.accumulatedExp.toLocaleString('pt-BR')} EXP`;
    }

    if (lootContainer && lootList) {
      if (payload.lootPreview && payload.lootPreview.length > 0) {
        lootContainer.style.display = 'block';
        lootList.innerHTML = '';
        for (const item of payload.lootPreview) {
          const itemEl = document.createElement('div');
          itemEl.className = 'offline-loot-item';
          itemEl.innerHTML = `
            <span class="item-name">${item.name}</span>
            <span class="item-qty">x${item.quantity}</span>
          `;
          lootList.appendChild(itemEl);
        }
      } else {
        lootContainer.style.display = 'none';
      }
    }

    if (claimBtn) {
      claimBtn.disabled = false;
      claimBtn.textContent = '✨ Coletar Recompensas';
    }

    if (!this.dialog.open) {
      this.dialog.showModal();
    }
  }

  private handleClaim(): void {
    if (this.isClaiming || !this.transport.isReady() || !this.pendingPayload) return;

    this.isClaiming = true;
    const claimBtn = this.dialog.querySelector('#btn-claim-offline') as HTMLButtonElement;
    if (claimBtn) {
      claimBtn.disabled = true;
      claimBtn.textContent = 'Coletando...';
    }

    this.transport.claim(1);
  }

  public onClaimed(result: S2COfflineRewardsClaimedPayload): void {
    this.isClaiming = false;
    if (!result.success) {
      const status = this.dialog.querySelector('#offline-claim-status') as HTMLElement;
      if (status) status.textContent = result.message;
      const button = this.dialog.querySelector('#btn-claim-offline') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = '✨ Coletar Recompensas';
      }
      return;
    }
    this.pendingPayload = null;

    if (this.dialog.open) {
      this.dialog.close();
    }
  }

  public close(): void {
    if (this.dialog.open) {
      this.dialog.close();
    }
  }

  public isOpen(): boolean {
    return this.dialog.open;
  }

  public reopen(): void {
    if (this.pendingPayload) this.show(this.pendingPayload);
  }
}

