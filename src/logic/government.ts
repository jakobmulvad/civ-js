export enum GovernmentId {
  Anarchy = 'anarchy',
  Despotism = 'despotism',
  Monarchy = 'monarchy',
  Communism = 'communism',
  Republic = 'republic',
  Democracy = 'democracy',
}

export type Government = {
  name: string;
  nameAdjective: string;
  corruptionCoefficient: number;
  empireHappynessCoefficient: number;
};

export const governments: Record<GovernmentId, Government> = {
  [GovernmentId.Anarchy]: {
    name: 'Anarchy',
    nameAdjective: 'Anarchist',
    corruptionCoefficient: 3 / 8,
    empireHappynessCoefficient: 1,
  },
  [GovernmentId.Despotism]: {
    name: 'Despotism',
    nameAdjective: 'Despot',
    corruptionCoefficient: 3 / 10,
    empireHappynessCoefficient: 1,
  },
  [GovernmentId.Monarchy]: {
    name: 'Monarchy',
    nameAdjective: 'Monarch',
    corruptionCoefficient: 3 / 12,
    empireHappynessCoefficient: 1.5,
  },
  [GovernmentId.Communism]: {
    name: 'Communism',
    nameAdjective: 'Communist',
    corruptionCoefficient: 3 / 14,
    empireHappynessCoefficient: 1.5,
  },
  [GovernmentId.Republic]: {
    name: 'Republic',
    nameAdjective: 'Republican',
    corruptionCoefficient: 3 / 16,
    empireHappynessCoefficient: 2,
  },
  [GovernmentId.Democracy]: {
    name: 'Democracy',
    nameAdjective: 'Democrat',
    corruptionCoefficient: 0,
    empireHappynessCoefficient: 2,
  },
};
