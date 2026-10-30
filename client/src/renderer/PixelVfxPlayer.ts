import { FX_SHEETS, PixelVfxQueue } from './PixelVfx';
import type { FxEntity } from './PixelVfx';
import type { CombatStatusStatePayload } from '@magicforge/shared';

/** Native sheets + code-authored pixel primitives. Never edits vendor pixels. */
export class PixelVfxPlayer {
  readonly queue = new PixelVfxQueue();
  readonly ready: Promise<void>;
  private images = new Map<string, HTMLImageElement>();
  constructor() {
    this.ready = Promise.all(Object.values(FX_SHEETS).map(spec => new Promise<void>((resolve, reject) => {
      const image = new Image(); this.images.set(spec.file, image);
      image.onload = () => image.naturalWidth === spec.cell * spec.frames && image.naturalHeight === spec.cell ? resolve() : reject(new Error(`Grade VFX inválida: ${spec.file}`));
      image.onerror = () => reject(new Error(`Falha no VFX: ${spec.file}`)); image.src = spec.file;
    }))).then(() => undefined);
  }
  draw(ctx: CanvasRenderingContext2D, entities: readonly FxEntity[], camera: { x: number; y: number }, zoom: number, now: number): number {
    const effects = this.queue.sample(now, entities);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    const scale = Math.max(1, Math.round(zoom / 8));
    for (const fx of effects) {
      const x = Math.round(ctx.canvas.width / 2 + (fx.position.x - camera.x) * zoom), y = Math.round(ctx.canvas.height / 2 + (fx.position.z - camera.y) * zoom);
      if (x < -300 || y < -300 || x > ctx.canvas.width + 300 || y > ctx.canvas.height + 300) continue;
      const progress = Math.min(1, (now - fx.startedAt) / fx.duration);
      ctx.globalAlpha = Math.min(1, (1 - progress) * 3);
      const dot = (dx: number, dy: number, size = 2) => ctx.fillRect(x + Math.round(dx) * scale, y + Math.round(dy) * scale, size * scale, size * scale);
      const ring = (radius: number, color: string, squash = .5, start = 0, end = Math.PI * 2) => {
        ctx.fillStyle = color;
        for (let angle = start; angle <= end; angle += .09) dot(Math.cos(angle) * radius, Math.sin(angle) * radius * squash - 10, 2);
      };
      if (fx.kind === 'heal' || fx.kind === 'impact') {
        const spec = FX_SHEETS[fx.kind], image = this.images.get(spec.file);
        if (image?.complete && image.naturalWidth) {
          const frame = Math.min(spec.frames - 1, Math.floor((now - fx.startedAt) * spec.fps / 1000));
          ctx.drawImage(image, frame * spec.cell, 0, spec.cell, spec.cell, x - 36 * scale, y - 66 * scale, spec.cell * scale, spec.cell * scale);
        }
        if (fx.kind === 'heal') {
          ring(12 + progress * 6, '#a2f4a0'); ctx.fillStyle = '#e1ffb6';
          for (let i = 0; i < 6; i++) dot(Math.sin(i * 2.4) * 12, -12 - progress * 30 - (i % 3) * 7);
        }
      } else if (fx.kind === 'slash') {
        // V2 candidate: a filled, tapered blade sweep instead of a dotted ring.
        const angle = ((fx.yaw ?? 0) - 90) * Math.PI / 180 + progress * 1.4;
        const points: number[][] = [];
        for (let i = 0; i <= 18; i++) { const a = angle - 1.5 + i / 18 * 1.7; points.push([Math.cos(a) * 21, Math.sin(a) * 16 - 17]); }
        for (let i = 18; i >= 0; i--) { const a = angle - 1.5 + i / 18 * 1.7; const taper = Math.sin(i / 18 * Math.PI) * 5; points.push([Math.cos(a) * (21 - taper), Math.sin(a) * (16 - taper) - 17]); }
        ctx.beginPath(); points.forEach(([dx, dy], i) => { const px = x + Math.round(dx) * scale, py = y + Math.round(dy) * scale; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
        const colors = { bleed: ['#ffd3c6', '#c45a57'], rupture: ['#e5d6ff', '#a28bc7'], haste: ['#fff2cb', '#dbad63'], stun: ['#fff7c2', '#d8be65'] };
        const palette = fx.variant ? colors[fx.variant] : ['#edfaff', '#8ac8d3'];
        ctx.closePath(); ctx.fillStyle = palette[0]; ctx.fill(); ctx.strokeStyle = palette[1]; ctx.lineWidth = scale; ctx.stroke();
        ctx.fillStyle = palette[1];
        if (fx.variant === 'bleed') for (let i = 0; i < 3; i++) dot((i - 1) * 5, -15 + progress * 13 + i * 2, 2);
        if (fx.variant === 'rupture') for (let i = 0; i < 3; i++) dot((i - 1) * (4 + progress * 7), -20 - (i % 2) * 5 + progress * 9, 3);
        if (fx.variant === 'haste') for (let i = 0; i < 3; i++) { dot(-16 - progress * 6, -25 + i * 6, 2); dot(-12 - progress * 6, -25 + i * 6, 2); }
        if (fx.variant === 'stun') { ctx.strokeStyle = '#ffe398'; ctx.strokeRect(x - 8 * scale, y - 29 * scale, 16 * scale, 17 * scale); }
      } else if (fx.kind === 'judgment') {
        // Falling blade at the confirmed target center; no gameplay hitbox is inferred.
        const drop = Math.round((1 - Math.min(1, progress / .42)) * 70);
        ctx.fillStyle = '#fff5cc';
        ctx.fillRect(x - 2 * scale, y - (50 + drop) * scale, 4 * scale, 32 * scale);
        ctx.fillStyle = '#e8b65e';
        ctx.fillRect(x - 9 * scale, y - (49 + drop) * scale, 18 * scale, 3 * scale);
        if (progress > .35) ring(8 + (progress - .35) * 38, '#ffe3a1');
      } else if (fx.kind === 'line') {
        const length = Math.min(15, Math.max(1, fx.lineLength ?? 4.5)) * zoom / scale;
        const width = Math.min(6, Math.max(.5, fx.lineWidth ?? 3)) * zoom / scale;
        const angle = (fx.yaw ?? 0) * Math.PI / 180;
        for (let i = 0; i < 20 * progress; i++) {
          const along = i / 20 * length;
          for (const side of [-.5, 0, .5]) { ctx.fillStyle = side === 0 ? '#f4dca5' : '#b49976'; dot(Math.sin(angle) * along + Math.cos(angle) * side * width, Math.cos(angle) * along - Math.sin(angle) * side * width, 3); }
        }
      } else if (fx.kind === 'whirlwind' || fx.kind === 'avatar') {
        const radius = Math.min(60, Math.max(18, (fx.radius ?? 4) * zoom / scale)) * (.25 + progress * .75);
        ring(radius, fx.kind === 'avatar' ? '#f2c96b' : '#d7f3ef');
        ring(Math.max(4, radius - 5), fx.kind === 'avatar' ? '#fff0a6' : '#8fc9da', .5, progress * 8, progress * 8 + 3.8);
        if (fx.kind === 'avatar') { ctx.fillStyle = '#ffe2a3'; for (let i = 0; i < 12; i++) dot(Math.cos(i * Math.PI / 6) * radius, Math.sin(i * Math.PI / 6) * radius * .5 - progress * 20 - 10, 3); }
      } else if (fx.kind === 'shield') {
        ring(17, '#83daf0', 1.25); ring(14, '#d0faff', 1.25, -2.5, -.4);
      } else if (fx.kind === 'levelUp') {
        ring(12 + progress * 22, '#f9df9b'); ctx.fillStyle = '#fff1b6';
        for (let i = 0; i < 10; i++) dot(Math.sin(i * 1.9) * (10 + progress * 10), -progress * 55 - (i % 4) * 5, 2);
      }
    }
    ctx.restore(); return effects.length;
  }
  drawStatuses(ctx: CanvasRenderingContext2D, statuses: CombatStatusStatePayload[], entities: readonly FxEntity[], camera: { x: number; y: number }, zoom: number, now: number): void {
    const names = { BLEED: 'SANGRANDO', ARMOR_BREAK: 'DEFESA ↓', ATTACK_SPEED_BUFF: 'VELOCIDADE ↑', STUN: 'ATORDOADO', SHIELD: 'ESCUDO', DAMAGE_BUFF: 'PODER ↑', DEATH_IMMUNITY: 'PROTEÇÃO À MORTE' };
    const grouped = new Map<string, CombatStatusStatePayload[]>();
    for (const status of statuses) grouped.set(status.targetEntityId, [...(grouped.get(status.targetEntityId) ?? []), status]);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    for (const [id, active] of grouped) {
      const entity = entities.find(e => e.id === id); if (!entity) continue;
      const x = Math.round(ctx.canvas.width / 2 + (entity.position.x - camera.x) * zoom), y = Math.round(ctx.canvas.height / 2 + (entity.position.z - camera.y) * zoom);
      if (x < -200 || y < -200 || x > ctx.canvas.width + 200 || y > ctx.canvas.height + 200) continue;
      active.forEach((status, index) => {
        const color = ['BLEED', 'ARMOR_BREAK', 'STUN'].includes(status.type) ? '#f3a18d' : '#ade4ee';
        ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#15291ee8';
        const absorption = status.type === 'SHIELD' && Number.isFinite(status.remainingAbsorption) ? Math.max(0, Math.ceil(status.remainingAbsorption!)) : undefined;
        const label = names[status.type] + (absorption !== undefined ? ` ${absorption}` : '');
        const w = ctx.measureText(label).width + 10; ctx.fillRect(x - w / 2, y - 120 - index * 15, w, 13); ctx.fillStyle = color; ctx.fillText(label, x, y - 110 - index * 15);
        if (status.type === 'SHIELD' || status.type === 'DEATH_IMMUNITY') {
          ctx.strokeStyle = status.type === 'SHIELD' ? '#83daf0' : '#f5cf85'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(x, y - 30, 34, 49, 0, 0, Math.PI * 2); ctx.stroke();
        } else if (status.type === 'STUN') {
          ctx.fillStyle = '#ffe392'; for (let i = 0; i < 3; i++) { const a = now / 240 + i * Math.PI * 2 / 3; ctx.fillRect(x + Math.round(Math.cos(a) * 20), y - 78 + Math.round(Math.sin(a) * 5), 4, 4); }
        }
      });
    }
    ctx.restore();
  }
}
