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
  controller: PlayerController;
  selectedUnit: number | undefined;
  gold: number;
  beakers: number;
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

export const getTileAtUnit = (state: GameState, unit: Unit) => getTileAt(state.masterMap, unit.x, unit.y);

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
