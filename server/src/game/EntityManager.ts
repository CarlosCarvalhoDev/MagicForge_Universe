import { distance, distanceSquared, EntityType, Vector3 } from '@magicforge/shared';
import { Entity } from '../entities/Entity';
import { Player } from '../entities/Player';
import { Monster } from '../entities/Monster';

export class EntityManager {
  private entities = new Map<string, Entity>();
  private players = new Map<string, Player>();
  private monsters = new Map<string, Monster>();

  public addPlayer(player: Player): void {
    this.entities.set(player.id, player);
    this.players.set(player.id, player);
  }

  public removePlayer(playerId: string): Player | undefined {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      this.entities.delete(playerId);
    }
    return player;
  }

  public addMonster(monster: Monster): void {
    this.entities.set(monster.id, monster);
    this.monsters.set(monster.id, monster);
  }

  public removeMonster(monsterId: string): Monster | undefined {
    const monster = this.monsters.get(monsterId);
    if (monster) {
      this.monsters.delete(monsterId);
      this.entities.delete(monsterId);
    }
    return monster;
  }

  public getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  public getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  public getMonster(id: string): Monster | undefined {
    return this.monsters.get(id);
  }

  public getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  public getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  public getAllMonsters(): Monster[] {
    return Array.from(this.monsters.values());
  }

  public findNearestPlayer(origin: Vector3, maxRadius: number): Player | null {
    let nearest: Player | null = null;
    let minDistanceSq = maxRadius * maxRadius;

    for (const player of this.players.values()) {
      if (player.isDead) continue;
      const dSq = distanceSquared(origin, player.position);
      if (dSq < minDistanceSq) {
        minDistanceSq = dSq;
        nearest = player;
      }
    }

    return nearest;
  }

  public findNearestMonster(origin: Vector3, maxRadius: number): Monster | null {
    let nearest: Monster | null = null;
    let minDistanceSq = maxRadius * maxRadius;

    for (const monster of this.monsters.values()) {
      if (monster.isDead) continue;
      const dSq = distanceSquared(origin, monster.position);
      if (dSq < minDistanceSq) {
        minDistanceSq = dSq;
        nearest = monster;
      }
    }

    return nearest;
  }
}
