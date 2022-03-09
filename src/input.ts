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
};
