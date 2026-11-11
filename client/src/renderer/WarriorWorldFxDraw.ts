import { finitePosition, type FxInstance } from './PixelVfx';

export const WARRIOR_WORLD_ATLAS = '/assets/isometric/animations/vfx/warrior-world-atlas.webp';
export const WARRIOR_ULTIMATE_ATLAS = '/assets/isometric/animations/vfx/warrior-ultimate-atlas.webp';

export function drawWarriorUltimate(
  ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, fx: FxInstance,
  x: number, y: number, zoom: number, progress: number,
): boolean {
  const row = (fx.artwork ?? 0) - 9;
  if (row < 0 || row > 2 || !atlas.naturalWidth || fx.kind === 'heal') return false;
  const frameWidth = atlas.naturalWidth / 4;
  const frameHeight = atlas.naturalHeight / 3;
  const area = (fx.radius ?? 4) * 2 * zoom;
  const stamp = (frame: number, width: number, height: number, offsetY = 0, angle = 0) => {
    ctx.save();
    ctx.translate(x, y + offsetY);
    ctx.rotate(angle);
    ctx.drawImage(atlas, frame * frameWidth, row * frameHeight, frameWidth, frameHeight, -width / 2, -height / 2, width, height);
    ctx.restore();
  };
  switch (fx.kind) {
    case 'warriorSigil': {
      const size = area * (.24 + .27 * progress);
      stamp(progress < .42 || row !== 0 ? 0 : 1, size, size * (row === 1 ? .72 : 1), row === 1 ? -size * .28 : 0);
      return true;
    }
    case 'warriorBlade': {
      const fall = (1 - Math.min(1, progress / .41)) ** 2 * 12 * zoom;
      stamp(1, 7.5 * zoom, 9 * zoom, -4.05 * zoom - fall);
      return true;
    }
    case 'warriorWave': {
      const size = area * Math.min(1.08, .17 + progress / .78);
      if (row === 1) {
        const burst = area * (.58 + .5 * Math.min(1, progress * 2));
        stamp(2, burst, burst * .72, -burst * .23);
      } else {
        stamp(row === 2 && progress < .48 ? 1 : 2, size, size, progress * (row === 0 ? -.8 : .55));
      }
      return true;
    }
    case 'warriorAftermath':
      stamp(3, area * (.88 + .16 * progress), area * (row === 1 ? .55 : 1), row === 1 ? -area * .19 : 0, row === 1 ? 0 : progress * .48);
      return true;
    case 'warriorContact': {
      const size = zoom * (1.6 + progress * 1.1);
      stamp(2, size, size, -size * .4);
      return true;
    }
    default:
      return false;
  }
}

export function drawWarriorWorldFx(
  ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, fx: FxInstance,
  x: number, y: number, zoom: number, progress: number,
): void {
  if (fx.artwork === undefined || !atlas.naturalWidth || !atlas.naturalHeight) return;
  const cellWidth = atlas.naturalWidth / 3;
  const cellHeight = atlas.naturalHeight / 4;
  const column = fx.artwork % 3 * cellWidth;
  const row = Math.floor(fx.artwork / 3) * cellHeight;
  const draw = (px: number, py: number, width: number, height: number, angle = 0, anchor = .5) => {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.drawImage(atlas, column, row, cellWidth, cellHeight, -width / 2, -height * anchor, width, height);
    ctx.restore();
  };
  const flash = (px: number, py: number, width: number, height: number) =>
    ctx.drawImage(atlas, column, row + cellHeight * .76, cellWidth, cellHeight * .24,
      px - width / 2, py - height / 2, width, height);

  switch (fx.kind) {
    case 'warriorTrail': {
      if (!finitePosition(fx.destination)) break;
      const dx = (fx.destination.x - fx.position.x) * zoom;
      const dy = (fx.destination.z - fx.position.z) * zoom;
      const travel = Math.min(1, progress / .4);
      const width = zoom * (2.4 + travel);
      const angle = Math.atan2(dy, dx);
      if (fx.artwork === 4 || fx.artwork === 1) {
        ctx.save();
        ctx.globalAlpha *= .42;
        const behind = Math.max(0, travel - .25);
        draw(x + dx * behind, y + dy * behind - zoom, width * .78, width * .78, angle);
        ctx.restore();
      }
      draw(x + dx * travel, y + dy * travel - zoom, width, width, angle);
      break;
    }
    case 'warriorSigil': {
      const diameter = (fx.radius ?? 4) * zoom * (.35 + progress * .65);
      if (fx.artwork === 10) {
        flash(x, y, diameter * 1.5, diameter * .34);
        flash(x, y - zoom * 2.8, diameter * .48, diameter * .22);
      } else {
        draw(x, y, diameter, diameter, progress * (fx.artwork === 9 ? -1.15 : 1.3));
      }
      break;
    }
    case 'warriorWave': {
      const diameter = (fx.radius ?? 4) * 2 * zoom * Math.min(1, .10 + progress / .83);
      if (fx.artwork === 10) {
        // Use the light and sparks at the sword tip as the horizontal impact flash.
        flash(x, y, diameter, diameter * .24);
      } else {
        const spin = fx.artwork === 6 ? 3.4 : fx.artwork === 9 ? -1.4 : .65;
        draw(x, y, diameter, diameter, progress * spin);
      }
      break;
    }
    case 'warriorAftermath': {
      const radius = (fx.radius ?? 4) * zoom;
      if (fx.artwork === 9) {
        // Fragments of the martial crest rise around the hero as the power settles.
        for (let index = 0; index < 4; index++) {
          const angle = index * Math.PI / 2 + progress * 2.4;
          const orbit = zoom * (2.5 - progress);
          draw(x + Math.cos(angle) * orbit, y + Math.sin(angle) * orbit - progress * 3 * zoom,
            zoom * 1.6, zoom * 1.6, angle);
        }
      } else if (fx.artwork === 10) {
        flash(x, y, radius * (1.65 + progress * .35), zoom * (1.8 - progress));
        draw(x, y - progress * zoom, zoom * 3.2, zoom * 6.2, 0, .96);
      } else {
        // Small fire fragments peel off the last ring and cool at its perimeter.
        for (let index = 0; index < 8; index++) {
          const angle = index * Math.PI / 4 + progress * .45;
          const edge = radius * (.65 + progress * .35);
          const size = zoom * (1.1 - progress * .6);
          draw(x + Math.cos(angle) * edge, y + Math.sin(angle) * edge - progress * zoom, size, size, angle);
        }
      }
      break;
    }
    case 'warriorBlade': {
      const fall = (1 - Math.min(1, progress / .41)) ** 2 * 10 * zoom;
      draw(x, y - fall, 7 * zoom, 8 * zoom, 0, .96);
      break;
    }
    case 'line': {
      const length = (fx.lineLength ?? 4.5) * zoom * Math.min(1, progress / .8);
      const angle = (fx.yaw ?? 0) * Math.PI / 180;
      draw(x + Math.sin(angle) * length / 2, y + Math.cos(angle) * length / 2,
        length, (fx.lineWidth ?? 3) * zoom, Math.PI / 2 - angle);
      break;
    }
    case 'warriorContact': {
      const size = zoom * (1.4 + 1.3 * progress);
      if (fx.artwork === 10) {
        flash(x, y - zoom * .75, size, size * .45);
      } else {
        draw(x, y - zoom * .75, size, size, progress * .4);
      }
      break;
    }
    case 'warriorAura': {
      if (fx.artwork === 11) break; // The fire rings already have their own scheduled sprites.
      const size = zoom * (3.4 + progress * .6);
      draw(x, y - progress * zoom, size, size, 0, .84);
      break;
    }
    case 'heal':
    case 'shield':
      // Local effects use their dedicated aura sprite, except the ultimate's recovery.
      if (fx.artwork === 11 && fx.kind === 'heal') {
        ctx.drawImage(atlas, 0, cellHeight, cellWidth, cellHeight,
          x - 1.5 * zoom, y - (2.7 + progress) * zoom, 3 * zoom, 3 * zoom);
      }
      break;
  }
}
