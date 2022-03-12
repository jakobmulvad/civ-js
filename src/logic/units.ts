export enum UnitPrototypeId {
  Settlers = 0,
  Militia = 1,
  Phalanx = 2,
  Legion = 3,
  Musketeers = 4,
  Riflemen = 5,
  Cavalry = 6,
  Knight = 7,
}

export enum UnitType {
  Land,
  Sea,
  Air,
}

export enum UnitState {
  Idle,
  Sentry,
  Fortifying,
  Fortified,
  BuildingRoad,
  BuildingIrrigation,
  BuildingMine,
  BuildingFortress,
  CleaningPolution,
}

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
  movesLeft: number;
  isVeteran?: boolean;
  state: UnitState;
  progress: number;
  owner: number;
};

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
    moves: 2,
    type: UnitType.Land,
  },
  [UnitPrototypeId.Knight]: {
    name: 'Knight',
    attack: 4,
    defense: 2,
    moves: 2,
    type: UnitType.Land,
  },
};

export const newUnit = (prototypeId: UnitPrototypeId, x: number, y: number, owner: number): Unit => {
  const prototype = unitPrototypeMap[prototypeId];
  return {
    prototypeId,
    x,
    y,
    movesLeft: prototype.moves * 3,
    state: UnitState.Idle,
    progress: 0,
    owner,
  };
};
