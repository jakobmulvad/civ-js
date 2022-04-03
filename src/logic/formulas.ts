import { clamp } from '../helpers';
import { Terrain } from './map';
import { Unit, unitPrototypeMap, UnitState, UnitType } from './units';

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

// source: https://forums.civfanatics.com/threads/civ1-combat-mechanics-explained.492843/
export const attackStrength = (unit: Unit) => {
  const prototype = unitPrototypeMap[unit.prototypeId];
  let attack = prototype.attack * 8;

  if (unit.isVeteran) {
    attack *= 1.5;
  }

  return attack * Math.min(1, unit.movesLeft / 3);
};

export const defenseStrength = (unit: Unit, terrain: Terrain, applyCitywalls: boolean) => {
  const prototype = unitPrototypeMap[unit.prototypeId];

  // Step 1
  let defense = prototype.defense * 2;

  if (prototype.type === UnitType.Land) {
    // Step 2
    defense *= terrain.defensiveFactor ?? 1;

    // Step 3 & 5
    // todo: check for fortress
    if (applyCitywalls) {
      defense *= 12;
    } else if (unit.state === UnitState.Fortified) {
      defense *= 6;
    } else {
      defense *= 4;
    }
  } else {
    // Step 4
    defense *= 8;
  }

  if (unit.isVeteran) {
    defense *= 1.5;
  }

  return defense;
};

export const convertTradeToYield = (
  luxuryRate: number,
  taxRate: number,
  trade: number
): {
  luxury: number;
  gold: number;
  beakers: number;
} => {
  const luxury = Math.round(luxuryRate * trade * 0.1);
  const luxuryAndGold = Math.round((luxuryRate + taxRate) * trade * 0.1);
  return {
    luxury,
    gold: luxuryAndGold - luxury,
    beakers: trade - luxuryAndGold,
  };
};
