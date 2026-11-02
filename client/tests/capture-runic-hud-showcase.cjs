const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || null;
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
        if (!el || el.offsetParent === null) continue;
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
      const gw = document.querySelector('.gold-wallet-capsule');
      if (gw && gw.offsetParent !== null) {
        const r = gw.getBoundingClientRect();
        boxes['gold-wallet-capsule'] = {
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
      const circles = new Set(['btn-primary-attack', 'skill-btn-1', 'skill-btn-2', 'skill-btn-3', 'skill-btn-4']);
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          const a = keys[i];
          const b = keys[j];
          if ((a === 'top-right-location-card' && b === 'gold-wallet-capsule') ||
              (b === 'top-right-location-card' && a === 'gold-wallet-capsule')) {
            continue;
          }
          const ra = boxes[a];
          const rb = boxes[b];
          if (circles.has(a) && circles.has(b)) {
            const cx1 = (ra.left + ra.right) / 2, cy1 = (ra.top + ra.bottom) / 2, r1 = ra.width / 2;
            const cx2 = (rb.left + rb.right) / 2, cy2 = (rb.top + rb.bottom) / 2, r2 = rb.width / 2;
            const dist = Math.hypot(cx1 - cx2, cy1 - cy2);
            if (dist < r1 + r2 + 4) {
              overlaps.push({ pair: a + ' <-> ' + b, circleGap: Math.round(dist - r1 - r2), ra, rb });
            }
            continue;
          }
          const xOverlap = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
          const yOverlap = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
          if (xOverlap > 2 && yOverlap > 2) {
            overlaps.push({ pair: a + ' <-> ' + b, xOverlap, yOverlap, ra, rb });
          }
        }
      }
      return { viewport: { w: window.innerWidth, h: window.innerHeight }, boxes, overlaps };
    `);
    console.log(`[Layout Check: ${label}] Elements measured: ${Object.keys(report.boxes).length}`);
    for (const [k, v] of Object.entries(report.boxes)) {
      console.log(`  -> ${k}: (${v.left}, ${v.top}) - ${v.width}x${v.height} -> [R:${v.right}, B:${v.bottom}]`);
    }
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

    if (typeof ARTIFACT_DIR === 'string' && ARTIFACT_DIR.length > 0 && fs.existsSync(ARTIFACT_DIR)) {
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
    '--ignore-certificate-errors',
    '--allow-insecure-localhost',
    '--window-size=1920,1080',
    'https://localhost:5173'
  ]);

  try {
    let pages = null;
    for (let i = 0; i < 25; i++) {
      await wait(500);
      try {
        const json = await fetchJson('http://127.0.0.1:9222/json');
        pages = json.filter(item => item.type === 'page' && (item.url.includes('5173') || item.url.includes('localhost')));
        if (pages.length > 0) break;
      } catch (err) {}
    }

    if (!pages || pages.length === 0) {
      throw new Error('Não foi possível localizar a página do cliente em https://localhost:5173');
    }

    const cdp = new CdpClient(pages[0].webSocketDebuggerUrl);
    await cdp.connect();
    console.log('Conectado ao CDP!');

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    // 1. Capturar Tela de Introdução Cinematográfica / História (1080p)
    await cdp.setViewport(1920, 1080, false);
    await wait(1400);
    await cdp.captureScreenshot('runic_cinematic_story_1080p.png');

    // 2. Fechar intro e capturar Tela de Login Rúnica (1080p)
    await cdp.eval(`
      const introEl = document.getElementById('cinematic-intro');
      if (introEl) {
        if (introEl.close) introEl.close();
        introEl.remove();
      }
      try { localStorage.setItem('magicforge_intro_seen_v1', 'true'); } catch (e) {}
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
    await wait(700);
    await cdp.captureScreenshot('runic_character_selection_pedestals.png');

    // 4. Entrar no fluxo in-game com dados reais do herói AdminLord Nv. 50 Guerreiro
    await cdp.eval(`
      const auth = document.getElementById('modal-auth-selection');
      if (auth) {
        auth.setAttribute('hidden', 'true');
        auth.style.setProperty('display', 'none', 'important');
      }
      const intro = document.getElementById('cinematic-intro');
      if (intro) intro.remove();

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
        window.magicForgeNetwork.login('AdminLord', 'GUERREIRO');
      }

      // Preencher dados do HUD
      const nameEl = document.getElementById('hud-hero-name');
      if (nameEl) nameEl.textContent = 'AdminLord';
      const lvlEl = document.getElementById('hud-hero-level') || document.getElementById('hud-hero-level-pill');
      if (lvlEl) lvlEl.textContent = 'Nv. 50';
      const lvlPill = document.getElementById('hud-hero-level-pill');
      if (lvlPill) lvlPill.textContent = 'Nv. 50';
      const honor = document.getElementById('hud-hero-honor-tag');
      if (honor) honor.textContent = 'Cavaleiro de Valíria';
      const cpEl = document.getElementById('hud-cp-big');
      if (cpEl) cpEl.textContent = '15.970';
      const trait = document.getElementById('hud-class-trait-pill');
      if (trait) trait.textContent = '⚔️ Aço Valiriano';
      const attackTrait = document.getElementById('attack-class-trait');
      if (attackTrait) attackTrait.textContent = 'Golpe Sagrado';
      const gold = document.getElementById('player-gold-text');
      if (gold) gold.textContent = '643.749';
      const ping = document.getElementById('ping-text');
      if (ping) ping.textContent = '1 ms';
      const hp = document.getElementById('hud-hero-hp-text');
      if (hp) hp.textContent = '9057 / 9670';
      const mp = document.getElementById('hud-hero-mp-text');
      if (mp) mp.textContent = '134 / 150';
      const exp = document.getElementById('player-exp-text') || document.getElementById('exp-bar-text');
      if (exp) exp.textContent = 'XP [Nv. 50] 167510 / 2021022 (8.3%)';
      const stageWorld = document.getElementById('stage-world-title');
      if (stageWorld) stageWorld.textContent = '❄ Picos de Jotunheim';
      const stagePhase = document.getElementById('stage-phase-badge');
      if (stagePhase) stagePhase.textContent = 'Fase 10/10 [CHEFÃO]';
      const zoneTitle = document.getElementById('zone-location-title');
      if (zoneTitle) zoneTitle.textContent = 'Picos de Jotunheim (10)';
      const stageBadge = document.getElementById('current-stage-badge');
      if (stageBadge) stageBadge.textContent = 'Fase 10/10';

      // Garantir que os botões de skill estejam visíveis e desbloqueados para o Guerreiro
      const costs = ['12 EN', '20 EN', '35 EN', '65 EN'];
      for (let i = 1; i <= 4; i++) {
        const btn = document.getElementById('skill-btn-' + i);
        if (btn) {
          btn.classList.remove('is-locked', 'locked', 'slot-locked');
          const lock = btn.querySelector('.slot-lock-overlay');
          if (lock) lock.style.display = 'none';
          const cost = btn.querySelector('.skill-cost');
          if (cost) cost.textContent = costs[i - 1];
        }
      }

      window.dispatchEvent(new Event('resize'));
      return 'in_game_hud_ready';
    `);
    await wait(2200);

    // 5. Capturar HUD In-Game em Desktop 1080p (1920x1080): Menu Lateral Aberto
    await cdp.setViewport(1920, 1080, false);
    await wait(500);
    await cdp.eval(`
      const bar = document.getElementById('tactical-action-bar');
      if (bar) { bar.dataset.drawerOpen = 'true'; bar.classList.remove('drawer-collapsed'); }
      const arrow = document.getElementById('tactical-drawer-arrow');
      if (arrow) arrow.textContent = '❮';
    `);
    await wait(200);
    await cdp.inspectLayoutAndVerifyNoOverlaps('Desktop 1920x1080 (Drawer Open)');
    await cdp.captureScreenshot('runic_game_hud_desktop_1080p.png');

    // 6. Capturar HUD In-Game em Tablet (1024x768): Menu Lateral FECHADO
    await cdp.setViewport(1024, 768, false);
    await wait(500);
    await cdp.eval(`
      const bar = document.getElementById('tactical-action-bar');
      if (bar) { bar.dataset.drawerOpen = 'false'; bar.classList.add('drawer-collapsed'); }
      const arrow = document.getElementById('tactical-drawer-arrow');
      if (arrow) arrow.textContent = '❯';
    `);
    await wait(200);
    await cdp.inspectLayoutAndVerifyNoOverlaps('Tablet 1024x768 (Default Collapsed)');
    await cdp.captureScreenshot('runic_game_hud_drawer_collapsed.png');

    // 6b. Menu Lateral Aberto em Tablet
    await cdp.eval(`
      const toggleBtn = document.getElementById('btn-tactical-drawer-toggle');
      if (toggleBtn) toggleBtn.click();
      return 'drawer_toggled_open';
    `);
    await wait(300);
    await cdp.inspectLayoutAndVerifyNoOverlaps('Tablet 1024x768 (User Expanded)');
    await cdp.captureScreenshot('runic_game_hud_tablet_768p.png');

    // 7. Capturar HUD In-Game em Mobile Portrait (390x844): Menu Lateral FECHADO
    await cdp.setViewport(390, 844, true);
    await wait(500);
    await cdp.eval(`
      const bar = document.getElementById('tactical-action-bar');
      if (bar) { bar.dataset.drawerOpen = 'false'; bar.classList.add('drawer-collapsed'); }
      const arrow = document.getElementById('tactical-drawer-arrow');
      if (arrow) arrow.textContent = '❯';
      // Limpar overlays antigos se houver
      document.querySelectorAll('.cooldown-overlay').forEach(el => el.classList.remove('active'));
    `);
    await wait(200);
    await cdp.inspectLayoutAndVerifyNoOverlaps('Mobile Portrait 390x844 (Default Collapsed)');
    await cdp.captureScreenshot('runic_game_hud_mobile_portrait.png');

    // 8. Mobile Portrait 390x844 COM TODAS AS HABILIDADES EM COOLDOWN
    console.log('--- Testando Cooldowns Ativos no Arco de Combate Mobile ---');
    await cdp.eval(`
      const cdMap = {
        'skill-btn-1': '0.1s',
        'skill-btn-2': '1.5s',
        'skill-btn-3': '1.6s',
        'skill-btn-4': '13.0s'
      };
      for (const [id, val] of Object.entries(cdMap)) {
        const btn = document.getElementById(id);
        if (btn) {
          let ov = btn.querySelector('.cooldown-overlay');
          if (!ov) {
            ov = document.createElement('div');
            ov.className = 'cooldown-overlay';
            const span = document.createElement('span');
            span.className = 'cooldown-text';
            ov.appendChild(span);
            btn.appendChild(ov);
          }
          ov.classList.add('active');
          ov.style.setProperty('display', 'flex', 'important');
          ov.style.setProperty('opacity', '1', 'important');
          const span = ov.querySelector('.cooldown-text');
          if (span) span.textContent = val;
        }
      }
      return 'cooldowns_applied';
    `);
    await wait(300);
    await cdp.inspectLayoutAndVerifyNoOverlaps('Mobile Portrait 390x844 (Active Cooldowns)');
    await cdp.captureScreenshot('runic_game_hud_mobile_cooldowns.png');

    // 9. Mobile Portrait 390x844 no MODO STANDALONE / APP INSTALADO IPHONE (com Notch Safe Area)
    console.log('--- Testando Modo Standalone iPhone PWA (Recuo Dynamic Island / Notch) ---');
    await cdp.eval(`
      document.querySelectorAll('.cooldown-overlay').forEach(el => {
        el.classList.remove('active');
        el.style.removeProperty('display');
        el.style.removeProperty('opacity');
      });
      const style = document.createElement('style');
      style.id = 'iphone-notch-simulation';
      style.textContent = \`
        :root {
          --safe-top: 47px !important;
          --safe-bottom: 34px !important;
        }
        #hero-status-card, #top-right-location-card {
          top: calc(14px + 47px) !important;
        }
        #top-center-wave-card {
          top: calc(88px + 47px) !important;
        }
        #mobile-combat-arc-container, #bottom-center-zone {
          bottom: calc(20px + 34px) !important;
        }
        #exp-bar-container {
          height: calc(16px + 34px) !important;
          padding-bottom: 34px !important;
        }
      \`;
      document.head.appendChild(style);
      return 'notch_simulated';
    `);
    await wait(300);
    await cdp.inspectLayoutAndVerifyNoOverlaps('Mobile Portrait 390x844 (iPhone Standalone Notch)');
    await cdp.captureScreenshot('runic_game_hud_iphone_standalone.png');

    // 10. Mobile Portrait com Menu Lateral Aberto
    console.log('--- Testando Mobile Portrait com Menu Lateral Aberto ---');
    await cdp.eval(`
      const notchStyle = document.getElementById('iphone-notch-simulation');
      if (notchStyle) notchStyle.remove();
      const toggleBtn = document.getElementById('btn-tactical-drawer-toggle');
      if (toggleBtn) toggleBtn.click();
      return 'mobile_drawer_open';
    `);
    await wait(300);
    await cdp.inspectLayoutAndVerifyNoOverlaps('Mobile Portrait 390x844 (Drawer Open)');
    await cdp.captureScreenshot('runic_game_hud_mobile_drawer_open.png');

    cdp.close();
    console.log('--- TODAS AS ETAPAS E CAPTURAS CONCLUÍDAS COM SUCESSO! ---');
  } finally {
    proc.kill();
  }
}

run().catch(err => {
  console.error('Falha durante a execução:', err);
  process.exit(1);
});
