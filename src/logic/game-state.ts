import { City } from './city';
import { Civilization } from './civilizations';
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
};

export type GameState = {
  seed: number;
  playerInTurn: number;
  players: PlayerState[];
  masterMap: GameMap;
  turn: number;
};

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
  return unit.home === undefined ? undefined : state.players[unit.owner].cities[unit.home];
};
export const homeCityName = (state: GameState, unit: Unit): string => {
  return homeCity(state, unit)?.name ?? 'NONE';
};
