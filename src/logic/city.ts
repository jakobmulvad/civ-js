import { GameState } from './game-state';
import { UnitPrototypeId } from './units';

export enum CitySpecialists {
  Entertainer = -1,
  TaxAgent = -2,
  Scientist = -3,
}

export type City = {
  owner: number;
  name: string;
  x: number;
  y: number;
  size: number;
  populationPlacement: number[]; // either tile index or "specialist"
  food: number;
  shields: number;
  producing: UnitPrototypeId;
  hasBought: boolean;
  hasSold: boolean;
};

export const newCity = (owner: number, name: string, x: number, y: number) => {
  return {
    owner,
    name,
    x,
    y,
    size: 1,
    populationPlacement: [CitySpecialists.Entertainer],
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
