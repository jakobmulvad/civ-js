export enum UnitPrototypeId {
  Settlers = 0,
  Militia = 1,
  Phalanx = 2,
  Legion = 3,
  Musketeers = 4,
  Riflemen = 5,
  Cavalry = 6,
}

export enum UnitType {
  Land,
  Sea,
  Air,
}

export const unitPrototypeMap: Record<UnitPrototypeId, UnitPrototype> = {
  [UnitPrototypeId.Settlers]: {
    attack: 0,
    defense: 1,
    moves: 1,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Militia]: {
    attack: 1,
    defense: 1,
    moves: 1,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Phalanx]: {
    attack: 1,
    defense: 2,
    moves: 1,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Legion]: {
    attack: 3,
    defense: 1,
    moves: 1,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Musketeers]: {
    attack: 2,
    defense: 3,
    moves: 1,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Riflemen]: {
    attack: 3,
    defense: 5,
    moves: 1,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Cavalry]: {
    attack: 2,
    defense: 1,
    moves: 2,
    type: UnitType.Land,
  },
};

export type UnitPrototype = {
  attack: number;
  defense: number;
  moves: number;
  type: UnitType;
};

export type Unit = {
  prototypeId: UnitPrototypeId;
  x: number;
  y: number;
  screenOffsetX: number;
  screenOffsetY: number;
  movesLeft: number;
};

export const newUnit = (prototypeId: UnitPrototypeId, x: number, y: number): Unit => {
  const prototype = unitPrototypeMap[prototypeId];
  return { prototypeId, x, y, movesLeft: prototype.moves * 3, screenOffsetX: 0, screenOffsetY: 0 };
};
