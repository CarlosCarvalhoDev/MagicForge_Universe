import { ItemRarity, RARITY_COLORS, S2CItemDropSpawnPayload, Vector3, distance } from '@magicforge/shared';
import { InterpolatedEntity } from '../interpolation/SnapshotBuffer';

export interface FloatingText {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  opacity: number;
  createdAt: number;
}

export interface ActiveItemDrop {
  dropId: string;
  itemId: string;
  name: string;
  rarity: ItemRarity;
  quantity: number;
  position: Vector3;
  despawnTimeSec: number;
  spawnTimestamp: number;
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private floatingTexts: FloatingText[] = [];
  public activeDrops = new Map<string, ActiveItemDrop>();

  // World to screen mapping
  public zoom: number = 8.5; // pixels per world unit
  public cameraOffset = { x: 0, y: 0 };
  public showRawGhost: boolean = true;
  public selectedTargetId: string | null = null;

  // Sprite animation assets & Chroma-Key cache
  private guerreiroSheets: Record<string, { img: HTMLImageElement; cols: number; rows: number; frames: number; fps: number }> = {};
  private heroIsoSprites: Record<string, HTMLImageElement> = {};
  private monsterIsoSprites: Record<string, HTMLImageElement> = {};
  private arenaStoneTile: HTMLImageElement | null = null;
  private fantasyGrassTile: HTMLImageElement | null = null;
  private cleanedImageCache = new Map<string, HTMLCanvasElement>();
  private entityAnimOverrides = new Map<string, { action: 'attack' | 'hit' | 'death'; startTime: number; durationMs: number }>();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.loadGuerreiroSpriteSheets();
    this.loadIsometricSprites();
    this.loadFloorTiles();
  }

  private loadFloorTiles(): void {
    const stone = new Image();
    stone.src = '/assets/isometric/tile_arena_stone.jpg';
    this.arenaStoneTile = stone;

    const grass = new Image();
    grass.src = '/assets/isometric/tile_fantasy_grass.jpg';
    this.fantasyGrassTile = grass;
  }

  private loadGuerreiroSpriteSheets(): void {
    const basePath = '/assets/isometric/animations/heroes/guerreiro';
    const specs: Record<string, { file: string; cols: number; rows: number; frames: number; fps: number }> = {
      idle: { file: `${basePath}/iso_hero_guerreiro_idle_sheet.png`, cols: 2, rows: 2, frames: 4, fps: 5 },
      walk: { file: `${basePath}/iso_hero_guerreiro_walk_sheet.png`, cols: 3, rows: 2, frames: 6, fps: 9 },
      attack: { file: `${basePath}/iso_hero_guerreiro_attack_sheet.png`, cols: 3, rows: 2, frames: 6, fps: 11 },
      hit: { file: `${basePath}/iso_hero_guerreiro_hit_sheet.png`, cols: 2, rows: 1, frames: 2, fps: 10 },
      death: { file: `${basePath}/iso_hero_guerreiro_death_sheet.png`, cols: 2, rows: 2, frames: 4, fps: 7 },
    };

    for (const [key, spec] of Object.entries(specs)) {
      const img = new Image();
      img.src = spec.file;
      this.guerreiroSheets[key] = { img, cols: spec.cols, rows: spec.rows, frames: spec.frames, fps: spec.fps };
    }
  }

  private loadIsometricSprites(): void {
    const classMap: Record<string, string> = {
      GUERREIRO: '/assets/isometric/iso_hero_guerreiro.jpg',
      CLERIGO: '/assets/isometric/iso_hero_clerigo.jpg',
      BARBARO: '/assets/isometric/iso_hero_barbaro.jpg',
      MONGE: '/assets/isometric/iso_hero_monge.jpg',
      BRUXO: '/assets/isometric/iso_hero_bruxo.jpg',
      MAGO: '/assets/isometric/iso_hero_mago.jpg',
      ARQUEIRO: '/assets/isometric/iso_hero_arqueiro.jpg',
    };

    for (const [key, src] of Object.entries(classMap)) {
      const img = new Image();
      img.src = src;
      this.heroIsoSprites[key] = img;
    }

    const mobMap: Record<string, string> = {
      'Goblin Lanceiro': '/assets/isometric/iso_mob_goblin_lanceiro.jpg',
      'Goblin Arqueiro': '/assets/isometric/iso_mob_goblin_arqueiro.jpg',
      'Slime da Floresta': '/assets/isometric/iso_mob_slime_floresta.jpg',
      'Lobo Selvagem': '/assets/isometric/iso_mob_lobo_selvagem.jpg',
      'Chefe Goblin': '/assets/isometric/iso_boss_chefe_goblin.jpg',
      Malakor: '/assets/isometric/iso_boss_malakor.jpg',
    };

    for (const [key, src] of Object.entries(mobMap)) {
      const img = new Image();
      img.src = src;
      this.monsterIsoSprites[key] = img;
    }
  }

  /**
   * Removes pure black background (#000000) once per loaded image/sheet and caches the transparent canvas
   */
  private getTransparentCanvas(img: HTMLImageElement): HTMLCanvasElement | null {
    if (!img || !img.complete || img.naturalWidth === 0) return null;
    const cached = this.cleanedImageCache.get(img.src);
    if (cached) return cached;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = img.naturalWidth;
    offCanvas.height = img.naturalHeight;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return null;

    offCtx.drawImage(img, 0, 0);
    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const maxChannel = Math.max(r, g, b);
      if (maxChannel < 16) {
        d[i + 3] = 0; // Transparent pure black
      } else if (maxChannel < 32) {
        d[i + 3] = Math.floor(((maxChannel - 16) / 16) * 255); // Soft anti-aliased edge
      }
    }

    offCtx.putImageData(imgData, 0, 0);
    this.cleanedImageCache.set(img.src, offCanvas);
    return offCanvas;
  }

  public triggerEntityAnimation(entityId: string, action: 'attack' | 'hit' | 'death'): void {
    const durationMs = action === 'attack' ? 545 : action === 'hit' ? 240 : 1200;
    this.entityAnimOverrides.set(entityId, {
      action,
      startTime: performance.now(),
      durationMs,
    });
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public addDamageText(worldPos: Vector3, damage: number, isCritical: boolean, isDodged: boolean): void {
    let text = `-${damage}`;
    let color = '#ff4d4f'; // red

    if (isDodged) {
      text = 'ESQUIVA!';
      color = '#e6f7ff';
    } else if (isCritical) {
      text = `CRÍTICO! -${damage}`;
      color = '#faad14'; // gold
    }

    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      color,
      x: worldPos.x + (Math.random() - 0.5) * 1.5,
      y: worldPos.z - 1.2,
      opacity: 1.0,
      createdAt: performance.now(),
    });
  }

  public addSkillEffectText(worldPos: Vector3, skillName: string, amount: number, isHeal: boolean, isCritical: boolean): void {
    let text = isHeal ? `+${amount} (${skillName})` : `-${amount} [${skillName}]`;
    let color = isHeal ? '#4ade80' : isCritical ? '#fbbf24' : '#c084fc';

    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      color,
      x: worldPos.x + (Math.random() - 0.5) * 1.8,
      y: worldPos.z - 1.8,
      opacity: 1.0,
      createdAt: performance.now(),
    });
  }

  public addExperienceText(worldPos: Vector3, expAmount: number): void {
    this.floatingTexts.push({
      id: Math.random().toString(),
      text: `+${expAmount} XP`,
      color: '#c084fc', // Vibrant Amethyst / Purple
      x: worldPos.x + (Math.random() - 0.5) * 1.2,
      y: worldPos.z - 2.2,
      opacity: 1.0,
      createdAt: performance.now(),
    });
  }

  public addLevelUpEffect(worldPos: Vector3, newLevel: number): void {
    this.floatingTexts.push({
      id: Math.random().toString(),
      text: `✦ LEVEL UP! [Nv. ${newLevel}] ✦`,
      color: '#fbbf24', // Radiant Gold
      x: worldPos.x,
      y: worldPos.z - 3.2,
      opacity: 1.0,
      createdAt: performance.now(),
    });
  }

  public render(entities: InterpolatedEntity[], myPlayerId: string | null): void {
    const { ctx, canvas } = this;
    const width = canvas.width;
    const height = canvas.height;
    const now = performance.now();

    // Center camera on my player if available
    const myPlayer = entities.find((e) => e.id === myPlayerId);
    if (myPlayer) {
      this.cameraOffset.x = myPlayer.position.x;
      this.cameraOffset.y = myPlayer.position.z;
    }

    const screenCenterX = width / 2;
    const screenCenterY = height / 2;

    // 1. Clear background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Seamless Floor Tilesets (tile_fantasy_grass & tile_arena_stone), Grid & Boundaries
    this.drawArenaGrid(screenCenterX, screenCenterY);

    // 3. Draw Entities (Monsters first, then Players on top)
    const sortedEntities = [...entities].sort((a, b) => {
      if (a.type === 'MONSTER' && b.type !== 'MONSTER') return -1;
      if (a.type !== 'MONSTER' && b.type === 'MONSTER') return 1;
      return a.position.z - b.position.z; // Y-sorting (depth)
    });

    for (const ent of sortedEntities) {
      const isMe = ent.id === myPlayerId;
      const isSelected = ent.id === this.selectedTargetId;
      const isMonster = ent.type === 'MONSTER';

      const screenX = screenCenterX + (ent.position.x - this.cameraOffset.x) * this.zoom;
      const screenY = screenCenterY + (ent.position.z - this.cameraOffset.y) * this.zoom;

      // Draw Raw 20Hz Ghost (to visualize interpolation difference)
      if (this.showRawGhost && ent.isMoving) {
        const rawScreenX = screenCenterX + (ent.rawPosition.x - this.cameraOffset.x) * this.zoom;
        const rawScreenY = screenCenterY + (ent.rawPosition.z - this.cameraOffset.y) * this.zoom;

        ctx.beginPath();
        ctx.arc(rawScreenX, rawScreenY, 14, 0, Math.PI * 2);
        ctx.fillStyle = isMe ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)';
        ctx.strokeStyle = isMe ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.fill();
        ctx.setLineDash([]);
      }

      // Draw Drop Shadow
      ctx.beginPath();
      ctx.ellipse(screenX, screenY + 14, isMonster ? (ent.maxHp > 200 ? 22 : 16) : 18, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fill();

      // Draw Target Reticle
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, 28, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const facingLeft = ent.headingYaw > 180 && ent.headingYaw < 360;

      if (!isMonster) {
        // --- RENDER HERO SPRITE (Guerreiro Sprite Sheets or Isometric Class Sprite) ---
        const heroClass = ent.classType || 'GUERREIRO';
        let drewSheet = false;

        if (heroClass === 'GUERREIRO') {
          let actionKey: 'idle' | 'walk' | 'attack' | 'hit' | 'death' = ent.isMoving ? 'walk' : 'idle';
          let override = this.entityAnimOverrides.get(ent.id);

          if (ent.currentHp <= 0) {
            actionKey = 'death';
          } else if (override) {
            if (now - override.startTime < override.durationMs) {
              actionKey = override.action;
            } else {
              this.entityAnimOverrides.delete(ent.id);
            }
          }

          const sheetSpec = this.guerreiroSheets[actionKey];
          const cleanSheet = sheetSpec ? this.getTransparentCanvas(sheetSpec.img) : null;

          if (sheetSpec && cleanSheet) {
            const cellW = Math.floor(cleanSheet.width / sheetSpec.cols);
            const cellH = Math.floor(cleanSheet.height / sheetSpec.rows);
            let frameIndex = 0;

            if (actionKey === 'idle' || actionKey === 'walk') {
              frameIndex = Math.floor((now / 1000) * sheetSpec.fps) % sheetSpec.frames;
            } else if (override) {
              const elapsed = Math.max(0, now - override.startTime);
              const progress = Math.min(0.999, elapsed / override.durationMs);
              frameIndex = Math.floor(progress * sheetSpec.frames);
            } else if (actionKey === 'death') {
              frameIndex = sheetSpec.frames - 1;
            }

            const col = frameIndex % sheetSpec.cols;
            const row = Math.floor(frameIndex / sheetSpec.cols);
            const sx = col * cellW;
            const sy = row * cellH;

            const drawSize = 68;
            ctx.save();
            ctx.translate(screenX, screenY);
            if (facingLeft) {
              ctx.scale(-1, 1);
            }
            ctx.drawImage(cleanSheet, sx, sy, cellW, cellH, -drawSize / 2, -drawSize + 18, drawSize, drawSize);
            ctx.restore();
            drewSheet = true;
          }
        }

        if (!drewSheet) {
          // Render static isometric sprite for the other 6 classes (with chroma-key transparency & walking bob)
          const isoImg = this.heroIsoSprites[heroClass] || this.heroIsoSprites['GUERREIRO'];
          const cleanHero = isoImg ? this.getTransparentCanvas(isoImg) : null;

          if (cleanHero) {
            const drawSize = 64;
            const bobY = ent.isMoving ? Math.abs(Math.sin(now * 0.012)) * -5 : Math.sin(now * 0.004) * -1.5;
            ctx.save();
            ctx.translate(screenX, screenY + bobY);
            if (facingLeft) {
              ctx.scale(-1, 1);
            }
            ctx.drawImage(cleanHero, -drawSize / 2, -drawSize + 18, drawSize, drawSize);
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
            ctx.fillStyle = isMe ? '#10b981' : '#38bdf8';
            ctx.fill();
          }
        }
      } else {
        // --- RENDER MONSTER ISOMETRIC SPRITE (Chroma-Keyed Full Figure) ---
        const isBoss = ent.maxHp > 200;
        const mobSprite = this.monsterIsoSprites[ent.name];
        const cleanMob = mobSprite ? this.getTransparentCanvas(mobSprite) : null;

        if (cleanMob) {
          const drawSize = isBoss ? 82 : 56;
          const bobY = ent.isMoving ? Math.abs(Math.sin(now * 0.011)) * -4 : Math.sin(now * 0.003) * -1.5;
          ctx.save();
          ctx.translate(screenX, screenY + bobY);
          if (facingLeft) {
            ctx.scale(-1, 1);
          }
          ctx.drawImage(cleanMob, -drawSize / 2, -drawSize + 18, drawSize, drawSize);
          ctx.restore();
        } else {
          const radius = isBoss ? 22 : 16;
          ctx.beginPath();
          ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
          ctx.fillStyle = isBoss ? '#7f1d1d' : '#991b1b';
          ctx.fill();
          ctx.strokeStyle = isBoss ? '#f59e0b' : '#ef4444';
          ctx.lineWidth = isBoss ? 2.5 : 1.5;
          ctx.stroke();
        }
      }

      // Draw Orientation Arrow
      const rad = (ent.headingYaw * Math.PI) / 180;
      const lineLen = isMonster ? 18 : 22;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX + Math.sin(rad) * lineLen, screenY + Math.cos(rad) * lineLen);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Name & Class Badge
      ctx.fillStyle = '#f8fafc';
      ctx.font = isMe ? 'bold 12px Inter, sans-serif' : '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const levelTag = ent.level ? `[Nv. ${ent.level}] ` : '';
      const displayName = isMe ? `⭐ ${levelTag}${ent.name}` : `${levelTag}${ent.name}`;
      ctx.fillText(displayName, screenX, screenY - 38);

      if (ent.classType) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText(`[${ent.classType}]`, screenX, screenY - 27);
      }

      // Draw Health Bar
      const barWidth = 42;
      const barHeight = 5;
      const hpPercent = Math.max(0, Math.min(1, ent.currentHp / ent.maxHp));

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(screenX - barWidth / 2, screenY + 16, barWidth, barHeight);

      ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.2 ? '#eab308' : '#ef4444';
      ctx.fillRect(screenX - barWidth / 2, screenY + 16, barWidth * hpPercent, barHeight);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX - barWidth / 2, screenY + 16, barWidth, barHeight);

      // Draw Resource Bar (Mana / Energia)
      if (ent.currentResource !== undefined && ent.maxResource) {
        const resPercent = Math.max(0, Math.min(1, ent.currentResource / ent.maxResource));
        const resColor = ent.resourceType === 'Energia' ? '#facc15' : '#38bdf8';

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(screenX - barWidth / 2, screenY + 22, barWidth, 3);

        ctx.fillStyle = resColor;
        ctx.fillRect(screenX - barWidth / 2, screenY + 22, barWidth * resPercent, 3);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX - barWidth / 2, screenY + 22, barWidth, 3);
      }
    }

    // 4. Draw Ground Item Drops (Glowing beacons & loot bags)
    this.renderItemDrops(screenCenterX, screenCenterY);

    // 5. Draw Floating Combat Text
    this.renderFloatingText(screenCenterX, screenCenterY);
  }

  private drawArenaGrid(cx: number, cy: number): void {
    const { ctx } = this;
    const mapBounds = 60; // -60 to 60 units
    const minScreenX = cx - (mapBounds + this.cameraOffset.x) * this.zoom;
    const maxScreenX = cx + (mapBounds - this.cameraOffset.x) * this.zoom;
    const minScreenY = cy - (mapBounds + this.cameraOffset.y) * this.zoom;
    const maxScreenY = cy + (mapBounds - this.cameraOffset.y) * this.zoom;
    const arenaWidth = maxScreenX - minScreenX;
    const arenaHeight = maxScreenY - minScreenY;

    // 1. Render Seamless Fantasy Grass Tile across the outer arena
    if (this.fantasyGrassTile && this.fantasyGrassTile.complete && this.fantasyGrassTile.naturalWidth > 0) {
      const tileScreenSize = 18 * this.zoom; // 18 world units per tile repeat
      ctx.save();
      ctx.beginPath();
      ctx.rect(minScreenX, minScreenY, arenaWidth, arenaHeight);
      ctx.clip();

      for (let wx = -mapBounds; wx < mapBounds; wx += 18) {
        for (let wz = -mapBounds; wz < mapBounds; wz += 18) {
          const tx = cx + (wx - this.cameraOffset.x) * this.zoom;
          const ty = cy + (wz - this.cameraOffset.y) * this.zoom;
          ctx.drawImage(this.fantasyGrassTile, tx, ty, tileScreenSize + 1, tileScreenSize + 1);
        }
      }

      // Darken slightly so UI and glowing spells pop
      ctx.fillStyle = 'rgba(10, 15, 29, 0.38)';
      ctx.fillRect(minScreenX, minScreenY, arenaWidth, arenaHeight);
      ctx.restore();
    }

    // 2. Render Seamless Arena Stone Tile in the central combat plaza (-24 to +24 world units)
    if (this.arenaStoneTile && this.arenaStoneTile.complete && this.arenaStoneTile.naturalWidth > 0) {
      const plazaBounds = 24;
      const pMinX = cx - (plazaBounds + this.cameraOffset.x) * this.zoom;
      const pMaxX = cx + (plazaBounds - this.cameraOffset.x) * this.zoom;
      const pMinY = cy - (plazaBounds + this.cameraOffset.y) * this.zoom;
      const pMaxY = cy + (plazaBounds - this.cameraOffset.y) * this.zoom;
      const tileScreenSize = 12 * this.zoom;

      ctx.save();
      ctx.beginPath();
      ctx.rect(pMinX, pMinY, pMaxX - pMinX, pMaxY - pMinY);
      ctx.clip();

      for (let wx = -plazaBounds; wx < plazaBounds; wx += 12) {
        for (let wz = -plazaBounds; wz < plazaBounds; wz += 12) {
          const tx = cx + (wx - this.cameraOffset.x) * this.zoom;
          const ty = cy + (wz - this.cameraOffset.y) * this.zoom;
          ctx.drawImage(this.arenaStoneTile, tx, ty, tileScreenSize + 1, tileScreenSize + 1);
        }
      }

      ctx.fillStyle = 'rgba(10, 15, 29, 0.28)';
      ctx.fillRect(pMinX, pMinY, pMaxX - pMinX, pMaxY - pMinY);
      ctx.restore();

      // Plaza stone border
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(pMinX, pMinY, pMaxX - pMinX, pMaxY - pMinY);
    }

    // Outer Boundary Box with double line and glow
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(minScreenX, minScreenY, arenaWidth, arenaHeight);

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 8;
    ctx.strokeRect(minScreenX, minScreenY, arenaWidth, arenaHeight);

    // Subtle grid lines every 10 units
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let u = -mapBounds; u <= mapBounds; u += 10) {
      const gx = cx + (u - this.cameraOffset.x) * this.zoom;
      const gy = cy + (u - this.cameraOffset.y) * this.zoom;

      ctx.beginPath();
      ctx.moveTo(gx, minScreenY);
      ctx.lineTo(gx, maxScreenY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(minScreenX, gy);
      ctx.lineTo(maxScreenX, gy);
      ctx.stroke();
    }

    // Center Spawn Altar / Runic Circle (World 0,0)
    const altarScreenX = cx + (0 - this.cameraOffset.x) * this.zoom;
    const altarScreenY = cy + (0 - this.cameraOffset.y) * this.zoom;

    ctx.beginPath();
    ctx.arc(altarScreenX, altarScreenY, 6 * this.zoom, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(altarScreenX, altarScreenY, 2 * this.zoom, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.stroke();
  }

  private renderFloatingText(cx: number, cy: number): void {
    const { ctx } = this;
    const now = performance.now();
    const duration = 1200; // ms

    this.floatingTexts = this.floatingTexts.filter((item) => {
      const elapsed = now - item.createdAt;
      if (elapsed > duration) return false;

      const progress = elapsed / duration;
      const floatY = item.y - progress * 2.5; // Float upwards
      const opacity = 1.0 - progress;

      const screenX = cx + (item.x - this.cameraOffset.x) * this.zoom;
      const screenY = cy + (floatY - this.cameraOffset.y) * this.zoom;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillStyle = item.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(item.text, screenX, screenY);
      ctx.restore();

      return true;
    });
  }

  /**
   * Screen pixel coordinate to World Vector3
   */
  public screenToWorld(clientX: number, clientY: number): Vector3 {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const screenCenterX = this.canvas.width / 2;
    const screenCenterY = this.canvas.height / 2;

    const worldX = (x - screenCenterX) / this.zoom + this.cameraOffset.x;
    const worldZ = (y - screenCenterY) / this.zoom + this.cameraOffset.y;

    return { x: worldX, y: 0, z: worldZ };
  }

  public addOrUpdateDrop(payload: S2CItemDropSpawnPayload): void {
    this.activeDrops.set(payload.dropId, {
      ...payload,
      spawnTimestamp: performance.now(),
    });
  }

  public removeDrop(dropId: string): void {
    this.activeDrops.delete(dropId);
  }

  public clearDrops(): void {
    this.activeDrops.clear();
  }

  public findDropNearWorldPos(worldPos: Vector3, maxRadius = 3.5): ActiveItemDrop | null {
    let nearest: ActiveItemDrop | null = null;
    let minDist = maxRadius;

    for (const drop of this.activeDrops.values()) {
      const d = distance(worldPos, drop.position);
      if (d <= minDist) {
        minDist = d;
        nearest = drop;
      }
    }

    return nearest;
  }

  private renderItemDrops(cx: number, cy: number): void {
    const { ctx } = this;
    const now = performance.now();

    for (const drop of this.activeDrops.values()) {
      const sx = cx + (drop.position.x - this.cameraOffset.x) * this.zoom;
      const sy = cy + (drop.position.z - this.cameraOffset.y) * this.zoom;

      const rarityTheme = RARITY_COLORS[drop.rarity] || {
        border: '#ffffff',
        glow: 'rgba(255, 255, 255, 0.4)',
        text: '#ffffff',
        bg: 'rgba(30, 41, 59, 0.6)',
      };
      const rarityColor = rarityTheme.border;
      const bobOffset = Math.sin(now * 0.005 + drop.position.x) * 4;

      ctx.save();

      // 1. Vertical Beaming Light Pillar
      const beamGrad = ctx.createLinearGradient(sx, sy, sx, sy - 55);
      beamGrad.addColorStop(0, rarityColor);
      beamGrad.addColorStop(0.3, rarityTheme.glow);
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(sx - 6, sy);
      ctx.lineTo(sx - 1.5, sy - 55);
      ctx.lineTo(sx + 1.5, sy - 55);
      ctx.lineTo(sx + 6, sy);
      ctx.closePath();
      ctx.fill();

      // 2. Ground Pulsing Aura Ring
      const auraPulse = 1.0 + Math.sin(now * 0.006) * 0.2;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 12 * auraPulse, 6 * auraPulse, 0, 0, Math.PI * 2);
      ctx.strokeStyle = rarityColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = rarityTheme.bg;
      ctx.fill();

      // 3. Loot Icon (Floating glowing bag/chest)
      const iconY = sy - 14 + bobOffset;
      ctx.fillStyle = drop.itemId === 'gold' ? '#fbbf24' : '#f8fafc';
      ctx.beginPath();
      ctx.arc(sx, iconY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rarityColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner icon symbol
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(drop.itemId === 'gold' ? '💰' : '📦', sx, iconY);

      // 4. Floating Name Badge
      const textY = iconY - 12;
      const labelText = drop.quantity > 1 ? `${drop.name} (${drop.quantity})` : drop.name;
      ctx.font = 'bold 11px Inter, sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const bgWidth = textMetrics.width + 12;
      const bgHeight = 16;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(sx - bgWidth / 2, textY - 11, bgWidth, bgHeight);
      ctx.strokeStyle = rarityColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - bgWidth / 2, textY - 11, bgWidth, bgHeight);

      ctx.fillStyle = rarityTheme.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, sx, textY - 3);

      ctx.restore();
    }
  }
}
