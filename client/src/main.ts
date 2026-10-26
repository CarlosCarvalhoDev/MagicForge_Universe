import {
  CharacterClass,
  CLASS_DEFINITIONS,
  PrimaryStatType,
  distance,
  SKILLS_DATABASE,
  SkillDefinition,
  S2CSkillCastEventPayload,
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
const targetHpBar = document.getElementById('target-hp-bar') as HTMLDivElement;
const targetHpText = document.getElementById('target-hp-text') as HTMLSpanElement;

// Skill Slots UI References
interface SkillSlotUI {
  button: HTMLButtonElement;
  icon: HTMLSpanElement;
  name: HTMLSpanElement;
  cost: HTMLSpanElement;
  overlay: HTMLDivElement;
  cdText: HTMLSpanElement;
  definition: SkillDefinition | null;
}

const skillSlots: Record<number, SkillSlotUI> = {
  1: {
    button: document.getElementById('skill-btn-1') as HTMLButtonElement,
    icon: document.getElementById('skill-icon-1') as HTMLSpanElement,
    name: document.getElementById('skill-name-1') as HTMLSpanElement,
    cost: document.getElementById('skill-cost-1') as HTMLSpanElement,
    overlay: document.getElementById('skill-cd-overlay-1') as HTMLDivElement,
    cdText: document.getElementById('skill-cd-text-1') as HTMLSpanElement,
    definition: null,
  },
  2: {
    button: document.getElementById('skill-btn-2') as HTMLButtonElement,
    icon: document.getElementById('skill-icon-2') as HTMLSpanElement,
    name: document.getElementById('skill-name-2') as HTMLSpanElement,
    cost: document.getElementById('skill-cost-2') as HTMLSpanElement,
    overlay: document.getElementById('skill-cd-overlay-2') as HTMLDivElement,
    cdText: document.getElementById('skill-cd-text-2') as HTMLSpanElement,
    definition: null,
  },
  3: {
    button: document.getElementById('skill-btn-3') as HTMLButtonElement,
    icon: document.getElementById('skill-icon-3') as HTMLSpanElement,
    name: document.getElementById('skill-name-3') as HTMLSpanElement,
    cost: document.getElementById('skill-cost-3') as HTMLSpanElement,
    overlay: document.getElementById('skill-cd-overlay-3') as HTMLDivElement,
    cdText: document.getElementById('skill-cd-text-3') as HTMLSpanElement,
    definition: null,
  },
  4: {
    button: document.getElementById('skill-btn-4') as HTMLButtonElement,
    icon: document.getElementById('skill-icon-4') as HTMLSpanElement,
    name: document.getElementById('skill-name-4') as HTMLSpanElement,
    cost: document.getElementById('skill-cost-4') as HTMLSpanElement,
    overlay: document.getElementById('skill-cd-overlay-4') as HTMLDivElement,
    cdText: document.getElementById('skill-cd-text-4') as HTMLSpanElement,
    definition: null,
  },
};

const SKILL_ICONS: Record<string, string> = {
  guerreiro_1: '⚔️',
  guerreiro_2: '🛡️',
  guerreiro_3: '🌪️',
  guerreiro_4: '👑',
  clerigo_1: '✨',
  clerigo_2: '☀️',
  clerigo_3: '🌟',
  clerigo_4: '🕊️',
  mago_1: '🔥',
  mago_2: '⚡',
  mago_3: '❄️',
  mago_4: '☄️',
  arqueiro_1: '🏹',
  arqueiro_2: '🎯',
  arqueiro_3: '🌧️',
  arqueiro_4: '🦅',
  barbaro_1: '🪓',
  barbaro_2: '🩸',
  barbaro_3: '🌋',
  barbaro_4: '💀',
  monge_1: '👊',
  monge_2: '💨',
  monge_3: '🧘',
  monge_4: '🐉',
  bruxo_1: '🔮',
  bruxo_2: '👁️',
  bruxo_3: '🌀',
  bruxo_4: '😈',
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
      slotUI.name.textContent = s.name;
      slotUI.cost.textContent = `${s.cost} ${s.resourceType === 'Energia' ? 'EN' : 'MP'}`;
      slotUI.cost.style.color = s.resourceType === 'Energia' ? '#facc15' : '#38bdf8';
      slotUI.icon.textContent = SKILL_ICONS[s.skillId] || '✨';
      slotUI.button.title = `[Slot ${s.slot}] ${s.name} (Tier ${s.tier})\nCusto: ${s.cost} ${s.resourceType} • Recarga: ${s.cooldownSec}s\nAlcance: ${s.range}m\n${s.description}`;
    }
  }
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
    const hp = s.constituicao * 10 + 50;
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
  // Find target position from current snapshot
  const entities = snapshotBuffer.getInterpolatedEntities();
  const target = entities.find((e) => e.id === event.targetId);
  if (target) {
    renderer.addDamageText(target.position, event.damage, event.isCritical, event.isDodged);
  }
};

network.onSkillCastEvent = (event: S2CSkillCastEventPayload) => {
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

// Bind keyboard shortcuts (1, 2, 3, 4)
window.addEventListener('keydown', (e) => {
  if (document.activeElement === charNameInput) return;

  if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
    castSkill(parseInt(e.key, 10));
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

// Canvas Interaction (Click / Touch-to-Move fallback)
canvas.addEventListener('pointerdown', (e) => {
  if (!network.isConnected || !network.myPlayerId) return;

  const clickWorldPos = renderer.screenToWorld(e.clientX, e.clientY);
  const entities = snapshotBuffer.getInterpolatedEntities();

  // Check if clicked on a monster to target
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
  }

  // 3. Update Target Vitals HUD
  if (renderer.selectedTargetId) {
    const target = entities.find((e) => e.id === renderer.selectedTargetId);
    if (target && target.currentHp > 0) {
      targetVitalRow.style.display = 'flex';
      targetNameLabel.textContent = target.name;
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
