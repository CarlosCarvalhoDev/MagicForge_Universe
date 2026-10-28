import { ItemRarity, RARITY_COLORS, S2CItemDropSpawnPayload, Vector3, distance } from '@magicforge/shared';
import { InterpolatedEntity } from '../interpolation/SnapshotBuffer';
import { HERO_SHEETS, HeroAnimationClock, HeroSheetSpec, keyDarkBackground } from './HeroAnimations';
import { FloatingDialogue } from '../ui/FloatingDialogue';

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
  private dialogues = new FloatingDialogue();
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private floatingTexts: FloatingText[] = [];
  public activeDrops = new Map<string, ActiveItemDrop>();

  // World to screen mapping (Scaled up for bold hero & monster presence)
  public zoom: number = 16.0; // pixels per world unit
  public minZoom: number = 8.0;
  public maxZoom: number = 26.0;
  public cameraOffset = { x: 0, y: 0 };
  public showRawGhost: boolean = true;
  public selectedTargetId: string | null = null;

  public setZoom(targetZoom: number): void {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, Math.round(targetZoom * 10) / 10));
  }

  // Sprite animation assets & Chroma-Key cache
  private heroSheets: Record<string, Record<string, HeroSheetSpec & { img: HTMLImageElement }>> = {};
  private heroIsoSprites: Record<string, HTMLImageElement> = {};
  private monsterIsoSprites: Record<string, HTMLImageElement> = {};
  private arenaStoneTile: HTMLImageElement | null = null;
  private fantasyGrassTile: HTMLImageElement | null = null;
  private cleanedImageCache = new Map<string, HTMLCanvasElement>();
  private animationClock = new HeroAnimationClock();
  private entityFacingLeft = new Map<string, boolean>();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.loadHeroSpriteSheets();
    this.loadIsometricSprites();
    this.loadFloorTiles();
  }

  private runicPortalImg: HTMLImageElement | null = null;

  private loadFloorTiles(): void {
    const forest = new Image();
    forest.src = '/assets/environment/tile_mundo_1_floresta.jpg';
    this.fantasyGrassTile = forest;

    const stone = new Image();
    stone.src = '/assets/isometric/tile_arena_stone.jpg';
    this.arenaStoneTile = stone;

    const portal = new Image();
    portal.src = '/assets/environment/portal_runico.png';
    this.runicPortalImg = portal;
  }

  private loadHeroSpriteSheets(): void {
    const classConfigs = HERO_SHEETS;

    for (const [className, specs] of Object.entries(classConfigs)) {
      this.heroSheets[className] = {};
      for (const [key, spec] of Object.entries(specs)) {
        const img = new Image();
        img.src = spec.file;
        this.heroSheets[className][key] = { ...spec, img };
      }
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
      Grimgor: '/assets/isometric/iso_boss_grimgor.png',
      'Grimgor, o Senhor Rúnico da Floresta': '/assets/isometric/iso_boss_grimgor.png',
      Frostbite: '/assets/isometric/iso_boss_frostbite.png',
      'Frostbite, a Matriarca dos Lobos Gélidos': '/assets/isometric/iso_boss_frostbite.png',
      Ignis: '/assets/isometric/iso_boss_ignis.png',
      'Ignis, o Titã da Forja Vulcânica': '/assets/isometric/iso_boss_ignis.png',
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

    keyDarkBackground(d);

    offCtx.putImageData(imgData, 0, 0);
    this.cleanedImageCache.set(img.src, offCanvas);
    return offCanvas;
  }

  public triggerEntityAnimation(entityId: string, action: 'attack' | 'hit' | 'death'): void {
    this.animationClock.trigger(entityId, action, performance.now());
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

  public resetNarrative(): void { this.dialogues.reset(); }

  public render(entities: InterpolatedEntity[], myPlayerId: string | null): void {
    const { ctx, canvas } = this;
    const width = canvas.width;
    const height = canvas.height;
    const now = performance.now();
    this.dialogues.observe(entities, now);

    // Center camera on my player (keeps the character dead-center in the viewport)
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

    const visibleIds = new Set(entities.map(entity => entity.id));
    this.animationClock.retain(visibleIds);
    for (const id of this.entityFacingLeft.keys()) if (!visibleIds.has(id)) this.entityFacingLeft.delete(id);

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
        ctx.arc(rawScreenX, rawScreenY, 18, 0, Math.PI * 2);
        ctx.fillStyle = isMe ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)';
        ctx.strokeStyle = isMe ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.fill();
        ctx.setLineDash([]);
      }

      // Draw Drop Shadow (sized for bold presence)
      ctx.beginPath();
      ctx.ellipse(screenX, screenY + 22, isMonster ? (ent.maxHp > 200 ? 46 : 32) : 34, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fill();

      // Draw Target Reticle
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, 56, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const sinYaw = Math.sin((ent.headingYaw * Math.PI) / 180);
      let facingLeft = this.entityFacingLeft.get(ent.id) ?? false;
      if (sinYaw < -0.15) {
        facingLeft = true;
        this.entityFacingLeft.set(ent.id, true);
      } else if (sinYaw > 0.15) {
        facingLeft = false;
        this.entityFacingLeft.set(ent.id, false);
      }

      if (!isMonster) {
        // --- RENDER HERO SPRITE (Heroic Figures scaled bold & prominent) ---
        const heroClass = ent.classType || 'GUERREIRO';
        let drewSheet = false;
        const classSheets = this.heroSheets[heroClass];

        if (classSheets) {
          const playback = this.animationClock.sample(ent.id, ent.isMoving, ent.currentHp, HERO_SHEETS[heroClass], now);
          const sheetSpec = classSheets[playback.action];
          const cleanSheet = sheetSpec ? this.getTransparentCanvas(sheetSpec.img) : null;

          if (sheetSpec && cleanSheet && cleanSheet.width % sheetSpec.cols === 0 && cleanSheet.height % sheetSpec.rows === 0) {
            const cellW = cleanSheet.width / sheetSpec.cols;
            const cellH = cleanSheet.height / sheetSpec.rows;
            const frameIndex = playback.frame;

            const col = frameIndex % sheetSpec.cols;
            const row = Math.floor(frameIndex / sheetSpec.cols);
            const sx = col * cellW;
            const sy = row * cellH;

            // Scaled hero drawSize to 160px for prominent heroic scale
            const drawSize = 160;
            ctx.save();
            ctx.translate(screenX, screenY);
            if (facingLeft) {
              ctx.scale(-1, 1);
            }
            ctx.drawImage(cleanSheet, sx, sy, cellW, cellH, -drawSize / 2, -drawSize + 36, drawSize, drawSize);
            ctx.restore();
            drewSheet = true;
          }
        }

        if (!drewSheet) {
          // Render static isometric sprite for the other classes (with chroma-key transparency & walking bob)
          const isoImg = this.heroIsoSprites[heroClass] || this.heroIsoSprites['GUERREIRO'];
          const cleanHero = isoImg ? this.getTransparentCanvas(isoImg) : null;

          if (cleanHero) {
            // Scaled static hero drawSize to 150px
            const drawSize = 150;
            const bobY = ent.isMoving ? Math.abs(Math.sin(now * 0.012)) * -6 : Math.sin(now * 0.004) * -2;
            ctx.save();
            ctx.translate(screenX, screenY + bobY);
            if (facingLeft) {
              ctx.scale(-1, 1);
            }
            ctx.drawImage(cleanHero, -drawSize / 2, -drawSize + 36, drawSize, drawSize);
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(screenX, screenY, 28, 0, Math.PI * 2);
            ctx.fillStyle = isMe ? '#10b981' : '#38bdf8';
            ctx.fill();
          }
        }
      } else {
        // --- RENDER MONSTER ISOMETRIC SPRITE (Prominent Figures scaled to 135px / 210px for Boss) ---
        const isBoss = ent.maxHp > 200;
        const mobSprite = this.monsterIsoSprites[ent.name];
        const cleanMob = mobSprite ? this.getTransparentCanvas(mobSprite) : null;

        if (cleanMob) {
          const drawSize = isBoss ? 210 : 135;
          const bobY = ent.isMoving ? Math.abs(Math.sin(now * 0.011)) * -5 : Math.sin(now * 0.003) * -2;
          ctx.save();
          ctx.translate(screenX, screenY + bobY);
          if (facingLeft) {
            ctx.scale(-1, 1);
          }
          ctx.drawImage(cleanMob, -drawSize / 2, -drawSize + 30, drawSize, drawSize);
          ctx.restore();
        } else {
          const radius = isBoss ? 38 : 26;
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
      const lineLen = isMonster ? 30 : 34;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX + Math.sin(rad) * lineLen, screenY + Math.cos(rad) * lineLen);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Calculate head top offset with generous breathing room above the scaled-up sprites
      const spriteHeadTop = isMonster ? (ent.maxHp > 200 ? -175 : -112) : -135;
      const nameY = screenY + spriteHeadTop - 32;
      const classY = screenY + spriteHeadTop - 16;
      const hpBarY = screenY + spriteHeadTop - 4;

      // Draw Name & Class Badge (above head)
      ctx.fillStyle = '#f8fafc';
      ctx.font = isMe ? 'bold 12px Inter, sans-serif' : '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const levelTag = ent.level ? `[Nv. ${ent.level}] ` : '';
      const displayName = isMe ? `⭐ ${levelTag}${ent.name}` : `${levelTag}${ent.name}`;
      ctx.fillText(displayName, screenX, nameY);

      if (ent.classType) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText(`[${ent.classType}]`, screenX, classY);
      }

      // Draw Health Bar (spaced cleanly above head)
      const barWidth = 54;
      const barHeight = 6;
      const hpPercent = Math.max(0, Math.min(1, ent.currentHp / ent.maxHp));

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(screenX - barWidth / 2, hpBarY, barWidth, barHeight);

      ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.2 ? '#eab308' : '#ef4444';
      ctx.fillRect(screenX - barWidth / 2, hpBarY, barWidth * hpPercent, barHeight);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX - barWidth / 2, hpBarY, barWidth, barHeight);

      // Draw Resource Bar (Mana / Energia)
      if (ent.currentResource !== undefined && ent.maxResource) {
        const resPercent = Math.max(0, Math.min(1, ent.currentResource / ent.maxResource));
        const resColor = ent.resourceType === 'Energia' ? '#facc15' : '#38bdf8';
        const resBarY = hpBarY + 5;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(screenX - barWidth / 2, resBarY, barWidth, 3);

        ctx.fillStyle = resColor;
        ctx.fillRect(screenX - barWidth / 2, resBarY, barWidth * resPercent, 3);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX - barWidth / 2, resBarY, barWidth, 3);
      }
    }

    // 4. Draw Ground Item Drops (Glowing beacons & loot bags)
    this.renderItemDrops(screenCenterX, screenCenterY);

    // 5. Draw Floating Combat Text
    this.renderFloatingText(screenCenterX, screenCenterY);
    const dialogue = this.dialogues.current(now);
    const speaker = dialogue ? entities.find(entity => entity.id === dialogue.entityId) : undefined;
    if (speaker) {
      const x = screenCenterX + (speaker.position.x - this.cameraOffset.x) * this.zoom;
      const y = screenCenterY + (speaker.position.z - this.cameraOffset.y) * this.zoom - (speaker.maxHp > 200 ? 225 : 162);
      if (x > -250 && x < width + 250 && y > -80 && y < height + 80) this.dialogues.draw(ctx, x, y, now);
    }
  }

  private drawArenaGrid(cx: number, cy: number): void {
    const { ctx } = this;
    const arenaWorldSize = 120; // 120m x 120m single grand stage
    const minX = -arenaWorldSize / 2;
    const minZ = -arenaWorldSize / 2;

    const mapScreenX = cx + (minX - this.cameraOffset.x) * this.zoom;
    const mapScreenY = cy + (minZ - this.cameraOffset.y) * this.zoom;
    const mapScreenW = arenaWorldSize * this.zoom;
    const mapScreenH = arenaWorldSize * this.zoom;

    // 1. Render Single Grand Stage Environment (Mundo 1: Floresta da Forja) - ONE single map, not tiled!
    if (this.fantasyGrassTile && this.fantasyGrassTile.complete && this.fantasyGrassTile.naturalWidth > 0) {
      ctx.drawImage(this.fantasyGrassTile, mapScreenX, mapScreenY, mapScreenW, mapScreenH);

      // Soft edge vignette around the boundaries of the arena
      const edgeFade = 50;
      const gradL = ctx.createLinearGradient(mapScreenX, 0, mapScreenX + edgeFade, 0);
      gradL.addColorStop(0, 'rgba(10, 15, 29, 0.95)');
      gradL.addColorStop(1, 'rgba(10, 15, 29, 0)');
      ctx.fillStyle = gradL;
      ctx.fillRect(mapScreenX, mapScreenY, edgeFade, mapScreenH);

      const gradR = ctx.createLinearGradient(mapScreenX + mapScreenW - edgeFade, 0, mapScreenX + mapScreenW, 0);
      gradR.addColorStop(0, 'rgba(10, 15, 29, 0)');
      gradR.addColorStop(1, 'rgba(10, 15, 29, 0.95)');
      ctx.fillStyle = gradR;
      ctx.fillRect(mapScreenX + mapScreenW - edgeFade, mapScreenY, edgeFade, mapScreenH);

      const gradT = ctx.createLinearGradient(0, mapScreenY, 0, mapScreenY + edgeFade);
      gradT.addColorStop(0, 'rgba(10, 15, 29, 0.95)');
      gradT.addColorStop(1, 'rgba(10, 15, 29, 0)');
      ctx.fillStyle = gradT;
      ctx.fillRect(mapScreenX, mapScreenY, mapScreenW, edgeFade);

      const gradB = ctx.createLinearGradient(0, mapScreenY + mapScreenH - edgeFade, 0, mapScreenY + mapScreenH);
      gradB.addColorStop(0, 'rgba(10, 15, 29, 0)');
      gradB.addColorStop(1, 'rgba(10, 15, 29, 0.95)');
      ctx.fillStyle = gradB;
      ctx.fillRect(mapScreenX, mapScreenY + mapScreenH - edgeFade, mapScreenW, edgeFade);

      // Soft ambient vignette for UI readability
      ctx.fillStyle = 'rgba(10, 15, 29, 0.12)';
      ctx.fillRect(mapScreenX, mapScreenY, mapScreenW, mapScreenH);
    }

    // 2. Ornate Arena Border & Corner Runes
    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(mapScreenX, mapScreenY, mapScreenW, mapScreenH);

    const corners = [
      [mapScreenX, mapScreenY],
      [mapScreenX + mapScreenW, mapScreenY],
      [mapScreenX, mapScreenY + mapScreenH],
      [mapScreenX + mapScreenW, mapScreenY + mapScreenH],
    ];
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [cornX, cornY] of corners) {
      ctx.beginPath();
      ctx.arc(cornX, cornY, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.fillText('ᚱ', cornX, cornY);
    }
    ctx.restore();

    // 3. Subtle Arena Combat Boundary (circle around center)
    const combatRadius = 50;
    const altarScreenX = cx + (0 - this.cameraOffset.x) * this.zoom;
    const altarScreenY = cy + (0 - this.cameraOffset.y) * this.zoom;

    ctx.beginPath();
    ctx.arc(altarScreenX, altarScreenY, combatRadius * this.zoom, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Center Spawn Altar / Runic Circle (World 0,0 - located on the central stone path)
    ctx.beginPath();
    ctx.arc(altarScreenX, altarScreenY, 7 * this.zoom, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(altarScreenX, altarScreenY, 3 * this.zoom, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Draw Runic Stage Portal (at diagonal coordinates 20, 20)
    if (this.runicPortalImg && this.runicPortalImg.complete && this.runicPortalImg.naturalWidth > 0) {
      const portalWorldX = 20;
      const portalWorldZ = 20;
      const pScreenX = cx + (portalWorldX - this.cameraOffset.x) * this.zoom;
      const pScreenY = cy + (portalWorldZ - this.cameraOffset.y) * this.zoom;

      const portalSize = 72;
      const pulse = Math.sin(performance.now() * 0.0035) * 6;

      ctx.save();
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 20 + pulse;
      ctx.drawImage(
        this.runicPortalImg,
        pScreenX - (portalSize + pulse) / 2,
        pScreenY - (portalSize + pulse) / 2 - 16,
        portalSize + pulse,
        portalSize + pulse
      );
      ctx.restore();

      // Portal title tag
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      ctx.fillText('🌀 PORTAL RÚNICO (FASE 2)', pScreenX, pScreenY - 48);
    }
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

  public getDropAtScreenPos(screenX: number, screenY: number, hitRadius = 28): ActiveItemDrop | null {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    let closestDrop: ActiveItemDrop | null = null;
    let closestDistSq = hitRadius * hitRadius;

    for (const drop of this.activeDrops.values()) {
      const sx = cx + (drop.position.x - this.cameraOffset.x) * this.zoom;
      const sy = cy + (drop.position.z - this.cameraOffset.y) * this.zoom;
      const dx = screenX - sx;
      const dy = screenY - sy;
      const distSq = dx * dx + dy * dy;
      if (distSq <= closestDistSq) {
        closestDistSq = distSq;
        closestDrop = drop;
      }
    }

    return closestDrop;
  }

  private renderItemDrops(cx: number, cy: number): void {
    const { ctx } = this;
    const now = performance.now();

    const sortedDrops = Array.from(this.activeDrops.values()).sort((a, b) => {
      const distA = Math.hypot(a.position.x - this.cameraOffset.x, a.position.z - this.cameraOffset.y);
      const distB = Math.hypot(b.position.x - this.cameraOffset.x, b.position.z - this.cameraOffset.y);
      return distA - distB;
    });

    let labeledCount = 0;
    for (const drop of sortedDrops) {
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
      const iconY = sy - 20 + bobOffset;
      ctx.fillStyle = drop.itemId === 'gold' ? '#fbbf24' : '#f8fafc';
      ctx.beginPath();
      ctx.arc(sx, iconY, 8, 0, Math.PI * 2);
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

      // 4. Floating Name Badge (rendered for the closest 6 drops to avoid text clutter)
      const distToCam = Math.hypot(drop.position.x - this.cameraOffset.x, drop.position.z - this.cameraOffset.y);
      if (distToCam < 16.0 && labeledCount < 6) {
        labeledCount++;
        const textY = iconY - 16;
        const labelText = drop.quantity > 1 ? `${drop.name} (${drop.quantity})` : drop.name;
        ctx.font = 'bold 11px Inter, sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const bgWidth = textMetrics.width + 14;
        const bgHeight = 18;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(sx - bgWidth / 2, textY - 12, bgWidth, bgHeight);
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx - bgWidth / 2, textY - 12, bgWidth, bgHeight);

        ctx.fillStyle = rarityTheme.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, sx, textY - 3);
      }

      ctx.restore();
    }
  }
}
