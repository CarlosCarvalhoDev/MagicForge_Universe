import { HERO_SHEETS, frameAt, keyDarkBackground, type HeroAction, type HeroSheetSpec } from '../renderer/HeroAnimations';

const action = document.getElementById('action') as HTMLSelectElement;
const walkVersion = document.getElementById('walk-version') as HTMLSelectElement;
const warriorVersion = document.getElementById('warrior-version') as HTMLSelectElement;
const view = document.getElementById('view') as HTMLSelectElement;
const barbarianVersion = document.getElementById('barbarian-version') as HTMLSelectElement;
const walkVersions: Record<string, HeroSheetSpec> = {
  candidate: { file: '/assets/isometric/review/clerigo_walk_v4_1_sheet.png', cols: 4, rows: 2, frames: 8, fps: 12 },
  frontal: { file: '/assets/isometric/review/clerigo_walk_v3_sheet.png', cols: 4, rows: 2, frames: 8, fps: 12 },
  rejected: { file: '/assets/isometric/review/clerigo_walk_v2_sheet.png', cols: 4, rows: 2, frames: 8, fps: 12 },
  previous: { file: '/assets/isometric/review/clerigo_walk_v1_sheet.png', cols: 3, rows: 2, frames: 6, fps: 9 },
};
const warriorWalkVersions: Record<string, HeroSheetSpec> = {
  candidate: { file: '/assets/isometric/review/guerreiro_walk_v3_sheet.png', cols: 3, rows: 2, frames: 6, fps: 9 },
  previous: { file: '/assets/isometric/review/guerreiro_walk_v2_sheet.png', cols: 3, rows: 2, frames: 6, fps: 9 },
  runtime: HERO_SHEETS.GUERREIRO.walk,
  baseline: { file: '/assets/isometric/review/guerreiro_walk_baseline_sheet.png', cols: 3, rows: 2, frames: 6, fps: 9 },
};
const barbarianWalkVersions: Record<string, HeroSheetSpec> = {
  candidate: { file: '/assets/isometric/review/barbaro_walk_v2_sheet.png', cols: 3, rows: 2, frames: 6, fps: 9 },
  repair: { file: '/assets/isometric/review/barbaro_walk_v3_sheet.png', cols: 3, rows: 2, frames: 6, fps: 9 },
  runtime: HERO_SHEETS.BARBARO.walk,
  baseline: { file: '/assets/isometric/review/barbaro_walk_baseline_sheet.png', cols: 3, rows: 2, frames: 6, fps: 9 },
};
const comparisons: Record<string, HeroSheetSpec> = { rejected: walkVersions.rejected, warriorBaseline: warriorWalkVersions.baseline, barbarianBaseline: barbarianWalkVersions.baseline };
function selectedSheet(className: string): HeroSheetSpec {
  if (className === 'BARBARO' && action.value === 'walk') return barbarianWalkVersions[barbarianVersion.value];
  if (className === 'GUERREIRO' && action.value === 'walk') return warriorWalkVersions[warriorVersion.value];
  if (className === 'CLERIGO' && action.value === 'walk' && walkVersions[walkVersion.value]) return walkVersions[walkVersion.value];
  return HERO_SHEETS[className][action.value as HeroAction];
}
const play = document.getElementById('play') as HTMLButtonElement;
const speed = document.getElementById('speed') as HTMLSelectElement;
const background = document.getElementById('background') as HTMLSelectElement;
const alpha = document.getElementById('alpha') as HTMLSelectElement;
const guides = document.getElementById('guides') as HTMLInputElement;
const status = document.getElementById('review-status')!;
const images = new Map<string, { raw: HTMLCanvasElement; keyed: HTMLCanvasElement }>();
const labels: Record<string, string> = { GUERREIRO: 'Guerreiro', CLERIGO: 'Clérigo', BARBARO: 'Bárbaro', ARQUEIRO: 'Arqueiro' };
let running = false;
let elapsed = 0;
let last = performance.now();
let fixedFrame: number | null = null;
let loaded = 0;
let failures = 0;
const panels = [
  { className: 'ARQUEIRO', fixedVersion: '' },
  { className: 'GUERREIRO', fixedVersion: '' },
  { className: 'CLERIGO', fixedVersion: '' },
  { className: 'BARBARO', fixedVersion: '' },
  { className: 'CLERIGO', fixedVersion: 'rejected' },
  { className: 'GUERREIRO', fixedVersion: 'warriorBaseline' },
  { className: 'BARBARO', fixedVersion: 'barbarianBaseline' },
].map(({ className, fixedVersion }) => {
  const article = document.createElement('article');
  const title = document.createElement('h2'); title.textContent = labels[className]; article.append(title);
  const info = document.createElement('output'); info.className = 'status'; article.append(info);
  const stage = document.createElement('div'); stage.className = 'stage';
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  canvas.setAttribute('aria-label', `Prévia animada de ${labels[className]}`); stage.append(canvas); article.append(stage);
  const frames = document.createElement('div'); frames.className = 'frames'; article.append(frames);
  document.getElementById('classes')!.append(article);
  return { className, fixedVersion, title, article, info, canvas, frames, stage, buttons: [] as HTMLButtonElement[] };
});
const archerReference = document.createElement('article'); archerReference.hidden = true;
const referenceTitle = document.createElement('h2'); referenceTitle.textContent = 'Arqueiro · referência estática preservada';
const referenceNote = document.createElement('p'); referenceNote.textContent = 'Sprite original do jogo. Esta imagem é uma referência de identidade, não uma animação.';
const referenceImage = document.createElement('img'); referenceImage.src = '/assets/isometric/iso_hero_arqueiro.jpg'; referenceImage.alt = 'Sprite estático original do Arqueiro'; referenceImage.style.cssText = 'display:block;width:100%;height:auto';
archerReference.append(referenceTitle, referenceNote, referenceImage); document.getElementById('classes')!.append(archerReference);
function panelSheet(panel: typeof panels[number]) {
  if (panel.fixedVersion === 'warriorBaseline' && action.value === 'walk' && ['candidate', 'runtime'].includes(warriorVersion.value)) return warriorWalkVersions.previous;
  return panel.fixedVersion && action.value === 'walk' ? comparisons[panel.fixedVersion] : selectedSheet(panel.className);
}
function updateView() {
  const archerOnly = view.value === 'archer';
  const comparison = !archerOnly && view.value !== 'classes' && action.value === 'walk';
  const focusClass = view.value === 'barbarian' ? 'BARBARO' : view.value === 'warrior' ? 'GUERREIRO' : 'CLERIGO';
  document.getElementById('cleric-version-control')!.hidden = !['cleric', 'classes'].includes(view.value);
  document.getElementById('warrior-version-control')!.hidden = !['warrior', 'classes'].includes(view.value);
  document.getElementById('barbarian-version-control')!.hidden = !['barbarian', 'classes'].includes(view.value);
  for (const panel of panels) {
    panel.article.hidden = archerOnly ? panel.className !== 'ARQUEIRO' : comparison ? panel.className !== focusClass : Boolean(panel.fixedVersion);
    panel.title.textContent = panel.fixedVersion === 'barbarianBaseline' ? 'Bárbaro · versão anterior arquivada' : panel.fixedVersion === 'warriorBaseline' ? (['candidate', 'runtime'].includes(warriorVersion.value) ? 'Guerreiro · V2 · passada com chute' : 'Guerreiro · baseline arquivado') : panel.fixedVersion ? 'Clérigo · V2 reprovada'
      : panel.className === 'ARQUEIRO' ? 'Arqueiro · V1 aprovada · folhas em uso'
      : panel.className === 'BARBARO' && action.value === 'walk' ? `Bárbaro · ${barbarianVersion.selectedOptions[0].textContent}`
      : panel.className === 'GUERREIRO' && action.value === 'walk' ? `Guerreiro · ${warriorVersion.selectedOptions[0].textContent}`
      : panel.className === 'CLERIGO' && action.value === 'walk' ? `Clérigo · ${walkVersion.selectedOptions[0].textContent}` : labels[panel.className];
  }
  archerReference.hidden = !archerOnly;
  document.getElementById('classes')!.classList.toggle('compare', comparison || archerOnly);
}

const allSheets = [...Object.values(HERO_SHEETS).flatMap(sheetSet => Object.values(sheetSet)), ...Object.values(walkVersions), ...Object.values(warriorWalkVersions), ...Object.values(barbarianWalkVersions)];
function updateStatus() { status.textContent = `${loaded} de ${allSheets.length} folhas/versões carregadas${failures ? ` · ${failures} falha(s)` : ''}.`; }
for (const spec of allSheets) {
  const img = new Image();
  img.onload = () => {
    if (img.naturalWidth !== spec.cols * 512 || img.naturalHeight !== spec.rows * 512) { failures++; updateStatus(); return; }
    const raw = document.createElement('canvas'); raw.width = img.naturalWidth; raw.height = img.naturalHeight;
    raw.getContext('2d')!.drawImage(img, 0, 0);
    const keyed = document.createElement('canvas'); keyed.width = raw.width; keyed.height = raw.height;
    const ctx = keyed.getContext('2d')!; const pixels = raw.getContext('2d')!.getImageData(0, 0, raw.width, raw.height);
    keyDarkBackground(pixels.data); ctx.putImageData(pixels, 0, 0);
    images.set(spec.file, { raw, keyed }); loaded++; rebuildFrames(); updateStatus();
  };
  img.onerror = () => { failures++; updateStatus(); };
  img.src = spec.file;
}

function draw(canvas: HTMLCanvasElement, className: string, frame: number, showGuides: boolean, override?: HeroSheetSpec) {
  const spec = override ?? selectedSheet(className);
  const image = images.get(spec.file)?.[alpha.value === 'raw' ? 'raw' : 'keyed'];
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (image) ctx.drawImage(image, frame % spec.cols * 512, Math.floor(frame / spec.cols) * 512, 512, 512, 0, 0, canvas.width, canvas.height);
  if (showGuides) {
    ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(canvas.width * .5, 0); ctx.lineTo(canvas.width * .5, canvas.height);
    ctx.moveTo(0, canvas.height * .85); ctx.lineTo(canvas.width, canvas.height * .85); ctx.stroke(); ctx.setLineDash([]);
    if (action.value === 'walk') {
      const w = canvas.width, h = canvas.height;
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * .08, h * .77); ctx.lineTo(w * .23, h * .89);
      ctx.lineTo(w * .20, h * .88); ctx.moveTo(w * .23, h * .89); ctx.lineTo(w * .22, h * .85); ctx.stroke();
      ctx.fillStyle = '#fbbf24'; ctx.font = `${Math.round(w * .025)}px system-ui`; ctx.fillText('SE', w * .08, h * .75);
    }
  }
}

function rebuildFrames() {
  for (const panel of panels) {
    const spec = panelSheet(panel);
    panel.frames.replaceChildren(); panel.buttons = [];
    panel.frames.style.gridTemplateColumns = `repeat(${spec.cols}, minmax(0, 1fr))`;
    for (let frame = 0; frame < spec.frames; frame++) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'stage';
      button.setAttribute('aria-label', `${panel.fixedVersion === 'barbarianBaseline' ? 'Bárbaro anterior' : panel.fixedVersion === 'warriorBaseline' ? 'Guerreiro anterior' : panel.fixedVersion ? 'Clérigo V2' : labels[panel.className]}, quadro ${frame + 1}`);
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
      draw(canvas, panel.className, frame, false, spec); const label = document.createElement('span'); label.textContent = `${frame + 1}`;
      button.append(canvas, label); button.onclick = () => { fixedFrame = frame; elapsed = frame / spec.fps * 1000; running = false; syncPlay(); };
      panel.buttons.push(button); panel.frames.append(button);
    }
  }
  applyBackground();
}
function syncPlay() { play.textContent = running ? 'Pausar' : 'Reproduzir'; }
play.onclick = () => {
  fixedFrame = null; running = !running; syncPlay();
};
document.getElementById('restart')!.onclick = () => { elapsed = 0; fixedFrame = null; };
action.onchange = () => { elapsed = 0; fixedFrame = null; rebuildFrames(); updateView(); };
view.onchange = updateView;
walkVersion.onchange = () => { elapsed = 0; fixedFrame = null; rebuildFrames(); updateView(); };
warriorVersion.onchange = () => { elapsed = 0; fixedFrame = null; rebuildFrames(); updateView(); };
barbarianVersion.onchange = () => { elapsed = 0; fixedFrame = null; rebuildFrames(); updateView(); };
alpha.onchange = rebuildFrames;
function applyBackground() {
  for (const stage of document.querySelectorAll<HTMLElement>('.stage')) {
    stage.style.backgroundColor = background.value === 'black' ? '#000' : background.value === 'light' ? '#f1f5f9' : '#182337';
    stage.style.backgroundImage = background.value === 'checker' ? '' : 'none';
  }
}
background.onchange = applyBackground;
function render(now: number) {
  if (running) elapsed += Math.min(now - last, 100) * Number(speed.value);
  last = now;
  for (const panel of panels) {
    const selectedAction = action.value as HeroAction;
    const spec = panelSheet(panel);
    const frame = fixedFrame === null ? frameAt(spec, elapsed, selectedAction === 'walk' || selectedAction === 'idle') : Math.min(fixedFrame, spec.frames - 1);
    draw(panel.canvas, panel.className, frame, guides.checked, spec);
    panel.info.textContent = `${selectedAction === 'attack' && panel.className === 'CLERIGO' ? 'cast' : selectedAction} · quadro ${frame + 1}/${spec.frames} · ${spec.fps} FPS · ${Math.round(spec.frames / spec.fps * 1000)} ms/ciclo`;
    panel.buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === frame)));
  }
  requestAnimationFrame(render);
}
syncPlay(); rebuildFrames(); updateView(); requestAnimationFrame(render);
