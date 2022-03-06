export type ActionUnitMove = {
  type: "UnitMove";
  player: number;
  unit: number;
  dx: number;
  dy: number;
};

export type ActionUnitWait = {
  type: "UnitWait";
  player: number;
  unit: number;
};

export type ActionUnitNoOrders = {
  type: "UnitNoOrders";
  player: number;
  unit: number;
};

export type ActionUnitCenter = {
  type: "UnitCenter";
  player: number;
  unit: number;
};

export type ActionEndTurn = {
  type: "EndTurn";
  player: number;
};

export type Action = ActionUnitMove | ActionUnitWait | ActionUnitNoOrders | ActionEndTurn;

const queue: Action[] = [];

export const pushAction = (action: Action) => {
  queue.push(action);
};

export const popAction = () => {
  return queue.pop();
};
