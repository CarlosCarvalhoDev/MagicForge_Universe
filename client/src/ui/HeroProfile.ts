import { ITEMS_DATABASE, type InventoryItemPayload } from '@magicforge/shared';
import { equipmentSlots, renderEquipmentSlot } from './EquipmentSlots';
import { renderClassArtwork } from './WarriorStage';

type Slot = keyof typeof equipmentSlots;
type Vitals = { currentHp: number; maxHp: number; currentResource?: number; maxResource?: number; resourceType?: string };
type Details = {
  classType: string;
  fields: Record<string, string | number>;
  equipment: ReadonlyMap<Slot, InventoryItemPayload>;
  xp: number;
  xpGoal: number;
};

const format = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
export function setupHeroProfile(dialog: HTMLDialogElement | null) {
  const portrait = dialog?.querySelector<HTMLElement>('#hero-summary-portrait');
  const fields = Array.from(dialog?.querySelectorAll<HTMLElement>('[data-hero-summary]') ?? []);
  const slots = Array.from(dialog?.querySelectorAll<HTMLElement>('[data-profile-slot]') ?? []);
  const meters = new Map(Array.from(dialog?.querySelectorAll<HTMLElement>('[data-profile-meter]') ?? [])
    .map(row => [row.dataset.profileMeter, {
      label: row.querySelector<HTMLElement>('label'),
      progress: row.querySelector<HTMLProgressElement>('progress'),
      value: row.querySelector<HTMLElement>('[data-meter-value]'),
    }]));

  function meter(key: string, current?: number, max?: number, name?: string) {
    const row = meters.get(key);
    if (!row?.progress || !row.value) return;
    const valid = Number.isFinite(current) && Number.isFinite(max) && max! > 0;
    const limit = valid ? max! : 1;
    const value = valid ? Math.min(limit, Math.max(0, current!)) : 0;
    const text = valid ? `${format.format(value)} / ${format.format(limit)}` : '—';
    if (name && row.label && row.label.textContent !== name) row.label.textContent = name;
    if (row.progress.max !== limit) row.progress.max = limit;
    if (row.progress.value !== value) row.progress.value = value;
    if (row.value.textContent !== text) row.value.textContent = text;
  }

  return {
    render({ classType, fields: data, equipment, xp, xpGoal }: Details) {
      if (portrait) renderClassArtwork(portrait, classType);
      for (const field of fields) {
        const value = data[field.dataset.heroSummary ?? ''];
        field.textContent = typeof value === 'number' ? format.format(value) : value ?? '—';
      }
      for (const cell of slots) {
        const key = cell.dataset.profileSlot as Slot;
        const item = equipment.get(key);
        const icon = cell.querySelector<HTMLElement>('.equipment-slot');
        if (icon) renderEquipmentSlot(icon, key, item);
        const text = cell.querySelector<HTMLElement>('[data-equipped-name]');
        const itemName = item && ITEMS_DATABASE[item.itemId]?.name;
        if (text) text.textContent = itemName ? `${itemName}${item.refineLevel ? ` +${item.refineLevel}` : ''}` : 'Vazio';
      }
      meter('xp', xp, xpGoal);
    },
    updateVitals(player?: Vitals) {
      meter('hp', player?.currentHp, player?.maxHp);
      meter('resource', player?.currentResource, player?.maxResource, player?.resourceType ?? 'Recurso');
    },
  };
}
