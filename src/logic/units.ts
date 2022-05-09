import { AdvanceId } from './advances';

export enum UnitPrototypeId {
  Settlers = 'settlers',
  Militia = 'militia',
  Phalanx = 'phalanx',
  Legion = 'legion',
  Musketeers = 'musketeers',
  Riflemen = 'riflemen',
  Cavalry = 'cavalry',
  Knight = 'knight',
  Catapult = 'catapult',
  Cannon = 'cannon',
  Chariot = 'chariot',
  Armor = 'armor',
  MechInf = 'mechinf',
  Artillery = 'artillery',
  Fighter = 'fighter',
  Bomber = 'bomber',
  Trireme = 'trireme',
  Sail = 'sail',
  Frigate = 'frigate',
  Ironclad = 'ironclad',
  Cruiser = 'cruiser',
  Battleship = 'battleship',
  Submarine = 'submarine',
  Carrier = 'carrier',
  Transport = 'transport',
  Nuclear = 'nuclear',
  Diplomat = 'diplomat',
  Caravan = 'caravan',
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
  Clearing,
  CleaningPolution,
}

export type UnitPrototype = {
  name: string;
  attack: number;
  defense: number;
  moves: number;
  type: UnitType;
  cost: number;
  isBuilder?: boolean;
  isCivil?: boolean; // cannot be fortified - ignores zoc
  ignoreCitywall?: boolean;
  landTransport?: number;
  airTransport?: number;
  visibleRange?: number;
  stealth?: boolean;
  requires?: AdvanceId;
  obsoleteBy?: AdvanceId;
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
  homeCity?: number;
};

export const unitSpriteSheetOffsetMap: Record<UnitPrototypeId, number> = {
  [UnitPrototypeId.Settlers]: 0,
  [UnitPrototypeId.Militia]: 1,
  [UnitPrototypeId.Phalanx]: 2,
  [UnitPrototypeId.Legion]: 3,
  [UnitPrototypeId.Musketeers]: 4,
  [UnitPrototypeId.Riflemen]: 5,
  [UnitPrototypeId.Cavalry]: 6,
  [UnitPrototypeId.Knight]: 7,
  [UnitPrototypeId.Catapult]: 8,
  [UnitPrototypeId.Cannon]: 9,
  [UnitPrototypeId.Chariot]: 10,
  [UnitPrototypeId.Armor]: 11,
  [UnitPrototypeId.MechInf]: 12,
  [UnitPrototypeId.Artillery]: 13,
  [UnitPrototypeId.Fighter]: 14,
  [UnitPrototypeId.Bomber]: 15,
  [UnitPrototypeId.Trireme]: 16,
  [UnitPrototypeId.Sail]: 17,
  [UnitPrototypeId.Frigate]: 18,
  [UnitPrototypeId.Ironclad]: 19,
  [UnitPrototypeId.Cruiser]: 20,
  [UnitPrototypeId.Battleship]: 21,
  [UnitPrototypeId.Submarine]: 22,
  [UnitPrototypeId.Carrier]: 23,
  [UnitPrototypeId.Transport]: 24,
  [UnitPrototypeId.Nuclear]: 25,
  [UnitPrototypeId.Diplomat]: 26,
  [UnitPrototypeId.Caravan]: 27,
};

export const unitPrototypeMap: Record<UnitPrototypeId, UnitPrototype> = {
  [UnitPrototypeId.Settlers]: {
    name: 'Settlers',
    attack: 0,
    defense: 1,
    moves: 1,
    cost: 40,
    type: UnitType.Land,
    isBuilder: true,
    isCivil: true,
  },
  [UnitPrototypeId.Militia]: {
    name: 'Militia',
    attack: 1,
    defense: 1,
    moves: 1,
    cost: 10,
    type: UnitType.Land,
    obsoleteBy: AdvanceId.Gunpowder,
  },
  [UnitPrototypeId.Phalanx]: {
    name: 'Phalanx',
    attack: 1,
    defense: 2,
    moves: 1,
    cost: 20,
    type: UnitType.Land,
    requires: AdvanceId.BronzeWorking,
    obsoleteBy: AdvanceId.Gunpowder,
  },
  [UnitPrototypeId.Legion]: {
    name: 'Legion',
    attack: 3,
    defense: 1,
    moves: 1,
    cost: 20,
    type: UnitType.Land,
    requires: AdvanceId.IronWorking,
    obsoleteBy: AdvanceId.Conscription,
  },
  [UnitPrototypeId.Musketeers]: {
    name: 'Musketeers',
    attack: 2,
    defense: 3,
    moves: 1,
    cost: 30,
    type: UnitType.Land,
    requires: AdvanceId.Gunpowder,
    obsoleteBy: AdvanceId.Conscription,
  },
  [UnitPrototypeId.Riflemen]: {
    name: 'Riflemen',
    attack: 3,
    defense: 5,
    moves: 1,
    cost: 30,
    type: UnitType.Land,
    requires: AdvanceId.Conscription,
  },
  [UnitPrototypeId.Cavalry]: {
    name: 'Cavalry',
    attack: 2,
    defense: 1,
    moves: 2,
    cost: 20,
    type: UnitType.Land,
    requires: AdvanceId.HorsebackRiding,
    obsoleteBy: AdvanceId.Conscription,
  },
  [UnitPrototypeId.Knight]: {
    name: 'Knight',
    attack: 4,
    defense: 2,
    moves: 2,
    cost: 40,
    type: UnitType.Land,
    requires: AdvanceId.Chivalry,
    obsoleteBy: AdvanceId.Automobile,
  },
  [UnitPrototypeId.Catapult]: {
    name: 'Catapult',
    attack: 6,
    defense: 1,
    moves: 1,
    cost: 40,
    type: UnitType.Land,
    requires: AdvanceId.Mathematics,
    obsoleteBy: AdvanceId.Metallurgy,
  },
  [UnitPrototypeId.Cannon]: {
    name: 'Cannon',
    attack: 8,
    defense: 1,
    moves: 1,
    cost: 40,
    type: UnitType.Land,
    requires: AdvanceId.Metallurgy,
    obsoleteBy: AdvanceId.Robotics,
  },
  [UnitPrototypeId.Chariot]: {
    name: 'Chariot',
    attack: 4,
    defense: 1,
    moves: 2,
    cost: 40,
    type: UnitType.Land,
    requires: AdvanceId.TheWheel,
    obsoleteBy: AdvanceId.Chivalry,
  },
  [UnitPrototypeId.Armor]: {
    name: 'Armor',
    attack: 10,
    defense: 5,
    moves: 3,
    cost: 80,
    type: UnitType.Land,
    requires: AdvanceId.Automobile,
  },
  [UnitPrototypeId.MechInf]: {
    name: 'Mech. Inf.',
    attack: 6,
    defense: 6,
    moves: 3,
    cost: 50,
    type: UnitType.Land,
    requires: AdvanceId.LaborUnion,
  },
  [UnitPrototypeId.Artillery]: {
    name: 'Artillery',
    attack: 12,
    defense: 2,
    moves: 2,
    cost: 60,
    ignoreCitywall: true,
    type: UnitType.Land,
    requires: AdvanceId.Robotics,
  },
  [UnitPrototypeId.Fighter]: {
    name: 'Fighter',
    attack: 4,
    defense: 2,
    moves: 10,
    cost: 60,
    type: UnitType.Air,
    requires: AdvanceId.Flight,
  },
  [UnitPrototypeId.Bomber]: {
    name: 'Bomber',
    attack: 12,
    defense: 1,
    moves: 8,
    cost: 120,
    ignoreCitywall: true,
    type: UnitType.Air,
    requires: AdvanceId.AdvancedFlight,
  },
  [UnitPrototypeId.Trireme]: {
    name: 'Trireme',
    attack: 1,
    defense: 0,
    moves: 3,
    cost: 40,
    landTransport: 2,
    type: UnitType.Sea,
    requires: AdvanceId.MapMaking,
    obsoleteBy: AdvanceId.Navigation,
  },
  [UnitPrototypeId.Sail]: {
    name: 'Sail',
    attack: 1,
    defense: 1,
    moves: 3,
    cost: 40,
    landTransport: 3,
    type: UnitType.Sea,
    requires: AdvanceId.Navigation,
    obsoleteBy: AdvanceId.Magnatism,
  },
  [UnitPrototypeId.Frigate]: {
    name: 'Frigate',
    attack: 1,
    defense: 1,
    moves: 3,
    cost: 40,
    landTransport: 4,
    type: UnitType.Sea,
    requires: AdvanceId.Magnatism,
    obsoleteBy: AdvanceId.Combustion,
  },
  [UnitPrototypeId.Ironclad]: {
    name: 'Ironclad',
    attack: 4,
    defense: 4,
    moves: 4,
    cost: 60,
    type: UnitType.Sea,
    requires: AdvanceId.SteamEngine,
    obsoleteBy: AdvanceId.Combustion,
  },
  [UnitPrototypeId.Cruiser]: {
    name: 'Cruiser',
    attack: 6,
    defense: 6,
    moves: 6,
    cost: 80,
    visibleRange: 2,
    type: UnitType.Sea,
    requires: AdvanceId.Combustion,
  },
  [UnitPrototypeId.Battleship]: {
    name: 'Battleship',
    attack: 18,
    defense: 12,
    moves: 4,
    cost: 160,
    visibleRange: 2,
    type: UnitType.Sea,
    requires: AdvanceId.Steel,
  },
  [UnitPrototypeId.Submarine]: {
    name: 'Submarine',
    attack: 8,
    defense: 2,
    moves: 3,
    cost: 50,
    visibleRange: 2,
    stealth: true,
    type: UnitType.Sea,
    requires: AdvanceId.MassProduction,
  },
  [UnitPrototypeId.Carrier]: {
    name: 'Carrier',
    attack: 1,
    defense: 12,
    moves: 5,
    cost: 160,
    visibleRange: 2,
    airTransport: 8,
    type: UnitType.Sea,
    requires: AdvanceId.AdvancedFlight,
  },
  [UnitPrototypeId.Transport]: {
    name: 'Transport',
    attack: 0,
    defense: 3,
    moves: 4,
    cost: 50,
    landTransport: 8,
    isCivil: true,
    type: UnitType.Sea,
    requires: AdvanceId.Industrialization,
  },
  [UnitPrototypeId.Nuclear]: {
    name: 'Nuclear',
    attack: 99,
    defense: 0,
    moves: 16,
    cost: 160,
    stealth: true,
    type: UnitType.Air,
    requires: AdvanceId.Rocketry,
  },
  [UnitPrototypeId.Diplomat]: {
    name: 'Diplomat',
    attack: 0,
    defense: 0,
    moves: 2,
    cost: 30,
    isCivil: true,
    type: UnitType.Land,
    requires: AdvanceId.Writing,
  },
  [UnitPrototypeId.Caravan]: {
    name: 'Caravan',
    attack: 0,
    defense: 1,
    moves: 1,
    cost: 50,
    isCivil: true,
    type: UnitType.Land,
    requires: AdvanceId.Trade,
  },
};

export const newUnit = (prototypeId: UnitPrototypeId, x: number, y: number, owner: number, homeCity?: number): Unit => {
  const prototype = unitPrototypeMap[prototypeId];
  return {
    prototypeId,
    x,
    y,
    movesLeft: prototype.moves * 3,
    state: UnitState.Idle,
    progress: 0,
    owner,
    homeCity,
  };
};

export const jobsDone = (unit: Unit) => {
  unit.movesLeft = 0;
  unit.progress = 0;
  unit.state = UnitState.Idle;
};
