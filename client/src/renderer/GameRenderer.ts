import { ItemRarity, RARITY_COLORS, S2CItemDropSpawnPayload, S2CSkillCastEventPayload, CombatStatusTransitionPayload, SKILLS_DATABASE, Vector3, distance } from '@magicforge/shared';
import { InterpolatedEntity } from '../interpolation/SnapshotBuffer';
import { HERO_SHEETS, HeroAnimationClock, HeroSheetSpec, keyDarkBackground, getFacingDirection, HeroAction } from './HeroAnimations';
import { FloatingDialogue } from '../ui/FloatingDialogue';
import { IdleMath } from '../idle/IdleMath';
import { SoundManager } from '../audio/SoundManager';
import { PixelWorld } from './PixelWorld';
import { PixelVfxPlayer } from './PixelVfxPlayer';
import { planWarriorCastFx } from './PixelVfx';
import { WarriorPresentation } from './WarriorPresentation';
import type { VisualStage } from './WorldPresentation';

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

export interface CombatVisualFx {
  id: string;
  type: 'fel_bolt' | 'soul_drain' | 'profane_circle' | 'demon_aura';
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  startTime: number;
  durationMs: number;
}

export class GameRenderer {
  public setStagePresentation(stage: VisualStage): void { this.pixelWorld.presentation.setStage(stage); }
  public readonly pixelWorld = new PixelWorld();
  public readonly vfx = new PixelVfxPlayer();
  public readonly warriorPresentation = new WarriorPresentation();
  public readonly visualStyle: 'pixel' | 'legacy';
  private dialogues = new FloatingDialogue();
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private floatingTexts: FloatingText[] = [];
  private activeFx: CombatVisualFx[] = [];
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
  private seamlessGrassTile: HTMLImageElement | null = null;
  private cleanedImageCache = new Map<string, HTMLCanvasElement>();
  private animationClock = new HeroAnimationClock();
  private entityFacingLeft = new Map<string, boolean>();
  private breezeParticles: Array<{ x: number; y: number; speedX: number; speedY: number; size: number; color: string; phase: number }> = [];
  private readonly floraPatches = [
    { x: -14, z: 8, color: '#38bdf8', type: 'flower' },
    { x: 16, z: -10, color: '#facc15', type: 'dandelion' },
    { x: -24, z: -16, color: '#4ade80', type: 'grass' },
    { x: 26, z: 18, color: '#c084fc', type: 'flower' },
    { x: -8, z: 28, color: '#f472b6', type: 'flower' },
    { x: 32, z: -22, color: '#22c55e', type: 'grass' },
    { x: 14, z: 38, color: '#facc15', type: 'dandelion' },
    { x: -28, z: 22, color: '#34d399', type: 'grass' },
  ];

  constructor(canvas: HTMLCanvasElement, visualStyle: 'pixel' | 'legacy' = 'pixel') {
    this.visualStyle = visualStyle;
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.pixelWorld.ready.catch(error => console.error(error));
    this.vfx.ready.catch(error => console.error(error));
    this.loadHeroSpriteSheets();
    this.loadIsometricSprites();
    this.loadFloorTiles();
    for (let i = 0; i < 24; i++) {
      this.breezeParticles.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        speedX: 0.6 + Math.random() * 0.9,
        speedY: 0.25 + Math.random() * 0.45,
        size: 2.5 + Math.random() * 3.5,
        color: ['#fbbf24', '#f59e0b', '#34d399', '#10b981', '#67e8f9'][i % 5],
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private runicPortalImg: HTMLImageElement | null = null;

  private loadFloorTiles(): void {
    const forest = new Image();
    forest.src = '/assets/environment/tile_mundo_1_floresta.jpg';
    this.fantasyGrassTile = forest;

    const grass = new Image();
    grass.src = '/assets/isometric/tile_fantasy_grass.jpg';
    this.seamlessGrassTile = grass;

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
      DEMONOLOGO: '/assets/isometric/iso_hero_demonologo.png',
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

  public triggerEntityAnimation(entityId: string, action: HeroAction): void {
    this.animationClock.trigger(entityId, action, performance.now());
    this.pixelWorld.clock.trigger(entityId, action, performance.now());
  }

  public triggerSkillCast(
    casterId: string,
    skillId: string,
    casterPos?: { x: number; z: number },
    targetPos?: { x: number; z: number }
  ): void {
    let action: HeroAction = 'attack';
    let fxType: 'fel_bolt' | 'soul_drain' | 'profane_circle' | 'demon_aura' | null = null;

    if (skillId.includes('demonologo_truque') || skillId === 'demonologo_1') {
      action = 'cast_bolt';
      fxType = 'fel_bolt';
    } else if (skillId.includes('demonologo_nv1') || skillId === 'demonologo_2') {
      action = 'cast_drain';
      fxType = 'soul_drain';
    } else if (skillId.includes('demonologo_nv2') || skillId === 'demonologo_3') {
      action = 'cast_circle';
      fxType = 'profane_circle';
    } else if (skillId.includes('demonologo_nv3') || skillId === 'demonologo_4') {
      action = 'cast_ultimate';
      fxType = 'demon_aura';
    }

    this.triggerEntityAnimation(casterId, action);

    if (fxType && casterPos) {
      const srcVec: Vector3 = { x: casterPos.x, y: 0, z: casterPos.z };
      const tgtVec: Vector3 = targetPos ? { x: targetPos.x, y: 0, z: targetPos.z } : srcVec;
      const duration = fxType === 'soul_drain' ? 1200 : fxType === 'demon_aura' ? 1400 : 700;
      this.spawnCombatFx(fxType, srcVec, tgtVec, duration);
    }
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public addDamageText(worldPos: Vector3, damage: number, isCritical: boolean, isDodged: boolean): void {
    if (!isDodged && damage > 0) this.vfx.queue.spawn({ kind: 'impact', position: worldPos }, performance.now());
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
    SoundManager.playLevelUp();
    this.vfx.queue.spawn({ kind: 'levelUp', position: worldPos }, performance.now());
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

  public resetNarrative(): void { this.dialogues.reset(); this.vfx.queue.clear(); this.warriorPresentation.clear(); }

  public acceptSkillCast(event: S2CSkillCastEventPayload): boolean {
    return this.warriorPresentation.acceptCast(event, performance.now());
  }

  public applyCombatStatus(event: CombatStatusTransitionPayload, entities: InterpolatedEntity[]): void {
    if (!this.warriorPresentation.transition(event, performance.now())) return;
    const target = entities.find(e => e.id === event.status.targetEntityId);
    if (target && event.event === 'BROKEN') this.floatingTexts.push({ id: `status-${event.status.statusId}`, text: 'ESCUDO QUEBRADO', color: '#b9e9fa', x: target.position.x, y: target.position.z - 2, opacity: 1, createdAt: performance.now() });
    // BLEED damage is already broadcast via S2C_COMBAT_EVENT; do not duplicate numbers here.
  }

  public playSkillVfx(event: S2CSkillCastEventPayload, entities: InterpolatedEntity[]): void {
    const radius = event.radius ?? SKILLS_DATABASE[event.skillId]?.aoeRadius;
    for (const request of planWarriorCastFx(event, entities, radius)) this.vfx.queue.spawn(request, performance.now());
    for (const status of event.appliedStatuses ?? []) this.warriorPresentation.transition({ event: 'APPLIED', serverTick: event.serverTick ?? 0, status }, performance.now());
  }

  public spawnCombatFx(
    type: CombatVisualFx['type'],
    sourcePos: Vector3,
    targetPos?: Vector3,
    durationMs: number = 800
  ): void {
    const target = targetPos || sourcePos;
    this.activeFx.push({
      id: Math.random().toString(),
      type,
      sourceX: sourcePos.x,
      sourceY: sourcePos.z,
      targetX: target.x,
      targetY: target.z,
      startTime: performance.now(),
      durationMs,
    });

    if (type === 'fel_bolt') SoundManager.playDemonCast();
    else if (type === 'soul_drain') SoundManager.playSoulDrain();
    else if (type === 'profane_circle') SoundManager.playProfaneCircle();
    else if (type === 'demon_aura') SoundManager.playMetamorphosis();
  }

  private renderCombatFx(cx: number, cy: number, now: number): void {
    const { ctx } = this;
    this.activeFx = this.activeFx.filter((fx) => {
      const elapsed = now - fx.startTime;
      if (elapsed >= fx.durationMs) return false;
      const progress = elapsed / fx.durationMs;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const sx = cx + (fx.sourceX - this.cameraOffset.x) * this.zoom;
      const sy = cy + (fx.sourceY - this.cameraOffset.y) * this.zoom - 30;
      const tx = cx + (fx.targetX - this.cameraOffset.x) * this.zoom;
      const ty = cy + (fx.targetY - this.cameraOffset.y) * this.zoom - 30;

      if (fx.type === 'fel_bolt') {
        const curX = sx + (tx - sx) * progress;
        const curY = sy + (ty - sy) * progress;
        const radius = 9 * (1 + Math.sin(progress * Math.PI) * 0.4);

        const grad = ctx.createRadialGradient(curX, curY, 1, curX, curY, radius * 1.8);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#34d399');
        grad.addColorStop(0.8, 'rgba(16, 185, 129, 0.4)');
        grad.addColorStop(1, 'rgba(5, 150, 105, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(curX, curY, radius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 1; i <= 4; i++) {
          const trailT = Math.max(0, progress - i * 0.05);
          const trX = sx + (tx - sx) * trailT;
          const trY = sy + (ty - sy) * trailT;
          ctx.fillStyle = `rgba(52, 211, 153, ${0.4 / i})`;
          ctx.beginPath();
          ctx.arc(trX, trY, radius * (0.8 / i), 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (fx.type === 'soul_drain') {
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3 + Math.sin(now * 0.02) * 1.5;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        const midX = (tx + sx) / 2 + Math.sin(now * 0.01) * 20;
        const midY = (ty + sy) / 2 + Math.cos(now * 0.01) * 20;
        ctx.quadraticCurveTo(midX, midY, sx, sy);
        ctx.stroke();

        const pProgress = (now * 0.003) % 1;
        const px = tx + (sx - tx) * pProgress;
        const py = ty + (sy - ty) * pProgress;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (fx.type === 'profane_circle') {
        const floorY = cy + (fx.targetY - this.cameraOffset.y) * this.zoom;
        const rX = 55 * this.zoom / 16;
        const rY = 25 * this.zoom / 16;
        const alpha = Math.sin(progress * Math.PI);

        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.8})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(tx, floorY, rX, rY, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.25})`;
        ctx.fill();
      } else if (fx.type === 'demon_aura') {
        const auraRadius = 45 + Math.sin(now * 0.015) * 8;
        const grad = ctx.createRadialGradient(sx, sy, 5, sx, sy, auraRadius);
        grad.addColorStop(0, 'rgba(52, 211, 153, 0.5)');
        grad.addColorStop(0.6, 'rgba(147, 51, 234, 0.3)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, auraRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      return true;
    });
  }


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

    // Pixel-art migration: presentation changes only; network snapshots remain authoritative.
    if (this.visualStyle === 'pixel') {
      this.pixelWorld.draw(ctx, entities, this.cameraOffset, this.zoom, myPlayerId, this.selectedTargetId, now);
      this.vfx.draw(ctx, entities, this.cameraOffset, this.zoom, now);
      this.vfx.drawStatuses(ctx, this.warriorPresentation.visible(now, entities), entities, this.cameraOffset, this.zoom, now);
      this.renderItemDrops(width / 2, height / 2);
      this.renderFloatingText(width / 2, height / 2);
      const currentDialogue = this.dialogues.current(now);
      const currentSpeaker = currentDialogue ? entities.find(entity => entity.id === currentDialogue.entityId) : undefined;
      if (currentSpeaker) {
        const x = width / 2 + (currentSpeaker.position.x - this.cameraOffset.x) * this.zoom;
        const y = height / 2 + (currentSpeaker.position.z - this.cameraOffset.y) * this.zoom - 115;
        this.dialogues.draw(ctx, x, y, now);
      }
      return;
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

      // Draw Drop Shadow (proportional to zoom)
      const shadowW = Math.round((isMonster ? (ent.maxHp > 200 ? 2.9 : 2.0) : 2.1) * this.zoom);
      const shadowH = Math.round(shadowW * 0.36);
      ctx.beginPath();
      ctx.ellipse(screenX, screenY + Math.round(1.3 * this.zoom), shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
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
          const dir = getFacingDirection(ent.headingYaw);

          let actionKey = playback.action;
          let flipX = facingLeft;

          if (playback.action === 'walk') {
            if (dir === 'north' && classSheets['walk_north']) {
              actionKey = 'walk_north' as any;
              flipX = false;
            } else if ((dir === 'east' || dir === 'west') && classSheets['walk_side']) {
              actionKey = 'walk_side' as any;
              flipX = dir === 'west';
            } else {
              actionKey = 'walk';
              flipX = facingLeft;
            }
          }

          const sheetSpec = classSheets[actionKey] || classSheets[playback.action];
          const cleanSheet = sheetSpec ? this.getTransparentCanvas(sheetSpec.img) : null;

          if (sheetSpec && cleanSheet && cleanSheet.width % sheetSpec.cols === 0 && cleanSheet.height % sheetSpec.rows === 0) {
            const cellW = cleanSheet.width / sheetSpec.cols;
            const cellH = cleanSheet.height / sheetSpec.rows;
            const frameIndex = playback.frame;

            const col = frameIndex % sheetSpec.cols;
            const row = Math.floor(frameIndex / sheetSpec.cols);
            const sx = col * cellW;
            const sy = row * cellH;

            // Proportional hero drawSize: scales with camera zoom and world units
            const heroUnits = heroClass === 'DEMONOLOGO' ? 10.5 : 9.5;
            const drawSize = Math.round(heroUnits * this.zoom);
            const footOffset = Math.round(2.25 * this.zoom);

            if (heroClass === 'DEMONOLOGO' && (playback.action === 'attack' || playback.action.startsWith('cast_'))) {
              ctx.save();
              ctx.translate(screenX, screenY);
              ctx.beginPath();
              const action = playback.action;

              if (action === 'cast_bolt') {
                ctx.arc(0, -drawSize / 3, 48, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(0, -drawSize / 3, 8, 0, -drawSize / 3, 50);
                grad.addColorStop(0, 'rgba(52, 211, 153, 0.45)');
                grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.2)');
                grad.addColorStop(1, 'rgba(5, 150, 105, 0)');
                ctx.fillStyle = grad;
                ctx.fill();
              } else if (action === 'cast_drain') {
                ctx.ellipse(0, 0, 42, 18, 0, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 42);
                grad.addColorStop(0, 'rgba(192, 132, 252, 0.5)');
                grad.addColorStop(0.7, 'rgba(147, 51, 234, 0.25)');
                grad.addColorStop(1, 'rgba(88, 28, 135, 0)');
                ctx.fillStyle = grad;
                ctx.fill();
              } else if (action === 'cast_circle') {
                ctx.ellipse(0, 0, 55, 24, 0, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, 55);
                grad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
                grad.addColorStop(0.6, 'rgba(185, 28, 28, 0.3)');
                grad.addColorStop(1, 'rgba(127, 29, 29, 0)');
                ctx.fillStyle = grad;
                ctx.fill();
              } else if (action === 'cast_ultimate') {
                ctx.arc(0, -drawSize / 3, 62, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(0, -drawSize / 3, 10, 0, -drawSize / 3, 65);
                grad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
                grad.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)');
                grad.addColorStop(1, 'rgba(147, 51, 234, 0)');
                ctx.fillStyle = grad;
                ctx.fill();
              } else {
                ctx.arc(0, -drawSize / 3, 50, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(0, -drawSize / 3, 10, 0, -drawSize / 3, 55);
                grad.addColorStop(0, 'rgba(239, 68, 68, 0.28)');
                grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.16)');
                grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
                ctx.fillStyle = grad;
                ctx.fill();
              }
              ctx.restore();
            }

            ctx.save();
            ctx.translate(screenX, screenY);
            if (flipX) {
              ctx.scale(-1, 1);
            }
            ctx.drawImage(cleanSheet, sx, sy, cellW, cellH, -drawSize / 2, -drawSize + footOffset, drawSize, drawSize);
            ctx.restore();
            drewSheet = true;
          }
        }

        if (!drewSheet) {
          // Render static isometric sprite for the other classes (with chroma-key transparency & walking bob)
          const isoImg = this.heroIsoSprites[heroClass] || this.heroIsoSprites['GUERREIRO'];
          const cleanHero = isoImg ? this.getTransparentCanvas(isoImg) : null;

          if (cleanHero) {
            // Proportional static hero drawSize
            const drawSize = Math.round(9.5 * this.zoom);
            const footOffset = Math.round(2.25 * this.zoom);
            const bobY = ent.isMoving ? Math.abs(Math.sin(now * 0.012)) * -4 : Math.sin(now * 0.004) * -1.5;
            ctx.save();
            ctx.translate(screenX, screenY + bobY);
            if (facingLeft) {
              ctx.scale(-1, 1);
            }
            ctx.drawImage(cleanHero, -drawSize / 2, -drawSize + footOffset, drawSize, drawSize);
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
          const mobUnits = isBoss ? 13.5 : 8.5;
          const drawSize = Math.round(mobUnits * this.zoom);
          const footOffset = Math.round(1.9 * this.zoom);
          const bobY = ent.isMoving ? Math.abs(Math.sin(now * 0.011)) * -4 : Math.sin(now * 0.003) * -1.5;
          ctx.save();
          ctx.translate(screenX, screenY + bobY);
          if (facingLeft) {
            ctx.scale(-1, 1);
          }
          ctx.drawImage(cleanMob, -drawSize / 2, -drawSize + footOffset, drawSize, drawSize);
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

    // 4.5 Draw Active Combat FX
    this.renderCombatFx(screenCenterX, screenCenterY, now);

    // 5. Draw Floating Combat Text
    this.renderFloatingText(screenCenterX, screenCenterY);

    // 6. Draw Ambient Forest Breeze
    this.renderForestBreeze(now);
    const dialogue = this.dialogues.current(now);
    const speaker = dialogue ? entities.find(entity => entity.id === dialogue.entityId) : undefined;
    if (speaker) {
      const x = screenCenterX + (speaker.position.x - this.cameraOffset.x) * this.zoom;
      const y = screenCenterY + (speaker.position.z - this.cameraOffset.y) * this.zoom - (speaker.maxHp > 200 ? 225 : 162);
      if (x > -250 && x < width + 250 && y > -80 && y < height + 80) this.dialogues.draw(ctx, x, y, now);
    }
  }

  private getFeatheredArenaCanvas(img: HTMLImageElement): HTMLCanvasElement {
    const cached = this.cleanedImageCache.get('feathered_arena');
    if (cached) return cached;

    const offscreen = document.createElement('canvas');
    const w = img.naturalWidth || img.width || 1024;
    const h = img.naturalHeight || img.height || 1024;
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return offscreen;

    ctx.drawImage(img, 0, 0, w, h);

    const mask = document.createElement('canvas');
    mask.width = w;
    mask.height = h;
    const mctx = mask.getContext('2d');
    if (mctx) {
      const pad = 48;
      mctx.fillStyle = '#ffffff';
      mctx.fillRect(pad, pad, w - pad * 2, h - pad * 2);

      const gL = mctx.createLinearGradient(0, 0, pad, 0);
      gL.addColorStop(0, 'rgba(255,255,255,0)');
      gL.addColorStop(1, 'rgba(255,255,255,1)');
      mctx.fillStyle = gL;
      mctx.fillRect(0, pad, pad, h - pad * 2);

      const gR = mctx.createLinearGradient(w - pad, 0, w, 0);
      gR.addColorStop(0, 'rgba(255,255,255,1)');
      gR.addColorStop(1, 'rgba(255,255,255,0)');
      mctx.fillStyle = gR;
      mctx.fillRect(w - pad, pad, pad, h - pad * 2);

      const gT = mctx.createLinearGradient(0, 0, 0, pad);
      gT.addColorStop(0, 'rgba(255,255,255,0)');
      gT.addColorStop(1, 'rgba(255,255,255,1)');
      mctx.fillStyle = gT;
      mctx.fillRect(pad, 0, w - pad * 2, pad);

      const gB = mctx.createLinearGradient(0, h - pad, 0, h);
      gB.addColorStop(0, 'rgba(255,255,255,1)');
      gB.addColorStop(1, 'rgba(255,255,255,0)');
      mctx.fillStyle = gB;
      mctx.fillRect(pad, h - pad, w - pad * 2, pad);

      const gTL = mctx.createRadialGradient(pad, pad, 0, pad, pad, pad);
      gTL.addColorStop(0, 'rgba(255,255,255,1)');
      gTL.addColorStop(1, 'rgba(255,255,255,0)');
      mctx.fillStyle = gTL;
      mctx.fillRect(0, 0, pad, pad);

      const gTR = mctx.createRadialGradient(w - pad, pad, 0, w - pad, pad, pad);
      gTR.addColorStop(0, 'rgba(255,255,255,1)');
      gTR.addColorStop(1, 'rgba(255,255,255,0)');
      mctx.fillStyle = gTR;
      mctx.fillRect(w - pad, 0, pad, pad);

      const gBL = mctx.createRadialGradient(pad, h - pad, 0, pad, h - pad, pad);
      gBL.addColorStop(0, 'rgba(255,255,255,1)');
      gBL.addColorStop(1, 'rgba(255,255,255,0)');
      mctx.fillStyle = gBL;
      mctx.fillRect(0, h - pad, pad, pad);

      const gBR = mctx.createRadialGradient(w - pad, h - pad, 0, w - pad, h - pad, pad);
      gBR.addColorStop(0, 'rgba(255,255,255,1)');
      gBR.addColorStop(1, 'rgba(255,255,255,0)');
      mctx.fillStyle = gBR;
      mctx.fillRect(w - pad, h - pad, pad, pad);

      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0);
    }

    this.cleanedImageCache.set('feathered_arena', offscreen);
    return offscreen;
  }

  private drawArenaGrid(cx: number, cy: number): void {
    const { ctx, canvas } = this;
    const width = canvas.width;
    const height = canvas.height;
    const now = performance.now();

    // 0. Continuous Seamless Grass Ground (covers the whole infinite world with integer-snapped +1px tiles)
    const baseTile = (this.seamlessGrassTile && this.seamlessGrassTile.complete && this.seamlessGrassTile.naturalWidth > 0)
      ? this.seamlessGrassTile
      : this.fantasyGrassTile;

    if (baseTile && baseTile.complete && baseTile.naturalWidth > 0) {
      const tileSize = Math.round(64 * this.zoom);
      const startX = Math.floor(((cx - this.cameraOffset.x * this.zoom) % tileSize + tileSize) % tileSize - tileSize);
      const startY = Math.floor(((cy - this.cameraOffset.y * this.zoom) % tileSize + tileSize) % tileSize - tileSize);

      ctx.save();
      for (let x = startX; x < width + tileSize; x += tileSize) {
        for (let y = startY; y < height + tileSize; y += tileSize) {
          ctx.drawImage(baseTile, Math.floor(x), Math.floor(y), tileSize + 1, tileSize + 1);
        }
      }
      ctx.restore();
    }

    // 0.5. Central Sacred Battlefield Clearing (-60m to +60m = 120m)
    // Feathered smoothly into the surrounding endless grass — zero lines, zero border seam!
    if (this.fantasyGrassTile && this.fantasyGrassTile.complete && this.fantasyGrassTile.naturalWidth > 0) {
      const arenaWorldSize = 120;
      const arenaSx = Math.floor(cx + (-arenaWorldSize / 2 - this.cameraOffset.x) * this.zoom);
      const arenaSy = Math.floor(cy + (-arenaWorldSize / 2 - this.cameraOffset.y) * this.zoom);
      const arenaDrawW = Math.ceil(arenaWorldSize * this.zoom);
      const arenaDrawH = Math.ceil(arenaWorldSize * this.zoom);

      if (arenaSx + arenaDrawW > 0 && arenaSx < width && arenaSy + arenaDrawH > 0 && arenaSy < height) {
        const featheredCanvas = this.getFeatheredArenaCanvas(this.fantasyGrassTile);
        ctx.save();
        ctx.drawImage(featheredCanvas, arenaSx, arenaSy, arenaDrawW, arenaDrawH);
        ctx.restore();
      }
    }

    // 1. Enchanted Pond / Lago Rúnico (Southwest Quadrant, x: -36, z: -28)
    const pondWorldX = -36;
    const pondWorldZ = -28;
    const pondRadius = 14.5;
    const pondSx = cx + (pondWorldX - this.cameraOffset.x) * this.zoom;
    const pondSy = cy + (pondWorldZ - this.cameraOffset.y) * this.zoom;
    const pondRx = pondRadius * this.zoom;
    const pondRy = pondRx * 0.58;

    if (pondSx + pondRx > 0 && pondSx - pondRx < width && pondSy + pondRy > 0 && pondSy - pondRy < height) {
      ctx.save();
      // Shoreline wet sand / moss fringe
      ctx.beginPath();
      ctx.ellipse(pondSx, pondSy, pondRx + 6, pondRy + 4, 0, 0, Math.PI * 2);
      const shoreGrad = ctx.createRadialGradient(pondSx, pondSy, pondRx * 0.7, pondSx, pondSy, pondRx + 6);
      shoreGrad.addColorStop(0, 'rgba(8, 145, 178, 0.4)');
      shoreGrad.addColorStop(0.7, 'rgba(45, 74, 34, 0.85)');
      shoreGrad.addColorStop(1, 'rgba(30, 50, 20, 0)');
      ctx.fillStyle = shoreGrad;
      ctx.fill();

      // Water body
      ctx.beginPath();
      ctx.ellipse(pondSx, pondSy, pondRx, pondRy, 0, 0, Math.PI * 2);
      const waterGrad = ctx.createRadialGradient(pondSx, pondSy - pondRy * 0.2, 5, pondSx, pondSy, pondRx);
      waterGrad.addColorStop(0, 'rgba(14, 165, 233, 0.82)');
      waterGrad.addColorStop(0.5, 'rgba(3, 105, 161, 0.90)');
      waterGrad.addColorStop(1, 'rgba(12, 74, 110, 0.96)');
      ctx.fillStyle = waterGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Animated water caustics / ripples
      const ripplePhase1 = (now * 0.0008) % 1;
      const ripplePhase2 = (now * 0.0008 + 0.5) % 1;
      for (const phase of [ripplePhase1, ripplePhase2]) {
        ctx.beginPath();
        ctx.ellipse(pondSx, pondSy, pondRx * phase, pondRy * phase, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(186, 230, 253, ${0.35 * (1 - phase)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Floating lily pads & lotus blossoms
      const pads = [
        { dx: -0.4, dy: -0.3, r: 0.12, blossom: true },
        { dx: 0.35, dy: -0.45, r: 0.09, blossom: false },
        { dx: -0.25, dy: 0.4, r: 0.14, blossom: true },
        { dx: 0.5, dy: 0.25, r: 0.11, blossom: false },
        { dx: 0.05, dy: -0.55, r: 0.08, blossom: true },
      ];
      for (const pad of pads) {
        const padX = pondSx + pad.dx * pondRx;
        const padY = pondSy + pad.dy * pondRy;
        const padR = pondRx * pad.r;
        ctx.beginPath();
        ctx.ellipse(padX, padY, padR, padR * 0.6, 0.2, 0, Math.PI * 1.8);
        ctx.fillStyle = '#15803d';
        ctx.fill();
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (pad.blossom) {
          ctx.beginPath();
          ctx.arc(padX + 2, padY - 2, Math.max(3, padR * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = '#f472b6';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(padX + 2, padY - 2, Math.max(1.5, padR * 0.2), 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 2. Swaying Tall Grass & Wildflower Patches
    for (const patch of this.floraPatches) {
      const pSx = cx + (patch.x - this.cameraOffset.x) * this.zoom;
      const pSy = cy + (patch.z - this.cameraOffset.y) * this.zoom;
      if (pSx > -50 && pSx < width + 50 && pSy > -50 && pSy < height + 50) {
        const wind = Math.sin(now * 0.0028 + patch.x * 0.6) * 4.5;
        ctx.save();
        ctx.translate(pSx, pSy);

        for (let b = -2; b <= 2; b++) {
          const bladeH = 14 + Math.abs(b) * -2;
          const bladeX = b * 4;
          const swayAmt = wind * (bladeH / 14);

          ctx.beginPath();
          ctx.moveTo(bladeX, 0);
          ctx.quadraticCurveTo(bladeX + swayAmt * 0.5, -bladeH * 0.5, bladeX + swayAmt, -bladeH);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          if (patch.type === 'flower' && Math.abs(b) === 1) {
            ctx.beginPath();
            ctx.arc(bladeX + swayAmt, -bladeH, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = patch.color;
            ctx.fill();
          } else if (patch.type === 'dandelion' && b === 0) {
            ctx.beginPath();
            ctx.arc(bladeX + swayAmt, -bladeH, 3, 0, Math.PI * 2);
            ctx.fillStyle = patch.color;
            ctx.fill();
          }
        }
        ctx.restore();
      }
    }

    // 3. Center Spawn Altar / Runic Circle (World 0,0 - located on the central stone path)
    const altarScreenX = cx + (0 - this.cameraOffset.x) * this.zoom;
    const altarScreenY = cy + (0 - this.cameraOffset.y) * this.zoom;

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

    // 4. Draw Runic Stage Portal (at diagonal coordinates 20, 20)
    if (this.runicPortalImg && this.runicPortalImg.complete && this.runicPortalImg.naturalWidth > 0) {
      const portalWorldX = 20;
      const portalWorldZ = 20;
      const pScreenX = cx + (portalWorldX - this.cameraOffset.x) * this.zoom;
      const pScreenY = cy + (portalWorldZ - this.cameraOffset.y) * this.zoom;

      const portalSize = 72;
      const pulse = Math.sin(now * 0.0035) * 6;

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
      ctx.save();
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText('PORTAL RÚNICO (FASE 2)', pScreenX, pScreenY - (portalSize + pulse) / 2 - 22);
      ctx.restore();
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

  private renderForestBreeze(now: number): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    for (const p of this.breezeParticles) {
      p.x += p.speedX;
      p.y += p.speedY + Math.sin(now * 0.002 + p.phase) * 0.35;

      if (p.x > w + 20) p.x = -20;
      if (p.y > h + 20) p.y = -20;

      const rot = (now * 0.0015 + p.phase) % (Math.PI * 2);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.45 + Math.sin(now * 0.003 + p.phase) * 0.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  private renderItemDrops(cx: number, cy: number): void {
    const { ctx } = this;
    const now = performance.now();

    if (this.activeDrops.size === 0) return;

    // Cluster drops within 2.2m radius to prevent pileup and light beacon towers
    type DropCluster = {
      drops: ActiveItemDrop[];
      x: number;
      z: number;
      topRarity: ItemRarity;
      totalGold: number;
      hasNonGold: boolean;
      topItem: ActiveItemDrop;
    };

    const clusters: DropCluster[] = [];
    const rarityRank = (r: ItemRarity): number => {
      switch (r) {
        case ItemRarity.LENDARIO: return 5;
        case ItemRarity.EPICO: return 4;
        case ItemRarity.RARO: return 3;
        case ItemRarity.INCOMUM: return 2;
        default: return 1;
      }
    };

    for (const drop of this.activeDrops.values()) {
      let matchedCluster: DropCluster | null = null;
      for (const cl of clusters) {
        const dist = Math.hypot(drop.position.x - cl.x, drop.position.z - cl.z);
        if (dist <= 2.2) {
          matchedCluster = cl;
          break;
        }
      }

      if (matchedCluster) {
        matchedCluster.drops.push(drop);
        if (drop.itemId === 'gold') matchedCluster.totalGold += drop.quantity;
        else matchedCluster.hasNonGold = true;
        if (rarityRank(drop.rarity) > rarityRank(matchedCluster.topRarity)) {
          matchedCluster.topRarity = drop.rarity;
          matchedCluster.topItem = drop;
        }
      } else {
        clusters.push({
          drops: [drop],
          x: drop.position.x,
          z: drop.position.z,
          topRarity: drop.rarity,
          totalGold: drop.itemId === 'gold' ? drop.quantity : 0,
          hasNonGold: drop.itemId !== 'gold',
          topItem: drop,
        });
      }
    }

    clusters.sort((a, b) => {
      const distA = Math.hypot(a.x - this.cameraOffset.x, a.z - this.cameraOffset.y);
      const distB = Math.hypot(b.x - this.cameraOffset.x, b.z - this.cameraOffset.y);
      return distA - distB;
    });

    let labeledCount = 0;
    for (const cluster of clusters) {
      const sx = cx + (cluster.x - this.cameraOffset.x) * this.zoom;
      const sy = cy + (cluster.z - this.cameraOffset.y) * this.zoom;

      const rarityTheme = RARITY_COLORS[cluster.topRarity] || {
        border: '#ffffff',
        glow: 'rgba(255, 255, 255, 0.4)',
        text: '#ffffff',
        bg: 'rgba(30, 41, 59, 0.6)',
      };
      const rarityColor = rarityTheme.border;
      const bobOffset = Math.sin(now * 0.005 + cluster.x) * 4;

      ctx.save();

      // 1. Single Elegant Beaming Light Pillar per cluster
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
      const isGoldOnly = !cluster.hasNonGold;
      ctx.fillStyle = isGoldOnly ? '#fbbf24' : '#f8fafc';
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
      ctx.fillText(isGoldOnly ? '💰' : '📦', sx, iconY);

      // 4. Floating Name Badge (rendered for closest clusters)
      const distToCam = Math.hypot(cluster.x - this.cameraOffset.x, cluster.z - this.cameraOffset.y);
      if (distToCam < 20.0 && labeledCount < 6) {
        labeledCount++;
        const textY = iconY - 16;
        let labelText: string;
        if (cluster.drops.length === 1) {
          const single = cluster.drops[0];
          labelText = single.quantity > 1 ? `${single.name} (${single.quantity})` : single.name;
        } else if (isGoldOnly) {
          labelText = `💰 Ouro (+${cluster.totalGold} G)`;
        } else {
          labelText = `${cluster.topItem.name} (+${cluster.drops.length - 1})`;
        }

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
