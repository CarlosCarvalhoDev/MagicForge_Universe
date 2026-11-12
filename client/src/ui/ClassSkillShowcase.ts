import { CLASS_DEFINITIONS, getManaAttribute, getSkillsForClass, isSkillEffectAvailable, type CharacterClass } from '@magicforge/shared';
import { warriorCastArt } from '../renderer/HeroAnimations';
import { skillArtUrl } from './SkillArt';
import { playClassSkillArtwork } from './WarriorStage';

export function renderClassSkillShowcase(host: HTMLElement, artwork: HTMLElement, classType: CharacterClass): void {
  const rows = new Map<number, HTMLElement>();
  const layout = document.createElement('div');
  layout.className = 'forge-showcase-skill-layout';
  const controls = document.createElement('div');
  controls.className = 'forge-showcase-skill-list';
  const details = document.createElement('div');
  details.className = 'forge-showcase-skill-details';
  details.setAttribute('aria-live', 'polite');
  const name = document.createElement('strong');
  const meta = document.createElement('small');
  const mechanics = document.createElement('small');
  const description = document.createElement('p');
  const resource = document.createElement('meter');
  resource.hidden = true;
  details.append(name, meta, resource, mechanics, description);
  name.textContent = 'Escolha uma habilidade';
  description.textContent = 'Clique ou toque em um ícone para ver a prévia no painel da classe.';
  let active: HTMLButtonElement | undefined;
  for (const skill of getSkillsForClass(classType)) {
    let row = rows.get(skill.slot);
    if (!row) {
      row = document.createElement('div');
      row.className = 'forge-showcase-skill-row';
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', `Slot ${skill.slot}`);
      const label = document.createElement('span');
      label.textContent = `Slot ${skill.slot}`;
      row.append(label);
      rows.set(skill.slot, row);
      controls.append(row);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'forge-skill-icon';
    button.setAttribute('aria-label', skill.name);
    button.setAttribute('aria-pressed', 'false');
    button.title = skill.name;
    const icon = document.createElement('img');
    icon.src = skillArtUrl(skill.skillId);
    icon.alt = '';
    icon.loading = 'lazy';
    button.append(icon);
    button.addEventListener('click', () => {
      active?.setAttribute('aria-pressed', 'false');
      active = button;
      button.setAttribute('aria-pressed', 'true');
      name.textContent = skill.name;
      meta.textContent = `Nv. ${skill.unlockLevel} · ${skill.cost} ${skill.resourceType}${warriorCastArt(skill.skillId) ? '' : ' · Prévia ilustrada'}`;
      const reach = skill.range > 0 ? `${skill.range.toLocaleString('pt-BR')} m` : 'Pessoal';
      const area = skill.aoeRadius ? ` · Área: ${skill.aoeRadius.toLocaleString('pt-BR')} m` : '';
      mechanics.textContent = `Recarga: ${skill.cooldownSec.toLocaleString('pt-BR')} s · Alcance: ${reach}${area}${isSkillEffectAvailable(skill) ? '' : ' · Efeito em preparação'}`;
      const pool = skill.resourceType === 'Mana' ? 100 + getManaAttribute(classType, CLASS_DEFINITIONS[classType].baseStats) * 8 : 100;
      resource.max = pool;
      resource.value = skill.cost;
      resource.setAttribute('aria-label', `Consumo de ${skill.resourceType}: ${skill.cost} de ${pool}`);
      resource.hidden = false;
      description.textContent = skill.description;
      playClassSkillArtwork(artwork, skill.skillId, icon.src);
    });
    row.append(button);
  }
  if (rows.size === 0) description.textContent = 'As habilidades desta classe ainda não estão disponíveis para prévia.';
  layout.append(controls, details);
  host.replaceChildren(layout);
}
