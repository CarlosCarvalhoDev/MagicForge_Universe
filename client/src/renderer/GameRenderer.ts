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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
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

    // Center camera on my player if available
    const myPlayer = entities.find((e) => e.id === myPlayerId);
    if (myPlayer) {
      this.cameraOffset.x = myPlayer.position.x;
      this.cameraOffset.y = myPlayer.position.z;
    }

    const screenCenterX = width / 2;
    const screenCenterY = height / 2;

    // 1. Clear background
    ctx.fillStyle = '#0f172a'; // Deep slate MMO background
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Grid & Boundaries
    this.drawArenaGrid(screenCenterX, screenCenterY);

    // 3. Draw Entities
    for (const ent of entities) {
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
        ctx.arc(rawScreenX, rawScreenY, 12, 0, Math.PI * 2);
        ctx.fillStyle = isMe ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        ctx.strokeStyle = isMe ? 'rgba(52, 211, 153, 0.5)' : 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.fill();
        ctx.setLineDash([]);
      }

      // Draw Target Reticle
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, 22, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Draw Entity Body
      ctx.beginPath();
      ctx.arc(screenX, screenY, isMonster ? (ent.maxHp > 200 ? 18 : 13) : 14, 0, Math.PI * 2);

      if (isMe) {
        ctx.fillStyle = '#10b981'; // Vibrant emerald hero
      } else if (isMonster) {
        ctx.fillStyle = ent.maxHp > 200 ? '#b91c1c' : '#ef4444'; // Red monsters (dark crimson for boss)
      } else {
        ctx.fillStyle = '#38bdf8'; // Cyan other players
      }
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isMe ? 2.5 : 1.5;
      ctx.stroke();

      // Draw Heading / Orientation line
      const rad = (ent.headingYaw * Math.PI) / 180;
      const lineLen = isMonster ? 18 : 20;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX + Math.sin(rad) * lineLen, screenY + Math.cos(rad) * lineLen);
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Name & Class Badge
      ctx.fillStyle = '#f8fafc';
      ctx.font = isMe ? 'bold 12px Inter, sans-serif' : '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      const displayName = isMe ? `⭐ ${ent.name}` : ent.name;
      ctx.fillText(displayName, screenX, screenY - 24);

      if (ent.classType) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(`[${ent.classType}]`, screenX, screenY - 14);
      }

      // Draw Health Bar
      const barWidth = 36;
      const barHeight = 4;
      const hpPercent = Math.max(0, Math.min(1, ent.currentHp / ent.maxHp));

      // Bar BG
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(screenX - barWidth / 2, screenY + 18, barWidth, barHeight);

      // Bar Fill
      ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.2 ? '#eab308' : '#ef4444';
      ctx.fillRect(screenX - barWidth / 2, screenY + 18, barWidth * hpPercent, barHeight);

      // Bar Border
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX - barWidth / 2, screenY + 18, barWidth, barHeight);
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

    // Outer Boundary Box
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(minScreenX, minScreenY, maxScreenX - minScreenX, maxScreenY - minScreenY);

    // Subtle grid lines every 10 units
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
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
