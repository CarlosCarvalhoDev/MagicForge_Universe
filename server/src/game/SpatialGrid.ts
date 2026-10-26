import { distanceSquared, Vector3 } from '@magicforge/shared';
import { Entity } from '../entities/Entity';
import { SERVER_CONFIG } from '../config';

export class SpatialGrid {
  public readonly cellSize: number;
  public readonly minX: number;
  public readonly maxX: number;
  public readonly minZ: number;
  public readonly maxZ: number;

  public readonly cols: number;
  public readonly rows: number;

  // Grid cells: map of cellKey -> Set<Entity>
  private cells = new Map<string, Set<Entity>>();
  // Cache of entityId -> cellKey
  private entityCellMap = new Map<string, string>();

  constructor(cellSize = 20.0) {
    this.cellSize = cellSize;
    this.minX = SERVER_CONFIG.MAP_BOUNDS.minX;
    this.maxX = SERVER_CONFIG.MAP_BOUNDS.maxX;
    this.minZ = SERVER_CONFIG.MAP_BOUNDS.minZ;
    this.maxZ = SERVER_CONFIG.MAP_BOUNDS.maxZ;

    const width = this.maxX - this.minX;
    const height = this.maxZ - this.minZ;

    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);

    // Initialize cells
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        this.cells.set(`${c}_${r}`, new Set<Entity>());
      }
    }
  }

  public getCellCoordinates(pos: Vector3): { col: number; row: number } {
    const clampedX = Math.max(this.minX, Math.min(this.maxX - 0.001, pos.x));
    const clampedZ = Math.max(this.minZ, Math.min(this.maxZ - 0.001, pos.z));

    const col = Math.floor((clampedX - this.minX) / this.cellSize);
    const row = Math.floor((clampedZ - this.minZ) / this.cellSize);

    return {
      col: Math.max(0, Math.min(this.cols - 1, col)),
      row: Math.max(0, Math.min(this.rows - 1, row)),
    };
  }

  public getCellKey(col: number, row: number): string {
    return `${col}_${row}`;
  }

  public updateEntity(entity: Entity): void {
    const { col, row } = this.getCellCoordinates(entity.position);
    const newCellKey = this.getCellKey(col, row);
    const oldCellKey = this.entityCellMap.get(entity.id);

    if (oldCellKey === newCellKey) {
      return; // Still in the same cell
    }

    // Remove from previous cell
    if (oldCellKey) {
      const oldCell = this.cells.get(oldCellKey);
      oldCell?.delete(entity);
    }

    // Add to new cell
    let newCell = this.cells.get(newCellKey);
    if (!newCell) {
      newCell = new Set<Entity>();
      this.cells.set(newCellKey, newCell);
    }
    newCell.add(entity);
    this.entityCellMap.set(entity.id, newCellKey);
  }

  public removeEntity(entityId: string): void {
    const cellKey = this.entityCellMap.get(entityId);
    if (cellKey) {
      const cell = this.cells.get(cellKey);
      if (cell) {
        for (const ent of cell) {
          if (ent.id === entityId) {
            cell.delete(ent);
            break;
          }
        }
      }
      this.entityCellMap.delete(entityId);
    }
  }

  /**
   * Get all entities within Area of Interest (AOI) of a given position
   * Queries the center cell and its 8 neighboring cells, filtering by visibility radius
   */
  public getEntitiesInAOI(origin: Vector3, visibilityRadius = SERVER_CONFIG.VISIBILITY_RADIUS): Entity[] {
    const { col, row } = this.getCellCoordinates(origin);
    const results: Entity[] = [];
    const maxDistSq = visibilityRadius * visibilityRadius;

    // 3x3 cell neighborhood
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const c = col + dc;
        const r = row + dr;

        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) {
          continue; // Outside grid
        }

        const cell = this.cells.get(this.getCellKey(c, r));
        if (!cell) continue;

        for (const ent of cell) {
          // Check circular radius distance
          if (distanceSquared(origin, ent.position) <= maxDistSq) {
            results.push(ent);
          }
        }
      }
    }

    return results;
  }

  public getCellStats(): { totalCells: number; populatedCells: number; entityCount: number } {
    let populated = 0;
    for (const cell of this.cells.values()) {
      if (cell.size > 0) populated++;
    }
    return {
      totalCells: this.cols * this.rows,
      populatedCells: populated,
      entityCount: this.entityCellMap.size,
    };
  }
}
