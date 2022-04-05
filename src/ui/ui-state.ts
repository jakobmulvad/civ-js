import { GameState } from '../logic/game-state';
import { City } from '../logic/city';

export type UiState = {
  gameState: GameState;
  selectedCity: City | undefined;
  localPlayer: number;
  isBlinking: boolean;
};

let uiState: UiState = {
  gameState: {} as GameState,
  selectedCity: undefined,
  isBlinking: false,
  localPlayer: 0,
};

export const initUi = (gameState: GameState, localPlayer: number) => {
  uiState = {
    ...uiState,
    gameState,
    localPlayer,
  };
};

export const updateUiState = <K extends keyof UiState>(key: K, value: UiState[K]): boolean => {
  const oldValue = uiState[key];
  uiState[key] = value;
  return oldValue !== value;
};

export const getUiState = () => uiState;
