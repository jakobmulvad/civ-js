export enum UiInput {
  UnitMoveNorth = "UnitMoveNorth",
  UnitMoveNorthEast = "UnitMoveNorthEast",
  UnitMoveEast = "UnitMoveEast",
  UnitMoveSouthEast = "UnitMoveSouthEast",
  UnitMoveSouth = "UnitMoveSouth",
  UnitMoveSouthWest = "UnitMoveSouthWest",
  UnitMoveWest = "UnitMoveWest",
  UnitMoveNorthWest = "UnitMoveNorthWest",
  UnitNoOrders = "UnitNoOrders",
  UnitWait = "UnitWait",
  UnitCenter = "UnitCenter",
  EndTurn = "EndTurn",
}

export const inputMapping: Record<string, UiInput | undefined> = {
  ArrowUp: UiInput.UnitMoveNorth,
  ArrowRight: UiInput.UnitMoveEast,
  ArrowDown: UiInput.UnitMoveSouth,
  ArrowLeft: UiInput.UnitMoveWest,
  Numpad8: UiInput.UnitMoveNorth,
  Numpad9: UiInput.UnitMoveNorthEast,
  Numpad6: UiInput.UnitMoveEast,
  Numpad3: UiInput.UnitMoveSouthEast,
  Numpad2: UiInput.UnitMoveSouth,
  Numpad1: UiInput.UnitMoveSouthWest,
  Numpad4: UiInput.UnitMoveWest,
  Numpad7: UiInput.UnitMoveNorthWest,
  Space: UiInput.UnitNoOrders,
  NumpadEnter: UiInput.EndTurn,
  KeyW: UiInput.UnitWait,
  KeyC: UiInput.UnitCenter,
  Enter: UiInput.EndTurn,
};
