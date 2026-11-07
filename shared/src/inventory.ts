import { EquipmentSlot } from './items';

/** Stable legacy command addresses for equipment; bag addresses remain nonnegative. */
export const EQUIPMENT_ADDRESSES: Record<EquipmentSlot, number> = {
  [EquipmentSlot.ARMA]: -1, [EquipmentSlot.ARMADURA]: -2, [EquipmentSlot.ESCUDO]: -3,
  [EquipmentSlot.ACESSORIO]: -4, [EquipmentSlot.ELMO]: -5, [EquipmentSlot.BOTAS]: -6,
};

export function bagItems<T extends { isEquipped: boolean }>(items: readonly T[]): T[] {
  return items.filter(item => !item.isEquipped);
}
