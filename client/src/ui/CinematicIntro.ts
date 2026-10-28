import { INTRO_SCENES } from './NarrativeContent';
import { enableNarration, speakNarrative, stopNarration, supportsNarration } from './Narration';

export function setupCinematicIntro(options: { autoStart?: boolean; storage?: Pick<Storage, 'getItem' | 'setItem'> } = {}) {
  const dialog = document.createElement('dialog'); dialog.id = 'cinematic-intro';
  dialog.setAttribute('aria-labelledby', 'cinematic-title');
  dialog.innerHTML = '<div class="cinematic-art"><img alt=""><div class="cinematic-elements" aria-hidden="true"><i>Fogo</i><i>Água</i><i>Natureza</i><i>Terra</i><i>Luz</i><i>Sombra</i></div></div><div class="cinematic-top"><span id="cinematic-progress"></span><button id="cinematic-skip" type="button">Pular introdução »</button></div><section class="cinematic-caption"><h2 id="cinematic-title"></h2><p id="cinematic-text" aria-live="polite"></p><nav><button id="cinematic-previous" type="button">Anterior</button><button id="cinematic-voice" type="button" aria-pressed="false">Narração: desligada</button><button id="cinematic-next" type="button">Próxima →</button></nav></section>';
  document.body.append(dialog);
  const art = dialog.querySelector<HTMLElement>('.cinematic-art')!;
  const image = dialog.querySelector('img')!;
  const previous = dialog.querySelector<HTMLButtonElement>('#cinematic-previous')!;
  const next = dialog.querySelector<HTMLButtonElement>('#cinematic-next')!;
  const voice = dialog.querySelector<HTMLButtonElement>('#cinematic-voice')!;
  const key = 'magicforge_intro_seen_v1';
  let index = 0, transitioning = false, voiced = false;
  let timer: number | undefined, fade: number | undefined;
  let returnFocus: HTMLElement | null = null;
  const storage = () => options.storage || localStorage;
  function finish() {
    window.clearTimeout(timer); window.clearTimeout(fade); stopNarration(); transitioning = false;
    try { storage().setItem(key, 'true'); } catch { /* Story remains usable without storage. */ }
    dialog.close();
    if (returnFocus?.isConnected) returnFocus.focus();
  }
  function render() {
    const scene = INTRO_SCENES[index];
    image.src = scene.image; image.alt = scene.title;
    image.style.animation = 'none'; void image.offsetWidth; image.style.animation = '';
    art.dataset.effect = scene.effect;
    dialog.querySelector('#cinematic-title')!.textContent = scene.title;
    dialog.querySelector('#cinematic-text')!.textContent = scene.text;
    dialog.querySelector('#cinematic-progress')!.textContent = 'MAGICFORGE · ' + (index + 1) + ' / ' + INTRO_SCENES.length;
    previous.disabled = index === 0; next.disabled = false;
    next.textContent = index === INTRO_SCENES.length - 1 ? 'Começar jornada →' : 'Próxima →';
    art.classList.remove('is-fading'); transitioning = false;
    if (voiced) speakNarrative(scene.text);
    window.clearTimeout(timer); timer = window.setTimeout(() => change(index + 1), scene.duration);
  }
  function change(target: number) {
    if (!dialog.open || transitioning) return;
    if (target >= INTRO_SCENES.length) { finish(); return; }
    if (target < 0) return;
    transitioning = true; window.clearTimeout(timer); stopNarration(); previous.disabled = next.disabled = true;
    art.classList.add('is-fading');
    fade = window.setTimeout(() => { if (dialog.open) { index = target; render(); } }, 500);
  }
  function open() {
    if (dialog.open) return;
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    index = 0; dialog.showModal(); render(); dialog.querySelector<HTMLButtonElement>('#cinematic-skip')!.focus();
  }
  previous.onclick = () => change(index - 1); next.onclick = () => change(index + 1);
  dialog.querySelector<HTMLButtonElement>('#cinematic-skip')!.onclick = finish;
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); });
  voice.disabled = !supportsNarration();
  voice.title = supportsNarration() ? 'Ativar ou desativar narração' : 'Narração indisponível neste navegador';
  voice.onclick = () => { voiced = enableNarration(!voiced); voice.setAttribute('aria-pressed', String(voiced)); voice.textContent = voiced ? 'Narração: ligada' : 'Narração: desligada'; if (voiced) speakNarrative(INTRO_SCENES[index].text); };
  document.getElementById('btn-replay-story')?.addEventListener('click', open);
  let seen = false; try { seen = storage().getItem(key) === 'true'; } catch { /* first access */ }
  if (options.autoStart !== false && !seen) window.setTimeout(open, 0);
  return { open, isOpen: () => dialog.open, close: finish };
}
