import { Sprite } from '../assets';
import { AdvanceId } from './advances';
import { City, CityYield, Happiness } from './city';
import { GameState } from './game-state';

export enum BuildingId {
  Palace = 'palace',
  Barracks = 'barracks',
  Granary = 'granary',
  Temple = 'temple',
  Marketplace = 'marketplace',
}

export type Building = {
  name: string;
  cost: number;
  maintenance: number;
  applyHappiness?: (state: GameState, city: City, happiness: Happiness) => void;
  applyCityYield?: (cityYield: CityYield) => void;
  sprite: Sprite;
  requires?: AdvanceId;
};

export const buildings: Record<BuildingId, Building> = {
  [BuildingId.Palace]: {
    name: 'Palace',
    cost: 200,
    maintenance: 0,
    requires: AdvanceId.Masonry,
    sprite: {
      asset: 'sp299.pic.png',
      x: 20 * 8 + 1,
      y: 5 * 10,
      width: 18,
      height: 10,
    },
  },
  [BuildingId.Barracks]: {
    name: 'Barracks',
    cost: 40,
    maintenance: 2,
    sprite: {
      asset: 'sp299.pic.png',
      x: 20 * 8 + 1,
      y: 6 * 10,
      width: 18,
      height: 10,
    },
  },
  [BuildingId.Granary]: {
    name: 'Granary',
    cost: 60,
    maintenance: 1,
    requires: AdvanceId.Pottery,
    sprite: {
      asset: 'sp299.pic.png',
      x: 20 * 8 + 1,
      y: 7 * 10,
      width: 18,
      height: 10,
    },
  },
  [BuildingId.Temple]: {
    name: 'Temple',
    cost: 40,
    maintenance: 1,
    requires: AdvanceId.CeremonialBurial,
    applyHappiness: (state: GameState, city: City, happiness: Happiness) => {
      happiness.unhappy--;
    },
    sprite: {
      asset: 'sp299.pic.png',
      x: 20 * 8 + 1,
      y: 8 * 10,
      width: 18,
      height: 10,
    },
  },
  [BuildingId.Marketplace]: {
    name: 'Marketplace',
    cost: 80,
    maintenance: 1,
    requires: AdvanceId.Currency,
    applyCityYield: (cityYield: CityYield) => {
      cityYield.luxury = Math.floor(cityYield.luxury * 1.5);
      cityYield.gold = Math.floor(cityYield.gold * 1.5);
    },
    sprite: {
      asset: 'sp299.pic.png',
      x: 20 * 8 + 1,
      y: 9 * 10,
      width: 18,
      height: 10,
    },
  },
};
