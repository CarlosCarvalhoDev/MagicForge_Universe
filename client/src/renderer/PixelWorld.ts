import { WarehouseMap } from './WarehouseMap';
import type { WarehouseRoom } from '@magicforge/shared';
import type { InterpolatedEntity } from '../interpolation/SnapshotBuffer';
import { HeroAnimationClock, WARRIOR_CAST_SHEETS, WarriorCastClock, warriorCastArt, warriorDirectionRow } from './HeroAnimations';
import { PIXEL_PROPS, PIXEL_SHEETS, directionRow, facingFromYaw, pixelFamily } from './PixelAssets';
import { WorldPresentation } from './WorldPresentation';

type Prop = { x: number; z: number; kind: 'tree' | 'mossTree' | 'rock' | 'smallRock' | 'crystal'; scale: number };

// Baselines measured in source pixels. The warrior's walking rows have different padding.
const warriorWalkGround = [215, 211, 212, 205, 204, 197, 190, 213];
const groundByFamily = { orc: 42, slime: 40, barbarian: 45 };

/** Presentation only: consumes snapshots, never decides gameplay, loot or collision. */
export class PixelWorld {
  readonly warehouseMaps = {
    exterior: new WarehouseMap('exterior'),
    interior: new WarehouseMap('interior'),
    upper: new WarehouseMap('upper'),
  };
  warehouseRoom: WarehouseRoom | null = null;
  get inWarehouse(): boolean { return this.warehouseRoom !== null; }
  readonly presentation = new WorldPresentation();
  readonly clock = new HeroAnimationClock();
  readonly warriorCasts = new WarriorCastClock();
  readonly pendingHits = new Map<string, number>();
  private images = new Map<string, HTMLImageElement>();
  private props: Prop[] = [];
  readonly ready: Promise<void>;
  constructor() {
    const files = [...Object.values(PIXEL_SHEETS).flatMap(set => Object.values(set).map(spec => spec.file)), ...Object.values(PIXEL_PROPS), ...WARRIOR_CAST_SHEETS];
    this.ready = Promise.all(files.map(file => new Promise<void>((resolve, reject) => {
      const image = new Image(); this.images.set(file, image);
      image.onload = () => resolve(); image.onerror = () => reject(new Error(`Não foi possível carregar ${file}`)); image.src = file;
    }))).then(() => undefined);
    // Cosmetic props avoid the central walkways. No local collision is introduced.
    for (let z = -48; z <= 48; z += 8) for (let x = -48; x <= 48; x += 8) {
      if (Math.abs(x) < 6 || Math.abs(z) < 6) continue;
      const n = Math.abs(x / 8 * 17 + z / 8 * 31);
      if (n % 5 === 0) continue;
      this.props.push({ x: x + (n % 3), z: z + (n % 5), kind: n % 7 === 0 ? 'crystal' : n % 4 === 0 ? 'rock' : n % 3 === 0 ? 'mossTree' : 'tree', scale: 2 });
    }
    this.props.push({ x: -5, z: 6, kind: 'crystal', scale: 2 }, { x: 6, z: -5, kind: 'smallRock', scale: 3 });
  }
  private image(file: string): HTMLImageElement | undefined {
    const image = this.images.get(file); return image?.complete && image.naturalWidth > 0 ? image : undefined;
  }
  playWarriorCast(id: string, skillId: string, now: number): boolean {
    const art = warriorCastArt(skillId);
    const image = art && this.image(art.file);
    if (!image || image.naturalWidth % 4 !== 0 || image.naturalHeight % 3 !== 0) return false;
    return this.warriorCasts.trigger(id, skillId, now);
  }

  draw(ctx: CanvasRenderingContext2D, entities: InterpolatedEntity[], camera: { x: number; y: number }, zoom: number, myId: string | null, selected: string | null, now: number, drawGroundEffects?: () => void): void {
    const width = ctx.canvas.width, height = ctx.canvas.height;
    const screen = (x: number, z: number) => [Math.round(width / 2 + (x - camera.x) * zoom), Math.round(height / 2 + (z - camera.y) * zoom)];
    ctx.save(); ctx.imageSmoothingEnabled = false;
    const frozen = this.presentation.appearance.theme === 'frost';
    if (this.warehouseRoom) {
      this.warehouseMaps[this.warehouseRoom].draw(ctx, camera, zoom, now);
    } else {
      ctx.fillStyle = frozen ? '#344c67' : '#253c31'; ctx.fillRect(0, 0, width, height);
      const grass = this.image(PIXEL_PROPS.grass), road = this.image(PIXEL_PROPS.road);
      const tileWorld = 3, tileSize = tileWorld * zoom;
      const minX = Math.max(-20, Math.floor((camera.x - width / 2 / zoom) / tileWorld));
      const maxX = Math.min(19, Math.ceil((camera.x + width / 2 / zoom) / tileWorld));
      const minZ = Math.max(-20, Math.floor((camera.y - height / 2 / zoom) / tileWorld));
      const maxZ = Math.min(19, Math.ceil((camera.y + height / 2 / zoom) / tileWorld));
      for (let z = minZ; z <= maxZ; z++) for (let x = minX; x <= maxX; x++) {
        const [sx, sy] = screen(x * tileWorld, z * tileWorld);
        const n = Math.abs((x * 73856093) ^ (z * 19349663));
        if (frozen) { ctx.fillStyle = ['#d8e8eb', '#dcebef', '#d3e4e9'][n % 3]; ctx.fillRect(sx, sy, Math.ceil(tileSize), Math.ceil(tileSize)); }
        else if (grass) ctx.drawImage(grass, 48, 320, 16, 16, sx, sy, Math.ceil(tileSize), Math.ceil(tileSize));
        else { ctx.fillStyle = '#489461'; ctx.fillRect(sx, sy, Math.ceil(tileSize), Math.ceil(tileSize)); }
        const path = x === -1 || x === 0 || z === -1 || z === 0 || (Math.abs(x) <= 2 && Math.abs(z) <= 2);
        if (path && frozen) {
          ctx.fillStyle = n % 2 ? '#8fb7c9' : '#9bc2d1'; ctx.fillRect(sx, sy, Math.ceil(tileSize), Math.ceil(tileSize));
          const unit = tileSize / 16;
          if (n % 4 === 0) { ctx.fillStyle = '#bfdde5'; ctx.fillRect(sx + 2 * unit, sy + 3 * unit, 7 * unit, unit); ctx.fillRect(sx + 8 * unit, sy + 4 * unit, unit, 5 * unit); }
          if (n % 5 === 0) { ctx.fillStyle = '#7398ae'; ctx.fillRect(sx + 11 * unit, sy + 11 * unit, 4 * unit, unit); ctx.fillRect(sx + 10 * unit, sy + 12 * unit, unit, 3 * unit); }
        } else if (path && road) ctx.drawImage(road, 32, 32, 16, 16, sx, sy, Math.ceil(tileSize), Math.ceil(tileSize));
        if (!path) {
          ctx.fillStyle = frozen ? (n % 3 ? '#c0d8e2' : '#eff8f7') : n % 3 ? '#397c55' : '#63a16b';
          for (let t = 0; t < 3; t++) { const px = sx + (n * (t + 1) % 13) / 16 * tileSize, py = sy + (n * (t + 3) % 13) / 16 * tileSize; ctx.fillRect(Math.round(px), Math.round(py), 3, 3); }
        }
      }
      drawGroundEffects?.();
      const portal = this.presentation.portal;
      if (portal) {
        const [px, py] = screen(portal.x, portal.z), s = Math.max(1, Math.round(zoom / 8));
        ctx.fillStyle = '#526982'; ctx.fillRect(px - 22 * s, py - 4 * s, 44 * s, 8 * s);
        ctx.beginPath();
        [[-17,-3],[-17,-32],[-13,-32],[-13,-40],[-7,-40],[-7,-45],[7,-45],[7,-40],[13,-40],[13,-32],[17,-32],[17,-3]].forEach(([x,y],i)=>{ if(i) ctx.lineTo(px+x*s,py+y*s); else ctx.moveTo(px+x*s,py+y*s); });
        ctx.closePath(); ctx.fillStyle = '#6d4ba6'; ctx.fill(); ctx.strokeStyle = '#f1c968'; ctx.lineWidth = 3 * s; ctx.stroke();
        ctx.fillStyle = '#9675cf';
        for (let i = 0; i < 30; i++) {
          const a = i / 30 * Math.PI * 2 + now / 1300;
          ctx.fillRect(px + Math.round(Math.sin(a) * 9) * s, py - 23 * s + Math.round(Math.cos(a) * 15) * s, 2 * s, 2 * s);
        }
        ctx.fillStyle = '#fff0b0';
        for (let i = 0; i < 5; i++) { const offset = (Math.floor(now / 160) + i * 7) % 36; ctx.fillRect(px + (i % 2 ? 10 : -10) * s, py - offset * s - 8 * s, 2 * s, 2 * s); }
        ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff2c3'; ctx.strokeStyle = '#293648'; ctx.lineWidth = 3;
        ctx.strokeText('PORTAL RÚNICO', px, py - 50 * s); ctx.fillText('PORTAL RÚNICO', px, py - 50 * s);
      }
    }
    const visibleIds = new Set(entities.map(entity => entity.id));
    this.clock.retain(visibleIds);
    this.warriorCasts.retain(visibleIds);
    for (const [id, at] of this.pendingHits) {
      if (!visibleIds.has(id) || at <= now) {
        if (visibleIds.has(id) && now - at < 250) this.clock.trigger(id, 'hit', at);
        this.pendingHits.delete(id);
      }
    }
    const layers = [...(this.inWarehouse ? [] : this.props).map(prop => ({ z: prop.z, prop, entity: null as InterpolatedEntity | null })), ...entities.map(entity => ({ z: entity.position.z, prop: null as Prop | null, entity }))].sort((a, b) => a.z - b.z);
    for (const layer of layers) {
      if (layer.prop) {
        const p = layer.prop;
        const winterKinds = { tree: 'snowTree', mossTree: 'snowTreeSmall', rock: 'snowRock', smallRock: 'snowRockSmall', crystal: 'crystal' } as const;
        const image = this.image(PIXEL_PROPS[frozen ? winterKinds[p.kind] : p.kind]); if (!image) continue;
        const [x, y] = screen(p.x, p.z), scale = Math.max(1, Math.round(p.scale * zoom / 16));
        const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
        if (x < -w || x > width + w || y < -h || y > height + h) continue;
        ctx.drawImage(image, x - w / 2, y - h + 24 * scale, w, h); continue;
      }
      const entity = layer.entity!; const [x, y] = screen(entity.position.x, entity.position.z);
      if (x < -200 || x > width + 200 || y < -200 || y > height + 200) continue;
      const family = pixelFamily(entity.type, entity.classType, entity.name);
      const scale = Math.max(0.75, 3 * zoom / 16) * (this.inWarehouse ? .7 : 1);
      const shadowWidth = family === 'hero' ? 9 : 8;
      ctx.beginPath();
      ctx.ellipse(x, y, shadowWidth * scale, 2.6 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#14241f80';
      ctx.fill();
      if (selected === entity.id || entity.id === myId) {
        ctx.strokeStyle = selected === entity.id ? '#f0bf6c' : '#b3e5c4'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, (shadowWidth + 2) * scale, 3.8 * scale, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (entity.id.startsWith('dev_dummy_')) {
        ctx.fillStyle = '#513522';
        ctx.fillRect(x - 2 * scale, y - 24 * scale, 4 * scale, 25 * scale);
        ctx.fillRect(x - 11 * scale, y - 18 * scale, 22 * scale, 3 * scale);
        ctx.fillStyle = '#ddae52';
        ctx.fillRect(x - 7 * scale, y - 24 * scale, 14 * scale, 13 * scale);
        ctx.fillRect(x - 5 * scale, y - 33 * scale, 10 * scale, 9 * scale);
        ctx.fillStyle = '#a7773a';
        ctx.fillRect(x - 8 * scale, y - 15 * scale, 16 * scale, 2 * scale);
      } else if (family) {
        const playback = this.clock.sample(entity.id, entity.isMoving, entity.currentHp, PIXEL_SHEETS[family], now);
        const spec = PIXEL_SHEETS[family][playback.action], image = this.image(spec.file);
        const cast = family === 'hero' && playback.action !== 'death' ? this.warriorCasts.sample(entity.id, now) : undefined;
        const castImage = cast ? this.image(cast.file) : undefined;
        if (cast && castImage) {
          const w = castImage.naturalWidth / 4, h = castImage.naturalHeight / 3;
          const size = Math.round(55 * scale);
          ctx.drawImage(castImage, cast.frame * w, cast.row * h, w, h, Math.round(x - size / 2), Math.round(y - cast.ground * size), size, size);
        } else if (image && image.naturalWidth % spec.cols === 0 && image.naturalHeight % spec.rows === 0) {
          const cellWidth = image.naturalWidth / spec.cols;
          const cellHeight = image.naturalHeight / spec.rows;
          const row = spec.directional ? warriorDirectionRow(entity.headingYaw) : directionRow(family, facingFromYaw(entity.headingYaw));
          const size = Math.round((family === 'hero' ? 40 : 64) * scale);
          const ground = family === 'hero'
            ? playback.action === 'walk' ? warriorWalkGround[row] : 208
            : groundByFamily[family];
          const recoil = playback.action === 'hit' && entity.type === 'MONSTER' ? Math.max(0, 1 - playback.frame / 3) : 0;
          const spriteHeight = size * (1 - recoil * .08);
          const spriteWidth = size * (1 + recoil * .06);
          const heading = entity.headingYaw * Math.PI / 180;
          const offset = recoil * 3 * scale;
          if (recoil > .6) ctx.filter = 'brightness(1.45) saturate(.8)';
          ctx.drawImage(image, playback.frame * cellWidth, row * cellHeight, cellWidth, cellHeight,
            Math.round(x - spriteWidth / 2 - Math.sin(heading) * offset),
            Math.round(y - ground / cellHeight * spriteHeight - Math.cos(heading) * offset), spriteWidth, spriteHeight);
          if (recoil > .6) ctx.filter = 'none';
        }
      } else {
        ctx.fillStyle = '#d8b577'; ctx.fillRect(x - 12, y - 40, 24, 32);
        ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff1ce'; ctx.fillText('ARTE PENDENTE', x, y - 52);
      }
      if (entity.currentHp > 0) {
        ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.lineWidth = 3; ctx.strokeStyle = '#14241e'; ctx.fillStyle = entity.id === myId ? '#fff1ca' : '#f0f2d8';
        const labelY = Math.round(y - (family === 'hero' ? 40 : family === 'slime' ? 27 : 32) * scale - 6);
        ctx.strokeText(entity.name, x, labelY); ctx.fillText(entity.name, x, labelY);
        ctx.fillStyle = '#172b24'; ctx.fillRect(x - 25, labelY + 5, 50, 5);
        ctx.fillStyle = entity.type === 'MONSTER' ? '#d57967' : '#9ac778'; ctx.fillRect(x - 24, labelY + 6, 48 * Math.max(0, Math.min(1, entity.currentHp / entity.maxHp)), 3);
      }
    }
    if (this.presentation.appearance.placeholder) {
      ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#fff2c3'; ctx.textAlign = 'center';
      ctx.fillText('BIOMA EM PREPARAÇÃO', width / 2, height - 20);
    }
    ctx.restore();
  }
}
