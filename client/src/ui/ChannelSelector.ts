import {
  S2CChannelListPayload,
  S2CChangeChannelResultPayload,
  ChannelSummaryPayload,
} from '@magicforge/shared';
import { ClientNetwork } from '../network/ClientNetwork';

export class ChannelSelector {
  private network: ClientNetwork;
  private channelPillBtn: HTMLElement | null = null;
  private channelPillLabel: HTMLElement | null = null;
  private modalEl: HTMLElement | null = null;

  public currentChannelId: number = 1;
  public currentWorldIndex: number = 1;
  public cachedChannels: ChannelSummaryPayload[] = [];
  public isSwitching: boolean = false;

  constructor(network: ClientNetwork) {
    this.network = network;
    this.initDOM();
  }

  private initDOM(): void {
    const channelControl = document.getElementById('hud-channel-control');
    if (!channelControl) {
      return;
    }

    if (document.getElementById('btn-channel-pill')) {
      return;
    }

    this.channelPillBtn = document.createElement('button');
    this.channelPillBtn.id = 'btn-channel-pill';
    this.channelPillBtn.className = 'channel-pill-btn';
    this.channelPillBtn.title = 'Clique para ver e trocar de Canal';
    this.channelPillBtn.innerHTML = `
      <span id="channel-pill-label">Canal 1</span>
      <span style="font-size: 0.65rem; opacity: 0.8;">▾</span>
    `;

    channelControl.appendChild(this.channelPillBtn);
    this.channelPillLabel = this.channelPillBtn.querySelector('#channel-pill-label');

    this.channelPillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openModal();
    });
  }

  public openModal(): void {
    if (this.modalEl) return;

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'channel-selector-modal';
    this.modalEl.innerHTML = `
      <div class="channel-modal-card">
        <div class="channel-modal-header">
          <div class="channel-modal-title">
            <span>🌐</span> Canais do Mundo
          </div>
          <button id="channel-modal-close-btn" class="channel-modal-close" title="Fechar">✕</button>
        </div>
        <div style="font-size: 0.72rem; color: #94a3b8; line-height: 1.3;">
          Monstros e jogadores são instanciados por canal. Seu progresso, inventário e grupo são mantidos.
        </div>
        <div id="channel-modal-list" class="channel-list-container">
          <div style="text-align: center; color: #cbd5e1; font-size: 0.75rem; padding: 12px 0;">
            Carregando canais disponíveis...
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    this.modalEl.querySelector('#channel-modal-close-btn')?.addEventListener('click', () => {
      this.closeModal();
    });

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.closeModal();
      }
    });

    // Request fresh channels from server
    this.network.sendRequestChannelList();

    // If we have cached channels, render them immediately
    if (this.cachedChannels.length > 0) {
      this.renderList(this.cachedChannels);
    }
  }

  public closeModal(): void {
    if (this.modalEl && this.modalEl.parentElement) {
      this.modalEl.parentElement.removeChild(this.modalEl);
      this.modalEl = null;
    }
  }

  public onChannelList(payload: S2CChannelListPayload): void {
    this.currentChannelId = payload.currentChannelId;
    this.cachedChannels = payload.channels;
    this.updatePillLabel(payload.currentChannelId);

    if (this.modalEl) {
      this.renderList(payload.channels);
    }
  }

  public onChangeChannelResult(payload: S2CChangeChannelResultPayload): void {
    this.isSwitching = false;
    if (payload.success) {
      if (payload.channelId !== undefined) {
        this.currentChannelId = payload.channelId;
        this.updatePillLabel(payload.channelId);
      }
      this.closeModal();
    } else {
      if (this.modalEl) {
        const listEl = this.modalEl.querySelector('#channel-modal-list');
        if (listEl) {
          const errEl = document.createElement('div');
          errEl.style.cssText = 'color: #fca5a5; font-size: 0.75rem; text-align: center; margin-top: 6px;';
          errEl.textContent = `Erro ao trocar de canal: ${payload.message}`;
          listEl.appendChild(errEl);
        }
      }
    }
  }

  private updatePillLabel(channelId: number): void {
    if (!this.channelPillLabel) {
      this.channelPillLabel = document.getElementById('channel-pill-label');
    }
    if (this.channelPillLabel) {
      this.channelPillLabel.textContent = `Canal ${channelId}`;
    }
  }

  private renderList(channels: ChannelSummaryPayload[]): void {
    if (!this.modalEl) return;
    const listEl = this.modalEl.querySelector('#channel-modal-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    for (const ch of channels) {
      const isCurrent = ch.isCurrentChannel || ch.channelId === this.currentChannelId;
      const statusClass = (ch.loadStatus || 'LIVRE').toLowerCase();
      const statusText = ch.loadStatus === 'LOTADO' ? 'Lotado' : ch.loadStatus === 'POVOADO' ? 'Normal' : 'Livre';

      const row = document.createElement('div');
      row.className = `channel-item-row ${isCurrent ? 'is-current' : ''}`;
      row.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="channel-item-name">Canal ${ch.channelId}</span>
            <span class="channel-status-badge ${statusClass}">${statusText}</span>
          </div>
          <span style="font-size: 0.68rem; color: #94a3b8;">
            Jogadores: ${ch.activePlayers} / ${ch.maxPlayers}
          </span>
        </div>
        ${
          isCurrent
            ? `<span class="channel-btn-current">✔ Conectado</span>`
            : `<button class="channel-btn-switch" data-switch-to="${ch.channelId}">Trocar</button>`
        }
      `;

      listEl.appendChild(row);
    }

    // Switch buttons listeners
    const switchBtns = listEl.querySelectorAll('[data-switch-to]');
    switchBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.isSwitching) return;
        const targetId = parseInt((btn as HTMLElement).getAttribute('data-switch-to') || '1', 10);
        this.isSwitching = true;
        (btn as HTMLButtonElement).disabled = true;
        (btn as HTMLButtonElement).textContent = 'Conectando...';
        this.network.sendChangeChannel(targetId);
      });
    });
  }
}
