import { SKILLS_DATABASE } from '@magicforge/shared';

export function skillArtUrl(skillId: string): string {
  const canonicalId = SKILLS_DATABASE[skillId]?.skillId ?? skillId;
  return '/assets/skills/illustrated/' + canonicalId + '.png';
}
