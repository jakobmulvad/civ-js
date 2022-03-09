import { Civilization } from './civilizations';
import { GameMap, getTileAt } from './map';
import { Unit, unitPrototypeMap } from './units';

export enum PlayerController {
  Human = 0,
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

export const getSelectedUnit = (state: GameState): Unit | undefined => {
  const player = getPlayerInTurn(state);
  return player.units[player.selectedUnit];
};

export const getSelectedUnitForPlayer = (state: GameState, player: number): Unit | undefined => {
  const playerState = state.players[player];
  return playerState.units[playerState.selectedUnit];
};

export const getPrototype = (unit: Unit) => unitPrototypeMap[unit.prototypeId];

export const getTileAtUnit = (state: GameState, unit: Unit) => getTileAt(state.masterMap, unit.x, unit.y);
