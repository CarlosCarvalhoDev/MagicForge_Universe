import { CLASS_DEFINITIONS, ITEMS_DATABASE, type CharacterClass, type CharacterSlotSummary } from '@magicforge/shared';
import { renderClassSkillShowcase } from './ClassSkillShowcase';
import { renderClassArtwork } from './WarriorStage';
import { renderHeroStats } from './HeroStats';
import { equipmentSlots, renderEquipmentSlot } from './EquipmentSlots';

export function renderHeroPreview(panel: HTMLElement, hero?: { classType: CharacterClass; character?: CharacterSlotSummary }) {
  panel.innerHTML = '<h2></h2><p></p>';
  panel.classList.toggle('has-equipped-preview', !!hero?.character);
  const heading = panel.querySelector('h2')!;
  const subtitle = panel.querySelector('p')!;
  if (!hero) {
    heading.textContent = 'Prévia do herói';
    subtitle.textContent = 'Escolha um herói na lista ou abra um pedestal vazio para conhecer as classes.';
    return;
  }

  const { classType, character } = hero;
  const className = CLASS_DEFINITIONS[classType].displayName;
  heading.textContent = character?.name || className;
  subtitle.textContent = character ? className + ' · Nv. ' + (character.level ?? '—') : 'Prévia da classe';
  const identity = document.createElement('div');
  identity.className = 'forge-inspection-identity';
  renderClassArtwork(identity, classType);
  panel.append(identity);

  if (character) {
    const details = document.createElement('div');
    details.className = 'forge-character-details';
    const stats = document.createElement('div');
    renderHeroStats(stats, character.attributes, character);
    const equipment = document.createElement('div');
    equipment.className = 'forge-equipped-slots';
    equipment.setAttribute('role', 'group');
    equipment.setAttribute('aria-label', 'Equipamentos');
    for (const key of Object.keys(equipmentSlots) as Array<keyof typeof equipmentSlots>) {
      const item = character.equippedItems?.find(entry => ITEMS_DATABASE[entry.itemId]?.equipmentSlot === equipmentSlots[key].slot);
      const slot = document.createElement('div');
      slot.className = 'equipment-slot';
      slot.setAttribute('role', 'img');
      renderEquipmentSlot(slot, key, item, !!character.equippedItems);
      equipment.append(slot);
    }
    details.append(stats);
    panel.append(equipment, details);
    return;
  }

  const abilities = document.createElement('div');
  abilities.className = 'forge-abilities';
  const title = document.createElement('h3');
  title.textContent = 'Habilidades da classe';
  abilities.append(title);
  const skills = document.createElement('div');
  renderClassSkillShowcase(skills, identity, classType);
  abilities.append(skills);
  panel.append(abilities);
}
