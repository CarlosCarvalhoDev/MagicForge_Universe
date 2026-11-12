import { finitePosition, type FxInstance } from './PixelVfx.ts';

export const WARRIOR_WORLD_ATLAS = '/assets/isometric/animations/vfx/warrior-world-atlas.webp';
export const WARRIOR_ULTIMATE_ATLAS = '/assets/isometric/animations/vfx/warrior-ultimate-atlas.webp';

type AtlasName = 'world' | 'ultimate' | 'impact';
type Layer = 'ground' | 'air';
type Sprite = (atlas: AtlasName, cell: number, x: number, y: number, w: number, h: number, angle?: number, alpha?: number) => void;
const TAU = Math.PI * 2;
const clamp = (t: number) => Math.max(0, Math.min(1, t));
const fade = (t: number, rise = .08, tail = .35) => clamp(t / rise) * clamp((1 - t) / tail);

function stamp(ctx: CanvasRenderingContext2D, images: Record<AtlasName, HTMLImageElement | undefined>): Sprite {
  return (key, cell, x, y, w, h, angle = 0, alpha = 1) => {
    const image = images[key];
    if (!image?.naturalWidth || w <= 0 || h <= 0 || alpha <= 0) return;
    const columns = key === 'world' ? 3 : 4;
    const rows = key === 'world' ? 4 : key === 'ultimate' ? 3 : 1;
    const sw = image.naturalWidth / columns, sh = image.naturalHeight / rows;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(image, cell % columns * sw, Math.floor(cell / columns) * sh, sw, sh, -w / 2, -h / 2, w, h);
    ctx.restore();
  };
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, width: number, alpha: number, flatten = .56) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(.1, r), Math.max(.1, r * flatten), 0, 0, TAU);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function fragments(ctx: CanvasRenderingContext2D, x: number, y: number, zoom: number, t: number,
  color: string, count: number, spread: number, height: number, angle?: number, startRadius = 0) {
  const opacity = ctx.globalAlpha;
  for (let i = 0; i < count; i++) {
    const phase = clamp((t - (i % 5) * .038) / .84);
    if (!phase || phase === 1) continue;
    const seed = (i * 71 % 101) / 101;
    const a = angle === undefined ? i * 2.39996 : angle + (seed - .5) * 1.55;
    const radius = startRadius + spread * (.35 + seed * .65) * (1 - (1 - phase) ** 2);
    const lift = height * (seed * .5 + .65) * 4 * phase * (1 - phase);
    const px = x + Math.cos(a) * radius * zoom, py = y + (Math.sin(a) * radius * .56 - lift) * zoom;
    const size = Math.max(1, zoom * (.045 + seed * .09) * (1 - phase * .7));
    ctx.globalAlpha = opacity * (1 - phase);
    ctx.fillStyle = i % 3 ? color : '#fff1cc';
    ctx.fillRect(Math.round(px), Math.round(py), Math.ceil(size * (i % 3 ? 1 : 2)), Math.ceil(size));
  }
  ctx.globalAlpha = opacity;
}

function terrainFractures(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, t: number, tone: string) {
  ctx.save();
  ctx.globalAlpha *= .65 * (1 - t);
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = i * 2.39996;
    const reach = radius * (.45 + (i % 3) * .21) * clamp(t * 4 + .15);
    ctx.moveTo(x + Math.cos(a) * reach * .12, y + Math.sin(a) * reach * .07);
    for (let step = 1; step <= 4; step++) {
      const bend = a + (step % 2 ? .22 : -.12);
      ctx.lineTo(x + Math.cos(bend) * reach * step / 4, y + Math.sin(bend) * reach * step / 7);
    }
  }
  ctx.strokeStyle = '#35231e';
  ctx.lineWidth = Math.max(1, radius * .023);
  ctx.stroke();
  ctx.strokeStyle = tone;
  ctx.lineWidth *= .46;
  ctx.stroke();
  ctx.restore();
}

export function drawWarriorWorldFx(
  ctx: CanvasRenderingContext2D, images: Record<AtlasName, HTMLImageElement | undefined>, fx: FxInstance,
  x: number, y: number, zoom: number, t: number, layer: Layer,
): void {
  const art = fx.artwork;
  if (art === undefined) return;
  const sprite = stamp(ctx, images);
  const r = (fx.radius ?? 4) * zoom;
  const fire = art === 11, judgment = art === 10, avatar = art === 9;
  const color = fx.tone ?? (fire ? '#ff8335' : avatar ? '#ef6e37' : '#ffd183');
  const front = clamp(t / .75);
  ctx.save();
  ctx.globalAlpha *= fade(t);

  if (layer === 'ground') {
    if (fx.kind === 'warriorSigil') {
      ring(ctx, x, y, r * (.14 + t * (judgment ? .86 : .28)), color, zoom * .055, .7);
      ring(ctx, x, y, r * (.10 + t * (judgment ? .65 : .22)), '#fff0b1', zoom * .025, .5);
    } else if (fx.kind === 'warriorWave') {
      const radius = r * (.05 + front * .95);
      ring(ctx, x, y, radius, color, zoom * .12, .7, 1);
      if (fire) {
        sprite('ultimate', 9, x, y - radius * .07, radius * 2.18, radius * 1.94, 0, 1 - t * .35);
        sprite('ultimate', 10, x, y, radius * 2.26, radius * 1.94, 0, clamp(t * 2) * .5);
      } else if (art === 6) {
        sprite('world', 6, x, y, radius * 2, radius * 1.28, t * 2.6, .58);
      }
    } else if (fx.kind === 'warriorAftermath') {
      if (fire) sprite('ultimate', 11, x, y, r * 2, r * 1.23, 0, .8);
      else terrainFractures(ctx, x, y, r, t, color);
    } else if (fx.kind === 'line') {
      const a = Math.PI / 2 - (fx.yaw ?? 0) * Math.PI / 180;
      const length = (fx.lineLength ?? 4.5) * zoom * clamp(t / .8);
      sprite('world', 8, x + Math.cos(a) * length / 2, y + Math.sin(a) * length / 2,
        length, (fx.lineWidth ?? 3) * zoom * .78, a);
    }
  } else {
    switch (fx.kind) {
      case 'warriorTrail': {
        if (!finitePosition(fx.destination)) break;
        const dx = (fx.destination.x - fx.position.x) * zoom, dy = (fx.destination.z - fx.position.z) * zoom;
        const a = Math.atan2(dy, dx);
        const travel = clamp(t / .4);
        const px = x + dx * travel, py = y + dy * travel - zoom * 1.04;
        const size = zoom * (2.05 + travel * .84);
        if (art === 5) {
          // Shield bash: a short forward burst, without stamping a shield emblem over the mob.
          fragments(ctx, px, py, zoom, t, color, 14, 1.9, .42, a);
        } else if (art <= 2 || art === 4) {
          if (art === 1 || art === 4) {
            const behind = Math.max(0, travel - .24);
            sprite('world', art, x + dx * behind, y + dy * behind - zoom, size * 1.15, size * .68, a, .33);
          }
          sprite('world', art, px, py, size * 1.2, size * (.62 + t * .26), a + t * .22);
          fragments(ctx, px, py, zoom, t, color, 7, 1.35, .36, a + Math.PI);
        }
        break;
      }
      case 'warriorContact':
        sprite('impact', Math.min(3, Math.floor(t * 4)), x, y - zoom * .93, zoom * 4.9, zoom * 4.9);
        fragments(ctx, x, y - zoom * .78, zoom, t, color, art >= 9 ? 16 : 10, 2.1, .76);
        break;
      case 'warriorBlade': {
        const fall = (1 - clamp(t / .41)) ** 2 * 12 * zoom;
        sprite('ultimate', 5, x, y - 4.1 * zoom - fall, 7.5 * zoom, 9 * zoom, 0, 1 - clamp((t - .45) / .4));
        break;
      }
      case 'warriorWave':
        if (judgment) {
          const size = r * (1.28 + front * .7);
          sprite('ultimate', 6, x, y - size * .24, size, size * .68, 0, 1 - clamp(t - .25));
          fragments(ctx, x, y, zoom, t, color, 23, r / zoom, 2.1);
        } else {
          const radius = (r / zoom) * (.12 + front * .78);
          fragments(ctx, x, y, zoom, t, color, fire || avatar ? 24 : 15, 1.4, fire ? 1.4 : .8, undefined, radius);
          if (avatar) {
            for (let i = 0; i < 5; i++) {
              const a = i * TAU / 5 + t * .8;
              const d = radius * zoom * .72;
              sprite('world', 0, x + Math.cos(a) * d, y + Math.sin(a) * d * .7 - zoom * .6,
                zoom * (2.1 + t), zoom * .94, a, .78);
            }
          }
        }
        break;
      case 'warriorAftermath':
        fragments(ctx, x, y, zoom, t, color, 18, 1.2, fire ? 2.1 : 1.1, undefined, r / zoom * .6);
        break;
      case 'warriorAura':
        if (art === 7) {
          // Three moving arcs read as a barrier around the body, rather than a floating plate.
          for (let i = 0; i < 3; i++) {
            const a = i * TAU / 3 + t * 3;
            ctx.beginPath();
            ctx.ellipse(x, y - zoom * 1.03, zoom * (1.23 + t * .19), zoom * 1.62, 0, a, a + 1.29);
            ctx.strokeStyle = i === 0 ? '#fff1bc' : '#efb45c';
            ctx.lineWidth = Math.max(1, zoom * .085 * (1 - t));
            ctx.stroke();
          }
        }
        fragments(ctx, x, y - zoom * .6, zoom, t, color, 12, 1.55, 1.6);
        break;
      case 'heal':
        sprite('world', 3, x, y - zoom * (1.2 + t * .65), zoom * 2.8, zoom * 3.1, 0, .7);
        break;
      case 'line': {
        const a = Math.PI / 2 - (fx.yaw ?? 0) * Math.PI / 180;
        const length = (fx.lineLength ?? 4.5) * clamp(t / .8);
        fragments(ctx, x + Math.cos(a) * length * zoom, y + Math.sin(a) * length * zoom,
          zoom, t, color, 13, 1.8, 1.05, a);
        break;
      }
    }
  }
  ctx.restore();
}
