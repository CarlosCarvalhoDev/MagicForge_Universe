import { WARRIOR_DIRECTIONAL_SHEETS, warriorCastArt } from '../renderer/HeroAnimations';

type AnimatedClassArtwork = {
  idle: { file: string; cols: number; rows: number; frames: number; fps: number };
  backdrop: string;
};

const classArtwork: Record<string, AnimatedClassArtwork> = {
  GUERREIRO: {
    idle: WARRIOR_DIRECTIONAL_SHEETS.idle,
    backdrop: '/assets/isometric/stages/warrior-dungeon.webp',
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
  const art = warriorCastArt(skillId);
  const stage = host.querySelector('.class-artwork-stage');
  stage?.classList.remove('casting');
  const playback = document.createElement('div');
  playback.className = 'class-skill-playback';
  playback.setAttribute('aria-hidden', 'true');

  if (art && stage) {
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
      const positions = [0, 1, 2, 3, 3].map(frame => ({ backgroundPosition: `${frame * 100 / 3}% ${row}`, easing: 'steps(1, end)' }));
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animation = playback.animate(reduced ? [positions[2], positions[2]] : positions, { duration: 500 });
      animation.onfinish = () => {
        if (!playback.isConnected) return;
        stage.classList.remove('casting');
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
