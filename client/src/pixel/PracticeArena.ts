import type { InterpolatedEntity } from '../interpolation/SnapshotBuffer';

export type PracticeEvent = { id: string; action: 'attack' | 'hit' | 'death'; damage?: number };
export class PracticeArena {
  entities: InterpolatedEntity[] = [];
  defeated = 0;
  started = false;
  private lastAttack = new Map<string, number>();
  constructor() { this.reset(); }
  get hero() { return this.entities[0]; }
  reset(): void {
    this.lastAttack.clear(); this.defeated = 0; this.started = false;
    this.entities = [{ id: 'practice-hero', type: 'PLAYER', name: 'Espadachim', classType: 'GUERREIRO', level: 1, position: { x: 0, y: 0, z: 0 }, rawPosition: { x: 0, y: 0, z: 0 }, headingYaw: 0, currentHp: 160, maxHp: 160, isMoving: false }];
    [[-8, 5], [7, 6], [-9, -7], [10, -8], [15, 9], [-16, 10]].forEach(([x, z], index) => this.entities.push({
      id: `practice-mob-${index}`, type: 'MONSTER', name: index < 4 ? 'Slime' : 'Orc', position: { x, y: 0, z }, rawPosition: { x, y: 0, z }, headingYaw: 0, currentHp: index < 4 ? 60 : 100, maxHp: index < 4 ? 60 : 100, isMoving: false,
    }));
  }
  nearest(range: number): InterpolatedEntity | undefined {
    return this.entities.slice(1).filter(e => e.currentHp > 0 && Math.hypot(e.position.x - this.hero.position.x, e.position.z - this.hero.position.z) <= range).sort((a, b) => Math.hypot(a.position.x - this.hero.position.x, a.position.z - this.hero.position.z) - Math.hypot(b.position.x - this.hero.position.x, b.position.z - this.hero.position.z))[0];
  }
  step(dt: number, now: number, input: { x: number; z: number; attack: boolean; auto: boolean }): PracticeEvent[] {
    const events: PracticeEvent[] = [], hero = this.hero;
    dt = Math.max(0, Math.min(0.05, dt));
    for (const entity of this.entities) entity.isMoving = false;
    if (hero.currentHp <= 0) return events;
    if (input.x || input.z || input.attack || input.auto) this.started = true;
    if (!this.started) return events;
    let dx = input.x, dz = input.z;
    if (input.auto && !dx && !dz) {
      const target = this.nearest(24);
      if (target && Math.hypot(target.position.x - hero.position.x, target.position.z - hero.position.z) > 1.8) { dx = target.position.x - hero.position.x; dz = target.position.z - hero.position.z; }
    }
    if (dx || dz) {
      const length = Math.hypot(dx, dz); hero.headingYaw = Math.atan2(dx, dz) * 180 / Math.PI;
      hero.position.x = Math.max(-54, Math.min(54, hero.position.x + dx / length * 6 * dt));
      hero.position.z = Math.max(-54, Math.min(54, hero.position.z + dz / length * 6 * dt)); hero.isMoving = true;
    }
    const strike = (attacker: InterpolatedEntity, target: InterpolatedEntity, damage: number, cooldown: number) => {
      if (now - (this.lastAttack.get(attacker.id) ?? -Infinity) < cooldown || attacker.currentHp <= 0 || target.currentHp <= 0) return;
      this.lastAttack.set(attacker.id, now); attacker.headingYaw = Math.atan2(target.position.x - attacker.position.x, target.position.z - attacker.position.z) * 180 / Math.PI;
      events.push({ id: attacker.id, action: 'attack' }); target.currentHp = Math.max(0, target.currentHp - damage);
      events.push({ id: target.id, action: target.currentHp ? 'hit' : 'death', damage });
      if (!target.currentHp && target.type === 'MONSTER') this.defeated++;
    };
    const target = this.nearest(2.4);
    if ((input.attack || input.auto) && target) strike(hero, target, 30, 1200);
    for (const monster of this.entities.slice(1)) {
      if (!monster.currentHp || !hero.currentHp) continue;
      const x = hero.position.x - monster.position.x, z = hero.position.z - monster.position.z, distance = Math.hypot(x, z);
      if (distance > 14) continue;
      monster.headingYaw = Math.atan2(x, z) * 180 / Math.PI;
      if (distance > 1.9) { monster.position.x += x / distance * 1.7 * dt; monster.position.z += z / distance * 1.7 * dt; monster.isMoving = true; }
      else strike(monster, hero, monster.name === 'Orc' ? 12 : 5, 1700);
    }
    for (const entity of this.entities) entity.rawPosition = { ...entity.position };
    return events;
  }
}
