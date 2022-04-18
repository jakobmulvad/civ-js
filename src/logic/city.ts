import { clamp } from '../helpers';
import { Building, BuildingId, buildings } from './buildings';
import { convertTradeToYield } from './formulas';
import { GameState, PlayerController, PlayerState, totalCitySupply, UnitSupply } from './game-state';
import { GovernmentId, governments } from './government';
import { calculateTileYield, distanceToTile, GameMap, getTileAt, TerrainYield, wrapXAxis } from './map';
import { UnitPrototypeId, unitPrototypeMap } from './units';

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
const workedTileCoords = [
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

export enum CityProductionType {
  Unit = 'Unit',
  Building = 'Building',
  Wonder = 'Wonder',
}

export type CityProduction =
  | {
      type: CityProductionType.Unit;
      id: UnitPrototypeId;
    }
  | {
      type: CityProductionType.Building;
      id: BuildingId;
    };

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
  buildings: BuildingId[];
  producing: CityProduction;
  hasBought: boolean;
  hasSold: boolean;
};

export type CityYield = {
  corruption: number;
  gold: number;
  beakers: number;
  luxury: number;
} & Required<TerrainYield>;

export const toCityYield = (terrainYield: TerrainYield): CityYield => {
  return {
    food: terrainYield.food ?? 0,
    shields: terrainYield.shields ?? 0,
    trade: terrainYield.trade ?? 0,
    corruption: 0,
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
    buildings: [],
    producing: {
      type: CityProductionType.Unit,
      id: UnitPrototypeId.Militia,
    },
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

export const workedTileToCoord = (index: number) => {
  return workedTileCoords[index];
};

export const workedTileToMapCoord = (map: GameMap, city: City, index: number) => {
  const [dx, dy] = workedTileCoords[index];
  return [wrapXAxis(map, city.x + dx), city.y + dy];
};

export const getBlockedWorkableTiles = (state: GameState, city: City) => {
  const result = new Set<number>();
  const map = state.players[city.owner].map;

  // Remove tiles not yet discovered
  for (let i = 0; i < 20; i++) {
    const [x, y] = workedTileToMapCoord(map, city, i);
    const tile = getTileAt(map, x, y);

    if (tile.hidden) {
      result.add(i);
    }
  }

  // Remove tiles blocked by other cities or enemy units
  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i];
    for (const otherCity of player.cities) {
      if (otherCity === city) {
        continue;
      }
      const relX = otherCity.x - city.x;
      const relY = otherCity.y - city.y;
      result.add(workedTileToIndex(relX, relY));
      for (const workedTile of otherCity.workedTiles) {
        const [tileX, tileY] = workedTileCoords[workedTile];
        result.add(workedTileToIndex(relX + tileX, relY + tileY));
      }
    }

    if (i === city.owner) {
      continue; // Own units doesn't occupy tiles
    }

    for (const unit of player.units) {
      const relX = unit.x - city.x;
      const relY = unit.y - city.y;
      result.add(workedTileToIndex(relX, relY));
    }
  }
  result.delete(-1);
  return Array.from(result);
};

export const calculateCitizens = (map: GameMap, city: City) => {
  // Make sure we are not working more tiles than city size
  city.workedTiles = city.workedTiles.slice(0, city.size);
  // Make sure we don't have more specialists than size-workers
  city.specialists = city.specialists.slice(0, city.size - city.workedTiles.length);

  const missing = city.size - city.workedTiles.length - city.specialists.length;

  // Fill up with entertainers
  const entertainers = new Array(missing).fill(Specialists.Entertainer) as Specialists[];
  city.specialists = [...entertainers, ...city.specialists];
};

export const bestWorkableTiles = (state: GameState, city: City) => {
  const { map, government } = state.players[city.owner];

  // There are 20 tiles that can be worked in a city
  const allTiles = new Array(20).fill(undefined).map((_, i) => i);
  const occupiedTiles = getBlockedWorkableTiles(state, city);
  const availableTiles = allTiles.filter((tile) => !occupiedTiles.includes(tile));

  const indexValue = (tileIndex: number) => {
    const [x, y] = workedTileToMapCoord(map, city, tileIndex);
    const tile = getTileAt(map, x, y);
    const tileYield = calculateTileYield(tile, government);
    return tileYield.food * 4 + tileYield.shields * 2 + tileYield.trade;
  };

  availableTiles.sort((indexA, indexB) => indexValue(indexB) - indexValue(indexA));
  return availableTiles;
};

export const optimizeWorkedTiles = (state: GameState, city: City) => {
  const bestTiles = bestWorkableTiles(state, city);
  city.workedTiles = bestTiles.slice(0, city.size);
  city.specialists = city.specialists.slice(0, city.size - city.workedTiles.length);
};

export const cityCorruption = (state: GameState, city: City) => {
  const owner = state.players[city.owner];
  const government = governments[owner.government];

  if (government.corruptionCoefficient === 0) {
    return 0;
  }

  let distance: number;
  if (owner.government === GovernmentId.Communism) {
    distance = 10;
  } else {
    const capital = playerCapital(owner);
    if (!capital) {
      return 1; // 100% coruption
    }
    distance = distanceToTile(state.masterMap.width, city.x, city.y, capital.x, capital.y);
  }
  return distance * government.corruptionCoefficient;
};

export const totalCityYield = (state: GameState, map: GameMap, city: City): CityYield => {
  const { government } = state.players[city.owner];
  const cityYield = cityYieldFromTiles(map, city, government);

  for (const specialist of city.specialists) {
    switch (specialist) {
      case Specialists.Entertainer:
        cityYield.luxury += 2;
        break;
      case Specialists.TaxAgent:
        cityYield.gold += 2;
        break;
      case Specialists.Scientist:
        cityYield.beakers += 2;
        break;
    }
  }

  if (cityYield.trade > 0) {
    const corruptionCoefficient = cityCorruption(state, city);

    cityYield.corruption = Math.min(cityYield.trade - 1, Math.floor(corruptionCoefficient * cityYield.trade));
    cityYield.trade -= cityYield.corruption;

    const { luxuryRate, taxRate } = state.players[city.owner];

    const tradeYield = convertTradeToYield(luxuryRate, taxRate, cityYield.trade);

    cityYield.luxury += tradeYield.luxury;
    cityYield.gold += tradeYield.gold;
    cityYield.beakers += tradeYield.beakers;
  }
  return cityYield;
};

export const cityYieldFromTiles = (map: GameMap, city: City, government: GovernmentId): CityYield => {
  const centerTile = getTileAt(map, city.x, city.y);
  const centerYield = toCityYield(calculateTileYield(centerTile, government));
  return city.workedTiles.reduce<CityYield>((accYield, workedTile) => {
    const [x, y] = workedTileCoords[workedTile];
    const tile = getTileAt(map, city.x + x, city.y + y);
    const tileYield = calculateTileYield(tile, government);
    accYield.food += tileYield.food;
    accYield.shields += tileYield.shields;
    accYield.trade += tileYield.trade;

    return accYield;
  }, centerYield);
};

export const getProductionCost = (production: CityProduction) => {
  switch (production.type) {
    case CityProductionType.Unit:
      return unitPrototypeMap[production.id].cost;
    case CityProductionType.Building:
      return buildings[production.id].cost;
  }
};

export const getProductionName = (production: CityProduction) => {
  switch (production.type) {
    case CityProductionType.Unit:
      return unitPrototypeMap[production.id].name;
    case CityProductionType.Building:
      return buildings[production.id].name;
  }
};

// source: https://forums.civfanatics.com/threads/buy-unit-building-wonder-price.576026/#post-14490920
export const buyCost = (production: CityProduction, shields: number) => {
  const multiplier = 2 - Math.sign(shields);
  const cost = getProductionCost(production);
  switch (production.type) {
    case CityProductionType.Unit: {
      const remaining = Math.max(0, (cost - shields) / 10);
      return Math.floor((5 * remaining * remaining + 20 * remaining) * multiplier);
    }
    case CityProductionType.Building:
      return Math.max(0, (cost - shields) * 2 * multiplier);
    /*case CityProductionType.Wonder:
      return Math.max(0, (cost - shields) * 4);*/
  }
};

export const sellPrice = (building: Building) => {
  return building.cost;
};

export const cityUnits = (state: GameState, city: City) => {
  const player = state.players[city.owner];
  const index = player.cities.indexOf(city);
  const units = player.units.filter((u) => u.homeCity === index);
  return units;
};

export const playerCapital = (player: PlayerState): City | undefined => {
  return player.cities.find((c) => c.buildings.some((b) => b === BuildingId.Palace));
};

export type Happiness = {
  happy: number;
  unhappy: number;
};

export const adjustCitizenHappiness = (city: City, happiness: Happiness) => {
  //seg007_6CE6:
  happiness.happy = clamp(0, happiness.happy, city.size);
  happiness.unhappy = clamp(0, happiness.unhappy, city.size);
  while (city.size - city.specialists.length < happiness.happy + happiness.unhappy) {
    //seg007_6D3A:
    happiness.happy = clamp(0, happiness.happy - 1, city.size);
    happiness.unhappy = clamp(0, happiness.unhappy - 1, city.size);
  }
};

export const cityHappinessBase = (state: GameState, city: City): Happiness => {
  const difficulty = state.difficulty;
  const owner = state.players[city.owner];

  let unhappy;

  if (owner.controller === PlayerController.LocalHuman) {
    unhappy = city.size + difficulty - 6;
  } else {
    unhappy = city.size - 3;
  }
  const happiness: Happiness = {
    happy: 0,
    unhappy,
  };
  adjustCitizenHappiness(city, happiness);
  return happiness;
};

export const cityHappinessLuxury = (
  state: GameState,
  map: GameMap,
  city: City,
  cityYield: CityYield,
  happiness: Happiness
) => {
  happiness.happy = Math.floor(cityYield.luxury * 0.5);
  adjustCitizenHappiness(city, happiness);
};

export const cityHappinessImprovements = (state: GameState, city: City, happiness: Happiness) => {
  for (const id of city.buildings) {
    buildings[id].applyHappiness?.(state, city, happiness);
  }
  adjustCitizenHappiness(city, happiness);
};

export const cityHappinessSupply = (state: GameState, city: City, supply: UnitSupply, hapiness: Happiness) => {
  hapiness.unhappy += supply.unhappy;
  adjustCitizenHappiness(city, hapiness);
};

export const cityHappiness = (state: GameState, map: GameMap, city: City): Happiness => {
  const cityYield = totalCityYield(state, map, city);
  const supply = totalCitySupply(state, city);

  const happiness = cityHappinessBase(state, city);
  cityHappinessLuxury(state, map, city, cityYield, happiness);
  cityHappinessImprovements(state, city, happiness);
  cityHappinessSupply(state, city, supply, happiness);
  return happiness;
};
