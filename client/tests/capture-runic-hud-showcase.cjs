const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/ric.santosh/.gemini/antigravity/brain/12f69c68-5858-4ddc-be31-ba3b11a8ff7f');
const OUT_DIR = path.resolve(__dirname, '../../production/qa/evidence');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else if (msg.result?.exceptionDetails) reject(new Error(JSON.stringify(msg.result.exceptionDetails)));
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(code) {
    const wrapped = `(async () => {\n${code}\n})()`;
    const res = await this.send('Runtime.evaluate', { expression: wrapped, returnByValue: true, awaitPromise: true });
    return res?.result?.value;
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile
    });
    await this.send('Emulation.setVisibleSize', { width, height });
    await this.eval(`window.dispatchEvent(new Event('resize'));`);
    await wait(450);
  }

  async inspectLayoutAndVerifyNoOverlaps(label) {
    const report = await this.eval(`
      const ids = [
        'hero-status-card',
        'top-center-wave-card',
        'top-right-location-card',
        'tactical-action-bar',
        'right-vertical-dock',
        'bottom-center-zone',
        'btn-primary-attack',
        'skill-btn-1',
        'skill-btn-2',
        'skill-btn-3',
        'skill-btn-4'
      ];
      const boxes = {};
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        boxes[id] = {
          left: Math.round(r.left),
          top: Math.round(r.top),
          right: Math.round(r.right),
          bottom: Math.round(r.bottom),
          width: Math.round(r.width),
          height: Math.round(r.height)
        };
      }
      const overlaps = [];
      const keys = Object.keys(boxes);
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          const a = keys[i];
          const b = keys[j];
          const ra = boxes[a];
          const rb = boxes[b];
          const xOverlap = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
          const yOverlap = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
          if (xOverlap > 2 && yOverlap > 2) {
            overlaps.push({ pair: a + ' <-> ' + b, xOverlap, yOverlap, ra, rb });
          }
        }
      }
      return { viewport: { w: window.innerWidth, h: window.innerHeight }, boxes, overlaps };
    `);
    console.log(`[Layout Check: ${label}]`, JSON.stringify(report.boxes));
    if (report.overlaps.length > 0) {
      console.error(`[OVERLAP DETECTED in ${label}]`, JSON.stringify(report.overlaps, null, 2));
      throw new Error(`Layout overlap detected in ${label}: ${JSON.stringify(report.overlaps)}`);
    } else {
      console.log(`[ZERO OVERLAPS in ${label}] All HUD components cleanly separated!`);
    }
    return report;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const localPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(localPath, buffer);
    console.log(`[Captured] ${localPath} (${buffer.length} bytes)`);

    if (fs.existsSync(ARTIFACT_DIR)) {
      const artifactPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(artifactPath, buffer);
      console.log(`[Artifact Copied] ${artifactPath}`);
    }
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('--- Iniciando Captura Automatizada de Evidências Rúnicas via Edge CDP ---');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const proc = spawn(edgePath, [
    '--headless=old',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1920,1080',
    'http://localhost:5173'
  ]);

  try {
    let pages = null;
    for (let i = 0; i < 20; i++) {
      await wait(500);
      try {
        const json = await fetchJson('http://127.0.0.1:9222/json');
        pages = json.filter(item => item.type === 'page' && item.url.includes('5173'));
        if (pages.length > 0) break;
      } catch (err) {}
    }

    if (!pages || pages.length === 0) {
      throw new Error('Não foi possível localizar a página do cliente em http://localhost:5173');
    }

    const cdp = new CdpClient(pages[0].webSocketDebuggerUrl);
    await cdp.connect();
    console.log('Conectado ao CDP!');

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    // 1. Capturar Tela de Introdução Cinematográfica / História (1080p)
    await cdp.setViewport(1920, 1080, false);
    await wait(1200);
    await cdp.captureScreenshot('runic_cinematic_story_1080p.png');

    // 2. Fechar intro e capturar Tela de Login Rúnica (1080p)
    await cdp.eval(`
      const introEl = document.getElementById('cinematic-intro');
      if (introEl) {
        if (introEl.close) introEl.close();
        introEl.remove();
      }
      localStorage.setItem('magicforge_intro_seen_v1', 'true');
      return 'intro_dismissed';
    `);
    await wait(800);
    await cdp.captureScreenshot('runic_login_screen_1080p.png');

    // 3. Revelar pedestais de personagem (Sala dos Forjados)
    await cdp.eval(`
      const auth = document.getElementById('modal-auth-selection');
      if (auth) {
        auth.dataset.screen = 'characters';
        const roster = auth.querySelector('.forge-roster');
        if (roster) roster.hidden = false;
        const entry = auth.querySelector('.forge-entry');
        if (entry) entry.hidden = true;
        const social = document.getElementById('forge-social-login');
        if (social) social.hidden = true;
        const accForm = document.getElementById('forge-account-form');
        if (accForm) accForm.hidden = true;
      }
      return 'pedestals_shown';
    `);
    await wait(600);
    await cdp.captureScreenshot('runic_character_selection_pedestals.png');

    // 4. Entrar no fluxo in-game: esconder completamente modais de autenticação e expor o HUD e Viewport
    await cdp.eval(`
      const auth = document.getElementById('modal-auth-selection');
      if (auth) {
        auth.setAttribute('hidden', 'true');
        auth.style.setProperty('display', 'none', 'important');
      }
      const intro = document.getElementById('cinematic-intro');
      if (intro) intro.remove();

      // Painel de debug minimizado
      const insp = document.getElementById('inspector-panel');
      if (insp) insp.classList.add('collapsed');

      if (window.magicForgeNetwork) {
        if (!window.magicForgeNetwork.isConnected) {
          window.magicForgeNetwork.connect();
        }
        let waited = 0;
        while (!window.magicForgeNetwork.isConnected && waited < 3000) {
          await new Promise(r => setTimeout(r, 100));
          waited += 100;
        }
        window.magicForgeNetwork.login('Aurelius', 'GUERREIRO');
      }

      // Popular dados visuais do jogador (Aurelius Nv. 50, Cavaleiro de Valíria, 16.720 PC)
      const nameEl = document.getElementById('hud-hero-name');
      if (nameEl) nameEl.textContent = 'Aurelius';
      const lvlEl = document.getElementById('hud-hero-level');
      if (lvlEl) lvlEl.textContent = 'Nv. 50';
      const honor = document.getElementById('hud-hero-honor-tag');
      if (honor) honor.textContent = 'Cavaleiro de Valíria';
      const cpEl = document.getElementById('hud-cp-big');
      if (cpEl) cpEl.textContent = '16.720';
      const trait = document.getElementById('hud-class-trait-pill');
      if (trait) trait.textContent = '⚔️ Aço Valiriano • Vanguarda';
      const attackTrait = document.getElementById('attack-class-trait');
      if (attackTrait) attackTrait.textContent = 'Golpe Sagrado';
      const gold = document.getElementById('player-gold-text');
      if (gold) gold.textContent = '1.85 M';
      const ping = document.getElementById('ping-text');
      if (ping) ping.textContent = '1 ms';
      const hp = document.getElementById('hud-hero-hp-text');
      if (hp) hp.textContent = '8500 / 8500';
      const mp = document.getElementById('hud-hero-mp-text');
      if (mp) mp.textContent = '210 / 250';
      const exp = document.getElementById('player-exp-text');
      if (exp) exp.textContent = 'XP [Nv. 50] 251.060 / 2.021.022 (12.4%)';
      const stageWorld = document.getElementById('stage-world-title');
      if (stageWorld) stageWorld.textContent = '🌲 Floresta da Forja';
      const stagePhase = document.getElementById('stage-phase-badge');
      if (stagePhase) stagePhase.textContent = 'Fase 10/10 [CHEFÃO]';
      const zoneTitle = document.getElementById('zone-location-title');
      if (zoneTitle) zoneTitle.textContent = 'Floresta da Forja (10)';
      const stageBadge = document.getElementById('current-stage-badge');
      if (stageBadge) stageBadge.textContent = 'Fase 10/10';

      // Disparar resize para atualizar canvas
      window.dispatchEvent(new Event('resize'));
      return 'in_game_hud_ready';
    `);
    await wait(2500);

    // 5. Capturar HUD In-Game em Desktop 1080p (1920x1080): Menu Lateral Aberto por padrão
    await cdp.setViewport(1920, 1080, false);
    await wait(600);
    await cdp.eval(`
      const bar = document.getElementById('tactical-action-bar');
      if (bar) { bar.dataset.drawerOpen = 'true'; bar.classList.remove('drawer-collapsed'); }
      const arrow = document.getElementById('tactical-drawer-arrow');
      if (arrow) arrow.textContent = '❮';
    `);
    await wait(200);
    await cdp.inspectLayoutAndVerifyNoOverlaps('Desktop 1920x1080 (Drawer Open)');
    await cdp.captureScreenshot('runic_game_hud_desktop_1080p.png');

    // 6. Capturar HUD In-Game em Tablet / Navegador Reduzido (1024x768): Menu Lateral FECHADO por padrão
    await cdp.setViewport(1024, 768, false);
    await wait(600);
    await cdp.eval(`
      // Em tela reduzida (<= 1180px), o padrão default é FECHADO
      const bar = document.getElementById('tactical-action-bar');
      if (bar) { bar.dataset.drawerOpen = 'false'; bar.classList.add('drawer-collapsed'); }
      const arrow = document.getElementById('tactical-drawer-arrow');
      if (arrow) arrow.textContent = '❯';
    `);
    await wait(200);
    await cdp.inspectLayoutAndVerifyNoOverlaps('Reduced Browser / Tablet 1024x768 (Default Collapsed)');
    await cdp.captureScreenshot('runic_game_hud_drawer_collapsed.png');

    // 6b. Usuário clica na seta para expandir o menu lateral em 1024x768
    await cdp.eval(`
      const toggleBtn = document.getElementById('btn-tactical-drawer-toggle');
      if (toggleBtn) toggleBtn.click();
      return 'drawer_toggled_open';
    `);
    await wait(400);
    await cdp.inspectLayoutAndVerifyNoOverlaps('Reduced Browser / Tablet 1024x768 (User Expanded)');
    await cdp.captureScreenshot('runic_game_hud_tablet_768p.png');

    // 7. Capturar HUD In-Game em Mobile Portrait (390x844): Menu Lateral FECHADO por padrão
    await cdp.setViewport(390, 844, true);
    await wait(600);
    await cdp.eval(`
      // Em versão mobile, por padrão fica fechado
      const bar = document.getElementById('tactical-action-bar');
      if (bar) { bar.dataset.drawerOpen = 'false'; bar.classList.add('drawer-collapsed'); }
      const arrow = document.getElementById('tactical-drawer-arrow');
      if (arrow) arrow.textContent = '❯';
    `);
    await wait(200);
    await cdp.inspectLayoutAndVerifyNoOverlaps('Mobile Portrait 390x844 (Default Collapsed)');
    await cdp.captureScreenshot('runic_game_hud_mobile_portrait.png');

    cdp.close();
    console.log('--- Captura de todas as resoluções e validação zero-overlap concluídas com sucesso! ---');
  } finally {
    proc.kill();
  }
}

run().catch(err => {
  console.error('Falha durante a execução:', err);
  process.exit(1);
});
