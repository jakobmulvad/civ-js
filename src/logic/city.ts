import { GameState } from './game-state';
import { calculateTileYield, GameMap, getTileAt, TerrainYield } from './map';
import { UnitPrototypeId } from './units';

// Use browser to format numbers
export const numberFormatter = new Intl.NumberFormat('en-US');

export enum Specialists {
  TaxAgent = 6,
  Scientist = 7,
  Entertainer = 8,
}

export enum Citizens {
  HappyMale = 0,
  HappyFemale = 1,
  ContentMale = 2,
  ContentFemale = 3,
  UnhappyMale = 4,
  UnhappyFemale = 5,
  TaxAgent = Specialists.TaxAgent,
  Scientist = Specialists.Scientist,
  Entertainer = Specialists.Entertainer,
}

// Index for city tiles
//    00 01 02
// 03 04 05 06 07
// 08 09 XX 10 11
// 12 13 14 15 16
//    17 18 19
export const workedTileCoords = [
  [-1, -2],
  [0, -2],
  [1, -2],
  [-2, -1],
  [-1, -1],
  [0, -1],
  [1, -1],
  [2, -1],
  [-2, 0],
  [-1, 0],
  [1, 0],
  [2, 0],
  [-2, 1],
  [-1, 1],
  [0, 1],
  [1, 1],
  [2, 1],
  [-1, 2],
  [0, 2],
  [1, 2],
];

export type City = {
  owner: number;
  name: string;
  x: number;
  y: number;
  size: number;
  specialists: Specialists[];
  workedTiles: number[]; // either tile index
  food: number;
  shields: number;
  producing: UnitPrototypeId;
  hasBought: boolean;
  hasSold: boolean;
};

export type CityYield = {
  gold: number;
  beakers: number;
  luxury: number;
} & Required<TerrainYield>;

export const toCityYield = (terrainYield: TerrainYield): CityYield => {
  return {
    food: terrainYield.food ?? 0,
    shields: terrainYield.shields ?? 0,
    trade: terrainYield.trade ?? 0,
    gold: 0,
    beakers: 0,
    luxury: 0,
  };
};

export const newCity = (owner: number, name: string, x: number, y: number): City => {
  return {
    owner,
    name,
    x,
    y,
    size: 1,
    specialists: [Specialists.Entertainer],
    workedTiles: [],
    food: 0,
    shields: 0,
    producing: UnitPrototypeId.Militia,
    hasBought: false,
    hasSold: false,
  };
};

export const getCityAt = (state: GameState, x: number, y: number): City | undefined => {
  for (const player of state.players) {
    for (const city of player.cities) {
      if (city.x === x && city.y === y) {
        return city;
      }
    }
  }
};

export const workedTileToIndex = (relX: number, relY: number) => {
  return workedTileCoords.findIndex(([x, y]) => x === relX && y === relY);
};

export const calculateCitizens = (map: GameMap, city: City) => {
  // Make sure we are not working more tiles than city size
  city.workedTiles = city.workedTiles.slice(0, city.size);
  // Make sure we don't have more specialists than size-workers
  city.specialists = city.specialists.slice(0, city.size - city.workedTiles.length);

  const missing = city.workedTiles.length + city.specialists.length;

  console.log(city.specialists);

  // Fill up with entertainers
  const entertainers = new Array(missing).fill(Specialists.Entertainer) as Specialists[];
  city.specialists = [...entertainers, ...city.specialists];
};

export const cityYieldFromTiles = (map: GameMap, city: City): CityYield => {
  const centerTile = getTileAt(map, city.x, city.y);
  const centerYield = toCityYield(calculateTileYield(centerTile));
  return city.workedTiles.reduce<CityYield>((accYield, workedTile) => {
    const [x, y] = workedTileCoords[workedTile];
    const tile = getTileAt(map, x, y);
    const tileYield = calculateTileYield(tile);
    accYield.food += tileYield.food;
    accYield.shields += tileYield.shields;
    accYield.trade += tileYield.trade;

    return accYield;
  }, centerYield);
};

//export const calculate;
