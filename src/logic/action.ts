export type ActionWithPlayer = {
  player: number;
};

export type ActionWithUnit = {
  unit: number;
} & ActionWithPlayer;

export type PlayerAction = {
  type: 'EndTurn';
} & ActionWithPlayer;

export type UnitAction<T = 'UnitWait' | 'UnitNoOrders'> = {
  type: T;
} & ActionWithUnit;

export type UnitActionMove = {
  type: 'UnitMove';
  dx: number;
  dy: number;
} & ActionWithUnit;

export type Action = PlayerAction | UnitAction | UnitActionMove;
