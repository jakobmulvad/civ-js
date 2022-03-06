import { GameMap } from './map';
import { Unit } from './unit';

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
};

export type GameState = {
  seed: number;
  playerInTurn: number;
  players: PlayerState[];
  masterMap: GameMap;
  turn: number;
};
