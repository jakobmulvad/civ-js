import { City, cityUnits } from './city';
import { Civilization } from './civilizations';
import { Difficulty } from './diffculty';
import { GovernmentId } from './government';
import { GameMap, getTileAt } from './map';
import { Unit, unitPrototypeMap } from './units';

export enum PlayerController {
  LocalHuman = 0,
  Computer = 1,
  Remote = 2, // todo LOL
}

export type PlayerState = {
  civ: Civilization;
  map: GameMap;
  units: Unit[];
  cities: City[];
  controller: PlayerController;
  selectedUnit: number | undefined;
  gold: number;
  beakers: number;
  taxRate: number; // 0...10
  luxuryRate: number; // 0...10
  government: GovernmentId;
};

export type GameState = {
  seed: number;
  playerInTurn: number;
  players: PlayerState[];
  masterMap: GameMap;
  turn: number;
  difficulty: Difficulty;
};

export type UnitSupply = { food: number; shields: number; unhappy: number };

export const getPlayerInTurn = (state: GameState) => state.players[state.playerInTurn];

export const getSelectedUnitForPlayer = (state: GameState, player: number): Unit | undefined => {
  const playerState = state.players[player];
  return playerState.selectedUnit === undefined ? undefined : playerState.units[playerState.selectedUnit];
};

export const getSelectedUnit = (state: GameState): Unit | undefined => {
  return getSelectedUnitForPlayer(state, state.playerInTurn);
};

export const getPrototype = (unit: Unit) => unitPrototypeMap[unit.prototypeId];

export const getTileAtUnit = (map: GameMap, unit: Unit) => getTileAt(map, unit.x, unit.y);

export const getPlayersUnitsAt = (state: GameState, player: number, x: number, y: number): Unit[] => {
  const result: Unit[] = [];
  const units = state.players[player].units;
  for (const unit of units) {
    if (unit.x === x && unit.y === y) {
      result.push(unit);
    }
  }
  return result;
};

export const removeUnitFromGame = (state: GameState, unit: Unit) => {
  for (const player of state.players) {
    const idx = player.units.indexOf(unit);

    if (idx !== -1) {
      player.units.splice(idx, 1);
      if (player.selectedUnit === idx) {
        player.selectedUnit = undefined;
      }
      return;
    }
  }
};

export const moveUnitToTopOfStack = (state: GameState, unit: Unit) => {
  for (const player of state.players) {
    const idx = player.units.indexOf(unit);

    if (idx !== -1) {
      player.units.splice(idx, 1);
      player.units.push(unit);
      return;
    }
  }
};

export const getIndexOfUnitOwner = (state: GameState, unit: Unit): number | undefined => {
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i].units.includes(unit)) {
      return i;
    }
  }
};

export const getUnitsAt = (state: GameState, x: number, y: number, exclude?: Unit | undefined): Unit[] => {
  const result: Unit[] = [];
  for (const player of state.players) {
    for (const unit of player.units) {
      if (unit.x === x && unit.y === y && unit !== exclude) {
        result.push(unit);
      }
    }
    if (result.length) {
      continue; // Units of different players cannot occupy same tile
    }
  }
  return result;
};

export const unitIndex = (state: GameState, unit: Unit): number => {
  return state.players[unit.owner].units.indexOf(unit);
};

export const homeCity = (state: GameState, unit: Unit): City | undefined => {
  return unit.homeCity === undefined ? undefined : state.players[unit.owner].cities[unit.homeCity];
};
export const homeCityName = (state: GameState, unit: Unit): string => {
  return homeCity(state, unit)?.name ?? 'NONE';
};

export const unitSupply = (state: GameState, unit: Unit): UnitSupply => {
  const { government } = state.players[unit.owner];
  const result = {
    food: 0,
    shields: 0,
    unhappy: 0,
  };

  if (unit.homeCity === undefined) {
    return result;
  }
  const homeCity = state.players[unit.owner].cities[unit.homeCity];
  const proto = unitPrototypeMap[unit.prototypeId];

  // Civilians are free
  if (!proto.isBuilder && proto.isCivil) {
    return result;
  }

  // Food
  if (proto.isBuilder) {
    result.food = government === GovernmentId.Republic || government === GovernmentId.Democracy ? 2 : 1;
  }

  // Shields
  if (government === GovernmentId.Anarchy || government === GovernmentId.Despotism) {
    const units = cityUnits(state, homeCity);
    const unitIndex = units.indexOf(unit);
    result.shields = unitIndex + 1 > homeCity.size ? 1 : 0;
  } else {
    result.shields = 1;
  }

  // Unhappy
  // TODO: Account for womens suffrage
  if (unit.x !== homeCity.x || unit.y !== homeCity.y) {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (government) {
      case GovernmentId.Republic:
        result.unhappy = 1;
        break;
      case GovernmentId.Democracy:
        result.unhappy = 2;
        break;
    }
  }

  return result;
};

export const totalCitySupply = (state: GameState, city: City): UnitSupply => {
  return cityUnits(state, city)
    .map((unit) => unitSupply(state, unit))
    .reduce(
      (acc, val) => {
        acc.food += val.food;
        acc.shields += val.shields;
        acc.unhappy += val.unhappy;
        return acc;
      },
      {
        food: 0,
        shields: 0,
        unhappy: 0,
      }
    );
};
