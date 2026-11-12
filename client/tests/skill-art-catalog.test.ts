import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CharacterClass, getSkillsForClass, SKILLS_DATABASE } from '@magicforge/shared';
import { skillArtUrl } from '../src/ui/SkillArt';

test('each canonical skill resolves to a distinct square PNG and legacy IDs resolve to the same art', () => {
  const publicRoot = new URL('../public/', import.meta.url);
  const hashes = new Set<string>();
  const canonicalIds = new Set<string>();
  for (const classType of Object.values(CharacterClass)) {
    const skills = getSkillsForClass(classType);
    assert.equal(skills.length, 12, classType);
    for (const skill of skills) {
      canonicalIds.add(skill.skillId);
      const file = new URL(skillArtUrl(skill.skillId).slice(1), publicRoot);
      const png = readFileSync(file);
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', skill.skillId);
      assert.equal(png.readUInt32BE(16), 512, skill.skillId);
      assert.equal(png.readUInt32BE(20), 512, skill.skillId);
      const hash = createHash('sha256').update(png).digest('hex');
      assert.ok(!hashes.has(hash), `Arte repetida: ${skill.skillId}`);
      hashes.add(hash);
    }
  }
  assert.equal(canonicalIds.size, 84);
  for (const [id, skill] of Object.entries(SKILLS_DATABASE)) {
    assert.ok(canonicalIds.has(skill.skillId));
    assert.equal(skillArtUrl(id), skillArtUrl(skill.skillId), id);
  }
});
