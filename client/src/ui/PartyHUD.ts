import {
  S2CPartyUpdatePayload,
  S2CPartyInviteReceivedPayload,
  S2CPartyActionResultPayload,
  PartyMemberPayload,
} from '@magicforge/shared';
import { ClientNetwork } from '../network/ClientNetwork';

export class PartyHUD {
  private network: ClientNetwork;
  private rootCard: HTMLElement | null = null;
  private inviteModal: HTMLElement | null = null;
  private toastContainer: HTMLElement | null = null;
  private activeActionMenu: HTMLElement | null = null;

  public currentParty: S2CPartyUpdatePayload | null = null;
  public localPlayerId: string | null = null;
  public localPlayerName: string | null = null;

  private isCollapsed: boolean = false;
  private inviteTimerId: number | null = null;

  constructor(network: ClientNetwork) {
    this.network = network;
    this.initDOM();
  }

  private initDOM(): void {
    if (document.getElementById('party-hud-card')) {
      return;
    }

    // Party HUD Card
    this.rootCard = document.createElement('div');
    this.rootCard.id = 'party-hud-card';
    this.rootCard.className = 'glass-panel';
    document.body.appendChild(this.rootCard);

    // Toast Container
    this.toastContainer = document.getElementById('party-toast-container');
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'party-toast-container';
      document.body.appendChild(this.toastContainer);
    }

    // Close action menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.activeActionMenu && !this.activeActionMenu.contains(e.target as Node)) {
        this.closeActionMenu();
      }
    });

    this.render();
  }

  public setLocalPlayer(playerId: string | null, playerName: string | null): void {
    this.localPlayerId = playerId;
    this.localPlayerName = playerName;
    this.render();
  }

  public onPartyUpdate(payload: S2CPartyUpdatePayload): void {
    if (payload.members.length === 0) {
      this.currentParty = null;
    } else {
      this.currentParty = payload;
    }
    this.render();
  }

  public onPartyInviteReceived(payload: S2CPartyInviteReceivedPayload): void {
    this.showInvitePrompt(payload);
  }

  public onPartyActionResult(payload: S2CPartyActionResultPayload): void {
    this.showToast(payload.message, payload.success ? 'success' : 'error');
  }

  public showToast(message: string, _type: 'success' | 'error' | 'info' = 'info'): void {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'party-toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 3200);
  }

  private showInvitePrompt(payload: S2CPartyInviteReceivedPayload): void {
    this.dismissInvitePrompt();

    this.inviteModal = document.createElement('div');
    this.inviteModal.id = 'party-invite-prompt-modal';

    let countdown = 15;
    this.inviteModal.innerHTML = `
      <div class="party-invite-title">
        <span>⚔️</span> Convite de Grupo
      </div>
      <div class="party-invite-text">
        <span class="party-invite-highlight">${this.escapeHtml(payload.inviterName)}</span> 
        (Nv. ${payload.inviterLevel} ${payload.inviterClass}) convidou você para o grupo!
        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 4px;">Expira em <span id="party-invite-countdown">${countdown}s</span></div>
      </div>
      <div class="party-invite-buttons">
        <button id="party-btn-accept" class="party-invite-btn-accept">✔ Aceitar</button>
        <button id="party-btn-decline" class="party-invite-btn-decline">✖ Recusar</button>
      </div>
    `;

    document.body.appendChild(this.inviteModal);

    const btnAccept = this.inviteModal.querySelector('#party-btn-accept') as HTMLButtonElement | null;
    const btnDecline = this.inviteModal.querySelector('#party-btn-decline') as HTMLButtonElement | null;
    const countdownEl = this.inviteModal.querySelector('#party-invite-countdown') as HTMLElement | null;

    btnAccept?.addEventListener('click', () => {
      this.network.sendPartyRespondInvite(payload.inviterId, true);
      this.dismissInvitePrompt();
    });

    btnDecline?.addEventListener('click', () => {
      this.network.sendPartyRespondInvite(payload.inviterId, false);
      this.dismissInvitePrompt();
    });

    this.inviteTimerId = window.setInterval(() => {
      countdown--;
      if (countdownEl) countdownEl.textContent = `${countdown}s`;
      if (countdown <= 0) {
        this.network.sendPartyRespondInvite(payload.inviterId, false);
        this.dismissInvitePrompt();
      }
    }, 1000);
  }

  private dismissInvitePrompt(): void {
    if (this.inviteTimerId !== null) {
      clearInterval(this.inviteTimerId);
      this.inviteTimerId = null;
    }
    if (this.inviteModal && this.inviteModal.parentElement) {
      this.inviteModal.parentElement.removeChild(this.inviteModal);
      this.inviteModal = null;
    }
  }

  private toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    if (this.rootCard) {
      this.rootCard.classList.toggle('collapsed', this.isCollapsed);
    }
    this.render();
  }

  private closeActionMenu(): void {
    if (this.activeActionMenu && this.activeActionMenu.parentElement) {
      this.activeActionMenu.parentElement.removeChild(this.activeActionMenu);
      this.activeActionMenu = null;
    }
  }

  private promptInvitePlayer(): void {
    const name = window.prompt('Digite o nome do jogador para convidar ao grupo:');
    if (name && name.trim().length > 0) {
      this.network.sendPartyInvite(name.trim());
      this.showToast(`Convite enviado para "${name.trim()}"...`, 'info');
    }
  }

  public render(): void {
    if (!this.rootCard) return;
    this.closeActionMenu();

    const party = this.currentParty;
    const isLeader = party ? party.leaderId === this.localPlayerId : false;
    const memberCount = party ? party.members.length : 0;

    let headerHtml = `
      <div class="party-hud-header">
        <div class="party-hud-title">
          <span>👥</span> ${party ? `GRUPO (${memberCount}/4)` : 'GRUPO'}
        </div>
        <button id="party-btn-toggle" class="party-hud-toggle-btn" title="Minimizar/Expandir">
          ${this.isCollapsed ? '▾' : '▴'}
        </button>
      </div>
    `;

    if (!party || party.members.length <= 1) {
      // Solo / Sem Grupo
      this.rootCard.innerHTML = `
        ${headerHtml}
        <div class="party-solo-view">
          <div class="party-solo-hint">Jogue em grupo para ganhar +10% de EXP compartilhada por aliado próximo (até 25m).</div>
          <button id="party-btn-solo-invite" class="party-btn-quick-invite">
            <span>➕</span> Convidar Jogador
          </button>
        </div>
      `;

      this.rootCard.querySelector('#party-btn-toggle')?.addEventListener('click', () => this.toggleCollapse());
      this.rootCard.querySelector('#party-btn-solo-invite')?.addEventListener('click', () => this.promptInvitePlayer());
      return;
    }

    // Com Grupo Ativo
    let membersHtml = `<div class="party-members-list">`;
    for (const member of party.members) {
      const isMemberLeader = member.playerId === party.leaderId || member.isLeader;
      const isLocal = member.playerId === this.localPlayerId;
      const hpPercent = Math.max(0, Math.min(100, Math.round((member.currentHp / Math.max(1, member.maxHp)) * 100)));
      const mpPercent = Math.max(0, Math.min(100, Math.round((member.currentResource / Math.max(1, member.maxResource)) * 100)));
      const isLowHp = hpPercent < 25;

      membersHtml += `
        <div class="party-member-card ${isLocal ? 'is-local' : ''} ${isMemberLeader ? 'is-leader' : ''}" data-player-id="${member.playerId}">
          <div class="party-member-top">
            <div class="party-member-info">
              ${isMemberLeader ? '<span class="party-member-crown" title="Líder do Grupo">👑</span>' : ''}
              <span class="party-member-name" title="${this.escapeHtml(member.name)}">${this.escapeHtml(member.name)}</span>
              <span class="party-member-level">Nv.${member.level}</span>
            </div>
            ${isLeader && !isLocal ? `
              <button class="party-member-actions-btn" data-action-btn="${member.playerId}" title="Gerenciar Membro">⋮</button>
            ` : ''}
          </div>
          <div class="party-vitals-container">
            <div class="party-bar-track">
              <div class="party-bar-fill-hp ${isLowHp ? 'low' : ''}" style="width: ${hpPercent}%"></div>
            </div>
            <div class="party-bar-numbers">
              <span>HP</span>
              <span>${member.currentHp} / ${member.maxHp}</span>
            </div>
            <div class="party-bar-track">
              <div class="party-bar-fill-mp" style="width: ${mpPercent}%"></div>
            </div>
            <div class="party-bar-numbers">
              <span>MP</span>
              <span>${member.currentResource} / ${member.maxResource}</span>
            </div>
          </div>
        </div>
      `;
    }
    membersHtml += `</div>`;

    // Footer actions
    let footerHtml = `
      <div class="party-footer-actions">
        ${memberCount < 4 ? `
          <button id="party-btn-add-more" class="party-btn-secondary" title="Convidar mais aliados">
            <span>➕</span> Convidar
          </button>
        ` : ''}
        <button id="party-btn-leave-party" class="party-btn-secondary party-btn-leave" title="Sair do Grupo">
          🚪 Sair
        </button>
        ${isLeader ? `
          <button id="party-btn-disband-party" class="party-btn-secondary party-btn-leave" title="Desfazer Grupo">
            💥 Desfazer
          </button>
        ` : ''}
      </div>
    `;

    this.rootCard.innerHTML = `
      ${headerHtml}
      ${membersHtml}
      ${footerHtml}
    `;

    // Hook listeners
    this.rootCard.querySelector('#party-btn-toggle')?.addEventListener('click', () => this.toggleCollapse());
    this.rootCard.querySelector('#party-btn-add-more')?.addEventListener('click', () => this.promptInvitePlayer());

    this.rootCard.querySelector('#party-btn-leave-party')?.addEventListener('click', () => {
      if (window.confirm('Deseja realmente sair do grupo?')) {
        this.network.sendPartyLeave();
      }
    });

    this.rootCard.querySelector('#party-btn-disband-party')?.addEventListener('click', () => {
      if (window.confirm('Deseja realmente desfazer o grupo para todos os membros?')) {
        this.network.sendPartyDisband();
      }
    });

    // Member action buttons (leader options)
    const actionBtns = this.rootCard.querySelectorAll('[data-action-btn]');
    actionBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = (btn as HTMLElement).getAttribute('data-action-btn');
        if (!targetId) return;
        const targetMember = party.members.find((m) => m.playerId === targetId);
        if (targetMember) {
          this.openMemberActionMenu(btn as HTMLElement, targetMember);
        }
      });
    });
  }

  private openMemberActionMenu(anchorBtn: HTMLElement, member: PartyMemberPayload): void {
    this.closeActionMenu();

    const menu = document.createElement('div');
    menu.className = 'party-action-menu';
    menu.innerHTML = `
      <button id="menu-promote" class="party-action-menu-item">👑 Promover a Líder</button>
      <button id="menu-kick" class="party-action-menu-item danger">🚪 Expulsar do Grupo</button>
    `;

    anchorBtn.parentElement?.appendChild(menu);
    this.activeActionMenu = menu;

    menu.querySelector('#menu-promote')?.addEventListener('click', () => {
      if (window.confirm(`Passar a liderança do grupo para ${member.name}?`)) {
        this.network.sendPartyPromote(member.playerId);
      }
      this.closeActionMenu();
    });

    menu.querySelector('#menu-kick')?.addEventListener('click', () => {
      if (window.confirm(`Expulsar ${member.name} do grupo?`)) {
        this.network.sendPartyKick(member.playerId);
      }
      this.closeActionMenu();
    });
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
