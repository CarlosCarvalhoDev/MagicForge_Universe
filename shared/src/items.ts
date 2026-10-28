import { Vector3 } from './math';
import { CharacterClass, CharacterAttributes } from './entities';

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
  GEMA = 'GEMA',
  CARTA = 'CARTA',
}

export enum EquipmentSlot {
  ARMA = 'ARMA',
  ARMADURA = 'ARMADURA',
  ESCUDO = 'ESCUDO',
  ACESSORIO = 'ACESSORIO',
  ELMO = 'ELMO',
  BOTAS = 'BOTAS',
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
  // Rigorous Class & Build Constraints
  allowedClasses?: CharacterClass[];
  minLevel?: number;
  requiredAttributes?: Partial<CharacterAttributes>;
}

export interface InventorySlot {
  slotIndex: number; // 0 to maxSlots-1
  itemId: string;
  quantity: number;
  isEquipped: boolean;
  refineLevel?: number; // +0 to +15
  sockets?: Array<{ gemId?: string }>;
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

  // --- MATERIAIS DE FORJA & REFINAMENTO ---
  stone_forge_common: {
    itemId: 'stone_forge_common',
    name: 'Pedra da Forja Comum',
    rarity: ItemRarity.COMUM,
    type: ItemType.MATERIAL,
    icon: '💎',
    description: 'Pedra rúnica básica para aprimorar armas e armaduras de +1 a +6. Dropa de monstros e reciclagem.',
    sellPrice: 50,
    maxStack: 999,
  },
  stone_forge_rare: {
    itemId: 'stone_forge_rare',
    name: 'Pedra da Forja Rara',
    rarity: ItemRarity.RARO,
    type: ItemType.MATERIAL,
    icon: '🔮',
    description: 'Pedra imbuída com chamas estelares para aprimorar de +7 a +10. Drop de Chefões de Fase.',
    sellPrice: 200,
    maxStack: 999,
  },
  stone_forge_mystic: {
    itemId: 'stone_forge_mystic',
    name: 'Pedra da Forja Mística',
    rarity: ItemRarity.EPICO,
    type: ItemType.MATERIAL,
    icon: '💠',
    description: 'Pedra suprema para aprimoramentos lendários de +11 a +15. Drop exclusivo de Chefes Mundiais.',
    sellPrice: 1000,
    maxStack: 999,
  },
  arcane_dust: {
    itemId: 'arcane_dust',
    name: 'Pó Arcano de Desmontagem',
    rarity: ItemRarity.COMUM,
    type: ItemType.MATERIAL,
    icon: '✨',
    description: 'Partículas cintilantes obtidas ao excluir ou reciclar equipamentos na mochila.',
    sellPrice: 20,
    maxStack: 999,
  },
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

  // --- GEMAS DE ENGASTE (SOCKETS) ---
  gem_ruby_str: {
    itemId: 'gem_ruby_str',
    name: 'Rubi Sangrento',
    rarity: ItemRarity.RARO,
    type: ItemType.GEMA,
    icon: '🔴',
    description: 'Gema vermelha ardente para engaste. (+12 Força, +25 Dano Físico).',
    statsBonus: { forca: 12 },
    sellPrice: 300,
    maxStack: 99,
  },
  gem_sapphire_int: {
    itemId: 'gem_sapphire_int',
    name: 'Safira das Marés',
    rarity: ItemRarity.RARO,
    type: ItemType.GEMA,
    icon: '🔵',
    description: 'Gema azul cristalina para engaste. (+12 Inteligência, +60 Mana Máxima).',
    statsBonus: { inteligencia: 12, maxResource: 60 },
    sellPrice: 300,
    maxStack: 99,
  },
  gem_emerald_dex: {
    itemId: 'gem_emerald_dex',
    name: 'Esmeralda do Vento',
    rarity: ItemRarity.RARO,
    type: ItemType.GEMA,
    icon: '🟢',
    description: 'Gema verde esmeralda para engaste. (+12 Destreza, +4% Taxa Crítica).',
    statsBonus: { destreza: 12 },
    sellPrice: 300,
    maxStack: 99,
  },
  gem_topaz_con: {
    itemId: 'gem_topaz_con',
    name: 'Topázio Solar',
    rarity: ItemRarity.RARO,
    type: ItemType.GEMA,
    icon: '🟡',
    description: 'Gema dourada reluzente para engaste. (+12 Constituição, +140 HP Máximo).',
    statsBonus: { constituicao: 12, maxHp: 140 },
    sellPrice: 300,
    maxStack: 99,
  },

  // --- EQUIPAMENTOS COM PROFICIÊNCIA & REQUISITOS ---
  sword_iron_broadsword: {
    itemId: 'sword_iron_broadsword',
    name: 'Espada Larga Forjada',
    rarity: ItemRarity.INCOMUM,
    type: ItemType.EQUIPAMENTO,
    equipmentSlot: EquipmentSlot.ARMA,
    icon: '⚔️',
    description: 'Espada balanceada feita de ferro arcano. (+6 Força, +20 HP).',
    statsBonus: { forca: 6, maxHp: 20 },
    allowedClasses: [CharacterClass.GUERREIRO, CharacterClass.BARBARO],
    minLevel: 1,
    sellPrice: 80,
    maxStack: 1,
  },
  sword_runic_bastard: {
    itemId: 'sword_runic_bastard',
    name: 'Montante Rúnico dos Titãs',
    rarity: ItemRarity.EPICO,
    type: ItemType.EQUIPAMENTO,
    equipmentSlot: EquipmentSlot.ARMA,
    icon: '🗡️',
    description: 'Lâmina colossal imbuída com o poder da Forja Ancestral. (+18 Força, +10 CON, +85 HP).',
    statsBonus: { forca: 18, constituicao: 10, maxHp: 85 },
    allowedClasses: [CharacterClass.GUERREIRO, CharacterClass.BARBARO],
    minLevel: 25,
    requiredAttributes: { forca: 28 },
    sellPrice: 450,
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
    allowedClasses: [CharacterClass.MAGO, CharacterClass.BRUXO],
    minLevel: 1,
    sellPrice: 85,
    maxStack: 1,
  },
  staff_void_astral: {
    itemId: 'staff_void_astral',
    name: 'Cajado do Vazio Astral',
    rarity: ItemRarity.EPICO,
    type: ItemType.EQUIPAMENTO,
    equipmentSlot: EquipmentSlot.ARMA,
    icon: '🔮',
    description: 'Forjado com matéria estelar condensada. (+22 Inteligência, +120 Mana).',
    statsBonus: { inteligencia: 22, maxResource: 120 },
    allowedClasses: [CharacterClass.MAGO, CharacterClass.BRUXO],
    minLevel: 25,
    requiredAttributes: { inteligencia: 30 },
    sellPrice: 480,
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
    allowedClasses: [CharacterClass.ARQUEIRO],
    minLevel: 1,
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
    allowedClasses: [CharacterClass.CLERIGO],
    minLevel: 1,
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
    allowedClasses: [CharacterClass.GUERREIRO, CharacterClass.BARBARO, CharacterClass.CLERIGO],
    minLevel: 1,
    sellPrice: 110,
    maxStack: 1,
  },
  armor_titan_plate: {
    itemId: 'armor_titan_plate',
    name: 'Armadura de Placas do Titã',
    rarity: ItemRarity.EPICO,
    type: ItemType.EQUIPAMENTO,
    equipmentSlot: EquipmentSlot.ARMADURA,
    icon: '🛡️',
    description: 'Forjada em aço temperado com sangue de dragão. (+24 Constituição, +280 HP).',
    statsBonus: { constituicao: 24, maxHp: 280 },
    allowedClasses: [CharacterClass.GUERREIRO, CharacterClass.BARBARO],
    minLevel: 25,
    requiredAttributes: { forca: 26, constituicao: 26 },
    sellPrice: 500,
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
    allowedClasses: [CharacterClass.MAGO, CharacterClass.BRUXO],
    minLevel: 1,
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
    allowedClasses: [CharacterClass.GUERREIRO, CharacterClass.CLERIGO],
    minLevel: 1,
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
    minLevel: 30,
    sellPrice: 1000,
    maxStack: 1,
  },

  // --- CARTAS COLECIONÁVEIS DE MONSTROS (ÁLBUM & ENCHANT) ---
  card_slime: {
    itemId: 'card_slime',
    name: 'Carta Slime Puro',
    rarity: ItemRarity.COMUM,
    type: ItemType.CARTA,
    icon: '🟢',
    description: 'Fluido denso que concede absorção de impacto. Bônus no Álbum: +4 CON, +60 HP Máximo.',
    statsBonus: { constituicao: 4, maxHp: 60 },
    sellPrice: 150,
    maxStack: 99,
  },
  card_goblin: {
    itemId: 'card_goblin',
    name: 'Carta Goblin Lanceiro',
    rarity: ItemRarity.COMUM,
    type: ItemType.CARTA,
    icon: '👺',
    description: 'Agilidade das sombras e ataques sorrateiros. Bônus no Álbum: +4 DEX, +15 Dano.',
    statsBonus: { destreza: 4 },
    sellPrice: 150,
    maxStack: 99,
  },
  card_wolf: {
    itemId: 'card_wolf',
    name: 'Carta Lobo Selvagem',
    rarity: ItemRarity.INCOMUM,
    type: ItemType.CARTA,
    icon: '🐺',
    description: 'Fúria da matilha e instinto predador. Bônus no Álbum: +4 FOR, +4 DEX, +40 HP.',
    statsBonus: { forca: 4, destreza: 4, maxHp: 40 },
    sellPrice: 300,
    maxStack: 99,
  },
  card_skeleton: {
    itemId: 'card_skeleton',
    name: 'Carta Esqueleto Arqueiro',
    rarity: ItemRarity.INCOMUM,
    type: ItemType.CARTA,
    icon: '💀',
    description: 'Precisão cadavérica e foco frio. Bônus no Álbum: +4 INT, +50 Mana, +2% Crítico.',
    statsBonus: { inteligencia: 4, maxResource: 50 },
    sellPrice: 300,
    maxStack: 99,
  },
  card_orc: {
    itemId: 'card_orc',
    name: 'Carta Orc Guerreiro',
    rarity: ItemRarity.RARO,
    type: ItemType.CARTA,
    icon: '👹',
    description: 'Brutalidade marcial implacável. Bônus no Álbum: +8 FOR, +8 CON, +120 HP.',
    statsBonus: { forca: 8, constituicao: 8, maxHp: 120 },
    sellPrice: 600,
    maxStack: 99,
  },
  card_boss_grimgor: {
    itemId: 'card_boss_grimgor',
    name: 'Carta Grimgor, o Destruidor',
    rarity: ItemRarity.EPICO,
    type: ItemType.CARTA,
    icon: '🗿',
    description: 'Poder telúrico do Titã da Floresta. Bônus no Álbum: +15 FOR, +12 CON, +450 HP, +10% Dano em Chefes.',
    statsBonus: { forca: 15, constituicao: 12, maxHp: 450 },
    sellPrice: 2500,
    maxStack: 99,
  },
  card_boss_frostbite: {
    itemId: 'card_boss_frostbite',
    name: 'Carta Frostbite, Dragão Glacial',
    rarity: ItemRarity.EPICO,
    type: ItemType.CARTA,
    icon: '🐉',
    description: 'Gélida essência primordial de Jotunheim. Bônus no Álbum: +15 INT, +12 SAB, +300 Mana, +8% Crítico.',
    statsBonus: { inteligencia: 15, sabedoria: 12, maxResource: 300 },
    sellPrice: 2500,
    maxStack: 99,
  },
  card_boss_ignis: {
    itemId: 'card_boss_ignis',
    name: 'Carta Ignis, Colosso de Magma',
    rarity: ItemRarity.LENDARIO,
    type: ItemType.CARTA,
    icon: '🌋',
    description: 'Fogo estelar primordial da Forja Cósmica. Bônus no Álbum: +20 FOR, +15 CON, +650 HP, +15% Dano Total.',
    statsBonus: { forca: 20, constituicao: 15, maxHp: 650 },
    sellPrice: 5000,
    maxStack: 99,
  },
};

export interface MonsterCardDefinition {
  cardId: string;
  name: string;
  rarity: ItemRarity;
  icon: string;
  image?: string;
  description: string;
  statsBonus: ItemAttributesBonus;
  equipSlotAllowed: 'ARMA' | 'ARMADURA' | 'AMBOS';
  activeEffectText: string;
}

export const CARDS_DATABASE: Record<string, MonsterCardDefinition> = {
  card_slime: {
    cardId: 'card_slime',
    name: 'Carta Slime Puro',
    rarity: ItemRarity.COMUM,
    icon: '🟢',
    image: 'assets/cards/carta_slime_puro.png',
    description: 'Fluido denso que concede absorção de impacto.',
    statsBonus: { constituicao: 4, maxHp: 60 },
    equipSlotAllowed: 'ARMADURA',
    activeEffectText: '+60 HP Máximo e +4 Constituição.',
  },
  card_goblin: {
    cardId: 'card_goblin',
    name: 'Carta Goblin Lanceiro',
    rarity: ItemRarity.COMUM,
    icon: '👺',
    image: 'assets/cards/carta_goblin_lanceiro.png',
    description: 'Agilidade das sombras e ataques sorrateiros.',
    statsBonus: { destreza: 4 },
    equipSlotAllowed: 'ARMA',
    activeEffectText: '+15 Dano Físico e +4 Destreza.',
  },
  card_wolf: {
    cardId: 'card_wolf',
    name: 'Carta Lobo Selvagem',
    rarity: ItemRarity.INCOMUM,
    icon: '🐺',
    image: 'assets/cards/carta_lobo_selvagem.png',
    description: 'Fúria da matilha e instinto predador.',
    statsBonus: { forca: 4, destreza: 4, maxHp: 40 },
    equipSlotAllowed: 'AMBOS',
    activeEffectText: '+4 Força, +4 Destreza e +40 HP.',
  },
  card_skeleton: {
    cardId: 'card_skeleton',
    name: 'Carta Esqueleto Arqueiro',
    rarity: ItemRarity.INCOMUM,
    icon: '💀',
    description: 'Precisão cadavérica e foco frio.',
    statsBonus: { inteligencia: 4, maxResource: 50 },
    equipSlotAllowed: 'ARMA',
    activeEffectText: '+4 Inteligência, +50 Mana e +2% Crítico.',
  },
  card_orc: {
    cardId: 'card_orc',
    name: 'Carta Orc Guerreiro',
    rarity: ItemRarity.RARO,
    icon: '👹',
    description: 'Brutalidade marcial implacável.',
    statsBonus: { forca: 8, constituicao: 8, maxHp: 120 },
    equipSlotAllowed: 'ARMA',
    activeEffectText: '+8 Força, +8 CON e +10% Dano Corpo-a-Corpo.',
  },
  card_boss_grimgor: {
    cardId: 'card_boss_grimgor',
    name: 'Carta Grimgor, o Destruidor',
    rarity: ItemRarity.EPICO,
    icon: '🗿',
    image: 'assets/cards/carta_chefe_grimgor.png',
    description: 'Poder telúrico do Titã da Floresta.',
    statsBonus: { forca: 15, constituicao: 12, maxHp: 450 },
    equipSlotAllowed: 'AMBOS',
    activeEffectText: '+15 FOR, +12 CON, +450 HP e +10% Dano em Chefões.',
  },
  card_boss_frostbite: {
    cardId: 'card_boss_frostbite',
    name: 'Carta Frostbite, Dragão Glacial',
    rarity: ItemRarity.EPICO,
    icon: '🐉',
    description: 'Gélida essência primordial de Jotunheim.',
    statsBonus: { inteligencia: 15, sabedoria: 12, maxResource: 300 },
    equipSlotAllowed: 'ARMA',
    activeEffectText: '+15 INT, +12 SAB, +300 Mana e +8% Crítico Mágico.',
  },
  card_boss_ignis: {
    cardId: 'card_boss_ignis',
    name: 'Carta Ignis, Colosso de Magma',
    rarity: ItemRarity.LENDARIO,
    icon: '🌋',
    description: 'Fogo estelar primordial da Forja Cósmica.',
    statsBonus: { forca: 20, constituicao: 15, maxHp: 650 },
    equipSlotAllowed: 'AMBOS',
    activeEffectText: '+20 FOR, +15 CON, +650 HP e +15% Dano Total.',
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
