import {
  CharacterAttributes,
  CharacterClass,
  CLASS_DEFINITIONS,
  CLASS_STAT_GROWTH,
  distance,
  distanceSquared,
  EntityType,
  getXpForNextLevel,
  PrimaryStatType,
  Vector3,
  cloneVector3,
  createVector3,
  EntitySnapshotState,
  InventoryItemPayload,
  ITEMS_DATABASE,
  getDefaultSkillsForClass,
  getHonorTitle,
  CardAlbumEntryPayload,
  CARDS_DATABASE,
  FarmHelperSettingsPayload,
} from '@magicforge/shared';
import { Entity } from './Entity';
import { SERVER_CONFIG } from '../config';

export class Player extends Entity {
  public readonly classType: CharacterClass;
  public baseAttributes: CharacterAttributes;
  public attributes: CharacterAttributes;
  public level: number = 1;
  public currentXp: number = 0;
  public cards: CardAlbumEntryPayload[] = [];
  public speed: number;
  public attackRange: number;
  public attackIntervalSec: number;

  public get xpToNextLevel(): number {
    return getXpForNextLevel(this.level);
  }

  // Inventory & Database
  public dbCharacterId: string = '';
  public slotIndex: number = 0;
  public rebornCount: number = 0;
  public currentWorld: number = 1;
  public currentStage: number = 1;
  public gold: number = 0;
  public maxInventorySlots: number = 20;
  public inventory: InventoryItemPayload[] = [];

  // Farm Helper (Idle Automation)
  public farmSettings: FarmHelperSettingsPayload = {
    autoHpPotionEnabled: true,
    autoHpPotionThreshold: 60,
    autoMpPotionEnabled: true,
    autoMpPotionThreshold: 40,
    autoSellCommon: false,
    autoSellUncommon: false,
    autoSellRare: false,
    autoLootEnabled: true,
  };
  public potionHpCooldownSec: number = 0;
  public potionMpCooldownSec: number = 0;

  // Resource & Skills
  public currentResource: number;
  public maxResource: number;
  public readonly resourceType: 'Mana' | 'Energia';
  public resourceRegenPerSec: number = 8.0;
  public skillCooldowns = new Map<number, number>(); // slot -> remaining seconds
  public equippedSkills: Record<number, string>;

  public targetDestination: Vector3 | null = null;
  public moveDirection: Vector3 | null = null;
  public attackTimer: number = 0;
  public lastProcessedInputSeq: number = 0;
  public deathTimer: number = 0;
  public readonly respawnDelaySec: number = 3.0; // Auto-revive em 3 segundos para fluidez nos testes

  constructor(id: string, name: string, classType: CharacterClass, initialPosition: Vector3) {
    const classDef = CLASS_DEFINITIONS[classType] || CLASS_DEFINITIONS[CharacterClass.GUERREIRO];
    // HP robusto para testes e fluidez (CON * 35 + 450)
    const maxHp = classDef.baseStats.constituicao * 35 + 450;

    super(id, EntityType.PLAYER, name, initialPosition, maxHp);

    this.classType = classType;
    this.baseAttributes = { ...classDef.baseStats };
    this.attributes = { ...classDef.baseStats };
    this.speed = classDef.baseSpeed;
    this.attackRange = classDef.attackRange;
    this.attackIntervalSec = classDef.attackIntervalSec;

    // Loadout inicial de habilidades (Slot 1, 2, 3, 4)
    this.equippedSkills = getDefaultSkillsForClass(classType);

    // Resource allocation based on class (Mana for casters, Energia for martials)
    const isCaster = classType === CharacterClass.MAGO || classType === CharacterClass.CLERIGO || classType === CharacterClass.BRUXO;
    this.resourceType = isCaster ? 'Mana' : 'Energia';
    this.maxResource = isCaster ? 100 + (this.attributes.inteligencia || this.attributes.sabedoria || 10) * 8 : 100;
    this.currentResource = this.maxResource;
  }

  public getEquippedSkill(slot: number): string {
    return this.equippedSkills[slot] || `${this.classType.toLowerCase()}_${slot}`;
  }

  public setEquippedSkill(slot: number, skillId: string): void {
    this.equippedSkills[slot] = skillId;
  }

  public get HonorTitle(): string {
    return getHonorTitle(this.rebornCount);
  }

  public recalculateStatsFromEquipment(): void {
    const classDef = CLASS_DEFINITIONS[this.classType] || CLASS_DEFINITIONS[CharacterClass.GUERREIRO];
    const growth = CLASS_STAT_GROWTH[this.classType] || {};
    const levelMult = Math.max(0, this.level - 1);

    // Atributos base da classe + evolução natural por nível
    this.baseAttributes = {
      forca: classDef.baseStats.forca + (growth.forca || 0) * levelMult,
      destreza: classDef.baseStats.destreza + (growth.destreza || 0) * levelMult,
      constituicao: classDef.baseStats.constituicao + (growth.constituicao || 0) * levelMult,
      inteligencia: classDef.baseStats.inteligencia + (growth.inteligencia || 0) * levelMult,
      sabedoria: classDef.baseStats.sabedoria + (growth.sabedoria || 0) * levelMult,
      carisma: classDef.baseStats.carisma + (growth.carisma || 0) * levelMult,
    };

    const nextAttrs: CharacterAttributes = { ...this.baseAttributes };
    let extraHpFromGear = 0;
    let extraResourceFromGear = 0;

    // 1. Bônus permanente transcendental por grau de Reborn (+10 em todos os atributos D&D 5E por Reborn)
    const rebornBonus = this.rebornCount * 10;
    nextAttrs.forca += rebornBonus;
    nextAttrs.destreza += rebornBonus;
    nextAttrs.constituicao += rebornBonus;
    nextAttrs.inteligencia += rebornBonus;
    nextAttrs.sabedoria += rebornBonus;
    nextAttrs.carisma += rebornBonus;

    // 2. Bônus de Equipamentos com Escalonamento de Refino (+8% por nível de +1 a +15) e Gemas Engastadas
    for (const slot of this.inventory) {
      if (slot.isEquipped) {
        const itemDef = ITEMS_DATABASE[slot.itemId];
        const refMultiplier = 1.0 + (slot.refineLevel || 0) * 0.08;

        if (itemDef && itemDef.statsBonus) {
          if (itemDef.statsBonus.forca) nextAttrs.forca += Math.round(itemDef.statsBonus.forca * refMultiplier);
          if (itemDef.statsBonus.destreza) nextAttrs.destreza += Math.round(itemDef.statsBonus.destreza * refMultiplier);
          if (itemDef.statsBonus.constituicao) nextAttrs.constituicao += Math.round(itemDef.statsBonus.constituicao * refMultiplier);
          if (itemDef.statsBonus.inteligencia) nextAttrs.inteligencia += Math.round(itemDef.statsBonus.inteligencia * refMultiplier);
          if (itemDef.statsBonus.sabedoria) nextAttrs.sabedoria += Math.round(itemDef.statsBonus.sabedoria * refMultiplier);
          if (itemDef.statsBonus.carisma) nextAttrs.carisma += Math.round(itemDef.statsBonus.carisma * refMultiplier);
          if (itemDef.statsBonus.maxHp) extraHpFromGear += Math.round(itemDef.statsBonus.maxHp * refMultiplier);
          if (itemDef.statsBonus.maxResource) extraResourceFromGear += Math.round(itemDef.statsBonus.maxResource * refMultiplier);
        }

        // Bônus de Gemas Engastadas no Item
        if (slot.sockets && slot.sockets.length > 0) {
          for (const s of slot.sockets) {
            const gemDef = ITEMS_DATABASE[s.gemId];
            if (gemDef && gemDef.statsBonus) {
              if (gemDef.statsBonus.forca) nextAttrs.forca += gemDef.statsBonus.forca;
              if (gemDef.statsBonus.destreza) nextAttrs.destreza += gemDef.statsBonus.destreza;
              if (gemDef.statsBonus.constituicao) nextAttrs.constituicao += gemDef.statsBonus.constituicao;
              if (gemDef.statsBonus.inteligencia) nextAttrs.inteligencia += gemDef.statsBonus.inteligencia;
              if (gemDef.statsBonus.sabedoria) nextAttrs.sabedoria += gemDef.statsBonus.sabedoria;
              if (gemDef.statsBonus.carisma) nextAttrs.carisma += gemDef.statsBonus.carisma;
              if (gemDef.statsBonus.maxHp) extraHpFromGear += gemDef.statsBonus.maxHp;
              if (gemDef.statsBonus.maxResource) extraResourceFromGear += gemDef.statsBonus.maxResource;
            }
          }
        }
      }
    }

    // 3. Bônus do Álbum de Cartas de Monstros (Passivo de Coleção + Bônus Duplo se Equipada)
    for (const card of this.cards) {
      const cardDef = CARDS_DATABASE[card.cardId];
      if (cardDef && cardDef.statsBonus) {
        const cardMultiplier = card.isEquipped ? 2.0 : 1.0;
        if (cardDef.statsBonus.forca) nextAttrs.forca += Math.round(cardDef.statsBonus.forca * cardMultiplier);
        if (cardDef.statsBonus.destreza) nextAttrs.destreza += Math.round(cardDef.statsBonus.destreza * cardMultiplier);
        if (cardDef.statsBonus.constituicao) nextAttrs.constituicao += Math.round(cardDef.statsBonus.constituicao * cardMultiplier);
        if (cardDef.statsBonus.inteligencia) nextAttrs.inteligencia += Math.round(cardDef.statsBonus.inteligencia * cardMultiplier);
        if (cardDef.statsBonus.sabedoria) nextAttrs.sabedoria += Math.round(cardDef.statsBonus.sabedoria * cardMultiplier);
        if (cardDef.statsBonus.carisma) nextAttrs.carisma += Math.round(cardDef.statsBonus.carisma * cardMultiplier);
        if (cardDef.statsBonus.maxHp) extraHpFromGear += Math.round(cardDef.statsBonus.maxHp * cardMultiplier);
        if (cardDef.statsBonus.maxResource) extraResourceFromGear += Math.round(cardDef.statsBonus.maxResource * cardMultiplier);
      }
    }

    this.attributes = nextAttrs;
    // Bônus de HP com bônus fixo transcendental (+500 HP por Reborn) e bônus de equipamentos/gemas/cartas
    this.maxHp = this.attributes.constituicao * 35 + 450 + (this.level - 1) * 60 + this.rebornCount * 500 + extraHpFromGear;
    this.currentHp = Math.min(this.currentHp, this.maxHp);

    const isCaster = this.classType === CharacterClass.MAGO || this.classType === CharacterClass.CLERIGO || this.classType === CharacterClass.BRUXO;
    if (isCaster) {
      this.maxResource = 100 + (this.attributes.inteligencia || this.attributes.sabedoria || 10) * 8 + this.rebornCount * 50 + extraResourceFromGear;
    } else {
      this.maxResource = 100 + extraResourceFromGear;
    }
  }

  public respawn(): void {
    this.isDead = false;
    this.deathTimer = 0;
    this.clearAllStatuses();
    this.currentHp = this.maxHp;
    this.currentResource = this.maxResource;
    this.position = createVector3(0, 0, 0); // Retorna seguro ao Altar Rúnico Central (0, 0)
    this.stopMoving();
    console.log(`[Player] "${this.name}" reviveu no Altar Central com HP cheio (${this.currentHp}/${this.maxHp})!`);
  }

  public get BaseDamage(): number {
    const classDef = CLASS_DEFINITIONS[this.classType];
    let modifier = 0;

    switch (classDef.mainStat) {
      case PrimaryStatType.FORCA:
        modifier = this.attributes.forca;
        break;
      case PrimaryStatType.DESTREZA:
        modifier = this.attributes.destreza;
        break;
      case PrimaryStatType.INTELIGENCIA:
        modifier = this.attributes.inteligencia;
        break;
      case PrimaryStatType.SABEDORIA:
        modifier = this.attributes.sabedoria;
        break;
      case PrimaryStatType.CARISMA:
        modifier = this.attributes.carisma;
        break;
      case PrimaryStatType.FORCA_E_CARISMA:
        modifier = this.attributes.forca + this.attributes.carisma;
        break;
    }

    const rawDamage = modifier * 3 + this.level * 5;
    // Multiplicador Transcendental: +15% de poder por Reborn e bônus de Buff Ativo (Avatar da Guerra)
    const rebornMultiplier = 1.0 + this.rebornCount * 0.15;
    return Math.round(rawDamage * rebornMultiplier * this.getDamageMultiplier());
  }

  public get CombatPower(): number {
    const { forca, destreza, constituicao, inteligencia, sabedoria, carisma } = this.attributes;
    const cpStats = (forca + destreza + constituicao + inteligencia + sabedoria + carisma) * 15;
    const cpLevel = this.level * 100;
    const cpReborn = this.rebornCount * 3500;

    // Bônus de CP por Refinamento e Gemas
    let cpRefine = 0;
    let cpGems = 0;
    for (const slot of this.inventory) {
      if (slot.isEquipped) {
        cpRefine += (slot.refineLevel || 0) * 120;
        if (slot.sockets) {
          cpGems += slot.sockets.length * 200;
        }
      }
    }

    // Bônus de CP por Cartas Colecionadas
    let cpCards = 0;
    for (const card of this.cards) {
      cpCards += 150 + (card.isEquipped ? 300 : 0);
    }

    return cpStats + cpLevel + cpReborn + cpRefine + cpGems + cpCards;
  }

  public setMoveDestination(destination: Vector3, inputSeq: number): void {
    this.targetDestination = cloneVector3(destination);
    this.moveDirection = null;
    this.lastProcessedInputSeq = inputSeq;
    this.isMoving = true;
  }

  public setMoveDirection(dir: Vector3, inputSeq: number): void {
    const magSq = dir.x * dir.x + dir.z * dir.z;
    if (magSq < 0.001) {
      this.stopMoving();
      return;
    }

    const mag = Math.sqrt(magSq);
    this.moveDirection = createVector3(dir.x / mag, 0, dir.z / mag);
    this.targetDestination = null;
    this.lastProcessedInputSeq = inputSeq;
    this.isMoving = true;
  }

  public stopMoving(): void {
    this.targetDestination = null;
    this.moveDirection = null;
    this.isMoving = false;
    this.velocity = createVector3(0, 0, 0);
  }

  public override update(deltaTimeSec: number): void {
    // Se estiver morto, avança timer de auto-revive e renasce no altar
    if (this.isDead) {
      this.deathTimer += deltaTimeSec;
      if (this.deathTimer >= this.respawnDelaySec) {
        this.respawn();
      }
      return;
    }

    // Se estiver atordoado, interrompe movimento
    if (this.isStunned()) {
      this.velocity = createVector3(0, 0, 0);
      this.isMoving = false;
      return;
    }

    // Sem autocura passiva chumbada: a sobrevivência depende exclusivamente dos atributos da classe/nível,
    // equipamentos, habilidades de cura/sustento e poções consumíveis.

    // Tick basic attack cooldown
    if (this.attackTimer > 0) {
      this.attackTimer -= deltaTimeSec;
    }

    // Tick Skill Cooldowns
    for (const [slot, cd] of this.skillCooldowns) {
      const remaining = cd - deltaTimeSec;
      if (remaining <= 0) {
        this.skillCooldowns.delete(slot);
      } else {
        this.skillCooldowns.set(slot, remaining);
      }
    }

    // Passive Resource Regeneration (Mana / Energia)
    if (this.currentResource < this.maxResource) {
      this.currentResource = Math.min(this.maxResource, this.currentResource + this.resourceRegenPerSec * deltaTimeSec);
    }

    // Tick Farm Helper Potion Cooldowns
    if (this.potionHpCooldownSec > 0) {
      this.potionHpCooldownSec = Math.max(0, this.potionHpCooldownSec - deltaTimeSec);
    }
    if (this.potionMpCooldownSec > 0) {
      this.potionMpCooldownSec = Math.max(0, this.potionMpCooldownSec - deltaTimeSec);
    }

    // Authoritative Continuous Direction Movement (Mobile Virtual Joystick)
    if (this.isMoving && this.moveDirection) {
      this.velocity.x = this.moveDirection.x * this.speed;
      this.velocity.y = 0;
      this.velocity.z = this.moveDirection.z * this.speed;

      this.headingYaw = (Math.atan2(this.moveDirection.x, this.moveDirection.z) * 180) / Math.PI;

      this.position.x += this.velocity.x * deltaTimeSec;
      this.position.z += this.velocity.z * deltaTimeSec;

      this.clampToBounds();
      return;
    }

    // Authoritative Destination Movement (Touch/Click-to-Move)
    if (this.isMoving && this.targetDestination) {
      const dx = this.targetDestination.x - this.position.x;
      const dz = this.targetDestination.z - this.position.z;
      const distSq = dx * dx + dz * dz;

      const stopDistance = 0.15;
      if (distSq <= stopDistance * stopDistance) {
        // Arrived at destination
        this.position.x = this.targetDestination.x;
        this.position.z = this.targetDestination.z;
        this.stopMoving();
      } else {
        const dist = Math.sqrt(distSq);
        const dirX = dx / dist;
        const dirZ = dz / dist;

        // Velocity vector
        this.velocity.x = dirX * this.speed;
        this.velocity.y = 0;
        this.velocity.z = dirZ * this.speed;

        // Yaw angle (degrees)
        this.headingYaw = (Math.atan2(dirX, dirZ) * 180) / Math.PI;

        // Integrate position: s = v * dt
        const moveStep = this.speed * deltaTimeSec;
        if (moveStep >= dist) {
          this.position.x = this.targetDestination.x;
          this.position.z = this.targetDestination.z;
          this.stopMoving();
        } else {
          this.position.x += dirX * moveStep;
          this.position.z += dirZ * moveStep;
        }

        // Clamp to map boundaries
        this.clampToBounds();
      }
    }
  }

  public getSkillCooldown(slot: number): number {
    return this.skillCooldowns.get(slot) || 0;
  }

  public setSkillCooldown(slot: number, durationSec: number): void {
    this.skillCooldowns.set(slot, durationSec);
  }

  public consumeResource(amount: number): boolean {
    if (this.currentResource >= amount) {
      this.currentResource -= amount;
      return true;
    }
    return false;
  }

  public restoreResource(amount: number): void {
    this.currentResource = Math.min(this.maxResource, this.currentResource + amount);
  }

  public addExperience(amount: number): { leveledUp: boolean; newLevel: number; levelsGained: number } {
    this.currentXp += amount;
    let levelsGained = 0;

    while (this.currentXp >= this.xpToNextLevel && this.level < 50) {
      this.currentXp -= this.xpToNextLevel;
      this.level += 1;
      levelsGained += 1;

      // Increment base attributes with class stat growth
      const growth = CLASS_STAT_GROWTH[this.classType] || {};
      if (growth.forca) this.baseAttributes.forca += growth.forca;
      if (growth.destreza) this.baseAttributes.destreza += growth.destreza;
      if (growth.constituicao) this.baseAttributes.constituicao += growth.constituicao;
      if (growth.inteligencia) this.baseAttributes.inteligencia += growth.inteligencia;
      if (growth.sabedoria) this.baseAttributes.sabedoria += growth.sabedoria;
      if (growth.carisma) this.baseAttributes.carisma += growth.carisma;

      // Recalculate max HP & stats and restore to 100%
      this.recalculateStatsFromEquipment();
      this.currentHp = this.maxHp;
      this.currentResource = this.maxResource;

      console.log(`[Player] "${this.name}" subiu para o NÍVEL ${this.level}! CP: ${this.CombatPower}`);
    }

    if (this.level >= 50 && this.currentXp > this.xpToNextLevel) {
      this.currentXp = this.xpToNextLevel;
    }

    return {
      leveledUp: levelsGained > 0,
      newLevel: this.level,
      levelsGained,
    };
  }

  private clampToBounds(): void {
    const { minX, maxX, minZ, maxZ } = SERVER_CONFIG.MAP_BOUNDS;
    this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
    this.position.z = Math.max(minZ, Math.min(maxZ, this.position.z));
  }

  public override toSnapshotState(): EntitySnapshotState {
    const base = super.toSnapshotState();
    return {
      ...base,
      classType: this.classType,
      currentResource: Math.round(this.currentResource),
      maxResource: this.maxResource,
      resourceType: this.resourceType,
      level: this.level,
    };
  }
}
