import type { CharacterSlotSummary } from '@magicforge/shared';

const attributes = [
  ['forca', 'Força', '⚔'], ['destreza', 'Destreza', '➶'], ['constituicao', 'Constituição', '⛨'],
  ['inteligencia', 'Inteligência', '✦'], ['sabedoria', 'Sabedoria', '☉'], ['carisma', 'Carisma', '♛'],
] as const;
const format = (value?: number) => value?.toLocaleString('pt-BR') ?? '—';

export function renderHeroStats(host: HTMLElement, values?: CharacterSlotSummary['attributes'], hero?: CharacterSlotSummary): void {
  function grid(label: string, entries: readonly (readonly [string, string, string])[]): HTMLDListElement {
    const list = document.createElement('dl');
    list.className = 'forge-stat-grid';
    list.setAttribute('aria-label', label);
    for (const [name, icon, value] of entries) {
      const card = document.createElement('div');
      const term = document.createElement('dt');
      const number = document.createElement('dd');
      const glyph = document.createElement('span');
      glyph.className = 'forge-stat-icon';
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = icon;
      term.append(glyph, document.createTextNode(name));
      number.textContent = value;
      card.append(term, number);
      list.append(card);
    }
    return list;
  }
  const base = grid(hero ? 'Atributos do herói' : 'Atributos iniciais', attributes.map(([key, label, icon]) => [label, icon, format(values?.[key])]));
  if (!hero) {
    host.replaceChildren(base);
    return;
  }
  const status = grid('Status do herói', [
    ['Poder de combate', '⚔', format(hero.combatPower)],
    ['Vida', '♥', `${format(hero.currentHp)} / ${format(hero.maxHp)}`],
    ['Ouro', '◉', format(hero.gold)],
  ]);
  host.replaceChildren(status, base);
}
