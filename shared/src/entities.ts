import { Vector3 } from './math';

export enum EntityType {
  PLAYER = 'PLAYER',
  MONSTER = 'MONSTER',
  NPC = 'NPC',
}

export enum CharacterClass {
  CLERIGO = 'CLERIGO',
  GUERREIRO = 'GUERREIRO',
  BARBARO = 'BARBARO',
  MONGE = 'MONGE',
  BRUXO = 'BRUXO',
  MAGO = 'MAGO',
  ARQUEIRO = 'ARQUEIRO',
}

export enum PrimaryStatType {
  FORCA = 'FORCA',
  DESTREZA = 'DESTREZA',
  INTELIGENCIA = 'INTELIGENCIA',
  SABEDORIA = 'SABEDORIA',
  CARISMA = 'CARISMA',
  FORCA_E_CARISMA = 'FORCA_E_CARISMA',
}

export interface CharacterAttributes {
  forca: number;
  destreza: number;
  constituicao: number;
  inteligencia: number;
  sabedoria: number;
  carisma: number;
}

export interface ClassDefinition {
  classType: CharacterClass;
  displayName: string;
  mainStat: PrimaryStatType;
  isRanged: boolean;
  attackRange: number; // e.g. 10m for ranged, 2.5m for melee
  attackIntervalSec: number; // e.g. 1.5s
  baseSpeed: number; // e.g. 5.0 units/sec (matching Unity NavMeshAgent speed)
  baseStats: CharacterAttributes;
}

export const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition> = {
  [CharacterClass.CLERIGO]: {
    classType: CharacterClass.CLERIGO,
    displayName: 'Clérigo',
    mainStat: PrimaryStatType.SABEDORIA,
    isRanged: true,
    attackRange: 10.0,
    attackIntervalSec: 1.5,
    baseSpeed: 5.0,
    baseStats: { forca: 8, destreza: 10, constituicao: 12, inteligencia: 12, sabedoria: 16, carisma: 12 },
  },
  [CharacterClass.GUERREIRO]: {
    classType: CharacterClass.GUERREIRO,
    displayName: 'Guerreiro',
    mainStat: PrimaryStatType.FORCA_E_CARISMA,
    isRanged: false,
    attackRange: 2.5,
    attackIntervalSec: 1.2,
    baseSpeed: 5.0,
    baseStats: { forca: 15, destreza: 10, constituicao: 14, inteligencia: 8, sabedoria: 10, carisma: 13 },
  },
  [CharacterClass.BARBARO]: {
    classType: CharacterClass.BARBARO,
    displayName: 'Bárbaro',
    mainStat: PrimaryStatType.FORCA,
    isRanged: false,
    attackRange: 2.5,
    attackIntervalSec: 1.4,
    baseSpeed: 5.2,
    baseStats: { forca: 18, destreza: 12, constituicao: 16, inteligencia: 6, sabedoria: 8, carisma: 8 },
  },
  [CharacterClass.MONGE]: {
    classType: CharacterClass.MONGE,
    displayName: 'Monge',
    mainStat: PrimaryStatType.DESTREZA,
    isRanged: false,
    attackRange: 2.5,
    attackIntervalSec: 0.9,
    baseSpeed: 5.5,
    baseStats: { forca: 12, destreza: 16, constituicao: 12, inteligencia: 8, sabedoria: 14, carisma: 8 },
  },
  [CharacterClass.BRUXO]: {
    classType: CharacterClass.BRUXO,
    displayName: 'Bruxo',
    mainStat: PrimaryStatType.CARISMA,
    isRanged: true,
    attackRange: 10.0,
    attackIntervalSec: 1.5,
    baseSpeed: 5.0,
    baseStats: { forca: 8, destreza: 10, constituicao: 10, inteligencia: 12, sabedoria: 10, carisma: 18 },
  },
  [CharacterClass.MAGO]: {
    classType: CharacterClass.MAGO,
    displayName: 'Mago',
    mainStat: PrimaryStatType.INTELIGENCIA,
    isRanged: true,
    attackRange: 10.0,
    attackIntervalSec: 1.5,
    baseSpeed: 5.0,
    baseStats: { forca: 6, destreza: 10, constituicao: 10, inteligencia: 18, sabedoria: 12, carisma: 10 },
  },
  [CharacterClass.ARQUEIRO]: {
    classType: CharacterClass.ARQUEIRO,
    displayName: 'Arqueiro',
    mainStat: PrimaryStatType.DESTREZA,
    isRanged: true,
    attackRange: 12.0,
    attackIntervalSec: 1.1,
    baseSpeed: 5.2,
    baseStats: { forca: 10, destreza: 18, constituicao: 12, inteligencia: 10, sabedoria: 10, carisma: 8 },
  },
};

/**
 * Compact entity state broadcasted in the 20Hz World Snapshot
 */
export interface EntitySnapshotState {
  id: string;
  type: EntityType;
  name: string;
  position: Vector3;
  velocity: Vector3;
  headingYaw: number; // Rotation in degrees (Y-axis)
  currentHp: number;
  maxHp: number;
  currentResource?: number;
  maxResource?: number;
  resourceType?: 'Mana' | 'Energia';
  isMoving: boolean;
  targetId?: string | null;
  classType?: CharacterClass;
  level?: number;
  monsterType?: string;
}

/**
 * MMORPG Leveling Curve formula (Progressão Calibrada D&D 5E / Idle MMORPG)
 * - Níveis 1-9: Progressão inicial para aprendizado e tutoriais
 * - Níveis 10-50: Desacelera exponencialmente para exigir dedicação idle consistente
 */
export function getXpForNextLevel(level: number): number {
  if (level <= 1) return 250;
  if (level < 10) return Math.round(250 * Math.pow(level, 1.75));
  return Math.round(250 * Math.pow(level, 2.3));
}

/**
 * Título de Honra e Prestígio com base no grau de Transcendência (Reborn)
 */
export function getHonorTitle(rebornCount: number): string {
  switch (rebornCount) {
    case 0:
      return 'Cavaleiro da Forja';
    case 1:
      return 'Ascendente Astral I';
    case 2:
      return 'Semideus da Forja II';
    case 3:
      return 'Avatar Cósmico III';
    default:
      return `Titã Primordial (Grau ${rebornCount})`;
  }
}

/**
 * D&D 5e-inspired Stat Growth per Level for each Class
 */
export const CLASS_STAT_GROWTH: Record<CharacterClass, Partial<CharacterAttributes>> = {
  [CharacterClass.GUERREIRO]: { forca: 2, constituicao: 2, destreza: 1 },
  [CharacterClass.BARBARO]: { forca: 3, constituicao: 2 },
  [CharacterClass.CLERIGO]: { sabedoria: 2, constituicao: 2, forca: 1 },
  [CharacterClass.MONGE]: { destreza: 2, sabedoria: 2, constituicao: 1 },
  [CharacterClass.ARQUEIRO]: { destreza: 3, constituicao: 1, sabedoria: 1 },
  [CharacterClass.MAGO]: { inteligencia: 3, constituicao: 1, sabedoria: 1 },
  [CharacterClass.BRUXO]: { carisma: 3, constituicao: 2 },
};
