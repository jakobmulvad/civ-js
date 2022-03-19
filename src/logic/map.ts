export enum TerrainId {
  Void = 0,
  Ocean = 1,
  Forest = 2,
  Swamp = 3,
  Plains = 4,
  Tundra = 5,
  River = 6,
  Grassland = 7,
  Jungle = 8,
  Hills = 9,
  Mountains = 10,
  Desert = 11,
  Arctic = 12,
}

export type TerrainYield = {
  food?: number;
  shields?: number;
  trade?: number;
};

export type Terrain = {
  name: string;
  movementCost: number;
  defensiveFactor?: number;
  canIrrigate?: boolean;
  clearsTo?: TerrainId;
  clearCost?: number;
  givesAccessToWater?: boolean;
  yield?: TerrainYield;
  specialYield?: TerrainYield;
  mineYield?: number;
  roadYield?: number;
};

export const terrainMap: Record<TerrainId, Terrain> = {
  [TerrainId.Void]: {
    name: 'VOID',
    movementCost: 0,
  },
  [TerrainId.Ocean]: {
    name: 'Ocean',
    movementCost: 1,
    givesAccessToWater: true,
    yield: {
      food: 1,
      trade: 2,
    },
    specialYield: {
      food: 3,
      trade: 2,
    },
  },
  [TerrainId.Forest]: {
    name: 'Forest',
    movementCost: 2,
    defensiveFactor: 1.5,
    clearsTo: TerrainId.Plains,
    clearCost: 5,
    yield: {
      food: 1,
      shields: 2,
    },
    specialYield: {
      food: 3,
      shields: 2,
    },
  },
  [TerrainId.Swamp]: {
    name: 'Swamp',
    movementCost: 2,
    defensiveFactor: 1.5,
    clearsTo: TerrainId.Grassland,
    clearCost: 15,
    yield: {
      food: 1,
    },
    specialYield: {
      food: 1,
      shields: 4,
    },
  },
  [TerrainId.Plains]: {
    name: 'Plains',
    movementCost: 1,
    canIrrigate: true,
    yield: {
      food: 1,
      shields: 1,
    },
    specialYield: {
      food: 1,
      shields: 3,
    },
    roadYield: 1,
  },
  [TerrainId.Tundra]: {
    name: 'Tundra',
    movementCost: 1,
    yield: {
      food: 1,
    },
    specialYield: {
      food: 3,
    },
  },
  [TerrainId.River]: {
    name: 'River',
    movementCost: 1,
    defensiveFactor: 1.5,
    canIrrigate: true,
    givesAccessToWater: true,
    yield: {
      food: 2,
      trade: 1,
    },
    specialYield: {
      food: 2,
      shields: 1,
      trade: 1,
    },
  },
  [TerrainId.Grassland]: {
    name: 'Grassland',
    movementCost: 1,
    canIrrigate: true,
    yield: {
      food: 2,
    },
    specialYield: {
      food: 2,
      shields: 1,
    },
    roadYield: 1,
  },
  [TerrainId.Jungle]: {
    name: 'Jungle',
    movementCost: 2,
    defensiveFactor: 1.5,
    clearsTo: TerrainId.Grassland,
    clearCost: 15,
    yield: {
      food: 1,
    },
    specialYield: {
      food: 1,
      trade: 4,
    },
  },
  [TerrainId.Hills]: {
    name: 'Hills',
    movementCost: 2,
    defensiveFactor: 2,
    canIrrigate: true,
    yield: {
      food: 1,
    },
    specialYield: {
      food: 1,
      shields: 2,
    },
    mineYield: 3,
  },
  [TerrainId.Mountains]: {
    name: 'Mountains',
    movementCost: 3,
    defensiveFactor: 3,
    yield: {
      shields: 1,
    },
    specialYield: {
      shields: 1,
      trade: 6,
    },
    mineYield: 1,
  },
  [TerrainId.Desert]: {
    name: 'Desert',
    movementCost: 1,
    canIrrigate: true,
    yield: {
      shields: 1,
    },
    specialYield: {
      food: 3,
      shields: 1,
    },
    mineYield: 1,
    roadYield: 1,
  },
  [TerrainId.Arctic]: {
    name: 'Arctic',
    movementCost: 2,
    specialYield: { food: 2 },
  },
};

export type MapTile = {
  terrain: TerrainId;
  hasRailroad?: boolean;
  hasRoad?: boolean;
  hasIrrigation?: boolean;
  hasMine?: boolean;
  hidden?: boolean;
  specialResource?: boolean;
  extraShield?: boolean;
};

export type MapTemplate = {
  width: number;
  height: number;
  data: TerrainId[];
};

export type GameMap = {
  width: number;
  height: number;
  tiles: MapTile[];
};

export enum MapDirectionBit {
  North = 0b0001,
  East = 0b0010,
  South = 0b0100,
  West = 0b1000,
}

const voidTile = { terrain: TerrainId.Void };

export const getTileAt = (map: GameMap, x: number, y: number): MapTile => {
  if (y < 0 || y >= map.height) {
    return voidTile;
  }
  x = (x + map.width) % map.width; // wrap-around on x-axis
  return map.tiles[x + y * map.width];
};

export const wrapXAxis = (map: GameMap, x: number) => (x + map.width) % map.width;

export const getTilesCross = (map: GameMap, x: number, y: number): MapTile[] => {
  return [
    getTileAt(map, x, y),
    getTileAt(map, x, y - 1),
    getTileAt(map, x + 1, y),
    getTileAt(map, x, y + 1),
    getTileAt(map, x - 1, y),
  ];
};

export const getTilesAround = (map: GameMap, x: number, y: number): MapTile[] => {
  return [
    getTileAt(map, x, y - 1),
    getTileAt(map, x + 1, y - 1),
    getTileAt(map, x + 1, y),
    getTileAt(map, x + 1, y + 1),
    getTileAt(map, x, y + 1),
    getTileAt(map, x - 1, y + 1),
    getTileAt(map, x - 1, y),
    getTileAt(map, x - 1, y - 1),
  ];
};

export const getTerrainAt = (map: GameMap, x: number, y: number): Terrain => {
  const tile = getTileAt(map, x, y);
  return terrainMap[tile.terrain];
};

export const getTileIndex = (map: GameMap, x: number, y: number): number => {
  y = Math.min(map.height - 1, Math.max(0, y)); // clamp y-axis
  x = (x + map.width) % map.width; // wrap-around on x-axis
  return x + y * map.width;
};

const terrainBit = (map: GameMap, x: number, y: number, terrain: TerrainId) => {
  return getTileAt(map, x, y).terrain === terrain ? 1 : 0;
};

export const getTerrainMaskCross = (map: GameMap, x: number, y: number, mask: number) => {
  return (
    terrainBit(map, x, y - 1, mask) |
    (terrainBit(map, x + 1, y, mask) << 1) |
    (terrainBit(map, x, y + 1, mask) << 2) |
    (terrainBit(map, x - 1, y, mask) << 3)
  );
};

export const getTerrainMaskNorthWest = (map: GameMap, x: number, y: number, mask: number) => {
  return (
    terrainBit(map, x - 1, y, mask) |
    (terrainBit(map, x - 1, y - 1, mask) << 1) |
    (terrainBit(map, x, y - 1, mask) << 2)
  );
};

export const getTerrainMaskNorthEast = (map: GameMap, x: number, y: number, mask: number) => {
  return (
    terrainBit(map, x, y - 1, mask) |
    (terrainBit(map, x + 1, y - 1, mask) << 1) |
    (terrainBit(map, x + 1, y, mask) << 2)
  );
};

export const getTerrainMaskSouthEast = (map: GameMap, x: number, y: number, mask: number) => {
  return (
    terrainBit(map, x + 1, y, mask) |
    (terrainBit(map, x + 1, y + 1, mask) << 1) |
    (terrainBit(map, x, y + 1, mask) << 2)
  );
};

export const getTerrainMaskSouthWest = (map: GameMap, x: number, y: number, mask: number) => {
  return (
    terrainBit(map, x, y + 1, mask) |
    (terrainBit(map, x - 1, y + 1, mask) << 1) |
    (terrainBit(map, x - 1, y, mask) << 2)
  );
};

export const calculateTileYield = (tile: MapTile) => {
  const terrain = terrainMap[tile.terrain];

  const isSpecial =
    tile.terrain === TerrainId.Grassland || tile.terrain === TerrainId.River ? tile.extraShield : tile.specialResource;

  const tileYield: Required<TerrainYield> = {
    food: 0,
    shields: 0,
    trade: 0,
    ...(isSpecial ? terrain.specialYield : terrain.yield),
  };

  if (tile.hasIrrigation && terrain.canIrrigate) {
    tileYield.food++;
  }

  if (tile.hasMine && terrain.mineYield) {
    tileYield.shields += terrain.mineYield;
  }

  if (tile.hasRoad && terrain.roadYield) {
    tileYield.trade += terrain.roadYield;
  }
  return tileYield;
};
