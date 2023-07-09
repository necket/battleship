export type ShipType = 'small' | 'medium' | 'large' | 'huge';

export interface Position {
  x: number;
  y: number;
}

export interface Cell extends Position {
  killed: boolean;
}

export interface Ship {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: ShipType;
}

export interface ShipWithCells extends Ship {
  cells: Cell[];
  killed: boolean;
}
