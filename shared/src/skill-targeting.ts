import type { SkillDefinition } from './skills';
import type { SkillCategory, SkillGeometryType } from './messages';

/** Implemented abilities that heal the caster and also damage enemies. */
export function isHybridHealingSkill(skill: SkillDefinition): boolean {
  return ['clerigo_truque_3', 'bruxo_nv2_2', 'clerigo_nv3_2'].includes(skill.skillId);
}

/** One classification for the server, automatic decisions and manual client targeting. */
export function getSkillTargeting(skill: SkillDefinition): { category: SkillCategory; geometry: SkillGeometryType; reach: number } {
  if (skill.range === 0 && !skill.isAoe) return { category:skill.isHeal ? 'SELF_HEAL' : 'SELF_BUFF', geometry:'POINT', reach:Infinity };
  if (skill.isAoe) {
    if (skill.skillId==='mago_nv1_3') return {category:'AOE_TARGET',geometry:'CONE',reach:skill.range};
    if (skill.skillId === 'guerreiro_nv2_3') return { category:'AOE_LINE', geometry:'LINE', reach:skill.range };
    if (skill.range === 0 || ['guerreiro_nv2_1','guerreiro_nv3_1','guerreiro_3','guerreiro_4','barbaro_nv1_2','barbaro_nv2_1','barbaro_nv3_1','barbaro_nv3_3'].includes(skill.skillId)) return { category:'AOE_SELF', geometry:'CIRCLE_SELF', reach:skill.aoeRadius || 5 };
    return { category:'AOE_TARGET', geometry:'CIRCLE_TARGET', reach:skill.range };
  }
  return { category:'SINGLE_TARGET', geometry:'POINT', reach:skill.range };
}

/** Remaining self-buffs have metadata, but no server effect yet. Do not spend resources on them. */
export function isSkillEffectAvailable(skill: SkillDefinition): boolean {
  return getSkillTargeting(skill).category !== 'SELF_BUFF' || ['guerreiro_nv2_2','barbaro_nv1_1','clerigo_nv1_2','mago_nv1_2','mago_nv2_3'].includes(skill.skillId);
}
