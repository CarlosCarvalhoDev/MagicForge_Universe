import { SKILLS_DATABASE, type SkillDefinition } from './skills';

export const SKILL_MAX_LEVEL = 20;
export const SKILL_UPGRADE_MATERIAL = 'arcane_dust';
export const SKILL_UPGRADE_BASE_GOLD = 300;

export function getSkillLevel(levels: Record<string, number>, skillId: string): number {
  const canonical = SKILLS_DATABASE[skillId]?.skillId ?? skillId;
  const level = levels[canonical];
  return Number.isInteger(level) && level >= 1 && level <= SKILL_MAX_LEVEL ? level : 1;
}

export function getSkillUpgradeMultiplier(level: number): number {
  return (100 + (Math.max(1, Math.min(SKILL_MAX_LEVEL, level)) - 1) * 5) / 100;
}

/** Self buffs without a power-bearing implementation cannot consume upgrade currency. */
export function canUpgradeSkillPower(skill: SkillDefinition): boolean {
  return skill.isHeal || skill.range > 0 || skill.isAoe || ['guerreiro_nv2_2','mago_nv1_2'].includes(skill.skillId);
}

/** Solo early-game tuning from the seeded economy audit; the server derives the actual price. */
export function getSkillUpgradeCost(skill: SkillDefinition, currentLevel: number): { gold: number; dust: number } | null {
  if (!Number.isInteger(currentLevel) || currentLevel < 1 || currentLevel >= SKILL_MAX_LEVEL) return null;
  return {
    gold: Math.ceil((SKILL_UPGRADE_BASE_GOLD * skill.tier * Math.pow(1.45, currentLevel - 1)) / 10) * 10,
    dust: skill.tier * Math.ceil(currentLevel / 3),
  };
}
