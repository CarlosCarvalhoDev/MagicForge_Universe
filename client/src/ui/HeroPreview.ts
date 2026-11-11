import { CLASS_DEFINITIONS, ITEMS_DATABASE, getSkillsForClass, getManaAttribute, type CharacterClass, type CharacterSlotSummary } from '@magicforge/shared';
import { skillArtUrl } from './SkillArt';

export function renderHeroPreview(panel: HTMLElement, hero?: { classType: CharacterClass; character?: CharacterSlotSummary }) {
  panel.innerHTML = '<h2></h2><p></p>';
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
  const portrait = document.createElement('img');
  portrait.src = '/assets/portraits/' + classType + '.jpg';
  portrait.alt = 'Retrato da classe ' + className;
  identity.append(portrait);
  panel.append(identity);

  if (character) {
    const details = document.createElement('div');
    details.className = 'forge-character-details';
    const stats = document.createElement('dl');
    const formatted = (value?: number) => value?.toLocaleString('pt-BR') ?? '—';
    const values = {
      CP: formatted(character.combatPower),
      Vida: formatted(character.currentHp) + ' / ' + formatted(character.maxHp),
      Ouro: formatted(character.gold),
      ...character.attributes,
    };
    for (const [label, value] of Object.entries(values)) {
      const pair = document.createElement('div');
      const term = document.createElement('dt');
      const number = document.createElement('dd');
      term.textContent = label;
      number.textContent = String(value);
      pair.append(term, number);
      stats.append(pair);
    }
    const title = document.createElement('h3');
    title.textContent = 'Equipamentos';
    const equipment = document.createElement('ul');
    for (const item of character.equippedItems ?? []) {
      const entry = document.createElement('li');
      const definition = ITEMS_DATABASE[item.itemId];
      entry.textContent = (definition?.name ?? item.itemId) + (item.refineLevel > 0 ? ' +' + item.refineLevel : '');
      equipment.append(entry);
    }
    if (!equipment.childElementCount) {
      const empty = document.createElement('li');
      empty.textContent = character.equippedItems ? 'Nenhum item equipado' : 'Dados de equipamento indisponíveis';
      equipment.append(empty);
    }
    details.append(stats, title, equipment);
    panel.append(details);
    return;
  }

  const abilities = document.createElement('div');
  abilities.className = 'forge-abilities';
  const title = document.createElement('h3');
  title.textContent = 'Habilidades da classe';
  abilities.append(title);
  const skills = getSkillsForClass(classType);
  const list = document.createElement('div');
  list.className = 'forge-skill-previews';
  const rows = new Map<number, HTMLUListElement>();
  const tooltip = document.createElement('div');
  tooltip.id = 'forge-skill-tooltip';
  tooltip.className = 'forge-skill-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  let active: HTMLButtonElement | undefined;
  const dismiss = () => {
    active?.removeAttribute('aria-describedby');
    active = undefined;
    tooltip.hidden = true;
  };
  for (const skill of skills) {
    let row = rows.get(skill.slot);
    if (!row) {
      const group = document.createElement('div');
      group.className = 'forge-skill-row';
      const label = document.createElement('span');
      label.textContent = 'Slot ' + skill.slot;
      label.id = 'forge-skill-slot-' + skill.slot;
      row = document.createElement('ul');
      row.setAttribute('aria-labelledby', label.id);
      rows.set(skill.slot, row);
      group.append(label, row);
      list.append(group);
    }
    const card = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'forge-skill-icon';
    button.setAttribute('aria-label', skill.name);
    button.dataset.classType = classType;
    const image = document.createElement('img');
    image.src = skillArtUrl(skill.skillId);
    image.alt = '';
    button.append(image);
    const reveal = () => {
      dismiss();
      active = button;
      const heading = document.createElement('strong');
      heading.textContent = skill.name;
      const requirement = document.createElement('small');
      requirement.textContent = 'Desbloqueio no nível ' + skill.unlockLevel;
      const description = document.createElement('p');
      description.textContent = skill.description;
      const cost = document.createElement('span');
      const pool = skill.resourceType === 'Mana'
        ? 100 + getManaAttribute(classType, CLASS_DEFINITIONS[classType].baseStats) * 8
        : 100;
      cost.textContent = skill.cost + ' / ' + pool + ' ' + skill.resourceType + ' base';
      const meter = document.createElement('meter');
      meter.min = 0;
      meter.max = pool;
      meter.value = skill.cost;
      meter.dataset.resource = skill.resourceType;
      meter.setAttribute('aria-label', 'Consumo: ' + cost.textContent);
      tooltip.replaceChildren(heading, requirement, description, cost, meter);
      tooltip.hidden = false;
      const anchor = button.getBoundingClientRect();
      const box = tooltip.getBoundingClientRect();
      tooltip.style.left = Math.max(8, Math.min(anchor.left, document.documentElement.clientWidth - box.width - 8)) + 'px';
      tooltip.style.top = (anchor.bottom + box.height + 16 <= window.innerHeight
        ? anchor.bottom + 8
        : Math.max(8, anchor.top - box.height - 8)) + 'px';
      button.setAttribute('aria-describedby', tooltip.id);
    };
    button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') reveal(); });
    button.addEventListener('focus', reveal);
    button.addEventListener('click', reveal);
    button.addEventListener('blur', () => { if (active === button) dismiss(); });
    button.addEventListener('keydown', event => {
      if (event.key === 'Escape' && active === button) {
        event.stopPropagation();
        dismiss();
      }
    });
    card.append(button);
    row.append(card);
  }
  abilities.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && document.activeElement !== active) dismiss();
  });
  abilities.append(list, tooltip);
  panel.append(abilities);
}
