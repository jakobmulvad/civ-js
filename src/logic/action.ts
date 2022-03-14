export type ActionWithPlayer = {
  player: number;
};

export type ActionWithUnit = {
  unit: number;
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
    | 'UnitFortify';
} & ActionWithUnit;

export type UnitActionMove = {
  type: 'UnitMove';
  dx: number;
  dy: number;
} & ActionWithUnit;

export type Action = PlayerAction | UnitAction | UnitActionMove;
