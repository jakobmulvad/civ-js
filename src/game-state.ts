import { GameMap } from "./map";
import { UnitState } from "./unit";

export enum PlayerType {
  Human = 0,
  Computer = 1,
}

export type PlayerState = {
  color: string;
  name: string;
  map: GameMap;
  units: UnitState[];
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
