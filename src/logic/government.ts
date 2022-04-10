export enum GovernmentId {
  Anarchy = 'anarchy',
  Despotism = 'despotism',
  Monarchy = 'monarchy',
  Republic = 'republic',
  Communism = 'communism',
  Democracy = 'democracy',
}

export type Government = {
  name: string;
  nameAdjective: string;
};

export const governments: Record<GovernmentId, Government> = {
  [GovernmentId.Anarchy]: {
    name: 'Anarchy',
    nameAdjective: 'Anarchist',
  },
  [GovernmentId.Despotism]: {
    name: 'Despotism',
    nameAdjective: 'Despot',
  },
  [GovernmentId.Monarchy]: {
    name: 'Monarchy',
    nameAdjective: 'Monarch',
  },
  [GovernmentId.Republic]: {
    name: 'Republic',
    nameAdjective: 'Republican',
  },
  [GovernmentId.Communism]: {
    name: 'Communism',
    nameAdjective: 'Communist',
  },
  [GovernmentId.Democracy]: {
    name: 'Democracy',
    nameAdjective: 'Democrat',
  },
};
