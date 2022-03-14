import { UiEvent } from './ui/ui-event-queue';

export const inputMappingWorldView: Record<string, UiEvent | undefined> = {
  ArrowUp: UiEvent.UnitMoveNorth,
  ArrowRight: UiEvent.UnitMoveEast,
  ArrowDown: UiEvent.UnitMoveSouth,
  ArrowLeft: UiEvent.UnitMoveWest,
  Numpad8: UiEvent.UnitMoveNorth,
  Numpad9: UiEvent.UnitMoveNorthEast,
  Numpad6: UiEvent.UnitMoveEast,
  Numpad3: UiEvent.UnitMoveSouthEast,
  Numpad2: UiEvent.UnitMoveSouth,
  Numpad1: UiEvent.UnitMoveSouthWest,
  Numpad4: UiEvent.UnitMoveWest,
  Numpad7: UiEvent.UnitMoveNorthWest,
  Space: UiEvent.UnitNoOrders,
  NumpadEnter: UiEvent.EndTurn,
  KeyW: UiEvent.UnitWait,
  KeyC: UiEvent.UnitCenter,
  Enter: UiEvent.EndTurn,
  KeyR: UiEvent.UnitBuildRoad,
  KeyI: UiEvent.UnitBuildIrrigationOrClear,
  KeyM: UiEvent.UnitBuildMine,
  KeyF: UiEvent.UnitFortifyOrBuildFortress,
};

export const unitMoveDirection = {
  [UiEvent.UnitMoveNorth]: [0, -1],
  [UiEvent.UnitMoveNorthEast]: [1, -1],
  [UiEvent.UnitMoveEast]: [1, 0],
  [UiEvent.UnitMoveSouthEast]: [1, 1],
  [UiEvent.UnitMoveSouth]: [0, 1],
  [UiEvent.UnitMoveSouthWest]: [-1, 1],
  [UiEvent.UnitMoveWest]: [-1, 0],
  [UiEvent.UnitMoveNorthWest]: [-1, -1],
};
