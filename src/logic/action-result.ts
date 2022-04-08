import { City } from './city';
import { Unit } from './units';

export type UnitMoveResult = {
  type: 'UnitMoved';
  unit: Unit;
  dx: number;
  dy: number;
};

export type UnitCombatResult = {
  type: 'Combat';
  dx: number;
  dy: number;
  attacker: Unit;
  defender: Unit;
  winner: 'Attacker' | 'Defender';
};

export type UnitCityBuiltResult = {
  type: 'CityBuilt';
  city: City;
};

export type ActionFailedResult = {
  type: 'ActionFailed';
  reason:
    | 'MissingWaterSupply'
    | 'UnitNotBuilder'
    | 'NotEnoughGold'
    | 'CityAllreadySold'
    | 'CityCannotChangeProductionAfterBuy';
};

export type ActionResult = UnitMoveResult | UnitCombatResult | ActionFailedResult | UnitCityBuiltResult | void;
