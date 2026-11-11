import { INTRO_SCENES } from './NarrativeContent';
import { enableNarration, speakNarrative, stopNarration, supportsNarration } from './Narration';

export function setupCinematicIntro(options: { autoStart?: boolean; storage?: Pick<Storage, 'getItem' | 'setItem'> } = {}) {
  const dialog = document.createElement('dialog');
  dialog.id = 'cinematic-intro';
  dialog.setAttribute('aria-labelledby', 'cinematic-title');
  dialog.innerHTML = `
    <header class="chronicle-bar">
      <span class="chronicle-brand">MagicForge <small>Universe</small></span>
      <button id="cinematic-skip" type="button">Fechar prólogo</button>
    </header>
    <div class="chronicle-hero" style="--chronicle-art: url('${INTRO_SCENES[0].image}')">
      <div class="chronicle-wrap">
        <p class="chronicle-kicker">Crônicas de MagicForge · Prólogo</p>
        <h2 id="cinematic-title">A Bigorna Partida</h2>
        <p>Da primeira chama ao despertar dos Forjados.</p>
        <a href="#chronicle-scene-1">Ler a crônica ↓</a>
      </div>
    </div>
    <div class="chronicle-wrap chronicle-story">
      ${INTRO_SCENES.map((scene, index) => `
        <section class="chronicle-scene" id="chronicle-scene-${index + 1}" aria-labelledby="chronicle-title-${index + 1}">
          <img src="${scene.image}" alt="" loading="lazy">
          <div class="chronicle-copy">
            <p class="chronicle-kicker">${scene.chapter}</p>
            <h3 id="chronicle-title-${index + 1}">${scene.title}</h3>
            <p>${scene.text}</p>
            ${scene.effect === 'elements' ? '<ul class="chronicle-elements"><li>Fogo</li><li>Água</li><li>Natureza</li><li>Terra</li><li>Luz</li><li>Sombra</li></ul>' : ''}
            <button type="button" data-narrate="${index}" aria-label="Ouvir: ${scene.title}">Ouvir trecho</button>
          </div>
        </section>
      `).join('')}
      <footer class="chronicle-footer"><p class="chronicle-kicker">A história continua com você</p><button id="chronicle-finish" type="button">Voltar ao jogo →</button></footer>
    </div>`;
  document.body.append(dialog);

  const key = 'magicforge_intro_seen_v1';
  const storage = () => options.storage ?? localStorage;
  const closeButton = dialog.querySelector<HTMLButtonElement>('#cinematic-skip')!;
  const finishButton = dialog.querySelector<HTMLButtonElement>('#chronicle-finish')!;
  let returnFocus: HTMLElement | null = null;
  function finish() {
    if (!dialog.open) return;
    dialog.close();
    stopNarration();
    try { storage().setItem(key, 'true'); } catch { /* Reading does not require storage. */ }
    if (returnFocus?.isConnected) returnFocus.focus();
  }
  function open() {
    if (dialog.open) return;
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    finishButton.textContent = returnFocus?.id === 'btn-cover-prologue' ? 'Voltar à apresentação →' : 'Voltar ao jogo →';
    dialog.showModal();
    dialog.scrollTop = 0;
    closeButton.focus({ preventScroll: true });
  }

  closeButton.onclick = finish;
  finishButton.onclick = finish;
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); });
  const firstScene = dialog.querySelector<HTMLElement>('.chronicle-scene')!;
  dialog.querySelector('a')!.onclick = event => {
    event.preventDefault();
    firstScene.scrollIntoView({ block: 'start' });
  };
  dialog.querySelectorAll<HTMLButtonElement>('[data-narrate]').forEach(button => {
    button.hidden = !supportsNarration();
    button.onclick = () => {
      if (enableNarration(true)) speakNarrative(INTRO_SCENES[Number(button.dataset.narrate)].text);
    };
  });
  document.getElementById('btn-replay-story')?.addEventListener('click', open);
  let seen = false;
  try { seen = storage().getItem(key) === 'true'; } catch { /* First access. */ }
  if (options.autoStart !== false && !seen) window.setTimeout(open, 0);
  return { open, isOpen: () => dialog.open, close: finish };
}
