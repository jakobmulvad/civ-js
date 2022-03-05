export enum UnitPrototypeId {
  Settlers = 0,
  Militia = 1,
  Phalanx = 2,
}

export enum UnitType {
  Land,
  Water,
  Air,
}

export const UnitPrototypeMap: Record<UnitPrototypeId, UnitPrototype> = {
  [UnitPrototypeId.Settlers]: {
    attack: 0,
    defense: 1,
    moves: 3,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Militia]: {
    attack: 1,
    defense: 1,
    moves: 3,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Phalanx]: {
    attack: 1,
    defense: 2,
    moves: 3,
    type: UnitType.Land,
  },
};

export type UnitPrototype = {
  attack: number;
  defense: number;
  moves: number;
  type: UnitType;
};

export type UnitState = {
  prototype: UnitPrototypeId;
  x: number;
  y: number;
  movesLeft: number;
};
