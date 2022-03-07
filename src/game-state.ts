import { GameMap, getTileAt } from './map';
import { Unit, unitPrototypeMap } from './unit';

export enum PlayerType {
  Human = 0,
  Computer = 1,
}

export type PlayerState = {
  color: [number, number, number];
  name: string;
  map: GameMap;
  units: Unit[];
  type: PlayerType;
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

export const getPrototype = (unit: Unit) => unitPrototypeMap[unit.prototypeId];

export const getTileAtUnit = (state: GameState, unit: Unit) => getTileAt(state.masterMap, unit.x, unit.y);
