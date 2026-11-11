import { ITEMS_DATABASE } from '@magicforge/shared';

export const ITEM_ICON_PATHS: Readonly<Record<string, string>> = Object.freeze({
  ...Object.fromEntries([
    'sword_iron_broadsword', 'sword_runic_tempered', 'sword_runic_bastard',
    'armor_chainmail', 'armor_runic_vigil', 'armor_titan_plate', 'shield_iron_buckler',
    'relic_ancient_forge', 'potion_hp_minor', 'potion_mp_minor', 'ore_iron_arcane', 'arcane_dust',
  ].map(id => [id, `/assets/ui/items/${id}.png`])),
  stone_forge_common: '/assets/ui/items/pedra_forja_comum.png',
  stone_forge_rare: '/assets/ui/items/pedra_forja_rara.png',
  stone_forge_mystic: '/assets/ui/items/pedra_forja_mistica.png',
  rune_fragment: '/assets/ui/items/fragmento_runico_ancestral.png',
  gem_ruby_str: '/assets/ui/items/gema_rubi_forca.png',
  gem_sapphire_int: '/assets/ui/items/gema_safira_mana.png',
  gem_emerald_dex: '/assets/ui/items/gema_esmeralda_agilidade.png',
  gem_topaz_con: '/assets/ui/items/gema_topazio_vitalidade.png',
});

/** Decorative beside an existing item name; never intercepts hover, hold or drag gestures. */
export function createItemIcon(itemId: string, fallback = ITEMS_DATABASE[itemId]?.icon ?? '📦'): HTMLElement {
  const root = document.createElement('span');
  root.className = 'mf-item-icon'; root.setAttribute('aria-hidden', 'true');
  const path = ITEM_ICON_PATHS[itemId];
  if (!path) { root.textContent = fallback; return root; }
  const image = document.createElement('img');
  image.alt = ''; image.draggable = false; image.decoding = 'async';
  image.addEventListener('error', () => root.replaceChildren(document.createTextNode(fallback)), { once: true });
  image.src = path; root.appendChild(image);
  return root;
}

export function renderItemIcon(container: HTMLElement, itemId: string, fallback?: string) {
  container.replaceChildren(createItemIcon(itemId, fallback));
}
