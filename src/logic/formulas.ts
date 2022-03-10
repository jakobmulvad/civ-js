import { clamp } from '../helpers';

// source: https://forums.civfanatics.com/threads/years-per-turn.625286/
export const turnToYear = (turn: number) => {
  if (turn === 200) {
    return '1 AD'; // special case
  }

  const year =
    -4000 +
    Math.min(turn, 250) * 20 +
    clamp(0, turn - 250, 50) * 10 +
    clamp(0, turn - 300, 50) * 5 +
    clamp(0, turn - 350, 50) * 2 +
    Math.max(0, turn - 400);

  return `${Math.abs(year)} ${year > 0 ? 'AD' : 'BC'}`;
};

// source: https://forums.civfanatics.com/threads/demographics-in-civ-1.517012/
export const cityPopulation = (size: number) => {
  return ((size * (size + 1)) / 2) * 10_000;
};
