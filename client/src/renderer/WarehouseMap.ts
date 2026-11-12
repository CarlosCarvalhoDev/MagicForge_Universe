import { WAREHOUSE_PASSAGES, WAREHOUSE_ROOMS, WAREHOUSE_TILE_SIZE, type WarehouseRoom } from '@magicforge/shared';

const ROOT = '/assets/pixel/craftpix/warehouse/';
type Tile = [x: number, y: number, gid: number];
type Tileset = { first: number; columns: number; image: string; animations: Record<number, [number, number][]> };
type MapData = { tileSize: number; tilesets: Tileset[]; layers: { name: string; tiles: Tile[] }[] };
function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  return image.decode().then(() => image);
}

export class WarehouseMap {
  constructor(private readonly room: WarehouseRoom) {}

  private loading?: Promise<void>;
  private layers: ({ canvas: HTMLCanvasElement } | { tiles: Tile[] })[] = [];
  private composite?: HTMLCanvasElement;
  private compositeFrame = -1;
  private data?: MapData;
  private images = new Map<Tileset, HTMLImageElement>();
  private bounds = { left: 0, top: 0, width: 0, height: 0 };

  load(): Promise<void> {
    return this.loading ??= this.loadMap().catch(error => {
      this.loading = undefined;
      throw error;
    });
  }

  private async loadMap(): Promise<void> {
    const response = await fetch(ROOT + this.room + '.json');
    if (!response.ok) throw new Error('Mapa do armazém indisponível.');
    const data: MapData = await response.json();
    await Promise.all(data.tilesets.map(async set => this.images.set(set, await loadImage(ROOT + set.image))));
    this.data = data;
    const tiles = data.layers.flatMap(layer => layer.tiles);
    const left = Math.min(...tiles.map(tile => tile[0]));
    const top = Math.min(...tiles.map(tile => tile[1]));
    const width = Math.max(...tiles.map(tile => tile[0])) - left + 1;
    const height = Math.max(...tiles.map(tile => tile[1])) - top + 1;
    this.bounds = { left, top, width, height };
    this.layers = data.layers.map(layer => {
      if (layer.tiles.some(tile => this.animation(tile[2]))) return { tiles: layer.tiles };
      const canvas = document.createElement('canvas');
      canvas.width = width * data.tileSize;
      canvas.height = height * data.tileSize;
      const ctx = canvas.getContext('2d')!;
      for (const [x, y, gid] of layer.tiles) this.drawTile(ctx, gid, (x - left) * data.tileSize, (y - top) * data.tileSize, data.tileSize, 0);
      return { canvas };
    });
    this.composite = document.createElement('canvas');
    this.composite.width = width * data.tileSize;
    this.composite.height = height * data.tileSize;
  }

  private composeMap(now: number): HTMLCanvasElement | undefined {
    const canvas = this.composite;
    if (!canvas) return;
    // Draw at native tile resolution, then scale the whole map in one operation.
    const frame = Math.floor(now / 50);
    if (frame === this.compositeFrame) return canvas;
    this.compositeFrame = frame;
    const ctx = canvas.getContext('2d')!;
    const { left, top } = this.bounds;
    const tileSize = this.data!.tileSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const layer of this.layers) {
      if ('canvas' in layer) ctx.drawImage(layer.canvas, 0, 0);
      else for (const [x, y, gid] of layer.tiles) this.drawTile(ctx, gid, (x - left) * tileSize, (y - top) * tileSize, tileSize, now);
    }
    return canvas;
  }

  private tileset(gid: number): Tileset {
    const sets = this.data!.tilesets;
    for (let i = sets.length - 1; i >= 0; i--) {
      if (sets[i].first <= gid) return sets[i];
    }
    throw new Error(`Tile inválido no armazém: ${gid}`);
  }

  private animation(rawGid: number) {
    const gid = rawGid & 0x1fffffff;
    const set = this.tileset(gid);
    return set.animations[gid - set.first];
  }

  private drawTile(ctx: CanvasRenderingContext2D, rawGid: number, x: number, y: number, size: number, now: number): void {
    const gid = rawGid & 0x1fffffff;
    const set = this.tileset(gid);
    let index = gid - set.first;
    const frames = set.animations[index];
    if (frames?.length) {
      let elapsed = now % frames.reduce((sum, frame) => sum + frame[1], 0);
      for (const [frame, duration] of frames) {
        if (elapsed < duration) { index = frame; break; }
        elapsed -= duration;
      }
    }
    const image = this.images.get(set)!;
    const tileSize = this.data!.tileSize;
    const sourceX = index % set.columns * tileSize;
    const sourceY = Math.floor(index / set.columns) * tileSize;
    if (rawGid > 0x1fffffff) {
      ctx.save();
      ctx.translate(x + size / 2, y + size / 2);
      ctx.scale(rawGid & 0x80000000 ? -1 : 1, rawGid & 0x40000000 ? -1 : 1);
      if (rawGid & 0x20000000) ctx.transform(0, 1, 1, 0, 0, 0);
      ctx.drawImage(image, sourceX, sourceY, tileSize, tileSize, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else {
      ctx.drawImage(image, sourceX, sourceY, tileSize, tileSize, x, y, size, size);
    }
  }

  draw(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }, zoom: number, now: number): void {
    ctx.fillStyle = WAREHOUSE_ROOMS[this.room].background;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const { left, top, width, height } = this.bounds;
    const size = WAREHOUSE_TILE_SIZE * zoom;
    const screenX = Math.round(ctx.canvas.width / 2 + ((left - .5) * WAREHOUSE_TILE_SIZE - camera.x) * zoom);
    const screenY = Math.round(ctx.canvas.height / 2 + ((top - .5) * WAREHOUSE_TILE_SIZE - camera.y) * zoom);
    const map = this.composeMap(now);
    if (map) ctx.drawImage(map, screenX, screenY, width * size, height * size);
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const { tile: [col, row], label } of WAREHOUSE_PASSAGES[this.room]) {
      const x = screenX + (col - left + .5) * size;
      const y = screenY + (row - top + .5) * size;
      const width = ctx.measureText(label).width + 12;
      ctx.fillStyle = '#21191a';
      ctx.fillRect(x - width / 2, y - 9, width, 18);
      ctx.strokeStyle = '#b68e56';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - width / 2, y - 9, width, 18);
      ctx.fillStyle = '#f6dbac';
      ctx.fillText(label, x, y);
    }
  }
}
