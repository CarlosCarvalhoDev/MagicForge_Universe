export type WarehouseRoom = 'exterior' | 'interior' | 'upper';
export type WarehouseTile = readonly [col: number, row: number];

export const WAREHOUSE_TILE_SIZE = 2.2;
export const WAREHOUSE_TRAIL = {
  west: -18,
  east: 8,
  westRows: [8, 9],
  eastRows: [6, 7],
} as const;
export const WAREHOUSE_ROOMS = {
  exterior: { label: 'Pátio do armazém', background: '#304b34' },
  interior: { label: 'Armazém · Térreo', background: '#211c22' },
  upper: { label: 'Armazém · Andar superior', background: '#211c22' },
} satisfies Record<WarehouseRoom, { label: string; background: string }>;

interface WarehousePassage {
  tile: WarehouseTile;
  label: string;
  room: WarehouseRoom;
  arrival: WarehouseTile;
}

export const WAREHOUSE_PASSAGES: Record<WarehouseRoom, readonly WarehousePassage[]> = {
  exterior: [{ tile: [-4, 2], label: 'Entrar', room: 'interior', arrival: [1, 5] }],
  interior: [
    { tile: [1, 6], label: 'Sair', room: 'exterior', arrival: [-4, 3] },
    { tile: [-11, -3], label: 'Subir', room: 'upper', arrival: [-7, 1] },
  ],
  upper: [{ tile: [-7, -1], label: 'Descer', room: 'interior', arrival: [-11, -1] }],
};
