import { CityAction } from '../action';
import { ActionResult } from '../action-result';
import {
  bestWorkableTiles,
  buyCost,
  calculateCitizens,
  City,
  getBlockedWorkableTiles,
  getProductionCost,
  optimizeWorkedTiles,
  Specialists,
} from '../city';
import { GameState } from '../game-state';

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
      city.shields = getProductionCost(city.producing);
      break;
    }
  }
};
