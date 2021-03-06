import { BuildingId } from './buildings';
import { CityProduction } from './city';
import { GovernmentId } from './government';

export type ActionWithPlayer = {
  player: number;
};

export type ActionWithUnit = {
  unit: number;
} & ActionWithPlayer;

export type ActionWithCity = {
  city: number;
} & ActionWithPlayer;

export type GovernmentAction = {
  type: 'EstablishGovernment';
  government: GovernmentId;
} & ActionWithPlayer;

export type RateAction = {
  type: 'SetTaxRate' | 'SetLuxuryRate';
  rate: number;
} & ActionWithPlayer;

export type PlayerAction = {
  type: 'EndTurn' | 'Revolution';
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
    | 'UnitBuildOrJoinCity'
    | 'UnitDisband'
    | 'UnitWake';
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

export type CityChangeProductionAction = {
  type: 'CityChangeProduction';
  production: CityProduction;
} & ActionWithCity;

export type CitySellAction = {
  type: 'CitySell';
  building: BuildingId;
} & ActionWithCity;

export type CityAction =
  | ({ type: 'CityBuy' } & ActionWithCity)
  | CityTileAction
  | CityChangeProductionAction
  | CitySellAction;

export type Action = PlayerAction | UnitAction | UnitActionMove | CityAction | GovernmentAction | RateAction;
