import { Building } from './buildings';
import { City, CityProduction } from './city';
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
    | 'CityCannotChangeProductionAfterBuy'
    | 'GovernmentIntact'
    | 'StillRevolting'
    | 'InvalidRate';
};

export type StartTurnResultEvent =
  | { type: 'EstablishGovernment' }
  | {
      type: 'PopulationDecrease' | 'CivilDisorder' | 'OrderRestored' | 'ZoomToCity';
      city: City;
    }
  | {
      type: 'CityCompletedProduction';
      production: CityProduction;
      city: City;
    }
  | {
      type: 'CantMaintainBuilding';
      city: City;
      building: Building;
    }
  | {
      type: 'CannotSupportUnit';
      unit: Unit;
      city: City;
    };

export type StartTurnResult = {
  type: 'StartTurn';
  events: StartTurnResultEvent[];
};

export type ActionResult =
  | UnitMoveResult
  | UnitCombatResult
  | ActionFailedResult
  | UnitCityBuiltResult
  | StartTurnResult
  | void;
