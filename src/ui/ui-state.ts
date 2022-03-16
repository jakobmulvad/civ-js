import { GameState } from '../logic/game-state';

export type UiState = {
  gameState: GameState;
  localPlayer: number;
  isBlinking: boolean;
};

let uiState: UiState = {
  gameState: {} as GameState,
  isBlinking: false,
  localPlayer: 0,
};

export const initUi = (gameState: GameState, localPlayer: number) => {
  uiState = {
    gameState,
    localPlayer,
    isBlinking: false,
  };
};

export const updateUiState = <K extends keyof UiState>(key: K, value: UiState[K]): boolean => {
  const oldValue = uiState[key];
  uiState[key] = value;
  return oldValue !== value;
};

export const getUiState = () => uiState;
