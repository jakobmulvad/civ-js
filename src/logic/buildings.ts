import { Sprite } from '../assets';

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
  sprite: Sprite;
};

export const buildings: Record<BuildingId, Building> = {
  [BuildingId.Palace]: {
    name: 'Palace',
    cost: 200,
    maintenance: 0,
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
    maintenance: 0,
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
    sprite: {
      asset: 'sp299.pic.png',
      x: 20 * 8 + 1,
      y: 9 * 10,
      width: 18,
      height: 10,
    },
  },
};
