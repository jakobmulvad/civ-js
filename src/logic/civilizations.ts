import { palette } from '../palette';

export type Civilization = {
  name: string;
  namePlural: string;
  leader: string;
  primaryColor: [number, number, number];
  secondaryColor: [number, number, number];
  cityNames: string[];
};

export const americans: Civilization = {
  name: 'American',
  namePlural: 'Americans',
  leader: 'Abe Lincoln',
  primaryColor: palette.cyan,
  secondaryColor: palette.cyanDark,
  cityNames: [
    'Washington',
    'New York',
    'Boston',
    'Philadelphia',
    'Atlanta',
    'Chicago',
    'Buffalo',
    'St. Louis',
    'Detroit',
    'New Orleans',
    'Baltimore',
    'Denver',
    'Cincinnati',
    'Dallas',
    'Los Angeles',
    'Las Vegas',
  ],
};

export const egyptians: Civilization = {
  name: 'Egyptian',
  namePlural: 'Egyptians',
  leader: 'Ramesses',
  primaryColor: palette.yellow,
  secondaryColor: palette.green,
  cityNames: [
    'Thebes',
    'Memphis',
    'Oryx',
    'Heliopolis',
    'Gaza',
    'Alexandria',
    'Byblos',
    'Cairo',
    'Coptos',
    'Edfu',
    'Pithom',
    'Busirus',
    'Athribus',
    'Mendes',
    'Tanis',
    'Abydos',
  ],
};
