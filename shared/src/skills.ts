import { CharacterClass, CharacterAttributes } from './entities';
import { Vector3 } from './math';

export interface SkillDefinition {
  skillId: string;
  slot: number; // 1, 2, 3, 4
  tier: number; // 1 (Nv 1), 2 (Nv 10), 3 (Nv 25), 4 (Nv 50)
  unlockLevel: number;
  name: string;
  classType: CharacterClass;
  cost: number;
  resourceType: 'Mana' | 'Energia';
  cooldownSec: number;
  range: number; // meters (0 = personal/self)
  isAoe: boolean;
  aoeRadius?: number;
  isHeal: boolean;
  damageType: string;
  description: string;
}

// Complete 28 Skills Registry derived from SISTEMA_SKILLS_DND5E.json
export const SKILLS_DATABASE: Record<string, SkillDefinition> = {
  // --- GUERREIRO (STR | Energia) ---
  'guerreiro_1': {
    skillId: 'guerreiro_1',
    slot: 1,
    tier: 1,
    unlockLevel: 1,
    name: 'Ataque Poderoso',
    classType: CharacterClass.GUERREIRO,
    cost: 15,
    resourceType: 'Energia',
    cooldownSec: 4.0,
    range: 3.0,
    isAoe: false,
    isHeal: false,
    damageType: 'Físico',
    description: 'Golpe pesado com espada longa. Causa dano físico elevado (1.5x STR).',
  },
  'guerreiro_2': {
    skillId: 'guerreiro_2',
    slot: 2,
    tier: 2,
    unlockLevel: 10,
    name: 'Retomar o Fôlego',
    classType: CharacterClass.GUERREIRO,
    cost: 25,
    resourceType: 'Energia',
    cooldownSec: 12.0,
    range: 0,
    isAoe: false,
    isHeal: true,
    damageType: 'Cura',
    description: 'Recupera Vida instantaneamente com vigor marcial (1.2x STR + Nível).',
  },
  'guerreiro_3': {
    skillId: 'guerreiro_3',
    slot: 3,
    tier: 3,
    unlockLevel: 25,
    name: 'Golpe Amplo',
    classType: CharacterClass.GUERREIRO,
    cost: 40,
    resourceType: 'Energia',
    cooldownSec: 14.0,
    range: 4.0,
    isAoe: true,
    aoeRadius: 4.5,
    isHeal: false,
    damageType: 'Físico (Área)',
    description: 'Giro devastador de 360° em área, causando dano e atordoando inimigos.',
  },
  'guerreiro_4': {
    skillId: 'guerreiro_4',
    slot: 4,
    tier: 4,
    unlockLevel: 50,
    name: 'Avatar da Fúria',
    classType: CharacterClass.GUERREIRO,
    cost: 70,
    resourceType: 'Energia',
    cooldownSec: 45.0,
    range: 6.0,
    isAoe: true,
    aoeRadius: 6.0,
    isHeal: false,
    damageType: 'Físico Supremo',
    description: 'Explosão sísmica dourada em área (3.0x STR) e bônus devastador de combate.',
  },

  // --- CLÉRIGO (WIS | Mana) ---
  'clerigo_1': {
    skillId: 'clerigo_1',
    slot: 1,
    tier: 1,
    unlockLevel: 1,
    name: 'Chama Sagrada',
    classType: CharacterClass.CLERIGO,
    cost: 15,
    resourceType: 'Mana',
    cooldownSec: 3.5,
    range: 12.0,
    isAoe: false,
    isHeal: false,
    damageType: 'Radiante',
    description: 'Feixe de luz celestial no inimigo (1.4x WIS) e ricochete de cura.',
  },
  'clerigo_2': {
    skillId: 'clerigo_2',
    slot: 2,
    tier: 2,
    unlockLevel: 10,
    name: 'Arma Espiritual',
    classType: CharacterClass.CLERIGO,
    cost: 35,
    resourceType: 'Mana',
    cooldownSec: 14.0,
    range: 10.0,
    isAoe: false,
    isHeal: false,
    damageType: 'Radiante',
    description: 'Invoca uma maça espectral dourada que ataca repetidamente o alvo.',
  },
  'clerigo_3': {
    skillId: 'clerigo_3',
    slot: 3,
    tier: 3,
    unlockLevel: 25,
    name: 'Guardiões Espirituais',
    classType: CharacterClass.CLERIGO,
    cost: 55,
    resourceType: 'Mana',
    cooldownSec: 18.0,
    range: 0,
    isAoe: true,
    aoeRadius: 5.0,
    isHeal: false,
    damageType: 'Radiante (Área)',
    description: 'Espíritos orbitam o clérigo causando dano contínuo e lentidão.',
  },
  'clerigo_4': {
    skillId: 'clerigo_4',
    slot: 4,
    tier: 4,
    unlockLevel: 50,
    name: 'Coluna de Chamas Divinas',
    classType: CharacterClass.CLERIGO,
    cost: 90,
    resourceType: 'Mana',
    cooldownSec: 45.0,
    range: 10.0,
    isAoe: true,
    aoeRadius: 5.5,
    isHeal: true,
    damageType: 'Fogo/Radiante Supremo',
    description: 'Cilindro colossal de fogo e luz: incinera inimigos e cura aliados em massa.',
  },

  // --- MAGO (INT | Mana) ---
  'mago_1': {
    skillId: 'mago_1',
    slot: 1,
    tier: 1,
    unlockLevel: 1,
    name: 'Raio de Fogo',
    classType: CharacterClass.MAGO,
    cost: 12,
    resourceType: 'Mana',
    cooldownSec: 3.0,
    range: 12.0,
    isAoe: false,
    isHeal: false,
    damageType: 'Fogo',
    description: 'Projétil de fogo arcano que queima o alvo (1.6x INT).',
  },
  'mago_2': {
    skillId: 'mago_2',
    slot: 2,
    tier: 2,
    unlockLevel: 10,
    name: 'Lâmina Flamejante Arcana',
    classType: CharacterClass.MAGO,
    cost: 35,
    resourceType: 'Mana',
    cooldownSec: 10.0,
    range: 10.0,
    isAoe: false,
    isHeal: false,
    damageType: 'Fogo',
    description: 'Conjura 3 lâminas de fogo em rápida sucessão, derretendo resistências.',
  },
  'mago_3': {
    skillId: 'mago_3',
    slot: 3,
    tier: 3,
    unlockLevel: 25,
    name: 'Bola de Fogo',
    classType: CharacterClass.MAGO,
    cost: 60,
    resourceType: 'Mana',
    cooldownSec: 16.0,
    range: 12.0,
    isAoe: true,
    aoeRadius: 5.5,
    isHeal: false,
    damageType: 'Fogo em Área',
    description: 'A clássica Fireball do D&D! Detona uma esfera colossal de fogo (2.2x INT).',
  },
  'mago_4': {
    skillId: 'mago_4',
    slot: 4,
    tier: 4,
    unlockLevel: 50,
    name: 'Desintegração Arcana',
    classType: CharacterClass.MAGO,
    cost: 95,
    resourceType: 'Mana',
    cooldownSec: 45.0,
    range: 14.0,
    isAoe: false,
    isHeal: false,
    damageType: 'Energia Pura (Force)',
    description: 'Feixe concentrado de desintegração verde-violeta (3.5x INT).',
  },

  // --- ARQUEIRO (DEX | Energia) ---
  'arqueiro_1': {
    skillId: 'arqueiro_1',
    slot: 1,
    tier: 1,
    unlockLevel: 1,
    name: 'Disparo com Marca',
    classType: CharacterClass.ARQUEIRO,
    cost: 15,
    resourceType: 'Energia',
    cooldownSec: 4.0,
    range: 14.0,
    isAoe: false,
    isHeal: false,
    damageType: 'Físico',
    description: 'Aplica Marca do Caçador por 5s, somando dano bônus em cada ataque.',
  },
  'arqueiro_2': {
    skillId: 'arqueiro_2',
    slot: 2,
    tier: 2,
    unlockLevel: 10,
    name: 'Flecha Espinhosa',
    classType: CharacterClass.ARQUEIRO,
    cost: 30,
    resourceType: 'Energia',
    cooldownSec: 11.0,
    range: 12.0,
    isAoe: true,
    aoeRadius: 3.5,
    isHeal: false,
    damageType: 'Físico / Raízes',
    description: 'Explode em vinhas que enraízam os inimigos e causam sangramento.',
  },
  'arqueiro_3': {
    skillId: 'arqueiro_3',
    slot: 3,
    tier: 3,
    unlockLevel: 25,
    name: 'Saraivada Relâmpago',
    classType: CharacterClass.ARQUEIRO,
    cost: 45,
    resourceType: 'Energia',
    cooldownSec: 15.0,
    range: 12.0,
    isAoe: true,
    aoeRadius: 5.0,
    isHeal: false,
    damageType: 'Elétrico em Área',
    description: 'Chuva de dezenas de flechas eletrificadas com dano e lentidão de 50%.',
  },
  'arqueiro_4': {
    skillId: 'arqueiro_4',
    slot: 4,
    tier: 4,
    unlockLevel: 50,
    name: 'Tempestade de Flechas',
    classType: CharacterClass.ARQUEIRO,
    cost: 75,
    resourceType: 'Energia',
    cooldownSec: 45.0,
    range: 14.0,
    isAoe: true,
    aoeRadius: 6.5,
    isHeal: false,
    damageType: 'Físico Supremo',
    description: 'Bombardeia o campo com centenas de flechas espectrais e aumenta a velocidade.',
  },

  // --- BÁRBARO (STR | Fúria/Energia) ---
  'barbaro_1': {
    skillId: 'barbaro_1',
    slot: 1,
    tier: 1,
    unlockLevel: 1,
    name: 'Golpe Imprudente',
    classType: CharacterClass.BARBARO,
    cost: 15,
    resourceType: 'Energia',
    cooldownSec: 3.5,
    range: 3.0,
    isAoe: false,
    isHeal: false,
    damageType: 'Físico',
    description: 'Golpe selvagem brutal com altíssima chance de Acerto Crítico (1.6x STR).',
  },
  'barbaro_2': {
    skillId: 'barbaro_2',
    slot: 2,
    tier: 2,
    unlockLevel: 10,
    name: 'Fúria Berserker',
    classType: CharacterClass.BARBARO,
    cost: 30,
    resourceType: 'Energia',
    cooldownSec: 14.0,
    range: 0,
    isAoe: false,
    isHeal: false,
    damageType: 'Buff Pessoal',
    description: 'Entra em fúria por 8s, ganhando +25% de dano e redução de dano sofrido.',
  },
  'barbaro_3': {
    skillId: 'barbaro_3',
    slot: 3,
    tier: 3,
    unlockLevel: 25,
    name: 'Salto Esmagador',
    classType: CharacterClass.BARBARO,
    cost: 45,
    resourceType: 'Energia',
    cooldownSec: 15.0,
    range: 8.0,
    isAoe: true,
    aoeRadius: 4.5,
    isHeal: false,
    damageType: 'Físico em Área',
    description: 'Salta sobre o alvo e esmaga o chão, atordoando todos ao redor.',
  },
  'barbaro_4': {
    skillId: 'barbaro_4',
    slot: 4,
    tier: 4,
    unlockLevel: 50,
    name: 'Terremoto da Fera Titânica',
    classType: CharacterClass.BARBARO,
    cost: 75,
    resourceType: 'Energia',
    cooldownSec: 45.0,
    range: 6.0,
    isAoe: true,
    aoeRadius: 6.5,
    isHeal: false,
    damageType: 'Físico Supremo',
    description: 'Esmaga o solo rachando a terra e derrubando todos os inimigos (3.2x STR).',
  },

  // --- MONGE (DEX | Chi/Energia) ---
  'monge_1': {
    skillId: 'monge_1',
    slot: 1,
    tier: 1,
    unlockLevel: 1,
    name: 'Rajada de Golpes',
    classType: CharacterClass.MONGE,
    cost: 15,
    resourceType: 'Energia',
    cooldownSec: 3.0,
    range: 2.5,
    isAoe: false,
    isHeal: false,
    damageType: 'Físico Rápido',
    description: 'Sequência de socos velozes atingindo os pontos vitais com bônus de DEX.',
  },
  'monge_2': {
    skillId: 'monge_2',
    slot: 2,
    tier: 2,
    unlockLevel: 10,
    name: 'Golpe Atordoante (Chi)',
    classType: CharacterClass.MONGE,
    cost: 25,
    resourceType: 'Energia',
    cooldownSec: 10.0,
    range: 2.5,
    isAoe: false,
    isHeal: false,
    damageType: 'Controle de Grupo',
    description: 'Interrompe o fluxo de Chi do inimigo, atordoando-o (Stun) por 2 segundos.',
  },
  'monge_3': {
    skillId: 'monge_3',
    slot: 3,
    tier: 3,
    unlockLevel: 25,
    name: 'Chute Vendaval de Chi',
    classType: CharacterClass.MONGE,
    cost: 40,
    resourceType: 'Energia',
    cooldownSec: 13.0,
    range: 3.5,
    isAoe: true,
    aoeRadius: 4.0,
    isHeal: false,
    damageType: 'Físico em Área',
    description: 'Giro aéreo em espiral gerando lâminas de vento que empurram os inimigos.',
  },
  'monge_4': {
    skillId: 'monge_4',
    slot: 4,
    tier: 4,
    unlockLevel: 50,
    name: 'Palma Trêmula dos Sete Dragões',
    classType: CharacterClass.MONGE,
    cost: 70,
    resourceType: 'Energia',
    cooldownSec: 45.0,
    range: 3.0,
    isAoe: false,
    isHeal: false,
    damageType: 'Chi Supremo',
    description: 'A lendária Quivering Palm: vibrações letais explodem no coração do alvo.',
  },

  // --- BRUXO (CHA | Pacto/Mana) ---
  'bruxo_1': {
    skillId: 'bruxo_1',
    slot: 1,
    tier: 1,
    unlockLevel: 1,
    name: 'Rajada Mística',
    classType: CharacterClass.BRUXO,
    cost: 12,
    resourceType: 'Mana',
    cooldownSec: 3.0,
    range: 12.0,
    isAoe: false,
    isHeal: false,
    damageType: 'Energia Sombria (Eldritch)',
    description: 'O famoso Eldritch Blast do D&D 5e: feixe crepitante de energia mística pura.',
  },
  'bruxo_2': {
    skillId: 'bruxo_2',
    slot: 2,
    tier: 2,
    unlockLevel: 10,
    name: 'Maldição de Hadar',
    classType: CharacterClass.BRUXO,
    cost: 30,
    resourceType: 'Mana',
    cooldownSec: 12.0,
    range: 10.0,
    isAoe: false,
    isHeal: false,
    damageType: 'Sombra',
    description: 'Amaldiçoa o alvo, drenando vida e reduzindo sua velocidade de ataque.',
  },
  'bruxo_3': {
    skillId: 'bruxo_3',
    slot: 3,
    tier: 3,
    unlockLevel: 25,
    name: 'Braços de Hadar (Tentáculos)',
    classType: CharacterClass.BRUXO,
    cost: 50,
    resourceType: 'Mana',
    cooldownSec: 16.0,
    range: 0,
    isAoe: true,
    aoeRadius: 5.0,
    isHeal: false,
    damageType: 'Necrótico em Área',
    description: 'Tentáculos de trevas emergem do chão, chicoteando e silenciando os alvos.',
  },
  'bruxo_4': {
    skillId: 'bruxo_4',
    slot: 4,
    tier: 4,
    unlockLevel: 50,
    name: 'Viagem ao Vazio Entrópico',
    classType: CharacterClass.BRUXO,
    cost: 85,
    resourceType: 'Mana',
    cooldownSec: 45.0,
    range: 10.0,
    isAoe: true,
    aoeRadius: 6.0,
    isHeal: false,
    damageType: 'Caos Supremo',
    description: 'Abre uma fenda do Vazio cósmico que suga todos os inimigos e implode.',
  },
};

/**
 * Retorna as 4 habilidades da classe ordenadas pelo slot (1 a 4)
 */
export function getClassSkills(classType: CharacterClass): SkillDefinition[] {
  const prefix = classType.toLowerCase();
  const skills: SkillDefinition[] = [];
  for (let slot = 1; slot <= 4; slot++) {
    const skill = SKILLS_DATABASE[`${prefix}_${slot}`];
    if (skill) skills.push(skill);
  }
  return skills;
}

/**
 * Calcula o dano ou cura de uma habilidade com base nos atributos do personagem
 */
export function calculateSkillPower(skill: SkillDefinition, stats: CharacterAttributes, level: number): number {
  let modifier = 0;
  switch (skill.classType) {
    case CharacterClass.GUERREIRO:
    case CharacterClass.BARBARO:
      modifier = stats.forca;
      break;
    case CharacterClass.CLERIGO:
      modifier = stats.sabedoria;
      break;
    case CharacterClass.MAGO:
      modifier = stats.inteligencia;
      break;
    case CharacterClass.ARQUEIRO:
    case CharacterClass.MONGE:
      modifier = stats.destreza;
      break;
    case CharacterClass.BRUXO:
      modifier = stats.carisma;
      break;
  }

  // Escalonamento por Tier (1: 1.5x, 2: 1.8x, 3: 2.2x, 4: 3.5x)
  const multipliers = [0, 1.5, 1.8, 2.4, 3.8];
  const mult = multipliers[skill.slot] || 1.5;

  const baseRoll = Math.floor(Math.random() * 8) + 4; // Simula rolagem de dados D&D
  return Math.round(baseRoll + modifier * mult + level * 4);
}
