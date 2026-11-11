import { ItemType } from '@magicforge/shared';

const items = '/assets/ui/items/';
const slots = '/assets/ui/slots/';
const icons = '/assets/ui/icons/';
const atlas = `${icons}inventory-book.svg`;

const itemArt: Record<string, string> = {
  gold: `${icons}icon-gold-coin.svg`,
  stone_forge_common: `${items}pedra_forja_comum.png`,
  stone_forge_rare: `${items}pedra_forja_rara.png`,
  stone_forge_mystic: `${items}pedra_forja_mistica.png`,
  gem_ruby_str: `${items}gema_rubi_forca.png`,
  gem_sapphire_int: `${items}gema_safira_mana.png`,
  gem_emerald_dex: `${items}gema_esmeralda_agilidade.png`,
  gem_topaz_con: `${items}gema_topazio_vitalidade.png`,
  rune_fragment: `${items}fragmento_runico_ancestral.png`,
};

type Symbol = 'fusion' | 'gem' | 'cards' | 'lock' | 'unlock' | 'recycle' | 'sword' | 'bow' | 'staff' | 'mace' | 'focus' | 'wraps' | 'dust' | 'ore' | 'fang' | 'heart' | 'target' | 'socket';

export function inventorySymbol(name: Symbol): string {
  return `<svg class="inventory-art" aria-hidden="true"><use href="${atlas}#${name}"></use></svg>`;
}

export function inventoryImage(source: string): string {
  return `<img class="inventory-art" src="${source}" alt="" draggable="false">`;
}

export function inventoryItemArt(itemId: string, type: ItemType, slot?: string): string {
  if (Object.hasOwn(itemArt, itemId)) return inventoryImage(itemArt[itemId]);
  if (type === ItemType.CONSUMIVEL) return inventoryImage(`${icons}icon-potion-${itemId.includes('_mp_') ? 'mp' : 'hp'}.svg`);
  if (type === ItemType.GEMA) return inventorySymbol('gem');
  if (type === ItemType.EQUIPAMENTO) {
    if (/^bow_/.test(itemId)) return inventorySymbol('bow');
    if (/^(staff|spear|polearm)_/.test(itemId)) return inventorySymbol('staff');
    if (/^(mace|hammer)_/.test(itemId)) return inventorySymbol('mace');
    if (/^wraps_/.test(itemId)) return inventorySymbol('wraps');
    if (/^(focus|tome)_/.test(itemId)) return inventorySymbol('focus');
    const piece = /^(armor|robe)_/.test(itemId) || slot === 'ARMADURA' ? 'armor'
      : /^(helmet|helm)_/.test(itemId) || slot === 'ELMO' ? 'helmet'
      : /^(boots|legs)_/.test(itemId) || slot === 'BOTAS' ? 'boots'
      : itemId.startsWith('shield_') || slot === 'ESCUDO' ? 'shield'
      : itemId.startsWith('relic_') || slot === 'ACESSORIO' ? 'relic' : 'weapon';
    return inventoryImage(`${slots}slot_${piece}.png`);
  }
  if (itemId.includes('fang')) return inventorySymbol('fang');
  if (itemId.includes('ore')) return inventorySymbol('ore');
  if (itemId.includes('slime')) return inventorySymbol('focus');
  return inventorySymbol('dust');
}
