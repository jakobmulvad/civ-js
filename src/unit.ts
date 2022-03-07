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
    name: 'Settlers',
    attack: 0,
    defense: 1,
    moves: 1,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Militia]: {
    name: 'Militia',
    attack: 1,
    defense: 1,
    moves: 1,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Phalanx]: {
    name: 'Phalanx',
    attack: 1,
    defense: 2,
    moves: 1,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Legion]: {
    name: 'Legion',
    attack: 3,
    defense: 1,
    moves: 1,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Musketeers]: {
    name: 'Musketeers',
    attack: 2,
    defense: 3,
    moves: 1,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Riflemen]: {
    name: 'Riflemen',
    attack: 3,
    defense: 5,
    moves: 1,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Cavalry]: {
    name: 'Cavalry',
    attack: 2,
    defense: 1,
    moves: 2000,
    type: UnitType.Land,
  },
};

export type UnitPrototype = {
  name: string;
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
