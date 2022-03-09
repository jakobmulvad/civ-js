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

export type Terrain = {
  name: string;
  movementCost: number;
};

export const terrainValueMap: Record<TerrainId, Terrain> = {
  [TerrainId.Void]: {
    name: 'VOID',
    movementCost: 0,
  },
  [TerrainId.Ocean]: {
    name: 'Ocean',
    movementCost: 1,
  },
  [TerrainId.Forest]: {
    name: 'Forest',
    movementCost: 2,
  },
  [TerrainId.Swamp]: {
    name: 'Swamp',
    movementCost: 2,
  },
  [TerrainId.Plains]: {
    name: 'Plains',
    movementCost: 1,
  },
  [TerrainId.Tundra]: {
    name: 'Tundra',
    movementCost: 1,
  },
  [TerrainId.River]: {
    name: 'River',
    movementCost: 1,
  },
  [TerrainId.Grassland]: {
    name: 'Grassland',
    movementCost: 1,
  },
  [TerrainId.Jungle]: {
    name: 'Jungle',
    movementCost: 2,
  },
  [TerrainId.Hills]: {
    name: 'Hills',
    movementCost: 2,
  },
  [TerrainId.Mountains]: {
    name: 'Mountains',
    movementCost: 3,
  },
  [TerrainId.Desert]: {
    name: 'Desert',
    movementCost: 1,
  },
  [TerrainId.Arctic]: {
    name: 'Arctic',
    movementCost: 2,
  },
};

export type MapTile = {
  terrain: TerrainId;
  hasRailroad?: boolean;
  hasRoad?: boolean;
  hasIrrigation?: boolean;
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
