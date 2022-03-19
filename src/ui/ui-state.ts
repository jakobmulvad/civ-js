import { GameState } from '../logic/game-state';
import { City } from '../logic/city';

export type UiState = {
  gameState: GameState;
  localPlayer: number;
  isBlinking: boolean;
  selectedCity: City | undefined;
};

let uiState: UiState = {
  gameState: {} as GameState,
  selectedCity: undefined,
  isBlinking: false,
  localPlayer: 0,
};

export const initUi = (gameState: GameState, localPlayer: number) => {
  uiState = {
    gameState,
    selectedCity: undefined,
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
