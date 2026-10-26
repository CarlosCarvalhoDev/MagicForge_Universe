import { CharacterClass, distance } from '@magicforge/shared';
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
const btnConnect = document.getElementById('btn-connect') as HTMLButtonElement;
const toggleInterpolation = document.getElementById('toggle-interpolation') as HTMLInputElement;
const toggleRawGhost = document.getElementById('toggle-raw-ghost') as HTMLInputElement;
const sliderDelay = document.getElementById('slider-delay') as HTMLInputElement;
const delayLabel = document.getElementById('delay-label') as HTMLSpanElement;

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

// Canvas Interaction (Click / Touch)
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

function gameLoop() {
  requestAnimationFrame(gameLoop);

  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    fpsText.textContent = `${frameCount} FPS`;
    frameCount = 0;
    lastFpsTime = now;
  }

  // Retrieve interpolated states from snapshot buffer
  const useInterpolation = toggleInterpolation.checked;
  const entities = snapshotBuffer.getInterpolatedEntities(useInterpolation);

  // Render frame
  renderer.render(entities, network.myPlayerId);
}

// Start visual render loop
requestAnimationFrame(gameLoop);

// Auto-connect on load if server is running locally
network.connect();
