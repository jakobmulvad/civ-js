import { calculateCitizens, City } from '../city';
import { GameState } from '../game-state';

export const captureCity = (state: GameState, city: City, newOwner: number) => {
  decreaseCityPopulation(state, city, 1);
  if (city.size > 0) {
    const ownerPlayer = state.players[city.owner];
    ownerPlayer.cities = ownerPlayer.cities.filter((c) => c !== city);
    state.players[newOwner].cities.push(city);
    city.owner = newOwner;
  }
  // TODO steal tech
};

export const decreaseCityPopulation = (state: GameState, city: City, amount: number) => {
  city.size -= amount;
  city.food = 0;

  if (city.size > 0) {
    calculateCitizens(state.masterMap, city);
    return;
  }

  const player = state.players[city.owner];
  player.cities = player.cities.filter((c) => c !== city);

  // TODO destroy any unit maintained by this city
  // TODO clean up traderoutes to this city
};

export const increaseCityPopulation = (state: GameState, city: City, amount: number) => {
  city.size += amount;
  city.food = 0;
  calculateCitizens(state.masterMap, city);
  // TODO check for aquaduct
  // TODO check for granary
};
