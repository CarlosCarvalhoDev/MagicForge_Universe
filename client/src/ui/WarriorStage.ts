import { BARBARIAN_DIRECTIONAL_SHEETS, WARLOCK_DIRECTIONAL_SHEETS, WARLOCK_FX_SHEETS, WARRIOR_DIRECTIONAL_SHEETS, heroCastArt, warlockSkillArt } from '../renderer/HeroAnimations';

const warlockPreviewDuration = 1280;
const warlockPoseOffsets = [0, .11, .23, .35, .50, .72, 1];

function playWarlockPreviewEffect(stage: HTMLElement, art: NonNullable<ReturnType<typeof warlockSkillArt>>): HTMLElement {
  const effect = document.createElement('div');
  effect.className = 'class-warlock-spell';
  effect.setAttribute('aria-hidden', 'true');
  effect.style.backgroundImage = `url("${WARLOCK_FX_SHEETS[art.slot]}")`;
  stage.append(effect);
  const row = art.row * 50;
  const local = (art.slot === 1 && art.row > 0) || (art.slot === 2 && art.row === 2);
  const frames = local ? [3, 4, 5] : [0, 1, 2, 3, 4, 5];
  const timing = { duration: 610, delay: 640, fill: 'both' as const };
  effect.animate([...frames, 5].map(frame => ({
    backgroundPosition: `${frame * 20}% ${row}%`, easing: 'steps(1, end)',
  })), timing);
  const motion = local
    ? [{ opacity: 0 }, { opacity: .75, offset: .22 }, { opacity: 0 }]
    : [
        { opacity: 0, transform: 'translate(0, -38%)' },
        { opacity: .9, transform: 'translate(62%, -15%)', offset: .5 },
        { opacity: 0, transform: 'translate(62%, -15%)' },
      ];
  effect.animate(motion, { ...timing, easing: 'linear' });
  return effect;
}

type AnimatedClassArtwork = {
  idle: { file: string; cols: number; rows: number; frames: number; fps: number };
  backdrop: string;
};

const classArtwork: Record<string, AnimatedClassArtwork> = {
  GUERREIRO: {
    idle: WARRIOR_DIRECTIONAL_SHEETS.idle,
    backdrop: '/assets/isometric/stages/warrior-dungeon.webp',
  },
  BARBARO: {
    idle: BARBARIAN_DIRECTIONAL_SHEETS.idle,
    backdrop: '/assets/isometric/stages/barbarian-wolf-camp.jpg',
  },
  BRUXO: {
    idle: WARLOCK_DIRECTIONAL_SHEETS.idle,
    backdrop: '/assets/isometric/stages/warlock-pact-sanctum.jpg',
  },
};

export function renderClassArtwork(host: HTMLElement, classType: string, variant: 'scene' | 'compact' | 'portrait' = 'scene'): void {
  const key = `${classType}:${variant}`;
  if (host.dataset.artwork === key) return;
  host.dataset.artwork = key;

  const artwork = classArtwork[classType];
  if (!artwork || variant === 'portrait') {
    const portrait = document.createElement('img');
    portrait.className = 'class-artwork-portrait';
    portrait.src = `/assets/portraits/${classType}.jpg`;
    portrait.alt = '';
    host.replaceChildren(portrait);
    return;
  }
  const stage = document.createElement('div');
  stage.className = 'class-artwork-stage';
  stage.dataset.variant = variant;
  stage.dataset.class = classType;
  stage.style.setProperty('--class-backdrop', `url("${artwork.backdrop}")`);

  const { idle } = artwork;
  const sprite = document.createElement('div');
  sprite.className = 'class-artwork-idle';
  sprite.style.backgroundImage = `url("${idle.file}")`;
  sprite.style.backgroundSize = `${idle.cols * 100}% ${idle.rows * 100}%`;
  sprite.style.animationDuration = `${idle.frames / idle.fps}s`;
  sprite.style.setProperty('--idle-steps', String(idle.frames));
  sprite.style.setProperty('--idle-end', `${idle.cols > 1 ? idle.frames * 100 / (idle.cols - 1) : 0}%`);
  stage.append(sprite);
  host.replaceChildren(stage);
}

export function playClassSkillArtwork(host: HTMLElement, skillId: string, iconUrl: string): void {
  const previous = host.querySelector('.class-skill-playback');
  previous?.remove();
  const art = heroCastArt(skillId);
  const stage = host.querySelector<HTMLElement>('.class-artwork-stage');
  stage?.classList.remove('casting');
  stage?.querySelector('.class-warlock-spell')?.remove();
  const playback = document.createElement('div');
  playback.className = 'class-skill-playback';
  playback.setAttribute('aria-hidden', 'true');

  if (art && stage) {
    const warlock = warlockSkillArt(skillId);
    playback.classList.add('class-skill-sheet');
    stage.append(playback);
    const sheet = new Image();
    sheet.src = art.file;
    void sheet.decode().then(() => {
      if (!playback.isConnected) return;
      playback.style.backgroundImage = `url("${art.file}")`;
      playback.style.setProperty('--skill-ground', `${art.ground * 100}%`);
      const row = `${art.row * 50}%`;
      playback.style.backgroundPosition = `0 ${row}`;
      stage.classList.add('casting');
      const cols = art.cols ?? 4;
      playback.style.backgroundSize = `${cols * 100}% 300%`;
      const positions = Array.from({ length: cols + 1 }, (_, index) => ({
        backgroundPosition: `${Math.min(index, cols - 1) * 100 / (cols - 1)}% ${row}`,
        offset: warlock ? warlockPoseOffsets[index] : index / cols,
        easing: 'steps(1, end)',
      }));
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const effect = warlock && !reduced ? playWarlockPreviewEffect(stage, warlock) : undefined;
      const duration = warlock && !reduced ? warlockPreviewDuration : cols * (art.frameMs ?? 125);
      const still = { backgroundPosition: positions[2].backgroundPosition };
      const animation = playback.animate(reduced ? [still, still] : positions, { duration, fill: 'forwards' });
      animation.onfinish = () => {
        if (!playback.isConnected) return;
        stage.classList.remove('casting');
        effect?.remove();
        playback.remove();
      };
    }).catch(() => playback.remove());
    return;
  }

  const icon = document.createElement('img');
  icon.src = iconUrl;
  icon.alt = '';
  playback.classList.add('class-skill-illustration');
  playback.append(icon);
  host.append(playback);
  playback.addEventListener('animationend', () => playback.remove(), { once: true });
}
