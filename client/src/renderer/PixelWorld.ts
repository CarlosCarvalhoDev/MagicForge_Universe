import type { InterpolatedEntity } from '../interpolation/SnapshotBuffer';
import { HeroAnimationClock } from './HeroAnimations';
import { PIXEL_PROPS, PIXEL_SHEETS, directionRow, facingFromYaw, pixelFamily } from './PixelAssets';
import { WorldPresentation } from './WorldPresentation';

type Prop = { x: number; z: number; kind: 'tree' | 'mossTree' | 'rock' | 'smallRock' | 'crystal'; scale: number };

/** Presentation only: consumes snapshots, never decides gameplay, loot or collision. */
export class PixelWorld {
  readonly presentation = new WorldPresentation();
  readonly clock = new HeroAnimationClock();
  private images = new Map<string, HTMLImageElement>();
  private props: Prop[] = [];
  readonly ready: Promise<void>;
  constructor() {
    const files = [...Object.values(PIXEL_SHEETS).flatMap(set => Object.values(set).map(spec => spec.file)), ...Object.values(PIXEL_PROPS)];
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
  draw(ctx: CanvasRenderingContext2D, entities: InterpolatedEntity[], camera: { x: number; y: number }, zoom: number, myId: string | null, selected: string | null, now: number): void {
    const width = ctx.canvas.width, height = ctx.canvas.height;
    const screen = (x: number, z: number) => [Math.round(width / 2 + (x - camera.x) * zoom), Math.round(height / 2 + (z - camera.y) * zoom)];
    ctx.save(); ctx.imageSmoothingEnabled = false;
    const frozen = this.presentation.appearance.theme === 'frost';
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
    this.clock.retain(new Set(entities.map(entity => entity.id)));
    const layers = [...this.props.map(prop => ({ z: prop.z, prop, entity: null as InterpolatedEntity | null })), ...entities.map(entity => ({ z: entity.position.z, prop: null as Prop | null, entity }))].sort((a, b) => a.z - b.z);
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
      const scale = Math.max(1, Math.round(3 * zoom / 16));
      ctx.fillStyle = '#15291d66'; ctx.fillRect(x - 8 * scale, y - scale, 16 * scale, 4 * scale); ctx.fillRect(x - 10 * scale, y, 20 * scale, 2 * scale);
      if (selected === entity.id || entity.id === myId) {
        ctx.strokeStyle = selected === entity.id ? '#f0bf6c' : '#b3e5c4'; ctx.lineWidth = 2;
        ctx.strokeRect(x - 12 * scale, y - 3 * scale, 24 * scale, 8 * scale);
      }
      if (family) {
        const playback = this.clock.sample(entity.id, entity.isMoving, entity.currentHp, PIXEL_SHEETS[family], now);
        const spec = PIXEL_SHEETS[family][playback.action], image = this.image(spec.file);
        if (image && image.naturalWidth === spec.cols * 64 && image.naturalHeight === 256) {
          const row = directionRow(family, facingFromYaw(entity.headingYaw));
          const anchorY = family === 'slime' ? 39 : 44;
          ctx.drawImage(image, playback.frame * 64, row * 64, 64, 64, x - 32 * scale, y - anchorY * scale, 64 * scale, 64 * scale);
        }
      } else {
        ctx.fillStyle = '#d8b577'; ctx.fillRect(x - 12, y - 40, 24, 32);
        ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff1ce'; ctx.fillText('ARTE PENDENTE', x, y - 52);
      }
      if (entity.currentHp > 0) {
        ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.lineWidth = 3; ctx.strokeStyle = '#14241e'; ctx.fillStyle = entity.id === myId ? '#fff1ca' : '#f0f2d8';
        const labelY = y - 29 * scale;
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
