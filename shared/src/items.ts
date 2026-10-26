import { Vector3 } from './math';

export enum ItemRarity {
  COMUM = 'COMUM',
  INCOMUM = 'INCOMUM',
  RARO = 'RARO',
  EPICO = 'EPICO',
  LENDARIO = 'LENDARIO',
}

export enum ItemType {
  CONSUMIVEL = 'CONSUMIVEL',
  EQUIPAMENTO = 'EQUIPAMENTO',
  MATERIAL = 'MATERIAL',
  MOEDA = 'MOEDA',
}

export enum EquipmentSlot {
  ARMA = 'ARMA',
  ARMADURA = 'ARMADURA',
  ESCUDO = 'ESCUDO',
  ACESSORIO = 'ACESSORIO',
}

export interface ItemAttributesBonus {
  forca?: number;
  destreza?: number;
  constituicao?: number;
  inteligencia?: number;
  sabedoria?: number;
  carisma?: number;
  maxHp?: number;
  maxResource?: number;
}

export interface ItemDefinition {
  itemId: string;
  name: string;
  rarity: ItemRarity;
  type: ItemType;
  equipmentSlot?: EquipmentSlot;
  icon: string;
  description: string;
  statsBonus?: ItemAttributesBonus;
  healHp?: number;
  healResource?: number;
  sellPrice: number;
  maxStack: number;
}

export interface InventorySlot {
  slotIndex: number; // 0 to 19
  itemId: string;
  quantity: number;
  isEquipped: boolean;
}

export interface ItemDropState {
  dropId: string;
  itemId: string;
  name: string;
  rarity: ItemRarity;
  quantity: number;
  position: Vector3;
  spawnTime: number;
  despawnSec: number;
}

export const ITEMS_DATABASE: Record<string, ItemDefinition> = {
  // --- MOEDA & CONSUMÍVEIS ---
  gold: {
    itemId: 'gold',
    name: 'Moeda de Ouro',
    rarity: ItemRarity.COMUM,
    type: ItemType.MOEDA,
    icon: '🪙',
    description: 'Moeda corrente forjada no reino. Usada para compras, melhorias e forja.',
    sellPrice: 1,
    maxStack: 999999,
  },
  potion_hp_minor: {
    itemId: 'potion_hp_minor',
    name: 'Poção Menor de Vida',
    rarity: ItemRarity.COMUM,
    type: ItemType.CONSUMIVEL,
    icon: '🧪',
    description: 'Frasco com essência revitalizante. Restaura 50 pontos de Vida instantaneamente.',
    healHp: 50,
    sellPrice: 10,
    maxStack: 99,
  },
  potion_mp_minor: {
    itemId: 'potion_mp_minor',
    name: 'Poção Menor de Mana',
    rarity: ItemRarity.COMUM,
    type: ItemType.CONSUMIVEL,
    icon: '💧',
    description: 'Elixir arcano destilado. Restaura 50 pontos de Mana ou Energia.',
    healResource: 50,
    sellPrice: 15,
    maxStack: 99,
  },
  potion_hp_major: {
    itemId: 'potion_hp_major',
    name: 'Poção Maior de Vitalidade',
    rarity: ItemRarity.INCOMUM,
    type: ItemType.CONSUMIVEL,
    icon: '🍷',
    description: 'Mistura alquímica potente. Restaura 120 pontos de Vida instantaneamente.',
    healHp: 120,
    sellPrice: 40,
    maxStack: 99,
  },

  // --- MATERIAIS DE FORJA ---
  ore_iron_arcane: {
    itemId: 'ore_iron_arcane',
    name: 'Minério de Ferro Arcano',
    rarity: ItemRarity.COMUM,
    type: ItemType.MATERIAL,
    icon: '🪨',
    description: 'Minério bruto pulsando com energia mística. Essencial para forjar armas resistentes.',
    sellPrice: 8,
    maxStack: 99,
  },
  essence_goblin: {
    itemId: 'essence_goblin',
    name: 'Essência Goblin',
    rarity: ItemRarity.COMUM,
    type: ItemType.MATERIAL,
    icon: '🧫',
    description: 'Resíduo etéreo deixado por goblins. Usado em encantamentos menores de agilidade.',
    sellPrice: 12,
    maxStack: 99,
  },
  essence_slime: {
    itemId: 'essence_slime',
    name: 'Núcleo de Slime Puro',
    rarity: ItemRarity.INCOMUM,
    type: ItemType.MATERIAL,
    icon: '🟢',
    description: 'Fluido gelatinoso denso com propriedades de elasticidade e absorção de impacto.',
    sellPrice: 20,
    maxStack: 99,
  },
  wolf_fang: {
    itemId: 'wolf_fang',
    name: 'Presa de Lobo Alfa',
    rarity: ItemRarity.INCOMUM,
    type: ItemType.MATERIAL,
    icon: '🦷',
    description: 'Presa afiada como navalha. Utilizada na forja de armas com bônus de dano crítico.',
    sellPrice: 25,
    maxStack: 99,
  },
  rune_fragment: {
    itemId: 'rune_fragment',
    name: 'Fragmento Rúnico Ancestral',
    rarity: ItemRarity.RARO,
    type: ItemType.MATERIAL,
    icon: '💠',
    description: 'Pedaço de uma tábua forjada na Era dos Titãs. Permite imbuir relíquias lendárias.',
    sellPrice: 75,
    maxStack: 99,
  },

  // --- EQUIPAMENTOS (ARMAS & ARMADURAS) ---
  sword_iron_broadsword: {
    itemId: 'sword_iron_broadsword',
    name: 'Espada Larga Forjada',
    rarity: ItemRarity.INCOMUM,
    type: ItemType.EQUIPAMENTO,
    equipmentSlot: EquipmentSlot.ARMA,
    icon: '⚔️',
    description: 'Espada balanceada feita de ferro arcano. (+6 Força, +20 HP).',
    statsBonus: { forca: 6, maxHp: 20 },
    sellPrice: 80,
    maxStack: 1,
  },
  staff_apprentice: {
    itemId: 'staff_apprentice',
    name: 'Cajado do Aprendiz',
    rarity: ItemRarity.INCOMUM,
    type: ItemType.EQUIPAMENTO,
    equipmentSlot: EquipmentSlot.ARMA,
    icon: '🪄',
    description: 'Cajado de madeira entalhada canalizadora de magia. (+8 Inteligência, +30 Mana).',
    statsBonus: { inteligencia: 8, maxResource: 30 },
    sellPrice: 85,
    maxStack: 1,
  },
  bow_hunting: {
    itemId: 'bow_hunting',
    name: 'Arco de Caça Reforçado',
    rarity: ItemRarity.RARO,
    type: ItemType.EQUIPAMENTO,
    equipmentSlot: EquipmentSlot.ARMA,
    icon: '🏹',
    description: 'Feito de teixo e corda reforçada com magia élfica. (+10 Destreza, +15 HP).',
    statsBonus: { destreza: 10, maxHp: 15 },
    sellPrice: 150,
    maxStack: 1,
  },
  mace_cleric_dawn: {
    itemId: 'mace_cleric_dawn',
    name: 'Maça da Alvorada Divina',
    rarity: ItemRarity.RARO,
    type: ItemType.EQUIPAMENTO,
    equipmentSlot: EquipmentSlot.ARMA,
    icon: '🔨',
    description: 'Abençoada pela luz solar sagrada. (+10 Sabedoria, +40 HP).',
    statsBonus: { sabedoria: 10, maxHp: 40 },
    sellPrice: 160,
    maxStack: 1,
  },
  armor_chainmail: {
    itemId: 'armor_chainmail',
    name: 'Cota de Malha de Aço',
    rarity: ItemRarity.INCOMUM,
    type: ItemType.EQUIPAMENTO,
    equipmentSlot: EquipmentSlot.ARMADURA,
    icon: '🛡️',
    description: 'Elos entrelaçados para proteger órgãos vitais. (+6 Constituição, +60 HP).',
    statsBonus: { constituicao: 6, maxHp: 60 },
    sellPrice: 110,
    maxStack: 1,
  },
  robe_mystic_threads: {
    itemId: 'robe_mystic_threads',
    name: 'Manto das Marés Arcanas',
    rarity: ItemRarity.RARO,
    type: ItemType.EQUIPAMENTO,
    equipmentSlot: EquipmentSlot.ARMADURA,
    icon: '🥋',
    description: 'Tecido com fios de mana pura entrelaçados. (+10 Inteligência, +50 Mana).',
    statsBonus: { inteligencia: 10, maxResource: 50 },
    sellPrice: 170,
    maxStack: 1,
  },
  shield_iron_buckler: {
    itemId: 'shield_iron_buckler',
    name: 'Broquel de Ferro Forjado',
    rarity: ItemRarity.INCOMUM,
    type: ItemType.EQUIPAMENTO,
    equipmentSlot: EquipmentSlot.ESCUDO,
    icon: '🛡️',
    description: 'Pequeno escudo ágil para deflexão de golpes. (+5 Constituição, +30 HP).',
    statsBonus: { constituicao: 5, maxHp: 30 },
    sellPrice: 70,
    maxStack: 1,
  },
  relic_ancient_forge: {
    itemId: 'relic_ancient_forge',
    name: 'Relíquia da Forja Suprema',
    rarity: ItemRarity.LENDARIO,
    type: ItemType.EQUIPAMENTO,
    equipmentSlot: EquipmentSlot.ACESSORIO,
    icon: '👑',
    description: 'Fragmento estelar imbuído no coração da Forja Primordial. (+12 em Todos os Atributos, +150 HP, +80 Mana).',
    statsBonus: {
      forca: 12,
      destreza: 12,
      constituicao: 12,
      inteligencia: 12,
      sabedoria: 12,
      carisma: 12,
      maxHp: 150,
      maxResource: 80,
    },
    sellPrice: 1000,
    maxStack: 1,
  },
};

export const RARITY_COLORS: Record<ItemRarity, { border: string; glow: string; text: string; bg: string }> = {
  [ItemRarity.COMUM]: {
    border: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.3)',
    text: '#cbd5e1',
    bg: 'rgba(30, 41, 59, 0.6)',
  },
  [ItemRarity.INCOMUM]: {
    border: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.4)',
    text: '#4ade80',
    bg: 'rgba(20, 83, 45, 0.4)',
  },
  [ItemRarity.RARO]: {
    border: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.4)',
    text: '#38bdf8',
    bg: 'rgba(12, 74, 110, 0.4)',
  },
  [ItemRarity.EPICO]: {
    border: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.5)',
    text: '#c084fc',
    bg: 'rgba(88, 28, 135, 0.4)',
  },
  [ItemRarity.LENDARIO]: {
    border: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.6)',
    text: '#fbbf24',
    bg: 'rgba(120, 53, 15, 0.4)',
  },
};
