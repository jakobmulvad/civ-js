import { UnitPrototypeId } from './units';

export type ActionWithPlayer = {
  player: number;
};

export type ActionWithUnit = {
  unit: number;
} & ActionWithPlayer;

export type ActionWithCity = {
  city: number;
} & ActionWithPlayer;

export type PlayerAction = {
  type: 'EndTurn';
} & ActionWithPlayer;

export type UnitAction = {
  type:
    | 'UnitWait'
    | 'UnitNoOrders'
    | 'UnitBuildRoad'
    | 'UnitBuildIrrigation'
    | 'UnitBuildMine'
    | 'UnitClear'
    | 'UnitFortify'
    | 'UnitBuildOrJoinCity';
} & ActionWithUnit;

export type UnitActionMove = {
  type: 'UnitMove';
  dx: number;
  dy: number;
} & ActionWithUnit;

export type CityTileAction = {
  type: 'CityToggleTileWorker';
  tile: number;
} & ActionWithCity;

export type CityProductionAction = {
  type: 'CitySelectProduction';
  newProduction: UnitPrototypeId;
} & ActionWithCity;

export type CityAction = CityTileAction | CityProductionAction;

export type Action = PlayerAction | UnitAction | UnitActionMove | CityAction;
