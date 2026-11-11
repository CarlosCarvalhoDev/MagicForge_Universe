import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');

test('Login screen HTML contains SVG icons, FOUC protection, and RPG badges for social buttons', () => {
  const html = fs.readFileSync(path.join(clientRoot, 'index.html'), 'utf8');
  for (const provider of ['GOOGLE', 'APPLE', 'DISCORD', 'GUEST']) {
    const regex = new RegExp(`data-auth-provider="${provider}"[^>]*>[\\s\\S]*?<svg[\\s\\S]*?</svg>[\\s\\S]*?class="forge-provider-copy"`, 'i');
    assert.match(html, regex, `Expected ${provider} login button to include inline SVG icon and forge-provider-copy`);
  }
  assert.match(html, /class="forge-runic-crests"/, 'Expected Runic lore crests in .forge-intro');
  assert.match(html, /#modal-auth-selection\[hidden\]\s*,\s*#modal-auth-selection:not\(\[data-ready="true"\]\)\s*\{\s*display:\s*none\s*!important;/, 'Expected critical FOUC protection in head style');
  assert.match(html, /<div id="modal-auth-selection"\s+hidden/, 'Expected modal-auth-selection to have hidden attribute by default');
});

test('AuthSelection.ts provides structured pedestal stat badges and session persistence across reloads', () => {
  const ts = fs.readFileSync(path.join(clientRoot, 'src/ui/AuthSelection.ts'), 'utf8');
  assert.match(ts, /forge-stat-class/, 'Expected structured forge-stat-class badge in pedestal cards');
  assert.match(ts, /forge-stat-cp/, 'Expected structured forge-stat-cp badge in pedestal cards');
  assert.match(ts, /forge-stat-hp/, 'Expected structured forge-stat-hp badge in pedestal cards');
  assert.match(ts, /magicforge_active_session_v1/, 'Expected session persistence key for auto-resume');
  assert.match(ts, /autoResuming/, 'Expected auto-resuming logic for reloads');
});

test('RPG Dock and Potion icons exist on disk and are linked in index.html and progression.css', () => {
  const iconsDir = path.join(clientRoot, 'public/assets/ui/icons');
  const requiredIcons = [
    'icon-hero-helm.svg',
    'icon-mochila-satchel.svg',
    'icon-grimorio-tome.svg',
    'icon-farm-anvil.svg',
    'icon-rank-chalice.svg',
    'icon-potion-hp.svg',
    'icon-potion-mp.svg',
  ];

  for (const iconFile of requiredIcons) {
    assert.ok(fs.existsSync(path.join(iconsDir, iconFile)), `Expected RPG icon SVG ${iconFile} to exist`);
  }

  const html = fs.readFileSync(path.join(clientRoot, 'index.html'), 'utf8');
  assert.match(html, /icon-hero-helm\.svg/, 'Expected hero helm icon in dock');
  assert.match(html, /icon-mochila-satchel\.svg/, 'Expected satchel icon in dock');
  assert.match(html, /icon-grimorio-tome\.svg/, 'Expected grimoire icon in dock');
  assert.match(html, /icon-farm-anvil\.svg/, 'Expected forge anvil icon in dock');
  assert.match(html, /icon-rank-chalice\.svg/, 'Expected royal chalice icon in dock');
  assert.match(html, /icon-potion-hp\.svg/, 'Expected HP potion icon');
  assert.match(html, /icon-potion-mp\.svg/, 'Expected MP potion icon');

  const progCss = fs.readFileSync(path.join(clientRoot, 'src/ui/progression.css'), 'utf8');
  assert.match(progCss, /\.dock-svg-icon/, 'Expected dock-svg-icon styling in progression.css');
  assert.match(progCss, /#btn-primary-attack/, 'Expected runic attack button styling in progression.css');
  assert.match(progCss, /\.skill-arc-btn/, 'Expected skill arc buttons styling in progression.css');
});

test('Narrative preserves ornate frames for boss encounters', () => {
  const narrCss = fs.readFileSync(path.join(clientRoot, 'src/ui/narrative.css'), 'utf8');
  assert.match(narrCss, /corner-tl\.svg/, 'Expected sculpted corner filigree in narrative.css');
});

test('In-game viewport frame, session navigation buttons, top-right selectors, class traits, and primary attack crest are wired', () => {
  const html = fs.readFileSync(path.join(clientRoot, 'index.html'), 'utf8');
  const progCss = fs.readFileSync(path.join(clientRoot, 'src/ui/progression.css'), 'utf8');
  const authTs = fs.readFileSync(path.join(clientRoot, 'src/ui/AuthSelection.ts'), 'utf8');
  const mainTs = fs.readFileSync(path.join(clientRoot, 'src/main.ts'), 'utf8');

  // 1. Runic viewport frame around game screen
  assert.match(html, /id="runic-viewport-frame"/, 'Expected #runic-viewport-frame in index.html');
  assert.match(progCss, /#runic-viewport-frame/, 'Expected #runic-viewport-frame styling in progression.css');
  assert.match(progCss, /\.viewport-rune-corner/, 'Expected .viewport-rune-corner styling in progression.css');

  // 2. Session navigation buttons (Return to Character Select & Logout to Login)
  assert.match(html, /id="btn-return-char-select"/, 'Expected #btn-return-char-select button in HUD');
  assert.match(html, /id="btn-logout-to-login"/, 'Expected #btn-logout-to-login button in HUD');
  assert.match(authTs, /performReturnToCharacterSelect/, 'Expected performReturnToCharacterSelect handler in AuthSelection.ts');
  assert.match(authTs, /performSignOutToLogin/, 'Expected performSignOutToLogin handler in AuthSelection.ts');

  // 3. Top-right selectors (Gold, Zoom, Fullscreen/Tela, Ping)
  assert.match(html, /icon-gold-coin\.svg/, 'Expected custom runic gold coin SVG in top-right HUD');
  assert.match(html, /id="btn-fullscreen-toggle"/, 'Expected #btn-fullscreen-toggle (Tela) in top-right HUD');
  assert.match(html, /icon-screen-fullscreen\.svg/, 'Expected fullscreen SVG icon in top-right HUD');
  assert.match(authTs, /requestFullscreen/, 'Expected fullscreen toggle logic in AuthSelection.ts');

  // 4. Hero class characteristics & differentiated Primary Attack button
  assert.match(html, /id="hud-class-trait-pill"/, 'Expected #hud-class-trait-pill in Hero Status Card');
  assert.match(html, /id="hud-hero-honor-tag"/, 'Expected #hud-hero-honor-tag in Hero Status Card');
  assert.match(html, /class="combat-action-container"/, 'Expected collaborator combat layout');
  assert.match(html, /title="Ataque básico automático"/, 'Basic attack presentation must describe server automation');
  assert.ok(
    fs.existsSync(path.join(clientRoot, 'public/assets/ui/frames/attack-runic-ring.svg')),
    'Expected attack-runic-ring.svg to exist on disk',
  );
  assert.match(mainTs, /HERO_CLASS_HUD_META/, 'Expected HERO_CLASS_HUD_META class trait dictionary in main.ts');
  assert.match(mainTs, /applyHeroClassHudIdentity/, 'Expected applyHeroClassHudIdentity in main.ts');

  // 5. Left Collapsible Runic Tactical Drawer (AUTO, Farm, HP, MP), Centered Bottom Chat & responsive default collapsed rules
  assert.match(html, /id=['"]tactical-action-bar['"]/, 'Expected #tactical-action-bar in index.html');
  assert.match(html, /id=['"]btn-tactical-drawer-toggle['"]/, 'Expected #btn-tactical-drawer-toggle arrow button in index.html');
  assert.match(mainTs, /btn-tactical-drawer-toggle/, 'Expected tactical drawer toggle handler in main.ts');
  assert.match(mainTs, /setTacticalDrawerOpen\(window\.innerWidth > 1180\)/, 'Expected tactical drawer to be default collapsed on reduced/mobile viewports');
  assert.match(progCss, /\.tactical-drawer-toggle/, 'Expected .tactical-drawer-toggle styling in progression.css');
  assert.match(progCss, /#tactical-action-bar\.runic-tactical-bar/, 'Expected left vertical tactical drawer styling in progression.css');
  assert.match(progCss, /#bottom-center-zone\s*\{[^}]*left:\s*calc\(14px/s, 'Expected chat on the left');
  assert.match(progCss, /@media \(max-width: 1180px\)/, 'Expected responsive reduced browser / tablet rules in progression.css');
  assert.match(progCss, /@media \(max-width: 900px\)/, 'Expected responsive mobile / portrait rules in progression.css');
});

test('HUD responsiveness preserves collaborator dock and square skill stack', () => {
  const progCss = fs.readFileSync(path.join(clientRoot, 'src/ui/progression.css'), 'utf8');
  const automaticCss = fs.readFileSync(path.join(clientRoot, 'src/ui/automatic-play.css'), 'utf8');
  assert.match(progCss, /#right-vertical-dock[^{]*\{[^}]*flex-direction:\s*column\s*!important/s, 'Expected dock rail to stay flex-direction column on all screens');
  assert.match(progCss, /\.skills-square-row\s*\{[^}]*flex-direction:\s*row/s, 'Expected horizontal skill bar');
  assert.doesNotMatch(automaticCss, /#bottom-center-zone|#mobile-combat-arc-container/, 'Mechanics CSS must preserve collaborator HUD positioning');
  assert.match(progCss, /#skill-btn-4\s*\{[^}]*position:\s*relative\s*!important/s, 'Square skills must not use radial positioning');
});
