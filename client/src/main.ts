import {
  CharacterClass,
  CharacterAttributes,
  CLASS_DEFINITIONS,
  PrimaryStatType,
  distance,
  SKILLS_DATABASE,
  SkillDefinition,
  S2CSkillCastEventPayload,
  ITEMS_DATABASE,
  InventoryItemPayload,
  RARITY_COLORS,
  ItemType,
  ItemRarity,
  EquipmentSlot,
  S2CInventoryUpdatePayload,
  CLASS_STAT_GROWTH,
  getDefaultSkillsForClass,
  getSkillsForClass,
  getSkillChoicesForSlot,
  S2CSkillsUpdatePayload,
  CARDS_DATABASE,
  CardAlbumEntryPayload,
  S2CRefineResultPayload,
  S2CSocketResultPayload,
  S2CCardsUpdatePayload,
  S2CFarmSettingsUpdatePayload,
} from '@magicforge/shared';
import { ClientNetwork } from './network/ClientNetwork';
import { SnapshotBuffer, InterpolatedEntity } from './interpolation/SnapshotBuffer';
import { GameRenderer } from './renderer/GameRenderer';
import { IdleMath } from './idle/IdleMath';
import { combatTriggersAttack, SkillRejectionEchoFilter } from './renderer/WarriorPresentation';
import { worldAppearance } from './renderer/WorldPresentation';
import { setupAuthSelection } from './ui/AuthSelection';
import { getGuestCredential } from './ui/GuestSession';
import { setupFarmHelper } from './ui/FarmHelper';
import { setupInventoryExpansion } from './ui/InventoryExpansion';
import { setupLeaderboard } from './ui/Leaderboard';
import { setupCinematicIntro } from './ui/CinematicIntro';
import { setupBossNarrative } from './ui/BossNarrative';
import './ui/auth-selection.css';
import './ui/progression.css';
import './ui/narrative.css';

// DOM Elements
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const statusDot = document.getElementById('status-dot') as HTMLDivElement | null;
const connectionStatus = document.getElementById('connection-status') as HTMLSpanElement | null;
const pingText = document.getElementById('ping-text') as HTMLSpanElement | null;
const tickText = document.getElementById('tick-text') as HTMLSpanElement | null;
const fpsText = document.getElementById('fps-text') as HTMLSpanElement | null;

// Gold & Inventory DOM
const playerGoldText = document.getElementById('player-gold-text') as HTMLSpanElement | null;
const btnOpenInventory = document.getElementById('btn-open-inventory') as HTMLButtonElement | null;
const btnCloseInventory = document.getElementById('btn-close-inventory') as HTMLButtonElement | null;
const inventoryModal = document.getElementById('inventory-modal') as HTMLDivElement | null;
const inventorySlotsGrid = document.getElementById('inventory-slots-grid') as HTMLDivElement | null;
const inventoryGoldLabel = document.getElementById('inventory-gold-label') as HTMLSpanElement | null;
const modalCpText = document.getElementById('modal-cp-text') as HTMLElement | null;
const inspectorIcon = document.getElementById('inspector-icon') as HTMLDivElement | null;
const inspectorName = document.getElementById('inspector-name') as HTMLSpanElement | null;
const inspectorTag = document.getElementById('inspector-tag') as HTMLSpanElement | null;
const inspectorStatsList = document.getElementById('inspector-stats-list') as HTMLDivElement | null;
const inspectorDesc = document.getElementById('inspector-desc') as HTMLParagraphElement | null;
const inspectorSellPrice = document.getElementById('inspector-sell-price') as HTMLElement | null;
const btnInventoryAction = document.getElementById('btn-inventory-action') as HTMLButtonElement | null;
const btnInventoryDiscard = document.getElementById('btn-inventory-discard') as HTMLButtonElement | null;
const inventoryCapacityText = document.getElementById('inventory-capacity-text') as HTMLSpanElement | null;
const bossTimerBanner = document.getElementById('boss-timer-banner') as HTMLDivElement | null;
const bossBannerName = document.getElementById('boss-banner-name') as HTMLSpanElement | null;
const bossBannerTimer = document.getElementById('boss-banner-timer') as HTMLSpanElement | null;
const btnEnterPortal = document.getElementById('btn-enter-portal') as HTMLButtonElement | null;
const enterPortalLabel = document.getElementById('enter-portal-label') as HTMLSpanElement | null;

const charNameInput = document.getElementById('char-name') as HTMLInputElement;
const charClassSelect = document.getElementById('char-class') as HTMLSelectElement;
const classPortraitImg = document.getElementById('class-portrait-img') as HTMLImageElement | null;
const classPreviewTitle = document.getElementById('class-preview-title') as HTMLSpanElement | null;
const classPreviewStats = document.getElementById('class-preview-stats') as HTMLSpanElement | null;
const btnConnect = document.getElementById('btn-connect') as HTMLButtonElement;
const toggleInterpolation = document.getElementById('toggle-interpolation') as HTMLInputElement;
const toggleRawGhost = document.getElementById('toggle-raw-ghost') as HTMLInputElement;
const sliderDelay = document.getElementById('slider-delay') as HTMLInputElement;
const delayLabel = document.getElementById('delay-label') as HTMLSpanElement;

// Vitals HUD DOM Elements (Null-guarded for mobile UI layout)
const playerHpBar = document.getElementById('player-hp-bar') as HTMLDivElement | null;
const playerHpText = document.getElementById('player-hp-text') as HTMLSpanElement | null;
const playerResourceBar = document.getElementById('player-resource-bar') as HTMLDivElement | null;
const playerResourceText = document.getElementById('player-resource-text') as HTMLSpanElement | null;
const playerResourceLabel = document.getElementById('player-resource-label') as HTMLDivElement | null;

const targetVitalRow = document.getElementById('target-vital-row') as HTMLDivElement | null;
const targetNameLabel = document.getElementById('target-name-label') as HTMLDivElement | null;
const targetLevelBadge = document.getElementById('target-level-badge') as HTMLSpanElement | null;
const targetHpBar = document.getElementById('target-hp-bar') as HTMLDivElement | null;
const targetHpText = document.getElementById('target-hp-text') as HTMLSpanElement | null;

// Level & EXP HUD Elements & State
const playerLevelBadge = document.getElementById('player-level-badge') as HTMLSpanElement | null;
const hudPlayerName = document.getElementById('hud-player-name') as HTMLSpanElement | null;
const hudCpVal = document.getElementById('hud-cp-val') as HTMLSpanElement | null;
const playerExpBar = document.getElementById('player-exp-bar') as HTMLDivElement | null;
const playerExpText = document.getElementById('player-exp-text') as HTMLSpanElement | null;

// Top-Left Hero Card DOM (Ragnarok Mobile / Stickman Go Style)
const hudHeroPortrait = document.getElementById('hud-hero-portrait') as HTMLImageElement | null;
const hudHeroLevel = document.getElementById('hud-hero-level') as HTMLSpanElement | null;
const hudHeroLevelPill = document.getElementById('hud-hero-level-pill') as HTMLSpanElement | null;
const hudHeroName = document.getElementById('hud-hero-name') as HTMLSpanElement | null;
const hudCpBig = document.getElementById('hud-cp-big') as HTMLSpanElement | null;
const hudHeroHpBar = document.getElementById('hud-hero-hp-bar') as HTMLDivElement | null;
const hudHeroHpText = document.getElementById('hud-hero-hp-text') as HTMLSpanElement | null;
const hudHeroMpBar = document.getElementById('hud-hero-mp-bar') as HTMLDivElement | null;
const hudHeroMpText = document.getElementById('hud-hero-mp-text') as HTMLSpanElement | null;
const hudAvatarBtn = document.getElementById('hud-avatar-btn') as HTMLDivElement | null;

// Mobile Bottom-Center & Ragnarok Combat Arc Controls
const btnToggleAuto = document.getElementById('btn-toggle-auto') as HTMLButtonElement | null;
const autoStatusText = document.getElementById('auto-status-text') as HTMLSpanElement | null;
const autoStatusIcon = document.getElementById('auto-status-icon') as HTMLSpanElement | null;
const btnOpenFarmGear = document.getElementById('btn-open-farm-gear') as HTMLButtonElement | null;
const btnQuickHp = document.getElementById('btn-quick-hp') as HTMLDivElement | null;
const quickHpCount = document.getElementById('quick-hp-count') as HTMLSpanElement | null;
const btnQuickMp = document.getElementById('btn-quick-mp') as HTMLDivElement | null;
const quickMpCount = document.getElementById('quick-mp-count') as HTMLSpanElement | null;
const btnPrimaryAttack = document.getElementById('btn-primary-attack') as HTMLButtonElement | null;
const chatMessagesContainer = document.getElementById('chat-messages-container') as HTMLDivElement | null;
const virtualJoystickZone = document.getElementById('virtual-joystick-zone') as HTMLDivElement | null;
const joystickBase = document.getElementById('joystick-base') as HTMLDivElement | null;
const joystickThumb = document.getElementById('joystick-thumb') as HTMLDivElement | null;

// Top-Center Stage Progression & Top-Right Cards
const stageWorldTitle = document.getElementById('stage-world-title') as HTMLSpanElement | null;
const stagePhaseBadge = document.getElementById('stage-phase-badge') as HTMLSpanElement | null;
const stageProgressFill = document.getElementById('stage-progress-fill') as HTMLDivElement | null;
const stageProgressCounter = document.getElementById('stage-progress-counter') as HTMLSpanElement | null;
const btnBossChallenge = document.getElementById('btn-boss-challenge') as HTMLButtonElement | null;
const currentStageBadge = document.getElementById('current-stage-badge') as HTMLSpanElement | null;
const zoneLocationTitle = document.getElementById('zone-location-title') as HTMLSpanElement | null;
const btnPowerSave = document.getElementById('btn-power-save') as HTMLButtonElement | null;
const inspectorRecyclePreview = document.getElementById('inspector-recycle-preview') as HTMLElement | null;

// Mobile Dock Navigation Buttons
const btnDockCharacter = document.getElementById('btn-dock-character') as HTMLButtonElement | null;
const btnDockInventory = document.getElementById('btn-dock-inventory') as HTMLButtonElement | null;
const btnDockSkillbook = document.getElementById('btn-dock-skillbook') as HTMLButtonElement | null;
const btnDockFarm = document.getElementById('btn-dock-farm') as HTMLButtonElement | null;
const btnDockRanking = document.getElementById('btn-dock-ranking') as HTMLButtonElement | null;

// Character (Paperdoll) Modal Elements
const characterModal = document.getElementById('character-modal') as HTMLDivElement | null;
const btnCloseCharacter = document.getElementById('btn-close-character') as HTMLButtonElement | null;
const paperdollCpValue = document.getElementById('paperdoll-cp-value') as HTMLDivElement | null;
const statForca = document.getElementById('stat-forca') as HTMLSpanElement | null;
const statDestreza = document.getElementById('stat-destreza') as HTMLSpanElement | null;
const statConstituicao = document.getElementById('stat-constituicao') as HTMLSpanElement | null;
const statInteligencia = document.getElementById('stat-inteligencia') as HTMLSpanElement | null;
const statSabedoria = document.getElementById('stat-sabedoria') as HTMLSpanElement | null;
const statCarisma = document.getElementById('stat-carisma') as HTMLSpanElement | null;
const paperdollMaxHp = document.getElementById('paperdoll-max-hp') as HTMLElement | null;
const paperdollBaseDamage = document.getElementById('paperdoll-base-damage') as HTMLElement | null;
const paperdollAttackRange = document.getElementById('paperdoll-attack-range') as HTMLElement | null;
const paperdollCrit = document.getElementById('paperdoll-crit') as HTMLElement | null;

// Farm Helper Modal Elements
const farmHelperModal = document.getElementById('farm-helper-modal') as HTMLDivElement | null;
const btnCloseFarm = document.getElementById('btn-close-farm') as HTMLButtonElement | null;

// Quick Use Toast Notification
const quickUseToast = document.getElementById('quick-use-toast') as HTMLDivElement | null;
const quickUseIcon = document.getElementById('quick-use-icon') as HTMLDivElement | null;
const quickUseName = document.getElementById('quick-use-name') as HTMLSpanElement | null;
const btnQuickUseAction = document.getElementById('btn-quick-use-action') as HTMLButtonElement | null;

let playerLevel: number = 1;
let playerRebornCount = 0;
let inventoryExpansion: ReturnType<typeof setupInventoryExpansion> | undefined;
function refreshExpansionContext() {
  inventoryExpansion?.setContext({ maxSlots: playerMaxInventorySlots, gold: playerGold, level: playerLevel, reborn: playerRebornCount });
}
let playerCurrentXp: number = 0;
let playerXpToNextLevel: number = 150;

function updateExpBarUI(level: number, currentXp: number, xpToNextLevel: number): void {
  const pct = xpToNextLevel > 0 ? ((currentXp / xpToNextLevel) * 100).toFixed(1) : '100.0';
  if (playerExpBar) playerExpBar.style.width = `${Math.min(100, Math.max(0, Number(pct)))}%`;
  if (playerExpText) playerExpText.textContent = `XP [Nv. ${level}] ${currentXp} / ${xpToNextLevel} (${pct}%)`;
}

let bannerTimeout: number | null = null;
function showLevelUpBanner(level: number, attrs: CharacterAttributes): void {
  const banner = document.getElementById('levelup-banner');
  const subtitle = document.getElementById('levelup-subtitle');
  const stats = document.getElementById('levelup-stats');
  if (!banner || !subtitle || !stats) return;

  subtitle.textContent = `Você alcançou o Nível ${level}!`;
  stats.textContent = `FOR ${attrs.forca} • DES ${attrs.destreza} • CON ${attrs.constituicao} • INT ${attrs.inteligencia} • SAB ${attrs.sabedoria} • CAR ${attrs.carisma}`;

  banner.classList.add('active');

  if (bannerTimeout) clearTimeout(bannerTimeout);
  bannerTimeout = window.setTimeout(() => {
    banner.classList.remove('active');
  }, 4500);
}

// Skill Slots UI References
interface SkillSlotUI {
  button: HTMLButtonElement;
  img: HTMLImageElement;
  cost: HTMLSpanElement;
  overlay: HTMLDivElement;
  cdText: HTMLSpanElement;
  definition: SkillDefinition | null;
}

const skillSlots: Record<number, SkillSlotUI> = {
  1: {
    button: document.getElementById('skill-btn-1') as HTMLButtonElement,
    img: document.getElementById('skill-img-1') as HTMLImageElement,
    cost: document.getElementById('skill-cost-1') as HTMLSpanElement,
    overlay: document.getElementById('skill-cd-overlay-1') as HTMLDivElement,
    cdText: document.getElementById('skill-cd-text-1') as HTMLSpanElement,
    definition: null,
  },
  2: {
    button: document.getElementById('skill-btn-2') as HTMLButtonElement,
    img: document.getElementById('skill-img-2') as HTMLImageElement,
    cost: document.getElementById('skill-cost-2') as HTMLSpanElement,
    overlay: document.getElementById('skill-cd-overlay-2') as HTMLDivElement,
    cdText: document.getElementById('skill-cd-text-2') as HTMLSpanElement,
    definition: null,
  },
  3: {
    button: document.getElementById('skill-btn-3') as HTMLButtonElement,
    img: document.getElementById('skill-img-3') as HTMLImageElement,
    cost: document.getElementById('skill-cost-3') as HTMLSpanElement,
    overlay: document.getElementById('skill-cd-overlay-3') as HTMLDivElement,
    cdText: document.getElementById('skill-cd-text-3') as HTMLSpanElement,
    definition: null,
  },
  4: {
    button: document.getElementById('skill-btn-4') as HTMLButtonElement,
    img: document.getElementById('skill-img-4') as HTMLImageElement,
    cost: document.getElementById('skill-cost-4') as HTMLSpanElement,
    overlay: document.getElementById('skill-cd-overlay-4') as HTMLDivElement,
    cdText: document.getElementById('skill-cd-text-4') as HTMLSpanElement,
    definition: null,
  },
};

// Cooldown map: slot -> timestamp (ms) when cooldown expires
const cooldownMap = new Map<number, number>();

// Active Equipped Skills (Slot 1..4 -> skillId)
let playerEquippedSkills: Record<number, string> = {};
let myPlayerClass: CharacterClass = CharacterClass.GUERREIRO;

// Skill Book (Grimório D&D 5E) Modal Elements & Logic
const skillbookModal = document.getElementById('skillbook-modal') as HTMLDivElement | null;
const btnOpenSkillbook = document.getElementById('btn-open-skillbook') as HTMLButtonElement | null;
const btnCloseSkillbook = document.getElementById('btn-close-skillbook') as HTMLButtonElement | null;
const skillbookClassBadge = document.getElementById('skillbook-class-badge') as HTMLSpanElement | null;
const skillbookSlotsContainer = document.getElementById('skillbook-slots-container') as HTMLDivElement | null;

const SLOT_CONFIGS = [
  { slot: 1, circleName: '1º Círculo — Habilidades Iniciais', unlockLevel: 1, tierClass: 'tier-1' },
  { slot: 2, circleName: '2º Círculo — Técnicas de 1º Grau', unlockLevel: 10, tierClass: 'tier-2' },
  { slot: 3, circleName: '3º Círculo — Técnicas Avançadas', unlockLevel: 25, tierClass: 'tier-3' },
  { slot: 4, circleName: '4º Círculo — Habilidade Suprema (Ultimate)', unlockLevel: 50, tierClass: 'tier-4' },
];

function updateEquippedSkillsUI() {
  const currentClass = myPlayerClass || (charClassSelect.value as CharacterClass) || CharacterClass.GUERREIRO;
  const defaults = getDefaultSkillsForClass(currentClass);

  for (let slot = 1; slot <= 4; slot++) {
    const skillId = playerEquippedSkills[slot] || defaults[slot];
    const s = SKILLS_DATABASE[skillId] || SKILLS_DATABASE[`${currentClass.toLowerCase()}_${slot}`];
    const slotCfg = SLOT_CONFIGS.find((c) => c.slot === slot);
    const unlockLvl = slotCfg ? slotCfg.unlockLevel : s ? s.unlockLevel : 1;
    const isSlotUnlocked = playerLevel >= unlockLvl;
    const slotUI = skillSlots[slot];

    if (slotUI && s) {
      slotUI.definition = s;
      slotUI.img.src = `/assets/skills/${s.skillId}.png`;
      slotUI.img.alt = s.name;
      slotUI.img.onerror = () => {
        slotUI.img.style.display = 'none';
        let fallback = slotUI.button.querySelector('.skill-emoji-fallback') as HTMLSpanElement;
        if (!fallback) {
          fallback = document.createElement('span');
          fallback.className = 'skill-emoji-fallback';
          fallback.style.fontSize = '24px';
          fallback.style.position = 'absolute';
          slotUI.button.appendChild(fallback);
        }
        fallback.textContent = s.iconEmoji || '⚔️';
      };
      slotUI.img.onload = () => {
        slotUI.img.style.display = 'block';
        const fallback = slotUI.button.querySelector('.skill-emoji-fallback') as HTMLSpanElement;
        if (fallback) fallback.remove();
      };

      let lockOverlay = slotUI.button.querySelector('.slot-lock-overlay') as HTMLDivElement | null;

      if (!isSlotUnlocked) {
        slotUI.button.classList.add('slot-locked');
        if (!lockOverlay) {
          lockOverlay = document.createElement('div');
          lockOverlay.className = 'slot-lock-overlay';
          slotUI.button.appendChild(lockOverlay);
        }
        lockOverlay.innerHTML = `<span class="lock-icon">🔒</span><span class="lock-lvl">Nv.${unlockLvl}</span>`;
        slotUI.cost.textContent = `Nv.${unlockLvl}`;
        slotUI.cost.style.color = '#94a3b8';
        slotUI.button.title = `🔒 Slot ${slot} Bloqueado (Libera no Nível ${unlockLvl})\nToque para abrir o Grimório e ver as 3 opções deste slot.`;
      } else {
        slotUI.button.classList.remove('slot-locked');
        if (lockOverlay) lockOverlay.remove();
        slotUI.cost.textContent = `${s.cost} ${s.resourceType === 'Energia' ? 'EN' : 'MP'}`;
        slotUI.cost.style.color = s.resourceType === 'Energia' ? '#facc15' : '#38bdf8';
        slotUI.button.title = `[Slot ${s.slot} • ${s.tierName || `Tier ${s.tier}`}] ${s.name}\nCusto: ${s.cost} ${s.resourceType} • Recarga: ${s.cooldownSec}s • Alcance: ${s.range}m\n${s.description}`;
      }
    }
  }

  // Atualiza também o Grimório se estiver aberto
  if (skillbookModal && skillbookModal.style.display === 'flex') {
    renderGrimorioSkills(currentClass);
  }
}

function updateSkillsForClass(chosenClass: CharacterClass) {
  myPlayerClass = chosenClass;
  if (!playerEquippedSkills || Object.keys(playerEquippedSkills).length === 0) {
    playerEquippedSkills = getDefaultSkillsForClass(chosenClass);
  }
  updateEquippedSkillsUI();
}

function openSkillbook() {
  const currentClass = myPlayerClass || (charClassSelect.value as CharacterClass) || CharacterClass.GUERREIRO;
  renderGrimorioSkills(currentClass);
  if (skillbookModal) skillbookModal.style.display = 'flex';
}

function closeSkillbook() {
  if (skillbookModal) skillbookModal.style.display = 'none';
}

if (btnOpenSkillbook) btnOpenSkillbook.addEventListener('click', () => openSkillbook());
if (btnCloseSkillbook) btnCloseSkillbook.addEventListener('click', closeSkillbook);
if (skillbookModal) {
  skillbookModal.addEventListener('click', (e) => {
    if (e.target === skillbookModal) closeSkillbook();
  });
}

function renderGrimorioSkills(classType: CharacterClass) {
  if (!skillbookSlotsContainer) return;
  skillbookSlotsContainer.innerHTML = '';

  const classDef = CLASS_DEFINITIONS[classType];
  if (skillbookClassBadge) {
    skillbookClassBadge.textContent = classDef ? classDef.displayName : classType;
  }

  const defaults = getDefaultSkillsForClass(classType);

  SLOT_CONFIGS.forEach((cfg) => {
    const isUnlocked = playerLevel >= cfg.unlockLevel;
    const equippedSkillId = playerEquippedSkills[cfg.slot] || defaults[cfg.slot];
    const equippedSkill = SKILLS_DATABASE[equippedSkillId];

    const slotSection = document.createElement('div');
    slotSection.className = `grimorio-slot-section ${isUnlocked ? 'unlocked' : 'locked'}`;

    const header = document.createElement('div');
    header.className = 'grimorio-slot-header';
    header.innerHTML = `
      <div class="slot-header-title-box">
        <span class="slot-circle-pill ${cfg.tierClass}">Slot ${cfg.slot}</span>
        <span class="slot-header-name">${cfg.circleName}</span>
      </div>
      <div class="slot-header-status">
        <span style="color: ${isUnlocked ? '#34d399' : '#f87171'}; font-weight: 700;">
          ${isUnlocked ? `✓ Slot Liberado • Escolha 1 das 3` : `🔒 Slot libera no Nível ${cfg.unlockLevel}`}
        </span>
        ${isUnlocked && equippedSkill ? `<span class="slot-equipped-indicator">Ativa: <strong>${equippedSkill.name}</strong></span>` : ''}
      </div>
    `;
    slotSection.appendChild(header);

    // Filtra exatamente as 3 opções únicas deste slot
    const slotSkills = getSkillChoicesForSlot(classType, cfg.slot);

    const cardsRow = document.createElement('div');
    cardsRow.className = 'slot-cards-row';

    slotSkills.forEach((s) => {
      const isEquipped = isUnlocked && equippedSkillId === s.skillId;
      const canEquip = isUnlocked;

      let role = 'Ofensivo';
      let roleClass = 'ofensivo';
      const descLower = s.description.toLowerCase();
      if (s.isHeal || descLower.includes('cura') || descLower.includes('regenera') || descLower.includes('vida')) {
        role = 'Sustento';
        roleClass = 'sustento';
      } else if (descLower.includes('defesa') || descLower.includes('escudo') || descLower.includes('armadura') || descLower.includes('esquiva')) {
        role = 'Defensivo';
        roleClass = 'defensivo';
      } else if (descLower.includes('atordoa') || descLower.includes('lentidão') || descLower.includes('silêncio') || descLower.includes('provoca')) {
        role = 'Controle';
        roleClass = 'controle';
      }

      const card = document.createElement('div');
      card.className = `skill-card-v2 ${isEquipped ? 'is-equipped' : ''}`;
      card.innerHTML = `
        <div class="skill-v2-top">
          <div class="skill-v2-img-wrap">
            <img src="/assets/skills/${s.skillId}.png" alt="${s.name}" class="skill-v2-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <span class="skill-v2-emoji-icon" style="display: none;">${s.iconEmoji || '⚔️'}</span>
          </div>
          <div class="skill-v2-header-info">
            <span class="skill-v2-title" title="${s.name}">${s.name}</span>
            <div class="skill-v2-tags-row">
              <span class="skill-role-badge ${roleClass}">${role}</span>
              <span class="skill-scaling-badge">${s.damageType}</span>
            </div>
            <div class="skill-v2-meta-chips">
              <span class="v2-chip cost">${s.cost} ${s.resourceType}</span>
              <span class="v2-chip cd">⏱️ ${s.cooldownSec}s CD</span>
              <span class="v2-chip area">${s.range === 0 ? 'Pessoal' : s.isAoe ? `Área (${s.aoeRadius || 5}m)` : `${s.range}m`}</span>
            </div>
          </div>
        </div>
        <p class="skill-v2-desc">${s.description}</p>
        <button class="btn-equip-skill ${isEquipped ? 'active' : canEquip ? 'equip' : 'locked'}" ${isEquipped || !canEquip ? 'disabled' : ''}>
          ${isEquipped ? `✓ SELECIONADA NO SLOT ${cfg.slot}` : canEquip ? `⚔️ SELECIONAR PARA O SLOT ${cfg.slot}` : `🔒 LIBERA COM O SLOT (NV. ${cfg.unlockLevel})`}
        </button>
      `;

      const btn = card.querySelector('.btn-equip-skill') as HTMLButtonElement;
      if (btn && !isEquipped && canEquip) {
        btn.addEventListener('click', () => {
          equipSkill(cfg.slot, s.skillId);
        });
      }

      cardsRow.appendChild(card);
    });

    slotSection.appendChild(cardsRow);
    skillbookSlotsContainer.appendChild(slotSection);
  });
}

function equipSkill(slot: number, skillId: string) {
  const skill = SKILLS_DATABASE[skillId];
  if (!skill) return;

  // Atualização otimista imediata no cliente
  playerEquippedSkills[slot] = skillId;
  updateEquippedSkillsUI();
  renderGrimorioSkills(myPlayerClass);

  // Envia pacote autoritativo ao servidor
  network.sendEquipSkill(slot, skillId);

  // Notificação no chat
  addChatMessage('Sistema', `✦ Habilidade [${skill.name}] equipada com sucesso no Slot ${slot}!`, 'sys');
}

function updateClassPreview() {
  const chosenClass = (charClassSelect.value as CharacterClass) || CharacterClass.GUERREIRO;
  const def = CLASS_DEFINITIONS[chosenClass];
  if (!def) return;

  if (classPortraitImg) {
    classPortraitImg.src = `/assets/portraits/${chosenClass}.jpg`;
  }
  if (classPreviewTitle) {
    classPreviewTitle.textContent = `${def.displayName} (${def.isRanged ? 'Ranged' : 'Melee'} ${def.attackRange}m)`;
  }
  if (classPreviewStats) {
    const s = def.baseStats;
    const hp = s.constituicao * 35 + 450;
    let mod = s.forca;
    if (def.mainStat === PrimaryStatType.DESTREZA) mod = s.destreza;
    else if (def.mainStat === PrimaryStatType.INTELIGENCIA) mod = s.inteligencia;
    else if (def.mainStat === PrimaryStatType.SABEDORIA) mod = s.sabedoria;
    else if (def.mainStat === PrimaryStatType.CARISMA) mod = s.carisma;
    else if (def.mainStat === PrimaryStatType.FORCA_E_CARISMA) mod = s.forca + s.carisma;
    const dmg = mod * 3 + 5;
    const cp = (s.forca + s.destreza + s.constituicao + s.inteligencia + s.sabedoria + s.carisma) * 15 + 100;
    classPreviewStats.textContent = `HP: ${hp} • Dano: ${dmg} • CP: ${cp}`;
  }

  updateSkillsForClass(chosenClass);
}

charClassSelect.addEventListener('change', updateClassPreview);
updateClassPreview();

// Inventory State & UI Management
let playerInventory: InventoryItemPayload[] = [];
let playerMaxInventorySlots: number = 20;
let playerGold: number = 0;
let playerCombatPower: number = 1000;
let selectedSlotIndex: number | null = null;

function getItemEmoji(itemId: string, type: ItemType): string {
  if (itemId === 'gold') return '💰';
  if (itemId.includes('stone_forge')) return '💎';
  if (itemId.includes('gem_ruby')) return '🔴';
  if (itemId.includes('gem_sapphire')) return '🔵';
  if (itemId.includes('gem_emerald')) return '🟢';
  if (itemId.includes('gem_topaz')) return '🟡';
  if (itemId.includes('arcane_dust')) return '✨';
  if (itemId.includes('hp')) return '🧪';
  if (itemId.includes('mp')) return '💧';
  if (itemId.includes('sword') || itemId.includes('dagger') || itemId.includes('greatsword')) return '⚔️';
  if (itemId.includes('bow')) return '🏹';
  if (itemId.includes('staff')) return '🪄';
  if (itemId.includes('tome')) return '📜';
  if (itemId.includes('armor')) return '🦺';
  if (itemId.includes('shield')) return '🛡️';
  if (itemId.includes('relic')) return '👑';
  if (itemId.includes('essence') || itemId.includes('rune')) return '✨';
  if (itemId.includes('ore')) return '💎';
  if (itemId.includes('fang')) return '🐺';
  if (type === ItemType.CONSUMIVEL) return '🧪';
  if (type === ItemType.EQUIPAMENTO) return '⚔️';
  return '📦';
}

let currentSubmenuTab: 'mochila' | 'refino' | 'pedras' | 'cartas' = 'mochila';
let playerCards: CardAlbumEntryPayload[] = [];
let selectedRefineSlot: number | null = null;
let selectedGemItemId: string | null = null;

function switchSubmenuTab(tabName: 'mochila' | 'refino' | 'pedras' | 'cartas') {
  currentSubmenuTab = tabName;
  const tabBtns: Record<string, string> = {
    mochila: 'tab-btn-mochila',
    refino: 'tab-btn-refino',
    pedras: 'tab-btn-pedras',
    cartas: 'tab-btn-cartas',
  };
  const tabPanels: Record<string, string> = {
    mochila: 'tab-mochila',
    refino: 'tab-refino',
    pedras: 'tab-pedras',
    cartas: 'tab-cartas',
  };

  Object.entries(tabBtns).forEach(([k, btnId]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      if (k === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  Object.entries(tabPanels).forEach(([k, panelId]) => {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.style.display = k === tabName ? 'flex' : 'none';
    }
  });

  if (tabName === 'refino') {
    updateRefinementView();
  } else if (tabName === 'pedras') {
    updatePedrasView();
  } else if (tabName === 'cartas') {
    network.sendRequestCardAlbum();
    updateCartasView();
  }
}

function updateRefinementView() {
  const refinoItemName = document.getElementById('refino-item-name');
  const refinoItemIcon = document.getElementById('refino-item-icon');
  const refinoTierCurr = document.getElementById('refino-tier-curr');
  const refinoTierNext = document.getElementById('refino-tier-next');
  const refinoStatsDiff = document.getElementById('refino-stats-diff');
  const refinoCostBox = document.querySelector('.refino-cost-box .cost-items');
  const btnDoRefine = document.getElementById('btn-do-refine') as HTMLButtonElement | null;

  // Find target item
  let targetItem = playerInventory.find((i) => i.slotIndex === selectedRefineSlot);
  if (!targetItem || ITEMS_DATABASE[targetItem.itemId]?.type !== ItemType.EQUIPAMENTO) {
    targetItem = playerInventory.find((i) => i.isEquipped && ITEMS_DATABASE[i.itemId]?.type === ItemType.EQUIPAMENTO) ||
                 playerInventory.find((i) => ITEMS_DATABASE[i.itemId]?.type === ItemType.EQUIPAMENTO);
  }

  if (!targetItem) {
    if (refinoItemName) refinoItemName.textContent = 'Nenhum equipamento selecionado';
    if (refinoItemIcon) refinoItemIcon.textContent = '⚔️';
    if (refinoTierCurr) refinoTierCurr.textContent = '+0';
    if (refinoTierNext) refinoTierNext.textContent = '+1';
    if (btnDoRefine) {
      btnDoRefine.disabled = true;
      btnDoRefine.textContent = 'SELECIONE UM EQUIPAMENTO NA MOCHILA';
    }
    return;
  }

  selectedRefineSlot = targetItem.slotIndex;
  const def = ITEMS_DATABASE[targetItem.itemId]!;
  const currentLevel = targetItem.refineLevel || 0;
  const nextLevel = currentLevel + 1;

  if (refinoItemName) {
    const rarityTheme = RARITY_COLORS[def.rarity] || { text: '#fff' };
    refinoItemName.textContent = `${def.name} (+${currentLevel})`;
    refinoItemName.style.color = rarityTheme.text;
  }
  if (refinoItemIcon) refinoItemIcon.textContent = getItemEmoji(def.itemId, def.type);
  if (refinoTierCurr) refinoTierCurr.textContent = `+${currentLevel}`;
  if (refinoTierNext) refinoTierNext.textContent = currentLevel >= 15 ? 'MAX' : `+${nextLevel}`;

  // Costs & Success rates based on D&D 5E table
  let stoneId = 'stone_forge_common';
  let stoneCount = 1;
  let goldCost = 250;
  let successRate = 100;
  let warnDrop = false;

  if (currentLevel < 3) {
    stoneId = 'stone_forge_common';
    stoneCount = 1;
    goldCost = 250;
    successRate = 100;
  } else if (currentLevel < 6) {
    stoneId = 'stone_forge_common';
    stoneCount = 2;
    goldCost = 500;
    successRate = 85;
  } else if (currentLevel < 9) {
    stoneId = 'stone_forge_rare';
    stoneCount = 3;
    goldCost = 1000;
    successRate = 60;
  } else if (currentLevel < 12) {
    stoneId = 'stone_forge_rare';
    stoneCount = 4;
    goldCost = 2500;
    successRate = 40;
    warnDrop = true;
  } else if (currentLevel < 15) {
    stoneId = 'stone_forge_mystic';
    stoneCount = 5;
    goldCost = 5000;
    successRate = 20;
    warnDrop = true;
  }

  const stoneDef = ITEMS_DATABASE[stoneId];
  const stoneName = stoneDef ? stoneDef.name : 'Pedra de Refinamento';
  const stoneEmoji = stoneDef?.icon || '💎';
  const playerStones = playerInventory
    .filter((i) => i.itemId === stoneId)
    .reduce((sum, i) => sum + i.quantity, 0);

  const hasStone = playerStones >= stoneCount;
  const hasGold = playerGold >= goldCost;

  if (refinoStatsDiff) {
    const currPct = currentLevel * 8;
    const nextPct = (currentLevel + 1) * 8;
    refinoStatsDiff.innerHTML = `
      <div class="stat-diff-row"><span>Bônus de Atributos:</span><strong style="color: #34d399;">+${currPct}% ➔ +${nextPct}% (+8%)</strong></div>
      <div class="stat-diff-row"><span>Taxa de Sucesso:</span><strong style="color: ${successRate >= 80 ? '#34d399' : successRate >= 50 ? '#fbbf24' : '#f87171'};">${currentLevel >= 15 ? 'MÁXIMO' : `${successRate}%`}</strong></div>
      ${warnDrop ? `<div class="stat-diff-row" style="color: #f87171; font-size: 0.72rem;"><span>⚠️ Risco de Falha:</span><strong>Reduz -1 nível se falhar</strong></div>` : ''}
    `;
  }

  if (refinoCostBox) {
    if (currentLevel >= 15) {
      refinoCostBox.innerHTML = `<span class="cost-item" style="color: #fbbf24;">✨ Equipamento no Refinamento Máximo (+15)!</span>`;
    } else {
      refinoCostBox.innerHTML = `
        <span class="cost-item" style="color: ${hasStone ? '#e2e8f0' : '#f87171'};">${stoneEmoji} ${stoneCount}x ${stoneName} (${playerStones}/${stoneCount})</span>
        <span class="cost-item gold" style="color: ${hasGold ? '#fbbf24' : '#f87171'};">💰 ${goldCost.toLocaleString('pt-BR')} Ouro</span>
      `;
    }
  }

  if (btnDoRefine) {
    if (currentLevel >= 15) {
      btnDoRefine.disabled = true;
      btnDoRefine.textContent = '⭐ NÍVEL MÁXIMO (+15) ATINGIDO';
      btnDoRefine.style.opacity = '0.6';
    } else {
      btnDoRefine.disabled = !hasStone || !hasGold;
      btnDoRefine.style.opacity = (!hasStone || !hasGold) ? '0.6' : '1';
      btnDoRefine.textContent = `🔨 APRIMORAR EQUIPAMENTO (+${nextLevel})`;
    }
  }
}

function updatePedrasView() {
  const socketsGrid = document.querySelector('.pedras-sockets-grid');
  const gemBagList = document.getElementById('gem-bag-list');
  const btnSocketGem = document.getElementById('btn-socket-gem') as HTMLButtonElement | null;

  // Find target equipment
  let targetItem = playerInventory.find((i) => i.slotIndex === selectedRefineSlot);
  if (!targetItem || ITEMS_DATABASE[targetItem.itemId]?.type !== ItemType.EQUIPAMENTO) {
    targetItem = playerInventory.find((i) => i.isEquipped && ITEMS_DATABASE[i.itemId]?.type === ItemType.EQUIPAMENTO) ||
                 playerInventory.find((i) => ITEMS_DATABASE[i.itemId]?.type === ItemType.EQUIPAMENTO);
  }

  if (!targetItem) {
    if (socketsGrid) socketsGrid.innerHTML = '<div style="color: #94a3b8; font-size: 0.8rem; padding: 12px;">Selecione um equipamento na Mochila para engastar gemas.</div>';
    if (gemBagList) gemBagList.innerHTML = '<span style="color: #64748b; font-size: 0.75rem;">Nenhum equipamento selecionado</span>';
    if (btnSocketGem) btnSocketGem.disabled = true;
    return;
  }

  selectedRefineSlot = targetItem.slotIndex;
  const targetSockets = targetItem.sockets || [];

  // Render 3 sockets
  if (socketsGrid) {
    socketsGrid.innerHTML = '';
    for (let s = 0; s < 3; s++) {
      const sock = targetSockets.find((x) => x.socketIndex === s);
      const slotEl = document.createElement('div');
      slotEl.className = 'socket-slot';
      slotEl.id = `socket-slot-${s + 1}`;

      if (sock) {
        const gemDef = ITEMS_DATABASE[sock.gemId];
        const gemIcon = gemDef?.icon || '💎';
        const gemName = gemDef?.name || sock.gemId;
        let effect = '';
        if (gemDef?.statsBonus) {
          effect = Object.entries(gemDef.statsBonus).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ');
        }
        slotEl.innerHTML = `
          <span class="gem-icon">${gemIcon}</span>
          <div class="gem-info">
            <span class="gem-name" style="color: #38bdf8;">${gemName} (Soquete ${s + 1})</span>
            <span class="gem-effect" style="color: #34d399;">${effect || 'Atributos Extras'}</span>
          </div>
        `;
      } else {
        slotEl.innerHTML = `
          <span class="gem-icon">⚪</span>
          <div class="gem-info">
            <span class="gem-name">Soquete ${s + 1} Vazio</span>
            <span class="gem-effect" style="color: #94a3b8;">Selecione uma gema abaixo para engastar</span>
          </div>
        `;
      }
      socketsGrid.appendChild(slotEl);
    }
  }

  // Find gems in player's inventory
  const gemsInBag = playerInventory.filter((i) => {
    const def = ITEMS_DATABASE[i.itemId];
    return def && (def.type === ItemType.GEMA || i.itemId.startsWith('gem_'));
  });

  if (gemBagList) {
    gemBagList.innerHTML = '';
    if (gemsInBag.length === 0) {
      gemBagList.innerHTML = '<span style="color: #64748b; font-size: 0.75rem;">Nenhuma gema disponível. Derrote chefões ou monstros para saquear gemas!</span>';
    } else {
      gemsInBag.forEach((g) => {
        const gemDef = ITEMS_DATABASE[g.itemId];
        if (!gemDef) return;
        const chip = document.createElement('div');
        chip.className = 'gem-chip';
        if (selectedGemItemId === g.itemId) {
          chip.style.borderColor = '#fbbf24';
          chip.style.background = 'rgba(251, 191, 36, 0.2)';
        }
        chip.setAttribute('data-gem', g.itemId);
        let bonusText = '';
        if (gemDef.statsBonus) {
          bonusText = Object.entries(gemDef.statsBonus).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ');
        }
        chip.textContent = `${gemDef.icon || '💎'} ${gemDef.name} (${g.quantity}x) [${bonusText}]`;
        chip.onclick = () => {
          selectedGemItemId = g.itemId;
          updatePedrasView();
        };
        gemBagList.appendChild(chip);
      });
    }
  }

  if (btnSocketGem) {
    const nextFreeSocket = [0, 1, 2].find((s) => !targetSockets.some((x) => x.socketIndex === s));
    const canSocket = nextFreeSocket !== undefined && selectedGemItemId !== null;
    btnSocketGem.disabled = !canSocket;
    btnSocketGem.style.opacity = canSocket ? '1' : '0.6';
    if (nextFreeSocket === undefined) {
      btnSocketGem.textContent = 'TODOS OS 3 SOQUETES ESTÃO PREENCHIDOS';
    } else if (!selectedGemItemId) {
      btnSocketGem.textContent = 'SELECIONE UMA GEMA ACIMA PARA ENGASTAR';
    } else {
      const gDef = ITEMS_DATABASE[selectedGemItemId];
      btnSocketGem.textContent = `💎 ENGASTAR ${gDef?.name.toUpperCase() || 'GEMA'} NO SOQUETE #${nextFreeSocket + 1}`;
    }
  }
}

function updateCartasView() {
  const cardEquipPreview = document.querySelector('.card-equip-preview');
  const cardsGrid = document.getElementById('monster-cards-grid');

  // Card album uses numeric destinations: 0 = weapon, 1 = armor.
  const weaponCardEntry = playerCards.find((c) => c.isEquipped && c.equippedSlot === 0);
  const armorCardEntry = playerCards.find((c) => c.isEquipped && c.equippedSlot === 1);

  if (cardEquipPreview) {
    cardEquipPreview.innerHTML = `
      <div class="card-slot" style="margin-bottom: 8px;">
        <span class="card-slot-tag" style="color: #fbbf24; font-weight: 700;">⚔️ Arma Principal • Carta Ativa (Bônus em Dobro 2x)</span>
        <div class="card-equipped-box">
          <span class="card-symbol" style="font-size: 1.8rem;">${weaponCardEntry ? (CARDS_DATABASE[weaponCardEntry.cardId]?.icon || '🃏') : '⚪'}</span>
          <div class="card-details">
            <span class="card-name" style="color: #fbbf24; font-weight: bold;">
              ${weaponCardEntry ? (CARDS_DATABASE[weaponCardEntry.cardId]?.name || weaponCardEntry.cardId) : 'Nenhuma Carta Equipada na Arma'}
            </span>
            <span class="card-perk" style="color: #94a3b8; font-size: 0.75rem;">
              ${weaponCardEntry ? (CARDS_DATABASE[weaponCardEntry.cardId]?.activeEffectText || '+10% Dano de Ataque') : 'Equipe uma carta abaixo para bônus ativo!'}
            </span>
          </div>
          ${weaponCardEntry ? `<button class="btn-action-discard" style="margin-left: auto; padding: 4px 8px; font-size: 0.7rem;" onclick="window.magicForgeNetwork?.sendEquipCard('${weaponCardEntry.cardId}', 'ARMA', false)">Remover</button>` : ''}
        </div>
      </div>

      <div class="card-slot">
        <span class="card-slot-tag" style="color: #60a5fa; font-weight: 700;">🛡️ Armadura Peitoral • Carta Ativa (Bônus em Dobro 2x)</span>
        <div class="card-equipped-box">
          <span class="card-symbol" style="font-size: 1.8rem;">${armorCardEntry ? (CARDS_DATABASE[armorCardEntry.cardId]?.icon || '🃏') : '⚪'}</span>
          <div class="card-details">
            <span class="card-name" style="color: #60a5fa; font-weight: bold;">
              ${armorCardEntry ? (CARDS_DATABASE[armorCardEntry.cardId]?.name || armorCardEntry.cardId) : 'Nenhuma Carta Equipada na Armadura'}
            </span>
            <span class="card-perk" style="color: #94a3b8; font-size: 0.75rem;">
              ${armorCardEntry ? (CARDS_DATABASE[armorCardEntry.cardId]?.activeEffectText || '+10% Resistência a Danos') : 'Equipe uma carta abaixo para bônus ativo!'}
            </span>
          </div>
          ${armorCardEntry ? `<button class="btn-action-discard" style="margin-left: auto; padding: 4px 8px; font-size: 0.7rem;" onclick="window.magicForgeNetwork?.sendEquipCard('${armorCardEntry.cardId}', 'ARMADURA', false)">Remover</button>` : ''}
        </div>
      </div>
    `;
  }

  if (cardsGrid) {
    cardsGrid.innerHTML = '';
    const allCards = Object.values(CARDS_DATABASE);

    allCards.forEach((cardDef) => {
      const owned = playerCards.find((c) => c.cardId === cardDef.cardId);
      const isEquipped = owned?.isEquipped || false;
      const cardEl = document.createElement('div');
      cardEl.className = 'monster-card-item';
      if (!owned) {
        cardEl.style.opacity = '0.45';
        cardEl.style.filter = 'grayscale(100%)';
      } else {
        cardEl.style.borderColor = RARITY_COLORS[cardDef.rarity]?.border || '#fbbf24';
      }

      let imgHtml = `<span class="m-card-pic">${cardDef.icon || '🃏'}</span>`;
      if (cardDef.image) {
        imgHtml = `<img src="/${cardDef.image}" alt="${cardDef.name}" class="m-card-pic" style="width: 44px; height: 56px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);" onerror="this.outerHTML='<span class=\\'m-card-pic\\'>${cardDef.icon || '🃏'}</span>'" />`;
      }

      const rarityColor = RARITY_COLORS[cardDef.rarity]?.text || '#fbbf24';

      let equipButtonsHtml = '';
      if (owned) {
        if (isEquipped) {
          equipButtonsHtml = `
            <div style="display: flex; gap: 4px; margin-top: 6px;">
              <span style="color: #34d399; font-size: 0.72rem; font-weight: 700;">✅ Ativa [${owned.equippedSlot}]</span>
              <button class="btn-refine-action" style="padding: 2px 6px; font-size: 0.68rem; margin-left: auto;" onclick="window.magicForgeNetwork?.sendEquipCard('${cardDef.cardId}', '${owned.equippedSlot || 'ARMA'}', false)">Desequipar</button>
            </div>
          `;
        } else {
          const allowArma = cardDef.equipSlotAllowed === 'ARMA' || cardDef.equipSlotAllowed === 'AMBOS';
          const allowArmadura = cardDef.equipSlotAllowed === 'ARMADURA' || cardDef.equipSlotAllowed === 'AMBOS';

          equipButtonsHtml = `
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              ${allowArma ? `<button class="btn-action-primary" style="padding: 3px 6px; font-size: 0.68rem; flex: 1;" onclick="window.magicForgeNetwork?.sendEquipCard('${cardDef.cardId}', 'ARMA', true)">⚔️ Na Arma</button>` : ''}
              ${allowArmadura ? `<button class="btn-action-primary" style="padding: 3px 6px; font-size: 0.68rem; flex: 1; background: linear-gradient(135deg, #2563eb, #1d4ed8);" onclick="window.magicForgeNetwork?.sendEquipCard('${cardDef.cardId}', 'ARMADURA', true)">🛡️ Na Armadura</button>` : ''}
            </div>
          `;
        }
      } else {
        equipButtonsHtml = `<span style="color: #94a3b8; font-size: 0.68rem; margin-top: 4px;">🔒 Derrote este monstro para saquear</span>`;
      }

      cardEl.innerHTML = `
        ${imgHtml}
        <div class="m-card-body" style="flex: 1;">
          <span class="m-card-title" style="color: ${rarityColor}; font-weight: 700; font-size: 0.8rem;">${cardDef.name}</span>
          <span class="m-card-effect" style="color: #94a3b8; font-size: 0.72rem;">${cardDef.activeEffectText}</span>
          <span style="color: #38bdf8; font-size: 0.68rem; display: block; margin-top: 2px;">Coleção: +1% Bônus Permanente</span>
          ${equipButtonsHtml}
        </div>
      `;
      cardsGrid.appendChild(cardEl);
    });
  }
}

function openUnifiedHeroModal(defaultTab: 'mochila' | 'refino' | 'pedras' | 'cartas' = 'mochila') {
  if (!inventoryModal) return;
  inventoryModal.style.display = 'flex';
  if (characterModal && characterModal !== inventoryModal) {
    characterModal.style.display = 'none';
  }
  if (selectedSlotIndex === null && playerInventory.length > 0) {
    selectedSlotIndex = playerInventory[0].slotIndex;
  }
  renderInventorySlots();
  renderCharacterModal();
  if (selectedSlotIndex !== null) {
    selectInventorySlot(selectedSlotIndex);
  }
  switchSubmenuTab(defaultTab);
}

function closeUnifiedHeroModal() {
  if (inventoryModal) inventoryModal.style.display = 'none';
  if (characterModal) characterModal.style.display = 'none';
}

function toggleUnifiedHeroModal(defaultTab: 'mochila' | 'refino' | 'pedras' | 'cartas' = 'mochila', force?: boolean) {
  if (!inventoryModal) return;
  const isCurrentlyOpen = inventoryModal.style.display === 'flex';
  const shouldOpen = force !== undefined ? force : !isCurrentlyOpen;
  if (shouldOpen) {
    openUnifiedHeroModal(defaultTab);
  } else {
    closeUnifiedHeroModal();
  }
}

function openInventory() {
  openUnifiedHeroModal('mochila');
}

function closeInventory() {
  closeUnifiedHeroModal();
}

function toggleInventoryModal(force?: boolean) {
  toggleUnifiedHeroModal('mochila', force);
}

function openCharacterModal(): void {
  openUnifiedHeroModal('mochila');
}

function closeCharacterModal(): void {
  closeUnifiedHeroModal();
}

function toggleCharacterModal(force?: boolean): void {
  toggleUnifiedHeroModal('mochila', force);
}

if (btnOpenInventory) {
  btnOpenInventory.addEventListener('click', (e) => {
    e.stopPropagation();
    openInventory();
  });
}
if (btnCloseInventory) {
  btnCloseInventory.addEventListener('click', (e) => {
    e.stopPropagation();
    closeInventory();
  });
}
if (inventoryModal) {
  inventoryModal.addEventListener('click', (e) => {
    if (e.target === inventoryModal) closeInventory();
  });
}

// Submenus navigation tab listeners
const tabBtnMochila = document.getElementById('tab-btn-mochila');
if (tabBtnMochila) tabBtnMochila.addEventListener('click', () => switchSubmenuTab('mochila'));

const tabBtnRefino = document.getElementById('tab-btn-refino');
if (tabBtnRefino) tabBtnRefino.addEventListener('click', () => switchSubmenuTab('refino'));

const tabBtnPedras = document.getElementById('tab-btn-pedras');
if (tabBtnPedras) tabBtnPedras.addEventListener('click', () => switchSubmenuTab('pedras'));

const tabBtnCartas = document.getElementById('tab-btn-cartas');
if (tabBtnCartas) tabBtnCartas.addEventListener('click', () => switchSubmenuTab('cartas'));

// Interactive Actions for Submenus
const btnDoRefine = document.getElementById('btn-do-refine');
if (btnDoRefine) {
  btnDoRefine.addEventListener('click', () => {
    let targetItem = playerInventory.find((i) => i.slotIndex === selectedRefineSlot);
    if (!targetItem || ITEMS_DATABASE[targetItem.itemId]?.type !== ItemType.EQUIPAMENTO) {
      targetItem = playerInventory.find((i) => i.isEquipped && ITEMS_DATABASE[i.itemId]?.type === ItemType.EQUIPAMENTO) ||
                   playerInventory.find((i) => ITEMS_DATABASE[i.itemId]?.type === ItemType.EQUIPAMENTO);
    }
    if (!targetItem) {
      addChatMessage('Forja Celestial', 'Nenhum equipamento selecionado para refinar!', 'sys');
      return;
    }
    network.sendRefineEquipment(targetItem.slotIndex);
  });
}

const btnSocketGem = document.getElementById('btn-socket-gem');
if (btnSocketGem) {
  btnSocketGem.addEventListener('click', () => {
    let targetItem = playerInventory.find((i) => i.slotIndex === selectedRefineSlot);
    if (!targetItem || ITEMS_DATABASE[targetItem.itemId]?.type !== ItemType.EQUIPAMENTO) {
      targetItem = playerInventory.find((i) => i.isEquipped && ITEMS_DATABASE[i.itemId]?.type === ItemType.EQUIPAMENTO) ||
                   playerInventory.find((i) => ITEMS_DATABASE[i.itemId]?.type === ItemType.EQUIPAMENTO);
    }
    if (!targetItem) {
      addChatMessage('Joalheria Rúnica', 'Nenhum equipamento selecionado para engastar!', 'sys');
      return;
    }
    if (!selectedGemItemId) {
      addChatMessage('Joalheria Rúnica', 'Por favor, selecione uma gema da sacola primeiro!', 'sys');
      return;
    }
    const sockets = targetItem.sockets || [];
    const nextFreeSocket = [0, 1, 2].find((s) => !sockets.some((x) => x.socketIndex === s));
    if (nextFreeSocket === undefined) {
      addChatMessage('Joalheria Rúnica', 'Todos os 3 soquetes deste equipamento já estão ocupados!', 'sys');
      return;
    }
    network.sendSocketGem(targetItem.slotIndex, nextFreeSocket, selectedGemItemId);
  });
}

const btnSocketCard = document.getElementById('btn-socket-card');
if (btnSocketCard) {
  btnSocketCard.addEventListener('click', () => {
    const unequippedCard = playerCards.find((c) => !c.isEquipped);
    if (unequippedCard) {
      network.sendEquipCard(unequippedCard.cardId, 'ARMA', true);
    } else {
      addChatMessage('Álbum de Cartas', 'Derrote monstros para saquear cartas ou desequipe uma carta ativa!', 'sys');
    }
  });
}

function renderInventorySlots() {
  if (!inventorySlotsGrid) return;
  inventorySlotsGrid.innerHTML = '';

  if (inventoryCapacityText) {
    inventoryCapacityText.textContent = `CAPACIDADE: ${playerInventory.length} / ${playerMaxInventorySlots} SLOTS`;
  }
  refreshExpansionContext();

  // Render up to 50 slots
  const totalSlotsToDisplay = Math.min(50, Math.max(playerMaxInventorySlots + 5, 20));

  for (let slot = 0; slot < totalSlotsToDisplay; slot++) {
    const slotEl = document.createElement('div');
    slotEl.className = 'inventory-slot';
    if (slot === selectedSlotIndex) slotEl.classList.add('selected');

    if (slot < playerMaxInventorySlots) {
      // Active slot (filled or empty)
      const item = playerInventory.find((i) => i.slotIndex === slot);
      const itemDef = item ? ITEMS_DATABASE[item.itemId] : null;

      if (item && itemDef) {
        const rarityTheme = RARITY_COLORS[itemDef.rarity] || { border: '#ffffff', glow: 'rgba(255,255,255,0.3)', text: '#ffffff', bg: 'rgba(30,41,59,0.6)' };
        slotEl.style.borderColor = rarityTheme.border;

        if (item.isEquipped) {
          slotEl.classList.add('equipped');
          const eqBadge = document.createElement('span');
          eqBadge.className = 'slot-equipped-badge';
          eqBadge.textContent = 'EQ';
          slotEl.appendChild(eqBadge);
        }

        const iconEl = document.createElement('span');
        iconEl.className = 'slot-icon-text';
        iconEl.textContent = getItemEmoji(item.itemId, itemDef.type);
        slotEl.appendChild(iconEl);

        if (item.quantity > 1) {
          const qtyBadge = document.createElement('span');
          qtyBadge.className = 'slot-qty-badge';
          qtyBadge.textContent = `${item.quantity}`;
          slotEl.appendChild(qtyBadge);
        }

        if (item.refineLevel && item.refineLevel > 0) {
          const refineBadge = document.createElement('span');
          refineBadge.style.cssText = 'position: absolute; bottom: 2px; right: 2px; font-size: 0.65rem; font-weight: 800; color: #fbbf24; background: rgba(0,0,0,0.7); padding: 1px 3px; border-radius: 3px; border: 1px solid rgba(251,191,36,0.4);';
          refineBadge.textContent = `+${item.refineLevel}`;
          slotEl.appendChild(refineBadge);
        }
      } else {
        // Empty slot placeholder
        slotEl.style.opacity = '0.35';
      }

      slotEl.addEventListener('click', () => {
        selectInventorySlot(slot);
      });
    } else {
      // Locked slot
      slotEl.classList.add('locked');
      slotEl.title = `Slot bloqueado #${slot + 1}. Consulte a expansão de mochila.`;
      const lockIcon = document.createElement('span');
      lockIcon.style.fontSize = '1.1rem';
      lockIcon.style.opacity = '0.4';
      lockIcon.textContent = '🔒';
      slotEl.appendChild(lockIcon);

      slotEl.addEventListener('click', () => {
        inventoryExpansion?.requestConfirmation();
      });
    }

    inventorySlotsGrid.appendChild(slotEl);
  }
}

function selectInventorySlot(slotIndex: number) {
  selectedSlotIndex = slotIndex;
  renderInventorySlots();

  const item = playerInventory.find((i) => i.slotIndex === slotIndex);
  const itemDef = item ? ITEMS_DATABASE[item.itemId] : null;

  if (item && itemDef && itemDef.type === ItemType.EQUIPAMENTO) {
    selectedRefineSlot = slotIndex;
    if (currentSubmenuTab === 'refino') updateRefinementView();
    if (currentSubmenuTab === 'pedras') updatePedrasView();
  }

  if (!item || !itemDef) {
    if (inspectorIcon) inspectorIcon.textContent = '📦';
    if (inspectorName) {
      inspectorName.textContent = 'Slot Vazio';
      inspectorName.style.color = '#94a3b8';
    }
    if (inspectorTag) inspectorTag.textContent = `Slot #${slotIndex + 1}`;
    if (inspectorStatsList) {
      inspectorStatsList.innerHTML = `<span style="color: #64748b; font-size: 0.75rem;">Nenhum item alocado neste slot da mochila.</span>`;
    }
    if (inspectorDesc) inspectorDesc.textContent = 'Vença monstros e explore as forjas antigas para saquear equipamentos épicos e pedras de aprimoramento.';
    if (inspectorSellPrice) inspectorSellPrice.textContent = '--';
    if (inspectorRecyclePreview) inspectorRecyclePreview.textContent = '--';
    if (btnInventoryAction) btnInventoryAction.style.display = 'none';
    if (btnInventoryDiscard) btnInventoryDiscard.style.display = 'none';
    return;
  }

  const rarityTheme = RARITY_COLORS[itemDef.rarity] || { border: '#ffffff', glow: 'rgba(255,255,255,0.3)', text: '#ffffff', bg: 'rgba(30,41,59,0.6)' };

  if (inspectorIcon) {
    inspectorIcon.textContent = getItemEmoji(item.itemId, itemDef.type);
    inspectorIcon.style.borderColor = rarityTheme.border;
  }
  if (inspectorName) {
    const refinePrefix = item.refineLevel ? ` (+${item.refineLevel})` : '';
    inspectorName.textContent = `${itemDef.name}${refinePrefix}`;
    inspectorName.style.color = rarityTheme.text;
  }
  if (inspectorTag) {
    const slotTag = itemDef.equipmentSlot ? `[${itemDef.equipmentSlot}] ` : '';
    inspectorTag.textContent = `${slotTag}${itemDef.type} • ${itemDef.rarity}`;
    inspectorTag.style.color = rarityTheme.text;
  }
  if (inspectorDesc) {
    inspectorDesc.textContent = itemDef.description;
  }
  if (inspectorSellPrice) {
    inspectorSellPrice.textContent = `${itemDef.sellPrice} Ouro`;
  }
  if (inspectorRecyclePreview) {
    const goldEarned = Math.max(1, Math.round((itemDef.sellPrice || 5) * item.quantity * 0.5));
    const dustEarned = itemDef.type === 'EQUIPAMENTO' ? 2 : 1;
    inspectorRecyclePreview.textContent = `+${goldEarned} Ouro & +${dustEarned} Pó`;
  }

  if (inspectorStatsList) {
    inspectorStatsList.innerHTML = '';

    // Refinement Level
    if (itemDef.type === ItemType.EQUIPAMENTO && item.refineLevel && item.refineLevel > 0) {
      const row = document.createElement('div');
      row.className = 'inspector-stat-row';
      row.innerHTML = `<span style="color: #fbbf24; font-weight: 700;">Refinamento Forja:</span><strong style="color: #fbbf24;">+${item.refineLevel} (+${item.refineLevel * 8}% Atributos)</strong>`;
      inspectorStatsList.appendChild(row);
    }

    // Socketed Gems
    if (itemDef.type === ItemType.EQUIPAMENTO && item.sockets && item.sockets.length > 0) {
      const row = document.createElement('div');
      row.className = 'inspector-stat-row';
      const gemIcons = item.sockets.map((s) => {
        const gDef = ITEMS_DATABASE[s.gemId];
        return `${gDef?.icon || '💎'} ${gDef?.name || s.gemId}`;
      }).join(', ');
      row.innerHTML = `<span style="color: #38bdf8; font-weight: 700;">Gemas (${item.sockets.length}/3):</span><strong style="color: #38bdf8; font-size: 0.72rem;">${gemIcons}</strong>`;
      inspectorStatsList.appendChild(row);
    }

    // Class Proficiencies
    if (itemDef.allowedClasses && itemDef.allowedClasses.length > 0) {
      const userClass = (charClassSelect.value as CharacterClass) || CharacterClass.GUERREIRO;
      const isProficient = itemDef.allowedClasses.includes(userClass);
      const row = document.createElement('div');
      row.className = 'inspector-stat-row';
      row.innerHTML = `<span style="color: ${isProficient ? '#34d399' : '#f87171'}; font-weight: 700;">Proficiência:</span><strong style="color: ${isProficient ? '#34d399' : '#f87171'};">${itemDef.allowedClasses.join(', ')}</strong>`;
      inspectorStatsList.appendChild(row);
    }

    // Level Requirement
    if (itemDef.minLevel) {
      const isLevelMet = playerLevel >= itemDef.minLevel;
      const row = document.createElement('div');
      row.className = 'inspector-stat-row';
      row.innerHTML = `<span style="color: ${isLevelMet ? '#34d399' : '#f87171'}; font-weight: 700;">Nível Requerido:</span><strong style="color: ${isLevelMet ? '#34d399' : '#f87171'};">Nv. ${itemDef.minLevel}</strong>`;
      inspectorStatsList.appendChild(row);
    }

    // Required Attributes
    if (itemDef.requiredAttributes) {
      for (const [attr, reqVal] of Object.entries(itemDef.requiredAttributes)) {
        const row = document.createElement('div');
        row.className = 'inspector-stat-row';
        row.innerHTML = `<span style="color: #fbbf24; font-weight: 700;">Requer ${attr.toUpperCase()}:</span><strong style="color: #fbbf24;">${reqVal}</strong>`;
        inspectorStatsList.appendChild(row);
      }
    }

    // Bonus Stats
    if (itemDef.type === ItemType.EQUIPAMENTO && itemDef.statsBonus) {
      const bonus = itemDef.statsBonus;
      const statRows: Array<{ label: string; val?: number; color: string }> = [
        { label: 'Força (STR)', val: bonus.forca, color: '#f87171' },
        { label: 'Destreza (DEX)', val: bonus.destreza, color: '#fbbf24' },
        { label: 'Constituição (CON)', val: bonus.constituicao, color: '#4ade80' },
        { label: 'Inteligência (INT)', val: bonus.inteligencia, color: '#60a5fa' },
        { label: 'Sabedoria (WIS)', val: bonus.sabedoria, color: '#a78bfa' },
        { label: 'Carisma (CHA)', val: bonus.carisma, color: '#f472b6' },
        { label: 'Vida Máxima (HP)', val: bonus.maxHp, color: '#34d399' },
        { label: 'Recurso Máximo', val: bonus.maxResource, color: '#38bdf8' },
      ];

      statRows.forEach((sr) => {
        if (sr.val) {
          const row = document.createElement('div');
          row.className = 'inspector-stat-row';
          row.innerHTML = `<span style="color: ${sr.color};">${sr.label}:</span><strong>+${sr.val}</strong>`;
          inspectorStatsList.appendChild(row);
        }
      });
    } else if (itemDef.type === ItemType.CONSUMIVEL) {
      const row = document.createElement('div');
      row.className = 'inspector-stat-row';
      row.innerHTML = `<span style="color: #4ade80;">Efeito Consumível:</span><strong>Restaura Instantaneamente</strong>`;
      inspectorStatsList.appendChild(row);
    } else {
      const row = document.createElement('div');
      row.className = 'inspector-stat-row';
      row.innerHTML = `<span style="color: #94a3b8;">Tipo:</span><strong>Material de Forja e Aprimoramento</strong>`;
      inspectorStatsList.appendChild(row);
    }
  }

  if (btnInventoryAction) {
    if (itemDef.type === ItemType.EQUIPAMENTO) {
      btnInventoryAction.style.display = 'block';
      const userClass = (charClassSelect.value as CharacterClass) || CharacterClass.GUERREIRO;
      const cannotEquip = (itemDef.allowedClasses && !itemDef.allowedClasses.includes(userClass)) || (itemDef.minLevel && playerLevel < itemDef.minLevel);

      if (cannotEquip && !item.isEquipped) {
        btnInventoryAction.disabled = true;
        btnInventoryAction.style.opacity = '0.5';
        btnInventoryAction.style.cursor = 'not-allowed';
        btnInventoryAction.textContent = 'Classe / Nv. Inválido';
        btnInventoryAction.style.background = '#64748b';
      } else {
        btnInventoryAction.disabled = false;
        btnInventoryAction.style.opacity = '1';
        btnInventoryAction.style.cursor = 'pointer';
        btnInventoryAction.textContent = item.isEquipped ? 'Desequipar' : 'Equipar';
        btnInventoryAction.style.background = item.isEquipped ? '#dc2626' : 'linear-gradient(135deg, #d97706, #b45309)';
        btnInventoryAction.onclick = () => {
          network.sendUseItem(item.slotIndex);
        };
      }
    } else if (itemDef.type === ItemType.CONSUMIVEL) {
      btnInventoryAction.style.display = 'block';
      btnInventoryAction.disabled = false;
      btnInventoryAction.style.opacity = '1';
      btnInventoryAction.style.cursor = 'pointer';
      btnInventoryAction.textContent = 'Usar Item (Consumir)';
      btnInventoryAction.style.background = 'linear-gradient(135deg, #059669, #047857)';
      btnInventoryAction.onclick = () => {
        network.sendUseItem(item.slotIndex);
      };
    } else {
      btnInventoryAction.style.display = 'none';
    }
  }

  if (btnInventoryDiscard) {
    btnInventoryDiscard.style.display = 'flex';
    btnInventoryDiscard.onclick = () => {
      network.sendDiscardItem(item.slotIndex);
      addChatMessage('Forja', `♻️ Enviando [${itemDef.name}] para reciclagem na Forja Astral...`, 'sys');
    };
  }
}

// ==========================================
// Paperdoll (Equipment Manequin) & Character Modal
// ==========================================
const paperdollPortrait = document.getElementById('paperdoll-portrait') as HTMLImageElement | null;
const paperdollHeroName = document.getElementById('paperdoll-hero-name') as HTMLSpanElement | null;
const paperdollHeroClass = document.getElementById('paperdoll-hero-class') as HTMLSpanElement | null;

type PaperdollSlotKey = 'head' | 'chest' | 'legs' | 'main_hand' | 'off_hand' | 'relic';

const paperdollSlotMapping: Record<PaperdollSlotKey, EquipmentSlot> = {
  head: EquipmentSlot.ELMO,
  chest: EquipmentSlot.ARMADURA,
  legs: EquipmentSlot.BOTAS,
  main_hand: EquipmentSlot.ARMA,
  off_hand: EquipmentSlot.ESCUDO,
  relic: EquipmentSlot.ACESSORIO,
};

const paperdollSlotElements: Record<PaperdollSlotKey, HTMLElement | null> = {
  head: document.getElementById('equip-slot-head'),
  chest: document.getElementById('equip-slot-chest'),
  legs: document.getElementById('equip-slot-legs'),
  main_hand: document.getElementById('equip-slot-main_hand'),
  off_hand: document.getElementById('equip-slot-off_hand'),
  relic: document.getElementById('equip-slot-relic'),
};

const defaultSlotIcons: Record<PaperdollSlotKey, { emoji: string; label: string }> = {
  head: { emoji: '🧢', label: 'Elmo' },
  chest: { emoji: '🦺', label: 'Armadura' },
  legs: { emoji: '👖', label: 'Botas' },
  main_hand: { emoji: '⚔️', label: 'Arma' },
  off_hand: { emoji: '🛡️', label: 'Escudo' },
  relic: { emoji: '💍', label: 'Relíquia' },
};

function renderCharacterModal(): void {
  const chosenClass = (charClassSelect.value as CharacterClass) || CharacterClass.GUERREIRO;
  const classDef = CLASS_DEFINITIONS[chosenClass];
  if (!classDef) return;

  // 1. Calculate live attributes: Base + Growth * (Level - 1) + Equipment Bonuses
  const currentAttrs: CharacterAttributes = { ...classDef.baseStats };
  const growth = CLASS_STAT_GROWTH[chosenClass] || {};
  const levelMult = Math.max(0, playerLevel - 1);

  if (growth.forca) currentAttrs.forca += growth.forca * levelMult;
  if (growth.destreza) currentAttrs.destreza += growth.destreza * levelMult;
  if (growth.constituicao) currentAttrs.constituicao += growth.constituicao * levelMult;
  if (growth.inteligencia) currentAttrs.inteligencia += growth.inteligencia * levelMult;
  if (growth.sabedoria) currentAttrs.sabedoria += growth.sabedoria * levelMult;
  if (growth.carisma) currentAttrs.carisma += growth.carisma * levelMult;

  // Equipment bonuses
  let bonusMaxHp = 0;
  playerInventory.forEach((item) => {
    if (item.isEquipped) {
      const def = ITEMS_DATABASE[item.itemId];
      if (def && def.statsBonus) {
        if (def.statsBonus.forca) currentAttrs.forca += def.statsBonus.forca;
        if (def.statsBonus.destreza) currentAttrs.destreza += def.statsBonus.destreza;
        if (def.statsBonus.constituicao) currentAttrs.constituicao += def.statsBonus.constituicao;
        if (def.statsBonus.inteligencia) currentAttrs.inteligencia += def.statsBonus.inteligencia;
        if (def.statsBonus.sabedoria) currentAttrs.sabedoria += def.statsBonus.sabedoria;
        if (def.statsBonus.carisma) currentAttrs.carisma += def.statsBonus.carisma;
        if (def.statsBonus.maxHp) bonusMaxHp += def.statsBonus.maxHp;
      }
    }
  });

  // Derived Stats
  const calculatedMaxHp = currentAttrs.constituicao * 35 + 450 + bonusMaxHp;
  let primeStat = currentAttrs.forca;
  if (classDef.mainStat === PrimaryStatType.DESTREZA) primeStat = currentAttrs.destreza;
  else if (classDef.mainStat === PrimaryStatType.INTELIGENCIA) primeStat = currentAttrs.inteligencia;
  else if (classDef.mainStat === PrimaryStatType.SABEDORIA) primeStat = currentAttrs.sabedoria;
  else if (classDef.mainStat === PrimaryStatType.CARISMA) primeStat = currentAttrs.carisma;
  else if (classDef.mainStat === PrimaryStatType.FORCA_E_CARISMA) primeStat = currentAttrs.forca + currentAttrs.carisma;
  const baseDmg = primeStat * 3 + 5;
  const critPct = Math.min(60, 5 + Math.floor(currentAttrs.destreza * 0.8));

  // Update DOM values
  if (statForca) statForca.textContent = `${currentAttrs.forca}`;
  if (statDestreza) statDestreza.textContent = `${currentAttrs.destreza}`;
  if (statConstituicao) statConstituicao.textContent = `${currentAttrs.constituicao}`;
  if (statInteligencia) statInteligencia.textContent = `${currentAttrs.inteligencia}`;
  if (statSabedoria) statSabedoria.textContent = `${currentAttrs.sabedoria}`;
  if (statCarisma) statCarisma.textContent = `${currentAttrs.carisma}`;

  if (paperdollMaxHp) paperdollMaxHp.textContent = `${calculatedMaxHp}`;
  if (paperdollBaseDamage) paperdollBaseDamage.textContent = `${baseDmg}`;
  if (paperdollAttackRange) paperdollAttackRange.textContent = `${classDef.attackRange}m (${classDef.isRanged ? 'Ranged' : 'Melee'})`;
  if (paperdollCrit) paperdollCrit.textContent = `${critPct}%`;

  if (paperdollCpValue) paperdollCpValue.textContent = `⚔️ ${playerCombatPower.toLocaleString('pt-BR')}`;
  if (hudCpBig) hudCpBig.textContent = playerCombatPower.toLocaleString('pt-BR');

  // Center stage avatar
  const charName = charNameInput.value.trim() || 'Aventureiro';
  if (paperdollPortrait) paperdollPortrait.src = `/assets/portraits/${chosenClass}.jpg`;
  if (paperdollHeroName) paperdollHeroName.textContent = charName;
  if (paperdollHeroClass) paperdollHeroClass.textContent = `${classDef.displayName} (Nv. ${playerLevel})`;

  // Render 6 Equipment Slots
  Object.entries(paperdollSlotElements).forEach(([slotKeyStr, slotEl]) => {
    if (!slotEl) return;
    const slotKey = slotKeyStr as PaperdollSlotKey;
    const equipSlot = paperdollSlotMapping[slotKey];
    const equippedItem = playerInventory.find((i) => {
      if (!i.isEquipped) return false;
      const def = ITEMS_DATABASE[i.itemId];
      return def && def.equipmentSlot === equipSlot;
    });

    if (equippedItem) {
      const def = ITEMS_DATABASE[equippedItem.itemId]!;
      const rarityTheme = RARITY_COLORS[def.rarity] || { border: '#fbbf24', text: '#fbbf24', glow: 'rgba(251,191,36,0.3)' };
      const refineStr = equippedItem.refineLevel ? ` (+${equippedItem.refineLevel})` : '';
      slotEl.style.borderColor = rarityTheme.border;
      slotEl.style.boxShadow = `0 0 12px ${rarityTheme.glow}`;
      slotEl.innerHTML = `
        <span class="slot-placeholder-icon" style="font-size: 1.5rem;">${getItemEmoji(def.itemId, def.type)}</span>
        <span class="slot-label" style="color: ${rarityTheme.text}; font-weight: 700;">${def.name}${refineStr}</span>
      `;
      slotEl.title = `[Equipado] ${def.name}${refineStr} (${def.rarity})\nClique para Desequipar`;
      slotEl.onclick = () => {
        network.sendUseItem(equippedItem.slotIndex);
      };
    } else {
      const defSlot = defaultSlotIcons[slotKey];
      slotEl.style.borderColor = 'rgba(255, 255, 255, 0.12)';
      slotEl.style.boxShadow = 'none';
      slotEl.innerHTML = `
        <span class="slot-placeholder-icon">${defSlot.emoji}</span>
        <span class="slot-label">${defSlot.label}</span>
      `;
      slotEl.title = `[Vazio] Slot de ${defSlot.label}\nAbra a Mochila [I] para equipar`;
      slotEl.onclick = () => {
        openInventory();
      };
    }
    // Render refinement badges on equipment slots
    Object.keys(paperdollSlotMapping).forEach((slotKeyStr) => {
      const slotKey = slotKeyStr as PaperdollSlotKey;
      const badgeEl = document.getElementById(`refine-badge-${slotKey}`);
      if (badgeEl) {
        const equipSlot = paperdollSlotMapping[slotKey];
        const eqItem = playerInventory.find((i) => {
          if (!i.isEquipped) return false;
          const def = ITEMS_DATABASE[i.itemId];
          return def && def.equipmentSlot === equipSlot;
        });
        const tier = eqItem?.refineLevel || 0;
        if (tier > 0) {
          badgeEl.textContent = `+${tier}`;
          badgeEl.style.display = 'block';
        } else {
          badgeEl.style.display = 'none';
        }
      }
    });
  });
}

// ==========================================
// Farm Helper (Automação Idle & Auto-Venda)
// ==========================================
function openFarmHelper(): void {
  if (!farmHelperModal) return;
  farmHelperUI.onOpen();
  farmHelperModal.style.display = 'flex';
}

function closeFarmHelper(): void {
  if (farmHelperModal) farmHelperModal.style.display = 'none';
}

function toggleFarmHelper(force?: boolean): void {
  if (!farmHelperModal) return;
  const shouldOpen = force !== undefined ? force : farmHelperModal.style.display !== 'flex';
  if (shouldOpen) openFarmHelper();
  else closeFarmHelper();
}

// Quick Use Toast Notification helper
let quickToastTimeout: number | null = null;
function triggerQuickUseToast(name: string, emoji: string, slotIndex: number): void {
  if (!quickUseToast || !quickUseName || !quickUseIcon || !btnQuickUseAction) return;

  quickUseName.textContent = name;
  quickUseIcon.textContent = emoji;
  quickUseToast.style.display = 'flex';

  btnQuickUseAction.onclick = () => {
    network.sendUseItem(slotIndex);
    quickUseToast.style.display = 'none';
  };

  if (quickToastTimeout) clearTimeout(quickToastTimeout);
  quickToastTimeout = window.setTimeout(() => {
    quickUseToast.style.display = 'none';
  }, 5000);
}

// Bind Dock Navigation Buttons
if (btnDockCharacter) btnDockCharacter.addEventListener('click', () => toggleCharacterModal());
if (btnDockInventory) btnDockInventory.addEventListener('click', () => toggleInventoryModal());
if (btnDockSkillbook) btnDockSkillbook.addEventListener('click', () => {
  if (skillbookModal && skillbookModal.style.display === 'flex') closeSkillbook();
  else openSkillbook();
});
if (btnDockFarm) btnDockFarm.addEventListener('click', () => toggleFarmHelper());
if (btnDockRanking) btnDockRanking.addEventListener('click', () => {
  leaderboard.open();
});

// Bind Hero Avatar click on top-left card
if (hudAvatarBtn) {
  hudAvatarBtn.addEventListener('click', () => toggleCharacterModal());
}

// Bind Modal Close buttons
if (btnCloseCharacter) {
  btnCloseCharacter.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCharacterModal();
  });
}
if (characterModal) {
  characterModal.addEventListener('click', (e) => {
    if (e.target === characterModal) closeCharacterModal();
  });
}

if (btnCloseFarm) {
  btnCloseFarm.addEventListener('click', (e) => {
    e.stopPropagation();
    closeFarmHelper();
  });
}
if (farmHelperModal) {
  farmHelperModal.addEventListener('click', (e) => {
    if (e.target === farmHelperModal) closeFarmHelper();
  });
}


// Battery Power Save mode toggle
let isPowerSave = false;
if (btnPowerSave) {
  btnPowerSave.addEventListener('click', () => {
    isPowerSave = !isPowerSave;
    btnPowerSave.style.background = isPowerSave ? 'rgba(56, 189, 248, 0.35)' : 'rgba(15, 23, 42, 0.75)';
    btnPowerSave.textContent = isPowerSave ? '🌙 Economia ON' : '🌙 Economia';
  });
}

// Core Game Client Systems
const network = new ClientNetwork();
let farmPlayerReady = false;
let pendingFarmSettings: S2CFarmSettingsUpdatePayload | null = null;
const farmHelperUI = setupFarmHelper({
  isReady: () => network.isConnected && network.isAuthenticated && farmPlayerReady,
  save: settings => network.sendUpdateFarmSettings(settings),
  salvage: includeRare => network.sendAutoSalvage(includeRare),
});
network.onFarmSettingsUpdate = payload => {
  // enterWorld sends preferences before S2C_LOGIN_SUCCESS.
  if (!farmPlayerReady) { pendingFarmSettings = payload; return; }
  farmHelperUI.onSettingsUpdate(payload);
};
network.onAutoSalvageResult = payload => {
  farmHelperUI.onSalvageResult(payload);
  playerGold = payload.newGoldTotal;
  refreshExpansionContext();
  if (playerGoldText) playerGoldText.textContent = IdleMath.format(playerGold);
  if (inventoryGoldLabel) inventoryGoldLabel.textContent = playerGold.toLocaleString('pt-BR') + ' Ouro';
  addChatMessage('Farm Helper', payload.message, 'sys');
};
(window as any).magicForgeNetwork = network;
let legacyLoginRequested = false;
const snapshotBuffer = new SnapshotBuffer();
const renderer = new GameRenderer(canvas);
const leaderboard = setupLeaderboard({
  isReady: () => network.isConnected && network.isAuthenticated && farmPlayerReady,
  request: (category, limit) => network.sendRequestLeaderboard(category, limit),
});
inventoryExpansion = setupInventoryExpansion({
  isReady: () => network.isConnected && network.isAuthenticated && farmPlayerReady,
  send: () => network.sendExpandInventory(),
  apply: result => {
    playerMaxInventorySlots = result.newMaxSlots;
    playerGold = result.remainingGold;
    if (playerGoldText) playerGoldText.textContent = playerGold.toLocaleString('pt-BR');
    if (inventoryGoldLabel) inventoryGoldLabel.textContent = playerGold.toLocaleString('pt-BR') + ' Ouro';
    renderInventorySlots();
  },
});
network.onExpandInventoryResult = result => inventoryExpansion!.onResult(result);
network.onLeaderboardUpdate = data => leaderboard.onUpdate(data);
const bossNarrative = setupBossNarrative();

// Resize handling
function handleResize() {
  renderer.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleResize);
handleResize();

// ----------------------------------------------------
// Interactive Camera Zoom Controls (HUD Buttons, Wheel & Pinch)
// ----------------------------------------------------
const btnZoomIn = document.getElementById('btn-zoom-in') as HTMLButtonElement | null;
const btnZoomOut = document.getElementById('btn-zoom-out') as HTMLButtonElement | null;
const hudZoomLabel = document.getElementById('hud-zoom-label') as HTMLSpanElement | null;

function updateZoomDisplay() {
  if (hudZoomLabel) {
    hudZoomLabel.textContent = `${Math.round(renderer.zoom)}x`;
  }
}
updateZoomDisplay();

if (btnZoomIn) {
  btnZoomIn.addEventListener('click', (e) => {
    e.stopPropagation();
    renderer.setZoom(renderer.zoom + 1.2);
    updateZoomDisplay();
  });
}

if (btnZoomOut) {
  btnZoomOut.addEventListener('click', (e) => {
    e.stopPropagation();
    renderer.setZoom(renderer.zoom - 1.2);
    updateZoomDisplay();
  });
}

// Canvas Wheel for Zoom In / Zoom Out
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.9 : -0.9;
    renderer.setZoom(renderer.zoom + delta);
    updateZoomDisplay();
  },
  { passive: false }
);

// Mobile Pinch-to-Zoom
let initialPinchDistance: number | null = null;
let initialPinchZoom: number = renderer.zoom;

canvas.addEventListener(
  'touchstart',
  (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance = Math.hypot(dx, dy);
      initialPinchZoom = renderer.zoom;
    }
  },
  { passive: true }
);

canvas.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.hypot(dx, dy);
      const factor = currentDistance / initialPinchDistance;
      renderer.setZoom(initialPinchZoom * factor);
      updateZoomDisplay();
    }
  },
  { passive: true }
);

canvas.addEventListener(
  'touchend',
  (e) => {
    if (e.touches.length < 2) {
      initialPinchDistance = null;
    }
  },
  { passive: true }
);

// ----------------------------------------------------
// In-Game Live Chat Box Helper
// ----------------------------------------------------
const gameChatBox = document.getElementById('game-chat-box') as HTMLDivElement | null;
const btnToggleChat = document.getElementById('btn-toggle-chat') as HTMLButtonElement | null;
const chatToggleIcon = document.getElementById('chat-toggle-icon') as HTMLSpanElement | null;
const chatInputForm = document.getElementById('chat-input-form') as HTMLFormElement | null;
const chatInputField = document.getElementById('chat-input-field') as HTMLInputElement | null;

function setChatCollapsed(collapsed: boolean) {
  if (!gameChatBox) return;
  if (collapsed) {
    gameChatBox.classList.add('collapsed');
    if (chatToggleIcon) chatToggleIcon.textContent = '▲';
    try { localStorage.setItem('mf_chat_collapsed', 'true'); } catch {}
  } else {
    gameChatBox.classList.remove('collapsed');
    if (chatToggleIcon) chatToggleIcon.textContent = '▼';
    try { localStorage.setItem('mf_chat_collapsed', 'false'); } catch {}
    if (chatMessagesContainer) {
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
  }
}

if (btnToggleChat) {
  btnToggleChat.addEventListener('click', (e) => {
    e.stopPropagation();
    const isCollapsed = gameChatBox?.classList.contains('collapsed') ?? false;
    setChatCollapsed(!isCollapsed);
  });
}

try {
  const savedCollapsed = localStorage.getItem('mf_chat_collapsed');
  if (savedCollapsed !== null) {
    setChatCollapsed(savedCollapsed === 'true');
  } else if (window.innerHeight < 820) {
    setChatCollapsed(true);
  }
} catch {}

if (chatInputField) {
  chatInputField.addEventListener('focus', () => {
    if (gameChatBox?.classList.contains('collapsed')) {
      setChatCollapsed(false);
    }
  });
}

function addChatMessage(tag: string, message: string, type: 'sys' | 'auto' | 'loot' | 'combat' | 'user' | 'malak' = 'sys') {
  if (!chatMessagesContainer) return;
  const row = document.createElement('div');
  row.className = 'chat-msg' + (type === 'malak' ? ' chat-msg-malak' : '');
  const label = document.createElement('span'); label.className = 'chat-tag-' + type; label.textContent = '[' + (type === 'malak' ? '⚒ ' : '') + tag + ']';
  const body = document.createElement('span'); body.className = 'chat-body'; body.textContent = message;
  row.append(label, body);
  chatMessagesContainer.appendChild(row);
  if (chatMessagesContainer.children.length > 60) {
    chatMessagesContainer.removeChild(chatMessagesContainer.firstElementChild!);
  }
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

if (chatInputForm && chatInputField) {
  chatInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInputField.value.trim();
    if (!text) return;

    if (text === '/limpar' || text === '/clear') {
      if (chatMessagesContainer) chatMessagesContainer.innerHTML = '';
      addChatMessage('Sistema', 'Histórico de chat limpo com sucesso.', 'sys');
      chatInputField.value = '';
      chatInputField.blur();
      return;
    }

    if (text === '/help' || text === '/ajuda') {
      addChatMessage('Ajuda', 'Comandos disponíveis: /limpar, /help', 'sys');
      chatInputField.value = '';
      return;
    }

    const entities = snapshotBuffer.getInterpolatedEntities();
    const myPlayer = entities.find((ent) => ent.id === network.myPlayerId);
    const authorName = myPlayer ? myPlayer.name : (charNameInput.value.trim() || 'LordAventureiro');
    const authorLvl = myPlayer?.level ?? 1;

    addChatMessage(`${authorName} (Nv.${authorLvl})`, text, 'user');
    chatInputField.value = '';
    chatInputField.blur();
  });
}

// ----------------------------------------------------
// Quick Potions UI and Handlers
// ----------------------------------------------------
function updateQuickPotionsUI() {
  if (!quickHpCount || !quickMpCount) return;
  let hpCount = 0;
  let mpCount = 0;
  playerInventory.forEach((i) => {
    if (i.itemId.startsWith('potion_hp_')) hpCount += i.quantity;
    if (i.itemId.startsWith('potion_mp_')) mpCount += i.quantity;
  });
  quickHpCount.textContent = `HP (${hpCount})`;
  quickMpCount.textContent = `MP (${mpCount})`;
}

if (btnQuickHp) {
  btnQuickHp.addEventListener('click', (e) => {
    e.stopPropagation();
    const hpPotion = playerInventory.find((i) => i.itemId.startsWith('potion_hp_'));
    if (hpPotion) {
      network.sendUseItem(hpPotion.slotIndex);
      addChatMessage('Item', 'Usou Poção de Vida!', 'loot');
    } else {
      addChatMessage('Sistema', 'Você não possui Poções de Vida na mochila.', 'sys');
    }
  });
}

if (btnQuickMp) {
  btnQuickMp.addEventListener('click', (e) => {
    e.stopPropagation();
    const mpPotion = playerInventory.find((i) => i.itemId.startsWith('potion_mp_'));
    if (mpPotion) {
      network.sendUseItem(mpPotion.slotIndex);
      addChatMessage('Item', 'Usou Poção de Mana/Energia!', 'loot');
    } else {
      addChatMessage('Sistema', 'Você não possui Poções de Mana na mochila.', 'sys');
    }
  });
}

// ----------------------------------------------------
// Auto-Play & Manual Override System
// ----------------------------------------------------
let isAutoPlayActive = true;
let isManualMovement = false;
let manualOverrideTimeout: number | null = null;
let lastAutoCombatTick = 0;

function toggleAutoPlay(force?: boolean) {
  isAutoPlayActive = force !== undefined ? force : !isAutoPlayActive;
  if (btnToggleAuto && autoStatusText && autoStatusIcon) {
    if (isAutoPlayActive) {
      btnToggleAuto.classList.remove('inactive');
      autoStatusText.textContent = 'AUTO ON';
      autoStatusIcon.textContent = '⚔️';
      addChatMessage('Auto', 'Farm Automático ATIVADO! Caçando monstros da fase...', 'auto');
    } else {
      btnToggleAuto.classList.add('inactive');
      autoStatusText.textContent = 'AUTO OFF';
      autoStatusIcon.textContent = '⏸️';
      addChatMessage('Auto', 'Farm Automático PAUSADO. Controle manual ativo.', 'auto');
    }
  }
}

if (btnToggleAuto) {
  btnToggleAuto.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAutoPlay();
  });
}

if (btnOpenFarmGear) {
  btnOpenFarmGear.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFarmHelper();
  });
}

// Network Event Wiring
network.onConnectionStateChange = (connected) => {
  if (connected) {
    if (statusDot) statusDot.classList.add('online');
    if (connectionStatus) connectionStatus.textContent = 'Conectado (Online)';
    btnConnect.textContent = 'Conectado';
    btnConnect.style.background = 'linear-gradient(135deg, #10b981, #059669)';

    // Keep reconnect support for the explicit legacy entry flow.
    const name = charNameInput.value.trim() || 'Aventureiro';
    const chosenClass = (charClassSelect.value as CharacterClass) || CharacterClass.GUERREIRO;
    if (legacyLoginRequested) network.login(name, chosenClass);
    else authSelection.onConnected();
    addChatMessage('Sistema', 'Conectado ao servidor autoritativo MagicForge (20Hz)!', 'sys');
  } else {
    authSelection.onDisconnected();
    farmPlayerReady = false;
    pendingFarmSettings = null;
    farmHelperUI.onDisconnected();
    closeFarmHelper();
    leaderboard.onDisconnected();
    inventoryExpansion?.onDisconnected();
    bossNarrative.reset();
    renderer.resetNarrative();
    renderer.setStagePresentation({ world: 1 });
    if (statusDot) statusDot.classList.remove('online');
    if (connectionStatus) connectionStatus.textContent = 'Reconectando em 1.2s...';
    btnConnect.textContent = 'Reconectando...';
    btnConnect.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
  }
};

network.onLatencyUpdated = (ping) => {
  if (pingText) pingText.textContent = `${ping} ms`;
};

network.onSnapshot = (snapshot) => {
  if (tickText) tickText.textContent = `#${snapshot.serverTick} (20Hz)`;
  snapshotBuffer.pushSnapshot(snapshot);
};

network.onCombatEvent = (event) => {
  bossNarrative.onCombatEvent(event);
  if (combatTriggersAttack(event.damageSource)) renderer.triggerEntityAnimation(event.attackerId, 'attack');
  if (event.isTargetDead) {
    renderer.triggerEntityAnimation(event.targetId, 'death');
  } else if (!event.isDodged && event.damage > 0) {
    renderer.triggerEntityAnimation(event.targetId, 'hit');
  }

  const entities = snapshotBuffer.getInterpolatedEntities();
  const target = entities.find((e) => e.id === event.targetId);
  if (target) {
    renderer.addDamageText(target.position, event.damage, event.isCritical, event.isDodged);
  }
};

network.onSkillCastEvent = (event: S2CSkillCastEventPayload) => {
  if (typeof (renderer as any).acceptSkillCast === 'function' && !(renderer as any).acceptSkillCast(event)) return;
  const entities = snapshotBuffer.getInterpolatedEntities();
  const caster = entities.find((e) => e.id === event.casterId);
  const target = event.targetId ? entities.find((e) => e.id === event.targetId) : null;
  const casterPos = caster ? { x: caster.position.x, z: caster.position.z } : undefined;
  const targetPos = target
    ? { x: target.position.x, z: target.position.z }
    : (event.targetPosition ? { x: event.targetPosition.x, z: event.targetPosition.z } : casterPos);

  if (typeof (renderer as any).triggerSkillCast === 'function') {
    (renderer as any).triggerSkillCast(event.casterId, event.skillId, casterPos, targetPos);
  } else {
    renderer.triggerEntityAnimation(event.casterId, 'attack');
  }
  if (event.targetId && !event.isHeal && (!event.affectedEntityIds || event.affectedEntityIds.includes(event.targetId))) {
    renderer.triggerEntityAnimation(event.targetId, 'hit');
  }

  if (event.casterId === network.myPlayerId) {
    const slotUI = skillSlots[event.slot];
    if (slotUI && slotUI.definition) {
      cooldownMap.set(event.slot, performance.now() + slotUI.definition.cooldownSec * 1000);
    }
  }

  if (typeof (renderer as any).playSkillVfx === 'function') {
    (renderer as any).playSkillVfx(event, entities);
  }
  if (event.targetResults) {
    for (const result of event.targetResults) {
      if (result.isDead) renderer.triggerEntityAnimation(result.targetId, 'death');
      else if (result.effectiveDamage > 0) renderer.triggerEntityAnimation(result.targetId, 'hit');
      if (result.effectiveDamage > 0) renderer.addSkillEffectText(result.impactPosition, event.skillName, result.effectiveDamage, false, result.isCritical);
      if (result.effectiveHeal > 0) renderer.addSkillEffectText(result.impactPosition, event.skillName, result.effectiveHeal, true, result.isCritical);
    }
    return;
  }
  let effectPos = event.targetPosition;
  if (!effectPos && target) {
    effectPos = target.position;
  } else if (!effectPos && caster) {
    effectPos = caster.position;
  }

  if (effectPos) renderer.addSkillEffectText(effectPos, event.skillName, event.damageOrHeal, event.isHeal, event.isCritical);
};

const skillRejectionEcho = new SkillRejectionEchoFilter();
network.onSkillCastRejected = (event) => {
  if (event.casterId !== network.myPlayerId) return;
  if (event.reasonCode === 'ON_COOLDOWN' && event.cooldownRemainingSec !== undefined) cooldownMap.set(event.slot, performance.now() + event.cooldownRemainingSec * 1000);
  skillRejectionEcho.record(event.message, performance.now());
  addChatMessage('Habilidades', event.message, 'sys');
};

network.onCombatStatusEvent = (event) => {
  renderer.applyCombatStatus(event, snapshotBuffer.getInterpolatedEntities());
};

network.onItemDropSpawn = (payload) => {
  renderer.addOrUpdateDrop(payload);
};

network.onItemDropDespawn = (payload) => {
  renderer.removeDrop(payload.dropId);
};

let bossCountdownInterval: number | null = null;
let bossRemainingTime: number = 60;

network.onBossEvent = (payload) => {
  bossNarrative.onBossEvent(payload);
  addChatMessage('⚔️ CHEFÃO', payload.message || 'Alerta de Chefão!', 'combat');
  if (payload.eventType === 'SPAWN') {
    if (bossTimerBanner) {
      bossTimerBanner.style.display = 'flex';
    }
    if (bossBannerName) {
      bossBannerName.textContent = payload.bossName || 'CHEFÃO DA FASE EM COMBATE';
    }
    bossRemainingTime = payload.timeLimitSec || 60;
    if (bossBannerTimer) {
      bossBannerTimer.textContent = `TEMPO RESTANTE: ${bossRemainingTime}s`;
    }
    if (bossCountdownInterval) clearInterval(bossCountdownInterval);
    bossCountdownInterval = window.setInterval(() => {
      bossRemainingTime--;
      if (bossBannerTimer) {
        bossBannerTimer.textContent = `TEMPO RESTANTE: ${Math.max(0, bossRemainingTime)}s`;
      }
      if (bossRemainingTime <= 0 && bossCountdownInterval) {
        clearInterval(bossCountdownInterval);
        bossCountdownInterval = null;
      }
    }, 1000);

    if (btnBossChallenge) {
      btnBossChallenge.style.display = 'none';
    }
  } else if (payload.eventType === 'VICTORY') {
    if (bossTimerBanner) bossTimerBanner.style.display = 'none';
    if (bossCountdownInterval) {
      clearInterval(bossCountdownInterval);
      bossCountdownInterval = null;
    }
    if (btnBossChallenge) {
      btnBossChallenge.style.display = 'none';
    }
    if (btnEnterPortal) {
      btnEnterPortal.style.display = 'flex';
    }
  } else if (payload.eventType === 'TIMEOUT') {
    if (bossTimerBanner) bossTimerBanner.style.display = 'none';
    if (bossCountdownInterval) {
      clearInterval(bossCountdownInterval);
      bossCountdownInterval = null;
    }
    if (btnBossChallenge) {
      btnBossChallenge.style.display = 'inline-block';
      btnBossChallenge.textContent = '💀 DESAFIAR CHEFÃO NOVAMENTE';
      btnBossChallenge.disabled = false;
      btnBossChallenge.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
    }
  }
};

network.onStageUpdate = (payload) => {
  renderer.setStagePresentation(payload);
  const biomeIcon = document.getElementById('zone-biome-icon');
  if (biomeIcon) biomeIcon.textContent = worldAppearance(payload.world).icon;
  if (currentStageBadge) {
    currentStageBadge.textContent = `Fase ${payload.stage}/10`;
  }
  if (stageWorldTitle) {
    stageWorldTitle.textContent = `${worldAppearance(payload.world).icon} ${payload.worldName}`;
  }
  if (stagePhaseBadge) {
    stagePhaseBadge.textContent = payload.isBossStage ? `Fase 10/10 [CHEFÃO]` : `Fase ${payload.stage}/10`;
  }
  if (zoneLocationTitle) {
    zoneLocationTitle.textContent = `${payload.worldName} (Fase ${payload.stage})`;
  }

  const kills = Math.min(payload.killsRequired, payload.stageKills);
  const pct = Math.min(100, Math.round((kills / payload.killsRequired) * 100));

  if (stageProgressFill) {
    stageProgressFill.style.width = `${pct}%`;
  }

  if (stageProgressCounter) {
    if (payload.portalOpen) {
      stageProgressCounter.textContent = '🌀 PORTAL DIMENSIONAL ABERTO!';
    } else if (payload.isBossStage) {
      stageProgressCounter.textContent = payload.bossAvailable ? '💀 RE-DESAFIE O CHEFÃO' : '⚔️ COMBATE CONTRA O CHEFÃO!';
    } else {
      stageProgressCounter.textContent = `Monstros Derrotados: ${kills} / ${payload.killsRequired}`;
    }
  }

  // Boss challenge button: ONLY visible if bossAvailable is true (e.g. timeout on Stage 10)
  if (btnBossChallenge) {
    if (payload.bossAvailable) {
      btnBossChallenge.style.display = 'inline-block';
      btnBossChallenge.textContent = '💀 DESAFIAR CHEFÃO NOVAMENTE';
      btnBossChallenge.disabled = false;
      btnBossChallenge.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
    } else {
      btnBossChallenge.style.display = 'none';
    }
  }

  if (enterPortalLabel) {
    enterPortalLabel.textContent = `ENTRAR NO PORTAL RÚNICO (MUNDO ${payload.world + 1})`;
  }
  if (btnEnterPortal) {
    btnEnterPortal.style.display = payload.portalOpen ? 'flex' : 'none';
  }
};

network.onChatMessage = (payload) => {
  if (skillRejectionEcho.suppress(payload.senderId, payload.message, performance.now())) return;
  addChatMessage(payload.senderName, payload.message, /^Malakor\b/i.test(payload.senderName) ? 'malak' : payload.channel === 'system' ? 'sys' : 'combat');
};

network.onInventoryUpdate = (payload: S2CInventoryUpdatePayload) => {
  playerInventory = payload.slots;
  playerGold = payload.gold;
  playerCombatPower = payload.totalCombatPower;
  if (payload.maxSlots) {
    playerMaxInventorySlots = payload.maxSlots;
  }
  if (payload.lootMessage) {
    addChatMessage('Sistema', payload.lootMessage, 'sys');
  }

  if (playerGoldText) playerGoldText.textContent = IdleMath.format(playerGold);
  if (inventoryGoldLabel) inventoryGoldLabel.textContent = `${playerGold.toLocaleString('pt-BR')} Ouro`;
  if (modalCpText) modalCpText.textContent = `${playerCombatPower.toLocaleString('pt-BR')}`;
  if (hudCpVal) hudCpVal.textContent = IdleMath.format(playerCombatPower);
  if (hudCpBig) hudCpBig.textContent = playerCombatPower.toLocaleString('pt-BR');

  renderInventorySlots();
  if (selectedSlotIndex !== null) {
    selectInventorySlot(selectedSlotIndex);
  }

  renderCharacterModal();
  updateQuickPotionsUI();
  updateRefinementView();
  updatePedrasView();
};

network.onLoginSuccess = (payload) => {
  farmPlayerReady = true;
  farmHelperUI.onCharacterLogin();
  if (pendingFarmSettings) { farmHelperUI.onSettingsUpdate(pendingFarmSettings); pendingFarmSettings = null; }
  authSelection.onLogin();
  playerLevel = payload.level ?? 1;
  playerRebornCount = payload.rebornCount ?? 0;
  playerCurrentXp = payload.currentXp ?? 0;
  playerXpToNextLevel = payload.xpToNextLevel ?? 150;
  playerGold = payload.gold ?? 0;
  refreshExpansionContext();

  if (payload.classType) {
    myPlayerClass = payload.classType;
  }
  const chosenClass = myPlayerClass || (charClassSelect.value as CharacterClass) || CharacterClass.GUERREIRO;
  if (hudHeroPortrait) hudHeroPortrait.src = `/assets/portraits/${chosenClass}.jpg`;
  if (hudHeroName) hudHeroName.textContent = payload.characterName || 'Jogador';
  if (hudHeroLevel) hudHeroLevel.textContent = `Nv. ${playerLevel}`;
  if (hudHeroLevelPill) hudHeroLevelPill.textContent = `Nv. ${playerLevel}`;

  updateSkillsForClass(chosenClass);
  updateExpBarUI(playerLevel, playerCurrentXp, playerXpToNextLevel);
  if (playerLevelBadge) playerLevelBadge.textContent = `Nv. ${playerLevel}`;
  if (hudPlayerName) hudPlayerName.textContent = payload.characterName || 'Jogador';
  if (playerGoldText) playerGoldText.textContent = `${playerGold.toLocaleString('pt-BR')}`;
  if (inventoryGoldLabel) inventoryGoldLabel.textContent = `${playerGold.toLocaleString('pt-BR')} Ouro`;

  renderCharacterModal();
  updateQuickPotionsUI();
  network.sendRequestCardAlbum();
  addChatMessage('Sistema', `Logado com sucesso como [${payload.characterName}]. Nv. ${playerLevel}!`, 'sys');

  // Collapse debug simulation panel automatically on login so the entire screen is free
  const inspector = document.getElementById('inspector-panel');
  if (inspector) {
    inspector.classList.add('collapsed');
  }
};

network.onSkillsUpdate = (payload: S2CSkillsUpdatePayload) => {
  playerEquippedSkills = { ...payload.equippedSkills };
  updateEquippedSkillsUI();
  if (skillbookModal && skillbookModal.style.display === 'flex') {
    renderGrimorioSkills(myPlayerClass);
  }
  if (payload.message) {
    addChatMessage('Sistema', payload.message, 'sys');
  }
};

network.onPlayerExpUpdate = (payload) => {
  const prevLevel = playerLevel;
  playerLevel = payload.level;
  refreshExpansionContext();
  playerCurrentXp = payload.currentXp;
  playerXpToNextLevel = payload.xpToNextLevel;

  updateExpBarUI(playerLevel, playerCurrentXp, playerXpToNextLevel);
  if (playerLevelBadge) playerLevelBadge.textContent = `Nv. ${playerLevel}`;
  if (hudHeroLevel) hudHeroLevel.textContent = `Nv. ${playerLevel}`;
  if (hudHeroLevelPill) hudHeroLevelPill.textContent = `Nv. ${playerLevel}`;
  if (playerLevel !== prevLevel) {
    updateEquippedSkillsUI();
  }

  const entities = snapshotBuffer.getInterpolatedEntities();
  const myPlayer = entities.find((e) => e.id === network.myPlayerId);
  if (myPlayer) {
    renderer.addExperienceText(myPlayer.position, payload.expGained);
  }
};

network.onRefineResult = (payload: S2CRefineResultPayload) => {
  if (payload.success) {
    addChatMessage('Forja Celestial', `✨ SUCESSO! Equipamento aprimorado para +${payload.newRefineLevel}! (+8% Atributos e CP aumentado)`, 'sys');
  } else {
    addChatMessage('Forja Celestial', `💥 FALHA no refinamento: ${payload.message}`, 'sys');
  }
  updateRefinementView();
  renderCharacterModal();
  renderInventorySlots();
};

network.onSocketResult = (payload: S2CSocketResultPayload) => {
  if (payload.success) {
    addChatMessage('Joalheria Rúnica', `💎 SUCESSO! Gema engastada no soquete #${payload.socketIndex + 1}!`, 'sys');
  } else {
    addChatMessage('Joalheria Rúnica', `❌ FALHA ao engastar: ${payload.message}`, 'sys');
  }
  updatePedrasView();
  renderCharacterModal();
  renderInventorySlots();
};

network.onCardsUpdate = (payload: S2CCardsUpdatePayload) => {
  playerCards = payload.cards;
  if (payload.message) {
    addChatMessage('Álbum de Cartas', payload.message, 'sys');
  }
  updateCartasView();
  renderCharacterModal();
};

network.onPlayerLevelUp = (payload) => {
  // Other heroes' level-up events must not unlock this player's purchases.
  if (payload.playerId !== network.myPlayerId) {
    const other = snapshotBuffer.getInterpolatedEntities().find(entity => entity.id === payload.playerId);
    if (other) renderer.addLevelUpEffect(other.position, payload.newLevel);
    return;
  }
  playerLevel = payload.newLevel;
  refreshExpansionContext();
  if (playerLevelBadge) playerLevelBadge.textContent = `Nv. ${playerLevel}`;
  if (hudHeroLevel) hudHeroLevel.textContent = `Nv. ${playerLevel}`;
  if (hudHeroLevelPill) hudHeroLevelPill.textContent = `Nv. ${playerLevel}`;
  if (hudCpVal) hudCpVal.textContent = `${payload.totalCombatPower}`;
  if (modalCpText) modalCpText.textContent = `${payload.totalCombatPower}`;

  updateEquippedSkillsUI();

  const entities = snapshotBuffer.getInterpolatedEntities();
  const targetPlayer = entities.find((e) => e.id === payload.playerId);
  if (targetPlayer) {
    renderer.addLevelUpEffect(targetPlayer.position, payload.newLevel);
  }

  if (payload.playerId === network.myPlayerId) {
    if (payload.honorTitle) {
      const honorTag = document.querySelector('.hero-honor-tag');
      if (honorTag) honorTag.textContent = payload.honorTitle;
    }
    showLevelUpBanner(payload.newLevel, payload.newAttributes);
    addChatMessage('Combate', `✦ NÍVEL SUPERADO! Você alcançou o Nível ${payload.newLevel}!`, 'combat');
  }
};

network.onRebornResult = (payload) => {
  playerLevel = payload.newLevel;
  playerRebornCount = payload.rebornCount;
  refreshExpansionContext();
  playerCombatPower = payload.totalCombatPower;
  if (hudHeroLevel) hudHeroLevel.textContent = `Nv. ${playerLevel}`;
  if (hudHeroLevelPill) hudHeroLevelPill.textContent = `Nv. ${playerLevel}`;
  if (playerLevelBadge) playerLevelBadge.textContent = `Nv. ${playerLevel}`;
  if (hudCpVal) hudCpVal.textContent = `${playerCombatPower.toLocaleString('pt-BR')}`;
  if (modalCpText) modalCpText.textContent = `${playerCombatPower.toLocaleString('pt-BR')}`;

  const honorTag = document.querySelector('.hero-honor-tag');
  if (honorTag) honorTag.textContent = payload.honorTitle;

  renderCharacterModal();
  updateExpBarUI(playerLevel, 0, 250);
  addChatMessage('Sistema', payload.message, 'sys');
};

// Skill Casting Action
function castSkill(slot: number) {
  if (!network.isConnected || !network.myPlayerId) return;

  const slotCfg = SLOT_CONFIGS.find((c) => c.slot === slot);
  const slotUI = skillSlots[slot];
  if (!slotUI || !slotUI.definition) return;

  const unlockLvl = slotCfg ? slotCfg.unlockLevel : slotUI.definition.unlockLevel;
  if (playerLevel < unlockLvl) {
    addChatMessage('Grimório', `🔒 O Slot ${slot} libera no Nível ${unlockLvl}! Abra o Grimório para planejar sua build.`, 'sys');
    openSkillbook();
    return;
  }

  const now = performance.now();
  const cdEnd = cooldownMap.get(slot);
  if (cdEnd && cdEnd > now) {
    return;
  }

  const skillDef = slotUI.definition;
  let targetId: string | undefined = undefined;
  let targetPos: { x: number; y: number; z: number } | undefined = undefined;

  const entities = snapshotBuffer.getInterpolatedEntities();
  const myPlayer = entities.find((e) => e.id === network.myPlayerId);
  if (!myPlayer) return;

  if (skillDef.isAoe) {
    if (renderer.selectedTargetId) {
      const target = entities.find((e) => e.id === renderer.selectedTargetId);
      if (target) targetPos = target.position;
    }
    if (!targetPos) targetPos = myPlayer.position;
  } else if (!skillDef.isHeal && skillDef.range > 0) {
    targetId = renderer.selectedTargetId || undefined;
  }

  network.sendCastSkill(slot, targetId, targetPos);
}

// Bind button clicks for skills 1 - 4
Object.entries(skillSlots).forEach(([slotStr, slotUI]) => {
  const slot = parseInt(slotStr, 10);
  slotUI.button.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    castSkill(slot);
  });
});

// Primary Basic Attack button & Space key
function executePrimaryAttack() {
  if (!network.isConnected || !network.myPlayerId) return;
  const entities = snapshotBuffer.getInterpolatedEntities();
  const myPlayer = entities.find((e) => e.id === network.myPlayerId);
  if (!myPlayer || myPlayer.currentHp <= 0) return;

  let targetId = renderer.selectedTargetId;
  if (!targetId) {
    let closest: InterpolatedEntity | null = null;
    let minD = 25;
    for (const ent of entities) {
      if (ent.type === 'MONSTER' && ent.currentHp > 0) {
        const d = distance(myPlayer.position, ent.position);
        if (d < minD) {
          minD = d;
          closest = ent;
        }
      }
    }
    if (closest) {
      renderer.selectedTargetId = closest.id;
      targetId = closest.id;
    }
  }

  if (targetId) {
    network.sendAttackTarget(targetId);
  }
}

if (btnPrimaryAttack) {
  btnPrimaryAttack.addEventListener('click', (e) => {
    e.stopPropagation();
    executePrimaryAttack();
  });
}

// Bind keyboard shortcuts (1, 2, 3, 4, Space, K, I, C, F, Escape, Enter)
window.addEventListener('keydown', (e) => {
  if (authSelection.isOpen() || leaderboard.isOpen() || cinematic.isOpen()) return;
  // Ignore game shortcuts while typing in any input field
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT')) {
    if (e.key === 'Escape' && chatInputField && document.activeElement === chatInputField) {
      chatInputField.blur();
    }
    return;
  }

  if (e.key === 'Enter') {
    if (chatInputField) {
      e.preventDefault();
      chatInputField.focus();
      return;
    }
  }

  if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
    castSkill(parseInt(e.key, 10));
  } else if (e.code === 'Space') {
    e.preventDefault();
    executePrimaryAttack();
  } else if (e.key === 'k' || e.key === 'K') {
    if (skillbookModal && skillbookModal.style.display === 'flex') {
      closeSkillbook();
    } else {
      openSkillbook();
    }
  } else if (e.key === 'i' || e.key === 'I') {
    toggleInventoryModal();
  } else if (e.key === 'c' || e.key === 'C') {
    toggleCharacterModal();
  } else if (e.key === 'f' || e.key === 'F') {
    toggleFarmHelper();
  } else if (e.key === 'Escape') {
    closeSkillbook();
    closeInventory();
    closeCharacterModal();
    closeFarmHelper();
  }
});

// UI Listeners
btnConnect.addEventListener('click', () => {
  enterLegacyWorld(charNameInput.value.trim() || 'Aventureiro', charClassSelect.value as CharacterClass);
});

toggleRawGhost.addEventListener('change', () => {
  renderer.showRawGhost = toggleRawGhost.checked;
});

sliderDelay.addEventListener('input', () => {
  const val = parseInt(sliderDelay.value, 10);
  snapshotBuffer.renderDelayMs = val;
  const tickCount = (val / 50).toFixed(1);
  delayLabel.textContent = `${val}ms (~${tickCount} Ticks)`;
});

const btnToggleInspector = document.getElementById('btn-toggle-inspector');
if (btnToggleInspector) {
  btnToggleInspector.addEventListener('click', () => {
    const inspector = document.getElementById('inspector-panel');
    if (inspector) {
      inspector.classList.toggle('collapsed');
    }
  });
}

const btnCloseInspector = document.getElementById('btn-close-inspector');
if (btnCloseInspector) {
  btnCloseInspector.addEventListener('click', () => {
    const inspector = document.getElementById('inspector-panel');
    if (inspector) {
      inspector.classList.add('collapsed');
    }
  });
}

// ----------------------------------------------------
// Boss Challenge, Runic Portal & Inventory Expansion
// ----------------------------------------------------
if (btnBossChallenge) {
  btnBossChallenge.addEventListener('click', () => {
    network.sendChallengeBoss();
  });
}

if (btnEnterPortal) {
  btnEnterPortal.addEventListener('click', () => {
    network.sendEnterPortal();
  });
}


// ----------------------------------------------------
// Auth presentation consumes the account-slot transport delivered by Antigravity.
// ----------------------------------------------------
function enterLegacyWorld(name: string, classType: CharacterClass): void {
  charNameInput.value = name;
  charClassSelect.value = classType;
  updateClassPreview();
  legacyLoginRequested = true;
  if (network.isConnected) network.login(name, classType);
  else network.connect();
}

const authSelection = setupAuthSelection({
  isConnected: () => network.isConnected,
  connect: () => { legacyLoginRequested = false; network.connect(); },
  disconnect: () => { farmPlayerReady = false; pendingFarmSettings = null; farmHelperUI.onDisconnected(); network.disconnect(); },
  authenticate: (username, password) => { legacyLoginRequested = false; network.sendAuthLogin(username, password); },
  register: (username, password, email) => { legacyLoginRequested = false; network.sendAuthRegister(username, password, email); },
  authenticateSocial: provider => { legacyLoginRequested = false; network.sendAuthSocial(provider, getGuestCredential(localStorage, () => crypto.randomUUID())); },
  requestList: username => { legacyLoginRequested = false; network.sendRequestCharacterList(username); },
  create: (slot, name, classType) => network.sendCreateCharacterSlot(slot, name, classType),
  select: slot => network.sendSelectCharacterSlot(slot),
});
network.onCharacterList = payload => authSelection.onCharacterList(payload);
const cinematic = setupCinematicIntro();
network.onCharacterActionError = error => { authSelection.onError(error); farmHelperUI.onError(error.errorMessage); };
network.onAuthSuccess = payload => {
  if (!payload.isActivated) { authSelection.onAuthenticationError('A conta ainda não está ativa.'); return; }
  authSelection.onAccountAuthenticated(payload.accountUsername, payload.provider);
};
network.onAuthError = error => {
  if (error.errorCode === 'UNAUTHENTICATED') {
    farmPlayerReady = false;
    pendingFarmSettings = null;
    authSelection.onDisconnected();
    farmHelperUI.onDisconnected();
    network.disconnect();
    return;
  }
  const message = error.errorCode === 'LEGACY_ACCOUNT_UNCLAIMED' || error.errorCode === 'LEGACY_CLAIM_FAILED'
    ? 'Esta conta antiga de testes não possui acesso ativo. Crie uma nova conta para continuar.' : error.errorMessage;
  authSelection.onAuthenticationError(message);
};

// ----------------------------------------------------
// Dynamic Floating Joystick (Mobile / Touch / Drag)
// ----------------------------------------------------
let isJoystickActive = false;
let joystickDir = { x: 0, y: 0, z: 0 };
let joystickCenter = { x: 0, y: 0 };
const maxJoystickRadius = 45; // px

function handleJoystickStart(clientX: number, clientY: number) {
  if (!virtualJoystickZone || !joystickThumb) return;
  joystickCenter = { x: clientX, y: clientY };
  virtualJoystickZone.style.left = `${clientX}px`;
  virtualJoystickZone.style.top = `${clientY}px`;
  virtualJoystickZone.style.display = 'block';
  virtualJoystickZone.style.opacity = '1';
  joystickThumb.style.transform = 'translate(0px, 0px)';
  isJoystickActive = true;
  isManualMovement = true;
  if (manualOverrideTimeout) {
    clearTimeout(manualOverrideTimeout);
    manualOverrideTimeout = null;
  }
}

function handleJoystickMove(clientX: number, clientY: number) {
  if (!isJoystickActive || !joystickThumb) return;
  const dx = clientX - joystickCenter.x;
  const dy = clientY - joystickCenter.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let clampedX = dx;
  let clampedY = dy;
  if (dist > maxJoystickRadius) {
    clampedX = (dx / dist) * maxJoystickRadius;
    clampedY = (dy / dist) * maxJoystickRadius;
  }

  joystickThumb.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
  joystickDir = {
    x: clampedX / maxJoystickRadius,
    y: 0,
    z: clampedY / maxJoystickRadius,
  };
}

function handleJoystickEnd() {
  if (!isJoystickActive) return;
  isJoystickActive = false;
  joystickDir = { x: 0, y: 0, z: 0 };
  if (joystickThumb) joystickThumb.style.transform = 'translate(0px, 0px)';
  if (virtualJoystickZone) virtualJoystickZone.style.display = 'none';

  // Send stop command
  const entities = snapshotBuffer.getInterpolatedEntities();
  const myPlayer = entities.find((e) => e.id === network.myPlayerId);
  const currentPos = myPlayer ? myPlayer.position : { x: 0, y: 0, z: 0 };
  network.sendMoveDirection({ x: 0, y: 0, z: 0 }, currentPos);

  // Resume auto-navigation smoothly after releasing
  if (manualOverrideTimeout) clearTimeout(manualOverrideTimeout);
  manualOverrideTimeout = window.setTimeout(() => {
    isManualMovement = false;
  }, 400);
}

// Global pointer events for floating joystick on left screen area
window.addEventListener('pointerdown', (e) => {
  if (authSelection.isOpen() || leaderboard.isOpen() || cinematic.isOpen()) return;
  const target = e.target as HTMLElement | null;
  if (target && (target.closest('.modal-backdrop') || target.closest('#inspector-panel') || target.closest('#hero-status-card') || target.closest('#mobile-combat-arc-container') || target.closest('#bottom-center-zone') || target.closest('#top-right-location-card') || target.closest('#top-center-wave-card') || target.closest('#dock-navigation-bar') || target.closest('#right-vertical-dock'))) {
    return;
  }

  // Floating joystick activates on left screen touch/drag
  if (e.clientX < window.innerWidth * 0.52 && e.clientY > 110) {
    handleJoystickStart(e.clientX, e.clientY);
  }
});

window.addEventListener('pointermove', (e) => {
  if (isJoystickActive) {
    handleJoystickMove(e.clientX, e.clientY);
  }
});

window.addEventListener('pointerup', handleJoystickEnd);
window.addEventListener('pointercancel', handleJoystickEnd);

// Canvas Hover Feedback (Hand cursor over ground item drops)
canvas.addEventListener('pointermove', (e) => {
  const hoveredDrop = renderer.getDropAtScreenPos(e.clientX, e.clientY, 32);
  if (hoveredDrop) {
    canvas.style.cursor = 'grab';
    canvas.title = `🖐️ Coletar ${hoveredDrop.name}`;
  } else {
    canvas.style.cursor = 'default';
    canvas.title = '';
  }
});

// Canvas Interaction (Targeting, Manual Click-to-Move & Looting)
canvas.addEventListener('pointerdown', (e) => {
  if (!network.isConnected || !network.myPlayerId) return;

  // 1. Direct check: Ground item drop clicked (Screen-space & World-space)
  const screenDrop = renderer.getDropAtScreenPos(e.clientX, e.clientY, 34);
  const clickWorldPos = renderer.screenToWorld(e.clientX, e.clientY);
  const nearestDrop = screenDrop || renderer.findDropNearWorldPos(clickWorldPos, 3.5);

  if (nearestDrop) {
    network.sendLootItem(nearestDrop.dropId);
    addChatMessage('Saque', `🖐️ Coletando [${nearestDrop.name}] do chão...`, 'sys');
    const entities = snapshotBuffer.getInterpolatedEntities();
    const myPlayer = entities.find((e) => e.id === network.myPlayerId);
    const currentPos = myPlayer ? myPlayer.position : { x: 0, y: 0, z: 0 };
    network.sendMoveInput(nearestDrop.position, currentPos);
    isManualMovement = true;
    if (manualOverrideTimeout) clearTimeout(manualOverrideTimeout);
    manualOverrideTimeout = window.setTimeout(() => { isManualMovement = false; }, 2000);
    return;
  }

  // Prevent virtual joystick zone conflicts for movement on touch devices
  if (e.pointerType === 'touch' && e.clientX < window.innerWidth * 0.52 && e.clientY > 110) return;

  const entities = snapshotBuffer.getInterpolatedEntities();

  // 2. Check if clicked on a monster to target
  let clickedMonsterId: string | null = null;
  let minDistance = 2.8;

  for (const ent of entities) {
    if (ent.type === 'MONSTER' && ent.currentHp > 0) {
      const d = distance(clickWorldPos, ent.position);
      if (d < minDistance) {
        minDistance = d;
        clickedMonsterId = ent.id;
      }
    }
  }

  if (clickedMonsterId) {
    renderer.selectedTargetId = clickedMonsterId;
    network.sendAttackTarget(clickedMonsterId);
  } else {
    // Manual click-to-move overrides auto temporarily
    const myPlayer = entities.find((e) => e.id === network.myPlayerId);
    const currentPos = myPlayer ? myPlayer.position : { x: 0, y: 0, z: 0 };
    network.sendMoveInput(clickWorldPos, currentPos);
    isManualMovement = true;
    if (manualOverrideTimeout) clearTimeout(manualOverrideTimeout);
    manualOverrideTimeout = window.setTimeout(() => { isManualMovement = false; }, 2500);
  }
});

// Render Loop (60Hz / 120Hz native display rate)
let frameCount = 0;
let lastFpsTime = performance.now();
let lastJoystickSendTime = 0;

function gameLoop() {
  requestAnimationFrame(gameLoop);

  const now = performance.now();
  frameCount++;
  if (now - lastFpsTime >= 1000) {
    if (fpsText) fpsText.textContent = `${frameCount} FPS`;
    frameCount = 0;
    lastFpsTime = now;
  }

  // If joystick is active, stream continuous direction at 20Hz (every 50ms)
  if (isJoystickActive && (joystickDir.x !== 0 || joystickDir.z !== 0)) {
    if (now - lastJoystickSendTime >= 50) {
      const entities = snapshotBuffer.getInterpolatedEntities();
      const myPlayer = entities.find((e) => e.id === network.myPlayerId);
      const currentPos = myPlayer ? myPlayer.position : { x: 0, y: 0, z: 0 };
      network.sendMoveDirection(joystickDir, currentPos);
      lastJoystickSendTime = now;
    }
  }

  // Retrieve interpolated states from snapshot buffer
  const useInterpolation = toggleInterpolation.checked;
  const entities = snapshotBuffer.getInterpolatedEntities(useInterpolation);

  // ----------------------------------------------------
  // Fluid Auto-Play & Navigation Loop
  // ----------------------------------------------------
  if (isAutoPlayActive && !isManualMovement && network.isConnected && network.myPlayerId) {
    if (now - lastAutoCombatTick >= 100) {
      lastAutoCombatTick = now;
      const myPlayer = entities.find((e) => e.id === network.myPlayerId);

      if (myPlayer && myPlayer.currentHp > 0) {
        const chosenClass = (charClassSelect.value as CharacterClass) || CharacterClass.GUERREIRO;
        const classDef = CLASS_DEFINITIONS[chosenClass];
        const attackRange = classDef ? classDef.attackRange : 2.5;

        // 1. Auto-collect nearby drops
        const nearbyDrop = renderer.findDropNearWorldPos(myPlayer.position, 6.0);
        if (nearbyDrop) {
          network.sendLootItem(nearbyDrop.dropId);
        }

        // 2. Target validation
        let targetEnt: (typeof entities)[0] | undefined = undefined;
        if (renderer.selectedTargetId) {
          targetEnt = entities.find((e) => e.id === renderer.selectedTargetId && e.currentHp > 0);
          if (!targetEnt) renderer.selectedTargetId = null;
        }

        // 3. Find closest living monster if no target
        if (!targetEnt) {
          let closestDist = 9999;
          for (const ent of entities) {
            if (ent.type === 'MONSTER' && ent.currentHp > 0) {
              const d = distance(myPlayer.position, ent.position);
              if (d < closestDist) {
                closestDist = d;
                targetEnt = ent;
              }
            }
          }
          if (targetEnt) {
            renderer.selectedTargetId = targetEnt.id;
          }
        }

        // 4. Auto pathing and combat execution
        if (targetEnt) {
          const d = distance(myPlayer.position, targetEnt.position);
          const stopDist = Math.max(1.4, attackRange - 0.35);

          if (d > stopDist) {
            const dx = targetEnt.position.x - myPlayer.position.x;
            const dz = targetEnt.position.z - myPlayer.position.z;
            const len = Math.sqrt(dx * dx + dz * dz) || 1;
            network.sendMoveDirection({ x: dx / len, y: 0, z: dz / len }, myPlayer.position);
          } else {
            network.sendMoveDirection({ x: 0, y: 0, z: 0 }, myPlayer.position);

            // Try casting ready unlocked skills 4 -> 3 -> 2 -> 1
            let castedSkill = false;
            for (let slot = 4; slot >= 1; slot--) {
              const slotCfg = SLOT_CONFIGS.find((c) => c.slot === slot);
              const cd = cooldownMap.get(slot);
              const slotUI = skillSlots[slot];
              if ((!cd || cd <= now) && slotUI && slotUI.definition) {
                const def = slotUI.definition;
                const unlockLvl = slotCfg ? slotCfg.unlockLevel : def.unlockLevel;
                if (playerLevel < unlockLvl) continue;
                const currentRes = myPlayer.currentResource ?? 100;
                if (currentRes >= def.cost) {
                  castSkill(slot);
                  castedSkill = true;
                  break;
                }
              }
            }

            if (!castedSkill) {
              network.sendAttackTarget(targetEnt.id);
            }
          }
        } else {
          // Fallback: If no living monster found (during brief respawn interval), move towards central battle arena (0,0)
          const distToCenter = Math.hypot(myPlayer.position.x, myPlayer.position.z);
          if (distToCenter > 3.0) {
            const dirX = -myPlayer.position.x / distToCenter;
            const dirZ = -myPlayer.position.z / distToCenter;
            network.sendMoveDirection({ x: dirX, y: 0, z: dirZ }, myPlayer.position);
          } else {
            network.sendMoveDirection({ x: 0, y: 0, z: 0 }, myPlayer.position);
          }
        }
      }
    }
  }

  // 1. Update Cooldown UI overlays
  for (const [slotStr, slotUI] of Object.entries(skillSlots)) {
    const slot = parseInt(slotStr, 10);
    const cdEnd = cooldownMap.get(slot);
    if (cdEnd && cdEnd > now) {
      const remainingSec = (cdEnd - now) / 1000;
      slotUI.overlay.classList.add('active');
      slotUI.cdText.textContent = `${remainingSec.toFixed(1)}s`;
    } else {
      if (slotUI.overlay.classList.contains('active')) {
        slotUI.overlay.classList.remove('active');
      }
      cooldownMap.delete(slot);
    }
  }

  // 2. Update Player Vitals HUD (HP & Mana/Energy)
  const myPlayer = entities.find((e) => e.id === network.myPlayerId);
  if (myPlayer) {
    const hpPct = Math.max(0, Math.min(100, (myPlayer.currentHp / myPlayer.maxHp) * 100));
    if (playerHpBar) playerHpBar.style.width = `${hpPct}%`;
    if (playerHpText) playerHpText.textContent = `${myPlayer.currentHp} / ${myPlayer.maxHp}`;

    if (hudHeroHpBar) hudHeroHpBar.style.width = `${hpPct}%`;
    if (hudHeroHpText) hudHeroHpText.textContent = `${myPlayer.currentHp} / ${myPlayer.maxHp}`;

    let resPct = 100;
    if (myPlayer.currentResource !== undefined && myPlayer.maxResource) {
      resPct = Math.max(0, Math.min(100, (myPlayer.currentResource / myPlayer.maxResource) * 100));
      if (playerResourceBar) {
        playerResourceBar.style.width = `${resPct}%`;
        playerResourceBar.className = `vital-bar-fill ${myPlayer.resourceType === 'Energia' ? 'energy-fill' : 'mp-fill'}`;
      }
      if (playerResourceText) playerResourceText.textContent = `${myPlayer.currentResource} / ${myPlayer.maxResource}`;
      if (playerResourceLabel) playerResourceLabel.textContent = myPlayer.resourceType === 'Energia' ? 'EN' : 'MP';

      if (hudHeroMpBar) hudHeroMpBar.style.width = `${resPct}%`;
      if (hudHeroMpText) hudHeroMpText.textContent = `${myPlayer.currentResource} / ${myPlayer.maxResource}`;
    }

    if (myPlayer.level && playerLevelBadge) {
      playerLevelBadge.textContent = `Nv. ${myPlayer.level}`;
    }
    if (myPlayer.level && hudHeroLevel) {
      hudHeroLevel.textContent = `Nv. ${myPlayer.level}`;
    }
    if (myPlayer.level && hudHeroLevelPill) {
      hudHeroLevelPill.textContent = `Nv. ${myPlayer.level}`;
    }
    if (hudHeroName) {
      hudHeroName.textContent = myPlayer.name || charNameInput.value.trim() || 'Aventureiro';
    }

  }

  // 3. Update Target Vitals HUD
  if (renderer.selectedTargetId) {
    const target = entities.find((e) => e.id === renderer.selectedTargetId);
    if (target && target.currentHp > 0) {
      if (targetVitalRow) targetVitalRow.style.display = 'flex';
      if (targetNameLabel) targetNameLabel.textContent = target.name;
      if (targetLevelBadge) {
        targetLevelBadge.textContent = `Nv. ${target.level ?? 1}`;
      }
      const targetHpPct = Math.max(0, Math.min(100, (target.currentHp / target.maxHp) * 100));
      if (targetHpBar) targetHpBar.style.width = `${targetHpPct}%`;
      if (targetHpText) targetHpText.textContent = `${target.currentHp} / ${target.maxHp}`;
    } else {
      if (targetVitalRow) targetVitalRow.style.display = 'none';
      renderer.selectedTargetId = null;
    }
  } else {
    if (targetVitalRow) targetVitalRow.style.display = 'none';
  }

  // Render frame
  renderer.render(entities, network.myPlayerId);
}

// Start visual render loop
requestAnimationFrame(gameLoop);

// Connection starts only after an explicit entry action.
