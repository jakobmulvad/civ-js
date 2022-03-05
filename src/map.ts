import { loadJson } from "./assets";

export enum Terrain {
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

export type TerrainValues = {
  movementCost: number;
};

export const terrainValueMap: Record<Terrain, TerrainValues> = {
  [Terrain.Void]: {
    movementCost: 0,
  },
  [Terrain.Ocean]: {
    movementCost: 1,
  },
  [Terrain.Forest]: {
    movementCost: 2,
  },
  [Terrain.Swamp]: {
    movementCost: 2,
  },
  [Terrain.Plains]: {
    movementCost: 1,
  },
  [Terrain.Tundra]: {
    movementCost: 1,
  },
  [Terrain.River]: {
    movementCost: 1,
  },
  [Terrain.Grassland]: {
    movementCost: 1,
  },
  [Terrain.Jungle]: {
    movementCost: 2,
  },
  [Terrain.Hills]: {
    movementCost: 2,
  },
  [Terrain.Mountains]: {
    movementCost: 3,
  },
  [Terrain.Desert]: {
    movementCost: 1,
  },
  [Terrain.Arctic]: {
    movementCost: 2,
  },
};

export type MapTile = {
  terrain: Terrain;
  hasRailroad?: boolean;
  hasRoad?: boolean;
  hasIrrigation?: boolean;
  hidden?: boolean;
  specialResource?: boolean;
};

export type MapTemplate = {
  width: number;
  height: number;
  data: Terrain[];
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

const voidTile = { terrain: Terrain.Void };

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

const terrainBit = (map: GameMap, x: number, y: number, terrain: Terrain) => {
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

export const generateMapFromTemplate = async (templateName: string) => {
  const template = await loadJson<MapTemplate>(templateName);

  const map: GameMap = {
    width: template.width,
    height: template.height,
    tiles: template.data.map((terrain) => ({ terrain })),
  };
  return map;
};
