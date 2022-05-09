import { CityAction } from '../action';
import { ActionResult, StartTurnResultEvent } from '../action-result';
import { BuildingId, buildings } from '../buildings';
import {
  bestWorkableTiles,
  buyCost,
  calculateCitizens,
  City,
  cityHappiness,
  CityProductionType,
  cityUnits,
  getBlockedWorkableTiles,
  getProductionObject,
  optimizeWorkedTiles,
  sellPrice,
  Specialists,
  totalCityYield,
} from '../city';
import { GameState, removeUnitFromGame, unitSupply } from '../game-state';
import { getTileAt } from '../map';
import { Unit, unitPrototypeMap } from '../units';
import { spawnUnitForPlayer } from './civ-game-units';

export const captureCity = (state: GameState, city: City, newOwner: number) => {
  decreaseCityPopulation(state, city);
  if (city.size > 0) {
    const ownerPlayer = state.players[city.owner];
    ownerPlayer.cities = ownerPlayer.cities.filter((c) => c !== city);
    state.players[newOwner].cities.push(city);
    city.owner = newOwner;
  }
  // TODO steal tech
};

export const decreaseCityPopulation = (state: GameState, city: City) => {
  city.size--;
  city.food = 0;

  if (city.size === 0) {
    // Destroy city
    const player = state.players[city.owner];
    player.cities = player.cities.filter((c) => c !== city);
    const tile = getTileAt(state.masterMap, city.x, city.y);
    tile.hasIrrigation = false;
    tile.hasRoad = false;
    tile.hasRailroad = false;
    tile.hasMine = false;
    // TODO destroy any unit maintained by this city
    // TODO clean up traderoutes to this city
    return;
  }

  calculateCitizens(state.masterMap, city);
};

export const increaseCityPopulation = (state: GameState, city: City) => {
  city.size++;
  city.food = 0;
  //calculateCitizens(state.masterMap, city);
  const bestTiles = bestWorkableTiles(state, city);
  const availableTiles = bestTiles.filter((t) => !city.workedTiles.includes(t));
  if (availableTiles.length) {
    city.workedTiles.push(availableTiles[0]);
  } else {
    city.specialists.push(Specialists.Entertainer);
  }

  // TODO check for aquaduct
  // TODO check for granary
};

export const executeCityAction = (state: GameState, action: CityAction): ActionResult => {
  const player = state.players[action.player];
  const city = player.cities[action.city];

  switch (action.type) {
    case 'CityToggleTileWorker': {
      const isWorked = city.workedTiles.includes(action.tile);

      if (isWorked) {
        city.workedTiles = city.workedTiles.filter((tile) => tile !== action.tile);
      } else {
        const occupiedTiles = getBlockedWorkableTiles(state, city);

        if (occupiedTiles.includes(action.tile)) {
          return; // tile is occupied
        }

        if (city.workedTiles.length === city.size) {
          optimizeWorkedTiles(state, city);
        } else {
          city.workedTiles.push(action.tile);
        }
      }

      calculateCitizens(player.map, city);
      break;
    }

    case 'CityChangeProduction': {
      if (city.hasBought) {
        return {
          type: 'ActionFailed',
          reason: 'CityCannotChangeProductionAfterBuy',
        };
      }

      const requiredTech = getProductionObject(action.production).requires;

      if (requiredTech && !player.advances.includes(requiredTech)) {
        return {
          type: 'ActionFailed',
          reason: 'CityCannotChangeProductionMissingRequiredTech',
        };
      }

      city.producing = action.production;
      break;
    }

    case 'CityBuy': {
      const price = buyCost(city.producing, city.shields);
      if (price > player.gold) {
        return {
          type: 'ActionFailed',
          reason: 'NotEnoughGold',
        };
      }
      player.gold -= price;
      city.shields = getProductionObject(city.producing).cost;
      city.hasBought = true;
      break;
    }

    case 'CitySell': {
      if (city.hasSold) {
        return {
          type: 'ActionFailed',
          reason: 'CityAllreadySold',
        };
      }

      const building = buildings[action.building];
      player.gold += sellPrice(building);
      city.hasSold = true;
      city.buildings = city.buildings.filter((b) => b !== action.building);
    }
  }
};

export const processCity = (state: GameState, city: City): StartTurnResultEvent[] => {
  const result: StartTurnResultEvent[] = [];
  const player = state.players[city.owner];
  let zoomToCity = false;

  // If enemy units moved on a worked tile, stop working it
  const occupiedTiles = getBlockedWorkableTiles(state, city);
  city.workedTiles = city.workedTiles.filter((i) => !occupiedTiles.includes(i));

  const cityYield = totalCityYield(state, state.masterMap, city); // apply the "real" yield from master map
  const units = cityUnits(state, city);

  // Subtract supply from yield
  let foodUnit: Unit | undefined = undefined;
  for (const unit of units) {
    const supply = unitSupply(state, unit);

    if (supply.shields > cityYield.shields) {
      // We don't have enough shields to supply this unit, disband it
      removeUnitFromGame(state, unit);
      result.push({ type: 'CannotSupportUnit', unit, city });
    } else {
      cityYield.shields -= supply.shields;
    }

    if (supply.food) {
      foodUnit = unit;
      cityYield.food -= supply.food;
    }
  }

  city.food += cityYield.food - city.size * 2;

  if (city.food < 0) {
    // Famine!
    if (foodUnit) {
      // Disband unit that
      city.food = 0;
      removeUnitFromGame(state, foodUnit);
      result.push({ type: 'CannotSupportUnit', unit: foodUnit, city });
    } else {
      decreaseCityPopulation(state, city);
      result.push({ type: 'PopulationDecrease', city });
    }
  } else if (city.food > (city.size + 1) * 10) {
    // Grow!
    increaseCityPopulation(state, city);
  }

  for (const id of city.buildings) {
    player.gold -= buildings[id].maintenance;
  }

  if (player.gold < 0) {
    // We are broke! sell a building
    const id = city.buildings.pop() as BuildingId;
    const building = buildings[id];
    player.gold += sellPrice(building);
    result.push({ type: 'CantMaintainBuilding', city, building });
  }

  const wasDisorder = city.isDisorder;
  if (!wasDisorder) {
    city.shields += cityYield.shields;
    player.gold += cityYield.gold;
    player.beakers += cityYield.beakers;
  }

  let complete = false;
  const cost = getProductionObject(city.producing).cost;
  if (city.shields >= cost) {
    // Production done!
    switch (city.producing.type) {
      case CityProductionType.Unit: {
        const prototype = unitPrototypeMap[city.producing.id];
        if (prototype.isBuilder) {
          decreaseCityPopulation(state, city);
        }
        spawnUnitForPlayer(state, city.owner, city.producing.id, city.x, city.y, player.cities.indexOf(city));
        if (prototype.isCivil) {
          zoomToCity = true;
        }
        complete = true;
        break;
      }

      case CityProductionType.Building: {
        if (city.buildings.includes(city.producing.id)) {
          break;
        }
        city.buildings.push(city.producing.id);
        zoomToCity = true;
        complete = true;
      }
    }

    if (complete) {
      city.shields = 0;
      result.push({
        type: 'CityCompletedProduction',
        city,
        production: city.producing,
      });
    }
  }

  const happiness = cityHappiness(state, state.masterMap, city);
  if (happiness.unhappy > happiness.happy) {
    if (wasDisorder) {
      // TODO: Government collapse?
    }
    city.isDisorder = true;
    result.push({ type: 'CivilDisorder', city });
    zoomToCity = zoomToCity || !wasDisorder;
  } else {
    if (city.isDisorder) {
      city.isDisorder = false;
      result.push({ type: 'OrderRestored', city });
    }
  }

  city.hasBought = false;
  city.hasSold = false;

  if (zoomToCity) {
    result.push({ type: 'ZoomToCity', city });
  }

  return result;
};
