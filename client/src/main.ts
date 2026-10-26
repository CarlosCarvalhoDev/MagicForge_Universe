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
  EquipmentSlot,
  S2CInventoryUpdatePayload,
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

  if (playerGoldText) playerGoldText.textContent = `${playerGold} Ouro`;
  if (inventoryGoldLabel) inventoryGoldLabel.textContent = `${playerGold} Ouro`;
  if (modalCpText) modalCpText.textContent = `${playerCombatPower}`;
  if (hudCpVal) hudCpVal.textContent = `${playerCombatPower}`;

  renderInventorySlots();
  if (selectedSlotIndex !== null) {
    selectInventorySlot(selectedSlotIndex);
  }
};

network.onLoginSuccess = (payload) => {
  playerLevel = payload.level ?? 1;
  playerCurrentXp = payload.currentXp ?? 0;
  playerXpToNextLevel = payload.xpToNextLevel ?? 150;
  playerGold = payload.gold ?? 0;

  updateExpBarUI(playerLevel, playerCurrentXp, playerXpToNextLevel);
  if (playerLevelBadge) playerLevelBadge.textContent = `Nv. ${playerLevel}`;
  if (hudPlayerName) hudPlayerName.textContent = payload.characterName || 'Jogador';
  if (playerGoldText) playerGoldText.textContent = `${playerGold} Ouro`;
  if (inventoryGoldLabel) inventoryGoldLabel.textContent = `${playerGold} Ouro`;
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
  } else if (e.key === 'Escape') {
    closeSkillbook();
    closeInventory();
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

    if (myPlayer.currentResource !== undefined && myPlayer.maxResource) {
      const resPct = Math.max(0, Math.min(100, (myPlayer.currentResource / myPlayer.maxResource) * 100));
      playerResourceBar.style.width = `${resPct}%`;
      playerResourceText.textContent = `${myPlayer.currentResource} / ${myPlayer.maxResource}`;
      playerResourceLabel.textContent = myPlayer.resourceType === 'Energia' ? 'EN' : 'MP';
      playerResourceBar.className = `vital-bar-fill ${myPlayer.resourceType === 'Energia' ? 'energy-fill' : 'mp-fill'}`;
    }
    if (myPlayer.level && playerLevelBadge) {
      playerLevelBadge.textContent = `Nv. ${myPlayer.level}`;
    }
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
