import { Vector3 } from '@magicforge/shared';
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

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private floatingTexts: FloatingText[] = [];

  // World to screen mapping
  public zoom: number = 8.5; // pixels per world unit
  public cameraOffset = { x: 0, y: 0 };
  public showRawGhost: boolean = true;
  public selectedTargetId: string | null = null;

  // Sprite animation assets
  private knightWalkFrames: HTMLImageElement[] = [];
  private knightIdleFrames: HTMLImageElement[] = [];
  private animTimer: number = 0;
  private currentFrameIndex: number = 0;
  private spritesLoaded: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.loadKnightSprites();
  }

  private loadKnightSprites(): void {
    // Load 12 walk frames
    for (let i = 0; i < 36; i += 3) {
      const img = new Image();
      img.src = `/assets/knight/clown_export-walk_${i}.png`;
      this.knightWalkFrames.push(img);
    }

    // Load 8 idle frames
    for (let i = 0; i < 20; i += 3) {
      const img = new Image();
      img.src = `/assets/knight/clown_export-idle_2_${i}.png`;
      this.knightIdleFrames.push(img);
    }

    this.spritesLoaded = true;
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

  public render(entities: InterpolatedEntity[], myPlayerId: string | null): void {
    const { ctx, canvas } = this;
    const width = canvas.width;
    const height = canvas.height;

    // Advance animation frame counter
    this.animTimer += 0.2;
    this.currentFrameIndex = Math.floor(this.animTimer);

    // Center camera on my player if available
    const myPlayer = entities.find((e) => e.id === myPlayerId);
    if (myPlayer) {
      this.cameraOffset.x = myPlayer.position.x;
      this.cameraOffset.y = myPlayer.position.z;
    }

    const screenCenterX = width / 2;
    const screenCenterY = height / 2;

    // 1. Clear background
    ctx.fillStyle = '#0a0f1d'; // Deep slate fantasy background
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Grid, Central Runic Circle & Boundaries
    this.drawArenaGrid(screenCenterX, screenCenterY);

    // 3. Draw Entities (Monsters first, then Players on top)
    const sortedEntities = [...entities].sort((a, b) => {
      // Monsters first, players on top
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
      ctx.ellipse(screenX, screenY + 12, isMonster ? (ent.maxHp > 200 ? 20 : 14) : 16, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();

      // Draw Target Reticle
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, 26, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (!isMonster) {
        // --- RENDER HERO SPRITE (Real Animated Knight!) ---
        const frames = ent.isMoving ? this.knightWalkFrames : this.knightIdleFrames;
        const frameIndex = frames.length > 0 ? this.currentFrameIndex % frames.length : 0;
        const sprite = frames[frameIndex];

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
          const spriteWidth = 52;
          const spriteHeight = 52;
          ctx.save();
          ctx.translate(screenX, screenY);

          // Flip horizontally if moving/facing left
          const facingLeft = ent.headingYaw > 180 && ent.headingYaw < 360;
          if (facingLeft) {
            ctx.scale(-1, 1);
          }

          ctx.drawImage(sprite, -spriteWidth / 2, -spriteHeight + 14, spriteWidth, spriteHeight);
          ctx.restore();
        } else {
          // Fallback circle while loading
          ctx.beginPath();
          ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
          ctx.fillStyle = isMe ? '#10b981' : '#38bdf8';
          ctx.fill();
        }
      } else {
        // --- RENDER MONSTER BADGE ---
        const isBoss = ent.maxHp > 200;
        const radius = isBoss ? 20 : 14;

        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fillStyle = isBoss ? '#7f1d1d' : '#991b1b';
        ctx.fill();
        ctx.strokeStyle = isBoss ? '#f59e0b' : '#ef4444';
        ctx.lineWidth = isBoss ? 2.5 : 1.5;
        ctx.stroke();

        // Monster Icon / Emoji
        ctx.font = isBoss ? '16px serif' : '12px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icon = isBoss ? '💀' : ent.name.includes('Slime') ? '🧪' : ent.name.includes('Lobo') ? '🐺' : '👹';
        ctx.fillText(icon, screenX, screenY);
      }

      // Draw Orientation Arrow
      const rad = (ent.headingYaw * Math.PI) / 180;
      const lineLen = isMonster ? 18 : 22;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX + Math.sin(rad) * lineLen, screenY + Math.cos(rad) * lineLen);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Name & Class Badge
      ctx.fillStyle = '#f8fafc';
      ctx.font = isMe ? 'bold 12px Inter, sans-serif' : '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const displayName = isMe ? `⭐ ${ent.name}` : ent.name;
      ctx.fillText(displayName, screenX, screenY - 26);

      if (ent.classType) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(`[${ent.classType}]`, screenX, screenY - 16);
      }

      // Draw Health Bar
      const barWidth = 40;
      const barHeight = 5;
      const hpPercent = Math.max(0, Math.min(1, ent.currentHp / ent.maxHp));

      // Bar BG
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(screenX - barWidth / 2, screenY + 16, barWidth, barHeight);

      // Bar Fill
      ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.2 ? '#eab308' : '#ef4444';
      ctx.fillRect(screenX - barWidth / 2, screenY + 16, barWidth * hpPercent, barHeight);

      // Bar Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX - barWidth / 2, screenY + 16, barWidth, barHeight);
    }

    // 4. Draw Floating Combat Text
    this.renderFloatingText(screenCenterX, screenCenterY);
  }

  private drawArenaGrid(cx: number, cy: number): void {
    const { ctx } = this;
    const mapBounds = 60; // -60 to 60 units
    const minScreenX = cx - (mapBounds + this.cameraOffset.x) * this.zoom;
    const maxScreenX = cx + (mapBounds - this.cameraOffset.x) * this.zoom;
    const minScreenY = cy - (mapBounds + this.cameraOffset.y) * this.zoom;
    const maxScreenY = cy + (mapBounds - this.cameraOffset.y) * this.zoom;

    // Outer Boundary Box with double line and glow
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(minScreenX, minScreenY, maxScreenX - minScreenX, maxScreenY - minScreenY);

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 8;
    ctx.strokeRect(minScreenX, minScreenY, maxScreenX - minScreenX, maxScreenY - minScreenY);

    // Subtle grid lines every 10 units
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
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
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(altarScreenX, altarScreenY, 2 * this.zoom, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
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
}
