import { MONSTER_QUOTES } from './NarrativeContent';
type Actor = { id: string; name: string; type: string; currentHp: number };
export function monsterDialogueType(name: string): string | undefined {
  const normalized = name.toLowerCase();
  if (normalized.includes('grimgor') || normalized.includes('chefe goblin')) return 'goblinBoss';
  if (normalized.includes('slime')) return 'slime';
  if (normalized.includes('goblin lanceiro')) return 'lancer';
  if (normalized.includes('goblin arqueiro')) return 'archer';
  if (normalized.includes('lobo')) return 'wolf';
}
export class FloatingDialogue {
  private previous = new Map<string, number>();
  private lastByType = new Map<string, number>();
  private lastGlobal = -Infinity;
  private bubble: { entityId: string; text: string; startedAt: number } | null = null;
  constructor(private random: () => number = Math.random) {}
  observe(actors: Actor[], now: number) {
    const ids = new Set(actors.map(actor => actor.id));
    for (const id of this.previous.keys()) if (!ids.has(id)) this.previous.delete(id);
    for (const actor of actors) {
      const oldHp = this.previous.get(actor.id);
      this.previous.set(actor.id, actor.currentHp);
      if (actor.type !== 'MONSTER' || actor.currentHp <= 0) continue;
      const event = oldHp === undefined || oldHp <= 0 || actor.currentHp < oldHp;
      const type = monsterDialogueType(actor.name);
      if (!event || !type || now - this.lastGlobal < 12000 || now - (this.lastByType.get(type) ?? -Infinity) < 12000) continue;
      if (this.random() >= 0.1) continue;
      const lines = MONSTER_QUOTES[type];
      this.bubble = { entityId: actor.id, text: lines[Math.min(lines.length - 1, Math.floor(this.random() * lines.length))], startedAt: now };
      this.lastGlobal = now; this.lastByType.set(type, now);
    }
    if (this.bubble && !actors.some(actor => actor.id === this.bubble!.entityId && actor.currentHp > 0)) this.bubble = null;
  }
  current(now: number) {
    if (!this.bubble) return null;
    const age = now - this.bubble.startedAt;
    if (age >= 3000) { this.bubble = null; return null; }
    return { ...this.bubble, opacity: Math.min(1, age / 250, (3000 - age) / 250), rise: Math.min(1, age / 3000) * 15 };
  }
  reset() { this.previous.clear(); this.lastByType.clear(); this.lastGlobal = -Infinity; this.bubble = null; }
  draw(ctx: CanvasRenderingContext2D, x: number, anchorY: number, now: number) {
    const bubble = this.current(now); if (!bubble) return;
    ctx.save(); ctx.globalAlpha = Math.max(0, bubble.opacity); ctx.font = '11px Inter, sans-serif';
    const lines: string[] = []; let line = '';
    for (const word of bubble.text.split(' ')) { const next = line ? line + ' ' + word : word; if (line && ctx.measureText(next).width > 210) { lines.push(line); line = word; } else line = next; }
    if (line) lines.push(line);
    const width = Math.min(236, Math.max(90, ...lines.map(text => ctx.measureText(text).width + 24)));
    const height = lines.length * 16 + 20;
    const left = Math.max(5, Math.min(ctx.canvas.width - width - 5, x - width / 2));
    const top = Math.max(5, anchorY - height - bubble.rise);
    ctx.beginPath(); ctx.roundRect(left, top, width, height, 9); ctx.fillStyle = 'rgba(10,15,29,.94)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,215,0,.4)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#fff3c4'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    lines.forEach((text, index) => ctx.fillText(text, left + width / 2, top + 10 + index * 16)); ctx.restore();
  }
}
