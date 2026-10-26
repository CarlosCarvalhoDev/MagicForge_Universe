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
} from '@magicforge/shared';
import { ClientNetwork } from './network/ClientNetwork';
import { SnapshotBuffer } from './interpolation/SnapshotBuffer';
import { GameRenderer } from './renderer/GameRenderer';

// DOM Elements
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const statusDot = document.getElementById('status-dot') as HTMLDivElement;
const connectionStatus = document.getElementById('connection-status') as HTMLSpanElement;
const pingText = document.getElementById('ping-text') as HTMLSpanElement;
const tickText = document.getElementById('tick-text') as HTMLSpanElement;
const fpsText = document.getElementById('fps-text') as HTMLSpanElement;

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

// Vitals HUD DOM Elements
const playerHpBar = document.getElementById('player-hp-bar') as HTMLDivElement;
const playerHpText = document.getElementById('player-hp-text') as HTMLSpanElement;
const playerResourceBar = document.getElementById('player-resource-bar') as HTMLDivElement;
const playerResourceText = document.getElementById('player-resource-text') as HTMLSpanElement;
const playerResourceLabel = document.getElementById('player-resource-label') as HTMLDivElement;

const targetVitalRow = document.getElementById('target-vital-row') as HTMLDivElement;
const targetNameLabel = document.getElementById('target-name-label') as HTMLDivElement;
const targetLevelBadge = document.getElementById('target-level-badge') as HTMLSpanElement | null;
const targetHpBar = document.getElementById('target-hp-bar') as HTMLDivElement;
const targetHpText = document.getElementById('target-hp-text') as HTMLSpanElement;

// Level & EXP HUD Elements & State
const playerLevelBadge = document.getElementById('player-level-badge') as HTMLSpanElement | null;
const hudPlayerName = document.getElementById('hud-player-name') as HTMLSpanElement | null;
const hudCpVal = document.getElementById('hud-cp-val') as HTMLSpanElement | null;
const playerExpBar = document.getElementById('player-exp-bar') as HTMLDivElement | null;
const playerExpText = document.getElementById('player-exp-text') as HTMLSpanElement | null;

// Top-Left Hero Card DOM (Stickman Go Style)
const hudHeroPortrait = document.getElementById('hud-hero-portrait') as HTMLImageElement | null;
const hudHeroLevel = document.getElementById('hud-hero-level') as HTMLSpanElement | null;
const hudHeroName = document.getElementById('hud-hero-name') as HTMLSpanElement | null;
const hudCpBig = document.getElementById('hud-cp-big') as HTMLSpanElement | null;
const hudHeroHpBar = document.getElementById('hud-hero-hp-bar') as HTMLDivElement | null;
const hudHeroHpText = document.getElementById('hud-hero-hp-text') as HTMLSpanElement | null;
const hudHeroMpBar = document.getElementById('hud-hero-mp-bar') as HTMLDivElement | null;
const hudHeroMpText = document.getElementById('hud-hero-mp-text') as HTMLSpanElement | null;
const hudAvatarBtn = document.getElementById('hud-avatar-btn') as HTMLDivElement | null;

// Top-Center & Top-Right Cards
const waveProgressText = document.getElementById('wave-progress-text') as HTMLSpanElement | null;
const btnBossChallenge = document.getElementById('btn-boss-challenge') as HTMLButtonElement | null;
const currentStageBadge = document.getElementById('current-stage-badge') as HTMLSpanElement | null;
const zoneLocationTitle = document.getElementById('zone-location-title') as HTMLSpanElement | null;
const btnPowerSave = document.getElementById('btn-power-save') as HTMLButtonElement | null;

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
const sliderAutoHp = document.getElementById('slider-auto-hp') as HTMLInputElement | null;
const labelAutoHp = document.getElementById('label-auto-hp') as HTMLSpanElement | null;
const sliderAutoMp = document.getElementById('slider-auto-mp') as HTMLInputElement | null;
const labelAutoMp = document.getElementById('label-auto-mp') as HTMLSpanElement | null;
const chkAutoSellCommon = document.getElementById('chk-auto-sell-common') as HTMLInputElement | null;
const chkAutoSellUncommon = document.getElementById('chk-auto-sell-uncommon') as HTMLInputElement | null;
const chkAutoSellRare = document.getElementById('chk-auto-sell-rare') as HTMLInputElement | null;
const btnSaveFarmHelper = document.getElementById('btn-save-farm-helper') as HTMLButtonElement | null;

// Quick Use Toast Notification
const quickUseToast = document.getElementById('quick-use-toast') as HTMLDivElement | null;
const quickUseIcon = document.getElementById('quick-use-icon') as HTMLDivElement | null;
const quickUseName = document.getElementById('quick-use-name') as HTMLSpanElement | null;
const btnQuickUseAction = document.getElementById('btn-quick-use-action') as HTMLButtonElement | null;

let playerLevel: number = 1;
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

function updateSkillsForClass(chosenClass: CharacterClass) {
  const classSkills = Object.values(SKILLS_DATABASE)
    .filter((s) => s.classType === chosenClass)
    .sort((a, b) => a.slot - b.slot);

  for (const s of classSkills) {
    const slotUI = skillSlots[s.slot];
    if (slotUI) {
      slotUI.definition = s;
      slotUI.img.src = `/assets/skills/${s.skillId}.png`;
      slotUI.img.alt = s.name;
      slotUI.cost.textContent = `${s.cost} ${s.resourceType === 'Energia' ? 'EN' : 'MP'}`;
      slotUI.cost.style.color = s.resourceType === 'Energia' ? '#facc15' : '#38bdf8';
      slotUI.button.title = `[Slot ${s.slot}] ${s.name} (Tier ${s.tier})\nCusto: ${s.cost} ${s.resourceType} • Recarga: ${s.cooldownSec}s\nAlcance: ${s.range}m\n${s.description}`;
    }
  }
}

// Skill Book (Grimório) Modal Elements & Logic
const skillbookModal = document.getElementById('skillbook-modal') as HTMLDivElement;
const btnOpenSkillbook = document.getElementById('btn-open-skillbook') as HTMLButtonElement;
const btnCloseSkillbook = document.getElementById('btn-close-skillbook') as HTMLButtonElement;
const skillbookClassTabs = document.getElementById('skillbook-class-tabs') as HTMLDivElement;
const skillbookCardsGrid = document.getElementById('skillbook-cards-grid') as HTMLDivElement;

let currentGrimorioClass: CharacterClass = CharacterClass.GUERREIRO;

function openSkillbook(classType?: CharacterClass) {
  if (classType) {
    currentGrimorioClass = classType;
  } else {
    currentGrimorioClass = (charClassSelect.value as CharacterClass) || CharacterClass.GUERREIRO;
  }
  renderGrimorioTabs();
  renderGrimorioSkills(currentGrimorioClass);
  skillbookModal.style.display = 'flex';
}

function closeSkillbook() {
  skillbookModal.style.display = 'none';
}

if (btnOpenSkillbook) btnOpenSkillbook.addEventListener('click', () => openSkillbook());
if (btnCloseSkillbook) btnCloseSkillbook.addEventListener('click', closeSkillbook);
if (skillbookModal) {
  skillbookModal.addEventListener('click', (e) => {
    if (e.target === skillbookModal) closeSkillbook();
  });
}

function renderGrimorioTabs() {
  if (!skillbookClassTabs) return;
  skillbookClassTabs.innerHTML = '';
  const classes = Object.values(CharacterClass);

  classes.forEach((cls) => {
    const btn = document.createElement('button');
    btn.className = `class-tab-btn ${cls === currentGrimorioClass ? 'active' : ''}`;
    const def = CLASS_DEFINITIONS[cls];
    btn.textContent = def ? def.displayName : cls;
    btn.addEventListener('click', () => {
      currentGrimorioClass = cls;
      renderGrimorioTabs();
      renderGrimorioSkills(cls);
    });
    skillbookClassTabs.appendChild(btn);
  });
}

function renderGrimorioSkills(classType: CharacterClass) {
  if (!skillbookCardsGrid) return;
  skillbookCardsGrid.innerHTML = '';
  const skills = Object.values(SKILLS_DATABASE)
    .filter((s) => s.classType === classType)
    .sort((a, b) => a.slot - b.slot);

  skills.forEach((s) => {
    const card = document.createElement('div');
    card.className = 'skill-card';
    card.innerHTML = `
      <img src="/assets/skills/${s.skillId}.png" alt="${s.name}" class="skill-card-img" />
      <div class="skill-card-info">
        <div class="skill-card-title-row">
          <span class="skill-card-title">[Slot ${s.slot}] ${s.name}</span>
          <span class="skill-tier-badge">Tier ${s.tier} (Nv. ${s.unlockLevel})</span>
        </div>
        <div class="skill-meta-pills">
          <span class="skill-pill cost">${s.cost} ${s.resourceType}</span>
          <span class="skill-pill cooldown">⏱️ ${s.cooldownSec}s CD</span>
          <span class="skill-pill type">🎯 ${s.range === 0 ? 'Pessoal' : s.isAoe ? `Área (${s.aoeRadius || 5}m)` : `${s.range}m`}</span>
          <span class="skill-pill" style="color: #f59e0b;">⚔️ ${s.damageType}</span>
        </div>
        <p class="skill-card-desc">${s.description}</p>
      </div>
    `;
    skillbookCardsGrid.appendChild(card);
  });
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
let playerGold: number = 0;
let playerCombatPower: number = 1000;
let selectedSlotIndex: number | null = null;

function getItemEmoji(itemId: string, type: ItemType): string {
  if (itemId === 'gold') return '💰';
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

function openInventory() {
  if (!inventoryModal) return;
  inventoryModal.style.display = 'flex';
  if (selectedSlotIndex === null && playerInventory.length > 0) {
    selectedSlotIndex = playerInventory[0].slotIndex;
  }
  renderInventorySlots();
  if (selectedSlotIndex !== null) {
    selectInventorySlot(selectedSlotIndex);
  }
}

function closeInventory() {
  if (!inventoryModal) return;
  inventoryModal.style.display = 'none';
}

function toggleInventoryModal(force?: boolean) {
  if (!inventoryModal) return;
  const isCurrentlyOpen = inventoryModal.style.display === 'flex';
  const shouldOpen = force !== undefined ? force : !isCurrentlyOpen;
  if (shouldOpen) {
    openInventory();
  } else {
    closeInventory();
  }
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

function renderInventorySlots() {
  if (!inventorySlotsGrid) return;
  inventorySlotsGrid.innerHTML = '';

  for (let slot = 0; slot < 20; slot++) {
    const item = playerInventory.find((i) => i.slotIndex === slot);
    const itemDef = item ? ITEMS_DATABASE[item.itemId] : null;

    const slotEl = document.createElement('div');
    slotEl.className = 'inventory-slot';
    if (slot === selectedSlotIndex) slotEl.classList.add('selected');

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
    } else {
      // Empty slot placeholder
      slotEl.style.opacity = '0.35';
    }

    slotEl.addEventListener('click', () => {
      selectInventorySlot(slot);
    });

    inventorySlotsGrid.appendChild(slotEl);
  }
}

function selectInventorySlot(slotIndex: number) {
  selectedSlotIndex = slotIndex;
  renderInventorySlots();

  const item = playerInventory.find((i) => i.slotIndex === slotIndex);
  const itemDef = item ? ITEMS_DATABASE[item.itemId] : null;

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
    if (inspectorDesc) inspectorDesc.textContent = 'Vença monstros e explore as forjas antigas para saquear equipamentos épicos e ingredientes.';
    if (inspectorSellPrice) inspectorSellPrice.textContent = '--';
    if (btnInventoryAction) btnInventoryAction.style.display = 'none';
    return;
  }

  const rarityTheme = RARITY_COLORS[itemDef.rarity] || { border: '#ffffff', glow: 'rgba(255,255,255,0.3)', text: '#ffffff', bg: 'rgba(30,41,59,0.6)' };

  if (inspectorIcon) {
    inspectorIcon.textContent = getItemEmoji(item.itemId, itemDef.type);
    inspectorIcon.style.borderColor = rarityTheme.border;
  }
  if (inspectorName) {
    inspectorName.textContent = itemDef.name;
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

  if (inspectorStatsList) {
    inspectorStatsList.innerHTML = '';
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
      row.innerHTML = `<span style="color: #94a3b8;">Tipo:</span><strong>Material de Forja e Alquimia</strong>`;
      inspectorStatsList.appendChild(row);
    }
  }

  if (btnInventoryAction) {
    if (itemDef.type === ItemType.EQUIPAMENTO) {
      btnInventoryAction.style.display = 'block';
      btnInventoryAction.textContent = item.isEquipped ? 'Desequipar' : 'Equipar';
      btnInventoryAction.style.background = item.isEquipped ? '#dc2626' : 'linear-gradient(135deg, #d97706, #b45309)';
      btnInventoryAction.onclick = () => {
        network.sendUseItem(item.slotIndex);
      };
    } else if (itemDef.type === ItemType.CONSUMIVEL) {
      btnInventoryAction.style.display = 'block';
      btnInventoryAction.textContent = 'Usar Item (Consumir)';
      btnInventoryAction.style.background = 'linear-gradient(135deg, #059669, #047857)';
      btnInventoryAction.onclick = () => {
        network.sendUseItem(item.slotIndex);
      };
    } else {
      btnInventoryAction.style.display = 'none';
    }
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
      slotEl.style.borderColor = rarityTheme.border;
      slotEl.style.boxShadow = `0 0 12px ${rarityTheme.glow}`;
      slotEl.innerHTML = `
        <span class="slot-placeholder-icon" style="font-size: 1.5rem;">${getItemEmoji(def.itemId, def.type)}</span>
        <span class="slot-label" style="color: ${rarityTheme.text}; font-weight: 700;">${def.name}</span>
      `;
      slotEl.title = `[Equipado] ${def.name} (${def.rarity})\nClique para Desequipar`;
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
  });
}

function openCharacterModal(): void {
  if (!characterModal) return;
  characterModal.style.display = 'flex';
  renderCharacterModal();
}

function closeCharacterModal(): void {
  if (!characterModal) return;
  characterModal.style.display = 'none';
}

function toggleCharacterModal(force?: boolean): void {
  if (!characterModal) return;
  const isCurrentlyOpen = characterModal.style.display === 'flex';
  const shouldOpen = force !== undefined ? force : !isCurrentlyOpen;
  if (shouldOpen) {
    openCharacterModal();
  } else {
    closeCharacterModal();
  }
}

// ==========================================
// Farm Helper (Automação Idle & Auto-Venda)
// ==========================================
interface FarmHelperSettings {
  autoHpPercent: number;
  autoMpPercent: number;
  autoSellCommon: boolean;
  autoSellUncommon: boolean;
  autoSellRare: boolean;
}

const FARM_STORAGE_KEY = 'magicforge_farm_helper_config';
let farmSettings: FarmHelperSettings = {
  autoHpPercent: 60,
  autoMpPercent: 40,
  autoSellCommon: true,
  autoSellUncommon: true,
  autoSellRare: false,
};

function loadFarmHelperSettings(): void {
  try {
    const raw = localStorage.getItem(FARM_STORAGE_KEY);
    if (raw) {
      farmSettings = { ...farmSettings, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore
  }

  if (sliderAutoHp) sliderAutoHp.value = `${farmSettings.autoHpPercent}`;
  if (labelAutoHp) labelAutoHp.textContent = `Usar se HP < ${farmSettings.autoHpPercent}%`;
  if (sliderAutoMp) sliderAutoMp.value = `${farmSettings.autoMpPercent}`;
  if (labelAutoMp) labelAutoMp.textContent = `Usar se Recurso < ${farmSettings.autoMpPercent}%`;

  if (chkAutoSellCommon) chkAutoSellCommon.checked = farmSettings.autoSellCommon;
  if (chkAutoSellUncommon) chkAutoSellUncommon.checked = farmSettings.autoSellUncommon;
  if (chkAutoSellRare) chkAutoSellRare.checked = farmSettings.autoSellRare;
}

function saveFarmHelperSettings(): void {
  if (sliderAutoHp) farmSettings.autoHpPercent = parseInt(sliderAutoHp.value, 10);
  if (sliderAutoMp) farmSettings.autoMpPercent = parseInt(sliderAutoMp.value, 10);
  if (chkAutoSellCommon) farmSettings.autoSellCommon = chkAutoSellCommon.checked;
  if (chkAutoSellUncommon) farmSettings.autoSellUncommon = chkAutoSellUncommon.checked;
  if (chkAutoSellRare) farmSettings.autoSellRare = chkAutoSellRare.checked;

  try {
    localStorage.setItem(FARM_STORAGE_KEY, JSON.stringify(farmSettings));
  } catch {
    // Ignore
  }
}

function openFarmHelper(): void {
  if (!farmHelperModal) return;
  loadFarmHelperSettings();
  farmHelperModal.style.display = 'flex';
}

function closeFarmHelper(): void {
  if (!farmHelperModal) return;
  farmHelperModal.style.display = 'none';
}

function toggleFarmHelper(force?: boolean): void {
  if (!farmHelperModal) return;
  const isCurrentlyOpen = farmHelperModal.style.display === 'flex';
  const shouldOpen = force !== undefined ? force : !isCurrentlyOpen;
  if (shouldOpen) openFarmHelper();
  else closeFarmHelper();
}

let lastAutoHpPotionTime = 0;
let lastAutoMpPotionTime = 0;

function checkAutoPotions(hp: number, maxHp: number, mp: number, maxMp: number): void {
  if (!network.isConnected) return;
  const now = performance.now();

  // 1. Check HP Potion
  if (maxHp > 0 && (hp / maxHp) * 100 < farmSettings.autoHpPercent) {
    if (now - lastAutoHpPotionTime > 2000) {
      const potion = playerInventory.find((i) => i.itemId.startsWith('potion_hp_'));
      if (potion) {
        lastAutoHpPotionTime = now;
        network.sendUseItem(potion.slotIndex);
      }
    }
  }

  // 2. Check MP Potion
  if (maxMp > 0 && (mp / maxMp) * 100 < farmSettings.autoMpPercent) {
    if (now - lastAutoMpPotionTime > 2000) {
      const potion = playerInventory.find((i) => i.itemId.startsWith('potion_mp_'));
      if (potion) {
        lastAutoMpPotionTime = now;
        network.sendUseItem(potion.slotIndex);
      }
    }
  }
}

function processAutoSell(): void {
  if (!network.isConnected) return;
  for (const item of playerInventory) {
    if (item.isEquipped) continue;
    const def = ITEMS_DATABASE[item.itemId];
    if (!def) continue;

    const isCommon = def.rarity === ItemRarity.COMUM && farmSettings.autoSellCommon;
    const isUncommon = def.rarity === ItemRarity.INCOMUM && farmSettings.autoSellUncommon;
    const isRare = def.rarity === ItemRarity.RARO && farmSettings.autoSellRare;

    if (isCommon || isUncommon || isRare) {
      network.sendSellItem(item.slotIndex);
      break; // Send one per tick / batch
    }
  }
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
  alert(`🏆 MagicForge: Rankings Globais\n\n1º LordKael - CP: 18.420 (Mago)\n2º Valerius - CP: 16.900 (Guerreiro)\n3º Selene - CP: 15.350 (Arqueira)\n\nSeu CP Atual: ${playerCombatPower.toLocaleString('pt-BR')} (Top 12%)`);
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

if (sliderAutoHp && labelAutoHp) {
  sliderAutoHp.addEventListener('input', () => {
    labelAutoHp.textContent = `Usar se HP < ${sliderAutoHp.value}%`;
  });
}
if (sliderAutoMp && labelAutoMp) {
  sliderAutoMp.addEventListener('input', () => {
    labelAutoMp.textContent = `Usar se Recurso < ${sliderAutoMp.value}%`;
  });
}
if (btnSaveFarmHelper) {
  btnSaveFarmHelper.addEventListener('click', () => {
    saveFarmHelperSettings();
    closeFarmHelper();
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

// Initial farm helper settings load
loadFarmHelperSettings();

// Core Game Client Systems
const network = new ClientNetwork();
const snapshotBuffer = new SnapshotBuffer();
const renderer = new GameRenderer(canvas);

// Resize handling
function handleResize() {
  renderer.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleResize);
handleResize();

// Network Event Wiring
network.onConnectionStateChange = (connected) => {
  if (connected) {
    statusDot.classList.add('online');
    connectionStatus.textContent = 'Conectado (Online)';
    btnConnect.textContent = 'Reconectar';

    // Auto-login upon connection
    const name = charNameInput.value.trim() || 'Aventureiro';
    const chosenClass = (charClassSelect.value as CharacterClass) || CharacterClass.GUERREIRO;
    network.login(name, chosenClass);
  } else {
    statusDot.classList.remove('online');
    connectionStatus.textContent = 'Desconectado';
    btnConnect.textContent = 'Conectar ao Servidor';
  }
};

network.onLatencyUpdated = (ping) => {
  pingText.textContent = `${ping} ms`;
};

network.onSnapshot = (snapshot) => {
  tickText.textContent = `#${snapshot.serverTick} (20Hz)`;
  snapshotBuffer.pushSnapshot(snapshot);
};

network.onCombatEvent = (event) => {
  // Trigger attack and hit/death animations on sprite sheets
  renderer.triggerEntityAnimation(event.attackerId, 'attack');
  if (event.isTargetDead) {
    renderer.triggerEntityAnimation(event.targetId, 'death');
  } else if (!event.isDodged && event.damage > 0) {
    renderer.triggerEntityAnimation(event.targetId, 'hit');
  }

  // Find target position from current snapshot
  const entities = snapshotBuffer.getInterpolatedEntities();
  const target = entities.find((e) => e.id === event.targetId);
  if (target) {
    renderer.addDamageText(target.position, event.damage, event.isCritical, event.isDodged);
  }
};

network.onSkillCastEvent = (event: S2CSkillCastEventPayload) => {
  renderer.triggerEntityAnimation(event.casterId, 'attack');
  if (event.targetId && !event.isHeal) {
    renderer.triggerEntityAnimation(event.targetId, 'hit');
  }

  // If local player casted, start cooldown
  if (event.casterId === network.myPlayerId) {
    const slotUI = skillSlots[event.slot];
    if (slotUI && slotUI.definition) {
      cooldownMap.set(event.slot, performance.now() + slotUI.definition.cooldownSec * 1000);
    }
  }

  // Visual floating effect text
  const entities = snapshotBuffer.getInterpolatedEntities();
  let effectPos = { x: 0, y: 0, z: 0 };

  if (event.targetPosition) {
    effectPos = event.targetPosition;
  } else if (event.targetId) {
    const target = entities.find((e) => e.id === event.targetId);
    if (target) effectPos = target.position;
  }

  if (effectPos.x === 0 && effectPos.z === 0) {
    const caster = entities.find((e) => e.id === event.casterId);
    if (caster) effectPos = caster.position;
  }

  renderer.addSkillEffectText(effectPos, event.skillName, event.damageOrHeal, event.isHeal, event.isCritical);
};

network.onItemDropSpawn = (payload) => {
  renderer.addOrUpdateDrop(payload);
};

network.onItemDropDespawn = (payload) => {
  renderer.removeDrop(payload.dropId);
};

network.onInventoryUpdate = (payload: S2CInventoryUpdatePayload) => {
  playerInventory = payload.slots;
  playerGold = payload.gold;
  playerCombatPower = payload.totalCombatPower;

  if (playerGoldText) playerGoldText.textContent = `${playerGold.toLocaleString('pt-BR')} Ouro`;
  if (inventoryGoldLabel) inventoryGoldLabel.textContent = `${playerGold.toLocaleString('pt-BR')} Ouro`;
  if (modalCpText) modalCpText.textContent = `${playerCombatPower.toLocaleString('pt-BR')}`;
  if (hudCpVal) hudCpVal.textContent = `${playerCombatPower.toLocaleString('pt-BR')}`;
  if (hudCpBig) hudCpBig.textContent = playerCombatPower.toLocaleString('pt-BR');

  renderInventorySlots();
  if (selectedSlotIndex !== null) {
    selectInventorySlot(selectedSlotIndex);
  }

  // Refresh Paperdoll equipment manequin and attributes sheet
  renderCharacterModal();

  // Run idle farm helper auto-sell rules
  processAutoSell();
};

network.onLoginSuccess = (payload) => {
  playerLevel = payload.level ?? 1;
  playerCurrentXp = payload.currentXp ?? 0;
  playerXpToNextLevel = payload.xpToNextLevel ?? 150;
  playerGold = payload.gold ?? 0;

  const chosenClass = (charClassSelect.value as CharacterClass) || CharacterClass.GUERREIRO;
  if (hudHeroPortrait) hudHeroPortrait.src = `/assets/portraits/${chosenClass}.jpg`;
  if (hudHeroName) hudHeroName.textContent = payload.characterName || 'Jogador';
  if (hudHeroLevel) hudHeroLevel.textContent = `Nv. ${playerLevel}`;

  updateExpBarUI(playerLevel, playerCurrentXp, playerXpToNextLevel);
  if (playerLevelBadge) playerLevelBadge.textContent = `Nv. ${playerLevel}`;
  if (hudPlayerName) hudPlayerName.textContent = payload.characterName || 'Jogador';
  if (playerGoldText) playerGoldText.textContent = `${playerGold.toLocaleString('pt-BR')} Ouro`;
  if (inventoryGoldLabel) inventoryGoldLabel.textContent = `${playerGold.toLocaleString('pt-BR')} Ouro`;

  renderCharacterModal();
};

network.onPlayerExpUpdate = (payload) => {
  playerLevel = payload.level;
  playerCurrentXp = payload.currentXp;
  playerXpToNextLevel = payload.xpToNextLevel;

  updateExpBarUI(playerLevel, playerCurrentXp, playerXpToNextLevel);
  if (playerLevelBadge) playerLevelBadge.textContent = `Nv. ${playerLevel}`;

  // Spawn floating purple +XX XP text above player
  const entities = snapshotBuffer.getInterpolatedEntities();
  const myPlayer = entities.find((e) => e.id === network.myPlayerId);
  if (myPlayer) {
    renderer.addExperienceText(myPlayer.position, payload.expGained);
  }
};

network.onPlayerLevelUp = (payload) => {
  playerLevel = payload.newLevel;
  if (playerLevelBadge) playerLevelBadge.textContent = `Nv. ${playerLevel}`;
  if (hudCpVal) hudCpVal.textContent = `${payload.totalCombatPower}`;
  if (modalCpText) modalCpText.textContent = `${payload.totalCombatPower}`;

  // Spawn floating Level Up effect above player
  const entities = snapshotBuffer.getInterpolatedEntities();
  const targetPlayer = entities.find((e) => e.id === payload.playerId);
  if (targetPlayer) {
    renderer.addLevelUpEffect(targetPlayer.position, payload.newLevel);
  }

  // Trigger celebration banner popup if local player leveled up
  if (payload.playerId === network.myPlayerId) {
    showLevelUpBanner(payload.newLevel, payload.newAttributes);
  }
};

// Skill Casting Action
function castSkill(slot: number) {
  if (!network.isConnected || !network.myPlayerId) return;

  const now = performance.now();
  const cdEnd = cooldownMap.get(slot);
  if (cdEnd && cdEnd > now) {
    return; // Skill is on cooldown
  }

  const slotUI = skillSlots[slot];
  if (!slotUI || !slotUI.definition) return;

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

// Bind keyboard shortcuts (1, 2, 3, 4, K, I, Escape)
window.addEventListener('keydown', (e) => {
  if (document.activeElement === charNameInput) return;

  if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
    castSkill(parseInt(e.key, 10));
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
  network.connect();
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

// Virtual Joystick Controller (Mobile)
const joystickBase = document.getElementById('joystick-base') as HTMLDivElement;
const joystickThumb = document.getElementById('joystick-thumb') as HTMLDivElement;

let isJoystickActive = false;
let joystickDir = { x: 0, y: 0, z: 0 };
let joystickCenter = { x: 0, y: 0 };
const maxJoystickRadius = 42; // px

function handleJoystickStart(clientX: number, clientY: number) {
  const rect = joystickBase.getBoundingClientRect();
  joystickCenter = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
  isJoystickActive = true;
  handleJoystickMove(clientX, clientY);
}

function handleJoystickMove(clientX: number, clientY: number) {
  if (!isJoystickActive) return;

  const dx = clientX - joystickCenter.x;
  const dy = clientY - joystickCenter.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let clampedX = dx;
  let clampedY = dy;

  if (dist > maxJoystickRadius) {
    clampedX = (dx / dist) * maxJoystickRadius;
    clampedY = (dy / dist) * maxJoystickRadius;
  }

  // Update visual thumb translation
  joystickThumb.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

  // Normalized direction vector (X: left/right, Z: up/down in world)
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
  joystickThumb.style.transform = `translate(0px, 0px)`;

  // Send stop command
  const entities = snapshotBuffer.getInterpolatedEntities();
  const myPlayer = entities.find((e) => e.id === network.myPlayerId);
  const currentPos = myPlayer ? myPlayer.position : { x: 0, y: 0, z: 0 };
  network.sendMoveDirection({ x: 0, y: 0, z: 0 }, currentPos);
}

joystickBase.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  handleJoystickStart(e.clientX, e.clientY);
  joystickBase.setPointerCapture(e.pointerId);
});

joystickBase.addEventListener('pointermove', (e) => {
  if (isJoystickActive) {
    e.stopPropagation();
    handleJoystickMove(e.clientX, e.clientY);
  }
});

joystickBase.addEventListener('pointerup', (e) => {
  e.stopPropagation();
  handleJoystickEnd();
  try {
    joystickBase.releasePointerCapture(e.pointerId);
  } catch {
    // Ignore
  }
});

joystickBase.addEventListener('pointercancel', handleJoystickEnd);

// Canvas Interaction (Click / Touch-to-Move fallback & Looting)
canvas.addEventListener('pointerdown', (e) => {
  if (!network.isConnected || !network.myPlayerId) return;

  const clickWorldPos = renderer.screenToWorld(e.clientX, e.clientY);
  const entities = snapshotBuffer.getInterpolatedEntities();

  // 1. Check if clicked on a ground item drop
  const nearestDrop = renderer.findDropNearWorldPos(clickWorldPos, 3.5);
  if (nearestDrop) {
    network.sendLootItem(nearestDrop.dropId);
    // Also move player towards drop position
    const myPlayer = entities.find((e) => e.id === network.myPlayerId);
    const currentPos = myPlayer ? myPlayer.position : { x: 0, y: 0, z: 0 };
    network.sendMoveInput(nearestDrop.position, currentPos);
    return;
  }

  // 2. Check if clicked on a monster to target
  let clickedMonsterId: string | null = null;
  let minDistance = 2.5; // click tolerance in world units

  for (const ent of entities) {
    if (ent.type === 'MONSTER') {
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
    // Send Authoritative Movement Input
    const myPlayer = entities.find((e) => e.id === network.myPlayerId);
    const currentPos = myPlayer ? myPlayer.position : { x: 0, y: 0, z: 0 };
    network.sendMoveInput(clickWorldPos, currentPos);
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
    fpsText.textContent = `${frameCount} FPS`;
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
    playerHpBar.style.width = `${hpPct}%`;
    playerHpText.textContent = `${myPlayer.currentHp} / ${myPlayer.maxHp}`;

    if (hudHeroHpBar) hudHeroHpBar.style.width = `${hpPct}%`;
    if (hudHeroHpText) hudHeroHpText.textContent = `${myPlayer.currentHp} / ${myPlayer.maxHp}`;

    let resPct = 100;
    if (myPlayer.currentResource !== undefined && myPlayer.maxResource) {
      resPct = Math.max(0, Math.min(100, (myPlayer.currentResource / myPlayer.maxResource) * 100));
      playerResourceBar.style.width = `${resPct}%`;
      playerResourceText.textContent = `${myPlayer.currentResource} / ${myPlayer.maxResource}`;
      playerResourceLabel.textContent = myPlayer.resourceType === 'Energia' ? 'EN' : 'MP';
      playerResourceBar.className = `vital-bar-fill ${myPlayer.resourceType === 'Energia' ? 'energy-fill' : 'mp-fill'}`;

      if (hudHeroMpBar) hudHeroMpBar.style.width = `${resPct}%`;
      if (hudHeroMpText) hudHeroMpText.textContent = `${myPlayer.currentResource} / ${myPlayer.maxResource}`;
    }

    if (myPlayer.level && playerLevelBadge) {
      playerLevelBadge.textContent = `Nv. ${myPlayer.level}`;
    }
    if (myPlayer.level && hudHeroLevel) {
      hudHeroLevel.textContent = `Nv. ${myPlayer.level}`;
    }
    if (hudHeroName) {
      hudHeroName.textContent = myPlayer.name || charNameInput.value.trim() || 'Aventureiro';
    }

    // Farm Helper Auto-Potions check
    checkAutoPotions(
      myPlayer.currentHp,
      myPlayer.maxHp,
      myPlayer.currentResource ?? 0,
      myPlayer.maxResource ?? 100
    );
  }

  // 3. Update Target Vitals HUD
  if (renderer.selectedTargetId) {
    const target = entities.find((e) => e.id === renderer.selectedTargetId);
    if (target && target.currentHp > 0) {
      targetVitalRow.style.display = 'flex';
      targetNameLabel.textContent = target.name;
      if (targetLevelBadge) {
        targetLevelBadge.textContent = `Nv. ${target.level ?? 1}`;
      }
      const targetHpPct = Math.max(0, Math.min(100, (target.currentHp / target.maxHp) * 100));
      targetHpBar.style.width = `${targetHpPct}%`;
      targetHpText.textContent = `${target.currentHp} / ${target.maxHp}`;
    } else {
      targetVitalRow.style.display = 'none';
      renderer.selectedTargetId = null;
    }
  } else {
    targetVitalRow.style.display = 'none';
  }

  // Render frame
  renderer.render(entities, network.myPlayerId);
}

// Start visual render loop
requestAnimationFrame(gameLoop);

// Auto-connect on load if server is running locally
network.connect();
