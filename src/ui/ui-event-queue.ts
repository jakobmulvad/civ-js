export enum UiEvent {
  UnitMoveNorth = 'UnitMoveNorth',
  UnitMoveNorthEast = 'UnitMoveNorthEast',
  UnitMoveEast = 'UnitMoveEast',
  UnitMoveSouthEast = 'UnitMoveSouthEast',
  UnitMoveSouth = 'UnitMoveSouth',
  UnitMoveSouthWest = 'UnitMoveSouthWest',
  UnitMoveWest = 'UnitMoveWest',
  UnitMoveNorthWest = 'UnitMoveNorthWest',
  UnitNoOrders = 'UnitNoOrders',
  UnitWait = 'UnitWait',
  UnitCenter = 'UnitCenter',
  EndTurn = 'EndTurn',
}

const eventQueue: UiEvent[] = [];

export const pushUiEvent = (event: UiEvent) => eventQueue.push(event);
export const popUiEvent = () => eventQueue.pop();
export const clearUiEventQueue = () => eventQueue.slice(0, 0);
