export enum GameAction {
  MoveUnitNorth = "MoveUnitNorth",
  MoveUnitNorthEast = "MoveUnitNorthEast",
  MoveUnitEast = "MoveUnitEast",
  MoveUnitSouthEast = "MoveUnitSouthEast",
  MoveUnitSouth = "MoveUnitSouth",
  MoveUnitSouthWest = "MoveUnitSouthWest",
  MoveUnitWest = "MoveUnitWest",
  MoveUnitNorthWest = "MoveUnitNorthWest",
}

export const keyboardMapping: Record<string, GameAction | undefined> = {
  ArrowUp: GameAction.MoveUnitNorth,
  ArrowRight: GameAction.MoveUnitEast,
  ArrowDown: GameAction.MoveUnitSouth,
  ArrowLeft: GameAction.MoveUnitWest,
  Numpad8: GameAction.MoveUnitNorth,
  Numpad9: GameAction.MoveUnitNorthEast,
  Numpad6: GameAction.MoveUnitEast,
  Numpad3: GameAction.MoveUnitSouthEast,
  Numpad2: GameAction.MoveUnitSouth,
  Numpad1: GameAction.MoveUnitSouthWest,
  Numpad4: GameAction.MoveUnitWest,
  Numpad7: GameAction.MoveUnitNorthWest,
};
